import { Driver } from 'neo4j-driver';

export interface Violation {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  severity: 'fehler' | 'warnung';
  standard: string;
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
  violations: Violation[];
  rulesChecked: number;
  summary: {
    byStandard: Record<string, { errors: number; warnings: number }>;
    byRuleType: Record<string, number>;
  };
}

export async function validateRules(driver: Driver): Promise<ValidationResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });

  try {
    // Get all active rules
    const rulesResult = await session.run(
      `MATCH (r:Regel {aktiv: true})
       RETURN r.id AS id, r.name AS name, r.typ AS typ,
              r.cypher AS cypher, r.schwere AS schwere, r.standard AS standard`
    );

    const violations: Violation[] = [];
    let rulesChecked = 0;

    for (const ruleRecord of rulesResult.records) {
      const ruleId = ruleRecord.get('id');
      const ruleName = ruleRecord.get('name');
      const ruleType = ruleRecord.get('typ');
      const cypher = ruleRecord.get('cypher');
      const severity = ruleRecord.get('schwere') || 'warnung';
      const standard = ruleRecord.get('standard') || 'Allgemein';

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
            severity: severity as 'fehler' | 'warnung',
            standard,
            affectedElements
          });
        }
      } catch (err) {
        // Log but continue with other rules
        console.error(`Error executing rule ${ruleId}: ${err}`);
      }
    }

    // Calculate summary statistics
    let errorCount = 0;
    let warningCount = 0;
    const byStandard: Record<string, { errors: number; warnings: number }> = {};
    const byRuleType: Record<string, number> = {};

    for (const violation of violations) {
      if (violation.severity === 'fehler') {
        errorCount += violation.affectedElements.length;
      } else {
        warningCount += violation.affectedElements.length;
      }

      if (!byStandard[violation.standard]) {
        byStandard[violation.standard] = { errors: 0, warnings: 0 };
      }
      if (violation.severity === 'fehler') {
        byStandard[violation.standard].errors += violation.affectedElements.length;
      } else {
        byStandard[violation.standard].warnings += violation.affectedElements.length;
      }

      byRuleType[violation.ruleType] = (byRuleType[violation.ruleType] || 0) + violation.affectedElements.length;
    }

    return {
      totalViolations: errorCount + warningCount,
      errorCount,
      warningCount,
      violations,
      rulesChecked,
      summary: {
        byStandard,
        byRuleType
      }
    };
  } finally {
    await session.close();
  }
}
