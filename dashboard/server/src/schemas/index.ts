/**
 * Zod Schemas for Dashboard API
 * @author andreas@siglochconsulting
 */

import { z } from 'zod';

// ============================================================================
// Graph Schemas
// ============================================================================

export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['StakeholderReq', 'SystemReq', 'SoftwareReq', 'HardwareReq', 'TestCase', 'InputSpec', 'Regel']),
  title: z.string(),
  centrality: z.number().min(0).max(1),
  properties: z.record(z.unknown()).optional(),
});

export const GraphEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  type: z.enum(['TRACED_TO', 'VERIFIED_BY', 'IMPLEMENTED_IN', 'DEPENDS_ON']),
  properties: z.record(z.unknown()).optional(),
});

export const GraphResponseSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  stats: z.object({
    nodeCount: z.number(),
    edgeCount: z.number(),
    nodesByType: z.record(z.number()),
  }),
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
export type GraphResponse = z.infer<typeof GraphResponseSchema>;

// ============================================================================
// Memory/Learning Schemas
// ============================================================================

export const LearningPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  occurrences: z.number(),
  lastSeen: z.string().datetime(),
  confidence: z.number().min(0).max(1),
});

export const MemoryStatsSchema = z.object({
  feedbackCount: z.number(),
  patternCount: z.number(),
  eventCount: z.number(),
  lastUpdated: z.string().datetime(),
  patterns: z.array(LearningPatternSchema),
  feedbackByType: z.record(z.number()),
});

export type LearningPattern = z.infer<typeof LearningPatternSchema>;
export type MemoryStats = z.infer<typeof MemoryStatsSchema>;

// ============================================================================
// Feedback Schemas
// ============================================================================

export const FeedbackTypeSchema = z.enum([
  'rule_violation',
  'compliance_issue',
  'traceability_gap',
  'test_coverage',
  'manual_annotation',
  'review',
  'observation',
  'question',
]);

// Flexible schema: accepts MCP format (targetId/issue) or full format (nodeId/message)
// Normalizes to nodeId/message internally
export const FeedbackRequestSchema = z.object({
  nodeId: z.string().min(1).optional(),
  targetId: z.string().min(1).optional(),
  type: FeedbackTypeSchema.optional(),
  severity: z.enum(['error', 'warning', 'info']).optional(),
  message: z.string().min(1).max(1000).optional(),
  issue: z.string().min(1).max(1000).optional(),
  context: z.record(z.unknown()).optional(),
}).refine(
  data => data.nodeId || data.targetId,
  { message: 'Either nodeId or targetId is required' }
).refine(
  data => data.message || data.issue,
  { message: 'Either message or issue is required' }
).transform(data => ({
  nodeId: data.nodeId || data.targetId!,
  type: data.type || 'review',
  severity: data.severity || 'info',
  message: data.message || data.issue!,
  context: data.context,
}));

export const FeedbackResponseSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  type: FeedbackTypeSchema,
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  createdAt: z.string().datetime(),
  processed: z.boolean(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;

// ============================================================================
// SSE Event Schemas
// ============================================================================

export const SSEEventTypeSchema = z.enum([
  'graph_update',
  'feedback_received',
  'pattern_detected',
  'compliance_change',
  'connection_status',
]);

export const SSEEventSchema = z.object({
  type: SSEEventTypeSchema,
  timestamp: z.string().datetime(),
  data: z.unknown(),
});

export type SSEEventType = z.infer<typeof SSEEventTypeSchema>;
export type SSEEvent = z.infer<typeof SSEEventSchema>;

// ============================================================================
// Error Schemas
// ============================================================================

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
