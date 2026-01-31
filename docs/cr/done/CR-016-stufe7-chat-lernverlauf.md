# CR-016: Stufe 7 - Chat-Sequenzen im Lernverlauf

**Status:** ✅ Done
**Priorität:** Feature
**Erstellt:** 2026-01-29

## Anforderung

Lernverlauf soll zeigen, wie Regeln aus Chat-Interaktionen entstehen.
Beispiel wie in Graphengine: Chat → Feedback → Pattern → Regel.

## Lernquellen (erweitert)

| Quelle | Icon | Beschreibung | Beispiel |
|--------|------|--------------|----------|
| `manuell` | ✏️ | User erstellt Regel direkt | "Keine vagen Zeitangaben" |
| `feedback` | 👍 | User-Feedback zu Requirement | "SYS-003 ist unklar" |
| `pattern` | 🔄 | System erkennt Muster | 3× gleiches Feedback |
| `chat` | 💬 | Aus Chat-Verlauf extrahiert | "Immer ASIL angeben" |
| `import` | 📥 | Externe Quelle | Standard-PDF |

## Mock-Chat-Sequenz (Beispiel)

```json
{
  "id": "CHAT-001",
  "timestamp": "2026-01-28T14:30:00Z",
  "messages": [
    { "role": "user", "content": "Was fehlt bei SYS-003?" },
    { "role": "assistant", "content": "SYS-003 hat keine ASIL-Klassifizierung." },
    { "role": "user", "content": "Stimmt, das sollte immer angegeben werden." },
    { "role": "assistant", "content": "Soll ich eine Regel erstellen: 'Alle SystemReqs brauchen ASIL'?" },
    { "role": "user", "content": "Ja, mach das." }
  ],
  "derived_rule": {
    "id": "VAL-006",
    "name": "ASIL-Pflicht",
    "beschreibung": "Alle SystemReqs müssen ASIL-Klassifizierung haben",
    "quelle": "chat"
  }
}
```

## Datenmodell

```cypher
// Chat-Session
CREATE (c:ChatSession {
  id: 'CHAT-001',
  timestamp: datetime('2026-01-28T14:30:00Z'),
  messages: '...' // JSON-String
})

// Beziehung zur abgeleiteten Regel
CREATE (c)-[:DERIVED]->(r:Regel {id: 'VAL-006'})
```

## API: `/api/learning-history`

Erweiterte Response mit Chat-Quellen:

```typescript
interface LearningEntry {
  id: string;
  timestamp: string;
  quelle: 'manuell' | 'feedback' | 'pattern' | 'chat' | 'import';
  beschreibung: string;

  // Nur bei quelle='chat':
  chatPreview?: {
    messageCount: number;
    excerpt: string; // Letzte User-Aussage
  };

  // Abgeleitete Regel (falls vorhanden)
  derivedRule?: {
    id: string;
    name: string;
  };
}
```

## Frontend: LearningPanel

Erweiterungen:
1. **Quellen-Filter**: Alle | Feedback | Chat | Pattern | Manuell
2. **Chat-Vorschau**: Bei Hover über Chat-Einträge Auszug zeigen
3. **Regel-Link**: Bei abgeleiteten Regeln Link zum Regeln-Tab

```tsx
// Chat-Eintrag mit Vorschau
<div className="learning-entry chat">
  <span className="icon">💬</span>
  <span className="source">Chat</span>
  <span className="description">ASIL-Pflicht aus Diskussion</span>
  <Tooltip content="'Stimmt, das sollte immer angegeben werden.'">
    <span className="preview">3 Nachrichten</span>
  </Tooltip>
  <Link to="/rules/VAL-006">→ VAL-006</Link>
</div>
```

## Seed-Daten

Ein vollständiges Chat-Beispiel in `seed-data.cypher`:

```cypher
CREATE (chat:ChatSession {
  id: 'CHAT-001',
  timestamp: datetime('2026-01-28T14:30:00Z'),
  topic: 'ASIL-Klassifizierung',
  messageCount: 5,
  excerpt: 'Stimmt, das sollte immer angegeben werden.'
})

CREATE (chat)-[:DERIVED]->(:Regel {
  id: 'VAL-006',
  name: 'ASIL-Pflicht',
  beschreibung: 'Alle SystemReqs müssen ASIL-Klassifizierung haben',
  wirkung: 'Validierung',
  quelle: 'chat',
  aktiv: true
})
```

## Akzeptanzkriterien

- [ ] Mind. 1 Chat-Sequenz in Seed-Daten
- [ ] Lernverlauf zeigt Chat-Einträge mit 💬 Icon
- [ ] Chat-Vorschau bei Hover
- [ ] Abgeleitete Regel verlinkt
- [ ] Filter nach Quellen-Typ funktioniert
