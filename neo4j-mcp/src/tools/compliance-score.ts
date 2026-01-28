import { Driver } from 'neo4j-driver';

export interface StandardScore {
  standard: string;
  totalRequirements: number;
  compliantRequirements: number;
  score: number;
  details: {
    vollstaendig: number;
    teilweise: number;
    fehlend: number;
  };
}

export interface ComplianceScoreResult {
  overallScore: number;
  standards: StandardScore[];
  summary: {
    totalRequirements: number;
    totalCompliant: number;
    standardCount: number;
  };
}

export async function calculateComplianceScore(driver: Driver): Promise<ComplianceScoreResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });

  try {
    // Get compliance status per standard based on actual data model
    // Check: SystemReq traced from StakeholderReq, SoftwareReq has Test
    const result = await session.run(
      `// Group by standard from SystemReq
       MATCH (sys:SystemReq)
       WITH COALESCE(sys.standard, 'Allgemein') AS standard, sys

       // Check if traced from StakeholderReq
       OPTIONAL MATCH (stk:StakeholderReq)-[:TRACED_TO]->(sys)
       WITH standard, sys, stk IS NOT NULL AS hasTrace

       // Check if downstream SoftwareReq has tests
       OPTIONAL MATCH (sys)-[:TRACED_TO]->(sw:SoftwareReq)
       OPTIONAL MATCH (sw)-[:VERIFIED_BY]->(tc:TestCase)
       WITH standard, sys, hasTrace, sw, tc IS NOT NULL AS hasTest

       // Determine status per SystemReq
       WITH standard, sys,
            CASE
              WHEN hasTrace AND hasTest THEN 'vollstaendig'
              WHEN hasTrace OR hasTest THEN 'teilweise'
              ELSE 'fehlend'
            END AS status

       // Aggregate per standard
       WITH standard,
            count(DISTINCT sys) AS total,
            sum(CASE WHEN status = 'vollstaendig' THEN 1 ELSE 0 END) AS vollstaendig,
            sum(CASE WHEN status = 'teilweise' THEN 1 ELSE 0 END) AS teilweise,
            sum(CASE WHEN status = 'fehlend' THEN 1 ELSE 0 END) AS fehlend
       RETURN standard, total, vollstaendig, teilweise, fehlend
       ORDER BY standard`
    );

    const standards: StandardScore[] = result.records.map(record => {
      const total = toNumber(record.get('total'));
      const vollstaendig = toNumber(record.get('vollstaendig'));
      const teilweise = toNumber(record.get('teilweise'));
      const fehlend = toNumber(record.get('fehlend'));

      // Score calculation: vollstaendig = 100%, teilweise = 50%, fehlend = 0%
      const compliant = vollstaendig + (teilweise * 0.5);
      const score = total > 0 ? Math.round((compliant / total) * 100) : 0;

      return {
        standard: record.get('standard'),
        totalRequirements: total,
        compliantRequirements: vollstaendig,
        score,
        details: {
          vollstaendig,
          teilweise,
          fehlend
        }
      };
    });

    // If no standards found, provide a default check
    if (standards.length === 0) {
      // Fallback: check SoftwareReq test coverage
      const fallbackResult = await session.run(
        `MATCH (sw:SoftwareReq)
         OPTIONAL MATCH (sw)-[:VERIFIED_BY]->(tc:TestCase)
         WITH sw, tc IS NOT NULL AS hasTest
         WITH count(sw) AS total,
              sum(CASE WHEN hasTest THEN 1 ELSE 0 END) AS withTest
         RETURN 'A-SPICE SWE.4' AS standard, total,
                withTest AS vollstaendig,
                0 AS teilweise,
                total - withTest AS fehlend`
      );

      if (fallbackResult.records.length > 0) {
        const record = fallbackResult.records[0];
        const total = toNumber(record.get('total'));
        const vollstaendig = toNumber(record.get('vollstaendig'));
        const fehlend = toNumber(record.get('fehlend'));
        const score = total > 0 ? Math.round((vollstaendig / total) * 100) : 0;

        standards.push({
          standard: record.get('standard'),
          totalRequirements: total,
          compliantRequirements: vollstaendig,
          score,
          details: {
            vollstaendig,
            teilweise: 0,
            fehlend
          }
        });
      }
    }

    // Calculate overall statistics
    const totalRequirements = standards.reduce((sum, s) => sum + s.totalRequirements, 0);
    const totalCompliant = standards.reduce((sum, s) => sum + s.compliantRequirements, 0);
    const overallScore = totalRequirements > 0
      ? Math.round((standards.reduce((sum, s) => sum + (s.score * s.totalRequirements), 0) / totalRequirements))
      : 0;

    return {
      overallScore,
      standards,
      summary: {
        totalRequirements,
        totalCompliant,
        standardCount: standards.length
      }
    };
  } finally {
    await session.close();
  }
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'low' in value) {
    return (value as { low: number }).low;
  }
  return 0;
}
