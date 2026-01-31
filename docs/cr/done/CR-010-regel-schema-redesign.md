# CR-010: Regel-Schema Redesign

**Status:** ✅ Completed
**Erstellt:** 2026-01-29
**Autor:** andreas@siglochconsulting.de
**Abhängigkeit:** CR-009 (Demo Stufe 6-7)

---

## Ziel

Einheitliches Regel-Schema nach **Funktion** statt Herkunft. Drei Output-Typen für Kunden:
- **Verbesserungsvorschläge** (Validierung)
- **Kennzahlen** (Scoring)
- **Optimierungen** (Architektur-Loop)

---

## Problem

Aktuelles Schema in `seed-data.cypher`:
```cypher
CREATE (r:Regel {
  id: 'REG-001',
  typ: 'Traceability',    // ← Nur ein Feld für alles
  schwere: 'fehler',
  cypher: '...'
})
```

**Schwächen:**
1. `typ` vermischt Prüfungs-Ebene (was?) mit Domain (wo?)
2. Keine Unterscheidung zwischen Validierung und Optimierung
3. Kein Support für Optimierungs-Loop (Messen → Generieren → Vergleichen)
4. Learning-Metadaten fehlen (quelle, confidence, treffer)

---

## Lösung: Funktions-basiertes Schema

### Taxonomie

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REGEL-TAXONOMIE (nach FUNKTION)                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Prüfungs-Ebene (WAS wird geprüft?)                                    │
│  ├── Struktur       → Graph-Verbindungen, Lücken, Zyklen               │
│  ├── Inhalt         → Textqualität, vage Begriffe, Formulierung        │
│  ├── Konsistenz     → Widersprüche zwischen Elementen                  │
│  └── Vollständigkeit→ Fehlende Elemente, Coverage-Lücken               │
│                                                                         │
│  Wirkungs-Ebene (WAS ist der Output?)                                  │
│  ├── Validierung    → Verbesserungsvorschläge (Pass/Fail + Fix)        │
│  ├── Scoring        → Kennzahlen (numerische Metriken)                 │
│  └── Optimierung    → Optimierungen (Δ-basierte Vorschläge im Loop)    │
│                                                                         │
│  Domain (WO gilt die Regel?)                                           │
│  ├── Traceability   → Nachverfolgbarkeit zwischen Ebenen               │
│  ├── Safety         → Funktionale Sicherheit (ASIL, etc.)              │
│  ├── Quality        → Requirements-Qualität (INCOSE, etc.)             │
│  └── Architektur    → Modulstruktur, Kopplung, Kohäsion                │
│                                                                         │
│  Standard-Referenz (WOHER kommt die Regel?)                            │
│  ├── A-SPICE        → Automotive SPICE Level-Kriterien                 │
│  ├── ISO 26262      → Functional Safety                                │
│  ├── INCOSE         → Requirements Engineering Best Practices          │
│  ├── ECE            → Typ-Zulassung (R6, R7, R112...)                  │
│  └── Intern         → Firmenspezifisch / Projektspezifisch             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Neo4j Schema (erweitert)

```cypher
CREATE (r:Regel {
  id: 'REG-XXX',
  name: 'Regel-Name',
  beschreibung: 'Was die Regel prüft und warum',

  // FUNKTION
  ebene: 'Struktur',              // Struktur|Inhalt|Konsistenz|Vollständigkeit
  wirkung: 'Validierung',         // Validierung|Scoring|Optimierung

  // PRÜFLOGIK
  cypher: '...',                  // Haupt-Query
  cypher_measure: null,           // Optional: Metrik-Query (für Scoring/Optimierung)
  schwellwert: null,              // Optional: Grenzwert (für Scoring/Optimierung)
  richtung: null,                 // Optional: minimieren|maximieren
  operator: null,                 // Optional: SPLIT|MERGE|MOVE|CREATE (für Optimierung)

  // KONTEXT
  schwere: 'warnung',             // fehler|warnung|info
  domain: 'Traceability',         // Traceability|Safety|Quality|Architektur
  standard: 'A-SPICE',            // A-SPICE|ISO 26262|INCOSE|ECE|Intern

  // LEARNING (CR-009 Integration)
  quelle: 'manuell',              // manuell|pattern|feedback|import
  confidence: 1.0,                // 0.0-1.0 (für gelernte Regeln)
  anwendungen: 0,                 // Counter: Wie oft angewandt?
  treffer: 0,                     // Counter: Wie oft Violations gefunden?

  aktiv: true,
  erstelltAm: datetime()
})
```

---

## Output-Typen (Kundensicht)

| Wirkung | Output für Kunde | Beispiel | Dashboard-Anzeige |
|---------|------------------|----------|-------------------|
| **Validierung** | Verbesserungsvorschläge | "SW-003 hat keinen Test → Test erstellen" | Liste mit Severity-Icon |
| **Scoring** | Kennzahlen | "Testabdeckung: 87%, Kopplung: 0.34" | Gauge/Balken |
| **Optimierung** | Optimierungen | "Module X+Y zusammenlegen spart 5 Abhängigkeiten" | Vorschlag mit Δ-Wert |

---

## Optimierungs-Loop (NEU)

Für `wirkung: 'Optimierung'` gilt ein iterativer Prozess:

```
┌─────────────────────────────────────────────────────────────────┐
│  OPTIMIERUNGS-LOOP                                              │
│                                                                 │
│  1. MESSEN (cypher_measure)                                     │
│     → Aktuelle Metrik berechnen                                │
│     → z.B. "Cross-References = 12"                             │
│                                                                 │
│  2. BEWERTEN (schwellwert + richtung)                          │
│     → Gegen Zielwert prüfen                                    │
│     → z.B. "12 > 10 (Schwellwert) → Optimierung nötig"         │
│                                                                 │
│  3. GENERIEREN (operator)                                       │
│     → Move-Operatoren anwenden:                                │
│        SPLIT  - Modul aufteilen (bei zu hoher Fan-Out)         │
│        MERGE  - Module zusammenführen (bei Fragmentierung)     │
│        MOVE   - Funktion verschieben (bei Cross-Refs)          │
│        CREATE - Neues Interface (bei starker Kopplung)         │
│                                                                 │
│  4. SIMULIEREN                                                  │
│     → Neue Metriken berechnen (ohne Apply)                     │
│     → z.B. "Nach MOVE: Cross-References = 8"                   │
│                                                                 │
│  5. VERGLEICHEN                                                 │
│     → Δ berechnen: Vorher vs. Nachher                          │
│     → z.B. "Δ = -4 Cross-References (-33%)"                    │
│                                                                 │
│  6. VORSCHLAGEN                                                 │
│     → Top-N Verbesserungen mit Δ-Score anzeigen                │
│     → User entscheidet                                         │
│                                                                 │
│  7. (Optional) ANWENDEN                                         │
│     → User bestätigt → Graph ändern → Loop neu                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Beispiel-Regeln (alle 3 Typen)

### Validierung → Verbesserungsvorschläge

```cypher
CREATE (r:Regel {
  id: 'VAL-001',
  name: 'Test-Coverage',
  beschreibung: 'Jedes Software-Requirement braucht mindestens einen Test',

  ebene: 'Vollständigkeit',
  wirkung: 'Validierung',

  cypher: '
    MATCH (sw:SoftwareReq)
    WHERE NOT (sw)-[:VERIFIED_BY]->(:TestCase)
    RETURN sw.id AS id, sw.titel AS name, "SoftwareReq" AS typ
  ',

  schwere: 'fehler',
  domain: 'Traceability',
  standard: 'A-SPICE',
  quelle: 'manuell',
  confidence: 1.0,
  aktiv: true
})
```

### Scoring → Kennzahlen

```cypher
CREATE (r:Regel {
  id: 'SCO-001',
  name: 'Testabdeckung',
  beschreibung: 'Prozentsatz der Software-Requirements mit zugeordnetem Test',

  ebene: 'Vollständigkeit',
  wirkung: 'Scoring',

  cypher: '
    MATCH (sw:SoftwareReq)
    OPTIONAL MATCH (sw)-[:VERIFIED_BY]->(tc:TestCase)
    WITH count(DISTINCT sw) AS total, count(DISTINCT tc) AS covered
    RETURN
      covered AS wert,
      total AS von,
      toFloat(covered) / total AS score,
      "%" AS einheit
  ',

  schwellwert: 0.8,
  richtung: 'maximieren',

  schwere: 'info',
  domain: 'Traceability',
  standard: 'A-SPICE',
  quelle: 'manuell',
  confidence: 1.0,
  aktiv: true
})
```

### Optimierung → Optimierungen

```cypher
CREATE (r:Regel {
  id: 'OPT-001',
  name: 'Cross-References minimieren',
  beschreibung: 'Module so strukturieren, dass Abhängigkeiten zwischen Modulen minimiert werden',

  ebene: 'Struktur',
  wirkung: 'Optimierung',

  cypher_measure: '
    MATCH (k1:Komponente)-[d:DEPENDS_ON]->(k2:Komponente)
    WHERE k1 <> k2
    RETURN count(d) AS crossRefs
  ',

  schwellwert: 10,
  richtung: 'minimieren',
  operator: 'MOVE',

  cypher: '
    MATCH (sw:SoftwareReq)-[:IMPLEMENTED_IN]->(k1:Komponente)
    MATCH (sw)-[:DEPENDS_ON]->(ext:InputSpec)
    MATCH (other:SoftwareReq)-[:DEPENDS_ON]->(ext)
    WHERE other <> sw
    MATCH (other)-[:IMPLEMENTED_IN]->(k2:Komponente)
    WHERE k1 <> k2
    RETURN sw.id AS kandidat, k1.name AS von, k2.name AS nach,
           "Verschieben reduziert Cross-Reference" AS grund
  ',

  schwere: 'info',
  domain: 'Architektur',
  standard: 'Intern',
  quelle: 'manuell',
  confidence: 1.0,
  aktiv: true
})
```

---

## Implementierung

### 1. seed-data.cypher erweitern

- [x] Bestehende Regeln (REG-001 bis REG-005) auf neues Schema migrieren → VAL-001 bis VAL-005
- [x] Neue Scoring-Regeln hinzufügen (SCO-001 Testabdeckung, SCO-002 Traceability-Quote)
- [x] Neue Optimierungs-Regeln hinzufügen (OPT-001 Cross-References, OPT-002 Modul-Kohaesion)

### 2. Backend anpassen

- [x] `neo4j-mcp/src/tools/validate.ts` - Support für alle 3 Wirkungstypen mit `executeScoring()` und `generateOptimizations()`
- [x] `neo4j-mcp/src/tools/rules.ts` - Erweitertes Schema bei addRule() mit allen neuen Feldern
- [x] MCP Tool: `scoring` - Kennzahlen berechnen
- [x] MCP Tool: `optimize` - Optimierungsvorschläge generieren
- [x] Learning-Counter: `anwendungen` und `treffer` werden bei Regelausführung aktualisiert

### 3. Dashboard anpassen

- [x] `QualityPanel.tsx` erstellt mit 3 Sektionen
- [x] Tab-Navigation: Verbesserungen | Kennzahlen | Optimierungen
- [x] Kennzahlen mit ScoreGauge Progress-Bar und Schwellwert-Anzeige
- [x] Optimierungen mit DeltaBadge und Apply-Button (deaktiviert für Simulation)

### 4. Schema-Validierung

- [x] `dashboard/src/schemas/index.ts` - Vollständige Zod-Schemas für alle CR-010 Typen
- [x] Tests für Schema-Konformität in `neo4j-mcp/tests/cr010-validate.test.ts` (29 Tests)

---

## Migration bestehender Regeln

| Alt (REG-XXX) | Neu | ebene | wirkung |
|---------------|-----|-------|---------|
| REG-001 Traceability-Vollständigkeit | VAL-001 | Vollständigkeit | Validierung |
| REG-002 Test-Coverage | VAL-002 | Vollständigkeit | Validierung |
| REG-003 Vage Zeitangaben | VAL-003 | Inhalt | Validierung |
| REG-004 Externe Abhängigkeiten | VAL-004 | Struktur | Validierung |
| REG-005 ASIL-Klassifizierung | VAL-005 | Konsistenz | Validierung |

---

## Akzeptanzkriterien

- [x] Alle bestehenden Regeln funktionieren weiterhin (VAL-001 bis VAL-005)
- [x] Mindestens 2 Scoring-Regeln mit Dashboard-Anzeige (SCO-001, SCO-002)
- [x] Mindestens 1 Optimierungs-Regel mit Δ-Berechnung (OPT-001, OPT-002)
- [x] Learning-Felder (quelle, confidence, anwendungen, treffer) werden bei Regelausführung aktualisiert
- [x] Dashboard zeigt drei getrennte Sektionen (QualityPanel mit Tab-Navigation)

---

## Referenzen

- CR-009: Demo Stufe 6-7 (Learning-System)
- graphengine: `src/llm-engine/validation/quality-scorer.ts`
- graphengine: `docs/learningsystem.md`
