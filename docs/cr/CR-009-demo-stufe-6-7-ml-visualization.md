# CR-009: Demo Stufe 6-7 - ML & Visualization

**Status:** Open
**Erstellt:** 2026-01-28
**Autor:** andreas@siglochconsulting.de
**Abhängigkeit:** CR-007 (Requirements Traceability Demo)

---

## Ziel

Erweiterung der Requirements Traceability Demo um echte ML-Funktionen (Stufe 6: Prediction) und lernende Systeme (Stufe 7) mit interaktiver Visualisierung. Kein Mock-Code - alles funktionsfähig mit Neo4j GDS.

---

## Kontext

Die aktuelle Demo (CR-007) zeigt Stufe 3-5:
- Strukturierte Daten im Knowledge Graph
- Regelbasierte Validierung
- Compliance-Scoring

Stufe 6-7 werden aktuell nur als Ausblick-Folien gezeigt. Mit Neo4j Graph Data Science (GDS) können wir echtes ML demonstrieren.

### Stufen-Abgrenzung (wichtig!)

| Stufe | Was | Beispiel | Lernt? |
|-------|-----|----------|--------|
| 2 | RAG/Embedding | "Finde ähnliche Texte" | ❌ Nein |
| 3 | Strukturierte Daten | "Finde Requirements mit gleichen Nachbarn" | ❌ Nein |
| 5 | Regelbasiert | "Prüfe gegen A-SPICE Regeln" | ❌ Nein |
| **6** | **Prediction** | "Welche Requirements werden sich ändern?" | ⚠️ Trainiert, aber statisch |
| **7** | **Lernend** | "System merkt sich Feedback und verbessert Empfehlungen" | ✅ Ja, kontinuierlich |

**Stufe 7 Kriterien:**
- Feedback-Loop: User-Input → System lernt → Bessere Outputs
- Akkumulation: Wissen wächst über Zeit
- Adaption: Verhalten ändert sich basierend auf Erfahrung

### Lernmechanismus: Implizit, nicht aktiv ⭐ KERNKONZEPT

**Problem:** Klassisches ML erfordert:
- Labeled Training Data (teuer zu erzeugen)
- Aktive Trainingsprozesse (GPU, Zeit, Expertise)
- LLM-Token-Verbrauch für Fine-Tuning

**Lösung: Graph als akkumulierendes Gedächtnis**

Das System "lernt" durch **normale Nutzung** - keine separaten Trainingsschritte:

```
┌─────────────────────────────────────────────────────────────┐
│  IMPLIZITES LERNEN (kein aktives Training)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. USER ARBEITET NORMAL                                    │
│     └── Review-Kommentar: "Zeitangabe nicht testbar"        │
│                    │                                        │
│                    ▼                                        │
│  2. SYSTEM SPEICHERT (1 Cypher INSERT, 0 LLM Tokens)        │
│     └── CREATE (:Feedback {issue: "...", target: "SYS-003"})│
│                    │                                        │
│                    ▼                                        │
│  3. PATTERN-ERKENNUNG (Regex, kein LLM)                     │
│     └── Wenn 3+ Feedbacks ähnliche Phrasen → Pattern        │
│                    │                                        │
│                    ▼                                        │
│  4. WISSEN AKKUMULIERT                                      │
│     └── Graph wächst: Mehr Feedback → Mehr Patterns         │
│                    │                                        │
│                    ▼                                        │
│  5. BESSERE EMPFEHLUNGEN (Graph-Query, kein LLM)            │
│     └── Neues Req → Match gegen bekannte Patterns           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Grounding-Mechanismus:**

| Aspekt | Wie es funktioniert | LLM-Kosten |
|--------|---------------------|------------|
| Feedback speichern | Cypher INSERT | 0 Tokens |
| Pattern erkennen | Regex + Häufigkeit | 0 Tokens |
| Confidence berechnen | `matches / threshold` | 0 Tokens |
| Empfehlung generieren | Graph-Query + Template | 0 Tokens |
| Empfehlung formulieren | Optional: LLM für Text | ~100 Tokens |

**Belohnungssignal = Implizite Bestätigung:**

```
Pattern erkannt: "Vage Zeitangabe"
├── User ignoriert Warnung → Confidence bleibt
├── User ändert Requirement → Confidence += 0.1 (Pattern war hilfreich)
└── User markiert als "False Positive" → Confidence -= 0.2
```

**Kein aktives Training nötig weil:**
1. **Patterns sind regelbasiert** - Regex, nicht ML
2. **Confidence ist Statistik** - Zähler, nicht Gradient
3. **Empfehlungen sind Templates** - "Basierend auf {n} ähnlichen Fällen..."
4. **Graph IST das Modell** - Knoten/Kanten statt Gewichte

**Für den Endkunden:**
- Normale Arbeit = Training (kein Extra-Aufwand)
- Review-Kommentare werden zu Wissen (automatisch)
- Keine LLM-Kosten für Lernen (nur für Formulierung)
- Volle Transparenz (Graph ist inspizierbar)

---

## Anforderungen

### FR-001: GDS Plugin Integration
- Neo4j GDS Plugin in Docker-Compose aktivieren
- Kompatibilität mit Community Edition prüfen (GDS Community vs Enterprise)

### FR-002: Centrality Analysis Tool (Stufe 6)
MCP-Tool `centrality_analysis`:
- PageRank: Wichtigste Requirements identifizieren
- Betweenness Centrality: Bottleneck-Knoten finden
- Degree Centrality: Vernetzungsgrad messen

**Input:** Optional Filter (Label, Property)
**Output:** Ranking mit Scores und Empfehlungen

### FR-003: Link Prediction Tool (Stufe 6)
MCP-Tool `predict_missing_links`:
- Trainiert auf existierenden TRACED_TO-Beziehungen
- Sagt fehlende Traceability-Links vorher
- Nutzt GDS Link Prediction Pipeline

**Input:** Optional Schwellwert für Confidence
**Output:** Liste vermutlich fehlender Links mit Score

### FR-004: Similarity Analysis Tool (Stufe 3 - Strukturierte Suche)
MCP-Tool `find_similar_requirements`:
- Node Similarity basierend auf Graph-Struktur (gemeinsame Nachbarn)
- Optional: HashGNN Embeddings für semantische Ähnlichkeit
- **Hinweis:** Dies ist KEINE Stufe 7 - reine Ähnlichkeitssuche ist RAG-Level (Stufe 2-3)

**Input:** Requirement ID
**Output:** Ähnliche Requirements mit Similarity-Score

**Abgrenzung zu Stufe 7:**
- Stufe 3: "Finde ähnliche Requirements" (statische Suche)
- Stufe 7: "Lerne aus Feedback WELCHE Ähnlichkeiten relevant sind" (adaptiv)

### FR-005: Learning Memory System (Stufe 7) ⭐ KEY FEATURE
Das System muss sichtbar "lernen" - Gedächtnis füllt sich während der Demo.

**Komponenten:**

1. **Feedback-Knoten** - Speichern von Review-Kommentaren
   ```cypher
   CREATE (f:Feedback {
     id: 'FB-001',
     targetId: 'SYS-003',
     type: 'review',
     issue: 'Zeitangabe nicht testbar',
     resolved: false,
     createdAt: datetime()
   })
   ```

2. **Pattern-Knoten** - Erkannte Anti-Patterns
   ```cypher
   CREATE (p:Pattern {
     id: 'PAT-001',
     name: 'Vage Zeitangabe',
     regex: '(<|>)\\s*\\d+\\s*(ms|s)',
     occurrences: 0,
     lastSeen: datetime()
   })
   ```

3. **Learning-Events** - Timeline was das System gelernt hat
   ```cypher
   CREATE (e:LearningEvent {
     id: 'LE-001',
     type: 'pattern_detected',
     description: 'Neues Pattern erkannt: Vage Zeitangabe',
     confidence: 0.85,
     timestamp: datetime()
   })
   ```

**MCP-Tools für Learning:**

- `record_feedback` - Feedback zu Requirement speichern
- `detect_patterns` - Patterns in neuen Requirements erkennen
- `learning_timeline` - Zeigt was das System wann gelernt hat
- `memory_stats` - Statistiken über gespeichertes Wissen

### FR-006: Interaktive Visualisierung
Web-Dashboard für die Demo:
- Graph-Visualisierung der Requirements
- Farbkodierung nach Centrality/Community
- Knotengröße nach PageRank
- Hervorhebung fehlender Links (Prediction)
- Interaktive Exploration (Zoom, Pan, Click)

---

## Technische Architektur

### Neo4j GDS Algorithmen

| Algorithmus | Zweck | GDS Funktion |
|-------------|-------|--------------|
| PageRank | Wichtigkeit | `gds.pageRank.stream()` |
| Betweenness | Bottlenecks | `gds.betweenness.stream()` |
| Louvain | Communities | `gds.louvain.stream()` |
| HashGNN | Embeddings | `gds.hashgnn.stream()` |
| Node Similarity | Ähnlichkeit | `gds.nodeSimilarity.stream()` |
| Link Prediction | Fehlende Links | `gds.beta.pipeline.linkPrediction.*` |

### Visualisierung Stack

**Stack: React + Vite + Tailwind + vis-network + Express + Zod**

Gemäß CLAUDE.md Tech-Stack-Vorgaben:
- **Frontend:** React + Vite + Tailwind + Zustand
- **Backend:** Express + Zod (Schema-First)
- **Graph-Rendering:** vis-network (gleiche Engine wie Neovis, aber kontrolliert)
- **Real-time:** SSE (Server-Sent Events) statt WebSocket
- **Testing:** Playwright + Vitest mit `data-testid` Selektoren

**Warum NICHT Neovis.js:**
- [WebSocket-Issues bei Re-Rendering](https://github.com/neo4j-contrib/neovis.js/issues/312)
- [Absturz bei >300 Knoten](https://github.com/neo4j-contrib/neovis.js/issues/85)
- Keine saubere SSE-Integration möglich

**Warum SSE statt WebSocket:**
- [Neo4j empfiehlt SSE](https://neo4j.com/developer/languages/javascript/code-guides/neo4j-real-time-updates-with-server-sent-events-sse/)
- Simpler, stabiler, kein Connection-Management

### Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Desktop                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  MCP Server (neo4j-requirements)                     │    │
│  │  ├── query                                           │    │
│  │  ├── validate                                        │    │
│  │  ├── impact_analysis                                 │    │
│  │  ├── centrality_analysis      ← NEU (Stufe 6)       │    │
│  │  ├── predict_missing_links    ← NEU (Stufe 6)       │    │
│  │  └── find_similar_requirements← NEU (Stufe 7)       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Neo4j + GDS Community                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Requirements │  │ GDS Algos    │  │ Learning     │       │
│  │ Graph        │  │ (PageRank,   │  │ Memory       │       │
│  │              │  │ Betweenness) │  │ (Feedback,   │       │
│  │              │  │              │  │ Pattern)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │ Bolt
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Express + Zod)                   Port 3001        │
│  ├── GET  /api/graph          → Graph-Daten für vis-network │
│  ├── GET  /api/memory         → Learning-Stats              │
│  ├── GET  /api/events         → SSE Stream (Real-time)      │
│  └── POST /api/feedback       → Feedback speichern          │
└─────────────────────────────────────────────────────────────┘
                              │ SSE
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind)        Port 5173        │
│  ├── GraphView.tsx            → vis-network Rendering       │
│  ├── MemoryTimeline.tsx       → Animierte Learning-Timeline │
│  ├── CentralityPanel.tsx      → PageRank/Betweenness Stats  │
│  └── PatternList.tsx          → Erkannte Patterns           │
│  Selektoren: data-testid="*" für Playwright                 │
└─────────────────────────────────────────────────────────────┘
│  URL: http://localhost:5173                                  │
└─────────────────────────────────────────────────────────────┘
```

### Schema-First: Zod Contracts

```typescript
// dashboard/src/schemas/index.ts
import { z } from 'zod'

export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase', 'InputSpec', 'Pattern', 'Feedback']),
  pageRank: z.number().optional(),
  betweenness: z.number().optional(),
  hasPatternMatch: z.boolean().optional(),
})

export const LearningEventSchema = z.object({
  id: z.string(),
  type: z.enum(['feedback_created', 'pattern_detected', 'pattern_candidate']),
  timestamp: z.string().datetime(),
  description: z.string(),
  confidence: z.number().min(0).max(1).optional(),
})

export const MemoryStatsSchema = z.object({
  feedbackCount: z.number(),
  patternCount: z.number(),
  candidateCount: z.number(),
  eventCount: z.number(),
  avgConfidence: z.number(),
})
```

---

## Demo-Szenarien

### Szenario 1: Kritische Knoten identifizieren (Stufe 6)

**Claude-Befehl:**
> "Welche Requirements sind die kritischsten im System? Nutze centrality_analysis."

**Erwartetes Ergebnis:**
```
CENTRALITY ANALYSE:

🎯 Höchste Wichtigkeit (PageRank):
1. SYS-003 "Bremslicht <50ms" - Score 0.42
   → Zentraler Knoten mit vielen Abhängigkeiten

🔗 Größte Bottlenecks (Betweenness):
1. EXT-001 "CAN BrakePedalForce" - Score 0.68
   → Änderung blockiert 3 Requirements

📊 Visualisierung: http://localhost:8080/dashboard?highlight=bottleneck
```

**Visualisierung:**
- EXT-001 pulsiert rot
- Abhängige Knoten (SYS-003, SW-002) leuchten orange
- Restliche Knoten grau/transparent

### Szenario 2: Fehlende Links vorhersagen (Stufe 6)

**Claude-Befehl:**
> "Welche Traceability-Links fehlen vermutlich? Nutze predict_missing_links."

**Erwartetes Ergebnis:**
```
LINK PREDICTION (ML-basiert):

Wahrscheinlich fehlende Links:
1. SW-003 ↔ TC-??? (Confidence: 0.87)
   → Pattern: Alle anderen SW-Reqs haben Tests

2. STK-003 → SYS-??? (Confidence: 0.72)
   → Pattern: Stakeholder-Req ohne Ableitung

📊 Visualisierung: http://localhost:8080/dashboard?show=predicted
```

**Visualisierung:**
- Existierende Links: durchgezogene Linien
- Vorhergesagte Links: gestrichelte Linien (rot)
- Hover zeigt Confidence-Score

### Szenario 3: Ähnliche Requirements finden (Stufe 3 - zum Vergleich)

**Claude-Befehl:**
> "Finde Requirements die SYS-003 ähnlich sind. Nutze find_similar_requirements."

**Erwartetes Ergebnis:**
```
ÄHNLICHKEITS-ANALYSE (HashGNN Embeddings):

Strukturell ähnlich zu SYS-003:
1. SYS-004 "Bremslicht Intensität" - Similarity: 0.89
   → Gleicher Stakeholder, gleiche Komponente, ASIL-C

2. SYS-005 "Rücklicht Grundfunktion" - Similarity: 0.71
   → Ähnliche Licht-Funktion, gleiche ECU

💡 EMPFEHLUNG:
   Bei Änderung an SYS-003 auch SYS-004 prüfen
   (Historisch 73% gemeinsame Änderungen)

📊 Visualisierung: http://localhost:8080/dashboard?cluster=SYS-003
```

**Visualisierung:**
- SYS-003 im Zentrum
- Ähnliche Requirements in konzentrischen Kreisen
- Nähe = Similarity Score
- Farbe = Community/Cluster

---

### Szenario 4: Gedächtnis füllen - Live Learning (Stufe 7) ⭐ WOW-MOMENT

**Demo-Ablauf:** Das System lernt WÄHREND der Demo vor den Augen des Publikums.

#### Schritt 1: Ausgangszustand zeigen

**Claude-Befehl:**
> "Zeige den aktuellen Lernstand. Nutze memory_stats."

**Erwartetes Ergebnis:**
```
SYSTEM-GEDÄCHTNIS:

📊 Aktueller Stand:
- Feedback-Einträge: 0
- Erkannte Patterns: 0
- Learning Events: 0

Das System hat noch nichts gelernt.
```

**Visualisierung:** Leere "Memory Timeline" im Dashboard

---

#### Schritt 2: Erstes Feedback geben

**Claude-Befehl:**
> "Speichere Feedback zu SYS-003: 'Die Zeitangabe <50ms ist nicht testbar - wie wird gemessen?' Nutze record_feedback."

**Erwartetes Ergebnis:**
```
✅ FEEDBACK GESPEICHERT:

Feedback FB-001 erstellt:
- Target: SYS-003 "Bremslicht <50ms"
- Issue: "Die Zeitangabe <50ms ist nicht testbar - wie wird gemessen?"
- Status: Offen

📊 Gedächtnis aktualisiert: 1 Feedback-Eintrag
```

**Visualisierung:**
- SYS-003 bekommt kleines Warn-Icon
- Memory Timeline zeigt ersten Eintrag

---

#### Schritt 3: Pattern-Erkennung triggern

**Claude-Befehl:**
> "Analysiere alle Requirements auf Patterns. Nutze detect_patterns."

**Erwartetes Ergebnis:**
```
🔍 PATTERN-ANALYSE:

Neues Pattern erkannt!

PAT-001: "Vage Zeitangabe"
- Regex: (<|>)\s*\d+\s*(ms|s|min)
- Gefunden in: 3 Requirements
  - SYS-003: "<50ms"
  - SYS-001: "<100ms"
  - SYS-006: "<200ms"

💡 LEARNING EVENT:
   Das System hat gelernt, dass Zeitangaben mit < oder >
   oft zu Rückfragen führen.

📊 Gedächtnis aktualisiert:
- Feedback: 1
- Patterns: 1 (NEU!)
- Learning Events: 1
```

**Visualisierung:**
- Alle 3 Requirements mit vager Zeitangabe werden gelb markiert
- Pattern-Node erscheint im Graph
- Memory Timeline wächst

---

#### Schritt 4: Weiteres Feedback - System lernt mehr

**Claude-Befehl:**
> "Speichere Feedback zu SYS-007: 'Unklar was "ohne Zündung" bedeutet - Klemme 15 aus oder Batterie getrennt?'"

**Erwartetes Ergebnis:**
```
✅ FEEDBACK GESPEICHERT: FB-002

🔍 AUTOMATISCHE PATTERN-PRÜFUNG:

Mögliches neues Pattern erkannt!

PAT-002 (Kandidat): "Unspezifizierte Bedingung"
- Trigger-Phrase: "ohne Zündung"
- Confidence: 0.65 (noch unsicher)
- Benötigt: 2 weitere ähnliche Feedbacks zur Bestätigung

📊 Gedächtnis:
- Feedback: 2
- Patterns: 1 bestätigt, 1 Kandidat
- Learning Events: 2
```

**Visualisierung:**
- Pattern-Kandidat erscheint gestrichelt (noch nicht bestätigt)
- Confidence-Balken zeigt 65%

---

#### Schritt 5: Learning Timeline zeigen

**Claude-Befehl:**
> "Zeige was das System heute gelernt hat. Nutze learning_timeline."

**Erwartetes Ergebnis:**
```
📚 LEARNING TIMELINE (heute):

17:05:23 │ FB-001 erstellt
         │ "Zeitangabe nicht testbar" → SYS-003
         │
17:05:45 │ PAT-001 erkannt ⭐
         │ "Vage Zeitangabe" - 3 Treffer
         │ Confidence: 0.85
         │
17:06:12 │ FB-002 erstellt
         │ "Unspezifizierte Bedingung" → SYS-007
         │
17:06:15 │ PAT-002 Kandidat
         │ "Unspezifizierte Bedingung" - pending
         │ Confidence: 0.65

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZUSAMMENFASSUNG:
- 2 Feedbacks verarbeitet
- 1 Pattern bestätigt
- 1 Pattern-Kandidat in Beobachtung
- Nächste Schwelle: 3 Feedbacks für PAT-002 Bestätigung
```

**Visualisierung:**
- Timeline-View im Dashboard
- Animierte Einträge die "einfließen"
- Fortschrittsbalken für Pattern-Kandidaten

---

#### Schritt 6: Neues Requirement prüfen (Gelerntes anwenden)

**Claude-Befehl:**
> "Prüfe dieses neue Requirement auf bekannte Probleme: 'Das System soll innerhalb von <30ms auf CAN-Nachrichten reagieren'"

**Erwartetes Ergebnis:**
```
⚠️ QUALITY CHECK (basierend auf gelerntem Wissen):

Pattern-Match gefunden!

PAT-001: "Vage Zeitangabe"
- Gefunden: "<30ms"
- Historisches Feedback (1 Eintrag):
  FB-001: "Zeitangabe nicht testbar - wie wird gemessen?"

💡 EMPFEHLUNG:
   Basierend auf früherem Feedback zu ähnlichen Requirements:
   → Messverfahren spezifizieren
   → Toleranz angeben (z.B. "30ms ±5ms")
   → Messpunkt definieren (CAN-Empfang bis Aktor-Ansteuerung)

📊 Diese Empfehlung basiert auf:
- 1 ähnlichem Feedback
- 3 ähnlichen Requirements im Graph
```

**Visualisierung:**
- Neuer Requirement-Entwurf blinkt
- Verbindungslinien zu ähnlichen Requirements
- Empfehlungs-Panel öffnet sich

---

## Visualisierung Details

### Dashboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Requirements Traceability Dashboard              [🔄] [⚙️]   │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐ ┌──────────────────────┐ │
│ │                                  │ │ LEGENDE              │ │
│ │                                  │ │ ● StakeholderReq     │ │
│ │      GRAPH VISUALIZATION         │ │ ● SystemReq          │ │
│ │                                  │ │ ● SoftwareReq        │ │
│ │    [Force-directed Layout]       │ │ ● TestCase           │ │
│ │                                  │ │ ● InputSpec          │ │
│ │                                  │ │ ◆ Pattern (learned)  │ │
│ │                                  │ │ ◇ Feedback           │ │
│ │                                  │ │                      │ │
│ │                                  │ │ Knotengröße:         │ │
│ │                                  │ │ = PageRank Score     │ │
│ │                                  │ │                      │ │
│ │                                  │ │ Kantenfarbe:         │ │
│ │                                  │ │ ── TRACED_TO         │ │
│ │                                  │ │ ── VERIFIED_BY       │ │
│ │                                  │ │ ┈┈ Predicted (ML)    │ │
│ │                                  │ │ ⚡ Pattern-Match     │ │
│ └──────────────────────────────────┘ └──────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ ANALYSE-PANEL                                             │  │
│ │ [Centrality] [Predictions] [Similarity] [Memory] [Learn] │  │
│ │                                                           │  │
│ │ PageRank Top 5:          Bottlenecks:                     │  │
│ │ 1. SYS-003 (0.42)        1. EXT-001 (0.68)               │  │
│ │ 2. SYS-007 (0.38)        2. SYS-003 (0.45)               │  │
│ │ 3. STK-001 (0.31)        3. K-002 (0.32)                 │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Memory Timeline View (Tab: [Memory])

```
┌────────────────────────────────────────────────────────────────┐
│  SYSTEM-GEDÄCHTNIS                          [Live] [Historie] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📊 STATISTIK           📈 WACHSTUM                           │
│  ┌──────────────┐       ┌─────────────────────────────────┐   │
│  │ Feedback: 2  │       │     ▄                           │   │
│  │ Patterns: 1  │       │   ▄ █                           │   │
│  │ Events: 4    │       │ ▄ █ █ ▄                         │   │
│  │ Confidence   │       │ █ █ █ █                         │   │
│  │ Ø 0.75       │       │ ─────────────────────────────── │   │
│  └──────────────┘       │ Mo Di Mi Do Fr (diese Woche)    │   │
│                         └─────────────────────────────────┘   │
│                                                                │
│  📚 TIMELINE (live)                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  ●───●───●───◆───●                                      │ │
│  │  │   │   │   │   │                                      │ │
│  │  │   │   │   │   └─ 17:06 Pattern-Kandidat PAT-002     │ │
│  │  │   │   │   └───── 17:05 Pattern erkannt PAT-001 ⭐   │ │
│  │  │   │   └───────── 17:05 Feedback FB-002              │ │
│  │  │   └───────────── 17:04 Feedback FB-001              │ │
│  │  └───────────────── 17:00 Demo gestartet               │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  🎯 PATTERN-ÜBERSICHT                                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ PAT-001 "Vage Zeitangabe"     ████████████░░ 85%        │ │
│  │   → 3 Matches, 1 Feedback                                │ │
│  │                                                          │ │
│  │ PAT-002 "Unspez. Bedingung"   ██████░░░░░░░░ 65%        │ │
│  │   → 1 Match, 1 Feedback (Kandidat)                       │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Live-Learning Animation

Wenn neues Feedback/Pattern hinzukommt:
1. **Pulse-Effekt** auf dem betroffenen Requirement-Knoten
2. **Fließende Linie** vom Requirement zum Memory-Bereich
3. **Counter hochzählen** mit Animation
4. **Toast-Notification** "System hat gelernt: [Pattern-Name]"

### Interaktionen

| Aktion | Effekt |
|--------|--------|
| Hover Knoten | Tooltip mit Details + Highlights Nachbarn |
| Click Knoten | Info-Panel + "Ähnliche finden" Button |
| Doppelclick | Expand/Collapse Nachbarn |
| Drag | Knoten verschieben (sticky) |
| Scroll | Zoom |
| Tab wechseln | Andere Analyse-Sicht |

### Farbschema

```css
:root {
  --stakeholder: #4A90D9;   /* Blau */
  --system: #7CB342;        /* Grün */
  --software: #FF9800;      /* Orange */
  --testcase: #9C27B0;      /* Lila */
  --inputspec: #795548;     /* Braun */
  --predicted-link: #E53935; /* Rot gestrichelt */
  --bottleneck-glow: #FF5722; /* Orange Glow */
}
```

---

## Implementierungsplan

### Phase 1: GDS Setup (1h)
- [ ] docker-compose.yml: GDS Plugin hinzufügen
- [ ] Testen ob GDS Community Edition funktioniert
- [ ] Graph-Projektion für Algorithmen erstellen

### Phase 2: MCP Tools - Stufe 6 (4h)
- [ ] `centrality_analysis.ts` implementieren
- [ ] `predict_missing_links.ts` implementieren
- [ ] `find_similar_requirements.ts` implementieren
- [ ] MCP-Server rebuilden und testen

### Phase 3: MCP Tools - Stufe 7 Learning (3h)
- [ ] `record_feedback.ts` - Feedback speichern
- [ ] `detect_patterns.ts` - Pattern-Erkennung mit Regex
- [ ] `learning_timeline.ts` - Timeline-Query
- [ ] `memory_stats.ts` - Statistiken
- [ ] Seed-Daten für initiale Patterns (leer starten)

### Phase 4: Dashboard Backend (2h)
- [ ] Express Server in `dashboard/server/`
- [ ] Zod Schemas in `dashboard/src/schemas/`
- [ ] Neo4j Driver Connection
- [ ] REST Endpoints: `/api/graph`, `/api/memory`
- [ ] SSE Endpoint: `/api/events`

### Phase 5: Dashboard Frontend - Graph (3h)
- [ ] Vite + React Setup in `dashboard/`
- [ ] vis-network GraphView Komponente
- [ ] PageRank → Knotengröße
- [ ] Pattern-Matches hervorheben (gelb)
- [ ] `data-testid` Selektoren für alle Elemente

### Phase 6: Dashboard Frontend - Memory Timeline (3h)
- [ ] MemoryTimeline.tsx mit SSE Hook
- [ ] Animierte Einträge (CSS Transitions)
- [ ] Pattern-Confidence-Balken
- [ ] Stats-Counter mit Animation
- [ ] Design Tokens aus `tokens.css`

### Phase 7: Demo-Script Update (1h)
- [ ] `demo-script.md` erweitern für Stufe 6-7
- [ ] Szenario 4 (Gedächtnis füllen) als Highlight
- [ ] Timing anpassen (25-30 Min total)

### Phase 8: Testing & Polish (2h)
- [ ] Playwright E2E-Tests für Dashboard
- [ ] Vitest Unit-Tests für Zod Schemas
- [ ] Demo-Durchlauf mit Visualisierung
- [ ] Reset-Script für frisches Gedächtnis
- [ ] `npm run lint:design` ohne Fehler

---

## Risiken

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| GDS Community Edition limitiert | Mittel | Algorithmen prüfen, ggf. Enterprise Trial |
| Performance bei Link Prediction | Niedrig | Demo-Graph ist klein (36 Knoten) |
| Neovis.js Browser-Kompatibilität | Niedrig | Modernes Chrome verwenden |

---

## Projektstruktur

```
demo-requirements-traceability/
├── docker-compose.yml              # Neo4j + GDS
├── seed-data.cypher                # Demo-Daten
├── reset-memory.sh                 # Löscht Learning-Knoten
│
├── neo4j-mcp/                      # MCP-Server (existiert)
│   └── src/tools/
│       ├── query.ts
│       ├── validate.ts
│       ├── centrality.ts           # NEU
│       ├── predict-links.ts        # NEU
│       ├── record-feedback.ts      # NEU
│       ├── detect-patterns.ts      # NEU
│       ├── learning-timeline.ts    # NEU
│       └── memory-stats.ts         # NEU
│
└── dashboard/                      # NEU - Visualisierung
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── src/
    │   ├── App.tsx
    │   ├── styles/
    │   │   └── tokens.css          # Design Tokens
    │   ├── schemas/
    │   │   └── index.ts            # Zod Schemas
    │   ├── components/
    │   │   ├── GraphView.tsx       # vis-network
    │   │   ├── MemoryTimeline.tsx  # Animierte Timeline
    │   │   ├── CentralityPanel.tsx
    │   │   └── PatternList.tsx
    │   └── hooks/
    │       └── useSSE.ts           # Real-time Updates
    ├── server/
    │   ├── index.ts                # Express
    │   ├── routes/
    │   │   ├── graph.ts
    │   │   ├── memory.ts
    │   │   └── events.ts           # SSE Endpoint
    │   └── neo4j.ts                # Driver
    └── tests/
        ├── e2e/
        │   └── dashboard.spec.ts   # Playwright
        └── unit/
            └── schemas.test.ts     # Vitest
```

## Abhängigkeiten

- Neo4j GDS Community (kostenlos, alle Algorithmen enthalten)
- vis-network (MIT Lizenz)
- React + Vite + Tailwind (Standard-Stack)
- Express + Zod (Backend)
- Playwright (E2E Tests)

---

## Abnahmekriterien

### Stufe 6 - Prediction
- [ ] GDS Algorithmen laufen auf Demo-Graph
- [ ] `centrality_analysis` zeigt PageRank + Betweenness
- [ ] `predict_missing_links` findet SW-003 ohne Test
- [ ] Dashboard zeigt Centrality-Visualisierung

### Stufe 7 - Learning
- [ ] `record_feedback` speichert Feedback-Knoten
- [ ] `detect_patterns` erkennt "Vage Zeitangabe"
- [ ] `learning_timeline` zeigt chronologische Events
- [ ] `memory_stats` zeigt wachsende Zahlen
- [ ] Dashboard Memory-Tab mit Live-Timeline
- [ ] Animation wenn System "lernt"

### Integration
- [ ] 7 neue MCP-Tools funktionieren in Claude Desktop
- [ ] Dashboard läuft unter http://localhost:8080
- [ ] Reset-Script setzt Gedächtnis zurück
- [ ] Demo-Script für 25-30 Minuten

### Wow-Momente validiert
- [ ] Gedächtnis füllt sich sichtbar während Demo
- [ ] Neues Requirement wird gegen gelerntes Wissen geprüft
- [ ] Pattern-Confidence steigt mit mehr Feedback

---

## Quellen

- [Neo4j GDS Link Prediction Pipelines](https://neo4j.com/docs/graph-data-science/current/machine-learning/linkprediction-pipelines/link-prediction/)
- [HashGNN Node Embeddings](https://neo4j.com/docs/graph-data-science/current/machine-learning/node-embeddings/hashgnn/)
- [PageRank in Neo4j GDS](https://neo4j.com/docs/graph-data-science/current/algorithms/page-rank/)
- [Betweenness Centrality](https://neo4j.com/docs/graph-data-science/current/algorithms/betweenness-centrality/)
- [Neovis.js Graph Visualization](https://neo4j.com/blog/developer/graph-visualization-with-neo4j-using-neovis-js/)
- [neo4jd3 GitHub](https://github.com/eisman/neo4jd3)
- [Requirements Traceability in Neo4j](https://www.reqview.com/blog/requirements-traceability-analysis-neo4j/)
