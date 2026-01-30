/**
 * CentralityPanel Component - Three Importance Metrics (CR-014)
 * Impact Score | Change Risk | Review Priority
 * @author andreas@siglochconsulting
 */

import { useMemo } from 'react'
import { useDashboardStore } from '../stores/dashboardStore'
import type { CentralityMetrics, NodeType } from '../schemas'

// Node type colors matching backend schema (6 types, WCAG AA compliant)
const TYPE_COLORS: Record<NodeType, string> = {
  StakeholderReq: '#4A90D9',
  SystemReq: '#7CB342',
  SoftwareReq: '#FF9800',
  TestCase: '#BA68C8',   // WCAG AA
  InputSpec: '#a1887f',  // WCAG AA
  Komponente: '#78909c', // Gray-blue (WCAG AA)
}

// CR-014: Color coding for metric values (0-100)
function getMetricColor(value: number): string {
  if (value < 30) return 'var(--color-success)'    // green
  if (value < 70) return 'var(--color-warning)'    // yellow
  return 'var(--color-error)'                       // red
}


interface SortButtonProps {
  field: keyof CentralityMetrics
  label: string
  currentSort: keyof CentralityMetrics
  direction: 'asc' | 'desc'
  onClick: () => void
}

function SortButton({
  field,
  label,
  currentSort,
  direction,
  onClick,
}: SortButtonProps) {
  const isActive = currentSort === field

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
        isActive
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
      }`}
      data-testid={`sort-button-${field}`}
    >
      {label}
      {isActive && (
        <svg
          className={`h-3 w-3 transition-transform ${
            direction === 'asc' ? 'rotate-180' : ''
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      )}
    </button>
  )
}

interface NodeRowProps {
  node: CentralityMetrics
  onSelect: (nodeId: string) => void
  isSelected: boolean
}

// CR-014: Metric badge with color coding
function MetricBadge({ value, label }: { value: number; label: string }) {
  return (
    <span
      className="inline-flex min-w-[40px] items-center justify-center rounded px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: getMetricColor(value),
        color: value < 70 ? 'var(--color-text-primary)' : 'white',
      }}
      data-testid={`metric-${label}`}
      title={`${label}: ${value}%`}
    >
      {value}
    </span>
  )
}

function NodeRow({ node, onSelect, isSelected }: NodeRowProps) {
  return (
    <tr
      onClick={() => onSelect(node.nodeId)}
      className={`cursor-pointer transition-colors hover:bg-[var(--color-surface-elevated)] ${
        isSelected ? 'bg-[var(--color-primary)]/10' : ''
      }`}
      data-testid={`centrality-row-${node.nodeId}`}
    >
      <td className="px-3 py-2" style={{ minWidth: '200px' }}>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: TYPE_COLORS[node.type] }}
          />
          <span
            className="truncate text-sm text-[var(--color-text-primary)]"
            title={node.label}
          >
            {node.label}
          </span>
        </div>
      </td>
      <td className="px-1 py-2 text-center">
        <span className={`inline-block min-w-[28px] rounded px-1.5 py-0.5 text-xs font-medium ${
          node.asil === 'D' ? 'bg-[var(--color-error)] text-white' :
          node.asil === 'C' ? 'bg-[var(--color-warning)] text-[var(--color-text-primary)]' :
          node.asil === 'B' ? 'bg-[var(--color-info)]/30 text-[var(--color-info)]' :
          node.asil === 'A' ? 'bg-[var(--color-success)]/30 text-[var(--color-success)]' :
          'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]'
        }`}>
          {node.asil || 'QM'}
        </span>
      </td>
      <td className="px-1 py-2 text-center">
        <span className="text-xs text-[var(--color-text-muted)]">{node.degree}</span>
      </td>
      <td className="px-1 py-2 text-center">
        <MetricBadge value={node.impactScore} label="impact" />
      </td>
      <td className="px-1 py-2 text-center">
        <MetricBadge value={node.changeRisk} label="change-risk" />
      </td>
      <td className="px-1 py-2 text-center">
        <MetricBadge value={node.reviewPriority} label="review-priority" />
      </td>
    </tr>
  )
}

export function CentralityPanel() {
  const centralityMetrics = useDashboardStore((s) => s.centralityMetrics)
  const sortBy = useDashboardStore((s) => s.sortBy)
  const sortDirection = useDashboardStore((s) => s.sortDirection)
  const setSortBy = useDashboardStore((s) => s.setSortBy)
  const toggleSortDirection = useDashboardStore((s) => s.toggleSortDirection)
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId)
  const selectNode = useDashboardStore((s) => s.selectNode)
  const highlightNodes = useDashboardStore((s) => s.highlightNodes)

  // Memoize sorted metrics to prevent infinite loop
  const sortedMetrics = useMemo(() => {
    return [...centralityMetrics].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return 0
    })
  }, [centralityMetrics, sortBy, sortDirection])

  // CR-014: Calculate statistics for three metrics
  const stats = useMemo(() => {
    if (sortedMetrics.length === 0) {
      return { avgImpact: 0, avgChangeRisk: 0, avgReviewPriority: 0 }
    }
    const sum = sortedMetrics.reduce(
      (acc, m) => ({
        impact: acc.impact + m.impactScore,
        changeRisk: acc.changeRisk + m.changeRisk,
        reviewPriority: acc.reviewPriority + m.reviewPriority,
      }),
      { impact: 0, changeRisk: 0, reviewPriority: 0 }
    )
    const count = sortedMetrics.length
    return {
      avgImpact: Math.round(sum.impact / count),
      avgChangeRisk: Math.round(sum.changeRisk / count),
      avgReviewPriority: Math.round(sum.reviewPriority / count),
    }
  }, [sortedMetrics])

  const handleSort = (field: keyof CentralityMetrics) => {
    if (sortBy === field) {
      toggleSortDirection()
    } else {
      setSortBy(field)
    }
  }

  const handleSelectNode = (nodeId: string) => {
    selectNode(nodeId)
    highlightNodes([nodeId])
  }

  return (
    <div className="flex h-full flex-col" data-testid="centrality-panel">
      {/* Header with Title */}
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Stufe 5: Kennzahlen
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Impact, Change-Risk und Review-Priorität basierend auf ASIL
        </p>
      </div>

      {/* Header stats (CR-014: drei Wichtungen) */}
      <div
        className="grid grid-cols-3 gap-3 border-b border-[var(--color-border)] px-4 py-3"
        data-testid="centrality-stats"
      >
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">
            Ø Impact
          </div>
          <div
            className="text-lg font-semibold"
            style={{ color: getMetricColor(stats.avgImpact) }}
            data-testid="avg-impact"
          >
            {stats.avgImpact}%
          </div>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">
            Ø Change-Risk
          </div>
          <div
            className="text-lg font-semibold"
            style={{ color: getMetricColor(stats.avgChangeRisk) }}
            data-testid="avg-change-risk"
          >
            {stats.avgChangeRisk}%
          </div>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">
            Ø Review-Prio
          </div>
          <div
            className="text-lg font-semibold"
            style={{ color: getMetricColor(stats.avgReviewPriority) }}
            data-testid="avg-review-priority"
          >
            {stats.avgReviewPriority}%
          </div>
        </div>
      </div>

      {/* Sort controls (CR-014: drei Metriken) */}
      <div
        className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-4 py-2"
        data-testid="sort-controls"
      >
        <span className="text-xs text-[var(--color-text-muted)]">Sortieren:</span>
        <SortButton
          field="reviewPriority"
          label="Review-Prio"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={() => handleSort('reviewPriority')}
        />
        <SortButton
          field="impactScore"
          label="Impact"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={() => handleSort('impactScore')}
        />
        <SortButton
          field="changeRisk"
          label="Change-Risk"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={() => handleSort('changeRisk')}
        />
        <SortButton
          field="label"
          label="Name"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={() => handleSort('label')}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto" data-testid="centrality-table">
        {sortedMetrics.length === 0 ? (
          <div
            className="flex h-full items-center justify-center"
            data-testid="centrality-empty"
          >
            <p className="text-sm text-[var(--color-text-muted)]">
              Keine Daten vorhanden. Bitte Graph-Daten laden.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-[var(--color-surface)]">
              <tr className="text-left text-xs text-[var(--color-text-muted)]">
                <th className="px-3 py-2 font-medium" style={{ minWidth: '200px' }}>Element</th>
                <th className="px-1 py-2 text-center font-medium">ASIL</th>
                <th className="px-1 py-2 text-center font-medium">Edges</th>
                <th className="px-1 py-2 text-center font-medium">Impact</th>
                <th className="px-1 py-2 text-center font-medium">Change</th>
                <th className="px-1 py-2 text-center font-medium">Review</th>
              </tr>
            </thead>
            <tbody>
              {sortedMetrics.map((node) => (
                <NodeRow
                  key={node.nodeId}
                  node={node}
                  onSelect={handleSelectNode}
                  isSelected={selectedNodeId === node.nodeId}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
