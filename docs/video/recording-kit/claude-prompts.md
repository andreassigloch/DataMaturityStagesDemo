# Claude Desktop Prompts - Demo Recording

Copy & Paste diese Prompts in Claude Desktop während der Demo.

---

## Stufe 2: RAG-Grenze demonstrieren

### Prompt 1 (funktioniert)
```
Durchsuche das Lastenheft nach allen Anforderungen zum Thema "Bremslicht"
```

**Erwartete Antwort:** STK-002, SYS-003, SYS-004

### Prompt 2 (scheitert - WOW-Moment)
```
Erfüllt unser Außenlichtsystem die A-SPICE Traceability-Anforderungen?
```

**Erwartete Antwort:** Vage, keine konkrete Prüfung möglich

---

## Stufe 3: Graph-Visualisierung (MCP aktiv!)

### Prompt 3
```
Zeige die Requirement-Hierarchie für das Außenlichtsystem.
Nutze das query-Tool.
```

**Erwartete Antwort:** Hierarchie STK → SYS → SW

---

## Stufe 4: Regel-Validierung

### Prompt 4 (Regel erstellen)
```
Erstelle eine A-SPICE Traceability-Regel:
"Jedes SoftwareReq muss einen Test haben"
Nutze das add_rule Tool.
```

### Prompt 5 (Validierung - WOW-Moment)
```
Prüfe alle aktiven Regeln. Nutze das validate Tool.
```

**Erwartete Antwort:** SW-003 hat keinen Test!

---

## Stufe 5: Compliance & Impact

### Prompt 6 (Score)
```
Berechne den Compliance-Score. Nutze das compliance_score Tool.
```

### Prompt 7 (Strengere Regel)
```
Füge eine strengere Regel hinzu:
"ASIL-C Requirements brauchen mindestens 2 Tests"
Standard: ISO 26262-8
```

### Prompt 8 (Impact-Analyse - HIGHLIGHT)
```
Was ist betroffen wenn das Fahrwerk-Team die CAN-Message EXT-001 ändert?
Nutze das impact_analysis Tool mit requirementId "EXT-001".
```

**Erwartete Antwort:**
- SYS-003 "Bremslicht <50ms" betroffen
- SW-002 "Schwellwert" betroffen
- Warnung: Team nicht informiert!

---

## Stufe 6: ML & Prediction

### Prompt 9 (Centrality - WOW-Moment)
```
Welche Requirements sind am kritischsten? Nutze centrality_analysis.
```

**Erwartete Antwort:** SYS-003 hat höchsten PageRank

### Prompt 10 (Prediction)
```
Welche Traceability-Links fehlen vermutlich? Nutze predict_missing_links.
```

**Erwartete Antwort:** SW-003 → TC-??? (87% Konfidenz)

### Prompt 11 (Similarity)
```
Finde ähnliche Requirements zu SYS-003. Nutze find_similar_requirements.
```

---

## Stufe 7: Lernendes System

### Prompt 12 (Feedback)
```
Speichere Feedback: SYS-003 hat eine vage Zeitangabe "<50ms" - besser wäre "30-50ms".
Nutze record_feedback mit targetId "SYS-003".
```

### Prompt 13 (Pattern Detection - WOW-Moment)
```
Erkenne Anti-Patterns in den Requirements. Nutze detect_patterns.
```

**Erwartete Antwort:** 3 vage Zeitangaben gefunden

### Prompt 14 (Timeline)
```
Was hat das System heute gelernt? Nutze learning_timeline.
```

---

## Talking Points (Zwischen den Prompts)

### Nach Stufe 2:
> "Sehen Sie das Problem? RAG findet Text-Passagen, aber keine BEZIEHUNGEN."

### Nach Stufe 4:
> "Das haben Sie gerade gesehen: Eine Regel erstellt, sofort validiert. SW-003 hat keinen Test - das wäre im Audit ein Finding."

### Nach Stufe 5 Impact:
> "Eine Änderung vom Fahrwerk-Team - und wir sehen SOFORT, welche Requirements betroffen sind. Wusste Ihr Außenlicht-Team von dieser Änderung?"

### Nach Stufe 6:
> "PageRank - bekannt von Google - zeigt uns: SYS-003 ist das wichtigste Requirement."

### Nach Stufe 7:
> "Das System hat GELERNT: Vage Zeitangaben sind ein Problem. Es findet jetzt ALLE ähnlichen Fälle automatisch."

---

## Troubleshooting

### MCP nicht verbunden
1. Claude Desktop beenden (Cmd+Q)
2. `docker ps | grep neo4j` prüfen
3. Claude Desktop neu starten
4. Settings > Developer > neo4j-requirements = grün?

### Keine Daten
```bash
docker exec -i req-traceability-neo4j cypher-shell -u neo4j -p demo-password < seed-data.cypher
```

### Falsche Ergebnisse
```bash
docker exec req-traceability-neo4j cypher-shell -u neo4j -p demo-password "MATCH (n) DETACH DELETE n"
# Dann seed-data.cypher neu laden
```
