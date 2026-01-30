/**
 * Centrality API Routes - GET /api/centrality
 * Returns centrality metrics for all nodes
 * @author andreas@siglochconsulting
 */

import { Router, Request, Response } from 'express';
import { getReadSession, toNumber } from '../db/neo4j.js';
import { ApiErrorSchema } from '../schemas/index.js';
import { z } from 'zod';

const router = Router();

// ASIL numeric values for Review-Priority calculation (CR-014)
const ASIL_VALUES: Record<string, number> = {
  QM: 10,
  A: 25,
  B: 50,
  C: 75,
  D: 100,
};

// Response schema for centrality metrics (CR-014: drei Wichtungen)
const CentralityMetricsSchema = z.object({
  nodeId: z.string(),
  label: z.string(),
  type: z.enum(['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase', 'InputSpec', 'Komponente']),
  // CR-014: Three importance metrics
  impactScore: z.number(),      // 0-100: Verbindungen (degree-basiert)
  changeRisk: z.number(),       // 0-100: Änderungsrisiko (Demo: random, später Historie)
  reviewPriority: z.number(),   // 0-100: ASIL × ChangeRisk × Impact / 10000
  asil: z.string().nullable(),  // ASIL level if available
  degree: z.number(),
});

const CentralityResponseSchema = z.array(CentralityMetricsSchema);

/**
 * GET /api/centrality
 * Returns centrality metrics with three importance scores (CR-014)
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const session = getReadSession();

  try {
    // Calculate degree-based centrality for all graph nodes, include ASIL if available
    const result = await session.run(`
      MATCH (n)
      WHERE n:StakeholderReq OR n:SystemReq OR n:SoftwareReq OR n:TestCase OR n:InputSpec OR n:Komponente
      WITH n, labels(n)[0] AS nodeType
      OPTIONAL MATCH (n)-[r]-()
      WITH n, nodeType, count(r) AS degree
      RETURN
        n.id AS nodeId,
        COALESCE(n.titel, n.name, n.id) AS label,
        nodeType AS type,
        n.asil AS asil,
        degree
      ORDER BY degree DESC
    `);

    // Find max degree for normalization
    let maxDegree = 1;
    const rawData = result.records.map(record => {
      const degree = toNumber(record.get('degree'));
      if (degree > maxDegree) maxDegree = degree;
      return {
        nodeId: record.get('nodeId') as string,
        label: record.get('label') as string,
        type: record.get('type') as string,
        asil: record.get('asil') as string | null,
        degree,
      };
    });

    // CR-014: Calculate three importance metrics
    // Use deterministic seed based on nodeId for consistent "random" changeRisk
    const hashCode = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const metrics = rawData.map(node => {
      // Impact Score: 0-100 based on normalized degree (Verbindungen)
      const impactScore = Math.round((node.degree / maxDegree) * 100);

      // Change Risk: 0-100, deterministic pseudo-random based on nodeId
      // In production this would be based on actual change history
      const changeRisk = (hashCode(node.nodeId) % 100);

      // ASIL Value: QM=10, A=25, B=50, C=75, D=100
      const asilValue = node.asil ? (ASIL_VALUES[node.asil] || 50) : 50;

      // Review Priority: ASIL × ChangeRisk × ImpactScore / 10000, normalized to 0-100
      const reviewPriority = Math.min(100, Math.round((asilValue * changeRisk * impactScore) / 10000));

      return {
        nodeId: node.nodeId,
        label: node.label,
        type: node.type,
        impactScore,
        changeRisk,
        reviewPriority,
        asil: node.asil,
        degree: node.degree,
      };
    });

    const validated = CentralityResponseSchema.parse(metrics);
    res.json(validated);
  } catch (error) {
    console.error('[Centrality] Error:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to fetch centrality',
      code: 'CENTRALITY_FETCH_ERROR',
    });
    res.status(500).json(apiError);
  } finally {
    await session.close();
  }
});

export default router;
