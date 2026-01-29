/**
 * CentralityPanel Component - PageRank/Betweenness Statistics
 * @author andreas@siglochconsulting
 */

import { useMemo } from 'react'
import { useDashboardStore } from '../stores/dashboardStore'
import type { CentralityMetrics, NodeType } from '../schemas'

// Node type colors matching backend schema (7 types, WCAG AA compliant)
const TYPE_COLORS: Record<NodeType, string> = {
  StakeholderReq: '#4A90D9',
  SystemReq: '#7CB342',
  SoftwareReq: '#FF9800',
  TestCase: '#BA68C8',   // WCAG AA
  InputSpec: '#a1887f',  // WCAG AA
  Komponente: '#78909c', // Gray-blue (WCAG AA)
  Feedback: '#F472B6',   // Pink (WCAG AA)
}

interface MetricBarProps {
  value: number
  max: number
  color: string
  label: string
}

function MetricBar({ value, max, color, label }: MetricBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0

  return (
    <div className="group relative">
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-elevated)]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
          data-testid={`metric-bar-${label}`}
        />
      </div>
      <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text-primary)] shadow-lg group-hover:block">
        {value.toFixed(4)}
      </span>
    </div>
  )
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
  maxValues: {
    pageRank: number
    betweenness: number
    degree: number
  }
  onSelect: (nodeId: string) => void
  isSelected: boolean
}

function NodeRow({ node, maxValues, onSelect, isSelected }: NodeRowProps) {
  return (
    <tr
      onClick={() => onSelect(node.nodeId)}
      className={`cursor-pointer transition-colors hover:bg-[var(--color-surface-elevated)] ${
        isSelected ? 'bg-[var(--color-primary)]/10' : ''
      }`}
      data-testid={`centrality-row-${node.nodeId}`}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: TYPE_COLORS[node.type] }}
          />
          <span
            className="max-w-[150px] truncate text-sm text-[var(--color-text-primary)]"
            title={node.label}
          >
            {node.label}
          </span>
        </div>
      </td>
      <td className="px-3 py-2">
        <span
          className="inline-block rounded bg-[var(--color-surface-elevated)] px-2 py-0.5 text-xs capitalize text-[var(--color-text-muted)]"
          data-testid="node-type"
        >
          {node.type}
        </span>
      </td>
      <td className="w-32 px-3 py-2">
        <MetricBar
          value={node.pageRank}
          max={maxValues.pageRank}
          color="var(--color-primary)"
          label="pagerank"
        />
      </td>
      <td className="w-32 px-3 py-2">
        <MetricBar
          value={node.betweenness}
          max={maxValues.betweenness}
          color="var(--color-secondary)"
          label="betweenness"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <span
          className="text-sm font-medium text-[var(--color-text-primary)]"
          data-testid="degree-value"
        >
          {node.degree}
        </span>
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

  // Calculate max values for bar scaling
  const maxValues = useMemo(() => {
    if (sortedMetrics.length === 0) {
      return { pageRank: 1, betweenness: 1, degree: 1 }
    }
    return {
      pageRank: Math.max(...sortedMetrics.map((m) => m.pageRank)),
      betweenness: Math.max(...sortedMetrics.map((m) => m.betweenness)),
      degree: Math.max(...sortedMetrics.map((m) => m.degree)),
    }
  }, [sortedMetrics])

  // Calculate statistics
  const stats = useMemo(() => {
    if (sortedMetrics.length === 0) {
      return { avgPageRank: 0, avgBetweenness: 0, avgDegree: 0 }
    }
    const sum = sortedMetrics.reduce(
      (acc, m) => ({
        pageRank: acc.pageRank + m.pageRank,
        betweenness: acc.betweenness + m.betweenness,
        degree: acc.degree + m.degree,
      }),
      { pageRank: 0, betweenness: 0, degree: 0 }
    )
    const count = sortedMetrics.length
    return {
      avgPageRank: sum.pageRank / count,
      avgBetweenness: sum.betweenness / count,
      avgDegree: sum.degree / count,
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
      {/* Header stats */}
      <div
        className="grid grid-cols-3 gap-4 border-b border-[var(--color-border)] px-4 py-3"
        data-testid="centrality-stats"
      >
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">
            Avg PageRank
          </div>
          <div
            className="text-lg font-semibold text-[var(--color-primary)]"
            data-testid="avg-pagerank"
          >
            {stats.avgPageRank.toFixed(4)}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">
            Avg Betweenness
          </div>
          <div
            className="text-lg font-semibold text-[var(--color-secondary)]"
            data-testid="avg-betweenness"
          >
            {stats.avgBetweenness.toFixed(4)}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">
            Avg Degree
          </div>
          <div
            className="text-lg font-semibold text-[var(--color-info)]"
            data-testid="avg-degree"
          >
            {stats.avgDegree.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Sort controls */}
      <div
        className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2"
        data-testid="sort-controls"
      >
        <span className="text-xs text-[var(--color-text-muted)]">Sort by:</span>
        <SortButton
          field="pageRank"
          label="PageRank"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={() => handleSort('pageRank')}
        />
        <SortButton
          field="betweenness"
          label="Betweenness"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={() => handleSort('betweenness')}
        />
        <SortButton
          field="degree"
          label="Degree"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={() => handleSort('degree')}
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
              No centrality metrics available. Load graph data first.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-[var(--color-surface)]">
              <tr className="text-left text-xs text-[var(--color-text-muted)]">
                <th className="px-3 py-2 font-medium">Node</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">PageRank</th>
                <th className="px-3 py-2 font-medium">Betweenness</th>
                <th className="px-3 py-2 text-center font-medium">Degree</th>
              </tr>
            </thead>
            <tbody>
              {sortedMetrics.map((node) => (
                <NodeRow
                  key={node.nodeId}
                  node={node}
                  maxValues={maxValues}
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
