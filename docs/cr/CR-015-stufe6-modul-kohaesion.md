# CR-015: Stufe 6 - Modul-Kohäsion Optimierung

**Status:** ✅ Done
**Priorität:** Feature
**Erstellt:** 2026-01-29

## Anforderung

Stufe 6 zeigt **iterative Architektur-Optimierung** basierend auf OPT-002.
Das System analysiert Modul-Struktur und schlägt Umstrukturierungen vor.

## Konzept: Modul-Kohäsion

> "SW-003 sollte von Modul A nach Modul B verschoben werden"

Das System erkennt **suboptimale Strukturen** basierend auf:
- Gemeinsame Dependencies innerhalb eines Moduls
- Kohäsions-Metrik (0-1, höher = besser)
- Iterative Verbesserungsvorschläge

## Bestehende Regel OPT-002

```cypher
// Metrik: Durchschnittliche gemeinsame Dependencies pro Modul
MATCH (k:Komponente)<-[:IMPLEMENTED_IN]-(sw:SoftwareReq)
WITH k, collect(sw) AS reqs
UNWIND reqs AS r1 UNWIND reqs AS r2 WHERE id(r1) < id(r2)
OPTIONAL MATCH (r1)-[:DEPENDS_ON]->(ext:InputSpec)<-[:DEPENDS_ON]-(r2)
WITH k, count(DISTINCT ext) AS sharedDeps, count(*) AS pairs
RETURN avg(CASE WHEN pairs = 0 THEN 0 ELSE toFloat(sharedDeps)/pairs END) AS metricValue
```

```cypher
// Vorschläge: Requirements ohne gemeinsame Dependencies
MATCH (sw:SoftwareReq)-[:IMPLEMENTED_IN]->(k:Komponente)
WHERE NOT exists((sw)-[:DEPENDS_ON]->(:InputSpec))
RETURN sw.id AS kandidat, k.name AS von, "anderes Modul" AS nach,
       "Keine gemeinsamen Abhaengigkeiten" AS grund
LIMIT 5
```

## Stufe 6: Iterativer Optimierungs-Loop

```
┌─────────────────────────────────────────────────────┐
│  1. Kohäsion messen (aktuell: 0.35)                │
│  2. Vorschläge generieren (3 Move-Kandidaten)       │
│  3. User akzeptiert Vorschlag                       │
│  4. System führt MOVE aus                           │
│  5. Kohäsion neu messen (jetzt: 0.52)              │
│  6. Wiederhole bis Schwellwert (0.5) erreicht       │
└─────────────────────────────────────────────────────┘
```

## API: `/api/optimization`

```typescript
interface OptimizationState {
  ruleId: string;           // "OPT-002"
  ruleName: string;         // "Modul-Kohäsion maximieren"
  currentMetric: number;    // 0.35
  targetMetric: number;     // 0.50 (schwellwert)
  direction: 'maximieren' | 'minimieren';
  suggestions: OptimizationSuggestion[];
  history: OptimizationStep[];  // Bisherige Änderungen
}

interface OptimizationSuggestion {
  kandidat: string;         // "SW-003"
  von: string;              // "Steuerung"
  nach: string;             // "Sensorik"
  grund: string;            // "Keine gemeinsamen Abhängigkeiten"
  expectedDelta: number;    // +0.08 (geschätzte Verbesserung)
  confidence: number;       // 0.8
}

interface OptimizationStep {
  timestamp: string;
  action: string;           // "SW-003 → Sensorik"
  metricBefore: number;
  metricAfter: number;
  delta: number;
}
```

## Frontend: Optimierungs-Panel (Stufe 6)

### Aktuelle Metrik
```
Modul-Kohäsion: ████████░░░░░░░░ 35% (Ziel: 50%)
```

### Vorschläge
| Kandidat | Von | Nach | Δ | Confidence |
|----------|-----|------|---|------------|
| SW-003 | Steuerung | Sensorik | +8% | 80% |
| SW-007 | UI | Backend | +5% | 72% |

**Aktionen:**
- "Anwenden" → System führt Move aus, misst neu
- "Ablehnen" → Vorschlag wird übersprungen
- "Auto-Optimieren" → Alle Vorschläge automatisch durchführen

### Verlauf
```
14:30 SW-003 → Sensorik    0.35 → 0.43 (+0.08)
14:32 SW-007 → Backend     0.43 → 0.52 (+0.09) ✓ Ziel erreicht
```

## Kundennutzen

- **Messbar:** Kohäsion als Zahl (nicht "gut/schlecht")
- **Iterativ:** Schrittweise Verbesserung sichtbar
- **Nachvollziehbar:** Jede Änderung mit Begründung
- **Steuerbar:** User entscheidet über Anwendung

## Abgrenzung zu Stufe 4

| Stufe 4 (Regeln) | Stufe 6 (Optimierung) |
|------------------|----------------------|
| Prüft ob Regel erfüllt | Optimiert iterativ |
| Ja/Nein Ergebnis | Metrik 0-100% |
| Statische Prüfung | Dynamische Verbesserung |
| "Fehlt Test" | "Verschiebe nach X für +8%" |

## Akzeptanzkriterien

- [ ] `/api/optimization` Endpoint mit aktuellem Metrik-Stand
- [ ] Vorschläge mit geschätztem Delta
- [ ] "Anwenden" führt Änderung durch
- [ ] Verlauf zeigt bisherige Optimierungen
- [ ] Fortschrittsbalken zum Ziel-Schwellwert
