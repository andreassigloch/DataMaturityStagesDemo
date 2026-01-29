/**
 * RulesPanel Component - Display Validation Rules (Regel nodes)
 * @author andreas@siglochconsulting
 */

import { useEffect, useState } from 'react'

interface Regel {
  id: string
  name: string
  typ: string
  cypher: string
  schwere: 'fehler' | 'warnung'
  standard: string
  aktiv: boolean
  createdAt?: string
}

interface RulesResponse {
  rules: Regel[]
  stats: {
    total: number
    active: number
    byStandard: Record<string, number>
    bySchwere: Record<string, number>
  }
}

const SCHWERE_COLORS = {
  fehler: '#EF4444',   // Red
  warnung: '#F59E0B',  // Amber
}

const SCHWERE_LABELS = {
  fehler: 'Fehler',
  warnung: 'Warnung',
}

export function RulesPanel() {
  const [data, setData] = useState<RulesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRules() {
      try {
        const response = await fetch('http://localhost:3001/api/rules')
        if (!response.ok) throw new Error('Failed to fetch rules')
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchRules()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="rules-loading">
        <div className="text-[var(--color-text-muted)]">Loading rules...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="rules-error">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  if (!data || data.rules.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4" data-testid="rules-empty">
        <div className="text-6xl">📋</div>
        <div className="text-lg text-[var(--color-text-muted)]">Keine Regeln definiert</div>
        <div className="max-w-md text-center text-sm text-[var(--color-text-muted)]">
          Regeln werden über das MCP-Tool <code className="rounded bg-[var(--color-surface-elevated)] px-1">add_rule</code> erstellt.
          Sie definieren Validierungsprüfungen für Requirements.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col" data-testid="rules-panel">
      {/* Stats Header */}
      <div className="grid grid-cols-4 gap-4 border-b border-[var(--color-border)] px-4 py-3" data-testid="rules-stats">
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">Gesamt</div>
          <div className="text-lg font-semibold text-[var(--color-text-primary)]">{data.stats.total}</div>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">Aktiv</div>
          <div className="text-lg font-semibold text-green-400">{data.stats.active}</div>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">Fehler</div>
          <div className="text-lg font-semibold text-red-400">{data.stats.bySchwere?.fehler || 0}</div>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">Warnungen</div>
          <div className="text-lg font-semibold text-amber-400">{data.stats.bySchwere?.warnung || 0}</div>
        </div>
      </div>

      {/* Standards Overview */}
      {Object.keys(data.stats.byStandard).length > 0 && (
        <div className="flex gap-2 border-b border-[var(--color-border)] px-4 py-2">
          <span className="text-xs text-[var(--color-text-muted)]">Standards:</span>
          {Object.entries(data.stats.byStandard).map(([standard, count]) => (
            <span
              key={standard}
              className="rounded bg-[var(--color-surface-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-primary)]"
            >
              {standard} ({count})
            </span>
          ))}
        </div>
      )}

      {/* Rules List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {data.rules.map((rule) => (
            <div
              key={rule.id}
              className={`rounded-lg border transition-colors ${
                rule.aktiv
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  : 'border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 opacity-60'
              }`}
              data-testid={`rule-${rule.id}`}
            >
              {/* Rule Header */}
              <button
                onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: SCHWERE_COLORS[rule.schwere] }}
                  />
                  <div>
                    <div className="font-medium text-[var(--color-text-primary)]">{rule.name}</div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <span>{rule.typ}</span>
                      <span>•</span>
                      <span>{rule.standard}</span>
                      <span>•</span>
                      <span>{SCHWERE_LABELS[rule.schwere]}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!rule.aktiv && (
                    <span className="rounded bg-gray-600 px-2 py-0.5 text-xs text-gray-300">
                      Inaktiv
                    </span>
                  )}
                  <svg
                    className={`h-5 w-5 text-[var(--color-text-muted)] transition-transform ${
                      expandedRule === rule.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Content */}
              {expandedRule === rule.id && (
                <div className="border-t border-[var(--color-border)] p-4">
                  <div className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">Cypher Query:</div>
                  <pre className="overflow-x-auto rounded bg-[var(--color-surface-elevated)] p-3 text-xs text-[var(--color-text-primary)]">
                    {rule.cypher}
                  </pre>
                  {rule.createdAt && (
                    <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                      Erstellt: {new Date(rule.createdAt).toLocaleString('de-DE')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
