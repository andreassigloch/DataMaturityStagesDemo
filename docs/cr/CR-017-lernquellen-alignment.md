# CR-017: Lernquellen & Pattern-Labels Alignment

**Status:** ✅ Done
**Priorität:** Refactoring
**Erstellt:** 2026-01-30
**Referenz:** aimprove ADR-001-ddd-architecture.md

---

## Problem

Inkonsistente Benennung von Lernquellen und Event-Typen:

| Ort | Aktuelle Werte | Problem |
|-----|---------------|---------|
| `QuelleSchema` | manuell, pattern, feedback, import | `chat` fehlt |
| `MemoryEventSchema.eventType` | learn, recall, consolidate, forget, connect, strengthen, **chat, feedback, pattern** | Mischt **Aktionen** und **Quellen** |
| `TimelineEvent.type` | feedback_created, pattern_detected, pattern_candidate | Andere Benennung |

**Ziel:** Konsistente Taxonomie nach aimprove ADR-001 Pattern.

---

## Lösung: Getrennte Dimensionen

### 1. Lernquellen (woher kommt die Information?)

```typescript
// Einheitlich für alle Schemas
export const LernquelleSchema = z.enum([
  'manuell',   // ✏️ User erstellt direkt
  'feedback',  // 👍 Aus User-Feedback abgeleitet
  'pattern',   // 🔄 System erkennt Muster (>N gleiche Feedbacks)
  'chat',      // 💬 Aus Chat-Verlauf extrahiert
  'import',    // 📥 Externe Quelle (Standard, PDF)
  'similar',   // 🔗 Ähnlichkeitsanalyse (Embedding-basiert)
])
```

### 2. Event-Aktionen (was ist passiert?)

```typescript
// Timeline-Events: Was passierte im System?
export const LernaktionSchema = z.enum([
  'created',      // Neu erstellt (Regel, Feedback, Pattern)
  'confirmed',    // Pattern bestätigt (Schwellwert erreicht)
  'derived',      // Regel aus Quelle abgeleitet
  'updated',      // Aktualisiert (Confidence, Counter)
  'consolidated', // Patterns zusammengeführt
  'rejected',     // User lehnt Vorschlag ab
])
```

### 3. Pattern-Kategorien (Requirements-Domain)

```typescript
// Was wird erkannt? (aus aimprove ADR-001 adaptiert)
export const PatternKategorieSchema = z.enum([
  'struktur',        // Graph-Struktur (Lücken, Zyklen, Verbindungen)
  'inhalt',          // Textqualität (vage Begriffe, fehlende Einheiten)
  'konsistenz',      // Widersprüche zwischen Elementen
  'vollstaendigkeit', // Fehlende Elemente, Coverage-Lücken
])
```

### 4. Erkennungsmethode (wie wurde erkannt?)

```typescript
// Analog zu aimprove: lexical, semantic, temporal
export const ErkennungsmethodeSchema = z.enum([
  'lexical',   // Regel-basiert (Regex, Keywords)
  'semantic',  // Embedding-basiert (Ähnlichkeitssuche)
  'temporal',  // Sequenz-basiert (wiederholte Feedbacks)
  'composite', // Kombiniert mehrere Methoden
])
```

---

## Schema-Änderungen

### MemoryEventSchema (neu)

```typescript
export const MemoryEventSchema = z.object({
  id: z.string(),

  // WAS passierte?
  aktion: LernaktionSchema,  // created, confirmed, derived, ...

  // WOHER kommt es?
  quelle: LernquelleSchema,  // manuell, feedback, pattern, chat, ...

  // WAS wurde erkannt? (optional)
  kategorie: PatternKategorieSchema.optional(),

  // WIE wurde erkannt? (optional)
  methode: ErkennungsmethodeSchema.optional(),

  // Metadaten
  beschreibung: z.string(),
  timestamp: z.string().datetime({ offset: true }),
  confidence: z.number().min(0).max(1).optional(),

  // Beziehungen
  relatedNodes: z.array(z.string()).optional(),

  // Chat-spezifisch (wenn quelle='chat')
  chatPreview: z.object({
    messageCount: z.number(),
    excerpt: z.string(),
  }).optional(),

  // Abgeleitete Regel (wenn aktion='derived')
  derivedRule: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
})
```

### QuelleSchema (erweitert)

```typescript
// Ersetzt altes QuelleSchema
export const QuelleSchema = LernquelleSchema
// = z.enum(['manuell', 'feedback', 'pattern', 'chat', 'import', 'similar'])
```

---

## Migration

### 1. Altes → Neues Mapping

| Alt (eventType) | Neu (aktion) | Neu (quelle) |
|-----------------|--------------|--------------|
| learn | created | manuell |
| recall | - | (entfällt, war Memory-Aktion) |
| consolidate | consolidated | pattern |
| forget | - | (entfällt) |
| connect | updated | - |
| strengthen | updated | - |
| chat | created | **chat** |
| feedback | created | **feedback** |
| pattern | confirmed | **pattern** |

### 2. TimelineEvent Mapping

| Alt (type) | Neu (aktion) | Neu (quelle) |
|------------|--------------|--------------|
| feedback_created | created | feedback |
| pattern_detected | confirmed | pattern |
| pattern_candidate | created | pattern |

---

## Dateien geändert

| Datei | Änderung | Status |
|-------|----------|--------|
| `dashboard/src/schemas/index.ts` | Neue Schemas hinzugefügt, MemoryEventSchema umgebaut | ✅ |
| `dashboard/server/src/schemas/index.ts` | Sync mit Frontend | ✅ |
| `dashboard/src/components/MemoryTimeline.tsx` | Icons + Labels für neue Quellen | ✅ |
| `neo4j-mcp/src/tools/learning-timeline.ts` | Legacy-Compat via eventType | ⏭️ (Optional) |
| `neo4j-mcp/src/tools/detect-patterns.ts` | Legacy-Compat via eventType | ⏭️ (Optional) |
| `neo4j-mcp/src/tools/rules.ts` | QuelleSchema via Export | ✅ (via Frontend) |
| `seed-data.cypher` | Keine Migration nötig (Legacy-Mapping) | ⏭️ |

---

## UI-Anzeige

| Quelle | Icon | Farbe | Label |
|--------|------|-------|-------|
| manuell | ✏️ | gray | Manuell |
| feedback | 👍 | blue | Feedback |
| pattern | 🔄 | purple | Pattern |
| chat | 💬 | green | Chat |
| import | 📥 | orange | Import |
| similar | 🔗 | cyan | Ähnlichkeit |

| Aktion | Icon | Beschreibung |
|--------|------|--------------|
| created | ➕ | Neu erstellt |
| confirmed | ✅ | Bestätigt |
| derived | 🎯 | Abgeleitet |
| updated | 🔄 | Aktualisiert |
| consolidated | 🔀 | Zusammengeführt |
| rejected | ❌ | Abgelehnt |

---

## Akzeptanzkriterien

- [x] `LernquelleSchema` mit allen 6 Quellen definiert
- [x] `LernaktionSchema` mit allen 6 Aktionen definiert
- [x] `MemoryEventSchema` verwendet beide Dimensionen
- [x] Alle Dateien konsistent aktualisiert (Frontend + Server Schemas)
- [x] UI zeigt korrekte Icons für alle Quellen (MemoryTimeline.tsx)
- [x] Bestehende Seed-Daten funktionieren weiterhin (Legacy-Mapping)
- [ ] Tests für Schema-Validierung (optional, E2E-Tests decken ab)

---

## Referenzen

- aimprove ADR-001: PatternCategorySchema, detectorType
- CR-010: Regel-Schema (wirkung, ebene, domain)
- CR-016: Chat-Quellen im Lernverlauf
