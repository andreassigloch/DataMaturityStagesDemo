# CR-009 Architecture Specification

**Status:** Ready for Implementation
**Author:** andreas@siglochconsulting
**Date:** 2026-01-28

---

## 1. Directory Structure

```
DataMaturityStages/
├── docker-compose.yml              # Modified: Add GDS plugin
├── seed-data.cypher                # Unchanged
├── reset-memory.sh                 # NEW: Reset learning data
│
├── neo4j-mcp/
│   ├── src/
│   │   ├── index.ts                # Modified: Register 7 new tools
│   │   ├── schemas/
│   │   │   └── index.ts            # NEW: Shared Zod schemas
│   │   └── tools/
│   │       ├── query.ts            # Existing
│   │       ├── validate.ts         # Existing
│   │       ├── impact-analysis.ts  # Existing
│   │       ├── rules.ts            # Existing
│   │       ├── compliance-score.ts # Existing
│   │       ├── centrality.ts       # NEW: PageRank, Betweenness
│   │       ├── predict-links.ts    # NEW: Link Prediction
│   │       ├── similarity.ts       # NEW: Node Similarity
│   │       ├── record-feedback.ts  # NEW: Store feedback
│   │       ├── detect-patterns.ts  # NEW: Pattern recognition
│   │       ├── learning-timeline.ts# NEW: Timeline query
│   │       └── memory-stats.ts     # NEW: Statistics
│   └── package.json                # Modified: Add zod dependency
│
└── dashboard/
    ├── package.json                # Modified: Add dependencies
    ├── vite.config.ts              # Modified: Proxy config
    ├── tsconfig.json               # Existing
    │
    ├── server/                     # NEW: Backend
    │   ├── index.ts                # Express entry point
    │   ├── neo4j.ts                # Driver singleton
    │   └── routes/
    │       ├── graph.ts            # GET /api/graph
    │       ├── memory.ts           # GET /api/memory, POST /api/feedback
    │       └── events.ts           # GET /api/events (SSE)
    │
    └── src/
        ├── main.tsx                # Existing
        ├── App.tsx                 # Modified: Layout structure
        ├── styles/
        │   └── tokens.css          # NEW: Design tokens
        ├── schemas/
        │   └── index.ts            # NEW: Shared Zod schemas
        ├── hooks/
        │   ├── useSSE.ts           # NEW: SSE connection
        │   ├── useGraph.ts         # NEW: Graph data fetching
        │   └── useMemory.ts        # NEW: Memory state
        ├── components/
        │   ├── GraphView.tsx       # NEW: vis-network
        │   ├── MemoryTimeline.tsx  # NEW: Timeline
        │   ├── CentralityPanel.tsx # NEW: PageRank/Betweenness
        │   ├── PatternList.tsx     # NEW: Pattern cards
        │   └── Legend.tsx          # NEW: Graph legend
        └── types/
            └── vis-network.d.ts    # NEW: Type declarations
```

---

## 2. Zod Schema Definitions

### 2.1 Shared MCP Schemas (`neo4j-mcp/src/schemas/index.ts`)

```typescript
import { z } from 'zod';

// Node types from seed-data.cypher
export const NodeTypeSchema = z.enum([
  'StakeholderReq',
  'SystemReq',
  'SoftwareReq',
  'TestCase',
  'Komponente',
  'InputSpec',
  'Regel',
  'Feedback',
  'Pattern',
  'LearningEvent'
]);
export type NodeType = z.infer<typeof NodeTypeSchema>;

// Relationship types
export const RelationshipTypeSchema = z.enum([
  'TRACED_TO',
  'VERIFIED_BY',
  'IMPLEMENTED_IN',
  'DEPENDS_ON',
  'MATCHES_PATTERN',
  'TRIGGERED_BY'
]);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

// --- Centrality Analysis ---

export const CentralityAlgorithmSchema = z.enum([
  'pageRank',
  'betweenness',
  'degree'
]);
export type CentralityAlgorithm = z.infer<typeof CentralityAlgorithmSchema>;

export const CentralityInputSchema = z.object({
  algorithm: CentralityAlgorithmSchema.optional().default('pageRank'),
  labelFilter: NodeTypeSchema.array().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10)
});
export type CentralityInput = z.infer<typeof CentralityInputSchema>;

export const CentralityNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: NodeTypeSchema,
  score: z.number()
});

export const CentralityResultSchema = z.object({
  algorithm: CentralityAlgorithmSchema,
  nodes: CentralityNodeSchema.array(),
  summary: z.object({
    nodeCount: z.number(),
    avgScore: z.number(),
    maxScore: z.number()
  })
});
export type CentralityResult = z.infer<typeof CentralityResultSchema>;

// --- Link Prediction ---

export const PredictLinksInputSchema = z.object({
  confidenceThreshold: z.number().min(0).max(1).optional().default(0.5),
  limit: z.number().int().min(1).max(20).optional().default(10)
});
export type PredictLinksInput = z.infer<typeof PredictLinksInputSchema>;

export const PredictedLinkSchema = z.object({
  sourceId: z.string(),
  sourceLabel: z.string(),
  sourceType: NodeTypeSchema,
  targetId: z.string(),
  targetLabel: z.string(),
  targetType: NodeTypeSchema,
  confidence: z.number(),
  reason: z.string()
});

export const PredictLinksResultSchema = z.object({
  predictions: PredictedLinkSchema.array(),
  summary: z.object({
    predictedCount: z.number(),
    avgConfidence: z.number()
  })
});
export type PredictLinksResult = z.infer<typeof PredictLinksResultSchema>;

// --- Node Similarity ---

export const SimilarityInputSchema = z.object({
  requirementId: z.string(),
  threshold: z.number().min(0).max(1).optional().default(0.5),
  limit: z.number().int().min(1).max(10).optional().default(5)
});
export type SimilarityInput = z.infer<typeof SimilarityInputSchema>;

export const SimilarNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: NodeTypeSchema,
  similarity: z.number(),
  sharedNeighbors: z.number()
});

export const SimilarityResultSchema = z.object({
  sourceId: z.string(),
  sourceLabel: z.string(),
  similarNodes: SimilarNodeSchema.array()
});
export type SimilarityResult = z.infer<typeof SimilarityResultSchema>;

// --- Feedback Recording (Stufe 7) ---

export const FeedbackTypeSchema = z.enum([
  'review',
  'quality',
  'clarification',
  'false_positive'
]);
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;

export const RecordFeedbackInputSchema = z.object({
  targetId: z.string(),
  type: FeedbackTypeSchema.optional().default('review'),
  issue: z.string().min(5).max(500)
});
export type RecordFeedbackInput = z.infer<typeof RecordFeedbackInputSchema>;

export const FeedbackNodeSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  type: FeedbackTypeSchema,
  issue: z.string(),
  resolved: z.boolean(),
  createdAt: z.string().datetime()
});

export const RecordFeedbackResultSchema = z.object({
  feedback: FeedbackNodeSchema,
  patternCandidate: z.object({
    name: z.string(),
    confidence: z.number(),
    matchCount: z.number()
  }).nullable()
});
export type RecordFeedbackResult = z.infer<typeof RecordFeedbackResultSchema>;

// --- Pattern Detection ---

export const PatternNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  regex: z.string(),
  description: z.string(),
  occurrences: z.number(),
  confidence: z.number(),
  status: z.enum(['confirmed', 'candidate']),
  lastSeen: z.string().datetime()
});

export const PatternMatchSchema = z.object({
  requirementId: z.string(),
  requirementLabel: z.string(),
  matchedText: z.string(),
  patternId: z.string(),
  patternName: z.string()
});

export const DetectPatternsResultSchema = z.object({
  newPatterns: PatternNodeSchema.array(),
  matches: PatternMatchSchema.array(),
  summary: z.object({
    totalMatches: z.number(),
    confirmedPatterns: z.number(),
    candidatePatterns: z.number()
  })
});
export type DetectPatternsResult = z.infer<typeof DetectPatternsResultSchema>;

// --- Learning Timeline ---

export const LearningEventTypeSchema = z.enum([
  'feedback_created',
  'pattern_detected',
  'pattern_confirmed',
  'pattern_candidate'
]);
export type LearningEventType = z.infer<typeof LearningEventTypeSchema>;

export const LearningEventSchema = z.object({
  id: z.string(),
  type: LearningEventTypeSchema,
  description: z.string(),
  confidence: z.number().nullable(),
  relatedId: z.string().nullable(),
  timestamp: z.string().datetime()
});

export const LearningTimelineInputSchema = z.object({
  since: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20)
});
export type LearningTimelineInput = z.infer<typeof LearningTimelineInputSchema>;

export const LearningTimelineResultSchema = z.object({
  events: LearningEventSchema.array(),
  summary: z.object({
    totalEvents: z.number(),
    byType: z.record(z.number())
  })
});
export type LearningTimelineResult = z.infer<typeof LearningTimelineResultSchema>;

// --- Memory Stats ---

export const MemoryStatsResultSchema = z.object({
  feedbackCount: z.number(),
  patternCount: z.number(),
  candidateCount: z.number(),
  eventCount: z.number(),
  avgConfidence: z.number(),
  topPatterns: PatternNodeSchema.array(),
  recentActivity: z.object({
    last24h: z.number(),
    last7d: z.number()
  })
});
export type MemoryStatsResult = z.infer<typeof MemoryStatsResultSchema>;
```

### 2.2 Dashboard API Schemas (`dashboard/src/schemas/index.ts`)

```typescript
import { z } from 'zod';

// --- Graph Data for vis-network ---

export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  group: z.string(),
  title: z.string().optional(),
  size: z.number().optional(),
  color: z.string().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional()
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  dashes: z.boolean().optional(),
  color: z.string().optional(),
  width: z.number().optional()
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

export const GraphDataSchema = z.object({
  nodes: GraphNodeSchema.array(),
  edges: GraphEdgeSchema.array(),
  metadata: z.object({
    nodeCount: z.number(),
    edgeCount: z.number(),
    lastUpdate: z.string().datetime()
  })
});
export type GraphData = z.infer<typeof GraphDataSchema>;

// --- Memory Dashboard ---

export const MemoryDashboardSchema = z.object({
  stats: z.object({
    feedbackCount: z.number(),
    patternCount: z.number(),
    candidateCount: z.number(),
    eventCount: z.number(),
    avgConfidence: z.number()
  }),
  patterns: z.array(z.object({
    id: z.string(),
    name: z.string(),
    confidence: z.number(),
    occurrences: z.number(),
    status: z.enum(['confirmed', 'candidate'])
  })),
  recentEvents: z.array(z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    timestamp: z.string().datetime()
  }))
});
export type MemoryDashboard = z.infer<typeof MemoryDashboardSchema>;

// --- SSE Event Types ---

export const SSEEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('graph_update'),
    data: GraphDataSchema
  }),
  z.object({
    type: z.literal('feedback_created'),
    data: z.object({
      feedbackId: z.string(),
      targetId: z.string(),
      issue: z.string()
    })
  }),
  z.object({
    type: z.literal('pattern_detected'),
    data: z.object({
      patternId: z.string(),
      name: z.string(),
      confidence: z.number(),
      matches: z.number()
    })
  }),
  z.object({
    type: z.literal('memory_update'),
    data: z.object({
      feedbackCount: z.number(),
      patternCount: z.number()
    })
  })
]);
export type SSEEvent = z.infer<typeof SSEEventSchema>;

// --- API Request/Response ---

export const FeedbackRequestSchema = z.object({
  targetId: z.string(),
  type: z.enum(['review', 'quality', 'clarification', 'false_positive']).optional(),
  issue: z.string().min(5).max(500)
});
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional()
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
```

---

## 3. Component Architecture

### 3.1 Dashboard Layout

```
+------------------------------------------------------------------+
|  Header: "Requirements Traceability Dashboard"        [Refresh]   |
+------------------------------------------------------------------+
|                                        |                          |
|                                        |  SIDEBAR (320px)         |
|                                        |  +--------------------+  |
|       GRAPH VIEW (flex-1)              |  | Legend             |  |
|       +---------------------------+    |  | - Node types       |  |
|       |                           |    |  | - Edge types       |  |
|       |    vis-network canvas     |    |  | - Size = PageRank  |  |
|       |                           |    |  +--------------------+  |
|       |                           |    |  | Tabs:              |  |
|       |                           |    |  | [Centrality]       |  |
|       |                           |    |  | [Patterns]         |  |
|       |                           |    |  | [Memory]           |  |
|       |                           |    |  |                    |  |
|       |                           |    |  | (Tab Content)      |  |
|       +---------------------------+    |  |                    |  |
|                                        |  +--------------------+  |
+------------------------------------------------------------------+
```

### 3.2 Component Tree

```
App.tsx
├── Header.tsx
│   └── RefreshButton (data-testid="refresh-button")
├── GraphView.tsx (data-testid="graph-view")
│   ├── vis-network canvas (data-testid="graph-canvas")
│   └── Tooltip (data-testid="node-tooltip")
└── Sidebar.tsx (data-testid="sidebar")
    ├── Legend.tsx (data-testid="legend")
    └── TabPanel.tsx (data-testid="tab-panel")
        ├── Tab: Centrality (data-testid="tab-centrality")
        │   └── CentralityPanel.tsx (data-testid="centrality-panel")
        │       ├── PageRankList (data-testid="pagerank-list")
        │       └── BetweennessList (data-testid="betweenness-list")
        ├── Tab: Patterns (data-testid="tab-patterns")
        │   └── PatternList.tsx (data-testid="pattern-list")
        │       └── PatternCard[] (data-testid="pattern-card-{id}")
        └── Tab: Memory (data-testid="tab-memory")
            └── MemoryTimeline.tsx (data-testid="memory-timeline")
                ├── StatsPanel (data-testid="memory-stats")
                └── EventList (data-testid="event-list")
```

### 3.3 State Management (Zustand)

```typescript
// dashboard/src/store/index.ts
import { create } from 'zustand';
import type { GraphData, MemoryDashboard } from '../schemas';

interface DashboardState {
  // Graph state
  graphData: GraphData | null;
  selectedNodeId: string | null;
  highlightedNodes: string[];

  // Memory state
  memoryData: MemoryDashboard | null;

  // UI state
  activeTab: 'centrality' | 'patterns' | 'memory';
  isLoading: boolean;
  error: string | null;

  // Actions
  setGraphData: (data: GraphData) => void;
  selectNode: (id: string | null) => void;
  highlightNodes: (ids: string[]) => void;
  setMemoryData: (data: MemoryDashboard) => void;
  setActiveTab: (tab: 'centrality' | 'patterns' | 'memory') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

---

## 4. GDS Query Patterns

### 4.1 Graph Projection (Required First)

```cypher
// Create in-memory graph projection for GDS algorithms
CALL gds.graph.project(
  'requirements-graph',
  ['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase', 'Komponente', 'InputSpec'],
  {
    TRACED_TO: { orientation: 'NATURAL' },
    VERIFIED_BY: { orientation: 'NATURAL' },
    IMPLEMENTED_IN: { orientation: 'NATURAL' },
    DEPENDS_ON: { orientation: 'NATURAL' }
  }
)
```

### 4.2 Centrality Analysis

```cypher
// PageRank - Find most important nodes
CALL gds.pageRank.stream('requirements-graph')
YIELD nodeId, score
WITH gds.util.asNode(nodeId) AS node, score
RETURN
  node.id AS id,
  COALESCE(node.titel, node.name) AS label,
  labels(node)[0] AS type,
  score
ORDER BY score DESC
LIMIT $limit

// Betweenness Centrality - Find bottlenecks
CALL gds.betweenness.stream('requirements-graph')
YIELD nodeId, score
WITH gds.util.asNode(nodeId) AS node, score
WHERE score > 0
RETURN
  node.id AS id,
  COALESCE(node.titel, node.name) AS label,
  labels(node)[0] AS type,
  score
ORDER BY score DESC
LIMIT $limit

// Degree Centrality - Count connections
CALL gds.degree.stream('requirements-graph')
YIELD nodeId, score
WITH gds.util.asNode(nodeId) AS node, score
RETURN
  node.id AS id,
  COALESCE(node.titel, node.name) AS label,
  labels(node)[0] AS type,
  score
ORDER BY score DESC
LIMIT $limit
```

### 4.3 Link Prediction

```cypher
// Find missing links using Common Neighbors score
MATCH (a), (b)
WHERE a <> b
  AND NOT (a)-[:TRACED_TO|VERIFIED_BY]-(b)
  AND (a:SoftwareReq OR a:SystemReq)
  AND (b:TestCase OR b:SystemReq OR b:SoftwareReq)
WITH a, b,
  gds.alpha.linkprediction.commonNeighbors(a, b) AS score
WHERE score >= $confidenceThreshold
RETURN
  a.id AS sourceId,
  COALESCE(a.titel, a.name) AS sourceLabel,
  labels(a)[0] AS sourceType,
  b.id AS targetId,
  COALESCE(b.titel, b.name) AS targetLabel,
  labels(b)[0] AS targetType,
  score AS confidence,
  CASE
    WHEN a:SoftwareReq AND b:TestCase THEN 'Missing test coverage'
    WHEN a:SystemReq AND b:SoftwareReq THEN 'Missing implementation trace'
    ELSE 'Structural similarity'
  END AS reason
ORDER BY score DESC
LIMIT $limit
```

### 4.4 Node Similarity

```cypher
// Jaccard similarity based on shared neighbors
MATCH (source {id: $requirementId})
CALL gds.nodeSimilarity.stream('requirements-graph')
YIELD node1, node2, similarity
WHERE gds.util.asNode(node1).id = $requirementId
WITH gds.util.asNode(node2) AS similar, similarity
WHERE similarity >= $threshold
RETURN
  similar.id AS id,
  COALESCE(similar.titel, similar.name) AS label,
  labels(similar)[0] AS type,
  similarity,
  size((similar)--()) AS sharedNeighbors
ORDER BY similarity DESC
LIMIT $limit
```

### 4.5 Learning System Queries

```cypher
// Record Feedback
CREATE (f:Feedback {
  id: 'FB-' + toString(timestamp()),
  targetId: $targetId,
  type: $type,
  issue: $issue,
  resolved: false,
  createdAt: datetime()
})
WITH f
MATCH (target {id: $targetId})
CREATE (f)-[:FEEDBACK_ON]->(target)
RETURN f

// Detect Patterns - Match regex against requirements
MATCH (r:SystemReq OR r:SoftwareReq)
WHERE r.beschreibung =~ $regex OR r.titel =~ $regex
WITH r, $patternId AS patternId, $patternName AS patternName
MATCH (r) WHERE r.beschreibung =~ $regex
RETURN
  r.id AS requirementId,
  COALESCE(r.titel, r.name) AS requirementLabel,
  // Extract matched text via APOC if available
  r.beschreibung AS fullText

// Get or create Pattern
MERGE (p:Pattern {name: $patternName})
ON CREATE SET
  p.id = 'PAT-' + toString(timestamp()),
  p.regex = $regex,
  p.description = $description,
  p.occurrences = 0,
  p.confidence = 0.5,
  p.status = 'candidate',
  p.lastSeen = datetime()
ON MATCH SET
  p.occurrences = p.occurrences + 1,
  p.lastSeen = datetime(),
  p.confidence = CASE
    WHEN p.occurrences >= 3 THEN 0.85
    ELSE p.confidence + 0.1
  END,
  p.status = CASE
    WHEN p.occurrences >= 3 THEN 'confirmed'
    ELSE 'candidate'
  END
RETURN p

// Learning Timeline
MATCH (e:LearningEvent)
WHERE e.timestamp >= datetime($since)
RETURN
  e.id AS id,
  e.type AS type,
  e.description AS description,
  e.confidence AS confidence,
  e.relatedId AS relatedId,
  toString(e.timestamp) AS timestamp
ORDER BY e.timestamp DESC
LIMIT $limit

// Memory Stats
MATCH (f:Feedback) WITH count(f) AS feedbackCount
MATCH (p:Pattern {status: 'confirmed'}) WITH feedbackCount, count(p) AS patternCount
MATCH (c:Pattern {status: 'candidate'}) WITH feedbackCount, patternCount, count(c) AS candidateCount
MATCH (e:LearningEvent) WITH feedbackCount, patternCount, candidateCount, count(e) AS eventCount
MATCH (p:Pattern) WITH feedbackCount, patternCount, candidateCount, eventCount, avg(p.confidence) AS avgConfidence
RETURN
  feedbackCount,
  patternCount,
  candidateCount,
  eventCount,
  COALESCE(avgConfidence, 0) AS avgConfidence
```

---

## 5. Docker-Compose GDS Integration

```yaml
# docker-compose.yml - Modified section
version: '3.8'

services:
  neo4j:
    image: neo4j:5-community
    container_name: req-traceability-neo4j
    ports:
      - "7484:7474"  # Neo4j Browser
      - "7697:7687"  # Bolt Protocol
    environment:
      - NEO4J_AUTH=neo4j/demo-password
      - NEO4J_PLUGINS=["apoc", "graph-data-science"]
      - NEO4J_dbms_security_procedures_unrestricted=apoc.*,gds.*
      - NEO4J_dbms_security_procedures_allowlist=apoc.*,gds.*
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
      - ./seed-data.cypher:/var/lib/neo4j/import/seed-data.cypher
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:7474"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

volumes:
  neo4j_data:
  neo4j_logs:
```

---

## 6. API Endpoints

### Backend Express Server (`dashboard/server/index.ts`)

| Method | Endpoint | Description | Response Schema |
|--------|----------|-------------|-----------------|
| GET | `/api/graph` | Full graph data for vis-network | `GraphDataSchema` |
| GET | `/api/graph/centrality` | PageRank + Betweenness data | `CentralityResultSchema` |
| GET | `/api/memory` | Dashboard memory stats | `MemoryDashboardSchema` |
| POST | `/api/feedback` | Record new feedback | `RecordFeedbackResultSchema` |
| GET | `/api/events` | SSE stream | `SSEEventSchema` |

### Port Configuration

| Service | Port | Purpose |
|---------|------|---------|
| Neo4j Browser | 7484 | Database admin |
| Neo4j Bolt | 7697 | Database connection |
| Dashboard Backend | 3001 | Express API |
| Dashboard Frontend | 5173 | Vite dev server |

---

## 7. Predefined Patterns

Seed these patterns for demo consistency:

```cypher
// Vage Zeitangabe - Matches <50ms, >100ms, etc.
CREATE (p:Pattern {
  id: 'PAT-TIME-VAGUE',
  name: 'Vage Zeitangabe',
  regex: '(<|>)\\s*\\d+\\s*(ms|s|min)',
  description: 'Zeitangaben mit < oder > sind oft nicht eindeutig testbar',
  occurrences: 0,
  confidence: 0.5,
  status: 'candidate',
  lastSeen: datetime()
})

// Unspezifizierte Bedingung - Matches "ohne Zuendung", "bei Fehler", etc.
CREATE (p:Pattern {
  id: 'PAT-CONDITION-VAGUE',
  name: 'Unspezifizierte Bedingung',
  regex: '(?i)(ohne|bei|wenn|falls)\\s+[a-zA-ZäöüÄÖÜ]+',
  description: 'Bedingungen ohne exakte Definition',
  occurrences: 0,
  confidence: 0.5,
  status: 'candidate',
  lastSeen: datetime()
})

// Missing Unit - Numbers without units
CREATE (p:Pattern {
  id: 'PAT-NO-UNIT',
  name: 'Fehlende Einheit',
  regex: '\\b\\d+\\b(?!\\s*(ms|s|min|N|cd|m|Hz|%))',
  description: 'Zahlenwerte ohne Einheitsangabe',
  occurrences: 0,
  confidence: 0.5,
  status: 'candidate',
  lastSeen: datetime()
})
```

---

## 8. Design Tokens

```css
/* dashboard/src/styles/tokens.css */
:root {
  /* Colors - Node Types */
  --color-stakeholder: #4A90D9;
  --color-system: #7CB342;
  --color-software: #FF9800;
  --color-testcase: #9C27B0;
  --color-inputspec: #795548;
  --color-pattern: #E91E63;
  --color-feedback: #00BCD4;

  /* Colors - UI */
  --color-primary: #1976D2;
  --color-secondary: #424242;
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #F44336;
  --color-background: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-border: #E0E0E0;

  /* Colors - Graph */
  --color-edge-traced: #90A4AE;
  --color-edge-verified: #81C784;
  --color-edge-implemented: #FFB74D;
  --color-edge-depends: #E57373;
  --color-edge-predicted: #F44336;
  --color-highlight: #FFEB3B;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Typography */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;

  /* Borders */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Graph sizing */
  --node-size-min: 10;
  --node-size-max: 40;
  --edge-width-default: 1;
  --edge-width-highlight: 3;
}
```

---

## 9. Package Dependencies

### neo4j-mcp/package.json additions

```json
{
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

### dashboard/package.json additions

```json
{
  "dependencies": {
    "vis-network": "^9.1.9",
    "vis-data": "^7.1.9",
    "zustand": "^4.5.0",
    "zod": "^3.23.0",
    "@tailwindcss/typography": "^0.5.10"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17",
    "@types/node": "^20.11.0",
    "concurrently": "^8.2.2"
  }
}
```

---

## 10. Reset Script

```bash
#!/bin/bash
# reset-memory.sh - Reset learning data for fresh demo

echo "Resetting learning memory..."

docker exec req-traceability-neo4j cypher-shell \
  -u neo4j -p demo-password \
  "MATCH (n) WHERE n:Feedback OR n:LearningEvent DETACH DELETE n;
   MATCH (p:Pattern) SET p.occurrences = 0, p.confidence = 0.5, p.status = 'candidate';"

echo "Memory reset complete."
```

---

## Architecture Decisions

### ADR-001: vis-network over Neovis.js
**Decision:** Use vis-network directly instead of Neovis.js
**Rationale:**
- Full control over rendering and updates
- SSE integration without WebSocket conflicts
- Better performance for 30-50 node graphs
- Same underlying library, less abstraction

### ADR-002: SSE over WebSocket
**Decision:** Use Server-Sent Events for real-time updates
**Rationale:**
- Simpler implementation (HTTP-based)
- Auto-reconnection built-in
- Sufficient for unidirectional updates
- Neo4j recommended approach

### ADR-003: Zustand over Redux
**Decision:** Use Zustand for state management
**Rationale:**
- Minimal boilerplate
- TypeScript-first
- Small bundle size
- Sufficient for dashboard scope

### ADR-004: GDS Community Edition
**Decision:** Use Neo4j GDS Community (free)
**Rationale:**
- All required algorithms included (PageRank, Betweenness, NodeSimilarity)
- Link Prediction via alpha procedures
- Demo graph is small (36 nodes)
- No enterprise features needed

---

## Implementation Order

1. **Phase 1: GDS Setup** (30 min)
   - Modify docker-compose.yml
   - Test GDS plugin loads
   - Create graph projection

2. **Phase 2: MCP Tools - Centrality + Similarity** (2h)
   - `centrality.ts`
   - `similarity.ts`
   - Register in index.ts

3. **Phase 3: MCP Tools - Link Prediction** (1h)
   - `predict-links.ts`
   - Test with demo data

4. **Phase 4: MCP Tools - Learning System** (2h)
   - `record-feedback.ts`
   - `detect-patterns.ts`
   - `learning-timeline.ts`
   - `memory-stats.ts`

5. **Phase 5: Dashboard Backend** (2h)
   - Express setup
   - Neo4j connection
   - REST endpoints
   - SSE endpoint

6. **Phase 6: Dashboard Frontend** (3h)
   - vis-network GraphView
   - Sidebar with tabs
   - MemoryTimeline component
   - SSE hook integration

7. **Phase 7: Integration + Polish** (1h)
   - Connect all components
   - Design token compliance
   - data-testid selectors
   - Reset script

**Total estimated: 12-14 hours**
