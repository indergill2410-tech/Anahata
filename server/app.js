/**
 * Anahata — Express App Configuration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes       = require('./routes/auth');
const sessionRoutes    = require('./routes/session');
const meditationRoutes = require('./routes/meditation');
const libraryRoutes    = require('./routes/library');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://anahata.onrender.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests.' } });
app.use('/api/', limiter);

if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

app.use('/api/auth',       authRoutes);
app.use('/api/sessions',   sessionRoutes);
app.use('/api/meditation', meditationRoutes);
app.use('/api/library',    libraryRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', app: 'Anahata', version: '1.0.0', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

module.exports = app;
