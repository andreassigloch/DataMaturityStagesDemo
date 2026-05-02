# CR-020: PDF↔Graph-Konsistenz, Demo-Ontologie & ASIL-Kette

**Status:** ✅ Done
**Priorität:** Demo-Qualität (peinlich-Risiko)
**Erstellt:** 2026-05-02
**Abgeschlossen:** 2026-05-02

---

## Problem

Drei zusammenhängende Lücken machten die Demo angreifbar, sobald jemand parallel PDFs und Graph öffnete oder nach der "verwendeten Ontologie" fragte:

1. **PDF↔Graph-Inkonsistenz im Lastenheft.** Die STK-Anforderungen im Lastenheft (Ausfallsicherheit Nacht, Blendfreiheit, Dynamische Lichtverteilung, Begrüßungsanimation) hatten **keinerlei Bezug** zu den STK-Knoten im Graph (Abbiegen, Bremsen, Ausleuchten, Warnblinker). Das hätte bei jedem Side-by-Side-Vergleich die Demo gesprengt.

2. **Keine Ontologie-Dokumentation.** Die Demo nutzt eine eigene, vereinfachte Knoten-/Kanten-Sprache (`StakeholderReq`, `TRACED_TO`, …) die weder benannt noch erklärt war. Beim Mapping zur konzernweiten SE-Ontologie (`@sigloch/contracts/se` v3.3.0) wäre nicht erkennbar gewesen, dass es sich um eine *bewusste* Reduktion handelt — es hätte wie Schlampigkeit gewirkt.

3. **Externe CAN-Inputs ohne PDF-Verankerung + ASIL-Bruch unentdeckt.** EXT-002 (Plattform-Zykluszeit) und EXT-003 (Safety-Timeout) existierten nur im Graph. Schlimmer: SW-002 hatte ASIL D, sein Vorgänger SYS-003 nur ASIL C — ein klarer ISO-26262-Verstoß ohne entsprechende Validierungsregel. Die Impact-Demo (EXT-001 ändert sich) blieb damit oberflächlich, weil die ASIL-Vererbungs-Story nicht im Graph sichtbar war.

---

## Lösung

Vier zusammenhängende Änderungen, die PDFs, Graph und Demo-Script in eine konsistente Story bringen und gleichzeitig die ASIL-Kette zum didaktischen Highlight machen.

### 1. Lastenheft umgeschrieben

**Datei:** [demo-pdfs/lastenheft-aussenlicht.md](../../../demo-pdfs/lastenheft-aussenlicht.md)

- STK-001..004 jetzt deckungsgleich mit `seed-data.cypher`: Abbiegeabsicht, Bremsvorgang, Fahrbahn ausleuchten, Warnblinker bei Panne.
- ASIL-Werte (B/D/B/C) konsistent mit Graph.
- Geltungsbereich auf Signalleuchten begrenzt; Frontscheinwerfer in (fiktives) separates Lastenheft `LH-ALS-FRONT-2024` ausgelagert. Erklärt warum STK-003 "Fahrbahn ausleuchten" als High-Level-Stakeholder-Req auftaucht ohne tiefe System-Hierarchie im Graph.
- §5.2 enthält jetzt eine ASIL-Tabelle für EXT-001/002/003 inkl. expliziter ASIL-Vererbungsregel nach ISO 26262-9 §5.

### 2. Demo-Ontologie dokumentiert

**Datei (neu):** [demo-pdfs/demo-ontologie.md](../../../demo-pdfs/demo-ontologie.md)

Beschreibt **genau** die in der Demo-DB verwendeten Elemente — kein Element mehr, kein Element weniger. Alle Enum-Werte gegen `seed-data.cypher` mit Bash/grep verifiziert.

| Abschnitt | Inhalt |
|-----------|--------|
| §1 Knotentypen | 8 Labels (StakeholderReq, SystemReq, SoftwareReq, TestCase, Komponente, InputSpec, Regel, ProjectMeta) mit Property-Schema und Wertebereichen |
| §2 Kantentypen | 4 Trace-Typen (TRACED_TO, VERIFIED_BY, IMPLEMENTED_IN, DEPENDS_ON) mit Quelle/Ziel-Mustern + ASCII-Diagramm |
| §3 Demo-Lücken | Absichtliche Modellierungs-Defekte (SW-003 ohne Test, EXT-* blinder Fleck, ASIL-Bruch SW-002) |
| §4 Validierungsregeln | VAL-001..006, SCO-001/002, OPT-001/002 — matcht seed-data |
| **§5 Mapping zur `@sigloch/contracts/se` v3.3.0** | Knoten- und Kanten-Mapping, Versions-Tracking, Begründung für Reduktion |
| §6 Validierung | Cypher-Queries die die Ontologie gegen die laufende DB prüfen |

Damit ist die Demo-Ontologie als **bewusste, projektspezifische Teilmenge** der Konzern-Ontologie ausgewiesen — nicht als Eigenbau.

### 3. CAN-Spec PDF erweitert

**Datei:** [demo-pdfs/can-interface-spec.md](../../../demo-pdfs/can-interface-spec.md)

- Message 0x123 BrakePedalForce explizit als **ASIL D** klassifiziert (war zuvor ASIL-frei).
- Neuer §4 "Plattformweite Vorgaben" verankert EXT-002 (Plattform-Zykluszeit, ASIL B) und EXT-003 (Safety-Timeout, ASIL C). Beide hatten zuvor keine PDF-Quelle.
- §6 listet "Bekannte abhängige Systeme" inkl. Außenlicht/Bremslicht — macht den Impact konkret für die Demo.
- Verweis auf ISO 26262-8 §6.5 ("Impact analysis for safety requirements changes") als Norm-Bezug für die Demo-Story.

### 4. Validierungsregel VAL-006 "ASIL-Kette monoton"

**Datei:** [seed-data.cypher](../../../seed-data.cypher)

Neue Regel-Knoten zwischen VAL-005 und SCO-001 eingefügt. Cypher prüft per CASE-Statement, dass entlang `TRACED_TO` der ASIL nicht steigt.

```cypher
MATCH (a)-[r:TRACED_TO|DEPENDS_ON]->(b)
WHERE a.asil IS NOT NULL AND b.asil IS NOT NULL
  AND CASE a.asil WHEN 'QM' THEN 0 WHEN 'A' THEN 1 WHEN 'B' THEN 2
                  WHEN 'C' THEN 3 WHEN 'D' THEN 4 ELSE -1 END
    < CASE b.asil WHEN 'QM' THEN 0 WHEN 'A' THEN 1 WHEN 'B' THEN 2
                  WHEN 'C' THEN 3 WHEN 'D' THEN 4 ELSE -1 END
  AND type(r) = 'TRACED_TO'
RETURN b.id AS id, b.titel AS name, labels(b)[0] AS typ
```

**Live gegen laufende DB getestet** → liefert genau einen Treffer:

```
quelle, quelle_asil, ziel, ziel_asil, typ
"SYS-003", "C", "SW-002", "D", "SoftwareReq"
```

Ein einziger, klarer Befund — perfekt für die Demo. Die Regel wurde zusätzlich in der laufenden DB nachgeladen, damit sie ohne `down -v && up -d` sofort verfügbar ist.

### 5. Demo-Script aktualisiert

**Datei:** [demo-script.md](../../../demo-script.md)

- **Stufe 5 — neuer "Befehl 4 (ASIL-Kette prüfen)"** direkt nach dem EXT-001-Impact-Highlight. Erzählerische Brücke: SW-002s ASIL D kommt aus EXT-001 (CAN), nicht aus SYS-003 — Audit-Major-Finding.
- Talking Points referenzieren ISO 26262-9 §5 (Decomposition) und ISO 26262-8 §6.5 (Impact-Analyse) wörtlich.
- Kurzreferenz-Tabelle (Zeile 525): neue Zeile bei 16:00.
- Wow-Momente-Tabelle: Eintrag bei 16:30 ("ISO 26262 Major-Finding aus zwei CASE-Statements").
- Kosmetik: Stufe-5-Headlines auf einheitliches Schema "Befehl N — Beschreibung" gebracht.

---

## Geschlossener Kreis

Nach CR-020 hängen alle vier PDFs und der Graph logisch zusammen:

```
Lastenheft §5.2 (EXT mit ASIL)
    │
    ▼
CAN-Spec §3.1 + §4 (begründet ASIL D von 0x123, Quelle EXT-002/003)
    │
    ▼
Graph: DEPENDS_ON von SW-002 → EXT-001 (ASIL D-Vererbung)
    │
    ▼
ISO 26262-8 §6.5 (fordert Impact-Analyse bei Schnittstellenänderung)
    │
    ▼
VAL-006 (findet ASIL-Bruch SYS-003 C → SW-002 D)
    │
    ▼
Demo-Talking-Point referenziert ISO 26262-9 §5 (Decomposition)
```

Side-by-Side-Vergleich PDF/Graph fliegt nicht mehr auf. Die Frage "welche Ontologie nutzt ihr?" hat jetzt eine ehrliche, dokumentierte Antwort. Die Impact-Demo bekommt einen zweiten, schärferen Audit-Befund.

---

## Verifikation

```bash
# 1. PDF↔Graph STK + ASIL konsistent
grep -E "STK-00[1-4]" demo-pdfs/lastenheft-aussenlicht.md
grep -E "STK-00[1-4]" seed-data.cypher | head -8
# Erwartet: gleiche Titel, ASIL B/D/B/C in beiden

# 2. Ontologie-Doku matcht DB-Zustand
docker exec req-traceability-neo4j cypher-shell -u neo4j -p demo-password \
  "CALL db.labels() YIELD label RETURN label ORDER BY label"
# Erwartet: 8 Labels wie in demo-ontologie.md §1 dokumentiert

# 3. VAL-006 findet genau einen Treffer
docker exec req-traceability-neo4j cypher-shell -u neo4j -p demo-password \
  "MATCH (r:Regel {id: 'VAL-006'}) CALL apoc.cypher.run(r.cypher, {}) YIELD value RETURN value"
# Erwartet: SW-002 (ohne apoc: Cypher direkt aus VAL-006.cypher Property ausführen)
```

---

## Kontext: AiSE-Ökosystem

Im Vorfeld wurde geprüft, ob ein **funktionierender PDF→Graph-Transformer** im AiSE-Kosmos existiert. Befund: `grphzr-pdf` v2.0.0 (`/Users/andreas/Documents/Projekte/dev/aise/grphzr-pdf`) ist gebaut und einsatzfähig (6 Extraktoren, LLM-Pipeline, Cypher-Output, kompatibel zu `@sigloch/contracts/se`). Nicht in dieser CR integriert (Demo-Risiko Live-LLM, Latenz). Empfohlen als Folge-CR für eine "echte" PDF→Graph-Live-Demo.

---

## Geänderte Dateien

| Datei | Status | Zweck |
|-------|--------|-------|
| `demo-pdfs/lastenheft-aussenlicht.md` | modifiziert | Konsistenz mit Graph, EXT-Tabelle |
| `demo-pdfs/can-interface-spec.md` | überschrieben | EXT-002/003 verankert, ASIL ausgewiesen |
| `demo-pdfs/demo-ontologie.md` | **neu** | Ontologie-Dokumentation + Sigloch-Mapping |
| `seed-data.cypher` | modifiziert | VAL-006 ASIL-Kette monoton |
| `demo-script.md` | modifiziert | Stufe 5 Befehl 4 + Tabellen-Updates |

---

## Out of Scope (mögliche Folge-CRs)

- A-SPICE und ISO-26262-Auszüge gegen seed-data prüfen (kursorisch geprüft, Befund: konsistent — A-SPICE SWE.4 deckt VAL-002, ISO 26262-8 §6.5 deckt VAL-006).
- Echte PDF→Graph-Pipeline mit `grphzr-pdf` als Demo-Stufe 2.5 ("Live-Extraktion vor Publikum") integrieren.
- Demo-Ontologie auf volle `@sigloch/contracts/se` v3.3.0 migrieren (Aufwand: hoch, Demo-Wirkung: gering — die didaktische Reduktion ist Feature, kein Bug).
