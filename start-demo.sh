#!/bin/bash
# =====================================================
# Demo Startup Script - Requirements Traceability
# =====================================================

set -e

DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DEMO_DIR"

echo "🚀 Starting Requirements Traceability Demo..."
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker ist nicht installiert!"
    exit 1
fi

# Start Neo4j
echo "📦 Starting Neo4j..."
docker-compose up -d

# Wait for Neo4j to be ready
echo "⏳ Waiting for Neo4j to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:7484 > /dev/null 2>&1; then
        echo "✅ Neo4j is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Neo4j did not start in time"
        exit 1
    fi
    sleep 2
done

# Load seed data
echo "📊 Loading seed data..."
docker exec req-traceability-neo4j cypher-shell -u neo4j -p demo-password \
    "$(cat seed-data.cypher)" 2>/dev/null || true

# Verify data
echo ""
echo "📈 Verifying data..."
NODE_COUNT=$(docker exec req-traceability-neo4j cypher-shell -u neo4j -p demo-password \
    "MATCH (n) RETURN count(n) AS count" 2>/dev/null | tail -1 | tr -d ' ')

echo "   Nodes in database: $NODE_COUNT"

if [ "$NODE_COUNT" -gt "15" ]; then
    echo "✅ Seed data loaded successfully!"
else
    echo "⚠️  Seed data may not be fully loaded. Check manually."
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Demo is ready!"
echo ""
echo "📍 Neo4j Browser: http://localhost:7484"
echo "   Username: neo4j"
echo "   Password: demo-password"
echo ""
echo "📋 Quick Test Queries:"
echo "   MATCH (n) RETURN count(n)"
echo "   MATCH (sys:SystemReq) RETURN sys.id, sys.titel"
echo ""
echo "🔧 Claude Desktop MCP-Server:"
echo "   Ensure neo4j-requirements is configured in"
echo "   ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "═══════════════════════════════════════════════════"
