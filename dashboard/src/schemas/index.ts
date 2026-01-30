/**
 * Zod Schemas for Data Maturity Dashboard
 * @author andreas@siglochconsulting
 *
 * Re-exports shared schemas from @maturity/schemas
 * Plus UI-specific schemas that are not part of the API contract
 */

import { z } from 'zod'

// =============================================================================
// Re-export ALL shared schemas (Single Source of Truth)
// =============================================================================

export * from '@maturity/schemas'

// Import specific types we need to reference
import {
  GraphNodeSchema,
  GraphEdgeSchema,
  GraphDataSchema,
  MemoryEventSchema,
  DetectedPatternSchema,
  CentralityMetricsSchema,
} from '@maturity/schemas'

// =============================================================================
// UI-Only Schemas (not part of API contract)
// =============================================================================

// Tab configuration (UI navigation) - Aligned with Stufen model
// Stufe 1-3: graph, Stufe 4: rules, Stufe 5: kennzahlen, Stufe 6: verbesserungen, Stufe 7: timeline
export const TabSchema = z.enum(['graph', 'rules', 'kennzahlen', 'verbesserungen', 'timeline'])
export type Tab = z.infer<typeof TabSchema>

// Wirkung filter for rules
export const WirkungFilterSchema = z.enum(['alle', 'Validierung', 'Scoring', 'Optimierung'])
export type WirkungFilter = z.infer<typeof WirkungFilterSchema>

// Filter state (UI state)
import { NodeTypeSchema } from '@maturity/schemas'

export const FilterStateSchema = z.object({
  nodeTypes: z.array(NodeTypeSchema),
  minPageRank: z.number().min(0).max(1),
  minDegree: z.number().int().min(0),
  searchQuery: z.string(),
})
export type FilterState = z.infer<typeof FilterStateSchema>

// =============================================================================
// SSE Event Schema (Frontend-specific, uses shared data schemas)
// =============================================================================

export const SSEEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('graph-update'),
    data: GraphDataSchema,
  }),
  z.object({
    type: z.literal('node-added'),
    data: GraphNodeSchema,
  }),
  z.object({
    type: z.literal('edge-added'),
    data: GraphEdgeSchema,
  }),
  z.object({
    type: z.literal('memory-event'),
    data: MemoryEventSchema,
  }),
  z.object({
    type: z.literal('pattern-detected'),
    data: DetectedPatternSchema,
  }),
  z.object({
    type: z.literal('centrality-update'),
    data: z.array(CentralityMetricsSchema),
  }),
  z.object({
    type: z.literal('heartbeat'),
    data: z.object({ timestamp: z.string().datetime() }),
  }),
])
export type SSEEvent = z.infer<typeof SSEEventSchema>

// =============================================================================
// Validation Helpers
// =============================================================================

import type { GraphData } from '@maturity/schemas'

export function validateGraphData(data: unknown): GraphData {
  return GraphDataSchema.parse(data)
}

export function validateSSEEvent(data: unknown): SSEEvent {
  return SSEEventSchema.parse(data)
}

export function safeParseSSEEvent(data: unknown) {
  return SSEEventSchema.safeParse(data)
}
