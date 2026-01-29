/**
 * Integration Tests - Graph API
 * @author andreas@siglochconsulting
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema matching backend (server/src/schemas/index.ts:12-37)
// Using Zod v4 syntax: z.record(keySchema, valueSchema)
const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['StakeholderReq', 'SystemReq', 'SoftwareReq', 'HardwareReq', 'TestCase', 'InputSpec', 'Komponente', 'Regel']),
  title: z.string(),
  centrality: z.number().min(0).max(1),
  properties: z.record(z.string(), z.unknown()).optional(),
})

const GraphEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  type: z.enum(['TRACED_TO', 'VERIFIED_BY', 'IMPLEMENTED_IN', 'DEPENDS_ON']),
  properties: z.record(z.string(), z.unknown()).optional(),
})

const GraphResponseSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  stats: z.object({
    nodeCount: z.number(),
    edgeCount: z.number(),
    nodesByType: z.record(z.string(), z.number()),
  }),
})

const API_BASE = 'http://localhost:3001'

describe('Graph API Integration', () => {
  it('GET /api/graph returns valid GraphResponseSchema', async () => {
    const response = await fetch(`${API_BASE}/api/graph`)

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)

    const data = await response.json()

    // Validate with Zod
    const result = GraphResponseSchema.safeParse(data)

    if (!result.success) {
      console.error('Zod validation errors:', result.error.format())
    }

    expect(result.success).toBe(true)
  })

  it('GET /api/graph returns non-empty data', async () => {
    const response = await fetch(`${API_BASE}/api/graph`)
    const data = await response.json()

    expect(data.nodes.length).toBeGreaterThan(0)
    expect(data.edges.length).toBeGreaterThan(0)
    expect(data.stats.nodeCount).toBe(data.nodes.length)
    expect(data.stats.edgeCount).toBe(data.edges.length)
  })

  it('GET /api/graph nodes have valid types', async () => {
    const response = await fetch(`${API_BASE}/api/graph`)
    const data = await response.json()

    const validTypes = ['StakeholderReq', 'SystemReq', 'SoftwareReq', 'HardwareReq', 'TestCase', 'InputSpec', 'Komponente', 'Regel']

    for (const node of data.nodes) {
      expect(validTypes).toContain(node.type)
    }
  })
})
