# Demo-Script: Requirements Traceability mit Knowledge Graph & Claude Desktop

**Dauer:** 30 Minuten (20 Min Stufe 1-5, 10 Min Stufe 6-7)
**Zielgruppe:** Engineering-Teams, PLM-Verantwortliche, Quality Manager
**Setting:** Live-Demo mit Claude Desktop + Neo4j
**Beispiel:** Automotive Außenlichtsystem (Blinker, Bremslicht, Warnblinker)

---

## ⚠️ Wichtig: MCP kann nicht ein/ausgeschaltet werden!

Claude Desktop erlaubt kein temporäres Deaktivieren von MCP-Servern - nur Löschen.

**Lösung für die Demo:**
- **Stufe 1-2 (RAG-Limitation):** Neue Conversation starten, PDFs laden, Fragen stellen. MCP ist zwar aktiv, aber wir nutzen ihn bewusst NICHT.
- **Stufe 3-5 (Knowledge Graph):** In DERSELBEN oder neuer Conversation die MCP-Tools explizit aufrufen.

**Narrativ anpassen:**
> "Zuerst zeige ich, wie es OHNE strukturierte Daten aussieht - nur mit Dokumenten."
> "Jetzt aktivieren wir den Knowledge Graph..." (= wir rufen die MCP-Tools auf)

---

## Pre-Demo Checkliste

### 10 Minuten vor Demo-Start

- [ ] **Docker Desktop** gestartet und running
- [ ] **Neo4j Container** läuft:
  ```bash
  cd DataMaturityStages
  docker-compose up -d
  docker ps | grep req-traceability-neo4j
  ```
- [ ] **Neo4j Browser** geöffnet: http://localhost:7484
  - Login: neo4j / demo-password
  - Testquery: `MATCH (n) RETURN count(n)` → sollte ~27 Knoten zeigen
- [ ] **Dashboard** läuft (für Stufe 6-7):
  ```bash
  cd dashboard && npm run dev          # Frontend: http://localhost:5175
  cd dashboard/server && npm run dev   # Backend: http://localhost:3001
  ```
- [ ] **Claude Desktop** geöffnet
  - MCP-Status prüfen: Settings > Developer > "neo4j-requirements" muss grün sein
  - Falls rot: Claude Desktop mit Cmd+Q beenden, neu starten
- [ ] **Demo-PDFs** griffbereit im Ordner 
`/Users/andreas/Documents/Projekte/prod/demos/DataMaturityStages/demo-pdfs`

`demo-pdfs/`:
  - `lastenheft-aussenlicht.md`
  - `a-spice-auszug.md`
  - `iso-26262-auszug.md`
  - `can-interface-spec.md`
- [ ] **Zweiter Monitor** für Neo4j Browser / Dashboard (falls verfügbar)

### Schnelltest (2 Min)

**⚠️ MCP MUSS AKTIV SEIN für diesen Test!**

```
Claude: "Zeige alle SystemReqs aus der Neo4j Datenbank"
```

Erwartete Antwort: Liste mit SYS-001 bis SYS-007 (Blinker, Bremslicht, etc.)

---

## Demo-Ablauf

### Phase 0: Setup-Hinweis (0:00)

> **An Publikum:** "Ich zeige Ihnen jetzt eine Live-Demo. Wir starten mit PDFs - so wie Sie es kennen. Dann schalten wir den Knowledge Graph ein und Sie sehen den Unterschied."

---

### Stufe 1: Unstrukturierte Quellen (0:00 - 2:00)

**📄 MODUS: Nur PDFs (MCP-Tools NICHT nutzen)**

#### Aktion
PDFs auf dem Bildschirm zeigen - Finder öffnen, durch die 4 Dokumente scrollen.

#### Dokumente zeigen
1. `lastenheft-aussenlicht.md` - "So sieht Ihr Lastenheft aus"
2. `a-spice-auszug.md` - "Der Standard als PDF"
3. `iso-26262-auszug.md` - "Safety-Normen als Text"
4. `can-interface-spec.md` - "Interface-Spec vom anderen Team"

#### Talking Points

> "Das kennen Sie alle: Vier verschiedene Quellen - Lastenheft, A-SPICE, ISO 26262, CAN-Spezifikation vom Fahrwerk-Team. Jedes Team hat seine eigene Ablage."

> "Frage ans Publikum: Wie lange dauert es bei Ihnen, alle Anforderungen für das Außenlichtsystem zusammenzutragen? Ehrliche Antwort: Stunden, manchmal Tage."

#### Erwartetes Ergebnis
Publikum nickt - Wiedererkennung des Problems.

---

### Stufe 2: RAG-Grenze demonstrieren (2:00 - 4:00)

**📄 MODUS: Nur PDFs (MCP-Tools NICHT nutzen)**

#### Aktion
Neue Claude Desktop Conversation öffnen, PDFs per Drag&Drop laden.

#### Claude-Befehl 1 (funktioniert)
```
Durchsuche das Lastenheft nach allen Anforderungen zum Thema "Bremslicht"
```

#### Erwartetes Ergebnis
Claude findet Requirements aus dem Text:
- STK-002: Bremsvorgang erkennbar
- SYS-003: Bremslicht <50ms
- SYS-004: Bremslicht 80-300cd

#### Claude-Befehl 2 (scheitert - WOW-Moment)
```
Erfüllt unser Außenlichtsystem die A-SPICE Traceability-Anforderungen?
```

#### Erwartetes Ergebnis
Claude antwortet vage:
- "Ich kann aus den Dokumenten nicht direkt ableiten..."
- Oder: Generische Antwort ohne konkrete Prüfung

#### Talking Points

> "Sehen Sie das Problem? RAG findet Text-Passagen, aber keine BEZIEHUNGEN. Die Frage 'Erfüllen wir A-SPICE?' erfordert Wissen über ZUSAMMENHÄNGE - welches Requirement zu welchem Test, welche Traceability fehlt."

> "Genau hier beginnt der Knowledge Graph."

---

### Stufe 3: Graph-Visualisierung (4:00 - 7:00)

**🔗 MODUS: Knowledge Graph (MCP-Tools JETZT nutzen!)**

> **An Publikum:** "Jetzt aktivieren wir den Knowledge Graph. Die gleichen Daten - aber strukturiert."

#### Aktion
Neo4j Browser auf zweitem Monitor zeigen.

#### Claude-Befehl
```
Zeige die Requirement-Hierarchie für das Außenlichtsystem.
Nutze das query-Tool.
```

#### Erwartetes Ergebnis
Claude führt Cypher-Query aus:
```
STK-001 (Abbiegeabsicht) → SYS-001 (Blinker <100ms) → SW-001 (Timer 333ms)
STK-002 (Bremsvorgang)   → SYS-003 (Bremslicht <50ms) → SW-002 (Schwellwert)
STK-004 (Warnblinker)    → SYS-006 (synchron) → SW-003 (Override)
                         → SYS-007 (ohne Zündung) → SW-004 (Watchdog)
```

#### Neo4j Browser Query (parallel zeigen)
```cypher
MATCH path = (stk:StakeholderReq)-[:TRACED_TO*1..3]->(sw:SoftwareReq)
RETURN path
```

#### Talking Points

> "Das ist der Paradigmenwechsel: Statt Text-Suche sehen wir STRUKTUR. Jeder Knoten ein Requirement, jede Kante eine Beziehung."

> "Und jetzt das Entscheidende: Diese Struktur können wir gegen Regeln prüfen."

---

### Stufe 4: Regeln erstellen & validieren (7:00 - 11:00)

**🔗 MODUS: Knowledge Graph (MCP-Tools nutzen)**

#### Aktion
Live Regel-Erstellung aus A-SPICE Wissen.

#### Claude-Befehl 1 (Regel erstellen)
```
Erstelle eine A-SPICE Traceability-Regel:
"Jedes SoftwareReq muss einen Test haben"
Nutze das add_rule Tool.
```

#### Erwartetes Ergebnis
```
Regel erstellt: R001
- Name: Software-Req braucht Test
- Typ: verifikation
- Standard: A-SPICE SWE.4
- Cypher: MATCH (sw:SoftwareReq) WHERE NOT (sw)-[:VERIFIED_BY]->(:TestCase) RETURN sw
```

#### Claude-Befehl 2 (Validierung - WOW-Moment)
```
Prüfe alle aktiven Regeln. Nutze das validate Tool.
```

#### Erwartetes Ergebnis
```
VALIDIERUNG:
- Regeln geprüft: 1
- Violations: 1

SW-003 "Warnblinker Override" hat KEINEN zugeordneten Test!
→ TC-005 fehlt
```

#### Talking Points

> "Das haben Sie gerade gesehen: Eine Regel erstellt, sofort validiert. Der Graph WEISS, welche Beziehungen fehlen."

> "SW-003 - der Warnblinker Override - hat keinen Test. Das wäre im Audit ein Finding."

---

### Stufe 5: Compliance Score & Impact (11:00 - 17:00)

**🔗 MODUS: Knowledge Graph (MCP-Tools nutzen)**

#### Claude-Befehl 1 — Compliance Score berechnen
```
Berechne den Compliance-Score. Nutze das compliance_score Tool.
```

#### Erwartetes Ergebnis
```
COMPLIANCE SCORE:
- ECE R6: 85% (5 von 6 Requirements compliant)
- ECE R7: 100% (2 von 2 Requirements compliant)
- Overall: ~85%

Lücke: SYS-003, SYS-007 ohne vollständige Verifikation
```

#### Claude-Befehl 2 — Regel verschärfen (Score-Effekt)
```
Füge eine strengere Regel hinzu:
"ASIL-C Requirements brauchen mindestens 2 Tests"
Standard: ISO 26262-8
```

#### Erwartetes Ergebnis (Score-Änderung)
```
Neue Regel erstellt.
Validierung: 2 neue Violations!

- SYS-003 (ASIL-C): nur 1 Test statt 2
- SYS-007 (ASIL-C): nur 1 Test statt 2

Score sinkt von 85% auf ~65%
```

#### Talking Points

> "Mit EINER Regel-Änderung sehen wir sofort den Impact. Der Score fällt. Das ist kein Bug - das ist Realität. Die strengere Regel zeigt Lücken auf."

---

#### Claude-Befehl 3 — Externe Abhängigkeit (Impact-Analyse)
```
Was ist betroffen wenn das Fahrwerk-Team die CAN-Message EXT-001 ändert?
Nutze das impact_analysis Tool mit requirementId "EXT-001".
```

#### Erwartetes Ergebnis (WOW-Moment)
```
IMPACT ANALYSE: EXT-001 (CAN BrakePedalForce, ASIL D)

Quelle: Fahrwerk-Team
Änderung würde betreffen:

1. SW-002 "Bremslicht-Schwellwert" (ASIL D)
   → Schwellwert abhängig von CAN-Resolution 0.1N
   → SW-002 erbt ASIL D direkt aus EXT-001

2. (transitiv) SYS-003 "Bremslicht <50ms" (ASIL C)
   → über TRACED_TO mit SW-002 verbunden

WARNUNG: Das Außenlicht-Team wurde vermutlich NICHT informiert!
```

#### Talking Points

> "Das ist der Moment. Eine Änderung vom Fahrwerk-Team - und wir sehen SOFORT, welche Requirements betroffen sind."

> "Frage ans Publikum: Wusste Ihr Außenlicht-Team von dieser CAN-Änderung? In der Realität: Oft nein."

> "Mit dem Knowledge Graph: Der Graph WEISS, dass diese Abhängigkeit existiert."

---

#### Claude-Befehl 4 — ASIL-Kette prüfen (zweiter Audit-Befund)

> **An Publikum:** "Eine Sache fällt jetzt auf: SW-002 hat ASIL D, sein System-Vorgänger SYS-003 nur ASIL C. Ist das erlaubt?"

```
Pruefe die Regel VAL-006 "ASIL-Kette monoton". Nutze das validate Tool.
```

#### Erwartetes Ergebnis
```
VAL-006 "ASIL-Kette monoton" (ISO 26262-9)
Violations: 1

- SW-002 "Bremslicht-Schwellwert" (ASIL D)
  Quelle: SYS-003 "Bremslicht <50ms" (ASIL C)
  → Abgeleitete Anforderung hat hoeheren ASIL als Quelle
  → ohne dokumentierte ASIL-Decomposition unzulaessig
```

#### Talking Points

> "Das ist der zweite Audit-Befund — und der subtilere. Schauen Sie sich die Quellen an: Das Lastenheft sagt klar, dass die Bremslicht-Aktorik auf ASIL C heruntergebrochen werden darf. Die CAN-Spec sagt, BrakePedalForce ist ASIL D. Beides für sich ist korrekt."

> "Was ist passiert? Der Software-Engineer modelliert SW-002 für die CAN-Eingabe und übernimmt deren ASIL-Stufe — D. Lokal absolut plausibel: die Software verarbeitet ja ein D-Signal. Übersehen wird, dass SW-002 in der Hierarchie unter SYS-003 (C) hängt. Damit entsteht eine ASIL-Erhöhung ohne dokumentierte Decomposition."

> "ISO 26262-9 §5 erlaubt das nur mit expliziter ASIL-Decomposition. Im Audit: Major-Finding."

> "Das ist der eigentliche Punkt: Kein PDF widerspricht einem anderen. Jede einzelne Entscheidung war lokal richtig. Erst die Summe ergibt den Compliance-Bruch — und genau das findet im Word-Dokument niemand. Im Graph reichen zwei CASE-Statements."

---

### Stufe 6: ML & Prediction (17:00 - 22:00)

**🤖 MODUS: Knowledge Graph + ML (MCP-Tools nutzen)**

> **An Publikum:** "Jetzt wird es spannend: Machine Learning auf dem Knowledge Graph."

#### Aktion
Dashboard öffnen: http://localhost:5175

#### Claude-Befehl 1 (Centrality - WOW-Moment)
```
Welche Requirements sind am kritischsten? Nutze centrality_analysis.
```

#### Erwartetes Ergebnis
```
CENTRALITY ANALYSE:

Top PageRank (Wichtigkeit):
1. SYS-003 "Bremslicht <50ms" - Score: 0.42
   → Viele eingehende Abhängigkeiten!

Top Betweenness (Bottleneck):
2. SW-002 "Bremslicht-Schwellwert" - Score: 0.38
   → Liegt auf vielen kritischen Pfaden
```

#### Talking Points

> "PageRank - bekannt von Google - zeigt uns: SYS-003 ist das wichtigste Requirement. Viele andere hängen davon ab."

> "Betweenness zeigt Bottlenecks: SW-002 liegt auf vielen Pfaden. Ändert sich das, hat es Dominoeffekte."

---

#### Claude-Befehl 2 (Prediction)
```
Welche Traceability-Links fehlen vermutlich? Nutze predict_missing_links.
```

#### Erwartetes Ergebnis
```
VORHERGESAGTE FEHLENDE LINKS:

1. SW-003 → TC-??? (Konfidenz: 87%)
   → Warnblinker Override hat keinen Test!

2. SYS-004 → SW-??? (Konfidenz: 72%)
   → Bremslicht Intensität nicht abgeleitet
```

#### Talking Points

> "Das System SAGT VORAUS, welche Links fehlen. SW-003 ohne Test - hatten wir vorhin manuell gefunden. Hier automatisch."

---

#### Claude-Befehl 3 (Similarity)
```
Finde ähnliche Requirements zu SYS-003. Nutze find_similar_requirements.
```

#### Erwartetes Ergebnis
```
ÄHNLICHE REQUIREMENTS zu SYS-003:

1. SYS-001 "Blinker <100ms" - Similarity: 0.67
   → Gleiche Struktur: Timing-Requirement mit Test

2. SYS-007 "Warnblinker ohne Zündung" - Similarity: 0.54
   → Ähnliche Abhängigkeitsmuster
```

#### Talking Points

> "Jaccard Similarity findet strukturell ähnliche Requirements. Nützlich für: 'Wenn SYS-003 einen Bug hatte, prüfe auch SYS-001'."

---

### Stufe 7: Lernendes System (22:00 - 27:00)

**🧠 MODUS: Knowledge Graph + Learning (MCP-Tools nutzen)**

> **An Publikum:** "Jetzt der letzte Schritt: Das System lernt aus Feedback."

#### Claude-Befehl 1 (Feedback speichern)
```
Speichere Feedback: SYS-003 hat eine vage Zeitangabe "<50ms" - besser wäre "30-50ms".
Nutze record_feedback mit targetId "SYS-003".
```

#### Erwartetes Ergebnis
```
FEEDBACK GESPEICHERT:

Target: SYS-003 "Bremslicht <50ms"
Issue: Vage Zeitangabe "<50ms" - besser wäre "30-50ms"
Typ: review

→ Learning Event erstellt
→ Pattern-Erkennung getriggert
```

---

#### Claude-Befehl 2 (Pattern Detection - WOW-Moment)
```
Erkenne Anti-Patterns in den Requirements. Nutze detect_patterns.
```

#### Erwartetes Ergebnis
```
ERKANNTE ANTI-PATTERNS:

1. VAGE ZEITANGABE (3 Treffer)
   - SYS-003: "<50ms" → Range angeben
   - SYS-001: "<100ms" → Range angeben
   - EXT-003: ">100ms" → Obergrenze fehlt

2. FEHLENDE EINHEIT (1 Treffer)
   - SYS-004: "80-300cd" → cd ist korrekt ✓

3. UNSPEZIFISCHE BEDINGUNG (1 Treffer)
   - STK-004: "bei einer Panne" → Was ist "Panne"?
```

#### Talking Points

> "Das System hat GELERNT: Vage Zeitangaben sind ein Problem. Es findet jetzt ALLE ähnlichen Fälle automatisch."

> "Das ist der Unterschied zu statischen Regeln: Das System wird besser, je mehr Feedback es bekommt."

---

#### Claude-Befehl 3 (Learning Timeline)
```
Was hat das System heute gelernt? Nutze learning_timeline.
```

#### Erwartetes Ergebnis
```
LEARNING TIMELINE:

[27.01.2025 14:32] FEEDBACK_RECEIVED
  → SYS-003: Vage Zeitangabe erkannt

[27.01.2025 14:32] PATTERN_DETECTED
  → "Vage Zeitangabe" Pattern zu Knowledge Base hinzugefügt

[27.01.2025 14:33] PATTERN_APPLIED
  → 3 weitere Requirements mit gleichem Pattern gefunden
```

#### Talking Points

> "Das System dokumentiert, WAS es WANN gelernt hat. Vollständige Nachvollziehbarkeit."

---

#### Aktion: Dashboard zeigen

Dashboard auf http://localhost:5175 öffnen und Tabs durchklicken:

1. **Knowledge Graph Tab:** Nodes mit Centrality-Größen
2. **Centrality Metrics Tab:** PageRank/Betweenness Tabelle
3. **Detected Patterns Tab:** Anti-Pattern Liste
4. **Learning Timeline Tab:** Chronologische Events

#### Talking Points

> "Das Dashboard zeigt alles auf einen Blick. Für den Quality Manager: Welche Requirements sind kritisch? Welche Patterns treten auf?"

---

### Zusammenfassung (27:00 - 30:00)

#### Talking Points

> "Sie haben heute gesehen:"
> - Stufe 1-2: PDFs allein reichen nicht
> - Stufe 3-5: Knowledge Graph + Regeln = 70-80% des Wertes
> - Stufe 6: ML identifiziert Kritikalität und fehlende Links
> - Stufe 7: Das System lernt aus Ihrem Feedback

> "Die Frage ist nicht OB, sondern WANN Sie starten."

---

## Exakte Claude-Befehle (Kurzreferenz)

| Minute | Phase | Modus | Befehl |
|--------|-------|-------|--------|
| 2:00 | PDF | 📄 Nur PDFs | `Durchsuche das Lastenheft nach Anforderungen zum Thema Bremslicht` |
| 3:00 | PDF | 📄 Nur PDFs | `Erfüllt unser Außenlichtsystem die A-SPICE Traceability-Anforderungen?` |
| 5:00 | Graph | 🔗 MCP nutzen | `Zeige die Requirement-Hierarchie für das Außenlichtsystem. Nutze query.` |
| 8:00 | Regel | 🔗 MCP nutzen | `Erstelle Regel: Jedes SoftwareReq muss einen Test haben. Nutze add_rule.` |
| 9:00 | Valid | 🔗 MCP nutzen | `Prüfe alle aktiven Regeln. Nutze validate.` |
| 11:00 | Score | 🔗 MCP nutzen | `Berechne den Compliance-Score. Nutze compliance_score.` |
| 13:00 | Regel | 🔗 MCP nutzen | `Füge Regel hinzu: ASIL-C braucht 2 Tests. Nutze add_rule.` |
| 15:00 | Impact | 🔗 MCP nutzen | `Was ist betroffen wenn EXT-001 sich ändert? Nutze impact_analysis.` |
| 16:00 | ASIL | 🔗 MCP nutzen | `Prüfe Regel VAL-006 (ASIL-Kette monoton). Nutze validate.` |
| 17:00 | ML | 🤖 MCP+ML | `Welche Requirements sind am kritischsten? Nutze centrality_analysis.` |
| 19:00 | Predict | 🤖 MCP+ML | `Welche Traceability-Links fehlen vermutlich? Nutze predict_missing_links.` |
| 20:00 | Similar | 🤖 MCP+ML | `Finde ähnliche Requirements zu SYS-003. Nutze find_similar_requirements.` |
| 22:00 | Feedback | 🧠 Learning | `Speichere Feedback zu SYS-003. Nutze record_feedback.` |
| 24:00 | Pattern | 🧠 Learning | `Erkenne Anti-Patterns. Nutze detect_patterns.` |
| 26:00 | Timeline | 🧠 Learning | `Was hat das System gelernt? Nutze learning_timeline.` |

---

## Wow-Momente (Timing beachten)

| Minute | Wow-Moment | Emotionale Wirkung |
|--------|------------|-------------------|
| 3:30 | RAG scheitert an "Erfüllen wir A-SPICE?" | "Aha, DAS ist das Problem" |
| 9:30 | SW-003 ohne Test gefunden | "Das wäre ein Audit-Finding!" |
| 14:00 | Score fällt von 85% auf 65% | "So sieht Realität aus" |
| 16:00 | EXT-001 Impact-Kette | "Wusste das Team davon?" - Stille |
| 16:30 | VAL-006 findet ASIL-Bruch SYS-003(C) → SW-002(D) | "ISO 26262 Major-Finding aus zwei CASE-Statements" |
| 18:00 | PageRank zeigt SYS-003 als kritischstes Req | "Google-Algorithmus für Requirements!" |
| 19:30 | System sagt SW-003 fehlenden Test voraus | "Das hatten wir manuell gefunden - jetzt automatisch" |
| 25:00 | Pattern Detection findet 3 vage Zeitangaben | "Aus EINEM Feedback lernt es ALLE Fälle" |

---

## Troubleshooting

### Problem: MCP-Server nicht verbunden

**Symptom:** "neo4j-requirements" ist rot in Settings > Developer

**Lösung:**
1. Prüfen ob Neo4j läuft: `docker ps | grep req-traceability`
2. Falls nicht: `cd demo-requirements-traceability && docker-compose up -d`
3. Claude Desktop komplett beenden (Cmd+Q), neu starten
4. Logs prüfen: Settings > Developer > neo4j-requirements > Logs

### Problem: Neo4j-Verbindung schlägt fehl

**Symptom:** "The client is unauthorized" im Log

**Lösung:**
```bash
# Container neu starten mit frischen Daten
docker-compose down -v
docker-compose up -d
# Seed-Daten laden
docker exec -i req-traceability-neo4j cypher-shell -u neo4j -p demo-password < seed-data.cypher
```

### Problem: Falsche/keine Daten

**Symptom:** "0 Requirements gefunden"

**Lösung:**
```bash
# Seed-Daten neu laden
docker exec req-traceability-neo4j cypher-shell -u neo4j -p demo-password "MATCH (n) DETACH DELETE n"
docker exec -i req-traceability-neo4j cypher-shell -u neo4j -p demo-password < seed-data.cypher
```

### Fallback bei komplettem Ausfall

1. Neo4j Browser direkt nutzen (http://localhost:7484)
2. Cypher-Queries manuell ausführen
3. Konzept-Folien zeigen: `ausblick-folien/stufe-6-7-ausblick.md`

---

## Nach der Demo

### Q&A vorbereiten

**Häufige Fragen:**

1. **"Wie lange dauert die Einführung?"**
   > "Pilot in 4-6 Wochen mit einem Subsystem. Vollständiger Rollout je nach Scope 3-6 Monate."

2. **"Wer pflegt die Regeln?"**
   > "Initiale Extraktion aus Standards. Anpassungen durch Quality-Team. Claude schlägt Updates vor."

3. **"Integration mit DOORS/Polarion?"**
   > "APIs verfügbar. Export als ReqIF. Import aus Excel, Word, PDF."

4. **"On-Premise möglich?"**
   > "Ja, komplett. Neo4j On-Premise, Claude API oder lokales LLM."

### Follow-up

- [ ] Demo-Recording teilen (falls aufgezeichnet)
- [ ] Kontaktdaten austauschen
- [ ] Termin für Pilot-Gespräch anbieten

---

**Erstellt:** 2025-01-14
**Aktualisiert:** 2025-01-29
**Autor:** andreas@siglochconsulting.de
**Version:** 3.0 - Stufe 6-7 Live-Demo mit Dashboard (CR-009)
