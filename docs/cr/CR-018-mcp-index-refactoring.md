# CR-018: MCP Index Refactoring

**Status:** Open
**Priorität:** Refactoring
**Erstellt:** 2026-01-30
**Problem:** `neo4j-mcp/src/index.ts` hat 701 Zeilen (Limit: 500)

---

## Problem

Eine Datei enthält:
- Neo4j-Verbindungslogik
- 14 MCP-Tool-Registrierungen
- Inline Tool-Handler
- Server-Setup

**Verletzt:** CLAUDE.md 500-Zeilen-Regel

---

## Lösung: Tool-Module

```
neo4j-mcp/src/
├── index.ts              # ~100 Zeilen: Server-Setup + Tool-Import
├── connection.ts         # Neo4j-Verbindung + Health-Check
├── tools/
│   ├── index.ts          # Re-export aller Tools
│   ├── query.ts          # ✅ existiert bereits
│   ├── validate.ts       # ✅ existiert bereits
│   ├── rules.ts          # ✅ existiert bereits
│   ├── centrality.ts     # NEU: centrality_analysis
│   ├── prediction.ts     # NEU: predict_missing_links, find_similar
│   ├── feedback.ts       # NEU: record_feedback
│   └── learning.ts       # NEU: detect_patterns, learning_timeline, memory_stats
└── schemas/
    └── index.ts          # Tool-spezifische Schemas (oder shared)
```

---

## Tool-Gruppierung

| Modul | Tools | Zeilen (ca.) |
|-------|-------|--------------|
| `query.ts` | query | 50 |
| `validate.ts` | validate, compliance_score, scoring, optimize | 150 |
| `rules.ts` | add_rule, toggle_rule | 80 |
| `centrality.ts` | centrality_analysis, impact_analysis | 100 |
| `prediction.ts` | predict_missing_links, find_similar_requirements | 80 |
| `feedback.ts` | record_feedback | 50 |
| `learning.ts` | detect_patterns, learning_timeline, memory_stats | 100 |

**Gesamt:** 7 Module à ~100 Zeilen statt 1 Datei à 700 Zeilen

---

## Implementierung

### 1. Tool-Interface standardisieren

```typescript
// tools/types.ts
import { Driver } from 'neo4j-driver';
import { McpServer } from '@anthropic-ai/sdk';

export interface ToolRegistration {
  register(server: McpServer, driver: Driver): void;
}
```

### 2. Beispiel: centrality.ts

```typescript
// tools/centrality.ts
import { Driver } from 'neo4j-driver';
import { McpServer } from '@anthropic-ai/sdk';
import { getCentralityAnalysis } from './centrality-impl';

export function registerCentralityTools(server: McpServer, driver: Driver) {
  server.tool(
    'centrality_analysis',
    'Berechnet PageRank und Degree für alle Knoten',
    { /* schema */ },
    async (params) => getCentralityAnalysis(driver, params)
  );

  server.tool(
    'impact_analysis',
    'Analysiert Auswirkungen von Änderungen',
    { /* schema */ },
    async (params) => getImpactAnalysis(driver, params)
  );
}
```

### 3. index.ts wird minimal

```typescript
// index.ts (~100 Zeilen)
import { createMcpServer } from './server';
import { connectNeo4j } from './connection';
import { registerAllTools } from './tools';

async function main() {
  const driver = await connectNeo4j();
  const server = createMcpServer();

  registerAllTools(server, driver);

  await server.connect(new StdioServerTransport());
}

main().catch(console.error);
```

---

## Akzeptanzkriterien

- [ ] `index.ts` < 150 Zeilen
- [ ] Jedes Tool-Modul < 200 Zeilen
- [ ] Alle 14 Tools funktionieren weiterhin
- [ ] Keine Breaking Changes für MCP-Clients
- [ ] TypeScript kompiliert ohne Fehler

---

## Referenzen

- CLAUDE.md: "Keep files under 500 lines"
- Bestehende Tools: `tools/query.ts`, `tools/validate.ts`, `tools/rules.ts`
