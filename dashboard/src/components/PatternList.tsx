/**
 * PatternList Component - Detected Patterns Display
 * @author andreas@siglochconsulting
 */

import { useDashboardStore } from '../stores/dashboardStore'
import type { DetectedPattern } from '../schemas'

const PATTERN_TYPE_COLORS: Record<DetectedPattern['patternType'], string> = {
  cluster: 'var(--color-primary)',
  hierarchy: 'var(--color-secondary)',
  bridge: 'var(--color-warning)',
  hub: 'var(--color-success)',
  cycle: 'var(--color-error)',
  chain: 'var(--color-info)',
}

const PATTERN_TYPE_ICONS: Record<DetectedPattern['patternType'], string> = {
  cluster: 'C',
  hierarchy: 'H',
  bridge: 'B',
  hub: '*',
  cycle: 'O',
  chain: '-',
}

const PATTERN_DESCRIPTIONS: Record<DetectedPattern['patternType'], string> = {
  cluster: 'Tightly connected group of nodes',
  hierarchy: 'Tree-like structure with clear parent-child relationships',
  bridge: 'Nodes connecting otherwise separate communities',
  hub: 'High-degree nodes with many connections',
  cycle: 'Circular dependency pattern',
  chain: 'Linear sequence of connected nodes',
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100)
  let colorClass = 'text-[var(--color-success)]'

  if (percentage < 50) {
    colorClass = 'text-[var(--color-error)]'
  } else if (percentage < 75) {
    colorClass = 'text-[var(--color-warning)]'
  }

  return (
    <span
      className={`text-xs font-medium ${colorClass}`}
      data-testid="confidence-badge"
    >
      {percentage}%
    </span>
  )
}

interface PatternCardProps {
  pattern: DetectedPattern
  isSelected: boolean
  onSelect: () => void
}

function PatternCard({ pattern, isSelected, onSelect }: PatternCardProps) {
  const color = PATTERN_TYPE_COLORS[pattern.patternType]
  const icon = PATTERN_TYPE_ICONS[pattern.patternType]

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
        isSelected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-transparent bg-[var(--color-surface-elevated)] hover:border-[var(--color-border)]'
      }`}
      data-testid={`pattern-card-${pattern.id}`}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold"
            style={{ backgroundColor: color, color: 'var(--color-background)' }}
            data-testid="pattern-icon"
          >
            {icon}
          </div>
          <div>
            <h3
              className="text-sm font-medium text-[var(--color-text-primary)]"
              data-testid="pattern-name"
            >
              {pattern.name}
            </h3>
            <span
              className="text-xs capitalize text-[var(--color-text-muted)]"
              data-testid="pattern-type"
            >
              {pattern.patternType}
            </span>
          </div>
        </div>
        <ConfidenceBadge confidence={pattern.confidence} />
      </div>

      {/* Description */}
      <p
        className="mb-3 text-xs text-[var(--color-text-secondary)]"
        data-testid="pattern-description"
      >
        {pattern.description}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1" data-testid="pattern-nodes">
          <svg
            className="h-3 w-3 text-[var(--color-text-muted)]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span className="text-[var(--color-text-muted)]">
            {pattern.nodeIds.length} nodes
          </span>
        </div>
        <span
          className="text-[var(--color-text-muted)]"
          data-testid="pattern-timestamp"
        >
          {formatTimestamp(pattern.detectedAt)}
        </span>
      </div>

      {/* Node IDs (collapsed by default) */}
      {isSelected && pattern.nodeIds.length > 0 && (
        <div
          className="mt-3 border-t border-[var(--color-border)] pt-3"
          data-testid="pattern-node-list"
        >
          <div className="text-xs text-[var(--color-text-muted)]">
            Involved nodes:
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {pattern.nodeIds.slice(0, 10).map((nodeId) => (
              <span
                key={nodeId}
                className="rounded bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
              >
                {nodeId}
              </span>
            ))}
            {pattern.nodeIds.length > 10 && (
              <span className="rounded bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                +{pattern.nodeIds.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function PatternList() {
  const detectedPatterns = useDashboardStore((s) => s.detectedPatterns)
  const selectedPatternId = useDashboardStore((s) => s.selectedPatternId)
  const selectPattern = useDashboardStore((s) => s.selectPattern)

  // Group patterns by type
  const patternsByType = detectedPatterns.reduce(
    (acc, pattern) => {
      if (!acc[pattern.patternType]) {
        acc[pattern.patternType] = []
      }
      acc[pattern.patternType].push(pattern)
      return acc
    },
    {} as Record<DetectedPattern['patternType'], DetectedPattern[]>
  )

  // Calculate stats
  const stats = {
    total: detectedPatterns.length,
    avgConfidence:
      detectedPatterns.length > 0
        ? detectedPatterns.reduce((sum, p) => sum + p.confidence, 0) /
          detectedPatterns.length
        : 0,
    byType: Object.entries(patternsByType).map(([type, patterns]) => ({
      type: type as DetectedPattern['patternType'],
      count: patterns.length,
    })),
  }

  return (
    <div className="flex h-full flex-col" data-testid="pattern-list">
      {/* Stats header */}
      <div
        className="border-b border-[var(--color-border)] px-4 py-3"
        data-testid="pattern-stats"
      >
        <div className="mb-3 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
            <div className="text-xs text-[var(--color-text-muted)]">
              Total Patterns
            </div>
            <div
              className="text-2xl font-bold text-[var(--color-text-primary)]"
              data-testid="total-patterns"
            >
              {stats.total}
            </div>
          </div>
          <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
            <div className="text-xs text-[var(--color-text-muted)]">
              Avg Confidence
            </div>
            <div
              className="text-2xl font-bold text-[var(--color-success)]"
              data-testid="avg-confidence"
            >
              {Math.round(stats.avgConfidence * 100)}%
            </div>
          </div>
        </div>

        {/* Pattern type breakdown */}
        <div className="flex flex-wrap gap-2" data-testid="pattern-type-breakdown">
          {stats.byType.map(({ type, count }) => (
            <div
              key={type}
              className="flex items-center gap-1 rounded-full px-2 py-1"
              style={{ backgroundColor: `${PATTERN_TYPE_COLORS[type]}20` }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: PATTERN_TYPE_COLORS[type] }}
              />
              <span className="text-xs capitalize text-[var(--color-text-secondary)]">
                {type}
              </span>
              <span
                className="text-xs font-medium text-[var(--color-text-primary)]"
                data-testid={`type-count-${type}`}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern type legend */}
      <div
        className="border-b border-[var(--color-border)] px-4 py-2"
        data-testid="pattern-legend"
      >
        <div className="text-xs text-[var(--color-text-muted)]">
          Pattern Types:
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
          {Object.entries(PATTERN_DESCRIPTIONS).map(([type, description]) => (
            <div
              key={type}
              className="flex items-start gap-1"
              title={description}
            >
              <span
                className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    PATTERN_TYPE_COLORS[type as DetectedPattern['patternType']],
                }}
              />
              <span className="capitalize text-[var(--color-text-muted)]">
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern list */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="pattern-content">
        {detectedPatterns.length === 0 ? (
          <div
            className="flex h-full items-center justify-center"
            data-testid="pattern-empty"
          >
            <div className="text-center">
              <svg
                className="mx-auto mb-2 h-12 w-12 text-[var(--color-text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <p className="text-sm text-[var(--color-text-muted)]">
                No patterns detected yet.
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Patterns will appear as the system learns.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {detectedPatterns.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                isSelected={selectedPatternId === pattern.id}
                onSelect={() =>
                  selectPattern(
                    selectedPatternId === pattern.id ? null : pattern.id
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
