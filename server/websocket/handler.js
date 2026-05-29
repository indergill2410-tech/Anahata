const { generateMeditation } = require('../services/musicEngine');
const { verifyToken } = require('../utils/jwtHelper');

function setupWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    // Optional JWT auth via ?token= query param
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    let userId = null;
    if (token) {
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
      } catch {
        // Invalid/expired token — continue as guest
      }
    }

    ws.userId = userId;
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.type === 'biometric') {
        const { heartRate, hrv, spo2 } = msg;
        if (!heartRate) return;
        try {
          const result = await generateMeditation({ heartRate, hrv, spo2 });
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'meditation', userId, ...result }));
          }
        } catch {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Analysis failed.' }));
          }
        }
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      }
    });

    ws.on('close', () => {});
    ws.on('error', (err) => console.error('[WS] Error:', err.message));
  });

  // Heartbeat: terminate stale connections every 30s
  const heartbeat = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) { ws.terminate(); return; }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));
}

module.exports = { setupWebSocket };
