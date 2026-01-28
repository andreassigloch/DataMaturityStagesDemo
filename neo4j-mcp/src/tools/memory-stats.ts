/**
 * Memory Stats Tool - System Knowledge Statistics
 * CR-009: Stufe 7 - Learning System
 * @author andreas@siglochconsulting
 */

import { Driver } from 'neo4j-driver';

interface MemoryStatsResult {
  feedback: {
    total: number;
    open: number;
    resolved: number;
    byType: Record<string, number>;
  };
  patterns: {
    total: number;
    confirmed: number;
    candidates: number;
    avgConfidence: number;
    topPatterns: Array<{
      id: string;
      name: string;
      occurrences: number;
      confidence: number;
    }>;
  };
  learningEvents: {
    total: number;
    today: number;
    thisWeek: number;
    byType: Record<string, number>;
  };
  growth: {
    feedbackRate: string;
    patternRate: string;
    knowledgeScore: number;
  };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'low' in value) {
    return (value as { low: number }).low;
  }
  return 0;
}

export async function getMemoryStats(
  driver: Driver
): Promise<MemoryStatsResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });

  try {
    // Feedback stats
    const feedbackResult = await session.run(`
      MATCH (f:Feedback)
      WITH count(f) AS total
      OPTIONAL MATCH (open:Feedback {resolved: false})
      WITH total, count(open) AS openCount
      OPTIONAL MATCH (resolved:Feedback {resolved: true})
      WITH total, openCount, count(resolved) AS resolvedCount

      // Count by type
      OPTIONAL MATCH (f:Feedback)
      WITH total, openCount, resolvedCount,
           collect({type: f.type, count: 1}) AS typeData
      UNWIND typeData AS td
      WITH total, openCount, resolvedCount, td.type AS type, count(*) AS typeCount
      RETURN total, openCount, resolvedCount,
             collect({type: type, count: typeCount}) AS byType
    `);

    const fbRecord = feedbackResult.records[0];
    const feedbackByType: Record<string, number> = {};
    const byTypeData = fbRecord?.get('byType') || [];
    for (const item of byTypeData) {
      if (item.type) {
        feedbackByType[item.type] = toNumber(item.count);
      }
    }

    // Pattern stats
    const patternResult = await session.run(`
      MATCH (p:Pattern)
      WITH count(p) AS total
      OPTIONAL MATCH (confirmed:Pattern {status: 'confirmed'})
      WITH total, count(confirmed) AS confirmedCount
      OPTIONAL MATCH (candidate:Pattern {status: 'candidate'})
      WITH total, confirmedCount, count(candidate) AS candidateCount

      // Average confidence
      OPTIONAL MATCH (p2:Pattern)
      WITH total, confirmedCount, candidateCount,
           CASE WHEN count(p2) > 0 THEN avg(p2.confidence) ELSE 0 END AS avgConf

      // Top patterns
      OPTIONAL MATCH (top:Pattern)
      WITH total, confirmedCount, candidateCount, avgConf, top
      ORDER BY top.occurrences DESC
      LIMIT 5
      RETURN total, confirmedCount, candidateCount, avgConf,
             collect({
               id: top.id,
               name: top.name,
               occurrences: top.occurrences,
               confidence: top.confidence
             }) AS topPatterns
    `);

    const patternRecord = patternResult.records[0];
    const topPatterns = (patternRecord?.get('topPatterns') || [])
      .filter((p: unknown) => p && typeof p === 'object' && 'id' in (p as Record<string, unknown>) && (p as Record<string, unknown>).id)
      .map((p: unknown) => {
        const pattern = p as Record<string, unknown>;
        return {
          id: String(pattern.id),
          name: String(pattern.name || pattern.id),
          occurrences: toNumber(pattern.occurrences),
          confidence: Number(pattern.confidence) || 0,
        };
      });

    // Learning event stats
    const eventResult = await session.run(`
      MATCH (le:LearningEvent)
      WITH count(le) AS total

      OPTIONAL MATCH (today:LearningEvent)
      WHERE today.timestamp >= datetime({hour: 0})
      WITH total, count(today) AS todayCount

      OPTIONAL MATCH (week:LearningEvent)
      WHERE week.timestamp >= datetime() - duration('P7D')
      WITH total, todayCount, count(week) AS weekCount

      // Count by type
      OPTIONAL MATCH (le:LearningEvent)
      WITH total, todayCount, weekCount, le.type AS type, count(*) AS typeCount
      RETURN total, todayCount, weekCount,
             collect({type: type, count: typeCount}) AS byType
    `);

    const eventRecord = eventResult.records[0];
    const eventsByType: Record<string, number> = {};
    const eventTypeData = eventRecord?.get('byType') || [];
    for (const item of eventTypeData) {
      if (item.type) {
        eventsByType[item.type] = toNumber(item.count);
      }
    }

    // Calculate growth metrics
    const totalFeedback = toNumber(fbRecord?.get('total')) || 0;
    const totalPatterns = toNumber(patternRecord?.get('total')) || 0;
    const confirmedPatterns = toNumber(patternRecord?.get('confirmedCount')) || 0;

    // Knowledge score: weighted combination of feedback, patterns, and events
    const knowledgeScore = Math.min(100,
      (totalFeedback * 5) +
      (confirmedPatterns * 20) +
      (toNumber(eventRecord?.get('total')) * 2)
    );

    return {
      feedback: {
        total: totalFeedback,
        open: toNumber(fbRecord?.get('openCount')) || 0,
        resolved: toNumber(fbRecord?.get('resolvedCount')) || 0,
        byType: feedbackByType,
      },
      patterns: {
        total: totalPatterns,
        confirmed: confirmedPatterns,
        candidates: toNumber(patternRecord?.get('candidateCount')) || 0,
        avgConfidence: Number(patternRecord?.get('avgConf')) || 0,
        topPatterns,
      },
      learningEvents: {
        total: toNumber(eventRecord?.get('total')) || 0,
        today: toNumber(eventRecord?.get('todayCount')) || 0,
        thisWeek: toNumber(eventRecord?.get('weekCount')) || 0,
        byType: eventsByType,
      },
      growth: {
        feedbackRate: totalFeedback > 0 ? `${totalFeedback} Einträge` : 'Keine Daten',
        patternRate: `${confirmedPatterns}/${totalPatterns} bestätigt`,
        knowledgeScore,
      },
    };
  } finally {
    await session.close();
  }
}
