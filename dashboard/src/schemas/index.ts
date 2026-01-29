/**
 * Zod Schemas for Data Maturity Dashboard
 * @author andreas@siglochconsulting
 */

import { z } from 'zod'

// Node types matching backend schema (source of truth)
export const NodeTypeSchema = z.enum([
  'StakeholderReq',
  'SystemReq',
  'SoftwareReq',
  'HardwareReq',
  'TestCase',
  'InputSpec',
  'Regel',
])
export type NodeType = z.infer<typeof NodeTypeSchema>

// Graph node schema - matches API response
export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: NodeTypeSchema,
  title: z.string().optional(),
  centrality: z.number().min(0).max(1).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  pageRank: z.number().min(0).max(1).optional(),
  betweenness: z.number().min(0).optional(),
  degree: z.number().int().min(0).optional(),
})
export type GraphNode = z.infer<typeof GraphNodeSchema>

// Graph edge schema - matches API response
export const GraphEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  weight: z.number().min(0).max(1).optional().default(1),
  type: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
})
export type GraphEdge = z.infer<typeof GraphEdgeSchema>

// Complete graph data - matches API response
export const GraphDataSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  stats: z.object({
    nodeCount: z.number().int().min(0),
    edgeCount: z.number().int().min(0),
    nodesByType: z.record(z.string(), z.number()).optional(),
  }).optional(),
  metadata: z
    .object({
      totalNodes: z.number().int().min(0),
      totalEdges: z.number().int().min(0),
      lastUpdated: z.string().datetime({ offset: true }),
    })
    .optional(),
})
export type GraphData = z.infer<typeof GraphDataSchema>

// Centrality metrics
export const CentralityMetricsSchema = z.object({
  nodeId: z.string(),
  label: z.string(),
  type: NodeTypeSchema,
  pageRank: z.number().min(0).max(1),
  betweenness: z.number().min(0),
  closeness: z.number().min(0).max(1).optional(),
  eigenvector: z.number().min(0).optional(),
  degree: z.number().int().min(0),
})
export type CentralityMetrics = z.infer<typeof CentralityMetricsSchema>

// Pattern detection result
export const DetectedPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  nodeIds: z.array(z.string()),
  patternType: z.enum([
    'cluster',
    'hierarchy',
    'bridge',
    'hub',
    'cycle',
    'chain',
  ]),
  detectedAt: z.string().datetime({ offset: true }),
})
export type DetectedPattern = z.infer<typeof DetectedPatternSchema>

// Memory/Learning event
export const MemoryEventSchema = z.object({
  id: z.string(),
  eventType: z.enum([
    'learn',
    'recall',
    'consolidate',
    'forget',
    'connect',
    'strengthen',
  ]),
  description: z.string(),
  timestamp: z.string().datetime({ offset: true }),
  relatedNodes: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type MemoryEvent = z.infer<typeof MemoryEventSchema>

// SSE event types
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
    data: z.object({ timestamp: z.string().datetime({ offset: true }) }),
  }),
])
export type SSEEvent = z.infer<typeof SSEEventSchema>

// Tab configuration
export const TabSchema = z.enum(['graph', 'timeline', 'centrality', 'patterns'])
export type Tab = z.infer<typeof TabSchema>

// Filter state
export const FilterStateSchema = z.object({
  nodeTypes: z.array(NodeTypeSchema),
  minPageRank: z.number().min(0).max(1),
  minDegree: z.number().int().min(0),
  searchQuery: z.string(),
})
export type FilterState = z.infer<typeof FilterStateSchema>

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })

// Validation helpers
export function validateGraphData(data: unknown): GraphData {
  return GraphDataSchema.parse(data)
}

export function validateSSEEvent(data: unknown): SSEEvent {
  return SSEEventSchema.parse(data)
}

export function safeParseSSEEvent(data: unknown) {
  return SSEEventSchema.safeParse(data)
}
