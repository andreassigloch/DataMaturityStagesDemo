#!/usr/bin/env node
/**
 * Neo4j MCP Server - Requirements Traceability
 * @author andreas@siglochconsulting
 *
 * MCP server providing tools for requirements management,
 * validation, and learning in Neo4j graph database.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Driver } from 'neo4j-driver';

import { initNeo4j } from './connection.js';
import { toolDefinitions, handleToolCall } from './tools/registry.js';

let driver: Driver;

// Create MCP server
const server = new Server(
  {
    name: 'neo4j-requirements-traceability',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: toolDefinitions };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return handleToolCall(driver, name, args as Record<string, unknown> | undefined);
});

// Main entry point
async function main() {
  try {
    driver = await initNeo4j();

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Neo4j MCP Server running');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  if (driver) await driver.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down...');
  if (driver) await driver.close();
  process.exit(0);
});

main();
