#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import neo4j, { Driver } from 'neo4j-driver';

import { executeQuery } from './tools/query.js';
import { analyzeImpact } from './tools/impact-analysis.js';
import { validateRules } from './tools/validate.js';
import { addRule, toggleRule } from './tools/rules.js';
import { calculateComplianceScore } from './tools/compliance-score.js';
// CR-009: Stufe 6 - ML & Prediction
import { analyzeCentrality } from './tools/centrality.js';
import { predictMissingLinks } from './tools/predict-links.js';
import { findSimilarRequirements } from './tools/similarity.js';
// CR-009: Stufe 7 - Learning System
import { recordFeedback } from './tools/record-feedback.js';
import { detectPatterns } from './tools/detect-patterns.js';
import { getLearningTimeline } from './tools/learning-timeline.js';
import { getMemoryStats } from './tools/memory-stats.js';

// Neo4j connection configuration
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'demo-password';

// Expected database fingerprint - Demo data must contain these markers
const EXPECTED_FINGERPRINT = {
  requiredLabels: ['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase'],
  markerNode: 'STK-001', // First stakeholder requirement
  markerProperty: 'Abbiegeabsicht' // Part of STK-001 title
};

let driver: Driver;

// Verify this is the correct demo database (not production!)
async function verifyDemoDatabase(d: Driver): Promise<boolean> {
  const session = d.session({ defaultAccessMode: 'READ' });

  try {
    // Check 1: Verify marker node exists with expected content
    const markerResult = await session.run(
      `MATCH (n {id: $markerId})
       WHERE n.titel CONTAINS $markerProperty
       RETURN n.id AS id`,
      { markerId: EXPECTED_FINGERPRINT.markerNode, markerProperty: EXPECTED_FINGERPRINT.markerProperty }
    );

    if (markerResult.records.length === 0) {
      console.error('❌ SECURITY: Marker node STK-001 not found or wrong content');
      console.error('   This may not be the demo database!');
      return false;
    }

    // Check 2: Verify expected labels exist
    const labelResult = await session.run(
      `CALL db.labels() YIELD label RETURN collect(label) AS labels`
    );

    const existingLabels = labelResult.records[0]?.get('labels') as string[] || [];
    const missingLabels = EXPECTED_FINGERPRINT.requiredLabels.filter(
      l => !existingLabels.includes(l)
    );

    if (missingLabels.length > 0) {
      console.error('❌ SECURITY: Missing expected labels:', missingLabels.join(', '));
      console.error('   This may not be the demo database!');
      return false;
    }

    // Check 3: Verify node count is reasonable for demo (not a huge production DB)
    const countResult = await session.run(`MATCH (n) RETURN count(n) AS total`);
    const nodeCount = countResult.records[0]?.get('total').toNumber() || 0;

    if (nodeCount > 1000) {
      console.error('❌ SECURITY: Too many nodes (' + nodeCount + ')');
      console.error('   Demo database should have ~26-50 nodes. This looks like production!');
      return false;
    }

    console.error('✅ SECURITY: Database fingerprint verified');
    console.error('   - Marker node STK-001: found');
    console.error('   - Required labels: all present');
    console.error('   - Node count: ' + nodeCount + ' (within demo range)');

    return true;
  } finally {
    await session.close();
  }
}

// Initialize Neo4j connection
async function initNeo4j(): Promise<Driver> {
  const d = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

  // Verify connectivity
  await d.verifyConnectivity();
  console.error('Connected to Neo4j at', NEO4J_URI);

  // SECURITY: Verify this is the demo database
  const isDemo = await verifyDemoDatabase(d);
  if (!isDemo) {
    await d.close();
    throw new Error('SECURITY: Connected database is not the demo database. Refusing to continue.');
  }

  return d;
}

// Create MCP server
const server = new Server(
  {
    name: 'neo4j-requirements-traceability',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query',
        description: 'Führe Read-Only Cypher-Queries aus. Für Traversierungen, Aggregationen, Suchen in der Requirements-Datenbank.',
        inputSchema: {
          type: 'object',
          properties: {
            cypher: {
              type: 'string',
              description: 'Cypher-Query (read-only)'
            }
          },
          required: ['cypher']
        }
      },
      {
        name: 'impact_analysis',
        description: 'Zeige alle betroffenen Elemente wenn ein Requirement sich ändert. Rekursive downstream Traversierung über alle Beziehungen. Zeigt welche Tests, Komponenten, andere Requirements betroffen sind.',
        inputSchema: {
          type: 'object',
          properties: {
            requirementId: {
              type: 'string',
              description: 'ID der Anforderung (z.B. REQ-SYS-001)'
            }
          },
          required: ['requirementId']
        }
      },
      {
        name: 'validate',
        description: 'Prüfe alle aktiven Validierungsregeln und zeige Verstöße. Führt alle Regel-Cypher aus (:Regel Knoten mit aktiv: true), sammelt und aggregiert Ergebnisse.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'add_rule',
        description: 'Füge neue Validierungsregel hinzu. Erstellt neuen :Regel Knoten mit auto-generierter ID.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name der Regel'
            },
            typ: {
              type: 'string',
              description: 'Typ der Regel (z.B. Traceability, Coverage, Consistency)'
            },
            cypher: {
              type: 'string',
              description: 'Cypher-Query die Verstöße findet (sollte betroffene Elemente zurückgeben)'
            },
            schwere: {
              type: 'string',
              enum: ['fehler', 'warnung'],
              description: 'Schweregrad der Regel'
            },
            standard: {
              type: 'string',
              description: 'Zugehöriger Standard (z.B. A-SPICE, ISO 26262)'
            }
          },
          required: ['name', 'typ', 'cypher', 'schwere', 'standard']
        }
      },
      {
        name: 'toggle_rule',
        description: 'Aktiviere oder deaktiviere eine Validierungsregel.',
        inputSchema: {
          type: 'object',
          properties: {
            ruleId: {
              type: 'string',
              description: 'ID der Regel'
            },
            aktiv: {
              type: 'boolean',
              description: 'true = aktivieren, false = deaktivieren'
            }
          },
          required: ['ruleId', 'aktiv']
        }
      },
      {
        name: 'compliance_score',
        description: 'Berechne Compliance-Score pro Standard. Aggregation über alle Requirements, gruppiert nach Standard (A-SPICE, ISO 26262), gibt Prozent-Scores zurück.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      // CR-009: Stufe 6 - ML & Prediction
      {
        name: 'centrality_analysis',
        description: 'Analysiere Centrality-Metriken: PageRank für Wichtigkeit, Betweenness für Bottlenecks. Identifiziert kritische Requirements.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'integer',
              description: 'Anzahl Top-Ergebnisse (default: 5)'
            },
            nodeLabel: {
              type: 'string',
              description: 'Optional: Filter auf bestimmten Knotentyp (z.B. SystemReq)'
            }
          }
        }
      },
      {
        name: 'predict_missing_links',
        description: 'Sage fehlende Traceability-Links voraus. Findet Requirements ohne Tests, fehlende Ableitungen, unverlinkte Abhängigkeiten.',
        inputSchema: {
          type: 'object',
          properties: {
            minConfidence: {
              type: 'number',
              description: 'Minimale Konfidenz für Vorhersagen (default: 0.5)'
            },
            limit: {
              type: 'integer',
              description: 'Maximale Anzahl Vorhersagen (default: 10)'
            }
          }
        }
      },
      {
        name: 'find_similar_requirements',
        description: 'Finde strukturell ähnliche Requirements basierend auf gemeinsamen Nachbarn (Jaccard Similarity).',
        inputSchema: {
          type: 'object',
          properties: {
            requirementId: {
              type: 'string',
              description: 'ID des Referenz-Requirements'
            },
            limit: {
              type: 'integer',
              description: 'Anzahl ähnlicher Requirements (default: 5)'
            },
            minSimilarity: {
              type: 'number',
              description: 'Minimale Ähnlichkeit 0-1 (default: 0.3)'
            }
          },
          required: ['requirementId']
        }
      },
      // CR-009: Stufe 7 - Learning System
      {
        name: 'record_feedback',
        description: 'Speichere Feedback zu einem Requirement. Das System lernt aus Review-Kommentaren und erkennt Patterns.',
        inputSchema: {
          type: 'object',
          properties: {
            targetId: {
              type: 'string',
              description: 'ID des Requirements (z.B. SYS-003)'
            },
            issue: {
              type: 'string',
              description: 'Beschreibung des Feedbacks/Problems'
            },
            type: {
              type: 'string',
              enum: ['review', 'observation', 'question'],
              description: 'Art des Feedbacks (default: review)'
            }
          },
          required: ['targetId', 'issue']
        }
      },
      {
        name: 'detect_patterns',
        description: 'Erkenne Anti-Patterns in Requirements. Sucht nach vagen Zeitangaben, unspezifizierten Bedingungen, fehlenden Einheiten.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'learning_timeline',
        description: 'Zeige was das System wann gelernt hat. Chronologische Übersicht aller Learning Events.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'integer',
              description: 'Anzahl Events (default: 50)'
            }
          }
        }
      },
      {
        name: 'memory_stats',
        description: 'Zeige Statistiken über das System-Gedächtnis. Feedback-Einträge, erkannte Patterns, Knowledge Score.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query': {
        const cypher = args?.cypher as string;
        if (!cypher) {
          throw new Error('cypher parameter is required');
        }
        const result = await executeQuery(driver, cypher);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'impact_analysis': {
        const requirementId = args?.requirementId as string;
        if (!requirementId) {
          throw new Error('requirementId parameter is required');
        }
        const result = await analyzeImpact(driver, requirementId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'validate': {
        const result = await validateRules(driver);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'add_rule': {
        const ruleParams = {
          name: args?.name as string,
          typ: args?.typ as string,
          cypher: args?.cypher as string,
          schwere: args?.schwere as 'fehler' | 'warnung',
          standard: args?.standard as string
        };

        if (!ruleParams.name || !ruleParams.typ || !ruleParams.cypher || !ruleParams.schwere || !ruleParams.standard) {
          throw new Error('All parameters (name, typ, cypher, schwere, standard) are required');
        }

        const result = await addRule(driver, ruleParams);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'toggle_rule': {
        const ruleId = args?.ruleId as string;
        const aktiv = args?.aktiv as boolean;

        if (!ruleId || typeof aktiv !== 'boolean') {
          throw new Error('ruleId and aktiv parameters are required');
        }

        const result = await toggleRule(driver, ruleId, aktiv);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'compliance_score': {
        const result = await calculateComplianceScore(driver);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      // CR-009: Stufe 6 - ML & Prediction
      case 'centrality_analysis': {
        const result = await analyzeCentrality(driver, {
          limit: args?.limit as number,
          nodeLabel: args?.nodeLabel as string
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'predict_missing_links': {
        const result = await predictMissingLinks(driver, {
          minConfidence: args?.minConfidence as number,
          limit: args?.limit as number
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'find_similar_requirements': {
        const requirementId = args?.requirementId as string;
        if (!requirementId) {
          throw new Error('requirementId parameter is required');
        }
        const result = await findSimilarRequirements(driver, requirementId, {
          limit: args?.limit as number,
          minSimilarity: args?.minSimilarity as number
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      // CR-009: Stufe 7 - Learning System
      case 'record_feedback': {
        const targetId = args?.targetId as string;
        const issue = args?.issue as string;
        if (!targetId || !issue) {
          throw new Error('targetId and issue parameters are required');
        }
        const result = await recordFeedback(driver, {
          targetId,
          issue,
          type: args?.type as 'review' | 'observation' | 'question'
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'detect_patterns': {
        const result = await detectPatterns(driver);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'learning_timeline': {
        const result = await getLearningTimeline(driver, {
          limit: args?.limit as number
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'memory_stats': {
        const result = await getMemoryStats(driver);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Main entry point
async function main() {
  try {
    // Initialize Neo4j connection
    driver = await initNeo4j();

    // Start MCP server
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Neo4j MCP Server running');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  if (driver) {
    await driver.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down...');
  if (driver) {
    await driver.close();
  }
  process.exit(0);
});

main();
