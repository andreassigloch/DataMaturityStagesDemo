/**
 * Dashboard Backend Server
 * Express + Neo4j + Zod validation
 * @author andreas@siglochconsulting
 */

import express, { Express } from 'express';
import cors from 'cors';
import { initNeo4j, closeNeo4j } from './db/neo4j.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import graphRoutes from './routes/graph.js';
import memoryRoutes from './routes/memory.js';
import eventsRoutes from './routes/events.js';
import feedbackRoutes from './routes/feedback.js';
import rulesRoutes from './routes/rules.js';
import centralityRoutes from './routes/centrality.js';
import qualityRoutes from './routes/quality.js';
import optimizationRoutes from './routes/optimization.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

const app: Express = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/graph', graphRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/centrality', centralityRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/optimization', optimizationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Start server
 */
async function start(): Promise<void> {
  try {
    // Initialize Neo4j connection
    await initNeo4j();

    // Start Express server
    app.listen(PORT, HOST, () => {
      console.log(`
========================================
  Dashboard Backend Server
========================================
  Port:     ${PORT}
  Host:     ${HOST}
  Neo4j:    ${process.env.NEO4J_URI || 'bolt://localhost:7687'}
----------------------------------------
  Endpoints:
    GET  /health         - Health check
    GET  /api/graph      - Graph data with centrality
    GET  /api/memory     - Learning statistics
    GET  /api/events     - SSE stream
    POST /api/feedback   - Record feedback
    GET  /api/feedback   - List feedback
    GET  /api/rules      - Validation rules
    GET  /api/centrality  - Centrality metrics
    GET  /api/quality     - Quality data (validation, scoring, optimization)
    GET  /api/optimization - Stufe 6: Iterative optimization state
========================================
`);
    });

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Server] ${signal} received, shutting down...`);
  try {
    await closeNeo4j();
    console.log('[Server] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});

// Start the server
start();
