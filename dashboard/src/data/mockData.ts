/**
 * Mock Data for Demo Screenshots
 * @author andreas@siglochconsulting
 *
 * Diese Daten werden für Demo-Zwecke angezeigt,
 * wenn keine Live-Daten vorhanden sind.
 */

import type { CentralityMetrics, DetectedPattern, MemoryEvent, NodeType } from '../schemas'

/**
 * Mock Centrality Metrics - basierend auf seed-data.cypher
 * CR-014: Drei Wichtungen (Impact, Change-Risk, Review-Priority)
 */
export const MOCK_CENTRALITY_METRICS: CentralityMetrics[] = [
  // ASIL D - höchste Priorität
  { nodeId: 'SYS-003', label: 'Bremslicht <50ms', type: 'SystemReq' as NodeType, impactScore: 100, changeRisk: 65, reviewPriority: 65, asil: 'D', degree: 5 },
  { nodeId: 'SW-002', label: 'Bremslicht-Schwellwert', type: 'SoftwareReq' as NodeType, impactScore: 80, changeRisk: 45, reviewPriority: 36, asil: 'D', degree: 4 },
  // ASIL B
  { nodeId: 'SYS-001', label: 'Blinker <100ms', type: 'SystemReq' as NodeType, impactScore: 60, changeRisk: 30, reviewPriority: 9, asil: 'B', degree: 3 },
  { nodeId: 'STK-002', label: 'Bremsvorgang erkennbar', type: 'StakeholderReq' as NodeType, impactScore: 60, changeRisk: 25, reviewPriority: 11, asil: 'C', degree: 3 },
  { nodeId: 'SW-001', label: 'Blinkertimer 333ms', type: 'SoftwareReq' as NodeType, impactScore: 60, changeRisk: 55, reviewPriority: 16, asil: 'B', degree: 3 },
  // ASIL A oder QM
  { nodeId: 'STK-001', label: 'Abbiegeabsicht signalisieren', type: 'StakeholderReq' as NodeType, impactScore: 40, changeRisk: 20, reviewPriority: 2, asil: 'A', degree: 2 },
  { nodeId: 'SYS-007', label: 'Warnblinker ohne Zündung', type: 'SystemReq' as NodeType, impactScore: 40, changeRisk: 70, reviewPriority: 14, asil: 'B', degree: 2 },
  { nodeId: 'SW-003', label: 'Warnblinker Override', type: 'SoftwareReq' as NodeType, impactScore: 40, changeRisk: 80, reviewPriority: 8, asil: 'A', degree: 2 },
  { nodeId: 'EXT-001', label: 'CAN BrakePedalForce', type: 'InputSpec' as NodeType, impactScore: 40, changeRisk: 35, reviewPriority: 7, asil: 'B', degree: 2 },
  { nodeId: 'TC-003', label: 'Bremslicht Timing Test', type: 'TestCase' as NodeType, impactScore: 20, changeRisk: 15, reviewPriority: 0, asil: null, degree: 1 },
]

/**
 * Mock Detected Patterns - Qualitätsprobleme
 * Vereinfacht: "Typische Fehler" statt "Anti-Patterns"
 */
export const MOCK_DETECTED_PATTERNS: DetectedPattern[] = [
  {
    id: 'pattern-1',
    name: 'Unklare Zeitangaben',
    patternType: 'cluster',
    description: '3 Requirements haben ungenaue Zeitangaben wie "<50ms" statt "30-50ms"',
    nodeIds: ['SYS-003', 'SYS-001', 'EXT-003'],
    confidence: 0.92,
    detectedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
  },
  {
    id: 'pattern-2',
    name: 'Fehlender Test',
    patternType: 'bridge',
    description: 'SW-003 "Warnblinker Override" hat keinen zugeordneten Testfall',
    nodeIds: ['SW-003'],
    confidence: 0.87,
    detectedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 min ago
  },
  {
    id: 'pattern-3',
    name: 'Zentrale Abhängigkeit',
    patternType: 'hub',
    description: 'SYS-003 hat viele eingehende Abhängigkeiten - Änderungen hier betreffen viele andere',
    nodeIds: ['SYS-003', 'SW-002', 'EXT-001', 'EXT-002'],
    confidence: 0.85,
    detectedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
  },
  {
    id: 'pattern-4',
    name: 'Unklare Bedingung',
    patternType: 'chain',
    description: 'STK-004 verwendet "bei einer Panne" - was genau ist eine "Panne"?',
    nodeIds: ['STK-004'],
    confidence: 0.78,
    detectedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 min ago
  },
  {
    id: 'pattern-5',
    name: 'Vollständige Kette',
    patternType: 'hierarchy',
    description: 'Blinker-Anforderungen sind lückenlos nachverfolgt: STK → SYS → SW → Test',
    nodeIds: ['STK-001', 'SYS-001', 'SYS-002', 'SW-001', 'TC-001', 'TC-002'],
    confidence: 0.95,
    detectedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
  },
]

/**
 * Mock Memory Events - Lernverlauf
 * CR-016: Erweitert um Chat-Sequenzen als Regelquellen
 * Zeigt was das System gelernt hat und woher die Regeln stammen
 */
export const MOCK_MEMORY_EVENTS: MemoryEvent[] = [
  // CR-016: Chat-basierte Regel-Ableitung (Hauptbeispiel)
  {
    id: 'event-chat-1',
    eventType: 'chat',
    description: 'Aus Chat-Diskussion: ASIL-Klassifizierung muss immer angegeben werden',
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    relatedNodes: ['SYS-003', 'SYS-005'],
    chatPreview: {
      messageCount: 5,
      excerpt: 'Stimmt, das sollte immer angegeben werden.',
    },
    derivedRule: {
      id: 'VAL-006',
      name: 'ASIL-Pflicht',
    },
  },
  // CR-016: Feedback-basierte Regel
  {
    id: 'event-feedback-1',
    eventType: 'feedback',
    description: 'User-Feedback: "Unklare Zeitangaben" markiert bei SYS-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    relatedNodes: ['SYS-003'],
    derivedRule: {
      id: 'VAL-003',
      name: 'Zeitangaben präzisieren',
    },
  },
  // CR-016: Pattern-basierte Regel
  {
    id: 'event-pattern-1',
    eventType: 'pattern',
    description: 'Pattern erkannt: 3x gleiches Feedback "fehlender Test" → Regel generiert',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    relatedNodes: ['SW-003', 'SW-007', 'SW-009'],
    derivedRule: {
      id: 'VAL-002',
      name: 'Test-Pflicht für SoftwareReq',
    },
  },
  // Bestehende Events
  {
    id: 'event-1',
    eventType: 'learn',
    description: 'Muster erkannt: Zeitangaben sollten als Bereich (30-50ms) statt Grenzwert (<50ms) angegeben werden',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    relatedNodes: ['SYS-003', 'SYS-001'],
  },
  {
    id: 'event-2',
    eventType: 'connect',
    description: 'Verbindung gefunden: EXT-001 (Fahrwerk) beeinflusst SYS-003 und SW-002 (Außenlicht)',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    relatedNodes: ['EXT-001', 'SYS-003', 'SW-002'],
  },
  {
    id: 'event-3',
    eventType: 'recall',
    description: 'Ähnliches Problem in anderem Projekt: Fehlende Tests für Override-Funktionen',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    relatedNodes: ['SW-003'],
  },
  {
    id: 'event-4',
    eventType: 'strengthen',
    description: 'Regel bestätigt: A-SPICE fordert Test für jedes Software-Requirement',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    relatedNodes: ['SW-003', 'VAL-002'],
  },
  {
    id: 'event-5',
    eventType: 'consolidate',
    description: 'Wissen zusammengefasst: 3 ähnliche Qualitätsprobleme bei Zeitangaben',
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    relatedNodes: ['SYS-003', 'SYS-001', 'EXT-003'],
  },
  // CR-016: Zweites Chat-Beispiel (ältere Konversation)
  {
    id: 'event-chat-2',
    eventType: 'chat',
    description: 'Aus Chat: Sicherheitskritische Anforderungen müssen Review-Status haben',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    relatedNodes: ['STK-002', 'SYS-003'],
    chatPreview: {
      messageCount: 4,
      excerpt: 'Bei Bremslicht muss immer ein Review erfolgt sein.',
    },
    derivedRule: {
      id: 'VAL-007',
      name: 'Review für Safety-Req',
    },
  },
]

/**
 * Prüft ob echte Daten vorhanden sind
 */
export function hasRealData(
  centralityMetrics: CentralityMetrics[],
  detectedPatterns: DetectedPattern[],
  memoryEvents: MemoryEvent[]
): boolean {
  return centralityMetrics.length > 0 || detectedPatterns.length > 0 || memoryEvents.length > 0
}
