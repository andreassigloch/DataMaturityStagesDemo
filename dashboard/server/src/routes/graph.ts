/**
 * Graph API Routes - GET /api/graph
 * Returns all nodes/edges with centrality scores
 * @author andreas@siglochconsulting
 */

import { Router, Request, Response } from 'express';
import { getReadSession, toNumber, serializeProperties } from '../db/neo4j.js';
import { GraphResponseSchema, GraphNode, GraphEdge, ApiErrorSchema } from '../schemas/index.js';

const router = Router();

/**
 * GET /api/graph
 * Returns complete graph with nodes, edges, and centrality scores
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const session = getReadSession();

  try {
    // Fetch all nodes with their labels and properties, including degree centrality
    const nodesResult = await session.run(`
      MATCH (n)
      WHERE n:StakeholderReq OR n:SystemReq OR n:SoftwareReq OR n:TestCase OR n:InputSpec OR n:Komponente
      WITH n, labels(n)[0] AS nodeType
      OPTIONAL MATCH (n)-[r]-()
      WITH n, nodeType, count(r) AS degree
      RETURN
        COALESCE(n.id, toString(id(n))) AS id,
        nodeType AS type,
        COALESCE(n.titel, n.name, n.id, 'Unnamed') AS title,
        properties(n) AS props,
        degree
      ORDER BY nodeType, id
    `);

    // Calculate max degree for normalization
    let maxDegree = 1;
    const rawNodes = nodesResult.records.map(record => {
      const degree = toNumber(record.get('degree'));
      if (degree > maxDegree) maxDegree = degree;
      return {
        id: record.get('id') as string,
        type: record.get('type') as string,
        title: record.get('title') as string,
        props: record.get('props') as Record<string, unknown>,
        degree,
      };
    });

    // Build nodes with normalized centrality
    const nodes: GraphNode[] = rawNodes.map(n => ({
      id: n.id,
      label: n.id,
      type: n.type as GraphNode['type'],
      title: n.title,
      centrality: Math.round((n.degree / maxDegree) * 100) / 100,
      properties: serializeProperties(n.props),
    }));

    // Fetch all relationships
    const edgesResult = await session.run(`
      MATCH (source)-[r:TRACED_TO|VERIFIED_BY|IMPLEMENTED_IN|DEPENDS_ON]->(target)
      WHERE (source:StakeholderReq OR source:SystemReq OR source:SoftwareReq OR source:TestCase OR source:InputSpec OR source:Komponente)
        AND (target:StakeholderReq OR target:SystemReq OR target:SoftwareReq OR target:TestCase OR target:InputSpec OR target:Komponente)
      RETURN
        toString(id(r)) AS relId,
        COALESCE(source.id, toString(id(source))) AS sourceId,
        COALESCE(target.id, toString(id(target))) AS targetId,
        type(r) AS relType,
        properties(r) AS props
      ORDER BY relType, sourceId
    `);

    const edges: GraphEdge[] = edgesResult.records.map(record => ({
      id: record.get('relId') as string,
      from: record.get('sourceId') as string,
      to: record.get('targetId') as string,
      type: record.get('relType') as GraphEdge['type'],
      properties: serializeProperties(record.get('props') as Record<string, unknown> || {}),
    }));

    // Calculate statistics
    const nodesByType: Record<string, number> = {};
    for (const node of nodes) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    const response = GraphResponseSchema.parse({
      nodes,
      edges,
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodesByType,
      },
    });

    res.json(response);
  } catch (error) {
    console.error('[Graph] Error fetching graph:', error);
    const apiError = ApiErrorSchema.parse({
      error: error instanceof Error ? error.message : 'Failed to fetch graph data',
      code: 'GRAPH_FETCH_ERROR',
    });
    res.status(500).json(apiError);
  } finally {
    await session.close();
  }
});

export default router;
