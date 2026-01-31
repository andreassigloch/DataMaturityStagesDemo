// =====================================================
// DEMO QUERIES - Copy & Paste für Neo4j Browser
// Projekt: Requirements Traceability Demo
// =====================================================

// -----------------------------------------------------
// STUFE 3: Graph-Visualisierung
// -----------------------------------------------------

// Query 1: Zeige die komplette Requirement-Hierarchie
MATCH path = (stk:StakeholderReq)-[:TRACED_TO*1..3]->(sw:SoftwareReq)
RETURN path

// Query 2: Zeige alle Nodes und Beziehungen
MATCH (n)
OPTIONAL MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT 100

// Query 3: Nur Stakeholder zu System Requirements
MATCH path = (stk:StakeholderReq)-[:TRACED_TO]->(sys:SystemReq)
RETURN path

// Query 4: System zu Software mit Tests
MATCH path = (sys:SystemReq)-[:TRACED_TO]->(sw:SoftwareReq)-[:VERIFIED_BY]->(tc:TestCase)
RETURN path

// -----------------------------------------------------
// STUFE 4: Regel-Validierung
// -----------------------------------------------------

// Query 5: Finde SoftwareReqs OHNE Test (die Lücke!)
MATCH (sw:SoftwareReq)
WHERE NOT (sw)-[:VERIFIED_BY]->(:TestCase)
RETURN sw.id AS id, sw.titel AS titel, sw.status AS status

// Query 6: Zeige alle Regeln
MATCH (r:Regel)
RETURN r.id, r.name, r.typ, r.standard, r.aktiv
ORDER BY r.id

// Query 7: Führe Test-Coverage Regel aus
MATCH (sw:SoftwareReq)
WHERE NOT (sw)-[:VERIFIED_BY]->(:TestCase)
RETURN sw.id AS violation, sw.titel AS beschreibung

// -----------------------------------------------------
// STUFE 5: Impact-Analyse
// -----------------------------------------------------

// Query 8: Zeige externe Abhängigkeiten
MATCH (ext:InputSpec)
RETURN ext.id, ext.titel, ext.quelle, ext.version

// Query 9: Impact-Analyse für EXT-001
MATCH (ext:InputSpec {id: 'EXT-001'})<-[:DEPENDS_ON]-(dependent)
RETURN ext.id AS quelle,
       ext.titel AS quellTitel,
       dependent.id AS betroffenId,
       dependent.titel AS betroffenTitel,
       labels(dependent)[0] AS typ

// Query 10: Komplette Abhängigkeitskette
MATCH path = (ext:InputSpec {id: 'EXT-001'})<-[:DEPENDS_ON*1..2]-(dependent)
RETURN path

// Query 11: Alle DEPENDS_ON Beziehungen
MATCH (a)-[r:DEPENDS_ON]->(b)
RETURN a.id AS von, b.id AS nach, r.grund AS grund, r.kritisch AS kritisch

// -----------------------------------------------------
// STUFE 6: ML & Centrality
// -----------------------------------------------------

// Query 12: PageRank berechnen (benötigt GDS Plugin)
// Zuerst Graph projizieren:
CALL gds.graph.project(
  'requirements',
  ['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase', 'InputSpec'],
  ['TRACED_TO', 'VERIFIED_BY', 'DEPENDS_ON']
)

// Dann PageRank ausführen:
CALL gds.pageRank.stream('requirements')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).id AS id,
       gds.util.asNode(nodeId).titel AS titel,
       score
ORDER BY score DESC
LIMIT 10

// Query 13: Degree Centrality (Anzahl Verbindungen)
MATCH (n)
WHERE n:StakeholderReq OR n:SystemReq OR n:SoftwareReq
OPTIONAL MATCH (n)-[r]-()
RETURN n.id AS id, n.titel AS titel, count(r) AS connections
ORDER BY connections DESC

// Query 14: Ähnliche Requirements finden (Jaccard)
MATCH (sys1:SystemReq {id: 'SYS-003'})-[:TRACED_TO]->(sw1:SoftwareReq)
MATCH (sys2:SystemReq)-[:TRACED_TO]->(sw2:SoftwareReq)
WHERE sys1 <> sys2
WITH sys1, sys2,
     size((sys1)-[:TRACED_TO]->(:SoftwareReq)<-[:TRACED_TO]-(sys2)) AS intersection,
     size((sys1)-[:TRACED_TO]->(:SoftwareReq)) + size((sys2)-[:TRACED_TO]->(:SoftwareReq)) AS union
RETURN sys2.id AS similar_to,
       sys2.titel AS titel,
       toFloat(intersection) / (union - intersection) AS jaccard_similarity
ORDER BY jaccard_similarity DESC

// -----------------------------------------------------
// UTILITY QUERIES
// -----------------------------------------------------

// Alle Nodes zählen
MATCH (n) RETURN labels(n)[0] AS typ, count(n) AS anzahl

// Alle Beziehungen zählen
MATCH ()-[r]->() RETURN type(r) AS typ, count(r) AS anzahl

// Graph löschen (VORSICHT!)
// MATCH (n) DETACH DELETE n

// Seed-Daten neu laden
// :source /var/lib/neo4j/import/seed-data.cypher
