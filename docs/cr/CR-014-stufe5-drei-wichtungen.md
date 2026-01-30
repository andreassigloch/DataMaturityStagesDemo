# CR-014: Stufe 5 - Drei Wichtungen implementieren

**Status:** ✅ Done
**Priorität:** Feature
**Erstellt:** 2026-01-29

## Anforderung

Statt einer einzelnen "Wichtigkeit" (PageRank) drei separate Metriken:

| Metrik | Berechnung | Beschreibung |
|--------|------------|--------------|
| **Impact-Score** | degree (Verbindungen) | Wie viele andere Objekte sind betroffen? |
| **Change-Risk** | Random (Demo) | Simulierte Änderungshistorie |
| **Review-Priorität** | ASIL × ChangeRisk × Impact / 100 | Kombinierte Priorisierung |

## Normierung

- Impact-Score: 0-100 (degree / maxDegree × 100)
- Change-Risk: 0-100 (random für Demo, später echte Historie)
- Review-Priorität: 0-100 (ASIL × ChangeRisk × Impact / 10000)

## ASIL-Werte für Berechnung

| ASIL | Numerischer Wert |
|------|------------------|
| QM | 10 |
| A | 25 |
| B | 50 |
| C | 75 |
| D | 100 |

## Änderungen

### Backend: `centrality.ts`

```typescript
const metrics = rawData.map(node => {
  const impactScore = Math.round((node.degree / maxDegree) * 100);
  const changeRisk = Math.round(Math.random() * 100); // Demo: random
  const asilValue = getAsilValue(node.asil); // QM=10, A=25, B=50, C=75, D=100
  const reviewPriority = Math.round((asilValue * changeRisk * impactScore) / 10000);

  return {
    nodeId: node.nodeId,
    label: node.label,
    type: node.type,
    impactScore,
    changeRisk,
    reviewPriority,
    asil: node.asil,
    degree: node.degree,
  };
});
```

### Frontend: `CentralityPanel.tsx`

- Drei Spalten: Impact | Change-Risk | Review-Priorität
- Sortierung nach jeder Spalte möglich
- Farbcodierung: grün (<30), gelb (30-70), rot (>70)

## Akzeptanzkriterien

- [ ] Drei separate Metriken pro Node
- [ ] Sortierung nach jeder Metrik
- [ ] Review-Priorität berechnet aus ASIL × ChangeRisk × Impact
- [ ] Werte zwischen 0-100
