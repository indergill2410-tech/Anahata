const { generateMeditation } = require('../services/musicEngine');

/**
 * WebSocket handler — processes biometric streams from connected clients
 * Attach to an existing ws.Server instance from index.js
 */
function setupWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    console.log('[WS] Client connected:', req.socket.remoteAddress);

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
            ws.send(JSON.stringify({ type: 'meditation', ...result }));
          }
        } catch (err) {
          console.error('[WS] generateMeditation error:', err.message);
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Analysis failed.' }));
          }
        }
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      }
    });

    ws.on('close', () => console.log('[WS] Client disconnected'));
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
  console.log('[WS] Server ready');
}

module.exports = { setupWebSocket };
