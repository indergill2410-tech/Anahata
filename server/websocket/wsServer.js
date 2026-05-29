/**
 * Anahata — WebSocket Server
 * Handles real-time biofeedback data from connected smartwatches.
 */

const WebSocket = require('ws');
const { verifyToken } = require('../utils/auth');
const { analyzeMetrics } = require('../services/biometricAnalyzer');
const { fetchAiMusic } = require('../services/aiMusicService');
const { logSession } = require('../services/sessionLogger');

// Throttle AI requests to max 1 per 30s per client to control API costs
const THROTTLE_MS = 30000;
const clientLastRequest = new Map();

function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    // Authenticate via token in query string: wss://host/ws?token=xxx
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    let userId = null;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
      console.log(`[WS] Client authenticated: ${userId}`);
    } catch (err) {
      console.warn('[WS] Unauthenticated connection. Proceeding as guest.');
    }

    ws.send(JSON.stringify({ type: 'connected', message: 'Anahata stream active. Awaiting biometrics...' }));

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw);

        if (data.type === 'biometrics' && data.heartRate) {
          const now = Date.now();
          const lastReq = clientLastRequest.get(ws) || 0;

          // Throttle AI API calls
          if (now - lastReq < THROTTLE_MS) {
            ws.send(JSON.stringify({ type: 'throttled', message: 'Biometrics received. Music updating soon...' }));
            return;
          }
          clientLastRequest.set(ws, now);

          // 1. Analyze biometrics → determine musical parameters
          const musicParams = analyzeMetrics({
            heartRate: data.heartRate,
            hrv: data.hrv || null,
            spo2: data.spo2 || null,
            stressLevel: data.stressLevel || null
          });

          // 2. Fetch AI-generated music
          const audioResult = await fetchAiMusic(musicParams);

          // 3. Log session to Supabase
          if (userId) {
            await logSession(userId, data, musicParams, audioResult);
          }

          // 4. Send audio to client
          ws.send(JSON.stringify({
            type: 'audio_update',
            audioUrl: audioResult.url,
            duration: audioResult.duration,
            musicParams,
            nextUpdateIn: THROTTLE_MS / 1000
          }));
        }

      } catch (err) {
        console.error('[WS] Message error:', err.message);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to process biometrics.' }));
      }
    });

    ws.on('close', () => {
      clientLastRequest.delete(ws);
      console.log(`[WS] Client disconnected: ${userId || 'guest'}`);
    });
  });

  console.log('[WS] WebSocket server initialised on /ws');
  return wss;
}

module.exports = { initWebSocketServer };
