/**
 * GraphView Component - vis-network Graph Visualization
 * @author andreas@siglochconsulting
 */

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { Network } from 'vis-network'
import type { Options, Data } from 'vis-network'
import { DataSet } from 'vis-data'
import { useDashboardStore } from '../stores/dashboardStore'
import type { GraphNode, NodeType } from '../schemas'

// Node colors matching backend schema (7 types, WCAG AA compliant)
const NODE_COLORS: Record<NodeType, string> = {
  StakeholderReq: '#4A90D9',   // Blue
  SystemReq: '#7CB342',        // Green
  SoftwareReq: '#FF9800',      // Orange
  HardwareReq: '#0EA5E9',      // Sky
  TestCase: '#BA68C8',         // Purple (WCAG AA, was #9C27B0)
  InputSpec: '#a1887f',        // Brown (WCAG AA, was #795548)
  Komponente: '#78909c',       // Gray-blue (WCAG AA)
  Regel: '#A855F7',            // Violet
}

const NODE_SHAPES: Record<NodeType, string> = {
  StakeholderReq: 'box',
  SystemReq: 'box',
  SoftwareReq: 'box',
  HardwareReq: 'box',
  TestCase: 'diamond',
  InputSpec: 'triangle',
  Komponente: 'hexagon',
  Regel: 'square',
}

interface VisNode {
  id: string
  label: string
  color: string
  shape: string
  size: number
  font: { color: string }
  borderWidth: number
  borderWidthSelected: number
}

interface VisEdge {
  id: string
  from: string
  to: string
  label?: string
  width: number
  color: { color: string; opacity: number }
  arrows: { to: { enabled: boolean; scaleFactor: number } }
}

export function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  const nodesDataSetRef = useRef<DataSet<VisNode> | null>(null)
  const edgesDataSetRef = useRef<DataSet<VisEdge> | null>(null)

  const graphData = useDashboardStore((s) => s.graphData)
  const filters = useDashboardStore((s) => s.filters)
  const highlightedNodes = useDashboardStore((s) => s.highlightedNodes)
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId)
  const selectNode = useDashboardStore((s) => s.selectNode)

  // Memoize filtered nodes to prevent infinite loop
  const filteredNodes = useMemo(() => {
    const { nodes } = graphData
    const { nodeTypes, minPageRank, minDegree, searchQuery } = filters
    return nodes.filter((node) => {
      if (!nodeTypes.includes(node.type)) return false
      if (node.pageRank !== undefined && node.pageRank < minPageRank) return false
      if (node.degree !== undefined && node.degree < minDegree) return false
      if (searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [graphData, filters])

  // Convert nodes to vis-network format (use hex colors - CSS vars don't work on canvas)
  const convertNodes = useCallback(
    (nodes: GraphNode[]): VisNode[] => {
      return nodes.map((node) => {
        const isHighlighted = highlightedNodes.has(node.id)
        const isSelected = selectedNodeId === node.id
        return {
          id: node.id,
          label: node.id,
          color: isHighlighted ? '#fbbf24' : NODE_COLORS[node.type], // Brighter yellow when highlighted
          shape: NODE_SHAPES[node.type],
          size: 25 + (node.centrality || 0) * 30,
          font: { color: '#ffffff' },
          borderWidth: isHighlighted ? 4 : isSelected ? 3 : 2, // Thicker border when highlighted
          borderWidthSelected: 5,
        }
      })
    },
    [highlightedNodes, selectedNodeId]
  )

  // Initialize network
  useEffect(() => {
    if (!containerRef.current) return

    nodesDataSetRef.current = new DataSet<VisNode>([])
    edgesDataSetRef.current = new DataSet<VisEdge>([])

    const data: Data = {
      nodes: nodesDataSetRef.current,
      edges: edgesDataSetRef.current,
    }

    const options: Options = {
      autoResize: true,
      height: '100%',
      width: '100%',
      nodes: {
        font: {
          size: 14,
          color: '#ffffff', // Plain white, no stroke
          face: 'Inter, system-ui, sans-serif',
        },
        borderWidth: 2,
        borderWidthSelected: 5,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.4)',
          size: 6,
          x: 2,
          y: 2,
        },
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5,
        },
        font: {
          size: 9,
          color: '#94a3b8',
          face: 'Inter, system-ui, sans-serif',
          align: 'middle',
          strokeWidth: 0, // No outline
        },
        color: {
          color: '#64748b',
          highlight: '#f8fafc',
          hover: '#94a3b8',
          inherit: false,
        },
        width: 1.5,
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 0.5,
        },
        stabilization: {
          enabled: true,
          iterations: 200,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        multiselect: false,
        navigationButtons: true,
        keyboard: {
          enabled: true,
          speed: { x: 10, y: 10, zoom: 0.02 },
        },
      },
    }

    const network = new Network(containerRef.current, data, options)
    networkRef.current = network

    // Event handlers
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        selectNode(params.nodes[0] as string)
      } else {
        selectNode(null)
      }
    })

    network.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        network.focus(params.nodes[0], {
          scale: 1.5,
          animation: { duration: 500, easingFunction: 'easeInOutQuad' },
        })
      }
    })

    return () => {
      network.destroy()
      networkRef.current = null
    }
  }, [selectNode])

  // Update nodes when data changes
  useEffect(() => {
    if (!nodesDataSetRef.current || !edgesDataSetRef.current) return

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))

    // Update nodes
    const visNodes = convertNodes(filteredNodes)
    nodesDataSetRef.current.clear()
    nodesDataSetRef.current.add(visNodes)

    // Update edges (only show edges where both nodes are visible)
    const visEdges: VisEdge[] = graphData.edges
      .filter((e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to))
      .map((edge) => ({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.type, // Show relationship type as label
        width: 2,
        color: {
          color: '#94a3b8', // Visible gray on dark background
          opacity: 0.8,
        },
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      }))

    edgesDataSetRef.current.clear()
    edgesDataSetRef.current.add(visEdges)
  }, [filteredNodes, graphData.edges, convertNodes])

  // Handle highlighting changes
  useEffect(() => {
    if (!nodesDataSetRef.current) return

    const updates = filteredNodes.map((node) => {
      const isHighlighted = highlightedNodes.has(node.id)
      const isSelected = selectedNodeId === node.id
      return {
        id: node.id,
        color: isHighlighted ? '#fbbf24' : NODE_COLORS[node.type],
        borderWidth: isHighlighted ? 4 : isSelected ? 3 : 2,
      }
    })

    nodesDataSetRef.current.update(updates)
  }, [highlightedNodes, selectedNodeId, filteredNodes])

  // Fit to view when nodes significantly change
  useEffect(() => {
    if (networkRef.current && filteredNodes.length > 0) {
      setTimeout(() => {
        networkRef.current?.fit({
          animation: { duration: 500, easingFunction: 'easeInOutQuad' },
        })
      }, 100)
    }
  }, [filteredNodes.length])

  return (
    <div className="relative h-full w-full" data-testid="graph-view">
      <div
        ref={containerRef}
        className="h-full w-full bg-[var(--color-background)]"
        data-testid="graph-canvas"
      />

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 rounded-lg bg-[var(--color-surface)] p-3 shadow-lg"
        data-testid="graph-legend"
      >
        <h4 className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)]">
          Node Types
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div
              key={type}
              className="flex items-center gap-2"
              data-testid={`legend-${type}`}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs capitalize text-[var(--color-text-muted)]">
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div
        className="absolute right-4 top-4 rounded-lg bg-[var(--color-surface)] px-3 py-2 shadow-lg"
        data-testid="graph-stats"
      >
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-[var(--color-text-muted)]">Nodes: </span>
            <span
              className="font-medium text-[var(--color-text-primary)]"
              data-testid="node-count"
            >
              {filteredNodes.length}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)]">Edges: </span>
            <span
              className="font-medium text-[var(--color-text-primary)]"
              data-testid="edge-count"
            >
              {graphData.edges.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GraphView
