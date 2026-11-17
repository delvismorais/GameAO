import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const privateBucket = process.env.R2_BUCKET?.trim();
const publicBucket = process.env.R2_PUBLIC_BUCKET?.trim() || privateBucket;
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

export function isStorageConfigured(): boolean { return Boolean(client && privateBucket); }
export function isPublicStorageConfigured(): boolean { return Boolean(client && publicBucket); }

function bucketFor(isPrivate: boolean): string {
  const bucket = isPrivate ? privateBucket : publicBucket;
  if (!bucket) throw new Error('Armazenamento R2 não configurado.');
  return bucket;
}

export function publicObjectUrl(key: string): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '');
  return base ? `${base}/${key.split('/').map(encodeURIComponent).join('/')}` : null;
}

export async function putPrivateObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (!client || !privateBucket) throw new Error('Armazenamento R2 não configurado.');
  await client.send(new PutObjectCommand({ Bucket: privateBucket, Key: key, Body: body, ContentType: contentType, CacheControl: 'private, no-store' }));
}

export async function putObject(key: string, body: Buffer, contentType: string, isPrivate = false): Promise<void> {
  if (!client) throw new Error('Armazenamento R2 não configurado.');
  await client.send(new PutObjectCommand({ Bucket: bucketFor(isPrivate), Key: key, Body: body, ContentType: contentType, CacheControl: isPrivate ? 'private, no-store' : 'public, max-age=31536000, immutable' }));
}

export async function getPrivateObjectUrl(key: string, expiresIn = 600): Promise<string> {
  return signedDownloadUrl(key, expiresIn, true);
}

export async function signedDownloadUrl(key: string, expiresIn = 600, isPrivate = false): Promise<string> {
  if (!client) throw new Error('Armazenamento R2 não configurado.');
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucketFor(isPrivate), Key: key }), { expiresIn });
}

export async function createSignedUploadUrl(key: string, contentType: string, expiresIn = 600, isPrivate = false): Promise<string> {
  if (!client) throw new Error('Armazenamento R2 não configurado.');
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucketFor(isPrivate), Key: key, ContentType: contentType }), { expiresIn });
}

export async function objectExists(key: string, isPrivate = false): Promise<boolean> {
  if (!client) return false;
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucketFor(isPrivate), Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteObject(key: string, isPrivate = false): Promise<void> {
  if (!client) return;
  await client.send(new DeleteObjectCommand({ Bucket: bucketFor(isPrivate), Key: key }));
}

export async function deletePrivateObject(key: string): Promise<void> {
  return deleteObject(key, true);
}
