/**
 * Feedback API Routes - POST /api/feedback
 * Record new feedback and annotations
 * @author andreas@siglochconsulting
 */

import { Router, Request, Response } from 'express';
import { getWriteSession, getReadSession, toNumber } from '../db/neo4j.js';
import {
  FeedbackRequestSchema,
  FeedbackResponseSchema,
  FeedbackResponse,
  ApiErrorSchema,
} from '../schemas/index.js';
import { broadcast } from './events.js';
import { registerPattern, incrementEventCount } from './memory.js';

const router = Router();

// In-memory feedback storage (in production, persist to Neo4j or separate DB)
const feedbackStore: Map<string, FeedbackResponse> = new Map();

/**
 * POST /api/feedback
 * Record new feedback for a node
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const parseResult = FeedbackRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const apiError = ApiErrorSchema.parse({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parseResult.error.issues,
      });
      res.status(400).json(apiError);
      return;
    }

    // Schema normalizes MCP format (targetId/issue) to (nodeId/message)
    const data = parseResult.data;
    const nodeId = data.nodeId || data.targetId || '';
    const type = data.type || 'observation';
    const severity = data.severity || 'info';
    const message = data.message || data.issue || '';

    // Verify node exists in Neo4j
    const readSession = getReadSession();
    try {
      const nodeResult = await readSession.run(
        `MATCH (n {id: $nodeId})
         WHERE n:StakeholderReq OR n:SystemReq OR n:SoftwareReq OR n:HardwareReq OR n:TestCase OR n:InputSpec
         RETURN n.id AS id, labels(n)[0] AS type`,
        { nodeId }
      );

      if (nodeResult.records.length === 0) {
        const apiError = ApiErrorSchema.parse({
          error: `Node not found: ${nodeId}`,
          code: 'NODE_NOT_FOUND',
        });
        res.status(404).json(apiError);
        return;
      }
    } finally {
      await readSession.close();
    }

    // Generate feedback ID and timestamp
    const feedbackId = `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();

    // Store feedback
    const feedback: FeedbackResponse = {
      id: feedbackId,
      nodeId,
      type,
      severity,
      message,
      createdAt,
      processed: false,
    };

    feedbackStore.set(feedbackId, feedback);

    // Optionally persist to Neo4j as annotation
    if (type === 'rule_violation' || type === 'compliance_issue') {
      const writeSession = getWriteSession();
      try {
        await writeSession.run(
          `MATCH (n {id: $nodeId})
           CREATE (f:Feedback {
             id: $feedbackId,
             type: $type,
             severity: $severity,
             message: $message,
             createdAt: datetime($createdAt)
           })
           CREATE (n)-[:HAS_FEEDBACK]->(f)
           RETURN f.id AS id`,
          { nodeId, feedbackId, type, severity, message, createdAt }
        );
      } catch (dbError) {
        // Non-critical: log but don't fail the request
        console.warn('[Feedback] Failed to persist to Neo4j:', dbError);
      } finally {
        await writeSession.close();
      }
    }

    // Register pattern based on feedback type
    registerPattern(`feedback_${type}`, severity === 'error' ? 0.9 : 0.6);
    incrementEventCount();

    // Broadcast to SSE clients
    broadcast('feedback_received', {
      feedbackId,
      nodeId,
      type,
      severity,
    });

    // Return validated response
    const response = FeedbackResponseSchema.parse(feedback);
    res.status(201).json(response);

  } catch (error) {
    console.error('[Feedback] Error recording feedback:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to record feedback',
      code: 'FEEDBACK_ERROR',
    });
    res.status(500).json(apiError);
  }
});

/**
 * GET /api/feedback
 * List all feedback (optional: filter by nodeId)
 */
router.get('/', (req: Request, res: Response): void => {
  const nodeId = req.query.nodeId as string | undefined;

  let feedbackList = Array.from(feedbackStore.values());

  if (nodeId) {
    feedbackList = feedbackList.filter(f => f.nodeId === nodeId);
  }

  // Sort by createdAt descending
  feedbackList.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json({
    count: feedbackList.length,
    feedback: feedbackList,
  });
});

/**
 * GET /api/feedback/:id
 * Get specific feedback by ID
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response): void => {
  const id = req.params.id;
  const feedback = feedbackStore.get(id);

  if (!feedback) {
    const apiError = ApiErrorSchema.parse({
      error: `Feedback not found: ${id}`,
      code: 'FEEDBACK_NOT_FOUND',
    });
    res.status(404).json(apiError);
    return;
  }

  res.json(feedback);
});

/**
 * PATCH /api/feedback/:id
 * Mark feedback as processed
 */
router.patch('/:id', (req: Request<{ id: string }>, res: Response): void => {
  const id = req.params.id;
  const feedback = feedbackStore.get(id);

  if (!feedback) {
    const apiError = ApiErrorSchema.parse({
      error: `Feedback not found: ${id}`,
      code: 'FEEDBACK_NOT_FOUND',
    });
    res.status(404).json(apiError);
    return;
  }

  const { processed } = req.body;
  if (typeof processed === 'boolean') {
    feedback.processed = processed;
    feedbackStore.set(id as string, feedback);
  }

  res.json(feedback);
});

export default router;
