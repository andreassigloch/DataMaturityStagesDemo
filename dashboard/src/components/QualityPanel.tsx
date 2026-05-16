/**
 * QualityPanel Component - CR-010 Regel-Schema Redesign
 * Three sections: Verbesserungsvorschläge | Kennzahlen | Optimierungen
 * @author andreas@siglochconsulting
 */

import { useDashboardStore } from '../stores/dashboardStore'
import type {
  ValidationItem,
  ScoringItem,
  OptimizationSuggestion,
  QualityTab,
  Schwere,
} from '../schemas'

const SEVERITY_CONFIG: Record<Schwere, { color: string; icon: string; label: string }> = {
  fehler: { color: 'var(--color-error)', icon: '!', label: 'Fehler' },
  warnung: { color: 'var(--color-warning)', icon: '?', label: 'Warnung' },
  info: { color: 'var(--color-info)', icon: 'i', label: 'Info' },
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  ok: { color: 'var(--color-success)', bg: 'var(--color-success)/10' },
  warnung: { color: 'var(--color-warning)', bg: 'var(--color-warning)/10' },
  kritisch: { color: 'var(--color-error)', bg: 'var(--color-error)/10' },
}

const TAB_CONFIG: Record<QualityTab, { label: string; icon: string }> = {
  validierung: { label: 'Verbesserungen', icon: 'V' },
  scoring: { label: 'Kennzahlen', icon: 'K' },
  optimierung: { label: 'Optimierungen', icon: 'O' },
}

// --- Sub-Components ---

function SeverityBadge({ severity }: { severity: Schwere }) {
  const config = SEVERITY_CONFIG[severity]
  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold"
      style={{ backgroundColor: config.color, color: 'var(--color-background)' }}
      data-testid={`severity-badge-${severity}`}
      title={config.label}
    >
      {config.icon}
    </span>
  )
}

function ScoreGauge({ score, schwellwert, richtung }: {
  score: number
  schwellwert: number
  richtung: 'minimieren' | 'maximieren'
}) {
  const percentage = Math.round(score * 100)
  const thresholdPct = Math.round(schwellwert * 100)
  const isGood = richtung === 'maximieren' ? score >= schwellwert : score <= schwellwert
  const barColor = isGood ? 'var(--color-success)' : 'var(--color-warning)'

  return (
    <div className="w-full" data-testid="score-gauge">
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-[var(--color-text-primary)]">{percentage}%</span>
        <span className="text-[var(--color-text-muted)]">Ziel: {thresholdPct}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-[var(--color-text-muted)]"
          style={{ left: `${thresholdPct}%` }}
        />
      </div>
    </div>
  )
}

function DeltaBadge({ delta, deltaPercent }: { delta: number | null; deltaPercent: number | null }) {
  if (delta === null) return null
  const isPositive = delta > 0
  const color = isPositive ? 'var(--color-error)' : 'var(--color-success)'
  const sign = isPositive ? '+' : ''

  return (
    <span
      className="rounded px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
      data-testid="delta-badge"
    >
      {sign}{delta} ({sign}{deltaPercent?.toFixed(0)}%)
    </span>
  )
}

// --- Section Components ---

function ValidationSection() {
  const validationResult = useDashboardStore((s) => s.validationResult)

  if (!validationResult || validationResult.violations.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center" data-testid="validation-empty">
        <div className="text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-2xl">✓</div>
          <p className="text-sm">Keine Verstöße gefunden</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="validation-list">
      {validationResult.violations.map((violation: ValidationItem, idx: number) => (
        <div
          key={`${violation.ruleId}-${idx}`}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3"
          data-testid={`validation-item-${violation.ruleId}`}
        >
          <div className="mb-2 flex items-start gap-2">
            <SeverityBadge severity={violation.severity} />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                {violation.ruleName}
              </h4>
              <div className="flex gap-2 text-xs text-[var(--color-text-muted)]">
                <span>{violation.domain}</span>
                <span>•</span>
                <span>{violation.standard}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            <span className="font-medium">{violation.affectedElements.length} betroffen:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {violation.affectedElements.slice(0, 5).map((el) => (
                <span
                  key={el.id}
                  className="rounded bg-[var(--color-surface)] px-1.5 py-0.5"
                  title={el.name}
                >
                  {el.id}
                </span>
              ))}
              {violation.affectedElements.length > 5 && (
                <span className="text-[var(--color-text-muted)]">
                  +{violation.affectedElements.length - 5}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScoringSection() {
  const scoringResult = useDashboardStore((s) => s.scoringResult)

  if (!scoringResult || scoringResult.items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center" data-testid="scoring-empty">
        <div className="text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-2xl">📊</div>
          <p className="text-sm">Keine Scoring-Regeln aktiv</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="scoring-list">
      {scoringResult.items.map((item: ScoringItem) => {
        const statusConfig = STATUS_CONFIG[item.status]
        return (
          <div
            key={item.ruleId}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4"
            data-testid={`scoring-item-${item.ruleId}`}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                  {item.ruleName}
                </h4>
                <p className="text-xs text-[var(--color-text-muted)]">{item.beschreibung}</p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
                data-testid={`scoring-status-${item.ruleId}`}
              >
                {item.status}
              </span>
            </div>
            <ScoreGauge
              score={item.score}
              schwellwert={item.schwellwert}
              richtung={item.richtung}
            />
            <div className="mt-2 flex justify-between text-xs text-[var(--color-text-muted)]">
              <span>{item.wert} / {item.von} {item.einheit}</span>
              <span>{item.domain} • {item.standard}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OptimizationSection() {
  const optimizationResult = useDashboardStore((s) => s.optimizationResult)

  if (!optimizationResult || optimizationResult.suggestions.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center" data-testid="optimization-empty">
        <div className="text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-2xl">⚡</div>
          <p className="text-sm">Keine Optimierungen vorgeschlagen</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="optimization-list">
      {optimizationResult.suggestions.map((suggestion: OptimizationSuggestion, idx: number) => (
        <div
          key={`${suggestion.ruleId}-${idx}`}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3"
          data-testid={`optimization-item-${suggestion.ruleId}-${idx}`}
        >
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                {suggestion.ruleName}
              </h4>
              <p className="text-xs text-[var(--color-text-muted)]">{suggestion.beschreibung}</p>
            </div>
            <span
              className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]"
              data-testid="operator-badge"
            >
              {suggestion.operator}
            </span>
          </div>
          <div className="mb-2 rounded bg-[var(--color-surface)] p-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--color-text-secondary)]">
                {suggestion.kandidat}
              </span>
              <span className="text-[var(--color-text-muted)]">
                {suggestion.von} → {suggestion.nach}
              </span>
            </div>
            <p className="mt-1 text-[var(--color-text-muted)]">{suggestion.grund}</p>
          </div>
          <div className="flex items-center justify-between">
            <DeltaBadge delta={suggestion.delta} deltaPercent={suggestion.deltaPercent} />
            <button
              className="rounded bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)]"
              data-testid={`apply-btn-${suggestion.ruleId}-${idx}`}
              disabled
              title="Simulation nicht verfügbar"
            >
              Anwenden
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Main Component ---

export function QualityPanel() {
  const activeQualityTab = useDashboardStore((s) => s.activeQualityTab)
  const setActiveQualityTab = useDashboardStore((s) => s.setActiveQualityTab)
  const validationResult = useDashboardStore((s) => s.validationResult)
  const scoringResult = useDashboardStore((s) => s.scoringResult)
  const optimizationResult = useDashboardStore((s) => s.optimizationResult)

  // Calculate stats
  const stats = {
    errors: validationResult?.errorCount ?? 0,
    warnings: validationResult?.warningCount ?? 0,
    avgScore: scoringResult?.averageScore ?? 0,
    suggestions: optimizationResult?.totalSuggestions ?? 0,
  }

  return (
    <div className="flex h-full flex-col" data-testid="quality-panel">
      {/* Stats Header */}
      <div
        className="border-b border-[var(--color-border)] px-4 py-3"
        data-testid="quality-stats"
      >
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
            <div className="text-lg font-bold text-[var(--color-error)]" data-testid="stat-errors">
              {stats.errors}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Fehler</div>
          </div>
          <div className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
            <div className="text-lg font-bold text-[var(--color-warning)]" data-testid="stat-warnings">
              {stats.warnings}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Warnungen</div>
          </div>
          <div className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
            <div className="text-lg font-bold text-[var(--color-success)]" data-testid="stat-score">
              {Math.round(stats.avgScore * 100)}%
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Ø Score</div>
          </div>
          <div className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
            <div className="text-lg font-bold text-[var(--color-primary)]" data-testid="stat-suggestions">
              {stats.suggestions}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Vorschläge</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex border-b border-[var(--color-border)]"
        data-testid="quality-tabs"
      >
        {(Object.keys(TAB_CONFIG) as QualityTab[]).map((tab) => {
          const isActive = activeQualityTab === tab
          const config = TAB_CONFIG[tab]
          return (
            <button
              key={tab}
              onClick={() => setActiveQualityTab(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
              data-testid={`quality-tab-${tab}`}
            >
              <span className="mr-1">{config.icon}</span>
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="quality-content">
        {activeQualityTab === 'validierung' && <ValidationSection />}
        {activeQualityTab === 'scoring' && <ScoringSection />}
        {activeQualityTab === 'optimierung' && <OptimizationSection />}
      </div>
    </div>
  )
}
