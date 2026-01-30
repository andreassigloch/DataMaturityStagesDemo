# Konzept: Stufen-Alignment und Lernquellen

**Status:** Entwurf
**Erstellt:** 2026-01-29

## Aktueller Stand vs. Stufen-Modell

| Stufe | Beschreibung | Aktuell implementiert | Problem |
|-------|--------------|----------------------|---------|
| 1-2 | Basis-Graph | ✅ Übersicht Tab | OK |
| 3 | Beziehungen | ✅ Übersicht Tab | OK |
| 4 | Regeln | ✅ Prüfregeln Tab | VAL/SCO/OPT vermischt |
| 5 | Kennzahlen | ⚠️ Wichtigkeit + Qualität | Wichtigkeit = PageRank, nicht ML |
| 6 | ML/Prediction | ❌ Nur Cypher-Heuristiken | Kein echtes ML |
| 7 | Lernsystem | ⚠️ Lernverlauf Tab | Quellen unklar |

---

## Lernverlauf - Quellen für Regeln

### ✅ CR-017: Lernquellen (implementiert)

Alignment mit aimprove ADR-001 Pattern. Zwei Dimensionen:

**Lernquellen (woher kommt die Information?):**

| Quelle | Icon | Beschreibung | Beispiel |
|--------|------|--------------|----------|
| `manuell` | ✏️ | User erstellt Regel direkt | "Keine vagen Zeitangaben" |
| `feedback` | 👍 | User-Feedback zu Requirement | "SYS-003 hat unklare Formulierung" |
| `pattern` | 🔄 | System erkennt Muster | 3× gleiches Feedback → Regel |
| `chat` | 💬 | Aus Chat-Verlauf extrahiert | "Immer ASIL angeben" → Regel |
| `import` | 📥 | Externe Quelle | Regel aus Standard-PDF |
| `similar` | 🔗 | Ähnlichkeitsanalyse | Embedding-basierte Regel |

**Lernaktionen (was ist passiert?):**

| Aktion | Icon | Beschreibung |
|--------|------|--------------|
| `created` | ➕ | Neu erstellt |
| `confirmed` | ✅ | Pattern bestätigt (Schwellwert erreicht) |
| `derived` | 🎯 | Regel aus Quelle abgeleitet |
| `updated` | 🔄 | Aktualisiert (Confidence, Counter) |
| `consolidated` | 🔀 | Patterns zusammengeführt |
| `rejected` | ❌ | User lehnt Vorschlag ab |

**Erkennungsmethode (wie wurde erkannt?):**

| Methode | Beschreibung |
|---------|--------------|
| `lexical` | Regel-basiert (Regex, Keywords) |
| `semantic` | Embedding-basiert (Ähnlichkeitssuche) |
| `temporal` | Sequenz-basiert (wiederholte Feedbacks) |
| `composite` | Kombiniert mehrere Methoden |

---

## Stufe 5: Was ist echte "Wichtigkeit"?

### Aktuell
- PageRank = Grad-basiert (viele Verbindungen = wichtig)
- Kein ML, reine Graph-Metrik

### Alternativen für echte Stufe 5
1. **Impact-Score**: Wie viele Tests/Komponenten sind betroffen?
2. **Change-Risk**: Historie von Änderungen + Abhängigkeiten
3. **Review-Priorität**: Kombination aus ASIL + Verlinkungsgrad

// diese drei Wichtungen so umsetzen, sortierung nach den einzelnen kriterien. impact score verbindungen, change historie random, review prio = ASIL * Changerisk*impact score auf 100 Normiert

### Empfehlung
PageRank als "Vernetzungsgrad" benennen, nicht "Wichtigkeit".
Echte Wichtigkeit braucht Kontext (ASIL, Business-Value).

---

## Stufe 6: Was ist echtes ML?

### Aktuell implementiert
- `centrality_analysis`: PageRank = Graph-Algorithmus, kein ML
- `predict_missing_links`: Heuristiken (fehlende Traces) = Regel-Anwendung
- `find_similar_requirements`: Jaccard Similarity = Statistik, kein ML

### Echtes ML wäre
1. **Embedding-basierte Ähnlichkeit**: Text-Vektoren vergleichen
2. **Link Prediction**: GNN (Graph Neural Network)
3. **Anomalie-Erkennung**: Ungewöhnliche Muster erkennen
4. **Klassifikation**: Requirement-Typ automatisch erkennen

### Empfehlung für Demo
Ehrlich sein: "Stufe 6 zeigt was möglich wäre mit ML"
Oder: Embedding-basierte Suche als echtes ML-Feature einbauen.

// Embedding als ML-Feature einbauen, zur not embeddings offline berechnen und "statisch" an die beispiel daten anhängen
---

## Stufe 7: Lernsystem

### Aktuell
- User-Feedback speichern → ✅
- Pattern aus Feedback erkennen → ⚠️ rudimentär
- Automatische Regel-Generierung → ❌ nicht implementiert

// Können wir in den Lernverlauf nicht chat sequenzen ( mock daten) verwenden? Haben wir so ja auch in Graphengine, daraus könnte man ja auch eine regel ableiten. Wir brauchen nur ein Beispiel


### Lern-Loop (Ziel)
```
User gibt Feedback
    ↓
System speichert in :Feedback Node
    ↓
Pattern-Erkennung läuft (detect_patterns)
    ↓
Bei >N gleichartigen Feedback: Regel-Vorschlag
    ↓
User akzeptiert → Regel mit quelle='pattern' erstellt
```

### Was fehlt
1. Automatische Regel-Generierung aus Patterns
2. Confidence-Tracking (wie oft trifft Regel zu?)
3. Regel-Refinement basierend auf Anwendung

---

## Kundenverständliche Beispiele

### Stufe 4: Prüfregeln
> "System prüft automatisch ob alle Software-Requirements einen Test haben"

### Stufe 5: Kennzahlen
> "Dashboard zeigt Testabdeckung (80%) und Traceability-Quote (95%)"

### Stufe 6: Vorhersage
> "System schlägt vor: SYS-003 sollte mit SW-004 verlinkt werden"

### Stufe 7: Lernen
> "User markiert 'Bremslicht' als sicherheitskritisch.
>  Nach 3 ähnlichen Markierungen schlägt System vor:
>  'Alle Requirements mit Brems* als Safety-relevant markieren?'"

---

## Nächste Schritte

1. **Bugs fixen** (CR-011, CR-012, CR-013)
2. **Lernverlauf** klarer strukturieren (Kategorien erklären)
3. **Stufe 5** umbenennen: "Vernetzung" statt "Wichtigkeit"
4. **Stufe 6** ehrlich labeln oder Embedding-Suche einbauen
5. **Stufe 7** Regel-Generierung aus Feedback implementieren
