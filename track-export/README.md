# Anahata — Track Export

Everything you need to carry your tracks into a rebuilt app. This folder was
generated from the two track catalogues that already live in this repo, so the
**metadata is fully preserved in git** — you only need to move the audio files.

## Where your tracks actually live

| What | Where | Portable? |
|------|-------|-----------|
| **Library track metadata** (titles, artists, YouTube IDs, durations, tags, audio URLs) | `client/src/data/libraryData.ts` — in git | ✅ Already in the repo |
| **Real audio files** (raga/music `.mp3`s) | **Cloudflare R2** public bucket `anahata-tracks`, e.g. `https://pub-bcc7…r2.dev/rp-01.mp3` | ⬇️ Download with the script below |
| **Binaural / meditation catalogue** | `server/data/tracks.js` — in git | ✅ Synthesised in-browser, no files to move |
| **User data** (favourites, plays, journals, sessions, biometrics) | **PocketBase** (`anahata-pocketbase`) | Separate export — see note |

> Your tracks are **not** stored in PocketBase. PocketBase only holds per-user
> data. The audio is on Cloudflare R2; its URLs and all metadata are hardcoded
> in the repo.

## Files in this folder

- **`library-tracks.json`** — all 12 albums / 111 library tracks, grouped by album, with each track's live R2 `audioUrl`.
- **`binaural-tracks.json`** — the 111 binaural/meditation tracks (synthesised in-app; no downloadable files).
- **`all-tracks.csv`** — one flat row per track (both catalogues) for a spreadsheet.
- **`download-urls.txt`** — just the 84 downloadable audio URLs, one per line (for `wget -i` / `aria2c -i`).
- **`build-manifest.mjs`** — regenerates all of the above from the repo (run `node track-export/build-manifest.mjs`).
- **`download-audio.mjs`** — downloads every R2 audio file locally.

## Download the audio (run on your own machine)

```bash
# Node 18+ (no dependencies, resumable, skips files already fetched)
node track-export/download-audio.mjs            # -> track-export/audio/<id>.mp3
node track-export/download-audio.mjs ./my-audio # custom output dir
```

Or with standard tools:

```bash
wget -i track-export/download-urls.txt -P ./audio
# or
aria2c -i track-export/download-urls.txt -d ./audio -j 4
```

## Counts

- **84** library tracks have real audio on R2 → downloadable now.
- **27** library tracks have `audioUrl: null` (never uploaded to R2). Their audio
  only exists on YouTube via each track's `ytId`. To fetch those, run the repo's
  existing `scripts/upload-to-r2.js` (needs `yt-dlp` + `ffmpeg`), or download by
  `ytId` yourself.
- **111** binaural/meditation tracks are generated live by `server/services/musicEngine.js`
  — nothing to download; that code comes with the repo.

## Reusing tracks in the rebuilt app

Two options:

1. **Keep pointing at the same R2 bucket** — the `audioUrl`s are public and keep
   working. Zero migration: reuse `library-tracks.json` as-is. (Simplest.)
2. **Re-host the audio** — download with the script above, upload the `.mp3`s to
   your new storage, then rewrite the `audioUrl` base in `library-tracks.json`.

## Exporting PocketBase user data (optional, separate)

If you also want the per-user records (favourites, plays, journals, biometrics),
that's a separate export from your PocketBase instance — either copy its
`pb_data/` directory off the Render disk, or use the admin UI's export. Tell me
and I can add a PocketBase export script too.
