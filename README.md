# 🪷 Anahata

> AI-powered biometric meditation with adaptive Indian classical music

[![CI](https://github.com/indergill2410-tech/Anahata/actions/workflows/ci.yml/badge.svg)](https://github.com/indergill2410-tech/Anahata/actions)

## What it does

Anahata reads your heart rate in real time via Bluetooth and adapts the music to guide your nervous system into meditation. The deeper you breathe, the slower and deeper the music becomes.

- 🫀 **Live biometrics** — Bluetooth HR monitor or demo simulation mode
- 🎵 **111 meditation tracks** — binaural beats + Indian classical (sitar, bansuri, tanpura, santoor…)
- 🧠 **Brainwave mapping** — Delta / Theta / Alpha / Beta / Gamma states
- 📱 **PWA** — install to home screen, works offline
- 🔐 **Auth** — JWT login/register with auto-expiry

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 5 + PWA |
| Backend | Node.js + Express + WebSocket |
| Database | Supabase (Postgres + Auth + RLS) |
| Deploy | Render (Blueprint) |
| Tests | Jest + Supertest |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/indergill2410-tech/Anahata.git
cd Anahata

# 2. Environment
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET

# 3. Install all deps
npm run install:all

# 4. Run Supabase schema
# Paste supabase/schema.sql into your Supabase SQL Editor

# 5. Dev (runs server + client concurrently)
npm run dev

# Server: http://localhost:3001
# Client: http://localhost:5173
```

## Docker

```bash
cp .env.example .env  # fill in values
docker-compose up
```

## Testing

```bash
npm test                 # run all tests
npm run test:coverage    # with coverage report
```

## Deploy to Render

The `render.yaml` Blueprint is preconfigured. Push to main → Render auto-deploys.

1. Connect repo in Render dashboard
2. Add environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET)
3. Deploy

## PWA Icons

Generate icons before deploying:

```bash
npx pwa-asset-generator logo.svg ./client/public/icons
```

See `client/public/icons/README.md` for details.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon public key |
| `JWT_SECRET` | ✅ | Random secret ≥32 chars |
| `PORT` | ❌ | Server port (default 3001) |
| `NODE_ENV` | ❌ | `development` or `production` |
