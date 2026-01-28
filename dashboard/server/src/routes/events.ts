/**
 * SSE Events API Routes - GET /api/events
 * Server-Sent Events stream for real-time updates
 * @author andreas@siglochconsulting
 */

import { Router, Request, Response } from 'express';
import { SSEEvent, SSEEventType } from '../schemas/index.js';

const router = Router();

// Connected SSE clients
const clients: Set<Response> = new Set();

/**
 * Broadcast event to all connected clients
 */
export function broadcast(type: SSEEventType, data: unknown): void {
  const event: SSEEvent = {
    type,
    timestamp: new Date().toISOString(),
    data,
  };

  const message = `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  }
}

/**
 * Send event to specific client
 */
function sendEvent(res: Response, type: SSEEventType, data: unknown): void {
  const event: SSEEvent = {
    type,
    timestamp: new Date().toISOString(),
    data,
  };

  res.write(`event: ${type}\ndata: ${JSON.stringify(event)}\n\n`);
}

/**
 * GET /api/events
 * SSE endpoint for real-time updates
 */
router.get('/', (req: Request, res: Response): void => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection event
  sendEvent(res, 'connection_status', { status: 'connected', clientCount: clients.size + 1 });

  // Add to clients set
  clients.add(res);
  console.log(`[SSE] Client connected. Total clients: ${clients.size}`);

  // Broadcast client count update
  broadcast('connection_status', { clientCount: clients.size });

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
    console.log(`[SSE] Client disconnected. Total clients: ${clients.size}`);
    broadcast('connection_status', { clientCount: clients.size });
  });

  req.on('error', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

/**
 * Get current client count
 */
export function getClientCount(): number {
  return clients.size;
}

export default router;
