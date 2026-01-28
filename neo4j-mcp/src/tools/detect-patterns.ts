/**
 * Pattern Detection Tool - Recognize Anti-Patterns in Requirements
 * CR-009: Stufe 7 - Learning System
 * @author andreas@siglochconsulting
 */

import { Driver } from 'neo4j-driver';

interface PatternMatch {
  patternId: string;
  patternName: string;
  requirementId: string;
  requirementName: string;
  matchedText: string;
  confidence: number;
}

interface DetectedPattern {
  id: string;
  name: string;
  description: string;
  regex: string;
  occurrences: number;
  confidence: number;
  status: 'confirmed' | 'candidate';
}

interface DetectPatternsResult {
  newPatterns: DetectedPattern[];
  matches: PatternMatch[];
  learningEvent: {
    id: string;
    type: string;
    description: string;
  } | null;
  summary: {
    totalPatterns: number;
    confirmedPatterns: number;
    candidatePatterns: number;
    totalMatches: number;
  };
}

// Predefined patterns based on CR-009
const PREDEFINED_PATTERNS = [
  {
    id: 'PAT-TIME-VAGUE',
    name: 'Vage Zeitangabe',
    description: 'Zeitangaben mit < oder > sind oft nicht testbar',
    regex: '(<|>)\\s*\\d+\\s*(ms|s|min)',
    confirmationThreshold: 3,
  },
  {
    id: 'PAT-CONDITION-VAGUE',
    name: 'Unspezifizierte Bedingung',
    description: 'Bedingungen wie "ohne Zündung" sind mehrdeutig',
    regex: '(ohne|bei)\\s+(Zuendung|Zuendung|Zündung|Fehler|Spannung|Betrieb)',
    confirmationThreshold: 2,
  },
  {
    id: 'PAT-NO-UNIT',
    name: 'Fehlende Einheit',
    description: 'Numerische Werte ohne Einheit sind mehrdeutig',
    regex: '\\b(\\d+(?:\\.\\d+)?\\s*)(?!(ms|s|min|Hz|cd|N|V|A|m|mm|cm|%|°)\\b)',
    confirmationThreshold: 3,
  },
];

export async function detectPatterns(
  driver: Driver
): Promise<DetectPatternsResult> {
  const session = driver.session({ defaultAccessMode: 'WRITE' });

  try {
    const matches: PatternMatch[] = [];
    const patternOccurrences: Map<string, number> = new Map();

    // Ensure predefined patterns exist in database
    for (const pattern of PREDEFINED_PATTERNS) {
      await session.run(`
        MERGE (p:Pattern {id: $id})
        ON CREATE SET
          p.name = $name,
          p.description = $description,
          p.regex = $regex,
          p.occurrences = 0,
          p.confidence = 0.0,
          p.status = 'candidate',
          p.createdAt = datetime()
        RETURN p
      `, pattern);
    }

    // Get all requirements with their text
    const requirements = await session.run(`
      MATCH (r)
      WHERE r.id IS NOT NULL
        AND (r:StakeholderReq OR r:SystemReq OR r:SoftwareReq)
        AND (r.titel IS NOT NULL OR r.beschreibung IS NOT NULL)
      RETURN
        r.id AS id,
        COALESCE(r.titel, '') + ' ' + COALESCE(r.beschreibung, '') AS text,
        COALESCE(r.titel, r.id) AS name
    `);

    // Check each requirement against each pattern
    for (const reqRecord of requirements.records) {
      const reqId = reqRecord.get('id');
      const reqText = reqRecord.get('text');
      const reqName = reqRecord.get('name');

      for (const pattern of PREDEFINED_PATTERNS) {
        try {
          const regex = new RegExp(pattern.regex, 'gi');
          const match = regex.exec(reqText);

          if (match) {
            matches.push({
              patternId: pattern.id,
              patternName: pattern.name,
              requirementId: reqId,
              requirementName: reqName,
              matchedText: match[0],
              confidence: 0.85,
            });

            const currentCount = patternOccurrences.get(pattern.id) || 0;
            patternOccurrences.set(pattern.id, currentCount + 1);
          }
        } catch {
          // Skip invalid regex
        }
      }
    }

    // Update pattern occurrences and status in database
    const newPatterns: DetectedPattern[] = [];
    let learningEvent = null;

    for (const [patternId, occurrences] of patternOccurrences.entries()) {
      const patternDef = PREDEFINED_PATTERNS.find(p => p.id === patternId);
      if (!patternDef) continue;

      const status = occurrences >= patternDef.confirmationThreshold ? 'confirmed' : 'candidate';
      const confidence = Math.min(0.5 + (occurrences * 0.1), 1.0);

      await session.run(`
        MATCH (p:Pattern {id: $patternId})
        SET p.occurrences = $occurrences,
            p.confidence = $confidence,
            p.status = $status,
            p.lastSeen = datetime()
        RETURN p
      `, { patternId, occurrences, confidence, status });

      newPatterns.push({
        id: patternId,
        name: patternDef.name,
        description: patternDef.description,
        regex: patternDef.regex,
        occurrences,
        confidence,
        status,
      });

      // Create learning event for newly confirmed patterns
      if (status === 'confirmed' && occurrences === patternDef.confirmationThreshold) {
        const leResult = await session.run(`
          CREATE (le:LearningEvent {
            id: 'LE-' + toString(timestamp()),
            type: 'pattern_detected',
            description: 'Pattern "' + $name + '" bestätigt mit ' + $occurrences + ' Matches',
            confidence: $confidence,
            timestamp: datetime()
          })
          WITH le
          MATCH (p:Pattern {id: $patternId})
          CREATE (le)-[:DETECTED]->(p)
          RETURN le.id AS id, le.type AS type, le.description AS description
        `, {
          patternId,
          name: patternDef.name,
          occurrences,
          confidence
        });

        if (leResult.records.length > 0) {
          const leRecord = leResult.records[0];
          learningEvent = {
            id: leRecord.get('id'),
            type: leRecord.get('type'),
            description: leRecord.get('description'),
          };
        }
      }
    }

    // Get summary from database
    const summaryResult = await session.run(`
      MATCH (p:Pattern)
      WITH count(p) AS total
      MATCH (confirmed:Pattern {status: 'confirmed'})
      WITH total, count(confirmed) AS confirmedCount
      MATCH (candidate:Pattern {status: 'candidate'})
      RETURN total, confirmedCount, count(candidate) AS candidateCount
    `);

    const summary = summaryResult.records[0];

    return {
      newPatterns,
      matches,
      learningEvent,
      summary: {
        totalPatterns: summary?.get('total')?.low ?? newPatterns.length,
        confirmedPatterns: summary?.get('confirmedCount')?.low ?? 0,
        candidatePatterns: summary?.get('candidateCount')?.low ?? 0,
        totalMatches: matches.length,
      },
    };
  } finally {
    await session.close();
  }
}
