/**
 * Express Error Handler Middleware
 * @author andreas@siglochconsulting
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiErrorSchema } from '../schemas/index.js';

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    const apiError = ApiErrorSchema.parse({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues,
    });
    res.status(400).json(apiError);
    return;
  }

  // Neo4j connection errors
  if (err.message?.includes('Neo4j') || err.message?.includes('ServiceUnavailable')) {
    const apiError = ApiErrorSchema.parse({
      error: 'Database connection error',
      code: 'DB_CONNECTION_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    res.status(503).json(apiError);
    return;
  }

  // Generic error
  const apiError = ApiErrorSchema.parse({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Unknown error',
    code: 'INTERNAL_ERROR',
  });
  res.status(500).json(apiError);
}

/**
 * Not found handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  const apiError = ApiErrorSchema.parse({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
  });
  res.status(404).json(apiError);
}
