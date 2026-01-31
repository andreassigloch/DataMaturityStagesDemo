/**
 * MCP Tool Registry
 * @author andreas@siglochconsulting
 *
 * Centralized tool definitions and handler routing
 */

import { Driver } from 'neo4j-driver';

import { executeQuery } from './query.js';
import { analyzeImpact } from './impact-analysis.js';
import { validateRules, executeScoring, generateOptimizations } from './validate.js';
import { addRule, toggleRule } from './rules.js';
import { calculateComplianceScore } from './compliance-score.js';
import { analyzeCentrality } from './centrality.js';
import { predictMissingLinks } from './predict-links.js';
import { findSimilarRequirements } from './similarity.js';
import { recordFeedback } from './record-feedback.js';
import { detectPatterns } from './detect-patterns.js';
import { getLearningTimeline } from './learning-timeline.js';
import { getMemoryStats } from './memory-stats.js';
import { getDbInfo } from './db-info.js';

// =============================================================================
// Tool Definitions (for ListToolsRequestSchema)
// =============================================================================

export const toolDefinitions = [
  {
    name: 'db_info',
    description: 'Zeige Informationen über die verbundene Datenbank: Projektname, Version, Domain, Statistiken.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'query',
    description: 'Führe Read-Only Cypher-Queries aus. Für Traversierungen, Aggregationen, Suchen in der Requirements-Datenbank.',
    inputSchema: {
      type: 'object',
      properties: {
        cypher: { type: 'string', description: 'Cypher-Query (read-only)' }
      },
      required: ['cypher']
    }
  },
  {
    name: 'impact_analysis',
    description: 'Zeige alle betroffenen Elemente wenn ein Requirement sich ändert. Rekursive downstream Traversierung über alle Beziehungen.',
    inputSchema: {
      type: 'object',
      properties: {
        requirementId: { type: 'string', description: 'ID der Anforderung (z.B. REQ-SYS-001)' }
      },
      required: ['requirementId']
    }
  },
  {
    name: 'validate',
    description: 'Prüfe alle aktiven Validierungsregeln und zeige Verstöße.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'add_rule',
    description: 'CR-010: Füge neue Regel hinzu (Validierung, Scoring oder Optimierung).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name der Regel' },
        beschreibung: { type: 'string', description: 'Beschreibung was die Regel prüft' },
        ebene: { type: 'string', enum: ['Struktur', 'Inhalt', 'Konsistenz', 'Vollstaendigkeit'], description: 'Prüfungs-Ebene' },
        wirkung: { type: 'string', enum: ['Validierung', 'Scoring', 'Optimierung'], description: 'Wirkungs-Typ' },
        cypher: { type: 'string', description: 'Cypher-Query für Prüfung/Berechnung' },
        cypher_measure: { type: 'string', description: 'Optional: Metrik-Query' },
        schwellwert: { type: 'number', description: 'Optional: Grenzwert' },
        richtung: { type: 'string', enum: ['minimieren', 'maximieren'], description: 'Optional: Optimierungsrichtung' },
        operator: { type: 'string', enum: ['SPLIT', 'MERGE', 'MOVE', 'CREATE'], description: 'Optional: Move-Operator' },
        schwere: { type: 'string', enum: ['fehler', 'warnung', 'info'], description: 'Schweregrad' },
        domain: { type: 'string', enum: ['Traceability', 'Safety', 'Quality', 'Architektur'], description: 'Anwendungsbereich' },
        standard: { type: 'string', description: 'Zugehöriger Standard' },
        quelle: { type: 'string', enum: ['manuell', 'pattern', 'feedback', 'import'], description: 'Herkunft' },
        confidence: { type: 'number', description: 'Konfidenz 0-1' }
      },
      required: ['name', 'ebene', 'wirkung', 'cypher', 'schwere', 'domain', 'standard']
    }
  },
  {
    name: 'toggle_rule',
    description: 'Aktiviere oder deaktiviere eine Validierungsregel.',
    inputSchema: {
      type: 'object',
      properties: {
        ruleId: { type: 'string', description: 'ID der Regel' },
        aktiv: { type: 'boolean', description: 'true = aktivieren, false = deaktivieren' }
      },
      required: ['ruleId', 'aktiv']
    }
  },
  {
    name: 'compliance_score',
    description: 'Berechne Compliance-Score pro Standard.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'scoring',
    description: 'CR-010: Führe alle Scoring-Regeln aus und gib Kennzahlen zurück.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'optimize',
    description: 'CR-010: Generiere Optimierungsvorschläge basierend auf Optimierungs-Regeln.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'centrality_analysis',
    description: 'Analysiere Centrality-Metriken: PageRank für Wichtigkeit, Betweenness für Bottlenecks.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Anzahl Top-Ergebnisse (default: 5)' },
        nodeLabel: { type: 'string', description: 'Optional: Filter auf Knotentyp' }
      }
    }
  },
  {
    name: 'predict_missing_links',
    description: 'Sage fehlende Traceability-Links voraus.',
    inputSchema: {
      type: 'object',
      properties: {
        minConfidence: { type: 'number', description: 'Minimale Konfidenz (default: 0.5)' },
        limit: { type: 'integer', description: 'Maximale Anzahl (default: 10)' }
      }
    }
  },
  {
    name: 'find_similar_requirements',
    description: 'Finde strukturell ähnliche Requirements (Jaccard Similarity).',
    inputSchema: {
      type: 'object',
      properties: {
        requirementId: { type: 'string', description: 'ID des Referenz-Requirements' },
        limit: { type: 'integer', description: 'Anzahl (default: 5)' },
        minSimilarity: { type: 'number', description: 'Minimale Ähnlichkeit (default: 0.3)' }
      },
      required: ['requirementId']
    }
  },
  {
    name: 'record_feedback',
    description: 'Speichere Feedback zu einem Requirement.',
    inputSchema: {
      type: 'object',
      properties: {
        targetId: { type: 'string', description: 'ID des Requirements' },
        issue: { type: 'string', description: 'Beschreibung des Feedbacks' },
        type: { type: 'string', enum: ['review', 'observation', 'question'], description: 'Art des Feedbacks' }
      },
      required: ['targetId', 'issue']
    }
  },
  {
    name: 'detect_patterns',
    description: 'Erkenne Anti-Patterns in Requirements.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'learning_timeline',
    description: 'Zeige was das System wann gelernt hat.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Anzahl Events (default: 50)' }
      }
    }
  },
  {
    name: 'memory_stats',
    description: 'Zeige Statistiken über das System-Gedächtnis.',
    inputSchema: { type: 'object', properties: {} }
  }
];

// =============================================================================
// Tool Handler (for CallToolRequestSchema)
// =============================================================================

type ToolArgs = Record<string, unknown>;

export async function handleToolCall(
  driver: Driver,
  name: string,
  args: ToolArgs | undefined
) {
  try {
    const result = await executeToolLogic(driver, name, args);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ error: errorMessage }, null, 2) }],
      isError: true
    };
  }
}

async function executeToolLogic(
  driver: Driver,
  name: string,
  args: ToolArgs | undefined
): Promise<unknown> {
  switch (name) {
    case 'db_info':
      return getDbInfo(driver);

    case 'query': {
      const cypher = args?.cypher as string;
      if (!cypher) throw new Error('cypher parameter is required');
      return executeQuery(driver, cypher);
    }

    case 'impact_analysis': {
      const requirementId = args?.requirementId as string;
      if (!requirementId) throw new Error('requirementId parameter is required');
      return analyzeImpact(driver, requirementId);
    }

    case 'validate':
      return validateRules(driver);

    case 'add_rule': {
      const ruleParams = {
        name: args?.name as string,
        beschreibung: args?.beschreibung as string | undefined,
        ebene: args?.ebene as 'Struktur' | 'Inhalt' | 'Konsistenz' | 'Vollstaendigkeit',
        wirkung: args?.wirkung as 'Validierung' | 'Scoring' | 'Optimierung',
        cypher: args?.cypher as string,
        cypher_measure: args?.cypher_measure as string | undefined,
        schwellwert: args?.schwellwert as number | undefined,
        richtung: args?.richtung as 'minimieren' | 'maximieren' | undefined,
        operator: args?.operator as 'SPLIT' | 'MERGE' | 'MOVE' | 'CREATE' | undefined,
        schwere: args?.schwere as 'fehler' | 'warnung' | 'info',
        domain: args?.domain as 'Traceability' | 'Safety' | 'Quality' | 'Architektur',
        standard: args?.standard as string,
        quelle: args?.quelle as 'manuell' | 'pattern' | 'feedback' | 'import' | undefined,
        confidence: args?.confidence as number | undefined
      };
      if (!ruleParams.name || !ruleParams.ebene || !ruleParams.wirkung ||
          !ruleParams.cypher || !ruleParams.schwere || !ruleParams.domain || !ruleParams.standard) {
        throw new Error('Required: name, ebene, wirkung, cypher, schwere, domain, standard');
      }
      return addRule(driver, ruleParams);
    }

    case 'toggle_rule': {
      const ruleId = args?.ruleId as string;
      const aktiv = args?.aktiv as boolean;
      if (!ruleId || typeof aktiv !== 'boolean') {
        throw new Error('ruleId and aktiv parameters are required');
      }
      return toggleRule(driver, ruleId, aktiv);
    }

    case 'compliance_score':
      return calculateComplianceScore(driver);

    case 'scoring':
      return executeScoring(driver);

    case 'optimize':
      return generateOptimizations(driver);

    case 'centrality_analysis':
      return analyzeCentrality(driver, {
        limit: args?.limit as number,
        nodeLabel: args?.nodeLabel as string
      });

    case 'predict_missing_links':
      return predictMissingLinks(driver, {
        minConfidence: args?.minConfidence as number,
        limit: args?.limit as number
      });

    case 'find_similar_requirements': {
      const requirementId = args?.requirementId as string;
      if (!requirementId) throw new Error('requirementId parameter is required');
      return findSimilarRequirements(driver, requirementId, {
        limit: args?.limit as number,
        minSimilarity: args?.minSimilarity as number
      });
    }

    case 'record_feedback': {
      const targetId = args?.targetId as string;
      const issue = args?.issue as string;
      if (!targetId || !issue) throw new Error('targetId and issue parameters are required');
      return recordFeedback(driver, {
        targetId,
        issue,
        type: args?.type as 'review' | 'observation' | 'question'
      });
    }

    case 'detect_patterns':
      return detectPatterns(driver);

    case 'learning_timeline':
      return getLearningTimeline(driver, { limit: args?.limit as number });

    case 'memory_stats':
      return getMemoryStats(driver);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
