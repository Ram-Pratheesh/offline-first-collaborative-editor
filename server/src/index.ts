import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupYjsWebSocket } from './websocket/yjsServer.js';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const server = http.createServer(app);

// Security
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api/auth', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Setup Yjs WebSocket
setupYjsWebSocket(server);

// Start server
const start = async () => {
  await connectDatabase();

  server.listen(parseInt(env.PORT), () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║  🚀 CollabEditor Server Running                 ║
║  ─────────────────────────────────────────────── ║
║  API:       http://localhost:${env.PORT}              ║
║  WebSocket: ws://localhost:${env.PORT}/yjs             ║
║  Mode:      ${env.NODE_ENV.padEnd(36)}║
╚══════════════════════════════════════════════════╝
    `);
  });
};

start().catch(console.error);
