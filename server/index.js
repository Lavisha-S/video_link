require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { validateEnv } = require('./utils/validateEnv');
const { generateToken } = require('./utils/tokenGenerator');
const { logger } = require('./utils/logger');

// ── Validate env vars at startup ──────────────────────────────────────────────
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Guard against oversized payloads

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman / server-to-server (no Origin header)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin "${origin}" not allowed`));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const tokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20,             // 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

// ── Validation schema ─────────────────────────────────────────────────────────
const tokenSchema = Joi.object({
  identity: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9 _\-\.@]+$/)
    .required()
    .messages({
      'string.pattern.base': 'identity may only contain letters, numbers, spaces, _ - . @',
      'string.min': 'identity must be at least 1 character',
      'string.max': 'identity must be at most 100 characters',
      'any.required': 'identity is required',
    }),
  roomName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9 _\-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'roomName may only contain letters, numbers, spaces, _ and -',
      'string.min': 'roomName must be at least 1 character',
      'string.max': 'roomName must be at most 100 characters',
      'any.required': 'roomName is required',
    }),
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Generate Token ────────────────────────────────────────────────────────────
app.post('/generate-token', tokenLimiter, (req, res) => {
  const { error, value } = tokenSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const details = error.details.map((d) => d.message);
    logger.warn('Validation failed:', details.join('; '));
    return res.status(400).json({ error: 'Validation failed', details });
  }

  const { identity, roomName } = value;

  try {
    const token = generateToken(identity, roomName);
    logger.info(`Token issued for identity="${identity}" room="${roomName}"`);
    return res.json({ token, identity, roomName, expiresIn: 3600 });
  } catch (err) {
    logger.error('Token generation failed:', err.message);
    return res.status(500).json({ error: 'Failed to generate access token. Please try again.' });
  }
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  logger.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start / export (supports both direct run and test import) ─────────────────
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Allowed origins: ${allowedOrigins.join(', ')}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`[${signal}] Shutting down gracefully...`);
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err.message);
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', String(reason));
  });
}

module.exports = app; // Export for testing
