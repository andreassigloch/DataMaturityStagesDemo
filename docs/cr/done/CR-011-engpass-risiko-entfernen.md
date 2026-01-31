# CR-011: Engpass-Risiko aus Wichtigkeit-Tab entfernen

**Status:** ✅ Done
**Priorität:** Bug
**Erstellt:** 2026-01-29

## Problem

Im Tab "Wichtigkeit" (Stufe 5) sind Wichtigkeits-Score und Engpass-Risiko immer identisch.
Beide werden aus dem gleichen Degree/PageRank berechnet → redundant.

## Ursache

In `centrality.ts`:
```typescript
pageRank: Math.round((node.degree / maxDegree) * 100) / 100,
betweenness: Math.round((node.degree / maxDegree) * 0.5 * 100) / 100,
```

Betweenness ist nur `pageRank * 0.5` → keine echte Betweenness-Berechnung.

## Lösung

Option A: **Engpass-Spalte entfernen** (empfohlen für Demo)
- Einfach, schnell
- Kein irreführender Wert

Option B: Echte Betweenness berechnen
- Erfordert GDS Plugin oder aufwändige Cypher-Berechnung
- Mehrwert für Demo fraglich

## Änderungen (Option A)

1. `CentralityPanel.tsx`: Engpass-Spalte entfernen
2. `centrality.ts` (Server): betweenness-Feld entfernen
3. Schema anpassen

## Akzeptanzkriterien

- [x] Nur eine Metrik "Wichtigkeit" pro Node
- [x] Kein irreführender Engpass-Wert
- [x] Mock-Daten angepasst
