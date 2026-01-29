/**
 * Centrality Analysis Tool - PageRank & Betweenness
 * CR-009: Stufe 6 - ML & Prediction
 * @author andreas@siglochconsulting
 */

import { Driver } from 'neo4j-driver';

interface CentralityNode {
  id: string;
  name: string;
  type: string;
  pageRank: number;
  betweenness: number;
  degree: number;
}

interface CentralityResult {
  topByPageRank: CentralityNode[];
  topByBetweenness: CentralityNode[];
  summary: {
    totalNodes: number;
    avgPageRank: number;
    avgBetweenness: number;
    maxPageRank: { id: string; score: number };
    maxBetweenness: { id: string; score: number };
  };
  recommendations: string[];
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'low' in value) {
    return (value as { low: number }).low;
  }
  return 0;
}

export async function analyzeCentrality(
  driver: Driver,
  options?: { limit?: number; nodeLabel?: string }
): Promise<CentralityResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });
  // Ensure limit is integer (Neo4j LIMIT requires integer, not float)
  const limit = Math.floor(options?.limit ?? 5);
  const nodeLabel = options?.nodeLabel;

  try {
    // Create in-memory graph projection
    const projectionName = `centrality_${Date.now()}`;

    // Check if GDS is available
    const gdsCheck = await session.run(`
      CALL gds.list() YIELD name RETURN count(*) AS count
    `).catch(() => null);

    if (!gdsCheck) {
      // Fallback: Use degree-based analysis without GDS
      return await analyzeWithoutGDS(driver, limit, nodeLabel);
    }

    // Create projection - must match actual database labels (6 graph types, Regel excluded)
    const labelFilter = nodeLabel ? `['${nodeLabel}']` : "['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase', 'InputSpec', 'Komponente']";

    await session.run(`
      CALL gds.graph.project(
        $projectionName,
        ${labelFilter},
        {
          TRACED_TO: { orientation: 'UNDIRECTED' },
          VERIFIED_BY: { orientation: 'UNDIRECTED' },
          DEPENDS_ON: { orientation: 'UNDIRECTED' },
          IMPLEMENTED_IN: { orientation: 'UNDIRECTED' }
        }
      )
    `, { projectionName });

    try {
      // Run PageRank
      const pageRankResult = await session.run(`
        CALL gds.pageRank.stream($projectionName)
        YIELD nodeId, score
        RETURN gds.util.asNode(nodeId) AS node, score
        ORDER BY score DESC
        LIMIT toInteger($limit)
      `, { projectionName, limit });

      // Run Betweenness
      const betweennessResult = await session.run(`
        CALL gds.betweenness.stream($projectionName)
        YIELD nodeId, score
        RETURN gds.util.asNode(nodeId) AS node, score
        ORDER BY score DESC
        LIMIT toInteger($limit)
      `, { projectionName, limit });

      // Get statistics
      const statsResult = await session.run(`
        CALL gds.pageRank.stream($projectionName)
        YIELD nodeId, score
        WITH collect({nodeId: nodeId, score: score}) AS pageRanks
        CALL gds.betweenness.stream($projectionName)
        YIELD nodeId, score
        WITH pageRanks, collect({nodeId: nodeId, score: score}) AS betweenness
        RETURN
          size(pageRanks) AS totalNodes,
          reduce(s = 0.0, x IN pageRanks | s + x.score) / size(pageRanks) AS avgPageRank,
          reduce(s = 0.0, x IN betweenness | s + x.score) / size(betweenness) AS avgBetweenness
      `, { projectionName });

      // Parse results
      const topByPageRank: CentralityNode[] = pageRankResult.records.map(record => {
        const node = record.get('node');
        return {
          id: node.properties.id,
          name: node.properties.titel || node.properties.name || node.properties.id,
          type: node.labels[0],
          pageRank: record.get('score'),
          betweenness: 0,
          degree: 0,
        };
      });

      const topByBetweenness: CentralityNode[] = betweennessResult.records.map(record => {
        const node = record.get('node');
        return {
          id: node.properties.id,
          name: node.properties.titel || node.properties.name || node.properties.id,
          type: node.labels[0],
          pageRank: 0,
          betweenness: record.get('score'),
          degree: 0,
        };
      });

      const stats = statsResult.records[0];
      const recommendations: string[] = [];

      // Generate recommendations
      if (topByBetweenness.length > 0) {
        recommendations.push(
          `⚠️ ${topByBetweenness[0].id} ist ein kritischer Bottleneck - Änderungen hier haben weitreichende Auswirkungen.`
        );
      }
      if (topByPageRank.length > 0) {
        recommendations.push(
          `🎯 ${topByPageRank[0].id} ist das wichtigste Requirement - besonders sorgfältig pflegen.`
        );
      }

      return {
        topByPageRank,
        topByBetweenness,
        summary: {
          totalNodes: toNumber(stats?.get('totalNodes')) || topByPageRank.length,
          avgPageRank: stats?.get('avgPageRank') || 0,
          avgBetweenness: stats?.get('avgBetweenness') || 0,
          maxPageRank: topByPageRank[0]
            ? { id: topByPageRank[0].id, score: topByPageRank[0].pageRank }
            : { id: '', score: 0 },
          maxBetweenness: topByBetweenness[0]
            ? { id: topByBetweenness[0].id, score: topByBetweenness[0].betweenness }
            : { id: '', score: 0 },
        },
        recommendations,
      };
    } finally {
      // Clean up projection
      await session.run(`CALL gds.graph.drop($projectionName)`, { projectionName }).catch(() => {});
    }
  } finally {
    await session.close();
  }
}

// Fallback analysis without GDS plugin
async function analyzeWithoutGDS(
  driver: Driver,
  limit: number,
  nodeLabel?: string
): Promise<CentralityResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });

  try {
    const labelFilter = nodeLabel ? `:${nodeLabel}` : '';

    // Calculate degree-based metrics
    const result = await session.run(`
      MATCH (n${labelFilter})
      WHERE n.id IS NOT NULL
      OPTIONAL MATCH (n)-[r]-()
      WITH n, count(r) AS degree
      ORDER BY degree DESC
      LIMIT toInteger($limit)
      RETURN
        n.id AS id,
        COALESCE(n.titel, n.name, n.id) AS name,
        labels(n)[0] AS type,
        degree,
        toFloat(degree) / 10.0 AS approxPageRank
    `, { limit });

    const nodes: CentralityNode[] = result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      type: record.get('type'),
      pageRank: record.get('approxPageRank'),
      betweenness: toNumber(record.get('degree')) * 0.1, // Approximation
      degree: toNumber(record.get('degree')),
    }));

    return {
      topByPageRank: nodes,
      topByBetweenness: [...nodes].sort((a, b) => b.betweenness - a.betweenness),
      summary: {
        totalNodes: nodes.length,
        avgPageRank: nodes.reduce((s, n) => s + n.pageRank, 0) / nodes.length || 0,
        avgBetweenness: nodes.reduce((s, n) => s + n.betweenness, 0) / nodes.length || 0,
        maxPageRank: nodes[0] ? { id: nodes[0].id, score: nodes[0].pageRank } : { id: '', score: 0 },
        maxBetweenness: nodes[0] ? { id: nodes[0].id, score: nodes[0].betweenness } : { id: '', score: 0 },
      },
      recommendations: [
        '⚠️ GDS Plugin nicht verfügbar - Ergebnisse basieren auf Degree-Approximation.',
        'Für echte PageRank/Betweenness: Neo4j GDS Plugin installieren.',
      ],
    };
  } finally {
    await session.close();
  }
}
