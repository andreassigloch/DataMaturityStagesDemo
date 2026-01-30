/**
 * Zod Schemas for Dashboard Server
 * @author andreas@siglochconsulting
 *
 * Re-exports shared schemas from @maturity/schemas
 * Plus server-specific schemas for internal use
 */

import { z } from 'zod'

// =============================================================================
// Re-export ALL shared schemas (Single Source of Truth)
// =============================================================================

export * from '@maturity/schemas'

// =============================================================================
// Server-Only Schemas (internal transformations)
// =============================================================================

// Graph response with server-specific stats format
import { GraphNodeSchema, GraphEdgeSchema } from '@maturity/schemas'

export const GraphResponseSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  stats: z.object({
    nodeCount: z.number(),
    edgeCount: z.number(),
    nodesByType: z.record(z.number()),
  }),
})
export type GraphResponse = z.infer<typeof GraphResponseSchema>

// Rules response with server stats
import { RegelSchema } from '@maturity/schemas'

export const RulesResponseSchema = z.object({
  rules: z.array(RegelSchema),
  stats: z.object({
    total: z.number(),
    active: z.number(),
    byStandard: z.record(z.number()),
    bySchwere: z.record(z.number()),
    byWirkung: z.record(z.number()).optional(),
  }),
})
export type RulesResponse = z.infer<typeof RulesResponseSchema>

// =============================================================================
// SSE Event Types (Server-side)
// =============================================================================

export const SSEEventTypeSchema = z.enum([
  'graph_update',
  'feedback_received',
  'pattern_detected',
  'compliance_change',
  'connection_status',
])
export type SSEEventType = z.infer<typeof SSEEventTypeSchema>

export const SSEEventSchema = z.object({
  type: SSEEventTypeSchema,
  timestamp: z.string().datetime(),
  data: z.unknown(),
})
export type SSEEvent = z.infer<typeof SSEEventSchema>
