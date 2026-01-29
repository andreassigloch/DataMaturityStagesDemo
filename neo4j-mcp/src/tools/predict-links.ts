/**
 * Link Prediction Tool - Find Missing Traceability Links
 * CR-009: Stufe 6 - ML & Prediction
 * @author andreas@siglochconsulting
 */

import { Driver } from 'neo4j-driver';

interface PredictedLink {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  targetId: string;
  targetName: string;
  targetType: string;
  confidence: number;
  reason: string;
}

interface PredictLinksResult {
  predictedLinks: PredictedLink[];
  summary: {
    totalPredictions: number;
    highConfidence: number;
    mediumConfidence: number;
    byLinkType: Record<string, number>;
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

export async function predictMissingLinks(
  driver: Driver,
  options?: { minConfidence?: number; limit?: number }
): Promise<PredictLinksResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });
  const minConfidence = options?.minConfidence ?? 0.5;
  const limit = options?.limit ?? 10;

  try {
    const predictions: PredictedLink[] = [];

    // Pattern 1: SoftwareReq without TestCase (VERIFIED_BY)
    const missingTests = await session.run(`
      MATCH (sw:SoftwareReq)
      WHERE NOT (sw)-[:VERIFIED_BY]->(:TestCase)
      // Find similar SoftwareReqs that have tests (via shared SystemReq parent)
      OPTIONAL MATCH (sw)<-[:TRACED_TO]-(:SystemReq)-[:TRACED_TO]->(sibling:SoftwareReq)-[:VERIFIED_BY]->(tc:TestCase)
      WITH sw, collect(DISTINCT tc) AS relatedTests, count(DISTINCT sibling) AS siblingCount
      WHERE siblingCount > 0
      RETURN
        sw.id AS sourceId,
        COALESCE(sw.titel, sw.id) AS sourceName,
        'SoftwareReq' AS sourceType,
        'TC-???' AS targetId,
        'Fehlender Test' AS targetName,
        'TestCase' AS targetType,
        CASE
          WHEN siblingCount >= 3 THEN 0.9
          WHEN siblingCount >= 2 THEN 0.75
          ELSE 0.6
        END AS confidence,
        'Pattern: Alle anderen SoftwareReqs in der Komponente haben Tests' AS reason
      LIMIT $limit
    `, { limit });

    for (const record of missingTests.records) {
      predictions.push({
        sourceId: record.get('sourceId'),
        sourceName: record.get('sourceName'),
        sourceType: record.get('sourceType'),
        targetId: record.get('targetId'),
        targetName: record.get('targetName'),
        targetType: record.get('targetType'),
        confidence: record.get('confidence'),
        reason: record.get('reason'),
      });
    }

    // Pattern 2: StakeholderReq without SystemReq derivation
    const missingDerivation = await session.run(`
      MATCH (stk:StakeholderReq)
      WHERE NOT (stk)-[:TRACED_TO]->(:SystemReq)
      // Check if similar stakeholder reqs have derivations
      OPTIONAL MATCH (stk2:StakeholderReq)-[:TRACED_TO]->(sys:SystemReq)
      WHERE stk2 <> stk
      WITH stk, count(DISTINCT stk2) AS othersWithDerivation
      WHERE othersWithDerivation > 0
      RETURN
        stk.id AS sourceId,
        COALESCE(stk.titel, stk.id) AS sourceName,
        'StakeholderReq' AS sourceType,
        'SYS-???' AS targetId,
        'Fehlende Ableitung' AS targetName,
        'SystemReq' AS targetType,
        0.72 AS confidence,
        'Pattern: StakeholderReq ohne System-Ableitung' AS reason
      LIMIT $limit
    `, { limit });

    for (const record of missingDerivation.records) {
      predictions.push({
        sourceId: record.get('sourceId'),
        sourceName: record.get('sourceName'),
        sourceType: record.get('sourceType'),
        targetId: record.get('targetId'),
        targetName: record.get('targetName'),
        targetType: record.get('targetType'),
        confidence: record.get('confidence'),
        reason: record.get('reason'),
      });
    }

    // Pattern 3: SystemReq depending on external but missing explicit link
    const missingExternalDeps = await session.run(`
      MATCH (sys:SystemReq)
      WHERE sys.beschreibung CONTAINS 'CAN' OR sys.beschreibung CONTAINS 'Bus'
      AND NOT (sys)-[:DEPENDS_ON]->(:InputSpec)
      OPTIONAL MATCH (ext:InputSpec)
      WHERE ext.titel CONTAINS 'CAN'
      WITH sys, collect(ext) AS potentialDeps
      WHERE size(potentialDeps) > 0
      RETURN
        sys.id AS sourceId,
        COALESCE(sys.titel, sys.id) AS sourceName,
        'SystemReq' AS sourceType,
        potentialDeps[0].id AS targetId,
        COALESCE(potentialDeps[0].titel, 'InputSpec') AS targetName,
        'InputSpec' AS targetType,
        0.65 AS confidence,
        'Pattern: SystemReq erwähnt CAN aber keine DEPENDS_ON Beziehung' AS reason
      LIMIT $limit
    `, { limit });

    for (const record of missingExternalDeps.records) {
      if (record.get('targetId')) {
        predictions.push({
          sourceId: record.get('sourceId'),
          sourceName: record.get('sourceName'),
          sourceType: record.get('sourceType'),
          targetId: record.get('targetId'),
          targetName: record.get('targetName'),
          targetType: record.get('targetType'),
          confidence: record.get('confidence'),
          reason: record.get('reason'),
        });
      }
    }

    // Filter by confidence
    const filteredPredictions = predictions
      .filter(p => p.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    // Generate summary
    const highConfidence = filteredPredictions.filter(p => p.confidence >= 0.8).length;
    const mediumConfidence = filteredPredictions.filter(p => p.confidence >= 0.6 && p.confidence < 0.8).length;

    const byLinkType: Record<string, number> = {};
    for (const p of filteredPredictions) {
      const linkType = `${p.sourceType} → ${p.targetType}`;
      byLinkType[linkType] = (byLinkType[linkType] || 0) + 1;
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (filteredPredictions.some(p => p.targetType === 'TestCase')) {
      recommendations.push('🧪 Fehlende Tests gefunden - Test-Coverage erhöhen');
    }
    if (filteredPredictions.some(p => p.targetType === 'SystemReq')) {
      recommendations.push('📋 StakeholderReqs ohne Ableitung - Traceability vervollständigen');
    }
    if (filteredPredictions.some(p => p.targetType === 'InputSpec')) {
      recommendations.push('🔗 Externe Abhängigkeiten nicht explizit - DEPENDS_ON Links hinzufügen');
    }

    return {
      predictedLinks: filteredPredictions,
      summary: {
        totalPredictions: filteredPredictions.length,
        highConfidence,
        mediumConfidence,
        byLinkType,
      },
      recommendations,
    };
  } finally {
    await session.close();
  }
}
