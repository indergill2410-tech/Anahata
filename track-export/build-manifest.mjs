#!/usr/bin/env node
/**
 * Anahata — Track Manifest Builder
 *
 * Reads the two track catalogues that ship in this repo and produces a single
 * portable manifest you can use to seed a rebuilt app:
 *
 *   - client/src/data/libraryData.ts  -> real audio tracks hosted on Cloudflare R2
 *   - server/data/tracks.js           -> binaural / meditation catalogue (synthesised)
 *
 * Outputs (written next to this script, in track-export/):
 *   - library-tracks.json   grouped by album, with live R2 audioUrl per track
 *   - binaural-tracks.json  the meditation/binaural catalogue
 *   - all-tracks.csv        flat combined list (one row per track)
 *   - download-urls.txt     just the downloadable audio URLs, one per line
 *
 * Usage:  node track-export/build-manifest.mjs
 * No network access and no dependencies required.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outDir = __dirname;

// ── 1. Library tracks (TypeScript source, plain data) ───────────────────────
function loadLibraryAlbums() {
  const tsPath = path.join(repoRoot, 'client/src/data/libraryData.ts');
  let src = fs.readFileSync(tsPath, 'utf8');
  // Keep only up to the end of the ALBUMS array; everything after is TS helpers.
  src = src.split('export const TOTAL_TRACKS')[0];
  // Strip the TypeScript-only bits so the file becomes valid JS data.
  src = src.replace(/export interface [\s\S]*?\n\}\n/g, '');
  src = src.replace(/export const ALBUMS\s*:\s*Album\[\]\s*=/, 'const ALBUMS =');
  const evalSrc = `${src}\nexport { ALBUMS };`;
  const tmp = path.join(outDir, '.albums.mjs');
  fs.writeFileSync(tmp, evalSrc);
  return import(pathToFileURL(tmp).href)
    .then((m) => {
      fs.unlinkSync(tmp);
      return m.ALBUMS;
    })
    .catch((err) => {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      throw err;
    });
}

// ── 2. Binaural / meditation catalogue (CommonJS) ───────────────────────────
async function loadBinauralTracks() {
  const mod = await import(pathToFileURL(path.join(repoRoot, 'server/data/tracks.js')).href);
  const t = mod.default ?? mod;
  return { TRACKS: t.TRACKS ?? [], CATEGORIES: t.CATEGORIES ?? {} };
}

function csvCell(v) {
  if (v == null) return '';
  const s = Array.isArray(v) ? v.join('|') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const albums = await loadLibraryAlbums();
  const { TRACKS: binaural } = await loadBinauralTracks();

  // library-tracks.json — grouped by album
  fs.writeFileSync(path.join(outDir, 'library-tracks.json'), JSON.stringify(albums, null, 2));

  // binaural-tracks.json
  fs.writeFileSync(path.join(outDir, 'binaural-tracks.json'), JSON.stringify(binaural, null, 2));

  // Flat combined CSV
  const rows = [];
  const header = ['source', 'album', 'id', 'title', 'artist', 'duration', 'ytId', 'audioUrl', 'category', 'tags'];
  rows.push(header.join(','));

  const downloadable = [];
  let libCount = 0;
  let libWithAudio = 0;
  for (const album of albums) {
    for (const tr of album.tracks || []) {
      libCount++;
      if (tr.audioUrl) {
        libWithAudio++;
        downloadable.push(tr.audioUrl);
      }
      rows.push([
        'library', album.title, tr.id, tr.title, tr.artist, tr.duration,
        tr.ytId, tr.audioUrl || '', '', (tr.tags || []).join('|'),
      ].map(csvCell).join(','));
    }
  }
  for (const tr of binaural) {
    rows.push([
      'binaural', '', tr.id, tr.title, '',
      tr.duration ? `${Math.round(tr.duration / 60)} min` : '',
      '', tr.url || '', tr.category || '', (tr.tags || []).join('|'),
    ].map(csvCell).join(','));
  }
  fs.writeFileSync(path.join(outDir, 'all-tracks.csv'), rows.join('\n') + '\n');

  // download-urls.txt — only real, downloadable audio (R2)
  fs.writeFileSync(path.join(outDir, 'download-urls.txt'), downloadable.join('\n') + '\n');

  console.log('Manifest built:');
  console.log(`  library albums          : ${albums.length}`);
  console.log(`  library tracks          : ${libCount}  (with R2 audio: ${libWithAudio}, missing: ${libCount - libWithAudio})`);
  console.log(`  binaural/meditation     : ${binaural.length}  (synthesised in-app, no downloadable files)`);
  console.log(`  downloadable audio URLs : ${downloadable.length}`);
  console.log('\nWrote:');
  for (const f of ['library-tracks.json', 'binaural-tracks.json', 'all-tracks.csv', 'download-urls.txt']) {
    console.log(`  track-export/${f}`);
  }
}

main().catch((err) => {
  console.error('Failed to build manifest:', err);
  process.exit(1);
});
