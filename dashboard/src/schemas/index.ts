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
  'TestCase',
  'InputSpec',
  'Komponente',
])
export type NodeType = z.infer<typeof NodeTypeSchema>

// Graph node schema - matches API response (CR-011: betweenness entfernt)
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

// Centrality metrics (CR-014: drei Wichtungen)
export const CentralityMetricsSchema = z.object({
  nodeId: z.string(),
  label: z.string(),
  type: NodeTypeSchema,
  // CR-014: Three importance metrics
  impactScore: z.number().int().min(0).max(100),    // Verbindungen (degree-basiert)
  changeRisk: z.number().int().min(0).max(100),     // Änderungsrisiko
  reviewPriority: z.number().int().min(0).max(100), // ASIL × ChangeRisk × Impact
  asil: z.string().nullable(),
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

// =============================================================================
// CR-017: Lernquellen & Pattern-Labels Alignment (aimprove ADR-001 Pattern)
// =============================================================================

// Lernquellen: Woher kommt die Information?
export const LernquelleSchema = z.enum([
  'manuell',   // ✏️ User erstellt direkt
  'feedback',  // 👍 Aus User-Feedback abgeleitet
  'pattern',   // 🔄 System erkennt Muster (>N gleiche Feedbacks)
  'chat',      // 💬 Aus Chat-Verlauf extrahiert
  'import',    // 📥 Externe Quelle (Standard, PDF)
  'similar',   // 🔗 Ähnlichkeitsanalyse (Embedding-basiert)
])
export type Lernquelle = z.infer<typeof LernquelleSchema>

// Lernaktionen: Was ist passiert?
export const LernaktionSchema = z.enum([
  'created',      // ➕ Neu erstellt
  'confirmed',    // ✅ Pattern bestätigt (Schwellwert erreicht)
  'derived',      // 🎯 Regel aus Quelle abgeleitet
  'updated',      // 🔄 Aktualisiert (Confidence, Counter)
  'consolidated', // 🔀 Patterns zusammengeführt
  'rejected',     // ❌ User lehnt Vorschlag ab
])
export type Lernaktion = z.infer<typeof LernaktionSchema>

// Erkennungsmethode: Wie wurde erkannt? (analog aimprove ADR-001)
export const ErkennungsmethodeSchema = z.enum([
  'lexical',   // Regel-basiert (Regex, Keywords)
  'semantic',  // Embedding-basiert (Ähnlichkeitssuche)
  'temporal',  // Sequenz-basiert (wiederholte Feedbacks)
  'composite', // Kombiniert mehrere Methoden
])
export type Erkennungsmethode = z.infer<typeof ErkennungsmethodeSchema>

// Backwards-compatible alias for QuelleSchema
export const QuelleSchema = LernquelleSchema
export type Quelle = Lernquelle

// Memory/Learning event (CR-017: Separate aktion from quelle)
export const MemoryEventSchema = z.object({
  id: z.string(),

  // CR-017: Separate dimensions
  aktion: LernaktionSchema,           // WAS passierte?
  quelle: LernquelleSchema,           // WOHER kommt es?
  methode: ErkennungsmethodeSchema.optional(), // WIE wurde erkannt?

  // Legacy field for backwards compatibility (mapped from aktion+quelle)
  eventType: z.enum([
    'learn', 'recall', 'consolidate', 'forget', 'connect', 'strengthen',
    'chat', 'feedback', 'pattern',
  ]).optional(),

  beschreibung: z.string(),
  // Alias for legacy code
  description: z.string().optional(),
  timestamp: z.string().datetime({ offset: true }),
  confidence: z.number().min(0).max(1).optional(),
  relatedNodes: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),

  // CR-016: Chat-specific fields (when quelle='chat')
  chatPreview: z.object({
    messageCount: z.number(),
    excerpt: z.string(),
  }).optional(),

  // CR-016: Derived rule (when aktion='derived')
  derivedRule: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
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

// Tab configuration (CR-015: optimization tab added)
export const TabSchema = z.enum(['graph', 'timeline', 'centrality', 'quality', 'rules', 'optimization'])
export type Tab = z.infer<typeof TabSchema>

// =============================================================================
// CR-010: Regel-Schema Redesign - Funktions-basierte Taxonomie
// =============================================================================

// Regel Taxonomie Enums
export const WirkungSchema = z.enum(['Validierung', 'Scoring', 'Optimierung'])
export type Wirkung = z.infer<typeof WirkungSchema>

export const EbeneSchema = z.enum(['Struktur', 'Inhalt', 'Konsistenz', 'Vollstaendigkeit'])
export type Ebene = z.infer<typeof EbeneSchema>

export const DomainSchema = z.enum(['Traceability', 'Safety', 'Quality', 'Architektur'])
export type Domain = z.infer<typeof DomainSchema>

export const SchwereSchema = z.enum(['fehler', 'warnung', 'info'])
export type Schwere = z.infer<typeof SchwereSchema>

export const RichtungSchema = z.enum(['minimieren', 'maximieren'])
export type Richtung = z.infer<typeof RichtungSchema>

export const OperatorSchema = z.enum(['SPLIT', 'MERGE', 'MOVE', 'CREATE'])
export type Operator = z.infer<typeof OperatorSchema>

// Validierung Result (Verbesserungsvorschläge)
export const ValidationItemSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  ruleType: z.string(), // ebene
  severity: SchwereSchema,
  domain: DomainSchema,
  standard: z.string(),
  affectedElements: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string()
  }))
})
export type ValidationItem = z.infer<typeof ValidationItemSchema>

export const ValidationResultSchema = z.object({
  totalViolations: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  warningCount: z.number().int().min(0),
  infoCount: z.number().int().min(0),
  violations: z.array(ValidationItemSchema),
  rulesChecked: z.number().int().min(0),
  summary: z.object({
    byStandard: z.record(z.string(), z.object({
      errors: z.number().int().min(0),
      warnings: z.number().int().min(0),
      info: z.number().int().min(0)
    })),
    byDomain: z.record(z.string(), z.number().int().min(0))
  })
})
export type ValidationResult = z.infer<typeof ValidationResultSchema>

// Scoring Result (Kennzahlen)
export const ScoringItemSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  beschreibung: z.string(),
  wert: z.number(),
  von: z.number(),
  score: z.number().min(0).max(1),
  einheit: z.string(),
  schwellwert: z.number(),
  richtung: RichtungSchema,
  status: z.enum(['ok', 'warnung', 'kritisch']),
  domain: DomainSchema,
  standard: z.string()
})
export type ScoringItem = z.infer<typeof ScoringItemSchema>

export const ScoringResultSchema = z.object({
  items: z.array(ScoringItemSchema),
  rulesChecked: z.number().int().min(0),
  averageScore: z.number().min(0).max(1),
  belowThreshold: z.number().int().min(0)
})
export type ScoringResult = z.infer<typeof ScoringResultSchema>

// Optimierung Result (Delta-Vorschläge)
export const OptimizationSuggestionSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  beschreibung: z.string(),
  kandidat: z.string(),
  von: z.string(),
  nach: z.string(),
  grund: z.string(),
  operator: OperatorSchema,
  metricBefore: z.number().nullable(),
  metricAfter: z.number().nullable(),
  delta: z.number().nullable(),
  deltaPercent: z.number().nullable(),
  domain: DomainSchema
})
export type OptimizationSuggestion = z.infer<typeof OptimizationSuggestionSchema>

export const OptimizationResultSchema = z.object({
  suggestions: z.array(OptimizationSuggestionSchema),
  rulesChecked: z.number().int().min(0),
  totalSuggestions: z.number().int().min(0)
})
export type OptimizationResult = z.infer<typeof OptimizationResultSchema>

// Quality Tab enum for sub-sections
export const QualityTabSchema = z.enum(['validierung', 'scoring', 'optimierung'])
export type QualityTab = z.infer<typeof QualityTabSchema>

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
