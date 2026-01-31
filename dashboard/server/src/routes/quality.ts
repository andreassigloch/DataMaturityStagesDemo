/**
 * Quality API Routes - GET /api/quality
 * CR-010: Returns validation, scoring, and optimization data
 * @author andreas@siglochconsulting
 */

import { Router, Request, Response } from 'express';
import { getReadSession, getWriteSession, toNumber } from '../db/neo4j.js';
import {
  ApiErrorSchema,
  QualityResponseSchema,
  ValidationResultSchema,
  ScoringResultSchema,
  OptimizationResultSchema,
  type ValidationItem,
  type ScoringItem,
  type OptimizationSuggestion,
} from '../schemas/index.js';

const router = Router();

/**
 * Execute validation rules (wirkung = 'Validierung')
 */
async function executeValidation(): Promise<{
  violations: ValidationItem[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  rulesChecked: number;
}> {
  const session = getReadSession();
  const violations: ValidationItem[] = [];
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  let rulesChecked = 0;

  try {
    // Get all active validation rules
    const rulesResult = await session.run(`
      MATCH (r:Regel)
      WHERE r.aktiv = true AND (r.wirkung = 'Validierung' OR r.wirkung IS NULL)
      RETURN r.id AS id, r.name AS name, r.cypher AS cypher,
             r.schwere AS schwere, r.domain AS domain, r.standard AS standard
    `);

    for (const record of rulesResult.records) {
      const ruleId = record.get('id') as string;
      const ruleName = record.get('name') as string;
      const cypher = record.get('cypher') as string;
      const schwere = (record.get('schwere') as string) || 'warnung';
      const domain = (record.get('domain') as string) || 'Quality';
      const standard = (record.get('standard') as string) || 'Intern';

      if (!cypher) continue;

      rulesChecked++;
      try {
        const violationResult = await session.run(cypher);
        const affected = violationResult.records.map(r => ({
          id: r.get('id') as string,
          name: (r.get('name') || r.get('titel') || r.get('id')) as string,
        }));

        if (affected.length > 0) {
          violations.push({
            ruleId,
            ruleName,
            severity: schwere as 'fehler' | 'warnung' | 'info',
            domain: domain as 'Traceability' | 'Safety' | 'Quality' | 'Architektur',
            standard,
            affectedElements: affected,
          });

          if (schwere === 'fehler') errorCount += affected.length;
          else if (schwere === 'warnung') warningCount += affected.length;
          else infoCount += affected.length;
        }
      } catch (err) {
        console.error(`[Quality] Rule ${ruleId} execution failed:`, err);
      }
    }

    // Update rule counters
    const writeSession = getWriteSession();
    try {
      for (const v of violations) {
        await writeSession.run(`
          MATCH (r:Regel {id: $ruleId})
          SET r.anwendungen = COALESCE(r.anwendungen, 0) + 1,
              r.treffer = COALESCE(r.treffer, 0) + $hits
        `, { ruleId: v.ruleId, hits: v.affectedElements.length });
      }
    } finally {
      await writeSession.close();
    }

    return { violations, errorCount, warningCount, infoCount, rulesChecked };
  } finally {
    await session.close();
  }
}

/**
 * Execute scoring rules (wirkung = 'Scoring')
 */
async function executeScoring(): Promise<{
  items: ScoringItem[];
  averageScore: number;
  rulesChecked: number;
  belowThreshold: number;
}> {
  const session = getReadSession();
  const items: ScoringItem[] = [];
  let rulesChecked = 0;
  let belowThreshold = 0;

  try {
    // Get all active scoring rules
    const rulesResult = await session.run(`
      MATCH (r:Regel)
      WHERE r.aktiv = true AND r.wirkung = 'Scoring'
      RETURN r.id AS id, r.name AS name, r.beschreibung AS beschreibung,
             r.cypher AS cypher, r.schwellwert AS schwellwert,
             r.richtung AS richtung, r.domain AS domain, r.standard AS standard
    `);

    for (const record of rulesResult.records) {
      const ruleId = record.get('id') as string;
      const ruleName = record.get('name') as string;
      const beschreibung = (record.get('beschreibung') as string) || '';
      const cypher = record.get('cypher') as string;
      const schwellwert = toNumber(record.get('schwellwert')) || 0.8;
      const richtung = (record.get('richtung') as string) || 'maximieren';
      const domain = (record.get('domain') as string) || 'Quality';
      const standard = (record.get('standard') as string) || 'Intern';

      if (!cypher) continue;

      rulesChecked++;
      try {
        const measureResult = await session.run(cypher);
        if (measureResult.records.length > 0) {
          const r = measureResult.records[0];
          const wert = toNumber(r.get('wert'));
          const von = toNumber(r.get('von'));
          const einheit = (r.get('einheit') as string) || '';
          const score = von > 0 ? Math.min(1, wert / von) : 0;

          // Calculate status based on threshold and direction
          let status: 'ok' | 'warnung' | 'kritisch' = 'ok';
          if (richtung === 'maximieren') {
            if (score < schwellwert * 0.8) status = 'kritisch';
            else if (score < schwellwert) status = 'warnung';
          } else {
            if (score > schwellwert * 1.2) status = 'kritisch';
            else if (score > schwellwert) status = 'warnung';
          }

          if (status !== 'ok') belowThreshold++;

          items.push({
            ruleId,
            ruleName,
            beschreibung,
            score,
            wert,
            von,
            einheit,
            schwellwert,
            richtung: richtung as 'minimieren' | 'maximieren',
            status,
            domain: domain as 'Traceability' | 'Safety' | 'Quality' | 'Architektur',
            standard,
          });
        }
      } catch (err) {
        console.error(`[Quality] Scoring rule ${ruleId} failed:`, err);
      }
    }

    const averageScore = items.length > 0
      ? items.reduce((sum, i) => sum + i.score, 0) / items.length
      : 0;

    return { items, averageScore, rulesChecked, belowThreshold };
  } finally {
    await session.close();
  }
}

/**
 * Generate optimization suggestions (wirkung = 'Optimierung')
 */
async function generateOptimizations(): Promise<{
  suggestions: OptimizationSuggestion[];
  totalSuggestions: number;
  rulesChecked: number;
}> {
  const session = getReadSession();
  const suggestions: OptimizationSuggestion[] = [];
  let rulesChecked = 0;

  try {
    // Get all active optimization rules
    const rulesResult = await session.run(`
      MATCH (r:Regel)
      WHERE r.aktiv = true AND r.wirkung = 'Optimierung'
      RETURN r.id AS id, r.name AS name, r.beschreibung AS beschreibung,
             r.cypher AS cypher, r.cypher_measure AS cypherMeasure,
             r.operator AS operator
    `);

    for (const record of rulesResult.records) {
      const ruleId = record.get('id') as string;
      const ruleName = record.get('name') as string;
      const beschreibung = (record.get('beschreibung') as string) || '';
      const cypher = record.get('cypher') as string;
      const cypherMeasure = record.get('cypherMeasure') as string | null;
      const operator = (record.get('operator') as string) || 'MOVE';

      if (!cypher) continue;

      rulesChecked++;
      try {
        const candidatesResult = await session.run(cypher);
        for (const c of candidatesResult.records) {
          const kandidat = (c.get('kandidat') || c.get('id')) as string;
          const von = (c.get('von') || 'current') as string;
          const nach = (c.get('nach') || 'target') as string;
          const grund = (c.get('grund') || beschreibung) as string;

          let delta: number | null = null;
          let deltaPercent: number | null = null;

          // Calculate delta if measure query exists
          if (cypherMeasure) {
            try {
              const measureResult = await session.run(cypherMeasure, { kandidat });
              if (measureResult.records.length > 0) {
                delta = toNumber(measureResult.records[0].get('delta'));
                const baseline = toNumber(measureResult.records[0].get('baseline')) || 1;
                deltaPercent = (delta / baseline) * 100;
              }
            } catch {
              // Measure failed, leave delta null
            }
          }

          suggestions.push({
            ruleId,
            ruleName,
            beschreibung,
            operator: operator as 'SPLIT' | 'MERGE' | 'MOVE' | 'CREATE',
            domain: 'Architektur' as const,
            kandidat,
            von,
            nach,
            grund,
            metricBefore: null,
            metricAfter: null,
            delta,
            deltaPercent,
          });
        }
      } catch (err) {
        console.error(`[Quality] Optimization rule ${ruleId} failed:`, err);
      }
    }

    return { suggestions, totalSuggestions: suggestions.length, rulesChecked };
  } finally {
    await session.close();
  }
}

/**
 * GET /api/quality
 * Returns all quality data: validation, scoring, optimization
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();

    // Execute all three in parallel
    const [validationData, scoringData, optimizationData] = await Promise.all([
      executeValidation(),
      executeScoring(),
      generateOptimizations(),
    ]);

    const response = QualityResponseSchema.parse({
      validation: ValidationResultSchema.parse({
        violations: validationData.violations,
        totalViolations: validationData.violations.length,
        errorCount: validationData.errorCount,
        warningCount: validationData.warningCount,
        infoCount: validationData.infoCount,
        rulesChecked: validationData.rulesChecked,
        timestamp,
      }),
      scoring: ScoringResultSchema.parse({
        items: scoringData.items,
        averageScore: scoringData.averageScore,
        rulesChecked: scoringData.rulesChecked,
        belowThreshold: scoringData.belowThreshold,
        timestamp,
      }),
      optimization: OptimizationResultSchema.parse({
        suggestions: optimizationData.suggestions,
        totalSuggestions: optimizationData.totalSuggestions,
        rulesChecked: optimizationData.rulesChecked,
        timestamp,
      }),
    });

    res.json(response);
  } catch (error) {
    console.error('[Quality] Error:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to fetch quality data',
      code: 'QUALITY_FETCH_ERROR',
    });
    res.status(500).json(apiError);
  }
});

/**
 * GET /api/quality/validation
 * Returns only validation data
 */
router.get('/validation', async (_req: Request, res: Response): Promise<void> => {
  try {
    const validationData = await executeValidation();
    const totalViolations = validationData.violations.reduce(
      (sum, v) => sum + v.affectedElements.length, 0
    );
    const response = ValidationResultSchema.parse({
      ...validationData,
      totalViolations,
      timestamp: new Date().toISOString(),
    });
    res.json(response);
  } catch (error) {
    console.error('[Quality] Validation error:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to fetch validation data',
      code: 'VALIDATION_FETCH_ERROR',
    });
    res.status(500).json(apiError);
  }
});

/**
 * GET /api/quality/scoring
 * Returns only scoring data
 */
router.get('/scoring', async (_req: Request, res: Response): Promise<void> => {
  try {
    const scoringData = await executeScoring();
    const response = ScoringResultSchema.parse({
      ...scoringData,
      timestamp: new Date().toISOString(),
    });
    res.json(response);
  } catch (error) {
    console.error('[Quality] Scoring error:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to fetch scoring data',
      code: 'SCORING_FETCH_ERROR',
    });
    res.status(500).json(apiError);
  }
});

/**
 * GET /api/quality/optimization
 * Returns only optimization data
 */
router.get('/optimization', async (_req: Request, res: Response): Promise<void> => {
  try {
    const optimizationData = await generateOptimizations();
    const response = OptimizationResultSchema.parse({
      ...optimizationData,
      timestamp: new Date().toISOString(),
    });
    res.json(response);
  } catch (error) {
    console.error('[Quality] Optimization error:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to fetch optimization data',
      code: 'OPTIMIZATION_FETCH_ERROR',
    });
    res.status(500).json(apiError);
  }
});

export default router;
