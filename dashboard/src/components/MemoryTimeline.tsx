/**
 * MemoryTimeline Component - Animated Learning Timeline
 * @author andreas@siglochconsulting
 */

import { useEffect, useRef } from 'react'
import { useDashboardStore } from '../stores/dashboardStore'
import type { MemoryEvent } from '../schemas'

const EVENT_COLORS: Record<MemoryEvent['eventType'], string> = {
  learn: 'var(--color-success)',
  recall: 'var(--color-info)',
  consolidate: 'var(--color-secondary)',
  forget: 'var(--color-error)',
  connect: 'var(--color-primary)',
  strengthen: 'var(--color-warning)',
}

const EVENT_ICONS: Record<MemoryEvent['eventType'], string> = {
  learn: '+',
  recall: '~',
  consolidate: '*',
  forget: '-',
  connect: '#',
  strengthen: '^',
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

function TimelineEvent({ event, isNew }: TimelineEventProps) {
  const eventRef = useRef<HTMLDivElement>(null)

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
          backgroundColor: EVENT_COLORS[event.eventType],
          color: 'var(--color-background)',
        }}
        data-testid={`event-icon-${event.eventType}`}
      >
        {EVENT_ICONS[event.eventType]}
      </div>

      {/* Event content */}
      <div className="flex-1 rounded-lg bg-[var(--color-surface-elevated)] p-3">
        <div className="mb-1 flex items-center justify-between">
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: EVENT_COLORS[event.eventType] }}
            data-testid="event-type"
          >
            {event.eventType}
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
          {event.description}
        </p>

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

      {/* Event type legend */}
      <div
        className="flex flex-wrap gap-3 border-b border-[var(--color-border)] px-4 py-2"
        data-testid="timeline-legend"
      >
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div
            key={type}
            className="flex items-center gap-1"
            data-testid={`legend-${type}`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs capitalize text-[var(--color-text-muted)]">
              {type}
            </span>
          </div>
        ))}
      </div>

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
