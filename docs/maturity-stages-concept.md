# Data Maturity Stages - Technisches Konzept

## Tech Stack

### Graph Database: Neo4j

**Einsatz:** Speicherung von Requirements, Beziehungen, Regeln
**Zugriff:** MCP-Server (neo4j-mcp) + REST API (dashboard-server)

```
Node-Typen:
├── StakeholderReq, SystemReq, SoftwareReq (Requirements)
├── TestCase, Komponente, InputSpec (Artefakte)
├── Regel (Validierung/Scoring/Optimierung)
└── ProjectMeta (DB-Identifikation)

Beziehungen:
├── TRACED_TO (Traceability)
├── VERIFIED_BY (Test-Zuordnung)
├── IMPLEMENTED_IN (Komponenten-Zuordnung)
└── DEPENDS_ON (Externe Abhängigkeiten)
```

### Frontend: React + Zustand + D3.js

**Komponenten:**
- `GraphPanel` - D3 Force-Layout Visualisierung
- `RulesPanel` - Regeln mit Wirkung-Filter
- `CentralityPanel` - Drei Kennzahlen-Metriken
- `VerbesserungenPanel` - OPT-Vorschläge
- `MemoryTimeline` - Lernverlauf-Visualisierung

### Backend: Express + Zod

**API-Endpunkte:**
- `/api/graph` - Graph-Daten
- `/api/rules` - Regel-CRUD
- `/api/centrality` - Kennzahlen
- `/api/quality/*` - Validation/Scoring/Optimization
- `/api/optimization` - OPT-Vorschläge

---

## Pattern-Kategorien

Alignment mit **aimprove ADR-001** Pattern Detection.

### Success Patterns
| Pattern | Erkennung | Beispiel |
|---------|-----------|----------|
| QuickSuccess | Temporal | Anfrage → Lösung in <3 Turns |
| EfficientToolSequence | Temporal | Read → Edit → Test ohne Fehler |
| ClearSpecification | Semantic | Präzise Anforderung, keine Rückfragen |

### Failure Patterns
| Pattern | Erkennung | Beispiel |
|---------|-----------|----------|
| EarlyAbort | Temporal | Abbruch nach 2 Turns |
| ToolCascade | Temporal | >5 Tool-Aufrufe für einfache Aufgabe |
| PermissionLoop | Lexical | Wiederholte Permission-Errors |

### Frustration Patterns
| Pattern | Erkennung | Beispiel |
|---------|-----------|----------|
| EmphasisEscalation | Lexical | "BITTE", "!!!", Großbuchstaben |
| ExplicitRejection | Lexical | "Nein", "Falsch", "Stopp" |
| Resignation | Semantic | "Egal", "Lass es", "Vergiss es" |

### Quality Patterns
| Pattern | Erkennung | Beispiel |
|---------|-----------|----------|
| VagueTerms | Lexical | "schnell", "bald", "zeitnah" |
| MissingContext | Semantic | Fehlende Referenzen |
| Ambiguity | Semantic | Mehrdeutige Formulierung |

---

## Erkennungsmethoden

### Lexical Detection
Regelbasiert mit Regex, Keywords, Character-Patterns.
```
Input: "Das MUSS schnell gehen!!!"
Match: CAPS=true, Exclamation=3, VagueWord="schnell"
```

### Semantic Detection
Embedding-basierte Ähnlichkeitssuche (geplant).
```
Input: "Bremsvorgang erkennen"
Similar: [SYS-003, SYS-004] (cosine > 0.8)
```

### Temporal Detection
Sequenz-basiert, erkennt Muster über Zeit.
```
Sequence: [Edit, Error, Edit, Error, Edit, Error]
Pattern: EditErrorLoop (confidence: 0.95)
```

### Composite Detection
Kombination aller Methoden mit Gewichtung.
```
Final Score = 0.4*Lexical + 0.3*Semantic + 0.3*Temporal
```

---

## Geplante Erweiterungen

### GNN (Graph Neural Network)
**Zweck:** Link Prediction, Anomalie-Erkennung
**Status:** Konzept

```
Node Features: [type, asil, status, degree]
Edge Features: [relationship_type, weight]
Output: P(missing_link), anomaly_score
```

### Embeddings
**Zweck:** Semantic Similarity, Clustering
**Status:** Vorbereitet (Offline-Berechnung möglich)

```
Model: sentence-transformers/all-MiniLM-L6-v2
Dimension: 384
Index: HNSW (150x schneller als brute-force)
```

### SONA Learning Loops
**Zweck:** Kontinuierliches Lernen ohne Catastrophic Forgetting
**Alignment:** aimprove ADR-001

| Loop | Timing | Mechanismus |
|------|--------|-------------|
| Instant | <1ms | MicroLoRA (Rank 1-2) |
| Background | Stündlich | K-Means Clustering |
| Deep | Wöchentlich | EWC++ Consolidation |

---

## Metriken-Berechnung

### Impact Score
```cypher
MATCH (n)-[r]-(m)
WITH n, count(r) AS degree
RETURN n.id, degree * 10 AS impactScore
```

### Change Risk
```cypher
MATCH (n)
WITH n,
  CASE n.asil
    WHEN 'D' THEN 100
    WHEN 'C' THEN 75
    WHEN 'B' THEN 50
    WHEN 'A' THEN 25
    ELSE 10
  END AS asilWeight
RETURN n.id, asilWeight AS changeRisk
```

### Review Priority
```
reviewPriority = normalize(impactScore × changeRisk, 0, 100)
```

---

## Regel-Schema

```typescript
interface Regel {
  id: string           // "VAL-001"
  name: string         // "Traceability-Vollständigkeit"
  wirkung: 'Validierung' | 'Scoring' | 'Optimierung'
  ebene: 'Vollständigkeit' | 'Konsistenz' | 'Inhalt' | 'Struktur'
  cypher: string       // Ausführbare Query
  schwere: 'fehler' | 'warnung' | 'info'
  domain: 'Traceability' | 'Safety' | 'Quality' | 'Architektur'
  standard: string     // "A-SPICE", "ISO 26262"
  quelle: 'manuell' | 'feedback' | 'pattern' | 'chat' | 'import'
  confidence: number   // 0.0 - 1.0
  aktiv: boolean
}
```

---

## Referenzen

- **aimprove ADR-001**: DDD Architecture for ImprovementAgent
- **Neo4j**: Graph Database (bolt://localhost:7697)
- **A-SPICE**: Automotive SPICE Process Reference Model
- **ISO 26262**: Functional Safety for Road Vehicles
