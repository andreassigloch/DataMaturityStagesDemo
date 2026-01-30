/**
 * VerbesserungenPanel Component - Stufe 6: OPT-Vorschläge
 * Zeigt Optimierungs-Vorschläge angewendet auf Requirements
 * @author andreas@siglochconsulting
 */

import { useEffect, useState } from 'react'

interface OptimizationSuggestion {
  kandidat: string
  kandidatLabel: string
  von: string
  nach: string
  grund: string
  expectedDelta: number
  confidence: number
}

interface OptimizationState {
  ruleId: string
  ruleName: string
  beschreibung: string
  currentMetric: number
  targetMetric: number
  direction: 'maximieren' | 'minimieren'
  progressPercent: number
  suggestions: OptimizationSuggestion[]
  history: {
    timestamp: string
    action: string
    metricBefore: number
    metricAfter: number
    delta: number
  }[]
}

function ProgressBar({ percent, target }: { percent: number; target: number }) {
  const targetPercent = target * 100
  const isAchieved = percent >= targetPercent

  return (
    <div className="relative h-4 w-full overflow-hidden rounded-full bg-[var(--color-surface-elevated)]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, percent)}%`,
          backgroundColor: isAchieved ? 'var(--color-success)' : 'var(--color-primary)',
        }}
      />
      <div
        className="absolute top-0 h-full w-0.5 bg-[var(--color-text-muted)]"
        style={{ left: `${targetPercent}%` }}
        title={`Ziel: ${target * 100}%`}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[var(--color-text-primary)]">
        {percent}%
      </span>
    </div>
  )
}

function SuggestionCard({ suggestion, onApply }: {
  suggestion: OptimizationSuggestion
  onApply: () => void
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--color-text-primary)]">
              {suggestion.kandidat}
            </span>
            <span className="rounded bg-[var(--color-info)]/20 px-1.5 py-0.5 text-[10px] text-[var(--color-info)]">
              +{Math.round(suggestion.expectedDelta * 100)}%
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <span>{suggestion.von}</span>
            <span>→</span>
            <span className="text-[var(--color-success)]">{suggestion.nach}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {suggestion.grund}
          </p>
        </div>
        <button
          onClick={onApply}
          className="shrink-0 rounded bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary)]/80"
          title="Vorschlag anwenden"
        >
          Anwenden
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-[var(--color-text-muted)]">Confidence:</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-elevated)]">
          <div
            className="h-full rounded-full bg-[var(--color-success)]"
            style={{ width: `${suggestion.confidence * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-[var(--color-text-muted)]">
          {Math.round(suggestion.confidence * 100)}%
        </span>
      </div>
    </div>
  )
}

function OptimizationCard({ state }: { state: OptimizationState }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleApplySuggestion = (suggestion: OptimizationSuggestion) => {
    console.log('Apply suggestion:', suggestion)
    alert(`Vorschlag "${suggestion.kandidat}" würde angewendet werden.\n\nIn der Demo nicht implementiert.`)
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[var(--color-surface-elevated)]"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--color-text-primary)]">
              {state.ruleName}
            </span>
            <span className="rounded bg-[var(--color-surface-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
              {state.ruleId}
            </span>
            {state.progressPercent >= 100 && (
              <span className="rounded bg-[var(--color-success)]/20 px-2 py-0.5 text-xs text-[var(--color-success)]">
                ✓ Ziel erreicht
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {state.beschreibung}
          </p>
        </div>
        <svg
          className={`h-5 w-5 text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--color-border)] p-4">
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Fortschritt</span>
              <span className="text-[var(--color-text-primary)]">
                {state.currentMetric} / {state.targetMetric} ({state.direction})
              </span>
            </div>
            <ProgressBar percent={state.progressPercent} target={state.targetMetric} />
          </div>

          {state.suggestions.length > 0 ? (
            <div>
              <h4 className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
                Vorschläge ({state.suggestions.length})
              </h4>
              <div className="space-y-2">
                {state.suggestions.map((suggestion, idx) => (
                  <SuggestionCard
                    key={`${suggestion.kandidat}-${idx}`}
                    suggestion={suggestion}
                    onApply={() => handleApplySuggestion(suggestion)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Keine Verbesserungsvorschläge verfügbar.
            </p>
          )}

          {state.history.length > 0 && (
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              <h4 className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
                Verlauf
              </h4>
              <div className="space-y-1 text-xs">
                {state.history.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[var(--color-text-muted)]">
                    <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                    <span>{step.action}</span>
                    <span className="text-[var(--color-success)]">
                      +{Math.round(step.delta * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function VerbesserungenPanel() {
  const [optimizationStates, setOptimizationStates] = useState<OptimizationState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOptimization() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/optimization')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        setOptimizationStates(data)
        setError(null)
      } catch (err) {
        console.error('[VerbesserungenPanel] Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Laden')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptimization()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-muted)]">Lade Verbesserungsvorschläge...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-[var(--color-error)]">Fehler: {error}</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Stellen Sie sicher, dass der Server läuft und OPT-Regeln in Neo4j existieren.
          </p>
        </div>
      </div>
    )
  }

  if (optimizationStates.length === 0) {
    return (
      <div className="flex h-full flex-col" data-testid="verbesserungen-panel">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Stufe 6: Verbesserungen
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            OPT-Regeln mit konkreten Optimierungsvorschlägen
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Keine OPT-Regeln gefunden.
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Regeln mit wirkung='Optimierung' werden hier angezeigt.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col" data-testid="verbesserungen-panel">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Stufe 6: Verbesserungen
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          OPT-Regeln mit konkreten Optimierungsvorschlägen
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {optimizationStates.map((state) => (
            <OptimizationCard key={state.ruleId} state={state} />
          ))}
        </div>
      </div>
    </div>
  )
}
