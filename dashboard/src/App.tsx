/**
 * Main App Component with Tab Navigation
 * @author andreas@siglochconsulting
 */

import { lazy, Suspense, useEffect } from 'react'
import { useDashboardStore } from './stores/dashboardStore'
import { useSSE } from './hooks/useSSE'
import { useGraphData, useCentralityMetrics } from './hooks/useGraphData'
import { MemoryTimeline, CentralityPanel, RulesPanel, VerbesserungenPanel } from './components'
import type { Tab } from './schemas'

// Lazy load GraphView (vis-network is 500KB+)
const GraphView = lazy(() => import('./components/GraphView'))

// Tab order matches Stufen-Modell: 1-3 Übersicht, 4 Regeln, 5 Kennzahlen, 6 Verbesserungen, 7 Lernverlauf
const TABS: { id: Tab; label: string; icon: React.ReactElement }[] = [
  {
    id: 'graph',
    label: '1-3 Übersicht',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  },
  {
    id: 'rules',
    label: '4 Regeln',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'kennzahlen',
    label: '5 Kennzahlen',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    id: 'verbesserungen',
    label: '6 Verbesserungen',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    id: 'timeline',
    label: '7 Lernverlauf',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
]

function ConnectionStatus() {
  const isConnected = useDashboardStore((s) => s.isConnected)
  const error = useDashboardStore((s) => s.error)

  return (
    <div className="flex items-center gap-2" data-testid="connection-status">
      <span
        className={`h-2 w-2 rounded-full ${
          isConnected
            ? 'bg-[var(--color-success)] animate-pulse'
            : error
              ? 'bg-[var(--color-error)]'
              : 'bg-[var(--color-warning)]'
        }`}
        data-testid="connection-indicator"
      />
      <span className="text-xs text-[var(--color-text-muted)]">
        {isConnected ? 'Live' : error ? 'Error' : 'Connecting...'}
      </span>
    </div>
  )
}

function FilterPanel() {
  const filters = useDashboardStore((s) => s.filters)
  const updateFilters = useDashboardStore((s) => s.updateFilters)
  const resetFilters = useDashboardStore((s) => s.resetFilters)

  return (
    <div
      className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-2"
      data-testid="filter-panel"
    >
      <div className="flex items-center gap-2">
        <label
          htmlFor="search-input"
          className="text-xs text-[var(--color-text-muted)]"
        >
          Search:
        </label>
        <input
          id="search-input"
          type="text"
          value={filters.searchQuery}
          onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          placeholder="Filter nodes..."
          className="w-40 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          data-testid="search-input"
        />
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor="min-pagerank"
          className="text-xs text-[var(--color-text-muted)]"
        >
          Min PageRank:
        </label>
        <input
          id="min-pagerank"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={filters.minPageRank}
          onChange={(e) =>
            updateFilters({ minPageRank: parseFloat(e.target.value) })
          }
          className="w-20"
          data-testid="min-pagerank-slider"
        />
        <span className="w-10 text-xs text-[var(--color-text-secondary)]">
          {filters.minPageRank.toFixed(2)}
        </span>
      </div>

      <button
        onClick={resetFilters}
        className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
        data-testid="reset-filters-button"
      >
        Reset
      </button>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <svg
          className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--color-primary)]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-[var(--color-text-muted)]">Loading graph...</p>
      </div>
    </div>
  )
}

function TabContent({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'graph':
      return (
        <div className="flex h-full flex-col">
          <FilterPanel />
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={<LoadingFallback />}>
              <GraphView />
            </Suspense>
          </div>
        </div>
      )
    case 'rules':
      return <RulesPanel />
    case 'kennzahlen':
      return <CentralityPanel />
    case 'verbesserungen':
      return <VerbesserungenPanel />
    case 'timeline':
      return <MemoryTimeline />
    default:
      return null
  }
}

export default function App() {
  const activeTab = useDashboardStore((s) => s.activeTab)
  const setActiveTab = useDashboardStore((s) => s.setActiveTab)
  const isLoading = useDashboardStore((s) => s.isLoading)
  const graphData = useDashboardStore((s) => s.graphData)
  const memoryEvents = useDashboardStore((s) => s.memoryEvents)

  // Connect to SSE for real-time updates
  const { isConnected, reconnect } = useSSE({
    url: '/api/events',
    enabled: true,
  })

  // Fetch initial data
  const { refetch: refetchGraph } = useGraphData({ autoFetch: true })
  const { fetchCentrality } = useCentralityMetrics()

  // Fetch centrality data on mount
  useEffect(() => {
    fetchCentrality()
  }, [fetchCentrality])

  return (
    <div
      className="flex h-screen flex-col bg-[var(--color-background)]"
      data-testid="app-container"
    >
      {/* Header */}
      <header
        className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3"
        data-testid="app-header"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Data Maturity Dashboard
          </h1>
          <ConnectionStatus />
        </div>

        <div className="flex items-center gap-4">
          {/* Stats badges */}
          <div className="flex gap-2 text-xs" data-testid="header-stats">
            <span className="rounded-full bg-[var(--color-surface-elevated)] px-2 py-1 text-[var(--color-text-muted)]">
              Nodes: {graphData.nodes.length}
            </span>
            <span className="rounded-full bg-[var(--color-surface-elevated)] px-2 py-1 text-[var(--color-text-muted)]">
              Events: {memoryEvents.length}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={refetchGraph}
              disabled={isLoading}
              className="flex items-center gap-1 rounded bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-50"
              data-testid="refresh-button"
            >
              <svg
                className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>

            {!isConnected && (
              <button
                onClick={reconnect}
                className="rounded bg-[var(--color-primary)] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[var(--color-primary-hover)]"
                data-testid="reconnect-button"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav
        className="flex border-b border-[var(--color-border)]"
        data-testid="tab-navigation"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-secondary)]'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-hidden" data-testid="main-content">
        {isLoading && graphData.nodes.length === 0 ? (
          <div
            className="flex h-full items-center justify-center"
            data-testid="loading-state"
          >
            <div className="text-center">
              <svg
                className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--color-primary)]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm text-[var(--color-text-muted)]">
                Loading data...
              </p>
            </div>
          </div>
        ) : (
          <TabContent tab={activeTab} />
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t border-[var(--color-border)] px-4 py-2"
        data-testid="app-footer"
      >
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Data Maturity Stages Dashboard</span>
          <span>
            Last update:{' '}
            {graphData.metadata?.lastUpdated
              ? new Date(graphData.metadata.lastUpdated).toLocaleTimeString()
              : 'N/A'}
          </span>
        </div>
      </footer>
    </div>
  )
}
