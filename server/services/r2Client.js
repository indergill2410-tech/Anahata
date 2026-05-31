/**
 * Cloudflare R2 client (S3-compatible).
 *
 * Required env vars:
 *   R2_ACCOUNT_ID      — Cloudflare account ID
 *   R2_ACCESS_KEY_ID   — R2 API token access key
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *   R2_BUCKET          — bucket name (e.g. anahata-tracks)
 *   R2_PUBLIC_URL      — public bucket URL (e.g. https://tracks.yourdomain.com)
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const ACCOUNT_ID        = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID     = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET            = process.env.R2_BUCKET || 'anahata-tracks';
const PUBLIC_URL        = process.env.R2_PUBLIC_URL || '';

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.warn('[R2] WARNING: Cloudflare R2 env vars not set. Audio uploads will be unavailable.');
}

const client = ACCOUNT_ID ? new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
}) : null;

/**
 * Upload a Buffer or Stream to R2.
 * Returns the public URL of the uploaded file.
 */
async function uploadAudio({ key, body, contentType = 'audio/mpeg', metadata = {} }) {
  if (!client) throw new Error('R2 not configured');
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return getPublicUrl(key);
}

/**
 * Delete a file from R2 by key.
 */
async function deleteAudio(key) {
  if (!client) throw new Error('R2 not configured');
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Generate a presigned upload URL (for direct browser-to-R2 uploads).
 * Expires in 15 minutes.
 */
async function getUploadPresignedUrl(key, contentType = 'audio/mpeg') {
  if (!client) throw new Error('R2 not configured');
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(client, cmd, { expiresIn: 900 });
}

/**
 * Check if a key exists in R2.
 */
async function objectExists(key) {
  if (!client) return false;
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * List all keys under a prefix.
 */
async function listKeys(prefix = '') {
  if (!client) throw new Error('R2 not configured');
  const result = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
  return (result.Contents || []).map(obj => obj.Key);
}

/**
 * Build a public URL from an R2 object key.
 * Requires R2_PUBLIC_URL to be set (custom domain on bucket).
 */
function getPublicUrl(key) {
  if (!PUBLIC_URL) throw new Error('R2_PUBLIC_URL env var not set');
  return `${PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

module.exports = { uploadAudio, deleteAudio, getUploadPresignedUrl, objectExists, listKeys, getPublicUrl, BUCKET };
