/**
 * Zod Schema Validation Tests
 * CR-009: Dashboard Schema Tests
 * @author andreas@siglochconsulting
 */

import { describe, it, expect } from 'vitest'
import {
  GraphNodeSchema,
  GraphEdgeSchema,
  NodeTypeSchema,
  MemoryEventSchema,
} from '../src/schemas'

describe('NodeTypeSchema', () => {
  it('accepts valid CR-009 node types', () => {
    // 6 graph types matching database (Regel in separate Rules tab)
    const validTypes = [
      'StakeholderReq',
      'SystemReq',
      'SoftwareReq',
      'TestCase',
      'InputSpec',
      'Komponente',
    ]

    for (const type of validTypes) {
      expect(NodeTypeSchema.safeParse(type).success).toBe(true)
    }
  })

  it('rejects invalid node types', () => {
    expect(NodeTypeSchema.safeParse('InvalidType').success).toBe(false)
    expect(NodeTypeSchema.safeParse('document').success).toBe(false)
  })
})

describe('GraphNodeSchema', () => {
  it('validates a valid SystemReq node', () => {
    const node = {
      id: 'SYS-003',
      label: 'Bremslicht <50ms',
      type: 'SystemReq',
      pageRank: 0.42,
      betweenness: 0.15,
    }
    const result = GraphNodeSchema.safeParse(node)
    expect(result.success).toBe(true)
  })

  it('validates node without optional centrality scores', () => {
    const node = {
      id: 'STK-001',
      label: 'Abbiegeabsicht signalisieren',
      type: 'StakeholderReq',
    }
    const result = GraphNodeSchema.safeParse(node)
    expect(result.success).toBe(true)
  })

  it('validates Komponente node', () => {
    const node = {
      id: 'K-001',
      label: 'ECU Blinker',
      type: 'Komponente',
    }
    const result = GraphNodeSchema.safeParse(node)
    expect(result.success).toBe(true)
  })

  it('rejects node with invalid type', () => {
    const node = {
      id: 'X-001',
      label: 'Invalid',
      type: 'InvalidType',
    }
    const result = GraphNodeSchema.safeParse(node)
    expect(result.success).toBe(false)
  })
})

describe('GraphEdgeSchema', () => {
  it('validates a valid edge', () => {
    const edge = {
      id: 'edge-1',
      from: 'STK-001',
      to: 'SYS-001',
      type: 'TRACED_TO',
      weight: 1,
    }
    const result = GraphEdgeSchema.safeParse(edge)
    expect(result.success).toBe(true)
  })
})

describe('MemoryEventSchema', () => {
  it('validates a learn event', () => {
    const event = {
      id: 'LE-001',
      eventType: 'learn',
      description: 'Pattern erkannt',
      timestamp: '2026-01-28T17:05:45+00:00',
    }
    const result = MemoryEventSchema.safeParse(event)
    expect(result.success).toBe(true)
  })
})
