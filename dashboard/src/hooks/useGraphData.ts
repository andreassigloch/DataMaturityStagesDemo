/**
 * Graph Data Fetching Hook
 * @author andreas@siglochconsulting
 */

import { useCallback, useEffect } from 'react'
import { useDashboardStore } from '../stores/dashboardStore'
import { validateGraphData } from '../schemas'

interface UseGraphDataOptions {
  apiUrl?: string
  autoFetch?: boolean
}

export function useGraphData({
  apiUrl = '/api/graph',
  autoFetch = true,
}: UseGraphDataOptions = {}) {
  const { setGraphData, setLoading, setError, graphData, isLoading, error } =
    useDashboardStore()

  const fetchGraphData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      const validated = validateGraphData(json.data || json)
      setGraphData(validated)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch graph data'
      console.error('[GraphData] Fetch error:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, setGraphData, setLoading, setError])

  const refetch = useCallback(() => {
    fetchGraphData()
  }, [fetchGraphData])

  useEffect(() => {
    if (autoFetch && graphData.nodes.length === 0 && !isLoading) {
      fetchGraphData()
    }
  }, [autoFetch, graphData.nodes.length, isLoading, fetchGraphData])

  return {
    graphData,
    isLoading,
    error,
    refetch,
  }
}

// Hook for fetching centrality metrics
export function useCentralityMetrics(apiUrl = '/api/centrality') {
  const { setCentralityMetrics, setLoading, setError, centralityMetrics } =
    useDashboardStore()

  const fetchCentrality = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      setCentralityMetrics(json.data || json)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch centrality'
      console.error('[Centrality] Fetch error:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, setCentralityMetrics, setLoading, setError])

  return {
    centralityMetrics,
    fetchCentrality,
  }
}

// Hook for fetching detected patterns
export function usePatterns(apiUrl = '/api/patterns') {
  const { detectedPatterns, addPattern, setLoading, setError } =
    useDashboardStore()

  const fetchPatterns = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      const patterns = json.data || json

      if (Array.isArray(patterns)) {
        patterns.forEach((pattern) => addPattern(pattern))
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch patterns'
      console.error('[Patterns] Fetch error:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, addPattern, setLoading, setError])

  return {
    detectedPatterns,
    fetchPatterns,
  }
}

// CR-010: Hook for fetching quality data (validation, scoring, optimization)
export function useQualityData(apiUrl = '/api/quality') {
  const {
    setValidationResult,
    setScoringResult,
    setOptimizationResult,
    setLoading,
    setError,
    validationResult,
    scoringResult,
    optimizationResult,
  } = useDashboardStore()

  const fetchQualityData = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()

      if (json.validation) {
        setValidationResult(json.validation)
      }
      if (json.scoring) {
        setScoringResult(json.scoring)
      }
      if (json.optimization) {
        setOptimizationResult(json.optimization)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch quality data'
      console.error('[Quality] Fetch error:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, setValidationResult, setScoringResult, setOptimizationResult, setLoading, setError])

  return {
    validationResult,
    scoringResult,
    optimizationResult,
    fetchQualityData,
  }
}
