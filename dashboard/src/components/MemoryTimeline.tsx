/**
 * MemoryTimeline Component - Animated Learning Timeline
 * @author andreas@siglochconsulting
 */

import { useEffect, useRef } from 'react'
import { useDashboardStore } from '../stores/dashboardStore'
import type { MemoryEvent } from '../schemas'

// CR-017: Lernquellen-Farben (woher kommt die Information?)
const QUELLE_COLORS: Record<string, string> = {
  manuell: 'var(--color-text-muted)',  // ✏️ Grau
  feedback: '#e67e22',                  // 👍 Orange
  pattern: '#9b59b6',                   // 🔄 Lila
  chat: '#27ae60',                      // 💬 Grün
  import: '#f39c12',                    // 📥 Orange
  similar: '#00bcd4',                   // 🔗 Cyan
}

// CR-017: Lernaktionen-Farben (was ist passiert?)
const AKTION_COLORS: Record<string, string> = {
  created: 'var(--color-success)',      // ➕ Grün
  confirmed: '#27ae60',                 // ✅ Grün
  derived: '#3498db',                   // 🎯 Blau
  updated: 'var(--color-warning)',      // 🔄 Gelb
  consolidated: 'var(--color-secondary)', // 🔀 Grau
  rejected: 'var(--color-error)',       // ❌ Rot
}

// CR-017: Icons für Lernquellen
const QUELLE_ICONS: Record<string, string> = {
  manuell: '✏️',
  feedback: '👍',
  pattern: '🔄',
  chat: '💬',
  import: '📥',
  similar: '🔗',
}

// CR-017: Icons für Lernaktionen
const AKTION_ICONS: Record<string, string> = {
  created: '➕',
  confirmed: '✅',
  derived: '🎯',
  updated: '🔄',
  consolidated: '🔀',
  rejected: '❌',
}

// CR-017: Deutsche Labels für Lernquellen
const QUELLE_LABELS: Record<string, string> = {
  manuell: 'Manuell',
  feedback: 'Feedback',
  pattern: 'Pattern',
  chat: 'Chat',
  import: 'Import',
  similar: 'Ähnlichkeit',
}

// CR-017: Deutsche Labels für Lernaktionen
const AKTION_LABELS: Record<string, string> = {
  created: 'Erstellt',
  confirmed: 'Bestätigt',
  derived: 'Abgeleitet',
  updated: 'Aktualisiert',
  consolidated: 'Zusammengeführt',
  rejected: 'Abgelehnt',
}

// Pattern-Beschreibungen für Info-Popup (aligned with aimprove ADR-001)
const PATTERN_DESCRIPTIONS: Record<string, { title: string; description: string; example: string }> = {
  manuell: {
    title: 'Manuelle Eingabe',
    description: 'User erstellt Regel oder Annotation direkt im System.',
    example: 'User definiert: "Alle Brems-Requirements brauchen ASIL-D"',
  },
  feedback: {
    title: 'User-Feedback',
    description: 'Aus explizitem User-Feedback abgeleitet. System lernt aus Korrekturen und Bestätigungen.',
    example: 'User markiert SYS-003 als "unvollständig" → Feedback gespeichert',
  },
  pattern: {
    title: 'Pattern-Erkennung',
    description: 'System erkennt wiederkehrende Muster und schlägt Regel vor.',
    example: '3× gleiche Korrektur → "Soll ich Regel erstellen?"',
  },
  chat: {
    title: 'Chat-Extraktion',
    description: 'Aus Chat-Verlauf extrahierte Intention. Erkennt implizite Regeln in Konversationen.',
    example: '"Immer ASIL angeben" → Regel VAL-005',
  },
  import: {
    title: 'Externer Import',
    description: 'Regeln aus externen Quellen wie Standards, PDFs oder anderen Systemen importiert.',
    example: 'ISO 26262 Regel aus PDF extrahiert',
  },
  similar: {
    title: 'Ähnlichkeitsanalyse',
    description: 'Embedding-basierte Erkennung ähnlicher Requirements oder Patterns.',
    example: 'SYS-003 ähnlich zu SYS-007 → gleiche Regel anwenden',
  },
}

// Legacy mapping für eventType (backwards compatibility)
const LEGACY_EVENT_COLORS: Record<string, string> = {
  learn: 'var(--color-success)',
  recall: 'var(--color-info)',
  consolidate: 'var(--color-secondary)',
  forget: 'var(--color-error)',
  connect: 'var(--color-primary)',
  strengthen: 'var(--color-warning)',
  chat: '#27ae60',
  feedback: '#e67e22',
  pattern: '#9b59b6',
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const eventTime = new Date(isoString).getTime()
  const diff = now - eventTime

  if (diff < 60000) return 'gerade eben'
  if (diff < 3600000) return `vor ${Math.floor(diff / 60000)} Min`
  if (diff < 86400000) return `vor ${Math.floor(diff / 3600000)} Std`
  return `vor ${Math.floor(diff / 86400000)} Tagen`
}

interface TimelineEventProps {
  event: MemoryEvent
  isNew: boolean
}

// CR-017: Helper to get color/icon/label from new or legacy fields
function getEventDisplay(event: MemoryEvent) {
  // Prefer new CR-017 fields, fall back to legacy eventType
  if (event.quelle && event.aktion) {
    return {
      color: QUELLE_COLORS[event.quelle] || AKTION_COLORS[event.aktion] || 'var(--color-text-muted)',
      icon: QUELLE_ICONS[event.quelle] || AKTION_ICONS[event.aktion] || '•',
      label: `${AKTION_LABELS[event.aktion] || event.aktion} (${QUELLE_LABELS[event.quelle] || event.quelle})`,
      quelle: event.quelle,
      aktion: event.aktion,
    }
  }
  // Legacy eventType fallback
  const eventType = event.eventType || 'learn'
  return {
    color: LEGACY_EVENT_COLORS[eventType] || 'var(--color-text-muted)',
    icon: QUELLE_ICONS[eventType] || AKTION_ICONS[eventType] || '•',
    label: QUELLE_LABELS[eventType] || AKTION_LABELS[eventType] || eventType,
    quelle: eventType,
    aktion: eventType,
  }
}

function TimelineEvent({ event, isNew }: TimelineEventProps) {
  const eventRef = useRef<HTMLDivElement>(null)
  const display = getEventDisplay(event)

  useEffect(() => {
    if (isNew && eventRef.current) {
      eventRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isNew])

  return (
    <div
      ref={eventRef}
      className={`timeline-event relative flex gap-3 pb-4 ${
        isNew ? 'animate-slide-in' : ''
      }`}
      data-testid={`timeline-event-${event.id}`}
    >
      {/* Timeline line */}
      <div className="absolute left-4 top-8 h-full w-px bg-[var(--color-border)]" />

      {/* Event icon */}
      <div
        className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{
          backgroundColor: display.color,
          color: 'var(--color-background)',
        }}
        data-testid={`event-icon-${display.quelle}`}
      >
        {display.icon}
      </div>

      {/* Event content */}
      <div className="flex-1 rounded-lg bg-[var(--color-surface-elevated)] p-3">
        <div className="mb-1 flex items-center justify-between">
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: display.color }}
            data-testid="event-type"
          >
            {display.label}
          </span>
          <span
            className="text-xs text-[var(--color-text-muted)]"
            title={formatTimestamp(event.timestamp)}
            data-testid="event-timestamp"
          >
            {formatRelativeTime(event.timestamp)}
          </span>
        </div>

        <p
          className="text-sm text-[var(--color-text-secondary)]"
          data-testid="event-description"
        >
          {event.beschreibung || event.description}
        </p>

        {/* CR-016: Chat preview section */}
        {event.chatPreview && (
          <div
            className="mt-2 rounded border-l-2 bg-[var(--color-surface)] p-2"
            style={{ borderColor: QUELLE_COLORS.chat }}
            data-testid="chat-preview"
          >
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span>{event.chatPreview.messageCount} Nachrichten</span>
            </div>
            <p className="mt-1 text-xs italic text-[var(--color-text-secondary)]">
              "{event.chatPreview.excerpt}"
            </p>
          </div>
        )}

        {/* CR-016: Derived rule link */}
        {event.derivedRule && (
          <div
            className="mt-2 inline-flex items-center gap-1 rounded bg-[var(--color-success)]/10 px-2 py-1"
            data-testid="derived-rule"
          >
            <span className="text-xs text-[var(--color-success)]">→</span>
            <span className="text-xs font-medium text-[var(--color-success)]">
              {event.derivedRule.id}: {event.derivedRule.name}
            </span>
          </div>
        )}

        {event.relatedNodes && event.relatedNodes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1" data-testid="related-nodes">
            {event.relatedNodes.map((nodeId) => (
              <span
                key={nodeId}
                className="rounded bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
              >
                {nodeId}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function MemoryTimeline() {
  const memoryEvents = useDashboardStore((s) => s.memoryEvents)
  const selectedLegendItem = useDashboardStore((s) => s.selectedLegendItem)
  const setSelectedLegendItem = useDashboardStore((s) => s.setSelectedLegendItem)

  const containerRef = useRef<HTMLDivElement>(null)
  const lastEventIdRef = useRef<string | null>(null)

  // Determine which events are "new" for animation
  const sortedEvents = [...memoryEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const newestEventId = sortedEvents[0]?.id || null

  // Track newest event for animation
  useEffect(() => {
    if (newestEventId !== lastEventIdRef.current) {
      lastEventIdRef.current = newestEventId
    }
  }, [newestEventId])

  return (
    <div className="flex h-full flex-col" data-testid="memory-timeline">
      {/* Header */}
      <div
        className="flex items-center justify-end border-b border-[var(--color-border)] px-4 py-3"
        data-testid="timeline-header"
      >
        <div
          className="text-sm text-[var(--color-text-muted)]"
          data-testid="event-count"
        >
          {memoryEvents.length} Einträge
        </div>
      </div>

      {/* CR-017: Lernquellen-Legende (klickbar für Info) */}
      <div
        className="relative flex flex-wrap gap-3 border-b border-[var(--color-border)] px-4 py-2"
        data-testid="timeline-legend"
      >
        {Object.entries(QUELLE_COLORS).map(([quelle, color]) => (
          <button
            key={quelle}
            onClick={() => setSelectedLegendItem(selectedLegendItem === quelle ? null : quelle)}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-[var(--color-surface-elevated)] ${
              selectedLegendItem === quelle ? 'bg-[var(--color-surface-elevated)] ring-1 ring-[var(--color-primary)]' : ''
            }`}
            data-testid={`legend-${quelle}`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-[var(--color-text-muted)]">
              {QUELLE_ICONS[quelle]} {QUELLE_LABELS[quelle] || quelle}
            </span>
          </button>
        ))}
      </div>

      {/* Pattern Info Popup */}
      {selectedLegendItem && PATTERN_DESCRIPTIONS[selectedLegendItem] && (
        <div
          className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3"
          data-testid="pattern-info-popup"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-xs"
                  style={{ backgroundColor: QUELLE_COLORS[selectedLegendItem] }}
                >
                  {QUELLE_ICONS[selectedLegendItem]}
                </span>
                {PATTERN_DESCRIPTIONS[selectedLegendItem].title}
              </h4>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {PATTERN_DESCRIPTIONS[selectedLegendItem].description}
              </p>
              <div className="mt-2 rounded bg-[var(--color-surface)] p-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Beispiel
                </span>
                <p className="mt-0.5 text-xs italic text-[var(--color-text-secondary)]">
                  {PATTERN_DESCRIPTIONS[selectedLegendItem].example}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedLegendItem(null)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Timeline content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4"
        data-testid="timeline-content"
      >
        {sortedEvents.length === 0 ? (
          <div
            className="flex h-full items-center justify-center"
            data-testid="timeline-empty"
          >
            <p className="text-sm text-[var(--color-text-muted)]">
              Noch keine Lernschritte. Erkenntnisse werden hier angezeigt.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {sortedEvents.map((event) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isNew={event.id === newestEventId}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
