# Anahata

AI-powered biometric meditation with adaptive Indian classical music.

Anahata reads heart-rate style biometric input, maps it to brainwave states, and adapts the meditation experience through raga-inspired sound, binaural frequencies, breath pacing, journaling, and personal session history.

## What It Does

- Live biometric meditation with WebSocket support
- 111 meditation tracks with R2 audio URLs and YouTube fallback playback
- Brainwave mapping across Delta, Theta, Alpha, Beta, and Gamma states
- Raga-inspired journeys, sound studio controls, and saved mixes
- Private account login/register through PocketBase users
- PocketBase-backed session, library, profile, mix, and journal storage
- Guest-friendly local journaling before sign in
- PWA/mobile-ready React app

## Stack

| Layer | Tech |
| ----- | ---- |
| Frontend | React 18 + Vite 5 + PWA + Capacitor |
| Backend | Node.js + Express + WebSocket |
| Database/Auth | PocketBase |
| Storage | PocketBase collections + R2 audio URLs |
| Tests | Jest + Supertest |

## Data Storage

Anahata uses PocketBase as the app database. Do not configure this app against Supabase unless the code is intentionally migrated.

PocketBase collections created by `pb-migrations/setup-collections.js`:

- `users` with Anahata profile fields
- `meditation_sessions`
- `library_favourites`
- `library_plays`
- `user_mixes`
- `journal_entries`

The journal supports `checkin`, `daily`, and `dream` entry types. Guest entries can live in browser localStorage, but signed-in users should sync private journal data to PocketBase through `/api/journal`.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/indergill2410-tech/Anahata.git
cd Anahata

# 2. Environment
cp .env.example .env
# Fill in JWT_SECRET, POCKETBASE_URL, and PocketBase admin credentials.

# 3. Install all deps
npm run install:all

# 4. Start PocketBase separately
# Local default: http://localhost:8090

# 5. Create PocketBase collections
node pb-migrations/setup-collections.js

# 6. Dev server
npm run dev
```

Server: `http://localhost:3001`
Client: `http://localhost:5173`
PocketBase admin UI: `http://localhost:8090/_/`

## Environment Variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `JWT_SECRET` | Yes | Strong random secret, minimum 32 chars |
| `POCKETBASE_URL` | Yes | PocketBase instance URL |
| `POCKETBASE_ADMIN_EMAIL` | Setup only | PocketBase admin email for collection setup |
| `POCKETBASE_ADMIN_PASSWORD` | Setup only | PocketBase admin password for collection setup |
| `VITE_WS_URL` | No | Client WebSocket URL, default local dev is `ws://localhost:3001/ws` |
| `SENTRY_DSN` | No | Optional error reporting |
| `PORT` | No | Server port, default `3001` |
| `NODE_ENV` | No | `development` or `production` |

## Testing

```bash
npm test
npm run test:coverage
```

## Production Notes

- Set a real `JWT_SECRET`; never use the example value in production.
- Set `POCKETBASE_URL` to the production PocketBase host.
- Run the PocketBase setup script after provisioning a new database.
- Keep `/api/journal`, `/api/profile`, `/api/sessions`, `/api/mixes`, and private library endpoints protected by JWT auth.
- Do not commit `.env`.
