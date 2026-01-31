/**
 * Neo4j Connection Management
 * @author andreas@siglochconsulting
 *
 * Database connection, verification, and security checks
 */

import neo4j, { Driver } from 'neo4j-driver';

// Neo4j connection configuration
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'demo-password';

// Expected database fingerprint - Demo data must contain these markers
const EXPECTED_FINGERPRINT = {
  requiredLabels: ['StakeholderReq', 'SystemReq', 'SoftwareReq', 'TestCase'],
  markerNode: 'STK-001',
  markerProperty: 'Abbiegeabsicht'
};

/**
 * Verify this is the correct demo database (not production!)
 */
async function verifyDemoDatabase(d: Driver): Promise<boolean> {
  const session = d.session({ defaultAccessMode: 'READ' });

  try {
    // Check 1: Verify marker node exists with expected content
    const markerResult = await session.run(
      `MATCH (n {id: $markerId})
       WHERE n.titel CONTAINS $markerProperty
       RETURN n.id AS id`,
      { markerId: EXPECTED_FINGERPRINT.markerNode, markerProperty: EXPECTED_FINGERPRINT.markerProperty }
    );

    if (markerResult.records.length === 0) {
      console.error('❌ SECURITY: Marker node STK-001 not found or wrong content');
      console.error('   This may not be the demo database!');
      return false;
    }

    // Check 2: Verify expected labels exist
    const labelResult = await session.run(
      `CALL db.labels() YIELD label RETURN collect(label) AS labels`
    );

    const existingLabels = labelResult.records[0]?.get('labels') as string[] || [];
    const missingLabels = EXPECTED_FINGERPRINT.requiredLabels.filter(
      l => !existingLabels.includes(l)
    );

    if (missingLabels.length > 0) {
      console.error('❌ SECURITY: Missing expected labels:', missingLabels.join(', '));
      console.error('   This may not be the demo database!');
      return false;
    }

    // Check 3: Verify node count is reasonable for demo (not a huge production DB)
    const countResult = await session.run(`MATCH (n) RETURN count(n) AS total`);
    const nodeCount = countResult.records[0]?.get('total').toNumber() || 0;

    if (nodeCount > 1000) {
      console.error('❌ SECURITY: Too many nodes (' + nodeCount + ')');
      console.error('   Demo database should have ~26-50 nodes. This looks like production!');
      return false;
    }

    console.error('✅ SECURITY: Database fingerprint verified');
    console.error('   - Marker node STK-001: found');
    console.error('   - Required labels: all present');
    console.error('   - Node count: ' + nodeCount + ' (within demo range)');

    return true;
  } finally {
    await session.close();
  }
}

/**
 * Initialize Neo4j connection with security verification
 */
export async function initNeo4j(): Promise<Driver> {
  const d = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

  // Verify connectivity
  await d.verifyConnectivity();
  console.error('Connected to Neo4j at', NEO4J_URI);

  // SECURITY: Verify this is the demo database
  const isDemo = await verifyDemoDatabase(d);
  if (!isDemo) {
    await d.close();
    throw new Error('SECURITY: Connected database is not the demo database. Refusing to continue.');
  }

  return d;
}
