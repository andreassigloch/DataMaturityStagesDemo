/**
 * Zustand Store for Dashboard State
 * @author andreas@siglochconsulting
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  GraphData,
  GraphNode,
  GraphEdge,
  MemoryEvent,
  DetectedPattern,
  CentralityMetrics,
  Tab,
  FilterState,
  NodeType,
} from '../schemas'

interface DashboardState {
  // Graph data
  graphData: GraphData
  selectedNodeId: string | null
  highlightedNodes: Set<string>

  // Memory timeline
  memoryEvents: MemoryEvent[]
  isTimelinePlaying: boolean
  timelineSpeed: number

  // Centrality metrics
  centralityMetrics: CentralityMetrics[]
  sortBy: keyof CentralityMetrics
  sortDirection: 'asc' | 'desc'

  // Patterns
  detectedPatterns: DetectedPattern[]
  selectedPatternId: string | null

  // UI state
  activeTab: Tab
  filters: FilterState
  isLoading: boolean
  error: string | null
  isConnected: boolean

  // Actions
  setGraphData: (data: GraphData) => void
  addNode: (node: GraphNode) => void
  addEdge: (edge: GraphEdge) => void
  selectNode: (nodeId: string | null) => void
  highlightNodes: (nodeIds: string[]) => void
  clearHighlight: () => void

  addMemoryEvent: (event: MemoryEvent) => void
  setTimelinePlaying: (playing: boolean) => void
  setTimelineSpeed: (speed: number) => void

  setCentralityMetrics: (metrics: CentralityMetrics[]) => void
  setSortBy: (key: keyof CentralityMetrics) => void
  toggleSortDirection: () => void

  addPattern: (pattern: DetectedPattern) => void
  selectPattern: (patternId: string | null) => void

  setActiveTab: (tab: Tab) => void
  updateFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setConnected: (connected: boolean) => void
}

const defaultFilters: FilterState = {
  nodeTypes: [
    'StakeholderReq',
    'SystemReq',
    'SoftwareReq',
    'HardwareReq',
    'TestCase',
    'InputSpec',
    'Komponente',
    'Pattern',
    'Feedback',
    'LearningEvent',
    'Regel',
  ] as NodeType[],
  minPageRank: 0,
  minDegree: 0,
  searchQuery: '',
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // Initial state
      graphData: { nodes: [], edges: [] },
      selectedNodeId: null,
      highlightedNodes: new Set(),

      memoryEvents: [],
      isTimelinePlaying: false,
      timelineSpeed: 1,

      centralityMetrics: [],
      sortBy: 'pageRank',
      sortDirection: 'desc',

      detectedPatterns: [],
      selectedPatternId: null,

      activeTab: 'graph',
      filters: defaultFilters,
      isLoading: false,
      error: null,
      isConnected: false,

      // Graph actions
      setGraphData: (data) =>
        set({ graphData: data, isLoading: false }, false, 'setGraphData'),

      addNode: (node) =>
        set(
          (state) => ({
            graphData: {
              ...state.graphData,
              nodes: [...state.graphData.nodes, node],
            },
          }),
          false,
          'addNode'
        ),

      addEdge: (edge) =>
        set(
          (state) => ({
            graphData: {
              ...state.graphData,
              edges: [...state.graphData.edges, edge],
            },
          }),
          false,
          'addEdge'
        ),

      selectNode: (nodeId) =>
        set({ selectedNodeId: nodeId }, false, 'selectNode'),

      highlightNodes: (nodeIds) =>
        set({ highlightedNodes: new Set(nodeIds) }, false, 'highlightNodes'),

      clearHighlight: () =>
        set({ highlightedNodes: new Set() }, false, 'clearHighlight'),

      // Memory actions
      addMemoryEvent: (event) =>
        set(
          (state) => ({
            memoryEvents: [...state.memoryEvents, event].slice(-100), // Keep last 100
          }),
          false,
          'addMemoryEvent'
        ),

      setTimelinePlaying: (playing) =>
        set({ isTimelinePlaying: playing }, false, 'setTimelinePlaying'),

      setTimelineSpeed: (speed) =>
        set({ timelineSpeed: speed }, false, 'setTimelineSpeed'),

      // Centrality actions
      setCentralityMetrics: (metrics) =>
        set({ centralityMetrics: metrics }, false, 'setCentralityMetrics'),

      setSortBy: (key) => set({ sortBy: key }, false, 'setSortBy'),

      toggleSortDirection: () =>
        set(
          (state) => ({
            sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
          }),
          false,
          'toggleSortDirection'
        ),

      // Pattern actions
      addPattern: (pattern) =>
        set(
          (state) => {
            const exists = state.detectedPatterns.some((p) => p.id === pattern.id)
            if (exists) return state
            return { detectedPatterns: [...state.detectedPatterns, pattern] }
          },
          false,
          'addPattern'
        ),

      selectPattern: (patternId) => {
        const pattern = get().detectedPatterns.find((p) => p.id === patternId)
        set(
          {
            selectedPatternId: patternId,
            highlightedNodes: pattern
              ? new Set(pattern.nodeIds)
              : new Set(),
          },
          false,
          'selectPattern'
        )
      },

      // UI actions
      setActiveTab: (tab) => set({ activeTab: tab }, false, 'setActiveTab'),

      updateFilters: (filters) =>
        set(
          (state) => ({
            filters: { ...state.filters, ...filters },
          }),
          false,
          'updateFilters'
        ),

      resetFilters: () =>
        set({ filters: defaultFilters }, false, 'resetFilters'),

      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      setConnected: (connected) =>
        set({ isConnected: connected }, false, 'setConnected'),
    }),
    { name: 'dashboard-store' }
  )
)

// Selectors
export const selectFilteredNodes = (state: DashboardState) => {
  const { nodes } = state.graphData
  const { nodeTypes, minPageRank, minDegree, searchQuery } = state.filters

  return nodes.filter((node) => {
    if (!nodeTypes.includes(node.type)) return false
    if (node.pageRank !== undefined && node.pageRank < minPageRank) return false
    if (node.degree !== undefined && node.degree < minDegree) return false
    if (
      searchQuery &&
      !node.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    return true
  })
}

export const selectSortedCentrality = (state: DashboardState) => {
  const { centralityMetrics, sortBy, sortDirection } = state
  return [...centralityMetrics].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    return 0
  })
}
