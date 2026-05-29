// Validate environment before anything else
require('dotenv').config();
const { validateEnv }    = require('./utils/validateEnv');
validateEnv();

const http = require('http');
const { WebSocketServer } = require('ws');
const logger = require('./utils/logger');
const { initSentry } = require('./utils/sentry');

// Initialise Sentry before app loads
initSentry();

const app = require('./app');
const { setupWebSocket } = require('./websocket/handler');

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

server.listen(PORT, () => {
  logger.info(`Server running`, { port: PORT, env: process.env.NODE_ENV || 'development' });
  logger.info(`WebSocket ready`, { path: '/ws' });
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Force exit after 10s if connections hang
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Uncaught exception safety net ─────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
  process.exit(1);
});
