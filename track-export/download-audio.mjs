#!/usr/bin/env node
/**
 * Anahata — Audio Downloader
 *
 * Downloads every real audio file referenced in the library catalogue
 * (the Cloudflare R2 URLs in library-tracks.json) to ./audio/<id>.mp3 so you
 * have the actual track files to re-host in a rebuilt app.
 *
 * Run this on YOUR machine (or any host with outbound internet). The R2 bucket
 * is public, so no credentials are needed.
 *
 * Usage:
 *   node track-export/download-audio.mjs            # download all
 *   node track-export/download-audio.mjs ./out      # custom output dir
 *
 * Requires Node 18+ (uses global fetch). No dependencies.
 * Re-running skips files already downloaded, so it is safe to resume.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] || path.join(__dirname, 'audio'));

const albums = JSON.parse(fs.readFileSync(path.join(__dirname, 'library-tracks.json'), 'utf8'));

const jobs = [];
for (const album of albums) {
  for (const tr of album.tracks || []) {
    if (tr.audioUrl) jobs.push({ id: tr.id, title: tr.title, url: tr.audioUrl });
  }
}

fs.mkdirSync(outDir, { recursive: true });
console.log(`Downloading ${jobs.length} audio files -> ${outDir}\n`);

let ok = 0;
let skipped = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < jobs.length; i++) {
  const { id, title, url } = jobs[i];
  const ext = path.extname(new URL(url).pathname) || '.mp3';
  const dest = path.join(outDir, `${id}${ext}`);
  const tag = `[${i + 1}/${jobs.length}]`;

  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    console.log(`${tag} SKIP  ${id}  (${title})`);
    skipped++;
    continue;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const tmp = `${dest}.part`;
    await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
    fs.renameSync(tmp, dest);
    const mb = (fs.statSync(dest).size / 1048576).toFixed(1);
    console.log(`${tag} OK    ${id}  ${mb} MB  (${title})`);
    ok++;
  } catch (err) {
    console.error(`${tag} FAIL  ${id}  ${err.message}  (${title})`);
    failed++;
    failures.push({ id, url, error: err.message });
  }
}

console.log(`\nDone. downloaded ${ok}, skipped ${skipped}, failed ${failed}.`);
if (failures.length) {
  fs.writeFileSync(path.join(outDir, '_failures.json'), JSON.stringify(failures, null, 2));
  console.log(`Failures written to ${path.join(outDir, '_failures.json')}`);
}
