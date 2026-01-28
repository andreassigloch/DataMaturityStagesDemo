/**
 * Server-Sent Events Hook
 * @author andreas@siglochconsulting
 */

import { useEffect, useRef, useCallback } from 'react'
import { useDashboardStore } from '../stores/dashboardStore'
import { safeParseSSEEvent } from '../schemas'

interface UseSSEOptions {
  url: string
  enabled?: boolean
  reconnectDelay?: number
  maxRetries?: number
}

export function useSSE({
  url,
  enabled = true,
  reconnectDelay = 3000,
  maxRetries = 5,
}: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const {
    setGraphData,
    addNode,
    addEdge,
    addMemoryEvent,
    addPattern,
    setCentralityMetrics,
    setConnected,
    setError,
  } = useDashboardStore()

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('[SSE] Connected to', url)
        retryCountRef.current = 0
        setConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          const result = safeParseSSEEvent(parsed)

          if (!result.success) {
            console.warn('[SSE] Invalid event format:', result.error)
            return
          }

          const sseEvent = result.data

          switch (sseEvent.type) {
            case 'graph-update':
              setGraphData(sseEvent.data)
              break
            case 'node-added':
              addNode(sseEvent.data)
              break
            case 'edge-added':
              addEdge(sseEvent.data)
              break
            case 'memory-event':
              addMemoryEvent(sseEvent.data)
              break
            case 'pattern-detected':
              addPattern(sseEvent.data)
              break
            case 'centrality-update':
              setCentralityMetrics(sseEvent.data)
              break
            case 'heartbeat':
              // Keep connection alive, no action needed
              break
          }
        } catch (err) {
          console.error('[SSE] Failed to parse message:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('[SSE] Error:', err)
        setConnected(false)
        eventSource.close()
        eventSourceRef.current = null

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++
          console.log(
            `[SSE] Reconnecting in ${reconnectDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`
          )
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect()
          }, reconnectDelay)
        } else {
          setError(
            `Failed to connect to event stream after ${maxRetries} attempts`
          )
        }
      }
    } catch (err) {
      console.error('[SSE] Failed to create EventSource:', err)
      setError('Failed to establish connection')
      setConnected(false)
    }
  }, [
    url,
    reconnectDelay,
    maxRetries,
    setGraphData,
    addNode,
    addEdge,
    addMemoryEvent,
    addPattern,
    setCentralityMetrics,
    setConnected,
    setError,
  ])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
  }, [setConnected])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected: useDashboardStore((s) => s.isConnected),
    reconnect: connect,
    disconnect,
  }
}
