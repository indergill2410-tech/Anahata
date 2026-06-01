#!/usr/bin/env node
/**
 * Downloads all tracks from YouTube as MP3 and uploads to Cloudflare R2.
 *
 * Prerequisites (run once):
 *   pip install yt-dlp
 *   brew install ffmpeg   (macOS)
 *   -- or on Windows: winget install yt-dlp ffmpeg
 *
 * Usage:
 *   node scripts/upload-to-r2.js
 *
 * Env vars required (copy from your .env or set inline):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_NAME, R2_PUBLIC_URL
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { S3Client, PutObjectCommand, HeadObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'anahata-tracks';
const PUBLIC_URL = process.env.R2_PUBLIC_URL;
const TMP_DIR = path.join(os.tmpdir(), 'anahata-downloads');

fs.mkdirSync(TMP_DIR, { recursive: true });

const tracks = [
  // Morning Ragas
  { id: 'rp-01', title: 'Raga Bhairav', artist: 'Pandit Hariprasad Chaurasia', ytId: 'f_yNQSb-EtM' },
  { id: 'rp-02', title: 'Raga Lalit', artist: 'Ustad Vilayat Khan', ytId: 'uQQL6UqgFT8' },
  { id: 'rp-03', title: 'Raga Ahir Bhairav', artist: 'Hariprasad Chaurasia', ytId: '1ZYbU82GVz4' },
  { id: 'rp-04', title: 'Raga Ramkali', artist: 'Amjad Ali Khan', ytId: 'tQG2bpUvQr8' },
  { id: 'rp-05', title: 'Raga Todi', artist: 'Pandit Shivkumar Sharma', ytId: 'SvW3mRMxJJg' },
  { id: 'rp-06', title: 'Raga Jaunpuri', artist: 'Kishori Amonkar', ytId: '3EGTvOnIcGk' },
  { id: 'rp-07', title: 'Raga Asavari', artist: 'Ustad Rashid Khan', ytId: 'N_mEKJ4-UAI' },
  { id: 'rp-08', title: 'Raga Gunakali', artist: 'Bismillah Khan', ytId: 'k6JW1Sm2hRc' },
  { id: 'rp-09', title: 'Raga Komal Rishabh Asavari', artist: 'Ravi Shankar', ytId: 'r0bYhQ3SLAE' },
  { id: 'rp-10', title: 'Raga Desi', artist: 'Pandit Ravi Shankar', ytId: 'LXL-hLuStOE' },
  // Evening Ragas
  { id: 'rs-01', title: 'Raga Yaman', artist: 'Ustad Rashid Khan', ytId: 'gJGNg8aPgdU' },
  { id: 'rs-02', title: 'Raga Bhupali', artist: 'Pandit Ravi Shankar', ytId: 'E6I0bsMCTbU' },
  { id: 'rs-03', title: 'Raga Marwa', artist: 'Amjad Ali Khan', ytId: 'GkXNsj3UQXQ' },
  { id: 'rs-04', title: 'Raga Puriya Kalyan', artist: 'Shivkumar Sharma', ytId: 'g4mIDTEtqwI' },
  { id: 'rs-05', title: 'Raga Kedar', artist: 'Hariprasad Chaurasia', ytId: 'jLoMa1WyeCM' },
  { id: 'rs-06', title: 'Raga Hameer', artist: 'Vilayat Khan', ytId: 'WtHcEi4ZMXE' },
  { id: 'rs-07', title: 'Raga Shuddh Kalyan', artist: 'Pandit Jasraj', ytId: 'x3VnMFnF5QE' },
  { id: 'rs-08', title: 'Raga Bageshri', artist: 'Kishori Amonkar', ytId: 'hx-eXvbMbio' },
  { id: 'rs-09', title: 'Raga Kamod', artist: 'Ustad Zakir Hussain', ytId: 'Qm_xMkT9qeE' },
  { id: 'rs-10', title: 'Raga Bihag', artist: 'Pandit Bhimsen Joshi', ytId: 'YVvFBRRrDjM' },
  // Night Ragas
  { id: 'rr-01', title: 'Raga Darbari Kanada', artist: 'Ustad Rashid Khan', ytId: 'BVWTi_1M_sM' },
  { id: 'rr-02', title: 'Raga Malkauns', artist: 'Pandit Bhimsen Joshi', ytId: 'j3XZ8FVKWUA' },
  { id: 'rr-03', title: 'Raga Yaman Kalyan', artist: 'Ravi Shankar', ytId: 'HT2CRhp8vG8' },
  { id: 'rr-04', title: 'Raga Charukeshi', artist: 'Hariprasad Chaurasia', ytId: 'YaRmKk3_OQo' },
  { id: 'rr-05', title: 'Raga Chandrakauns', artist: 'Amjad Ali Khan', ytId: 'WZuWWNNMePQ' },
  { id: 'rr-06', title: 'Raga Kafi', artist: 'Ustad Vilayat Khan', ytId: 'RFCbMkRx8pY' },
  { id: 'rr-07', title: 'Raga Bageshri', artist: 'Pandit Shivkumar Sharma', ytId: 'p8eGWRaqnx4' },
  { id: 'rr-08', title: 'Raga Bhatiyar', artist: 'Pandit Jasraj', ytId: 'V5oItHYC_sQ' },
  { id: 'rr-09', title: 'Raga Tilak Kamod', artist: 'Rashid Khan', ytId: 'lMCsQovKFrY' },
];

// Pull remaining tracks from libraryData source dynamically
// (above list is a subset — the script reads all from the TS file via regex)
const libFile = path.join(__dirname, '../client/src/data/libraryData.ts');
const libContent = fs.readFileSync(libFile, 'utf8');
const trackRegex = /\{ id: '([^']+)', title: '([^']+)', artist: '([^']+)', duration: '[^']+', ytId: '([^']+)'/g;
const allTracks = [];
let m;
while ((m = trackRegex.exec(libContent)) !== null) {
  allTracks.push({ id: m[1], title: m[2], artist: m[3], ytId: m[4] });
}

console.log(`Found ${allTracks.length} tracks to process\n`);

async function alreadyUploaded(key) {
  try {
    await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function downloadAndUpload(track, index) {
  const key = `${track.id}.mp3`;
  const tmpFile = path.join(TMP_DIR, key);

  if (await alreadyUploaded(key)) {
    console.log(`[${index}/${allTracks.length}] SKIP  ${track.title} (already in R2)`);
    return `${PUBLIC_URL}/${key}`;
  }

  console.log(`[${index}/${allTracks.length}] DL    ${track.title} (${track.ytId})`);

  try {
    execSync(
      `yt-dlp -x --audio-format mp3 --audio-quality 128K -o "${tmpFile.replace('.mp3', '.%(ext)s')}" "https://www.youtube.com/watch?v=${track.ytId}"`,
      { stdio: 'inherit', timeout: 600_000 }
    );
  } catch (e) {
    console.error(`       FAILED download: ${e.message}`);
    return null;
  }

  if (!fs.existsSync(tmpFile)) {
    console.error(`       FAILED: file not found after download`);
    return null;
  }

  console.log(`       Uploading to R2...`);
  const fileSize = fs.statSync(tmpFile).size;
  const PART_SIZE = 10 * 1024 * 1024; // 10MB per part

  try {
    if (fileSize > PART_SIZE) {
      const { UploadId } = await R2.send(new CreateMultipartUploadCommand({
        Bucket: BUCKET, Key: key, ContentType: 'audio/mpeg',
        Metadata: { title: track.title.replace(/[^\x00-\x7F]/g, ''), artist: track.artist.replace(/[^\x00-\x7F]/g, '') },
      }));
      const parts = [];
      const fd = fs.openSync(tmpFile, 'r');
      let partNumber = 1;
      try {
        for (let offset = 0; offset < fileSize; offset += PART_SIZE) {
          const length = Math.min(PART_SIZE, fileSize - offset);
          const buf = Buffer.alloc(length);
          fs.readSync(fd, buf, 0, length, offset);
          const { ETag } = await R2.send(new UploadPartCommand({
            Bucket: BUCKET, Key: key, UploadId, PartNumber: partNumber, Body: buf,
          }));
          parts.push({ PartNumber: partNumber, ETag });
          process.stdout.write(`       Part ${partNumber} done\r`);
          partNumber++;
        }
      } catch (uploadError) {
        await R2.send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId }));
        throw uploadError;
      } finally {
        fs.closeSync(fd);
      }
      await R2.send(new CompleteMultipartUploadCommand({
        Bucket: BUCKET, Key: key, UploadId,
        MultipartUpload: { Parts: parts },
      }));
      console.log(`       All ${parts.length} parts uploaded`);
    } else {
      const body = fs.readFileSync(tmpFile);
      await R2.send(new PutObjectCommand({
        Bucket: BUCKET, Key: key, Body: body, ContentType: 'audio/mpeg',
        Metadata: { title: track.title.replace(/[^\x00-\x7F]/g, ''), artist: track.artist.replace(/[^\x00-\x7F]/g, '') },
      }));
    }
  } catch (uploadError) {
    console.error(`       FAILED upload: ${uploadError.message}`);
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    return null;
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
  const url = `${PUBLIC_URL}/${key}`;
  console.log(`       DONE  -> ${url}`);
  return url;
}

async function main() {
  const results = [];
  for (let i = 0; i < allTracks.length; i++) {
    const url = await downloadAndUpload(allTracks[i], i + 1);
    results.push({ ...allTracks[i], audioUrl: url });
  }

  const outFile = path.join(__dirname, 'track-urls.json');
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\nDone! URLs saved to ${outFile}`);
}

main().catch(console.error);
