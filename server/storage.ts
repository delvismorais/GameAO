import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getPool, hasDatabaseUrl } from './db';

/**
 * Armazenamento de ficheiros da GameAO.
 *
 * Existem dois backends possíveis:
 *  - Cloudflare R2 (quando as credenciais estão presentes);
 *  - PostgreSQL (tabela `media_blobs`), usado como fallback automático.
 *
 * O fallback garante que comprovativos e imagens administrativas continuam a
 * funcionar mesmo quando o R2 está mal configurado, esgotado ou indisponível.
 * Os URLs públicos são sempre servidos pela própria aplicação (`/media/...`),
 * pelo que nunca expiram e nunca ficam pendentes de uma assinatura temporária.
 */

export type MediaVisibility = 'public' | 'private';
export type StorageBackend = 'r2' | 'database';

const privateBucket = process.env.R2_BUCKET?.trim();
const publicBucket = process.env.R2_PUBLIC_BUCKET?.trim() || privateBucket;
const endpoint = process.env.R2_ENDPOINT?.trim()
  ?? (process.env.R2_ACCOUNT_ID?.trim() ? `https://${process.env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com` : undefined);
const client = endpoint && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
      forcePathStyle: true,
      maxAttempts: 2,
    })
  : null;

export function isStorageConfigured(): boolean { return Boolean(client && privateBucket); }
export function isPublicStorageConfigured(): boolean { return Boolean((client && publicBucket) || hasDatabaseUrl()); }
export function isPublicBaseUrlConfigured(): boolean { return Boolean(process.env.R2_PUBLIC_BASE_URL?.trim()); }

export function storageDiagnostics() {
  return {
    r2Credentials: Boolean(client),
    privateBucket: privateBucket ?? null,
    publicBucket: publicBucket ?? null,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL?.trim() ?? null,
    databaseFallback: hasDatabaseUrl(),
    mode: client ? 'r2-with-database-fallback' : 'database-only',
  };
}

function bucketFor(visibility: MediaVisibility): string {
  const bucket = visibility === 'private' ? privateBucket : publicBucket;
  if (!bucket) throw new Error('Armazenamento R2 não configurado.');
  return bucket;
}

/** URL público estável servido pela aplicação. */
export function publicObjectUrl(key: string): string | null {
  if (!key) return null;
  if (/^(https?:)?\/\//i.test(key) || key.startsWith('/')) return key;
  return `/media/${key.split('/').map(encodeURIComponent).join('/')}`;
}

/** URL privado (requer sessão de administrador). */
export function privateObjectUrl(key: string): string {
  return `/api/media/private/${key.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * Normaliza URLs de media guardados no conteúdo. Versões antigas da aplicação
 * gravavam URLs assinados do R2 (válidos 1 hora) diretamente em banners,
 * artigos e produtos. Esses URLs expiravam e deixavam imagens quebradas.
 */
export function stabilizeMediaUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const url = value.trim();
  if (!/^https?:\/\//i.test(url)) return url;
  const isR2 = /\.r2\.cloudflarestorage\.com/i.test(url) || /[?&]X-Amz-Signature=/i.test(url);
  if (!isR2) return url;
  try {
    const parsed = new URL(url);
    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    const bucket = parsed.pathname.split('/').filter(Boolean)[0];
    const objectKey = bucket && (bucket === privateBucket || bucket === publicBucket) ? key.split('/').slice(1).join('/') : key;
    return publicObjectUrl(objectKey) ?? url;
  } catch {
    return url;
  }
}

export function stabilizeMediaUrls<T>(input: T): T {
  if (typeof input === 'string') return stabilizeMediaUrl(input) as unknown as T;
  if (Array.isArray(input)) return input.map((item) => stabilizeMediaUrls(item)) as unknown as T;
  if (input && typeof input === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) output[key] = stabilizeMediaUrls(value);
    return output as T;
  }
  return input;
}

async function putInDatabase(key: string, body: Buffer, contentType: string, visibility: MediaVisibility): Promise<void> {
  if (!hasDatabaseUrl()) throw new Error('Sem armazenamento disponível para guardar o ficheiro.');
  const checksum = await import('node:crypto').then(({ createHash }) => createHash('sha256').update(body).digest('hex'));
  await getPool().execute(
    `INSERT INTO media_blobs (object_key, visibility, mime_type, size_bytes, checksum, data) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (object_key) DO UPDATE SET visibility = EXCLUDED.visibility, mime_type = EXCLUDED.mime_type, size_bytes = EXCLUDED.size_bytes, checksum = EXCLUDED.checksum, data = EXCLUDED.data`,
    [key, visibility, contentType, body.length, checksum, body],
  );
}

export async function putMediaObject(key: string, body: Buffer, contentType: string, visibility: MediaVisibility = 'public'): Promise<{ backend: StorageBackend; key: string }> {
  if (client) {
    try {
      await client.send(new PutObjectCommand({
        Bucket: bucketFor(visibility),
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: visibility === 'private' ? 'private, no-store' : 'public, max-age=31536000, immutable',
      }));
      return { backend: 'r2', key };
    } catch (error) {
      console.error(`[storage] R2 indisponível (${error instanceof Error ? error.message : 'erro'}); a usar base de dados para ${key}`);
    }
  }
  await putInDatabase(key, body, contentType, visibility);
  return { backend: 'database', key };
}

export interface StoredObject {
  body: Buffer;
  contentType: string;
  size: number;
  backend: StorageBackend;
}

async function readFromDatabase(key: string, visibility: MediaVisibility): Promise<StoredObject | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const [rows] = await getPool().execute<any[]>(`SELECT mime_type, size_bytes, data FROM media_blobs WHERE object_key = ? AND visibility = ? LIMIT 1`, [key, visibility]);
    const row = rows[0];
    if (!row) return null;
    const data = row.data as Buffer;
    return { body: data, contentType: String(row.mime_type || 'application/octet-stream'), size: data.length, backend: 'database' };
  } catch (error) {
    console.error('[storage] falha ao ler da base de dados', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function readMediaObject(key: string, visibility: MediaVisibility = 'public'): Promise<StoredObject | null> {
  const local = await readFromDatabase(key, visibility);
  if (local) return local;
  if (!client) return null;
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucketFor(visibility), Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    return { body, contentType: result.ContentType ?? 'application/octet-stream', size: body.length, backend: 'r2' };
  } catch {
    return null;
  }
}

export async function mediaObjectExists(key: string, visibility: MediaVisibility = 'public'): Promise<boolean> {
  if (hasDatabaseUrl()) {
    try {
      const [rows] = await getPool().execute<any[]>(`SELECT 1 FROM media_blobs WHERE object_key = ? AND visibility = ? LIMIT 1`, [key, visibility]);
      if (rows.length) return true;
    } catch { /* tabela pode ainda não existir */ }
  }
  if (!client) return false;
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucketFor(visibility), Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteMediaObject(key: string, visibility: MediaVisibility = 'public'): Promise<void> {
  if (hasDatabaseUrl()) {
    try { await getPool().execute(`DELETE FROM media_blobs WHERE object_key = ?`, [key]); } catch { /* ignora */ }
  }
  if (!client) return;
  try { await client.send(new DeleteObjectCommand({ Bucket: bucketFor(visibility), Key: key })); } catch { /* ignora */ }
}

export async function signedDownloadUrl(key: string, expiresIn = 600, isPrivate = false): Promise<string> {
  if (!client) throw new Error('Armazenamento R2 não configurado.');
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucketFor(isPrivate ? 'private' : 'public'), Key: key }), { expiresIn });
}

export async function createSignedUploadUrl(key: string, contentType: string, expiresIn = 600, isPrivate = false): Promise<string> {
  if (!client) throw new Error('Armazenamento R2 não configurado.');
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucketFor(isPrivate ? 'private' : 'public'), Key: key, ContentType: contentType }), { expiresIn });
}

// Compatibilidade com chamadas antigas.
export async function putObject(key: string, body: Buffer, contentType: string, isPrivate = false): Promise<void> {
  await putMediaObject(key, body, contentType, isPrivate ? 'private' : 'public');
}
export async function putPrivateObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await putMediaObject(key, body, contentType, 'private');
}
export async function getPrivateObjectUrl(key: string, _expiresIn = 600): Promise<string> {
  return privateObjectUrl(key);
}
export async function objectExists(key: string, isPrivate = false): Promise<boolean> {
  return mediaObjectExists(key, isPrivate ? 'private' : 'public');
}
export async function deleteObject(key: string, isPrivate = false): Promise<void> {
  await deleteMediaObject(key, isPrivate ? 'private' : 'public');
}
export async function deletePrivateObject(key: string): Promise<void> {
  await deleteMediaObject(key, 'private');
}
