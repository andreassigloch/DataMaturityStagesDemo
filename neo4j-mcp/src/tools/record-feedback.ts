/**
 * Record Feedback Tool - Store Review Comments
 * CR-009: Stufe 7 - Learning System
 * @author andreas@siglochconsulting
 */

import { Driver } from 'neo4j-driver';

interface RecordFeedbackInput {
  targetId: string;
  issue: string;
  type?: 'review' | 'observation' | 'question';
}

interface FeedbackResult {
  feedbackId: string;
  targetId: string;
  issue: string;
  type: string;
  createdAt: string;
  memoryStats: {
    totalFeedback: number;
    openFeedback: number;
    resolvedFeedback: number;
  };
}

export async function recordFeedback(
  driver: Driver,
  input: RecordFeedbackInput
): Promise<FeedbackResult> {
  const session = driver.session({ defaultAccessMode: 'WRITE' });

  try {
    // Verify target exists
    const targetCheck = await session.run(`
      MATCH (target)
      WHERE target.id = $targetId
      RETURN target.id AS id, labels(target)[0] AS type
    `, { targetId: input.targetId });

    if (targetCheck.records.length === 0) {
      throw new Error(`Target ${input.targetId} nicht gefunden`);
    }

    // Generate feedback ID
    const feedbackIdResult = await session.run(`
      MATCH (f:Feedback)
      RETURN count(f) AS count
    `);
    const count = feedbackIdResult.records[0]?.get('count')?.low ?? 0;
    const feedbackId = `FB-${String(count + 1).padStart(3, '0')}`;

    // Create feedback node and link to target
    const result = await session.run(`
      MATCH (target)
      WHERE target.id = $targetId
      CREATE (f:Feedback {
        id: $feedbackId,
        targetId: $targetId,
        type: $type,
        issue: $issue,
        resolved: false,
        createdAt: datetime()
      })
      CREATE (f)-[:REFERENCES]->(target)

      // Also create a LearningEvent
      CREATE (le:LearningEvent {
        id: 'LE-' + toString(timestamp()),
        type: 'feedback_created',
        description: 'Feedback zu ' + $targetId + ' gespeichert',
        timestamp: datetime()
      })
      CREATE (le)-[:TRIGGERED_BY]->(f)

      WITH f
      // Get memory stats
      MATCH (allF:Feedback)
      WITH f, count(allF) AS total
      MATCH (openF:Feedback {resolved: false})
      WITH f, total, count(openF) AS open
      MATCH (resolvedF:Feedback {resolved: true})
      RETURN
        f.id AS feedbackId,
        f.targetId AS targetId,
        f.issue AS issue,
        f.type AS type,
        toString(f.createdAt) AS createdAt,
        total AS totalFeedback,
        open AS openFeedback,
        total - open AS resolvedFeedback
    `, {
      feedbackId,
      targetId: input.targetId,
      type: input.type || 'review',
      issue: input.issue,
    });

    const record = result.records[0];

    return {
      feedbackId: record.get('feedbackId'),
      targetId: record.get('targetId'),
      issue: record.get('issue'),
      type: record.get('type'),
      createdAt: record.get('createdAt'),
      memoryStats: {
        totalFeedback: record.get('totalFeedback')?.low ?? 0,
        openFeedback: record.get('openFeedback')?.low ?? 0,
        resolvedFeedback: record.get('resolvedFeedback')?.low ?? 0,
      },
    };
  } finally {
    await session.close();
  }
}
