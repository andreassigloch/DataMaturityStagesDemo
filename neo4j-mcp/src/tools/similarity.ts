/**
 * Similarity Analysis Tool - Find Similar Requirements
 * CR-009: Stufe 3 - Strukturierte Suche
 * @author andreas@siglochconsulting
 */

import { Driver } from 'neo4j-driver';

interface SimilarRequirement {
  id: string;
  name: string;
  type: string;
  similarity: number;
  sharedNeighbors: string[];
  sameASIL: boolean;
  sameStandard: boolean;
}

interface SimilarityResult {
  sourceRequirement: {
    id: string;
    name: string;
    type: string;
  };
  similarRequirements: SimilarRequirement[];
  summary: {
    totalSimilar: number;
    avgSimilarity: number;
    recommendation: string;
  };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'low' in value) {
    return (value as { low: number }).low;
  }
  return 0;
}

export async function findSimilarRequirements(
  driver: Driver,
  requirementId: string,
  options?: { limit?: number; minSimilarity?: number }
): Promise<SimilarityResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });
  const limit = options?.limit ?? 5;
  const minSimilarity = options?.minSimilarity ?? 0.3;

  try {
    // First, get the source requirement
    const sourceResult = await session.run(`
      MATCH (source)
      WHERE source.id = $requirementId
      RETURN
        source.id AS id,
        COALESCE(source.titel, source.name, source.id) AS name,
        labels(source)[0] AS type,
        source.asil AS asil,
        source.standard AS standard
    `, { requirementId });

    if (sourceResult.records.length === 0) {
      throw new Error(`Requirement ${requirementId} nicht gefunden`);
    }

    const sourceRecord = sourceResult.records[0];
    const source = {
      id: sourceRecord.get('id'),
      name: sourceRecord.get('name'),
      type: sourceRecord.get('type'),
      asil: sourceRecord.get('asil'),
      standard: sourceRecord.get('standard'),
    };

    // Find similar requirements based on shared neighbors (Jaccard similarity)
    const similarResult = await session.run(`
      MATCH (source)-[r1]-(neighbor)-[r2]-(candidate)
      WHERE source.id = $requirementId
        AND candidate.id <> source.id
        AND labels(candidate)[0] IN ['StakeholderReq', 'SystemReq', 'SoftwareReq']
      WITH source, candidate, collect(DISTINCT neighbor) AS sharedNeighbors

      // Calculate Jaccard similarity
      MATCH (source)-[sr]-()
      WITH source, candidate, sharedNeighbors, count(DISTINCT sr) AS sourceNeighborCount
      MATCH (candidate)-[cr]-()
      WITH source, candidate, sharedNeighbors, sourceNeighborCount, count(DISTINCT cr) AS candidateNeighborCount

      WITH candidate, sharedNeighbors,
           size(sharedNeighbors) AS shared,
           sourceNeighborCount + candidateNeighborCount - size(sharedNeighbors) AS union,
           source.asil = candidate.asil AS sameASIL,
           source.standard = candidate.standard AS sameStandard
      WHERE union > 0

      WITH candidate, sharedNeighbors,
           toFloat(shared) / toFloat(union) AS similarity,
           sameASIL, sameStandard
      WHERE similarity >= $minSimilarity

      RETURN
        candidate.id AS id,
        COALESCE(candidate.titel, candidate.name, candidate.id) AS name,
        labels(candidate)[0] AS type,
        similarity,
        [n IN sharedNeighbors | n.id] AS sharedNeighborIds,
        COALESCE(sameASIL, false) AS sameASIL,
        COALESCE(sameStandard, false) AS sameStandard
      ORDER BY similarity DESC
      LIMIT $limit
    `, { requirementId, limit, minSimilarity });

    const similarRequirements: SimilarRequirement[] = similarResult.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      type: record.get('type'),
      similarity: record.get('similarity'),
      sharedNeighbors: record.get('sharedNeighborIds') || [],
      sameASIL: record.get('sameASIL'),
      sameStandard: record.get('sameStandard'),
    }));

    // Calculate summary
    const avgSimilarity = similarRequirements.length > 0
      ? similarRequirements.reduce((sum, r) => sum + r.similarity, 0) / similarRequirements.length
      : 0;

    let recommendation = '';
    if (similarRequirements.length === 0) {
      recommendation = `${requirementId} ist einzigartig - keine strukturell ähnlichen Requirements gefunden.`;
    } else if (similarRequirements[0]?.similarity > 0.7) {
      recommendation = `Bei Änderung an ${requirementId} auch ${similarRequirements[0].id} prüfen (${(similarRequirements[0].similarity * 100).toFixed(0)}% ähnlich).`;
    } else {
      recommendation = `${similarRequirements.length} ähnliche Requirements gefunden - bei Änderungen koordinieren.`;
    }

    return {
      sourceRequirement: {
        id: source.id,
        name: source.name,
        type: source.type,
      },
      similarRequirements,
      summary: {
        totalSimilar: similarRequirements.length,
        avgSimilarity,
        recommendation,
      },
    };
  } finally {
    await session.close();
  }
}
