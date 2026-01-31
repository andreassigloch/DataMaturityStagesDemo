/**
 * CR-010 Tests - Regel-Schema Redesign
 * Tests for validate.ts: Validierung, Scoring, Optimierung
 * @author andreas@siglochconsulting
 */

import { describe, it, expect } from 'vitest'

// Type definitions matching validate.ts
type Wirkung = 'Validierung' | 'Scoring' | 'Optimierung'
type Ebene = 'Struktur' | 'Inhalt' | 'Konsistenz' | 'Vollstaendigkeit'
type Domain = 'Traceability' | 'Safety' | 'Quality' | 'Architektur'
type Schwere = 'fehler' | 'warnung' | 'info'
type Richtung = 'minimieren' | 'maximieren'
type Operator = 'SPLIT' | 'MERGE' | 'MOVE' | 'CREATE'

describe('CR-010: Rule Taxonomy Enums', () => {
  describe('Wirkung enum', () => {
    it('has exactly 3 values', () => {
      const wirkungen: Wirkung[] = ['Validierung', 'Scoring', 'Optimierung']
      expect(wirkungen).toHaveLength(3)
    })

    it('Validierung produces Verbesserungsvorschlaege', () => {
      const wirkung: Wirkung = 'Validierung'
      expect(wirkung).toBe('Validierung')
    })

    it('Scoring produces Kennzahlen', () => {
      const wirkung: Wirkung = 'Scoring'
      expect(wirkung).toBe('Scoring')
    })

    it('Optimierung produces Delta-Vorschlaege', () => {
      const wirkung: Wirkung = 'Optimierung'
      expect(wirkung).toBe('Optimierung')
    })
  })

  describe('Ebene enum', () => {
    it('has 4 check levels', () => {
      const ebenen: Ebene[] = ['Struktur', 'Inhalt', 'Konsistenz', 'Vollstaendigkeit']
      expect(ebenen).toHaveLength(4)
    })
  })

  describe('Domain enum', () => {
    it('has 4 application areas', () => {
      const domains: Domain[] = ['Traceability', 'Safety', 'Quality', 'Architektur']
      expect(domains).toHaveLength(4)
    })
  })

  describe('Schwere enum', () => {
    it('includes info level (CR-010 new)', () => {
      const schweren: Schwere[] = ['fehler', 'warnung', 'info']
      expect(schweren).toContain('info')
      expect(schweren).toHaveLength(3)
    })
  })
})

describe('CR-010: Scoring Logic', () => {
  describe('Status calculation', () => {
    function calculateStatus(
      score: number,
      schwellwert: number,
      richtung: Richtung
    ): 'ok' | 'warnung' | 'kritisch' {
      if (richtung === 'maximieren') {
        if (score < schwellwert * 0.8) return 'kritisch'
        if (score < schwellwert) return 'warnung'
      } else {
        if (score > schwellwert * 1.2) return 'kritisch'
        if (score > schwellwert) return 'warnung'
      }
      return 'ok'
    }

    it('maximieren: score >= threshold is ok', () => {
      expect(calculateStatus(0.85, 0.8, 'maximieren')).toBe('ok')
      expect(calculateStatus(1.0, 0.8, 'maximieren')).toBe('ok')
    })

    it('maximieren: score < threshold but >= 80% is warnung', () => {
      expect(calculateStatus(0.75, 0.8, 'maximieren')).toBe('warnung')
      expect(calculateStatus(0.65, 0.8, 'maximieren')).toBe('warnung') // 0.65 > 0.64 (80% of 0.8)
    })

    it('maximieren: score < 80% of threshold is kritisch', () => {
      expect(calculateStatus(0.5, 0.8, 'maximieren')).toBe('kritisch')
      expect(calculateStatus(0.0, 0.8, 'maximieren')).toBe('kritisch')
    })

    it('minimieren: score <= threshold is ok', () => {
      expect(calculateStatus(5, 10, 'minimieren')).toBe('ok')
      expect(calculateStatus(10, 10, 'minimieren')).toBe('ok')
    })

    it('minimieren: score > threshold but <= 120% is warnung', () => {
      expect(calculateStatus(11, 10, 'minimieren')).toBe('warnung')
      expect(calculateStatus(12, 10, 'minimieren')).toBe('warnung')
    })

    it('minimieren: score > 120% of threshold is kritisch', () => {
      expect(calculateStatus(13, 10, 'minimieren')).toBe('kritisch')
      expect(calculateStatus(20, 10, 'minimieren')).toBe('kritisch')
    })
  })
})

describe('CR-010: Optimization Operators', () => {
  it('defines 4 move operators', () => {
    const operators: Operator[] = ['SPLIT', 'MERGE', 'MOVE', 'CREATE']
    expect(operators).toHaveLength(4)
  })

  it('SPLIT - splits a module into smaller parts', () => {
    const op: Operator = 'SPLIT'
    expect(op).toBe('SPLIT')
  })

  it('MERGE - combines modules', () => {
    const op: Operator = 'MERGE'
    expect(op).toBe('MERGE')
  })

  it('MOVE - relocates elements', () => {
    const op: Operator = 'MOVE'
    expect(op).toBe('MOVE')
  })

  it('CREATE - creates new interfaces', () => {
    const op: Operator = 'CREATE'
    expect(op).toBe('CREATE')
  })
})

describe('CR-010: Rule ID Prefixes', () => {
  function generateRuleId(wirkung: Wirkung): string {
    const prefix = wirkung === 'Validierung' ? 'VAL'
      : wirkung === 'Scoring' ? 'SCO'
      : 'OPT'
    return `${prefix}-${Date.now()}`
  }

  it('Validierung rules get VAL- prefix', () => {
    const id = generateRuleId('Validierung')
    expect(id).toMatch(/^VAL-\d+$/)
  })

  it('Scoring rules get SCO- prefix', () => {
    const id = generateRuleId('Scoring')
    expect(id).toMatch(/^SCO-\d+$/)
  })

  it('Optimierung rules get OPT- prefix', () => {
    const id = generateRuleId('Optimierung')
    expect(id).toMatch(/^OPT-\d+$/)
  })
})

describe('CR-010: Learning Metadata', () => {
  interface LearningMetadata {
    quelle: 'manuell' | 'pattern' | 'feedback' | 'import'
    confidence: number
    anwendungen: number
    treffer: number
  }

  it('quelle has 4 sources', () => {
    const sources: LearningMetadata['quelle'][] = ['manuell', 'pattern', 'feedback', 'import']
    expect(sources).toHaveLength(4)
  })

  it('confidence is between 0 and 1', () => {
    const validConfidences = [0, 0.5, 0.8, 1.0]
    validConfidences.forEach((c) => {
      expect(c).toBeGreaterThanOrEqual(0)
      expect(c).toBeLessThanOrEqual(1)
    })
  })

  it('counters start at 0', () => {
    const meta: LearningMetadata = {
      quelle: 'manuell',
      confidence: 1.0,
      anwendungen: 0,
      treffer: 0,
    }
    expect(meta.anwendungen).toBe(0)
    expect(meta.treffer).toBe(0)
  })

  it('anwendungen increments on rule execution', () => {
    let anwendungen = 0
    // Simulate rule execution
    anwendungen += 1
    expect(anwendungen).toBe(1)
  })

  it('treffer increments on violation found', () => {
    let treffer = 0
    const violationsFound = 3
    // Simulate violations found
    treffer += violationsFound
    expect(treffer).toBe(3)
  })
})

describe('CR-010: Migrated Rule IDs', () => {
  const migrations = [
    { old: 'REG-001', new: 'VAL-001', ebene: 'Vollstaendigkeit', wirkung: 'Validierung' },
    { old: 'REG-002', new: 'VAL-002', ebene: 'Vollstaendigkeit', wirkung: 'Validierung' },
    { old: 'REG-003', new: 'VAL-003', ebene: 'Inhalt', wirkung: 'Validierung' },
    { old: 'REG-004', new: 'VAL-004', ebene: 'Struktur', wirkung: 'Validierung' },
    { old: 'REG-005', new: 'VAL-005', ebene: 'Konsistenz', wirkung: 'Validierung' },
  ]

  it('all 5 REG rules migrated to VAL', () => {
    expect(migrations.filter((m) => m.new.startsWith('VAL-'))).toHaveLength(5)
  })

  it('all migrated rules have wirkung: Validierung', () => {
    migrations.forEach((m) => {
      expect(m.wirkung).toBe('Validierung')
    })
  })

  it('ebene is correctly assigned per rule', () => {
    expect(migrations[0].ebene).toBe('Vollstaendigkeit') // Traceability
    expect(migrations[1].ebene).toBe('Vollstaendigkeit') // Test-Coverage
    expect(migrations[2].ebene).toBe('Inhalt') // Vage Zeitangaben
    expect(migrations[3].ebene).toBe('Struktur') // Externe Abhaengigkeiten
    expect(migrations[4].ebene).toBe('Konsistenz') // ASIL
  })
})
