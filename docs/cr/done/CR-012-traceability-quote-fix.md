# CR-012: Traceability-Quote >100% korrigieren

**Status:** ✅ Done
**Priorität:** Bug
**Erstellt:** 2026-01-29

## Problem

SCO-002 "Traceability-Quote" zeigt 125% (5/4) an.
Eine Quote >100% ist semantisch falsch und verwirrend.

## Ursache

Cypher in `seed-data.cypher`:
```cypher
MATCH (sw:SoftwareReq)
OPTIONAL MATCH (sys:SystemReq)-[:TRACED_TO]->(sw)
WITH count(DISTINCT sw) AS total, count(DISTINCT sys) AS traced
RETURN traced AS wert, total AS von...
```

Zählt `sys` statt der Verlinkungen. Ein SystemReq kann zu mehreren SoftwareReqs verlinken → sys > sw möglich.

## Lösung

Korrekte Berechnung: "Wie viele SoftwareReqs haben mindestens einen Trace?"

```cypher
MATCH (sw:SoftwareReq)
WITH sw, exists((:SystemReq)-[:TRACED_TO]->(sw)) AS hasTrace
WITH count(sw) AS total, sum(CASE WHEN hasTrace THEN 1 ELSE 0 END) AS traced
RETURN traced AS wert, total AS von,
       CASE WHEN total = 0 THEN 0.0 ELSE toFloat(traced)/total END AS score,
       '%' AS einheit
```

## Änderungen

1. `seed-data.cypher`: SCO-002 cypher_measure korrigieren
2. Neo4j: Regel aktualisieren

## Akzeptanzkriterien

- [x] Traceability-Quote zeigt Wert zwischen 0-100%
- [x] Semantik: "X% der SoftwareReqs haben Trace zu SystemReq"
