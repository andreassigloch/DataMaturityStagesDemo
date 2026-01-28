# Neo4j MCP Server - Requirements Traceability

MCP Server für Requirements Traceability mit Neo4j. Stellt 6 Tools für Claude Desktop bereit.

## Installation

```bash
cd demo-requirements-traceability/neo4j-mcp
npm install
npm run build
```

## Tools

| Tool | Beschreibung |
|------|--------------|
| `query` | Read-Only Cypher-Queries für Traversierungen, Aggregationen, Suchen |
| `impact_analysis` | Downstream Impact Analysis bei Requirement-Änderungen |
| `validate` | Prüft alle aktiven Regeln, zeigt Verstöße |
| `add_rule` | Neue Validierungsregel hinzufügen |
| `toggle_rule` | Regel aktivieren/deaktivieren |
| `compliance_score` | Compliance-Score pro Standard berechnen |

## Claude Desktop Konfiguration

Füge folgenden Eintrag zu `~/Library/Application Support/Claude/claude_desktop_config.json` hinzu:

```json
{
  "mcpServers": {
    "neo4j-requirements": {
      "command": "node",
      "args": ["/Users/andreas/Documents/Projekte/prod/websites/sicon/demo-requirements-traceability/neo4j-mcp/dist/index.js"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7697",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "demo-password"
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `NEO4J_URI` | `bolt://localhost:7697` | Neo4j Bolt URI |
| `NEO4J_USER` | `neo4j` | Neo4j Username |
| `NEO4J_PASSWORD` | `demo-password` | Neo4j Password |

## Beispiel-Queries

### Impact Analysis
```
Analysiere was passiert wenn sich REQ-SYS-001 ändert
```

### Validation
```
Prüfe alle Validierungsregeln und zeige Verstöße
```

### Compliance Score
```
Berechne den Compliance-Score für alle Standards
```

### Cypher Query
```
Zeige alle Anforderungen ohne Tests:
MATCH (a:Anforderung) WHERE NOT (a)-[:GETESTET_VON]->() RETURN a
```

## Datenmodell (erwartet)

```
(:Anforderung {id, name, typ, standard})
(:Test {id, name})
(:Komponente {id, name})
(:Regel {id, name, typ, cypher, schwere, standard, aktiv})

(a:Anforderung)-[:VERFEINERT]->(a2:Anforderung)
(a:Anforderung)-[:ERFUELLT_VON]->(k:Komponente)
(a:Anforderung)-[:GETESTET_VON]->(t:Test)
```
