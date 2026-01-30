/**
 * API Schemas - Request/Response Wrappers
 * @author andreas@siglochconsulting
 * @package @maturity/schemas
 */

import { z } from 'zod'

// =============================================================================
// API Response Wrapper
// =============================================================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime(),
  })

// Pre-built response type for simple success/error
export const SimpleApiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
})
export type SimpleApiResponse = z.infer<typeof SimpleApiResponseSchema>

// =============================================================================
// API Error
// =============================================================================

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
})
export type ApiError = z.infer<typeof ApiErrorSchema>

// =============================================================================
// Feedback Request/Response
// =============================================================================

export const FeedbackTypeSchema = z.enum([
  'rule_violation',
  'compliance_issue',
  'traceability_gap',
  'test_coverage',
  'manual_annotation',
  'review',
  'observation',
  'question',
])
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>

export const FeedbackSeveritySchema = z.enum(['error', 'warning', 'info'])
export type FeedbackSeverity = z.infer<typeof FeedbackSeveritySchema>

export const FeedbackRequestSchema = z.object({
  nodeId: z.string().min(1).optional(),
  targetId: z.string().min(1).optional(),
  type: FeedbackTypeSchema.optional(),
  severity: FeedbackSeveritySchema.optional(),
  message: z.string().min(1).max(1000).optional(),
  issue: z.string().min(1).max(1000).optional(),
  context: z.record(z.unknown()).optional(),
}).refine(
  data => data.nodeId || data.targetId,
  { message: 'Either nodeId or targetId is required' }
).refine(
  data => data.message || data.issue,
  { message: 'Either message or issue is required' }
)
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>

export const FeedbackResponseSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  type: FeedbackTypeSchema,
  severity: FeedbackSeveritySchema,
  message: z.string(),
  createdAt: z.string().datetime(),
  processed: z.boolean(),
})
export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>
