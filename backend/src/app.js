
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();

app.disable('x-powered-by');

// --------------------------------------------------
// CORS: Allowed frontend origins
// --------------------------------------------------

const normalizeOrigin = (value) => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
};

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || 'http://localhost:3000'
)
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    // (e.g. server-to-server requests).
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (normalizedOrigin && allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error(`CORS blocked request from origin: ${origin}`);

    // Do not send CORS headers to unauthorized origins.
    return callback(null, false);
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
  ],

  optionsSuccessStatus: 204,
  maxAge: 86400,
};

// --------------------------------------------------
// Security middleware
// --------------------------------------------------

app.use(helmet());

// CORS middleware must execute before API routes.
app.use(cors(corsOptions));

// --------------------------------------------------
// Request middleware
// --------------------------------------------------

app.use(compression());

app.use(express.json({
  limit: '1mb',
}));

app.use(cookieParser());

app.use(pinoHttp());

// --------------------------------------------------
// Authentication rate limiter
// --------------------------------------------------

app.use(
  '/api/v1/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'teamflow-api',
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------

app.use('/api/v1', routes);

// --------------------------------------------------
// Error handling
// --------------------------------------------------

app.use(notFound);

app.use(errorHandler);

export default app;
