# CR-019: Shared Schema Package

**Status:** ✅ Done
**Priorität:** Architektur
**Erstellt:** 2026-01-30
**Problem:** Zod-Schemas dupliziert zwischen Frontend und Server

---

## Problem

| Datei | Zeilen | Schemas |
|-------|--------|---------|
| `dashboard/src/schemas/index.ts` | 349 | ~30 |
| `dashboard/server/src/schemas/index.ts` | 322 | ~26 |

**56 Schema-Definitionen** mit:
- Duplikaten (gleicher Name, unterschiedliche Implementierung)
- Inkonsistenzen (Frontend hat Felder die Server nicht hat)
- Keine gemeinsame Source of Truth

**Das macht Zod nutzlos** - der Hauptvorteil (Type Safety + Runtime Validation) geht verloren wenn Schemas divergieren.

---

## Analyse: Schema-Divergenz

```diff
# Frontend hat, Server nicht:
< ApiResponseSchema
< CentralityMetricsSchema
< DetectedPatternSchema
< FilterStateSchema
< GraphDataSchema

# Server hat, Frontend nicht:
> ApiErrorSchema
> FeedbackRequestSchema
> FeedbackResponseSchema
> GraphResponseSchema
> LearningPatternSchema
```

**Problem:** API-Contract wird nicht erzwungen weil beide Seiten eigene Schemas haben.

---

## Lösung: Shared Package

### Option A: Workspace Package (empfohlen)

```
DataMaturityStages/
├── packages/
│   └── schemas/              # Shared Zod schemas
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts      # Re-exports
│           ├── graph.ts      # GraphNode, GraphEdge, GraphData
│           ├── rules.ts      # Regel, Wirkung, Ebene, Domain
│           ├── quality.ts    # Validation, Scoring, Optimization
│           ├── learning.ts   # MemoryEvent, Lernquelle, Lernaktion
│           └── api.ts        # Request/Response wrappers
├── dashboard/
│   └── src/
│       └── schemas/
│           └── index.ts      # Re-export from @maturity/schemas + UI-only
├── dashboard/server/
│   └── src/
│       └── schemas/
│           └── index.ts      # Re-export from @maturity/schemas + Server-only
└── neo4j-mcp/
    └── src/
        └── schemas/          # Re-export from @maturity/schemas
```

### package.json (Workspace)

```json
{
  "name": "data-maturity-stages",
  "workspaces": [
    "packages/*",
    "dashboard",
    "dashboard/server",
    "neo4j-mcp"
  ]
}
```

### packages/schemas/package.json

```json
{
  "name": "@maturity/schemas",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

---

## Option B: Barrel Export (einfacher)

Wenn Workspaces zu komplex:

```
dashboard/
├── shared/
│   └── schemas/
│       ├── index.ts          # Alle shared schemas
│       ├── graph.ts
│       ├── rules.ts
│       └── ...
├── src/
│   └── schemas/
│       └── index.ts          # import * from '../../shared/schemas'
└── server/
    └── src/
        └── schemas/
            └── index.ts      # import * from '../../../shared/schemas'
```

**Nachteil:** Relative Imports werden hässlich, aber funktioniert ohne npm workspaces.

---

## Schema-Aufteilung

### 1. Shared (API-Contract)

```typescript
// packages/schemas/src/graph.ts
export const NodeTypeSchema = z.enum([
  'StakeholderReq', 'SystemReq', 'SoftwareReq',
  'TestCase', 'InputSpec', 'Komponente'
])

export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: NodeTypeSchema,
  title: z.string().optional(),
  // ... alle gemeinsamen Felder
})

export const GraphEdgeSchema = z.object({ ... })
export const GraphDataSchema = z.object({ ... })
```

### 2. Frontend-Only (UI State)

```typescript
// dashboard/src/schemas/ui.ts
import { GraphNodeSchema } from '@maturity/schemas'

// Extend for UI-specific needs
export const UINodeSchema = GraphNodeSchema.extend({
  selected: z.boolean().optional(),
  highlighted: z.boolean().optional(),
})

export const FilterStateSchema = z.object({ ... })
export const TabSchema = z.enum(['graph', 'timeline', ...])
```

### 3. Server-Only (Internal)

```typescript
// dashboard/server/src/schemas/internal.ts
import { GraphNodeSchema } from '@maturity/schemas'

// Server-specific transformations
export const Neo4jNodeSchema = z.object({
  // Raw Neo4j format before transformation
})
```

---

## Migration

| Phase | Aufwand | Ergebnis |
|-------|---------|----------|
| 1. Shared Package erstellen | 2h | `packages/schemas/` mit Core-Schemas |
| 2. Frontend migrieren | 1h | Import von `@maturity/schemas` |
| 3. Server migrieren | 1h | Import von `@maturity/schemas` |
| 4. MCP migrieren | 30min | Import von `@maturity/schemas` |
| 5. Cleanup | 30min | Alte Duplikate entfernen |

**Gesamt:** ~5h für saubere Schema-Architektur

---

## Vorteile

1. **Single Source of Truth** - Ein Schema, überall verwendet
2. **Type Safety** - TypeScript-Typen automatisch sync
3. **Runtime Validation** - Zod validiert an allen Grenzen
4. **Refactoring-sicher** - Änderung in einem File, überall wirksam
5. **Testbar** - Schema-Tests nur einmal schreiben

---

## Ergebnis

| Bereich | Vorher | Nachher | Reduktion |
|---------|--------|---------|-----------|
| Frontend | 349 Zeilen | 102 Zeilen | -71% |
| Server | 322 Zeilen | 67 Zeilen | -79% |
| Shared | - | 559 Zeilen | (neue Single Source) |
| Duplikate | ~200 Zeilen | 0 | -100% |

## Akzeptanzkriterien

- [x] `packages/schemas/` existiert mit allen shared Schemas
- [x] Frontend importiert von `@maturity/schemas`
- [x] Server importiert von `@maturity/schemas`
- [x] Keine doppelten Schema-Definitionen mehr
- [x] TypeScript kompiliert ohne Fehler
- [ ] E2E-Tests grün (noch zu prüfen)

---

## Referenzen

- CLAUDE.md: "Schema-First Development"
- Zod Best Practices: https://zod.dev/?id=basic-usage
- npm Workspaces: https://docs.npmjs.com/cli/v10/using-npm/workspaces
