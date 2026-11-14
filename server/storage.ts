import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.R2_BUCKET?.trim();
const endpoint = process.env.R2_ENDPOINT?.trim()
  ?? (process.env.R2_ACCOUNT_ID?.trim() ? `https://${process.env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com` : undefined);
const client = endpoint && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
      forcePathStyle: true,
    })
  : null;

export function isStorageConfigured(): boolean { return Boolean(client && bucket); }

export function publicObjectUrl(key: string): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '');
  return base ? `${base}/${key.split('/').map(encodeURIComponent).join('/')}` : null;
}

export async function putPrivateObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (!client || !bucket) throw new Error('Armazenamento R2 não configurado.');
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: 'private, no-store' }));
}

export async function getPrivateObjectUrl(key: string, expiresIn = 600): Promise<string> {
  if (!client || !bucket) throw new Error('Armazenamento R2 não configurado.');
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

export async function deletePrivateObject(key: string): Promise<void> {
  if (!client || !bucket) return;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
