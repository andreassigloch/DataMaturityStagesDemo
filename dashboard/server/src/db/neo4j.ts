/**
 * Neo4j Database Connection
 * @author andreas@siglochconsulting
 */

import neo4j, { Driver, Session } from 'neo4j-driver';

// Configuration from environment or defaults
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7697';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'demo-password';

let driver: Driver | null = null;

/**
 * Initialize Neo4j driver connection
 */
export async function initNeo4j(): Promise<Driver> {
  if (driver) {
    return driver;
  }

  driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30000,
    }
  );

  await driver.verifyConnectivity();
  console.log(`[Neo4j] Connected to ${NEO4J_URI}`);

  return driver;
}

/**
 * Get the Neo4j driver instance
 */
export function getDriver(): Driver {
  if (!driver) {
    throw new Error('Neo4j driver not initialized. Call initNeo4j() first.');
  }
  return driver;
}

/**
 * Get a read-only session
 */
export function getReadSession(): Session {
  return getDriver().session({ defaultAccessMode: neo4j.session.READ });
}

/**
 * Get a write session
 */
export function getWriteSession(): Session {
  return getDriver().session({ defaultAccessMode: neo4j.session.WRITE });
}

/**
 * Close the Neo4j connection
 */
export async function closeNeo4j(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('[Neo4j] Connection closed');
  }
}

/**
 * Convert Neo4j Integer to number
 */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'low' in value) {
    return (value as { low: number; high: number }).low;
  }
  return 0;
}

/**
 * Serialize Neo4j node properties
 */
export function serializeProperties(props: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
      result[key] = toNumber(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
