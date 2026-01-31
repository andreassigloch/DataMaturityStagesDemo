import { Driver } from 'neo4j-driver';

// CR-010: Extended type definitions for functional rule schema

export type Wirkung = 'Validierung' | 'Scoring' | 'Optimierung';
export type Ebene = 'Struktur' | 'Inhalt' | 'Konsistenz' | 'Vollstaendigkeit';
export type Domain = 'Traceability' | 'Safety' | 'Quality' | 'Architektur';
export type Schwere = 'fehler' | 'warnung' | 'info';
export type Richtung = 'minimieren' | 'maximieren';
export type Operator = 'SPLIT' | 'MERGE' | 'MOVE' | 'CREATE';

export interface Violation {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  severity: Schwere;
  standard: string;
  domain: Domain;
  affectedElements: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface ValidationResult {
  totalViolations: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  violations: Violation[];
  rulesChecked: number;
  summary: {
    byStandard: Record<string, { errors: number; warnings: number; info: number }>;
    byDomain: Record<string, number>;
  };
}

// CR-010: Scoring result for Kennzahlen
export interface ScoringItem {
  ruleId: string;
  ruleName: string;
  beschreibung: string;
  wert: number;
  von: number;
  score: number;
  einheit: string;
  schwellwert: number;
  richtung: Richtung;
  status: 'ok' | 'warnung' | 'kritisch';
  domain: Domain;
  standard: string;
}

export interface ScoringResult {
  items: ScoringItem[];
  rulesChecked: number;
  averageScore: number;
  belowThreshold: number;
}

// CR-010: Optimization result for Delta-Vorschlaege
export interface OptimizationSuggestion {
  ruleId: string;
  ruleName: string;
  beschreibung: string;
  kandidat: string;
  von: string;
  nach: string;
  grund: string;
  operator: Operator;
  metricBefore: number | null;
  metricAfter: number | null;
  delta: number | null;
  deltaPercent: number | null;
  domain: Domain;
}

export interface OptimizationResult {
  suggestions: OptimizationSuggestion[];
  rulesChecked: number;
  totalSuggestions: number;
}

/**
 * Validates rules with wirkung='Validierung' and returns violations
 * CR-010: Extended to support new functional schema
 */
export async function validateRules(driver: Driver): Promise<ValidationResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });

  try {
    // Get all active Validierung rules (CR-010: filter by wirkung)
    const rulesResult = await session.run(
      `MATCH (r:Regel {aktiv: true})
       WHERE r.wirkung = 'Validierung' OR r.wirkung IS NULL
       RETURN r.id AS id, r.name AS name, r.ebene AS ebene,
              r.cypher AS cypher, r.schwere AS schwere, r.standard AS standard,
              r.domain AS domain`
    );

    const violations: Violation[] = [];
    let rulesChecked = 0;

    for (const ruleRecord of rulesResult.records) {
      const ruleId = ruleRecord.get('id');
      const ruleName = ruleRecord.get('name');
      const ruleType = ruleRecord.get('ebene') || 'Unknown';
      const cypher = ruleRecord.get('cypher');
      const severity = (ruleRecord.get('schwere') || 'warnung') as Schwere;
      const standard = ruleRecord.get('standard') || 'Allgemein';
      const domain = (ruleRecord.get('domain') || 'Quality') as Domain;

      if (!cypher) continue;

      rulesChecked++;

      try {
        // Execute the rule's Cypher query
        const violationResult = await session.run(cypher);

        if (violationResult.records.length > 0) {
          const affectedElements = violationResult.records.map(record => {
            // Try to extract element info from common return patterns
            const keys = record.keys;
            let id = 'unknown';
            let name = 'Unknown';
            let type = 'Unknown';

            for (const key of keys) {
              const keyStr = String(key);
              const value = record.get(key);
              if (value && typeof value === 'object') {
                if ('properties' in value && 'labels' in value) {
                  // It's a node
                  const node = value as { properties: Record<string, unknown>; labels: string[] };
                  id = String(node.properties.id || id);
                  name = String(node.properties.name || node.properties.titel || name);
                  type = node.labels[0] || type;
                }
              } else if (typeof value === 'string') {
                if (keyStr.toLowerCase().includes('id')) id = value;
                if (keyStr.toLowerCase().includes('name')) name = value;
                if (keyStr.toLowerCase().includes('type') || keyStr.toLowerCase().includes('typ')) type = value;
              }
            }

            return { id, name, type };
          });

          violations.push({
            ruleId,
            ruleName,
            ruleType,
            severity,
            standard,
            domain,
            affectedElements
          });

          // CR-010: Update rule counters (anwendungen, treffer)
          await updateRuleCounters(driver, ruleId, affectedElements.length);
        }
      } catch (err) {
        // Log but continue with other rules
        console.error(`Error executing rule ${ruleId}: ${err}`);
      }
    }

    // Calculate summary statistics
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    const byStandard: Record<string, { errors: number; warnings: number; info: number }> = {};
    const byDomain: Record<string, number> = {};

    for (const violation of violations) {
      const count = violation.affectedElements.length;
      if (violation.severity === 'fehler') {
        errorCount += count;
      } else if (violation.severity === 'warnung') {
        warningCount += count;
      } else {
        infoCount += count;
      }

      if (!byStandard[violation.standard]) {
        byStandard[violation.standard] = { errors: 0, warnings: 0, info: 0 };
      }
      if (violation.severity === 'fehler') {
        byStandard[violation.standard].errors += count;
      } else if (violation.severity === 'warnung') {
        byStandard[violation.standard].warnings += count;
      } else {
        byStandard[violation.standard].info += count;
      }

      byDomain[violation.domain] = (byDomain[violation.domain] || 0) + count;
    }

    return {
      totalViolations: errorCount + warningCount + infoCount,
      errorCount,
      warningCount,
      infoCount,
      violations,
      rulesChecked,
      summary: {
        byStandard,
        byDomain
      }
    };
  } finally {
    await session.close();
  }
}

/**
 * CR-010: Update rule counters after execution
 */
async function updateRuleCounters(driver: Driver, ruleId: string, hitCount: number): Promise<void> {
  const session = driver.session({ defaultAccessMode: 'WRITE' });
  try {
    await session.run(
      `MATCH (r:Regel {id: $ruleId})
       SET r.anwendungen = coalesce(r.anwendungen, 0) + 1,
           r.treffer = coalesce(r.treffer, 0) + $hitCount`,
      { ruleId, hitCount }
    );
  } finally {
    await session.close();
  }
}

/**
 * CR-010: Execute scoring rules and return metrics
 */
export async function executeScoring(driver: Driver): Promise<ScoringResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });

  try {
    const rulesResult = await session.run(
      `MATCH (r:Regel {aktiv: true, wirkung: 'Scoring'})
       RETURN r.id AS id, r.name AS name, r.beschreibung AS beschreibung,
              r.cypher AS cypher, r.schwellwert AS schwellwert,
              r.richtung AS richtung, r.domain AS domain, r.standard AS standard`
    );

    const items: ScoringItem[] = [];
    let rulesChecked = 0;

    for (const ruleRecord of rulesResult.records) {
      const ruleId = ruleRecord.get('id');
      const ruleName = ruleRecord.get('name');
      const beschreibung = ruleRecord.get('beschreibung') || '';
      const cypher = ruleRecord.get('cypher');
      const schwellwert = ruleRecord.get('schwellwert') ?? 0;
      const richtung = (ruleRecord.get('richtung') || 'maximieren') as Richtung;
      const domain = (ruleRecord.get('domain') || 'Quality') as Domain;
      const standard = ruleRecord.get('standard') || 'Allgemein';

      if (!cypher) continue;

      rulesChecked++;

      try {
        const result = await session.run(cypher);
        if (result.records.length > 0) {
          const record = result.records[0];
          const wert = Number(record.get('wert')) || 0;
          const von = Number(record.get('von')) || 1;
          const score = Number(record.get('score')) || 0;
          const einheit = record.get('einheit') || '';

          // Determine status based on threshold and direction
          let status: 'ok' | 'warnung' | 'kritisch' = 'ok';
          if (richtung === 'maximieren') {
            if (score < schwellwert * 0.8) status = 'kritisch';
            else if (score < schwellwert) status = 'warnung';
          } else {
            if (score > schwellwert * 1.2) status = 'kritisch';
            else if (score > schwellwert) status = 'warnung';
          }

          items.push({
            ruleId,
            ruleName,
            beschreibung,
            wert,
            von,
            score,
            einheit,
            schwellwert,
            richtung,
            status,
            domain,
            standard
          });

          await updateRuleCounters(driver, ruleId, status !== 'ok' ? 1 : 0);
        }
      } catch (err) {
        console.error(`Error executing scoring rule ${ruleId}: ${err}`);
      }
    }

    const averageScore = items.length > 0
      ? items.reduce((sum, i) => sum + i.score, 0) / items.length
      : 0;
    const belowThreshold = items.filter(i => i.status !== 'ok').length;

    return {
      items,
      rulesChecked,
      averageScore,
      belowThreshold
    };
  } finally {
    await session.close();
  }
}

/**
 * CR-010: Generate optimization suggestions
 */
export async function generateOptimizations(driver: Driver): Promise<OptimizationResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });

  try {
    const rulesResult = await session.run(
      `MATCH (r:Regel {aktiv: true, wirkung: 'Optimierung'})
       RETURN r.id AS id, r.name AS name, r.beschreibung AS beschreibung,
              r.cypher AS cypher, r.cypher_measure AS cypherMeasure,
              r.schwellwert AS schwellwert, r.richtung AS richtung,
              r.operator AS operator, r.domain AS domain`
    );

    const suggestions: OptimizationSuggestion[] = [];
    let rulesChecked = 0;

    for (const ruleRecord of rulesResult.records) {
      const ruleId = ruleRecord.get('id');
      const ruleName = ruleRecord.get('name');
      const beschreibung = ruleRecord.get('beschreibung') || '';
      const cypher = ruleRecord.get('cypher');
      const cypherMeasure = ruleRecord.get('cypherMeasure');
      const schwellwert = ruleRecord.get('schwellwert') ?? 0;
      const richtung = (ruleRecord.get('richtung') || 'minimieren') as Richtung;
      const operator = (ruleRecord.get('operator') || 'MOVE') as Operator;
      const domain = (ruleRecord.get('domain') || 'Architektur') as Domain;

      if (!cypher) continue;

      rulesChecked++;

      try {
        // Get current metric if measure query exists
        let metricBefore: number | null = null;
        if (cypherMeasure) {
          const measureResult = await session.run(cypherMeasure);
          if (measureResult.records.length > 0) {
            metricBefore = Number(measureResult.records[0].get('metricValue')) || 0;
          }
        }

        // Check if optimization is needed
        const needsOptimization = metricBefore !== null && (
          (richtung === 'minimieren' && metricBefore > schwellwert) ||
          (richtung === 'maximieren' && metricBefore < schwellwert)
        );

        if (needsOptimization || metricBefore === null) {
          // Get optimization suggestions
          const result = await session.run(cypher);
          for (const record of result.records) {
            suggestions.push({
              ruleId,
              ruleName,
              beschreibung,
              kandidat: record.get('kandidat') || 'Unknown',
              von: record.get('von') || '',
              nach: record.get('nach') || '',
              grund: record.get('grund') || '',
              operator,
              metricBefore,
              metricAfter: null, // Would need simulation
              delta: null,
              deltaPercent: null,
              domain
            });
          }

          if (result.records.length > 0) {
            await updateRuleCounters(driver, ruleId, result.records.length);
          }
        }
      } catch (err) {
        console.error(`Error executing optimization rule ${ruleId}: ${err}`);
      }
    }

    return {
      suggestions,
      rulesChecked,
      totalSuggestions: suggestions.length
    };
  } finally {
    await session.close();
  }
}
