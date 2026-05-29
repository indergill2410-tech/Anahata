# 🎵 Anahata — AI Biofeedback Meditation App

Anahata connects to your smartwatch via Bluetooth, reads your live heart rate, and generates real-time AI classical music — Mozart-inspired symphonies layered with binaural beats — tuned specifically to guide your nervous system toward calm.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, WebSockets (ws) |
| Frontend | React PWA (Vite) |
| AI Music | Lyria RealTime / Loudly API |
| Database | Supabase (PostgreSQL) |
| Bluetooth | Web Bluetooth API |
| Deployment | Render.com (Web Service) |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

See `.env.example` for all required variables.

## Deployment

This repo includes a `render.yaml` for one-click Render deployment. Connect this GitHub repo to Render via Blueprint and all services will auto-provision.

## Architecture

```
Smartwatch (BLE)
    │
    ▼
Web Bluetooth API (Client)
    │  WebSocket (wss://)
    ▼
Node.js Server (Express + ws)
    │
    ├── Biometric Analysis Engine
    │       └── HR → Target BPM → Binaural Hz
    │
    ├── AI Prompt Generator
    │       └── Dynamic Mozart/Classical Prompt
    │
    └── AI Music API (Lyria / Loudly)
            └── Audio Stream URL → Client
```
