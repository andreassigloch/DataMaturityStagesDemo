/**
 * Optimization API Routes - GET /api/optimization
 * CR-015: Stufe 6 - Modul-Kohäsion iterative Optimierung
 * @author andreas@siglochconsulting
 */

import { Router, Request, Response } from 'express';
import { getReadSession, toNumber } from '../db/neo4j.js';
import { ApiErrorSchema } from '../schemas/index.js';
import { z } from 'zod';

const router = Router();

// Schema for optimization suggestion
const OptimizationSuggestionSchema = z.object({
  kandidat: z.string(),
  kandidatLabel: z.string(),
  von: z.string(),
  nach: z.string(),
  grund: z.string(),
  expectedDelta: z.number(),
  confidence: z.number(),
});

// Schema for optimization history step
const OptimizationStepSchema = z.object({
  timestamp: z.string(),
  action: z.string(),
  metricBefore: z.number(),
  metricAfter: z.number(),
  delta: z.number(),
});

// Full optimization state response
const OptimizationStateSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  beschreibung: z.string(),
  currentMetric: z.number(),
  targetMetric: z.number(),
  direction: z.enum(['maximieren', 'minimieren']),
  progressPercent: z.number(),
  suggestions: z.array(OptimizationSuggestionSchema),
  history: z.array(OptimizationStepSchema),
});

const OptimizationResponseSchema = z.array(OptimizationStateSchema);

/**
 * GET /api/optimization
 * Returns optimization state for all OPT rules with current metric and suggestions
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const session = getReadSession();

  try {
    // Get all OPT rules with their metrics
    const rulesResult = await session.run(`
      MATCH (r:Regel)
      WHERE r.wirkung = 'Optimierung' AND r.aktiv = true
      RETURN
        r.id AS ruleId,
        r.name AS ruleName,
        r.beschreibung AS beschreibung,
        r.cypher_measure AS cypherMeasure,
        r.cypher AS cypherSuggestions,
        r.schwellwert AS schwellwert,
        r.richtung AS richtung,
        r.confidence AS confidence
      ORDER BY r.id
    `);

    const optimizationStates = [];

    for (const ruleRecord of rulesResult.records) {
      const ruleId = ruleRecord.get('ruleId') as string;
      const ruleName = ruleRecord.get('ruleName') as string;
      const beschreibung = ruleRecord.get('beschreibung') as string | null;
      const cypherMeasure = ruleRecord.get('cypherMeasure') as string | null;
      const cypherSuggestions = ruleRecord.get('cypherSuggestions') as string | null;
      const schwellwert = toNumber(ruleRecord.get('schwellwert') || 0.5);
      const richtung = (ruleRecord.get('richtung') as string) || 'maximieren';
      const ruleConfidence = toNumber(ruleRecord.get('confidence') || 0.8);

      let currentMetric = 0;
      let suggestions: z.infer<typeof OptimizationSuggestionSchema>[] = [];

      // Execute measure query if available
      if (cypherMeasure) {
        try {
          const measureResult = await session.run(cypherMeasure);
          if (measureResult.records.length > 0) {
            const metricValue = measureResult.records[0].get('metricValue');
            currentMetric = toNumber(metricValue) || 0;
          }
        } catch (err) {
          console.warn(`[Optimization] Measure query failed for ${ruleId}:`, err);
        }
      }

      // Execute suggestions query if available
      if (cypherSuggestions) {
        try {
          const suggestionsResult = await session.run(cypherSuggestions);
          suggestions = suggestionsResult.records.map((record, idx) => ({
            kandidat: record.get('kandidat') as string,
            kandidatLabel: record.get('kandidat') as string,
            von: (record.get('von') as string) || 'Aktuell',
            nach: (record.get('nach') as string) || 'Optimiert',
            grund: (record.get('grund') as string) || 'Optimierungspotential erkannt',
            // Estimated delta based on position in result (first = highest potential)
            expectedDelta: Math.round((1 - idx * 0.15) * schwellwert * 10) / 100,
            confidence: ruleConfidence - idx * 0.05,
          }));
        } catch (err) {
          console.warn(`[Optimization] Suggestions query failed for ${ruleId}:`, err);
        }
      }

      // Calculate progress toward target
      const targetMetric = schwellwert;
      let progressPercent = 0;
      if (richtung === 'maximieren') {
        progressPercent = Math.min(100, Math.round((currentMetric / targetMetric) * 100));
      } else {
        progressPercent = currentMetric <= targetMetric
          ? 100
          : Math.max(0, Math.round((1 - (currentMetric - targetMetric) / currentMetric) * 100));
      }

      optimizationStates.push({
        ruleId,
        ruleName,
        beschreibung: beschreibung || '',
        currentMetric: Math.round(currentMetric * 100) / 100,
        targetMetric,
        direction: richtung as 'maximieren' | 'minimieren',
        progressPercent,
        suggestions: suggestions.slice(0, 5), // Max 5 suggestions
        history: [], // TODO: Track history in separate nodes
      });
    }

    const validated = OptimizationResponseSchema.parse(optimizationStates);
    res.json(validated);
  } catch (error) {
    console.error('[Optimization] Error:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to fetch optimization state',
      code: 'OPTIMIZATION_FETCH_ERROR',
    });
    res.status(500).json(apiError);
  } finally {
    await session.close();
  }
});

export default router;
