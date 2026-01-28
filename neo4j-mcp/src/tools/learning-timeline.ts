/**
 * Learning Timeline Tool - Show System Learning History
 * CR-009: Stufe 7 - Learning System
 * @author andreas@siglochconsulting
 */

import { Driver } from 'neo4j-driver';

interface TimelineEvent {
  id: string;
  type: 'feedback_created' | 'pattern_detected' | 'pattern_candidate';
  timestamp: string;
  description: string;
  confidence?: number;
  relatedId?: string;
}

interface LearningTimelineResult {
  events: TimelineEvent[];
  summary: {
    totalEvents: number;
    todayEvents: number;
    feedbackEvents: number;
    patternEvents: number;
    latestEvent: TimelineEvent | null;
  };
  growthMetrics: {
    eventsThisWeek: number;
    patternsConfirmedThisWeek: number;
    feedbackThisWeek: number;
  };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'low' in value) {
    return (value as { low: number }).low;
  }
  return 0;
}

export async function getLearningTimeline(
  driver: Driver,
  options?: { limit?: number; since?: string }
): Promise<LearningTimelineResult> {
  const session = driver.session({ defaultAccessMode: 'READ' });
  const limit = options?.limit ?? 50;

  try {
    // Get learning events
    const eventsResult = await session.run(`
      MATCH (le:LearningEvent)
      RETURN
        le.id AS id,
        le.type AS type,
        toString(le.timestamp) AS timestamp,
        le.description AS description,
        le.confidence AS confidence
      ORDER BY le.timestamp DESC
      LIMIT $limit
    `, { limit });

    const events: TimelineEvent[] = eventsResult.records.map(record => ({
      id: record.get('id'),
      type: record.get('type'),
      timestamp: record.get('timestamp'),
      description: record.get('description'),
      confidence: record.get('confidence'),
    }));

    // If no events from LearningEvent nodes, check Feedback and Pattern nodes
    if (events.length === 0) {
      const fallbackResult = await session.run(`
        // Get feedback as events
        MATCH (f:Feedback)
        RETURN
          f.id AS id,
          'feedback_created' AS type,
          toString(f.createdAt) AS timestamp,
          'Feedback: ' + f.issue AS description,
          null AS confidence
        ORDER BY f.createdAt DESC
        LIMIT $limit

        UNION ALL

        // Get patterns as events
        MATCH (p:Pattern)
        WHERE p.status = 'confirmed'
        RETURN
          p.id AS id,
          'pattern_detected' AS type,
          toString(COALESCE(p.lastSeen, datetime())) AS timestamp,
          'Pattern erkannt: ' + p.name AS description,
          p.confidence AS confidence
        ORDER BY p.lastSeen DESC
        LIMIT $limit
      `, { limit });

      for (const record of fallbackResult.records) {
        events.push({
          id: record.get('id'),
          type: record.get('type'),
          timestamp: record.get('timestamp'),
          description: record.get('description'),
          confidence: record.get('confidence'),
        });
      }

      // Sort by timestamp descending
      events.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateB.getTime() - dateA.getTime();
      });
    }

    // Calculate summary
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.timestamp?.startsWith(today)).length;
    const feedbackEvents = events.filter(e => e.type === 'feedback_created').length;
    const patternEvents = events.filter(e =>
      e.type === 'pattern_detected' || e.type === 'pattern_candidate'
    ).length;

    // Get growth metrics
    const metricsResult = await session.run(`
      // Events this week
      MATCH (le:LearningEvent)
      WHERE le.timestamp >= datetime() - duration('P7D')
      WITH count(le) AS eventsThisWeek

      // Patterns confirmed this week
      MATCH (p:Pattern {status: 'confirmed'})
      WHERE p.lastSeen >= datetime() - duration('P7D')
      WITH eventsThisWeek, count(p) AS patternsThisWeek

      // Feedback this week
      MATCH (f:Feedback)
      WHERE f.createdAt >= datetime() - duration('P7D')
      RETURN eventsThisWeek, patternsThisWeek, count(f) AS feedbackThisWeek
    `);

    const metrics = metricsResult.records[0];

    return {
      events: events.slice(0, limit),
      summary: {
        totalEvents: events.length,
        todayEvents,
        feedbackEvents,
        patternEvents,
        latestEvent: events[0] || null,
      },
      growthMetrics: {
        eventsThisWeek: toNumber(metrics?.get('eventsThisWeek')) || 0,
        patternsConfirmedThisWeek: toNumber(metrics?.get('patternsThisWeek')) || 0,
        feedbackThisWeek: toNumber(metrics?.get('feedbackThisWeek')) || 0,
      },
    };
  } finally {
    await session.close();
  }
}
