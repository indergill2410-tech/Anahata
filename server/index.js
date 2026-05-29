/**
 * Anahata — Biofeedback Meditation App
 * Server Entry Point
 */

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initWebSocketServer } = require('./websocket/wsServer');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Attach WebSocket server to the same HTTP server
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`[Anahata] Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Anahata] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Anahata] HTTP server closed.');
    process.exit(0);
  });
});
