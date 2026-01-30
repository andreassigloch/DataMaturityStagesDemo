/**
 * Quality Schemas - Validation, Scoring, Optimization Results
 * @author andreas@siglochconsulting
 * @package @maturity/schemas
 */

import { z } from 'zod'
import { DomainSchema, RichtungSchema, OperatorSchema, SchwereSchema } from './rules.js'

// =============================================================================
// Validation Result (Verbesserungsvorschläge)
// =============================================================================

export const AffectedElementSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
})
export type AffectedElement = z.infer<typeof AffectedElementSchema>

export const ValidationItemSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  ruleType: z.string().optional(),
  severity: SchwereSchema,
  domain: DomainSchema,
  standard: z.string(),
  affectedElements: z.array(AffectedElementSchema),
})
export type ValidationItem = z.infer<typeof ValidationItemSchema>

export const ValidationSummarySchema = z.object({
  byStandard: z.record(z.string(), z.object({
    errors: z.number().int().min(0),
    warnings: z.number().int().min(0),
    info: z.number().int().min(0),
  })),
  byDomain: z.record(z.string(), z.number().int().min(0)),
})
export type ValidationSummary = z.infer<typeof ValidationSummarySchema>

export const ValidationResultSchema = z.object({
  totalViolations: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  warningCount: z.number().int().min(0),
  infoCount: z.number().int().min(0),
  violations: z.array(ValidationItemSchema),
  rulesChecked: z.number().int().min(0),
  summary: ValidationSummarySchema.optional(),
  timestamp: z.string().optional(),
})
export type ValidationResult = z.infer<typeof ValidationResultSchema>

// =============================================================================
// Scoring Result (Kennzahlen)
// =============================================================================

export const ScoringStatusSchema = z.enum(['ok', 'warnung', 'kritisch'])
export type ScoringStatus = z.infer<typeof ScoringStatusSchema>

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
  status: ScoringStatusSchema,
  domain: DomainSchema,
  standard: z.string(),
})
export type ScoringItem = z.infer<typeof ScoringItemSchema>

export const ScoringResultSchema = z.object({
  items: z.array(ScoringItemSchema),
  rulesChecked: z.number().int().min(0),
  averageScore: z.number().min(0).max(1),
  belowThreshold: z.number().int().min(0),
  timestamp: z.string().optional(),
})
export type ScoringResult = z.infer<typeof ScoringResultSchema>

// =============================================================================
// Optimization Result (Delta-Vorschläge)
// =============================================================================

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
  domain: DomainSchema,
})
export type OptimizationSuggestion = z.infer<typeof OptimizationSuggestionSchema>

export const OptimizationResultSchema = z.object({
  suggestions: z.array(OptimizationSuggestionSchema),
  rulesChecked: z.number().int().min(0),
  totalSuggestions: z.number().int().min(0),
  timestamp: z.string().optional(),
})
export type OptimizationResult = z.infer<typeof OptimizationResultSchema>

// =============================================================================
// Combined Quality Response
// =============================================================================

export const QualityResponseSchema = z.object({
  validation: ValidationResultSchema,
  scoring: ScoringResultSchema,
  optimization: OptimizationResultSchema,
})
export type QualityResponse = z.infer<typeof QualityResponseSchema>
