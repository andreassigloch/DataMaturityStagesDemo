# Demo-Ontologie — Requirements Traceability (Außenlicht)

**Zweck:** Diese Ontologie beschreibt **genau** die Knoten- und Kantentypen, die in der Demo-Datenbank ([seed-data.cypher](../seed-data.cypher)) verwendet werden. Sie ist eine **vereinfachte, projektspezifische Teilmenge** der konzernweiten SE-Ontologie `@sigloch/contracts/se` (v3.3.0).

Wer die volle Konzern-Ontologie braucht: siehe Abschnitt [§5 Mapping zur @sigloch/contracts/se](#5-mapping-zur-siglochcontractsse).

---

## 1. Knotentypen (Element-Labels)

Acht Labels sind in der Demo erlaubt. Jedes Label hat einen festen Pflichtsatz an Properties.

| Label | Bedeutung | Anzahl in Demo | Beispiel-IDs |
|-------|-----------|----------------|--------------|
| `StakeholderReq` | Anforderung aus Kundensicht | 4 | STK-001 … STK-004 |
| `SystemReq` | Technisch abgeleitete System-Anforderung | 7 | SYS-001 … SYS-007 |
| `SoftwareReq` | Software-Anforderung (Detaillierung) | 4 | SW-001 … SW-004 |
| `TestCase` | Verifikationsnachweis | 4 | TC-001 … TC-004 |
| `Komponente` | HW- oder SW-Modul | 4 | K-001 … K-004 |
| `InputSpec` | Externe Vorgabe anderer Teams | 3 | EXT-001 … EXT-003 |
| `Regel` | Validierungs-/Scoring-/Optimierungsregel | 7+ | VAL-001…, SCO-001…, OPT-001… |
| `ProjectMeta` | Projekt-Stammdaten (1 Knoten, Identifikation) | 1 | `project-meta` |

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
| `asil` | `B`, `C`, `D` *(Subset von QM/A/B/C/D der Sigloch-Ontologie)* |
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

## 3. Demo-spezifische Lücken (absichtlich!)

Die Seed-Daten enthalten **vorsätzlich unvollständige bzw. inkonsistente** Modellierung, damit die Validierungsregeln in der Live-Demo Findings produzieren:

1. **`SW-003` (Warnblinker Override)** hat keinen `VERIFIED_BY → TestCase`. → triggert Regel `VAL-002` (Test-Coverage).
2. **`InputSpec`-Knoten** (EXT-001..003) sind im Lastenheft erwähnt, aber im Außenlicht-Team oft "blinder Fleck". → triggert Regel `VAL-004` und `impact_analysis`.
3. **ASIL-Bruch SYS-003 (C) → SW-002 (D):** Die Software-Anforderung erbt einen höheren ASIL als ihr System-Vorgänger, ohne dass eine ASIL-Decomposition (ISO 26262-9) dokumentiert ist. → triggert Regel `VAL-006`. Hintergrund: SW-002 wurde aus EXT-001 (CAN BrakePedalForce, ASIL D) abgeleitet — die ASIL-Stufe stammt aus der Eingabe, nicht aus dem System-Req. Das ist ein typischer Audit-Befund in der Praxis.

---

## 4. Validierungsregeln (Regel-Knoten)

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

## 5. Mapping zur `@sigloch/contracts/se`

Die konzernweite SE-Ontologie `@sigloch/contracts/se` v3.3.0 definiert **13 ElementTypes** und **7 TraceTypes** für eine vollständige Systems-Engineering-Modellierung (INCOSE/SysML 2.0). Die Demo-Ontologie nutzt davon eine projektspezifische, vereinfachte Teilmenge:

### 5.1 Knoten-Mapping

| Demo-Label | Sigloch ElementType | `kinds` (bei REQ) | Anmerkung |
|------------|---------------------|-------------------|-----------|
| `StakeholderReq` | `REQ` | `functional` | In voller Ontologie über `UC → REQ`-Komposition |
| `SystemReq` | `REQ` | `functional` / `non-functional` | Property `standard` ist Demo-Erweiterung |
| `SoftwareReq` | `REQ` | `functional` | Granularität wird in Sigloch über Komposition (`REQ → REQ`) abgebildet |
| `TestCase` | `TEST` | — | Sigloch hat zusätzlich `method` (test/inspection/analysis/demonstration) und `testResult` |
| `Komponente` | `MOD` | — | Sigloch unterscheidet nicht HW/SW per Default — Demo-Property `typ` |
| `InputSpec` | `SCHEMA` | — | Sigloch nutzt `SCHEMA` für Datenkontrakte/Interfaces |
| `Regel` | *(kein Pendant)* | — | Demo-spezifisch; in Sigloch sind Regeln Code, keine Knoten |
| `ProjectMeta` | *(kein Pendant)* | — | Demo-spezifisch (Datenbank-Identifikation) |

**Nicht in der Demo verwendet** (aus Sigloch verfügbar): `SYS`, `UC`, `ACTOR`, `FCHAIN`, `FUNC`, `FLOW`, `SESSION`, `CR`, `MS`.

### 5.2 Kanten-Mapping

| Demo-Kante | Sigloch TraceType | Anmerkung |
|------------|-------------------|-----------|
| `TRACED_TO` (StakeholderReq→SystemReq, SystemReq→SoftwareReq) | `compose` | Sigloch: Anforderungs-Hierarchie via `REQ →compose→ REQ` |
| `VERIFIED_BY` (SoftwareReq→TestCase) | `verify` *(Richtung gedreht)* | Sigloch: `TEST →verify→ REQ` (Test verifiziert Req) |
| `IMPLEMENTED_IN` (SoftwareReq→Komponente) | `allocate` | Sigloch: Funktion/Anforderung allokiert auf Modul |
| `DEPENDS_ON` (Req→InputSpec) | `relation` mit `label='depends-on'` | Sigloch: generische `relation`-Kante mit Label |

**Nicht in der Demo verwendet:** `io`, `satisfy`, `produces`.

### 5.3 Versions-Tracking

```text
Demo-Ontologie:               v1.0.0   (diese Datei)
abgeleitet von:               @sigloch/contracts/se
  ├─ ONTOLOGY_VERSION         3.3.0
  ├─ RULES_VERSION            2.0.0
  └─ META_MODEL_VERSION       1.2.0
```

Quelle der Sigloch-Ontologie: `sigloch-modules/packages/contracts/src/se/`

### 5.4 Warum eine reduzierte Demo-Ontologie?

Die Demo soll in 30 Minuten den Mehrwert eines Knowledge Graphs gegenüber RAG zeigen. Das volle SE-Metamodell (13 Element-Typen, 7 Trace-Typen, FMEA-Attribute, INCOSE-Verifikationsmethoden, Audit-Lineage) würde die Botschaft erschlagen. Die Demo-Ontologie zeigt das **minimale**, didaktisch sinnvolle Subset; die Migration auf das volle Modell ist mechanisch (Mapping-Tabelle oben) und in einem Folgeprojekt umsetzbar.

---

## 6. Validierung dieser Ontologie

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
