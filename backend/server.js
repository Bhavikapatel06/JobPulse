/**
 * ─────────────────────────────────────────────────────────────
 *  JobPulse – Server Entry Point
 * ─────────────────────────────────────────────────────────────
 *  1. Loads environment variables
 *  2. Connects to MongoDB
 *  3. Registers Express middleware & routes
 *  4. Starts the cron Scheduler Agent
 *  5. Listens for HTTP requests
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');
const userRoutes = require('./src/routes/userRoutes');
const jobRoutes  = require('./src/routes/jobRoutes');
const authRoutes = require('./src/routes/authRoutes');
const schedulerAgent = require('./src/agents/schedulerAgent');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static Dashboard UI ──────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// Request logger (brief)
app.use((req, _res, next) => {
  logger.info(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs',  jobRoutes);


// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'JobPulse',
    timestamp: new Date().toISOString(),
    mongoState: ['disconnected', 'connected', 'connecting', 'disconnecting'][
      require('mongoose').connection.readyState
    ] || 'unknown',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(err.status || 500).json({ success: false, error: err.message });
});

// ─── Bootstrap ───────────────────────────────────────────────
const start = async () => {
  try {
    logger.info('');
    logger.info('  ╔══════════════════════════════════╗');
    logger.info('  ║   🚀  JobPulse  – Starting up    ║');
    logger.info('  ╚══════════════════════════════════╝');
    logger.info('');

    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start the cron scheduler
    schedulerAgent.start();

    // 3. Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🌐 Server listening on http://localhost:${PORT}`);
      logger.info('');
      logger.info('  Available endpoints:');
      logger.info(`    POST   http://localhost:${PORT}/api/users`);
      logger.info(`    GET    http://localhost:${PORT}/api/users`);
      logger.info(`    GET    http://localhost:${PORT}/api/users/:id`);
      logger.info(`    PUT    http://localhost:${PORT}/api/users/:id`);
      logger.info(`    DELETE http://localhost:${PORT}/api/users/:id`);
      logger.info(`    POST   http://localhost:${PORT}/api/users/:id/trigger`);
      logger.info(`    GET    http://localhost:${PORT}/api/jobs`);
      logger.info(`    GET    http://localhost:${PORT}/api/jobs/:company`);
      logger.info(`    POST   http://localhost:${PORT}/api/jobs/:company/refresh`);
      logger.info(`    GET    http://localhost:${PORT}/health`);
      logger.info('');
    });
  } catch (err) {
    logger.error(`Fatal startup error: ${err.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\n🛑 Shutting down gracefully...');
  await require('mongoose').disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});

start();
