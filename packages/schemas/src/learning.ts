/**
 * Learning Schemas - CR-017 Lernquellen & Pattern-Labels
 * @author andreas@siglochconsulting
 * @package @maturity/schemas
 */

import { z } from 'zod'

// =============================================================================
// CR-017: Lernquellen & Aktionen (aimprove ADR-001 Pattern)
// =============================================================================

/** Lernquellen: Woher kommt die Information? */
export const LernquelleSchema = z.enum([
  'manuell',   // ✏️ User erstellt direkt
  'feedback',  // 👍 Aus User-Feedback abgeleitet
  'pattern',   // 🔄 System erkennt Muster (>N gleiche Feedbacks)
  'chat',      // 💬 Aus Chat-Verlauf extrahiert
  'import',    // 📥 Externe Quelle (Standard, PDF)
  'similar',   // 🔗 Ähnlichkeitsanalyse (Embedding-basiert)
])
export type Lernquelle = z.infer<typeof LernquelleSchema>

/** Lernaktionen: Was ist passiert? */
export const LernaktionSchema = z.enum([
  'created',      // ➕ Neu erstellt
  'confirmed',    // ✅ Pattern bestätigt (Schwellwert erreicht)
  'derived',      // 🎯 Regel aus Quelle abgeleitet
  'updated',      // 🔄 Aktualisiert (Confidence, Counter)
  'consolidated', // 🔀 Patterns zusammengeführt
  'rejected',     // ❌ User lehnt Vorschlag ab
])
export type Lernaktion = z.infer<typeof LernaktionSchema>

/** Erkennungsmethode: Wie wurde erkannt? */
export const ErkennungsmethodeSchema = z.enum([
  'lexical',   // Regel-basiert (Regex, Keywords)
  'semantic',  // Embedding-basiert (Ähnlichkeitssuche)
  'temporal',  // Sequenz-basiert (wiederholte Feedbacks)
  'composite', // Kombiniert mehrere Methoden
])
export type Erkennungsmethode = z.infer<typeof ErkennungsmethodeSchema>

// Backwards-compatible alias
export const QuelleSchema = LernquelleSchema
export type Quelle = Lernquelle

// =============================================================================
// Memory Event
// =============================================================================

export const ChatPreviewSchema = z.object({
  messageCount: z.number(),
  excerpt: z.string(),
})
export type ChatPreview = z.infer<typeof ChatPreviewSchema>

export const DerivedRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
})
export type DerivedRule = z.infer<typeof DerivedRuleSchema>

/** Legacy event types for backwards compatibility */
export const LegacyEventTypeSchema = z.enum([
  'learn', 'recall', 'consolidate', 'forget', 'connect', 'strengthen',
  'chat', 'feedback', 'pattern',
])
export type LegacyEventType = z.infer<typeof LegacyEventTypeSchema>

export const MemoryEventSchema = z.object({
  id: z.string(),

  // CR-017: Separate dimensions
  aktion: LernaktionSchema,
  quelle: LernquelleSchema,
  methode: ErkennungsmethodeSchema.optional(),

  // Legacy field for backwards compatibility
  eventType: LegacyEventTypeSchema.optional(),

  beschreibung: z.string(),
  description: z.string().optional(), // Alias for legacy code
  timestamp: z.string().datetime(),
  confidence: z.number().min(0).max(1).optional(),
  relatedNodes: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),

  // CR-016: Chat-specific fields
  chatPreview: ChatPreviewSchema.optional(),
  derivedRule: DerivedRuleSchema.optional(),
})
export type MemoryEvent = z.infer<typeof MemoryEventSchema>

// =============================================================================
// Detected Pattern (Graph-based)
// =============================================================================

export const PatternTypeSchema = z.enum([
  'cluster',
  'hierarchy',
  'bridge',
  'hub',
  'cycle',
  'chain',
])
export type PatternType = z.infer<typeof PatternTypeSchema>

export const DetectedPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  nodeIds: z.array(z.string()),
  patternType: PatternTypeSchema,
  detectedAt: z.string().datetime(),
})
export type DetectedPattern = z.infer<typeof DetectedPatternSchema>

// =============================================================================
// Learning Pattern (from detect_patterns tool)
// =============================================================================

export const LearningPatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  occurrences: z.number(),
  lastSeen: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  status: z.enum(['candidate', 'confirmed']).optional(),
})
export type LearningPattern = z.infer<typeof LearningPatternSchema>

// =============================================================================
// Memory Stats
// =============================================================================

export const MemoryStatsSchema = z.object({
  feedbackCount: z.number(),
  patternCount: z.number(),
  eventCount: z.number(),
  lastUpdated: z.string().datetime(),
  patterns: z.array(LearningPatternSchema),
  feedbackByType: z.record(z.number()),
})
export type MemoryStats = z.infer<typeof MemoryStatsSchema>
