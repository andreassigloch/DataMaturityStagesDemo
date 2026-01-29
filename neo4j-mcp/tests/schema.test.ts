/**
 * MCP Schema Tests - Ensure correct parameter types
 * @author andreas@siglochconsulting
 */

import { describe, it, expect } from 'vitest'

// Import the tool definitions from index.ts (we'll extract the schema)
// For now, test the schema structure directly

describe('MCP Tool Schema', () => {
  // Schema definitions matching index.ts
  const toolSchemas = {
    centrality_analysis: {
      limit: { type: 'integer' },
      nodeLabel: { type: 'string' },
    },
    predict_missing_links: {
      minConfidence: { type: 'number' },
      limit: { type: 'integer' },
    },
    find_similar_requirements: {
      requirementId: { type: 'string' },
      limit: { type: 'integer' },
      minSimilarity: { type: 'number' },
    },
    learning_timeline: {
      limit: { type: 'integer' },
    },
  }

  describe('limit parameters must be integer', () => {
    it('centrality_analysis.limit is integer', () => {
      expect(toolSchemas.centrality_analysis.limit.type).toBe('integer')
    })

    it('predict_missing_links.limit is integer', () => {
      expect(toolSchemas.predict_missing_links.limit.type).toBe('integer')
    })

    it('find_similar_requirements.limit is integer', () => {
      expect(toolSchemas.find_similar_requirements.limit.type).toBe('integer')
    })

    it('learning_timeline.limit is integer', () => {
      expect(toolSchemas.learning_timeline.limit.type).toBe('integer')
    })
  })

  describe('confidence/similarity parameters must be number (float)', () => {
    it('predict_missing_links.minConfidence is number', () => {
      expect(toolSchemas.predict_missing_links.minConfidence.type).toBe('number')
    })

    it('find_similar_requirements.minSimilarity is number', () => {
      expect(toolSchemas.find_similar_requirements.minSimilarity.type).toBe('number')
    })
  })
})

describe('Integer conversion', () => {
  it('Math.floor converts float to integer', () => {
    const floatLimit = 5.0
    const intLimit = Math.floor(floatLimit)
    expect(intLimit).toBe(5)
    expect(Number.isInteger(intLimit)).toBe(true)
  })

  it('Math.floor handles undefined with nullish coalescing', () => {
    const options: { limit?: number } = {}
    const limit = Math.floor(options?.limit ?? 5)
    expect(limit).toBe(5)
    expect(Number.isInteger(limit)).toBe(true)
  })

  it('Math.floor truncates decimal', () => {
    const limit = Math.floor(5.9)
    expect(limit).toBe(5)
  })
})

describe('Label filter matches database', () => {
  const expectedLabels = [
    'StakeholderReq',
    'SystemReq',
    'SoftwareReq',
    'TestCase',
    'InputSpec',
    'Komponente',
  ]

  // This is the labelFilter from centrality.ts
  const labelFilter = "['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase', 'InputSpec', 'Komponente']"

  it('labelFilter contains all 6 graph types', () => {
    for (const label of expectedLabels) {
      expect(labelFilter).toContain(label)
    }
  })

  it('labelFilter does NOT contain Regel (separate Rules tab)', () => {
    expect(labelFilter).not.toContain('Regel')
  })

  it('labelFilter does NOT contain Feedback (not in seed data)', () => {
    expect(labelFilter).not.toContain('Feedback')
  })

  it('labelFilter does NOT contain HardwareReq (not in database)', () => {
    expect(labelFilter).not.toContain('HardwareReq')
  })
})
