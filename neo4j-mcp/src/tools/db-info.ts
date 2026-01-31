/**
 * Database Information Tool
 * @author andreas@siglochconsulting
 *
 * Returns metadata about the connected database for identification
 */

import { Driver } from 'neo4j-driver';
import { NEO4J_INSTANCE } from '../connection.js';

export interface DbInfo {
  instance: string;
  project: {
    name: string;
    description: string;
    version: string;
    domain: string;
    standards: string[];
  } | null;
  stats: {
    nodeCount: number;
    relationshipCount: number;
    nodeTypes: string[];
  };
}

export async function getDbInfo(driver: Driver): Promise<DbInfo> {
  const session = driver.session({ defaultAccessMode: 'READ' });

  try {
    // Get project metadata if exists
    const metaResult = await session.run(
      `OPTIONAL MATCH (pm:ProjectMeta)
       RETURN pm.name AS name, pm.description AS description,
              pm.version AS version, pm.domain AS domain,
              pm.standards AS standards
       LIMIT 1`
    );

    const metaRecord = metaResult.records[0];
    const project = metaRecord?.get('name') ? {
      name: metaRecord.get('name'),
      description: metaRecord.get('description') || '',
      version: metaRecord.get('version') || '1.0.0',
      domain: metaRecord.get('domain') || '',
      standards: metaRecord.get('standards') || []
    } : null;

    // Get basic stats
    const statsResult = await session.run(
      `MATCH (n) WITH count(n) AS nodes
       MATCH ()-[r]->() WITH nodes, count(r) AS rels
       CALL db.labels() YIELD label
       RETURN nodes, rels, collect(label) AS labels`
    );

    const statsRecord = statsResult.records[0];

    return {
      instance: NEO4J_INSTANCE,
      project,
      stats: {
        nodeCount: statsRecord?.get('nodes')?.toNumber?.() || 0,
        relationshipCount: statsRecord?.get('rels')?.toNumber?.() || 0,
        nodeTypes: statsRecord?.get('labels') || []
      }
    };
  } finally {
    await session.close();
  }
}
