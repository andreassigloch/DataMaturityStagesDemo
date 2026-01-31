# CR-013: Regeln-Tab Darstellung verbessern

**Status:** ✅ Done
**Priorität:** Bug/UX
**Erstellt:** 2026-01-29

## Probleme

### 1. "Inaktiv" Badge unklar
Bei ASIL-Klassifizierung steht "inaktiv" ohne Erklärung.
User weiß nicht: Warum inaktiv? Was bedeutet das?

### 2. SCO-Regeln zeigen "Keine Cypher-Abfrage"
Scoring-Regeln haben `cypher_measure` statt `cypher`.
UI zeigt fälschlich "Keine Abfrage".

### 3. Regeln vs. Kennzahlen Unterscheidung
Testabdeckung und Traceability sind Kennzahlen (SCO), keine Validierungsregeln.
Sollten anders dargestellt oder gruppiert werden.

## Lösung

### UI-Änderungen
1. **Inaktiv-Badge**: Tooltip hinzufügen "Diese Regel ist deaktiviert"
2. **Cypher-Anzeige**:
   - VAL: `cypher` anzeigen
   - SCO: `cypher_measure` anzeigen mit Label "Metrik-Abfrage"
   - OPT: beide anzeigen falls vorhanden
3. **Gruppierung**: Nach `wirkung` gruppieren (Validierung | Scoring | Optimierung)

## Änderungen

1. `RulesPanel.tsx`:
   - Tooltip für inaktiv
   - Cypher/cypher_measure unterscheiden
   - Optional: Gruppierung nach wirkung

2. `/api/rules`: `cypher_measure` Feld hinzufügen

## Akzeptanzkriterien

- [x] Inaktiv erklärt (Tooltip)
- [x] Cypher-Anzeige mit Label je nach Wirkung
- [x] Unterschied VAL/SCO/OPT erkennbar (farbige Badges)
