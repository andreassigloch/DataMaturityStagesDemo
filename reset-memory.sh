#!/bin/bash
# Reset Learning Memory for Demo
# CR-009: Stufe 7 - Learning System
# @author andreas@siglochconsulting

set -e

NEO4J_URI="${NEO4J_URI:-bolt://localhost:7697}"
NEO4J_USER="${NEO4J_USER:-neo4j}"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-demo-password}"

echo "🧠 Resetting Learning Memory..."
echo "   URI: $NEO4J_URI"

# Delete all Feedback, Pattern, and LearningEvent nodes
cypher_query='
MATCH (f:Feedback) DETACH DELETE f;
MATCH (p:Pattern) DETACH DELETE p;
MATCH (le:LearningEvent) DETACH DELETE le;
'

echo "$cypher_query" | cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" 2>/dev/null || {
    echo "   Using docker exec..."
    docker exec req-traceability-neo4j cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" "$cypher_query"
}

echo "✅ Learning Memory reset complete"
echo "   - Feedback nodes: deleted"
echo "   - Pattern nodes: deleted"
echo "   - LearningEvent nodes: deleted"
echo ""
echo "Das System hat jetzt ein leeres Gedächtnis und kann in der Demo neu lernen."
