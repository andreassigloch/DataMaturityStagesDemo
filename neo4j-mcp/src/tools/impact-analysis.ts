import { Driver } from 'neo4j-driver';

export interface ImpactNode {
  id: string;
  name: string;
  type: string;
  depth: number;
  relationship: string;
}

export interface ImpactAnalysisResult {
  sourceRequirement: {
    id: string;
    name: string;
    typ: string;
  } | null;
  impactedElements: ImpactNode[];
  summary: {
    totalAffected: number;
    byType: Record<string, number>;
    maxDepth: number;
  };
}

export async function analyzeImpact(driver: Driver, requirementId: string): Promise<ImpactAnalysisResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });

  try {
    // First get the source requirement - check all requirement types
    const sourceResult = await session.run(
      `MATCH (r {id: $reqId})
       WHERE r:StakeholderReq OR r:SystemReq OR r:SoftwareReq OR r:HardwareReq OR r:InputSpec
       RETURN r.id AS id, COALESCE(r.name, r.titel) AS name, labels(r)[0] AS typ`,
      { reqId: requirementId }
    );

    let sourceRequirement: ImpactAnalysisResult['sourceRequirement'] = null;
    if (sourceResult.records.length > 0) {
      const record = sourceResult.records[0];
      sourceRequirement = {
        id: record.get('id'),
        name: record.get('name'),
        typ: record.get('typ')
      };
    }

    // Recursive downstream traversal - find all connected elements
    // Follows TRACED_TO, VERIFIED_BY, IMPLEMENTED_IN, DEPENDS_ON relationships
    const impactResult = await session.run(
      `MATCH (source {id: $reqId})
       WHERE source:StakeholderReq OR source:SystemReq OR source:SoftwareReq OR source:HardwareReq OR source:InputSpec
       CALL {
         WITH source
         MATCH path = (source)-[rel:TRACED_TO|VERIFIED_BY|IMPLEMENTED_IN|DEPENDS_ON*1..10]->(target)
         WHERE target.id <> $reqId
         RETURN target,
                last(rel) AS lastRel,
                length(path) AS depth,
                labels(target)[0] AS targetType
       }
       WITH DISTINCT target, lastRel, depth, targetType
       RETURN
         COALESCE(target.id, toString(id(target))) AS targetId,
         COALESCE(target.name, target.titel, 'Unnamed') AS targetName,
         targetType AS targetType,
         depth,
         type(lastRel) AS relType
       ORDER BY depth, targetType, targetId`,
      { reqId: requirementId }
    );

    const impactedElements: ImpactNode[] = impactResult.records.map(record => ({
      id: record.get('targetId'),
      name: record.get('targetName'),
      type: record.get('targetType'),
      depth: typeof record.get('depth') === 'object'
        ? (record.get('depth') as { low: number }).low
        : record.get('depth'),
      relationship: record.get('relType')
    }));

    // Calculate summary statistics
    const byType: Record<string, number> = {};
    let maxDepth = 0;

    for (const element of impactedElements) {
      byType[element.type] = (byType[element.type] || 0) + 1;
      if (element.depth > maxDepth) {
        maxDepth = element.depth;
      }
    }

    return {
      sourceRequirement,
      impactedElements,
      summary: {
        totalAffected: impactedElements.length,
        byType,
        maxDepth
      }
    };
  } finally {
    await session.close();
  }
}
