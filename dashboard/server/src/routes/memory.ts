/**
 * Memory/Learning Stats API Routes - GET /api/memory
 * Returns learning statistics: feedback count, patterns, events
 * @author andreas@siglochconsulting
 */

import { Router, Request, Response } from 'express';
import { getReadSession, toNumber } from '../db/neo4j.js';
import { MemoryStatsSchema, LearningPattern, ApiErrorSchema } from '../schemas/index.js';

const router = Router();

// In-memory storage for learning patterns (in production, use persistent storage)
const learningPatterns: Map<string, LearningPattern> = new Map();
let eventCount = 0;

/**
 * Register a new pattern or update existing
 */
export function registerPattern(name: string, confidence: number = 0.5): void {
  const existing = learningPatterns.get(name);
  if (existing) {
    existing.occurrences += 1;
    existing.lastSeen = new Date().toISOString();
    existing.confidence = Math.min(1, existing.confidence + 0.05);
  } else {
    learningPatterns.set(name, {
      id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      occurrences: 1,
      lastSeen: new Date().toISOString(),
      confidence,
    });
  }
}

/**
 * Increment event count
 */
export function incrementEventCount(): void {
  eventCount += 1;
}

/**
 * GET /api/memory
 * Returns learning statistics from Neo4j and in-memory patterns
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const session = getReadSession();

  try {
    // Count feedback/annotations in the graph (using Regel nodes as proxy)
    const feedbackResult = await session.run(`
      MATCH (r:Regel)
      RETURN count(r) AS ruleCount,
             sum(CASE WHEN r.aktiv = true THEN 1 ELSE 0 END) AS activeRules,
             sum(CASE WHEN r.schwere = 'fehler' THEN 1 ELSE 0 END) AS errorRules,
             sum(CASE WHEN r.schwere = 'warnung' THEN 1 ELSE 0 END) AS warningRules
    `);

    const ruleRecord = feedbackResult.records[0];
    const ruleCount = toNumber(ruleRecord?.get('ruleCount') ?? 0);
    const activeRules = toNumber(ruleRecord?.get('activeRules') ?? 0);
    const errorRules = toNumber(ruleRecord?.get('errorRules') ?? 0);
    const warningRules = toNumber(ruleRecord?.get('warningRules') ?? 0);

    // Count validation violations as feedback proxy
    const violationResult = await session.run(`
      MATCH (r:Regel {aktiv: true})
      WITH r.cypher AS cypherQuery, r.schwere AS severity
      RETURN count(*) AS totalActiveRules
    `);

    const totalActiveRules = toNumber(violationResult.records[0]?.get('totalActiveRules') ?? 0);

    // Detect patterns from graph structure
    await detectGraphPatterns(session);

    // Build response
    const patterns = Array.from(learningPatterns.values())
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10);

    const response = MemoryStatsSchema.parse({
      feedbackCount: ruleCount + totalActiveRules,
      patternCount: learningPatterns.size,
      eventCount,
      lastUpdated: new Date().toISOString(),
      patterns,
      feedbackByType: {
        rule_violation: errorRules,
        compliance_issue: warningRules,
        traceability_gap: Math.max(0, ruleCount - activeRules),
        test_coverage: activeRules,
        manual_annotation: 0,
      },
    });

    res.json(response);
  } catch (error) {
    console.error('[Memory] Error fetching stats:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to fetch memory stats',
      code: 'MEMORY_FETCH_ERROR',
    });
    res.status(500).json(apiError);
  } finally {
    await session.close();
  }
});

/**
 * Detect patterns from graph structure
 */
async function detectGraphPatterns(session: ReturnType<typeof getReadSession>): Promise<void> {
  try {
    // Pattern: Orphan requirements (no traces)
    const orphanResult = await session.run(`
      MATCH (n)
      WHERE (n:StakeholderReq OR n:SystemReq OR n:SoftwareReq)
        AND NOT (n)-[:TRACED_TO]->()
        AND NOT ()-[:TRACED_TO]->(n)
      RETURN count(n) AS orphanCount
    `);
    const orphanCount = toNumber(orphanResult.records[0]?.get('orphanCount') ?? 0);
    if (orphanCount > 0) {
      registerPattern('orphan_requirements', 0.8);
    }

    // Pattern: Missing test coverage
    const missingTestResult = await session.run(`
      MATCH (sw:SoftwareReq)
      WHERE NOT (sw)-[:VERIFIED_BY]->(:TestCase)
      RETURN count(sw) AS untested
    `);
    const untested = toNumber(missingTestResult.records[0]?.get('untested') ?? 0);
    if (untested > 0) {
      registerPattern('missing_test_coverage', 0.9);
    }

    // Pattern: Deep trace chains
    const deepChainResult = await session.run(`
      MATCH path = (s:StakeholderReq)-[:TRACED_TO*3..]->(t)
      RETURN count(DISTINCT path) AS deepChains
    `);
    const deepChains = toNumber(deepChainResult.records[0]?.get('deepChains') ?? 0);
    if (deepChains > 0) {
      registerPattern('deep_trace_chains', 0.6);
    }

    // Pattern: High centrality nodes
    const centralityResult = await session.run(`
      MATCH (n)-[r]-()
      WHERE n:SystemReq OR n:SoftwareReq
      WITH n, count(r) AS degree
      WHERE degree >= 3
      RETURN count(n) AS highCentralityNodes
    `);
    const highCentrality = toNumber(centralityResult.records[0]?.get('highCentralityNodes') ?? 0);
    if (highCentrality > 0) {
      registerPattern('high_centrality_nodes', 0.7);
    }

  } catch (error) {
    console.error('[Memory] Pattern detection error:', error);
  }
}

export default router;
