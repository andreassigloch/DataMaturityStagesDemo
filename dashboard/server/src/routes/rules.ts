/**
 * Rules API Routes - GET /api/rules
 * Returns all Regel nodes (validation rules)
 * @author andreas@siglochconsulting
 */

import { Router, Request, Response } from 'express';
import { getReadSession } from '../db/neo4j.js';
import { RulesResponseSchema, ApiErrorSchema } from '../schemas/index.js';

const router = Router();

/**
 * GET /api/rules
 * Returns all validation rules (Regel nodes)
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const session = getReadSession();

  try {
    // CR-010: Updated query for new rule schema
    const result = await session.run(`
      MATCH (r:Regel)
      RETURN
        r.id AS id,
        r.name AS name,
        r.wirkung AS wirkung,
        r.ebene AS ebene,
        r.domain AS domain,
        r.cypher AS cypher,
        r.schwere AS schwere,
        r.standard AS standard,
        COALESCE(r.aktiv, true) AS aktiv,
        r.erstelltAm AS createdAt
      ORDER BY r.wirkung, r.standard, r.name
    `);

    // CR-010: Updated mapping for new rule schema
    const rules = result.records.map(record => {
      const createdAtRaw = record.get('createdAt');
      let createdAt: string | undefined;
      if (createdAtRaw) {
        // Handle Neo4j DateTime object
        if (typeof createdAtRaw === 'object' && 'toStandardDate' in createdAtRaw) {
          createdAt = (createdAtRaw as { toStandardDate: () => Date }).toStandardDate().toISOString();
        } else if (typeof createdAtRaw === 'string') {
          createdAt = createdAtRaw;
        }
      }
      return {
        id: record.get('id') as string,
        name: record.get('name') as string,
        wirkung: record.get('wirkung') as string | null,
        ebene: record.get('ebene') as string | null,
        domain: record.get('domain') as string | null,
        cypher: record.get('cypher') as string | null,
        schwere: record.get('schwere') as 'fehler' | 'warnung' | 'info',
        standard: record.get('standard') as string,
        aktiv: record.get('aktiv') as boolean,
        createdAt,
      };
    });

    // Calculate stats
    const byStandard: Record<string, number> = {};
    const bySchwere: Record<string, number> = {};
    const byWirkung: Record<string, number> = {};
    let active = 0;

    for (const rule of rules) {
      byStandard[rule.standard] = (byStandard[rule.standard] || 0) + 1;
      bySchwere[rule.schwere] = (bySchwere[rule.schwere] || 0) + 1;
      if (rule.wirkung) {
        byWirkung[rule.wirkung] = (byWirkung[rule.wirkung] || 0) + 1;
      }
      if (rule.aktiv) active++;
    }

    const response = RulesResponseSchema.parse({
      rules,
      stats: {
        total: rules.length,
        active,
        byStandard,
        bySchwere,
        byWirkung,
      },
    });

    res.json(response);
  } catch (error) {
    console.error('[Rules] Error fetching rules:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to fetch rules',
      code: 'RULES_FETCH_ERROR',
    });
    res.status(500).json(apiError);
  } finally {
    await session.close();
  }
});

export default router;
