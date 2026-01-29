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

// Response schema for centrality metrics
const CentralityMetricsSchema = z.object({
  nodeId: z.string(),
  label: z.string(),
  type: z.enum(['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase', 'InputSpec', 'Komponente']),
  pageRank: z.number(),
  betweenness: z.number(),
  degree: z.number(),
});

const CentralityResponseSchema = z.array(CentralityMetricsSchema);

/**
 * GET /api/centrality
 * Returns centrality metrics (degree-based approximation)
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const session = getReadSession();

  try {
    // Calculate degree-based centrality for all graph nodes
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
        degree,
      };
    });

    // Calculate normalized metrics
    const metrics = rawData.map(node => ({
      nodeId: node.nodeId,
      label: node.label,
      type: node.type,
      // Approximate PageRank based on normalized degree
      pageRank: Math.round((node.degree / maxDegree) * 100) / 100,
      // Approximate Betweenness (higher degree = more likely to be on paths)
      betweenness: Math.round((node.degree / maxDegree) * 0.5 * 100) / 100,
      degree: node.degree,
    }));

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
