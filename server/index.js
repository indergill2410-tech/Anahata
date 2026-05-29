require('dotenv').config();
const http = require('http');
const { WebSocketServer } = require('ws');
const app = require('./app');
const { setupWebSocket } = require('./websocket/handler');

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`[Anahata] Server running on port ${PORT}`);
  console.log(`[Anahata] WebSocket ready at ws://localhost:${PORT}/ws`);
  console.log(`[Anahata] Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('[Anahata] SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});
