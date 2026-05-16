# Demo-Ontologie — Requirements Traceability

**Zweck:** Diese Ontologie definiert die in der Demo-Datenbank zugelassenen Knoten- und Kantentypen.

---

## 1. Knotentypen (Element-Labels)

Acht Labels sind zugelassen. Jedes Label hat einen festen Pflichtsatz an Properties.

| Label | Bedeutung |
|-------|-----------|
| `StakeholderReq` | Anforderung aus Kundensicht |
| `SystemReq` | Technisch abgeleitete System-Anforderung |
| `SoftwareReq` | Software-Anforderung (Detaillierung) |
| `TestCase` | Verifikationsnachweis |
| `Komponente` | HW- oder SW-Modul |
| `InputSpec` | Externe Vorgabe anderer Teams |
| `Regel` | Validierungs-/Scoring-/Optimierungsregel |
| `ProjectMeta` | Projekt-Stammdaten (Identifikation) |

### 1.1 Property-Schema je Label

```text
StakeholderReq { id, titel, beschreibung, prioritaet, status, asil }
SystemReq      { id, titel, beschreibung, asil, status, standard }
SoftwareReq    { id, titel, beschreibung, status, asil }
TestCase       { id, titel, beschreibung, typ, status, ergebnis }
Komponente     { id, name,  beschreibung, typ, asil }
InputSpec      { id, titel, beschreibung, quelle, version, asil, … }
Regel          { id, name,  beschreibung, ebene, wirkung, cypher,
                 schwere, domain, standard, quelle, confidence,
                 anwendungen, treffer, aktiv, erstelltAm, … }
ProjectMeta    { id, name, description, version, domain, standards, created, updated }
```

### 1.2 Wertebereiche (Enums)

| Property | Erlaubte Werte |
|----------|----------------|
| `asil` | `B`, `C`, `D` |
| `prioritaet` | `Muss`, `Soll`, `Kann` |
| `status` (Req) | `approved`, `implemented` |
| `status` (TestCase) | `passed`, `pending` |
| `typ` (Komponente) | `Hardware`, `Software` |
| `typ` (TestCase) | `Timing`, `Messung`, `Funktional` |
| `wirkung` (Regel) | `Validierung`, `Scoring`, `Optimierung` |
| `ebene` (Regel) | `Vollstaendigkeit`, `Inhalt`, `Struktur`, `Konsistenz` |
| `schwere` (Regel) | `fehler`, `warnung`, `info` |
| `domain` (Regel) | `Traceability`, `Quality`, `Safety`, `Architektur` |
| `standard` (Req/Regel) | `ECE R6`, `ECE R7`, `ECE R112`, `A-SPICE`, `ISO 26262`, `Intern` |

---

## 2. Kantentypen (Trace-Relationships)

Vier Kantentypen sind in der Demo erlaubt. Jede Kante hat ein definiertes Quelle/Ziel-Muster.

| Kante | Quelle → Ziel | Bedeutung |
|-------|---------------|-----------|
| `TRACED_TO` | `StakeholderReq → SystemReq` <br> `SystemReq → SoftwareReq` | Hierarchische Ableitung (Customer → System → Software) |
| `VERIFIED_BY` | `SoftwareReq → TestCase` | Verifikationsnachweis (welcher Test prüft welche Anforderung) |
| `IMPLEMENTED_IN` | `SoftwareReq → Komponente` | Allokation (welche Komponente realisiert die Anforderung) |
| `DEPENDS_ON` | `SystemReq → InputSpec` <br> `SoftwareReq → InputSpec` | Externe Abhängigkeit (welche Vorgabe eines anderen Teams beeinflusst uns); Property `kritisch: bool`, `grund: string` |

### 2.1 Diagramm

```
                     ┌──────────────────┐
                     │   InputSpec      │
                     │   (EXT-…)        │
                     └─────────▲────────┘
                               │ DEPENDS_ON
                               │ (kritisch)
                               │
StakeholderReq ──TRACED_TO──> SystemReq ──TRACED_TO──> SoftwareReq
   (STK-…)                    (SYS-…)                  (SW-…)
                                                          │
                                                  ┌───────┴────────┐
                                                  │                │
                                            VERIFIED_BY      IMPLEMENTED_IN
                                                  │                │
                                                  ▼                ▼
                                              TestCase         Komponente
                                              (TC-…)           (K-…)
```

---

## 3. Validierungsregeln (Regel-Knoten)

Regeln sind selbst Knoten im Graph. Jede Regel speichert ihren Cypher-Ausdruck als Property `cypher`. Aktive Regeln werden von den MCP-Tools `validate`, `scoring`, `optimize` ausgeführt.

| Regel-ID | Wirkung | Was wird geprüft? |
|----------|---------|-------------------|
| `VAL-001` | Validierung | Jedes `SoftwareReq` muss aus einem `SystemReq` ableitbar sein |
| `VAL-002` | Validierung | Jedes `SoftwareReq` braucht mindestens einen `TestCase` |
| `VAL-003` | Validierung | Beschreibungen ohne vage Zeitangaben (`schnell`, `bald`, `zeitnah`, …) |
| `VAL-004` | Validierung | `SystemReq` mit Schnittstellenbezug muss `DEPENDS_ON → InputSpec` haben |
| `VAL-005` | Validierung | Alle `SystemReq` brauchen `asil`-Klassifizierung |
| `VAL-006` | Validierung | ASIL-Kette monoton: abgeleitetes Requirement (`TRACED_TO`) darf keinen höheren ASIL haben als seine Quelle (ISO 26262-9). |
| `SCO-001` | Scoring | Test-Coverage = abgedeckte SoftwareReqs / total |
| `SCO-002` | Scoring | Traceability-Quote = SoftwareReqs mit System-Trace / total |
| `OPT-001` | Optimierung | Cross-References zwischen Komponenten minimieren |
| `OPT-002` | Optimierung | Modul-Kohäsion (gemeinsame Abhängigkeiten innerhalb Komponente) maximieren |

---

## 4. Validierung dieser Ontologie

```cypher
// Alle Labels in der Demo-DB
CALL db.labels() YIELD label RETURN label ORDER BY label;
// Erwartet: InputSpec, Komponente, ProjectMeta, Regel,
//           SoftwareReq, StakeholderReq, SystemReq, TestCase

// Alle Beziehungstypen in der Demo-DB
CALL db.relationshipTypes() YIELD relationshipType
RETURN relationshipType ORDER BY relationshipType;
// Erwartet: DEPENDS_ON, IMPLEMENTED_IN, TRACED_TO, VERIFIED_BY
```

Ergebnis muss exakt mit Abschnitt 1 + 2 übereinstimmen — bei Abweichung ist entweder die Ontologie oder die Datenbank stale.
