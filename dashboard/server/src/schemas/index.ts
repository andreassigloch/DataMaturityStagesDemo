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
  type: z.enum(['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase', 'InputSpec', 'Komponente']),
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
// Rules (Regel) Schemas - separate from graph visualization
// ============================================================================

// CR-010: Updated Regel schema with wirkung taxonomy
export const RegelSchema = z.object({
  id: z.string(),
  name: z.string(),
  wirkung: z.enum(['Validierung', 'Scoring', 'Optimierung']).optional(),
  ebene: z.enum(['Struktur', 'Inhalt', 'Konsistenz', 'Vollstaendigkeit']).optional(),
  domain: z.enum(['Traceability', 'Safety', 'Quality', 'Architektur']).optional(),
  cypher: z.string().nullable(),
  schwere: z.enum(['fehler', 'warnung', 'info']),
  standard: z.string(),
  aktiv: z.boolean(),
  createdAt: z.string().datetime().optional(),
});

export const RulesResponseSchema = z.object({
  rules: z.array(RegelSchema),
  stats: z.object({
    total: z.number(),
    active: z.number(),
    byStandard: z.record(z.number()),
    bySchwere: z.record(z.number()),
  }),
});

export type Regel = z.infer<typeof RegelSchema>;
export type RulesResponse = z.infer<typeof RulesResponseSchema>;

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

// ============================================================================
// CR-017: Lernquellen & Pattern-Labels Alignment (aimprove ADR-001 Pattern)
// ============================================================================

// Lernquellen: Woher kommt die Information?
export const LernquelleSchema = z.enum([
  'manuell',   // ✏️ User erstellt direkt
  'feedback',  // 👍 Aus User-Feedback abgeleitet
  'pattern',   // 🔄 System erkennt Muster (>N gleiche Feedbacks)
  'chat',      // 💬 Aus Chat-Verlauf extrahiert
  'import',    // 📥 Externe Quelle (Standard, PDF)
  'similar',   // 🔗 Ähnlichkeitsanalyse (Embedding-basiert)
]);
export type Lernquelle = z.infer<typeof LernquelleSchema>;

// Lernaktionen: Was ist passiert?
export const LernaktionSchema = z.enum([
  'created',      // ➕ Neu erstellt
  'confirmed',    // ✅ Pattern bestätigt
  'derived',      // 🎯 Regel abgeleitet
  'updated',      // 🔄 Aktualisiert
  'consolidated', // 🔀 Zusammengeführt
  'rejected',     // ❌ Abgelehnt
]);
export type Lernaktion = z.infer<typeof LernaktionSchema>;

// Erkennungsmethode: Wie wurde erkannt?
export const ErkennungsmethodeSchema = z.enum([
  'lexical',   // Regel-basiert (Regex, Keywords)
  'semantic',  // Embedding-basiert
  'temporal',  // Sequenz-basiert
  'composite', // Kombiniert
]);
export type Erkennungsmethode = z.infer<typeof ErkennungsmethodeSchema>;

// Memory Event with CR-017 dimensions
export const MemoryEventSchema = z.object({
  id: z.string(),
  aktion: LernaktionSchema,
  quelle: LernquelleSchema,
  methode: ErkennungsmethodeSchema.optional(),
  beschreibung: z.string(),
  timestamp: z.string().datetime(),
  confidence: z.number().min(0).max(1).optional(),
  relatedNodes: z.array(z.string()).optional(),
  chatPreview: z.object({
    messageCount: z.number(),
    excerpt: z.string(),
  }).optional(),
  derivedRule: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
});
export type MemoryEvent = z.infer<typeof MemoryEventSchema>;

// ============================================================================
// CR-010: Quality Schemas (Validation, Scoring, Optimization)
// ============================================================================

export const SchwereSchema = z.enum(['fehler', 'warnung', 'info']);
export const WirkungSchema = z.enum(['Validierung', 'Scoring', 'Optimierung']);
export const EbeneSchema = z.enum(['Struktur', 'Inhalt', 'Konsistenz', 'Vollstaendigkeit']);
export const DomainSchema = z.enum(['Traceability', 'Safety', 'Quality', 'Architektur']);
export const RichtungSchema = z.enum(['minimieren', 'maximieren']);
export const OperatorSchema = z.enum(['SPLIT', 'MERGE', 'MOVE', 'CREATE']);

export const ValidationItemSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  severity: SchwereSchema,
  domain: DomainSchema,
  standard: z.string(),
  affectedElements: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
});

export const ValidationResultSchema = z.object({
  violations: z.array(ValidationItemSchema),
  errorCount: z.number(),
  warningCount: z.number(),
  infoCount: z.number(),
  timestamp: z.string(),
});

export const ScoringItemSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  beschreibung: z.string(),
  score: z.number(),
  wert: z.number(),
  von: z.number(),
  einheit: z.string(),
  schwellwert: z.number(),
  richtung: RichtungSchema,
  status: z.enum(['ok', 'warnung', 'kritisch']),
  domain: DomainSchema,
  standard: z.string(),
});

export const ScoringResultSchema = z.object({
  items: z.array(ScoringItemSchema),
  averageScore: z.number(),
  timestamp: z.string(),
});

export const OptimizationSuggestionSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  beschreibung: z.string(),
  operator: OperatorSchema,
  kandidat: z.string(),
  von: z.string(),
  nach: z.string(),
  grund: z.string(),
  delta: z.number().nullable(),
  deltaPercent: z.number().nullable(),
});

export const OptimizationResultSchema = z.object({
  suggestions: z.array(OptimizationSuggestionSchema),
  totalSuggestions: z.number(),
  timestamp: z.string(),
});

export const QualityResponseSchema = z.object({
  validation: ValidationResultSchema,
  scoring: ScoringResultSchema,
  optimization: OptimizationResultSchema,
});

export type ValidationItem = z.infer<typeof ValidationItemSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type ScoringItem = z.infer<typeof ScoringItemSchema>;
export type ScoringResult = z.infer<typeof ScoringResultSchema>;
export type OptimizationSuggestion = z.infer<typeof OptimizationSuggestionSchema>;
export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;
export type QualityResponse = z.infer<typeof QualityResponseSchema>;
