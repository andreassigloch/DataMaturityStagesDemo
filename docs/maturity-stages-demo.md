# Data Maturity Stages - Demo

Interaktive Demonstration der Datenreife-Stufen für Requirements Traceability.

## Demo-Flow

### Stufe 1-3: Übersicht
**Zeigen:** Graph-Visualisierung des Automotive-Außenlichtsystems
- 4 Stakeholder-Requirements → 7 System-Requirements → 4 Software-Requirements
- Traceability-Links (TRACED_TO, VERIFIED_BY, IMPLEMENTED_IN)
- Externe Abhängigkeiten (InputSpec) als "blinder Fleck"

**Frage:** "Wie erkennen wir fehlende Verbindungen?"
**Antwort:** → Weiter zu Stufe 4

---

### Stufe 4: Regeln
**Zeigen:** Regelbasierte Validierung mit Filter (VAL/SCO/OPT)

| Typ | Beispiel | Ergebnis |
|-----|----------|----------|
| Validierung | "Jedes SW-Req braucht Test" | SW-003 fehlt Test |
| Scoring | "Testabdeckung %" | 75% (3/4) |
| Optimierung | "Cross-References minimieren" | Vorschlag: SW-002 verschieben |

**Frage:** "Woher wissen wir, was wichtig ist?"
**Antwort:** → Weiter zu Stufe 5

---

### Stufe 5: Kennzahlen
**Zeigen:** Drei Wichtungs-Metriken pro Requirement

| Metrik | Formel | Interpretation |
|--------|--------|----------------|
| Impact | Anzahl abhängiger Elemente | Hoher Impact = viele betroffen bei Änderung |
| Change-Risk | ASIL × Verlinkungsgrad | Hohes Risiko = sicherheitskritisch + stark vernetzt |
| Review-Prio | Impact × Change-Risk (normiert) | Priorisierung für Reviews |

**Frage:** "Können wir vorhersagen, was zu verbessern ist?"
**Antwort:** → Weiter zu Stufe 6

---

### Stufe 6: Verbesserungen
**Zeigen:** Optimierungs-Vorschläge aus OPT-Regeln

| Regel | Vorschlag | Erwartete Verbesserung |
|-------|-----------|----------------------|
| Cross-References | SW-002 nach BrakeLightModule verschieben | -1 Cross-Reference |
| Modul-Kohäsion | SW-003 zu HazardLightModule | +15% Kohäsion |

**Frage:** "Wie lernt das System dazu?"
**Antwort:** → Weiter zu Stufe 7

---

### Stufe 7: Lernen
**Zeigen:** Chat-Sequenzen die zu Regeln werden

```
User: "Bei Bremslicht-Requirements immer ASIL angeben"
      ↓ (Pattern erkannt)
System: Soll ich Regel erstellen?
        "Alle SystemReqs mit Brems* brauchen ASIL"
      ↓ (User bestätigt)
Neue Regel: VAL-005 aktiv
```

**Lernquellen:**
- `manuell` ✏️ - User erstellt Regel direkt
- `feedback` 👍 - Aus User-Feedback abgeleitet
- `pattern` 🔄 - System erkennt Wiederholungen
- `chat` 💬 - Aus Chat-Verlauf extrahiert

---

## FAQ

**Q: Sind die Cypher-Queries generisch?**
A: Ja. Keine hardcodierten Werte wie "Brems" - Regeln arbeiten mit Struktur, nicht Inhalt.

**Q: Was ist Mock, was ist Live?**
A: Siehe Annex unten.

**Q: Wie funktioniert Pattern-Erkennung?**
A: Alignment mit aimprove ADR-001: Lexical → Semantic → Temporal → Composite

---

## Annex: Datenquellen

### Live (Neo4j via MCP)

| Daten | API | Beschreibung |
|-------|-----|--------------|
| Graph | `/api/graph` | Nodes + Edges aus Neo4j |
| Regeln | `/api/rules` | Alle Regel-Knoten |
| Validation | `/api/quality/validation` | VAL-Regeln ausführen |
| Scoring | `/api/quality/scoring` | SCO-Regeln ausführen |
| Optimization | `/api/optimization` | OPT-Vorschläge generieren |

### Mock (Frontend)

| Daten | Datei | Grund |
|-------|-------|-------|
| Memory Events | `mockData.ts` | Lernverlauf-Timeline Demo |
| Detected Patterns | `mockData.ts` | Pattern-Badges Demo |
| Centrality Initial | `mockData.ts` | Fallback wenn API fehlt |

### Erweiterbar via MCP

| Feature | Tool | Status |
|---------|------|--------|
| Feedback speichern | `store_feedback` | ✅ implementiert |
| Regel erstellen | `add_rule` | ✅ implementiert |
| Pattern erkennen | `detect_patterns` | ⚠️ nur Heuristik |
| Ähnlichkeits-Suche | `find_similar` | ❌ braucht Embeddings |

---

## Learnings

1. **Stufen-Alignment**: Tab-Struktur muss Stufen-Modell widerspiegeln
2. **Generische Regeln**: Keine hardcodierten Demo-Werte in Cypher
3. **Lernquellen klar machen**: User muss verstehen woher Regeln kommen
4. **Mock vs Live transparent**: Ehrlich sein was noch nicht implementiert ist
