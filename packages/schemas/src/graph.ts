/**
 * Graph Schemas - Nodes, Edges, Graph Data
 * @author andreas@siglochconsulting
 * @package @maturity/schemas
 */

import { z } from 'zod'

// =============================================================================
// Node Types
// =============================================================================

export const NodeTypeSchema = z.enum([
  'StakeholderReq',
  'SystemReq',
  'SoftwareReq',
  'TestCase',
  'InputSpec',
  'Komponente',
])
export type NodeType = z.infer<typeof NodeTypeSchema>

// =============================================================================
// Edge Types
// =============================================================================

export const EdgeTypeSchema = z.enum([
  'TRACED_TO',
  'VERIFIED_BY',
  'IMPLEMENTED_IN',
  'DEPENDS_ON',
])
export type EdgeType = z.infer<typeof EdgeTypeSchema>

// =============================================================================
// Graph Node
// =============================================================================

export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: NodeTypeSchema,
  title: z.string().optional(),
  centrality: z.number().min(0).max(1).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  pageRank: z.number().min(0).max(1).optional(),
  degree: z.number().int().min(0).optional(),
})
export type GraphNode = z.infer<typeof GraphNodeSchema>

// =============================================================================
// Graph Edge
// =============================================================================

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

// =============================================================================
// Graph Data (Complete)
// =============================================================================

export const GraphStatsSchema = z.object({
  nodeCount: z.number().int().min(0),
  edgeCount: z.number().int().min(0),
  nodesByType: z.record(z.string(), z.number()).optional(),
})
export type GraphStats = z.infer<typeof GraphStatsSchema>

export const GraphMetadataSchema = z.object({
  totalNodes: z.number().int().min(0),
  totalEdges: z.number().int().min(0),
  lastUpdated: z.string().datetime(),
})
export type GraphMetadata = z.infer<typeof GraphMetadataSchema>

export const GraphDataSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  stats: GraphStatsSchema.optional(),
  metadata: GraphMetadataSchema.optional(),
})
export type GraphData = z.infer<typeof GraphDataSchema>

// =============================================================================
// Centrality Metrics (CR-014)
// =============================================================================

export const CentralityMetricsSchema = z.object({
  nodeId: z.string(),
  label: z.string(),
  type: NodeTypeSchema,
  impactScore: z.number().int().min(0).max(100),
  changeRisk: z.number().int().min(0).max(100),
  reviewPriority: z.number().int().min(0).max(100),
  asil: z.string().nullable(),
  degree: z.number().int().min(0),
})
export type CentralityMetrics = z.infer<typeof CentralityMetricsSchema>
