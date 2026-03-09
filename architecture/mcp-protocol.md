# MCP Protocol Implementation Guide

**Version:** 1.0.0  
**Date:** March 6, 2026  
**Status:** Production Ready  
**Reference:** https://spec.modelcontextprotocol.io

---

## Overview

Aitlas implements the Model Context Protocol (MCP) for inter-service communication. Every Action (f.xyz) exposes an MCP endpoint at `/api/mcp` following JSON-RPC 2.0 specification.

---

## JSON-RPC 2.0 Format

All requests and responses follow JSON-RPC 2.0:

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_twitter",
    "arguments": {
      "query": "AI agents",
      "limit": 10
    }
  }
}
```

### Success Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "data": "Results found..."
      }
    ]
  }
}
```

### Error Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": {}
  }
}
```

---

## Standard Methods

### initialize

Initialize MCP session with client capabilities.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "Nexus",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "serverInfo": {
      "name": "Aitlas MCP Server",
      "version": "1.0.0"
    }
  }
}
```

### tools/list

List all available tools.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "search_twitter",
        "description": "Search Twitter for tweets",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": { "type": "string" },
            "limit": { "type": "number", "default": 10 }
          },
          "required": ["query"]
        }
      }
    ]
  }
}
```

### tools/call

Execute a specific tool.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "search_twitter",
    "arguments": {
      "query": "AI agents 2026",
      "limit": 5
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "data": "{\"tweets\": [...]}"
      }
    ]
  }
}
```

### resources/list

List available resources.

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "resources": [
      {
        "uri": "aitlas://users/profile",
        "name": "User Profile",
        "description": "Current user profile data"
      }
    ]
  }
}
```

### prompts/list

List available prompts.

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "prompts": []
  }
}
```

### ping

Health check.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "ping",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "message": "pong"
  }
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Not valid JSON-RPC |
| -32601 | Method not found | Method doesn't exist |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Server error |
| -32000 | Tool error | Tool execution failed |
| -32001 | Auth error | Authentication required |
| -32002 | Insufficient credits | Need more credits |

---

## Using the MCP Server

### Register a Tool

```typescript
import { MCPServer } from '@/lib/mcp/server';

const server = new MCPServer();

server.registerTool({
  name: 'my_tool',
  description: 'Does something useful',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' },
      count: { type: 'number', default: 10 },
    },
    required: ['input'],
  },
  creditCost: 2,
  handler: async (params) => {
    const result = await processInput(params.input, params.count);
    return result;
  },
});
```

### Handle Requests

```typescript
// In API route
import { MCPServer, parseMCPRequest } from '@/lib/mcp/server';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = parseMCPRequest(body);
  
  if (!parsed.valid) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id ?? null,
      error: parsed.error,
    });
  }
  
  const result = await server.handleRequest(parsed.request, {
    userId: session.user.id,
  });
  
  return NextResponse.json(result);
}
```

### Credit Integration

```typescript
server.setCreditMiddleware(async ({ userId, amount, reason }) => {
  const result = await deductCredits({
    userId,
    amount,
    reason: `mcp:${reason}`,
  });
  
  return { success: result.success };
});
```

---

## Authentication

### User Session Auth

```typescript
const session = await auth.api.getSession({
  headers: request.headers,
});

if (!session?.user) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: null,
    error: { code: -32001, message: 'Auth required' },
  });
}
```

### Service Token Auth

For cross-service calls (Nexus → f.twyt):

```typescript
import { validateServiceSession, generateServiceToken } from '@/lib/auth-bridge';

// In Nexus
const token = generateServiceToken({
  serviceId: 'nexus',
  userId: user.id,
  secret: process.env.FURMA_INTERNAL_SECRET,
});

// In f.twyt
const result = await validateServiceSession(token, {
  allowedServices: ['nexus', 'agents', 'Nexus runtime'],
  secret: process.env.FURMA_INTERNAL_SECRET,
});

if (!result.valid) {
  return error;
}
```

---

## Client Implementation

### Using fetch

```typescript
async function callMCPTool(
  endpoint: string,
  tool: string,
  args: Record<string, unknown>,
  token: string
) {
  const response = await fetch(`${endpoint}/api/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: tool,
        arguments: args,
      },
    }),
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return data.result;
}
```

### Using MCP Client Library

```typescript
import { createMCPClient } from '@/lib/mcp/client';

const client = createMCPClient({
  endpoint: 'https://f.twyt.xyz',
  authToken: sessionToken,
});

const tools = await client.listTools();
const result = await client.callTool('search_twitter', {
  query: 'AI agents',
  limit: 10,
});
```

---

## Testing

```bash
bun test __tests__/mcp/server.test.ts
```

---

## Best Practices

1. **Always validate input** - Use inputSchema with JSON Schema
2. **Handle errors gracefully** - Return proper error codes
3. **Log tool calls** - Use structured logging
4. **Rate limit** - Protect against abuse
5. **Document tools** - Clear descriptions and examples
6. **Version your API** - Use protocolVersion

---

## Examples

### f.twyt MCP Server

```typescript
// app/api/mcp/route.ts
import { MCPServer } from '@/lib/mcp/server';
import { deductCredits } from '@/lib/credit-middleware';

const server = new MCPServer();

server.registerTool({
  name: 'search_twitter',
  description: 'Search Twitter for tweets matching a query',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      limit: { type: 'number', default: 10, description: 'Max results' },
    },
    required: ['query'],
  },
  creditCost: 1,
  handler: async (params) => {
    return await searchTweets(params.query, params.limit);
  },
});

server.registerTool({
  name: 'get_user_timeline',
  description: 'Get tweets from a specific user',
  inputSchema: {
    type: 'object',
    properties: {
      username: { type: 'string' },
      count: { type: 'number', default: 20 },
    },
    required: ['username'],
  },
  creditCost: 1,
  handler: async (params) => {
    return await getUserTimeline(params.username, params.count);
  },
});

export async function POST(request: Request) {
  // Handle MCP request
}
```

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering