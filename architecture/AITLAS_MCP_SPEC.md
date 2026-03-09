# Aitlas MCP Specification

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**File:** `AITLAS_MCP_SPEC.md`
**Protocol:** MCP over HTTP
**Version:** 1.0
**Last Updated:** March 2026

---

## Overview


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


The **Aitlas MCP Specification** defines how:

- Agents
- Aitlas Actions (`f.xyz`)
- Third-party MCP servers

communicate using the **Model Context Protocol (MCP)**.

This specification ensures:

- Interoperability between agents and tools
- Strict schema validation
- Predictable error handling
- Streaming compatibility
- Forward compatibility with emerging agent ecosystems

> **All Aitlas services MUST comply with this specification.**

---

## Protocol Foundation


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Aitlas MCP is based on:

| Standard | Purpose |
|----------|---------|
| JSON-RPC 2.0 | Request/response structure |
| HTTP Streaming | Streaming tool responses |
| JSON Schema | Tool input validation |
| MCP Protocol | Agent-tool interaction |

**Transport:**
```
HTTP POST
Content-Type: application/json
```

**Endpoint:**
```
/api/mcp
```

---

## Core MCP Methods


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Aitlas supports the following MCP methods:

| Method | Purpose |
|--------|---------|
| `tools/list` | List available tools |
| `tools/call` | Execute tool |
| `health` | Service health check |

---

## Request Format


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


All requests follow **JSON-RPC 2.0**.

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "req_123",
  "method": "tools/call",
  "params": {
    "name": "search_twitter",
    "arguments": {
      "query": "AI agents 2026",
      "limit": 10
    }
  }
}
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `jsonrpc` | yes | Must be `"2.0"` |
| `id` | yes | Request identifier |
| `method` | yes | MCP method |
| `params` | optional | Method parameters |

---

## Tool Discovery


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Agents discover tools via:

```
tools/list
```

**Example request:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/list"
}
```

**Example response:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "tools": [
      {
        "name": "search_twitter",
        "description": "Semantic search across Twitter/X",
        "input_schema": {
          "type": "object",
          "properties": {
            "query": { "type": "string" },
            "limit": { "type": "number" }
          },
          "required": ["query"]
        }
      }
    ]
  }
}
```

---

## Tool Schema Conventions


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


All tools **must define JSON Schema input definitions**.

**Required fields:**

| Field | Description |
|-------|-------------|
| `name` | Unique tool name |
| `description` | Short natural language description |
| `input_schema` | JSON Schema object |

**Example schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50
    }
  },
  "required": ["query"]
}
```

**Rules:**

- Schemas must be **deterministic**
- Avoid `any` types
- Enforce **limits where possible**
- Descriptions must be agent-friendly

---

## Tool Naming Rules


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Tool names must follow:

```
snake_case
```

**Examples:**
```
search_twitter
create_ticket
deep_research
vector_search
deploy_microvm
```

**Avoid:**
```
camelCase
PascalCase
verbsWithNoContext
```

---

## Tool Execution


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Tool execution uses:

```
tools/call
```

**Example request:**
```json
{
  "jsonrpc": "2.0",
  "id": "tool_call_1",
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

---

## Tool Result Format


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Successful responses must return:

```json
{
  "jsonrpc": "2.0",
  "id": "tool_call_1",
  "result": {
    "content": {
      "tweets": [...]
    }
  }
}
```

**Rules:**

- `result` must be an object
- Avoid deeply nested responses
- Avoid large payloads (>1MB)

---

## Error Handling


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Errors must follow **JSON-RPC error structure**.

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "tool_call_1",
  "error": {
    "code": -32001,
    "message": "Tool execution failed",
    "data": {
      "reason": "Twitter API timeout"
    }
  }
}
```

**Standard error codes:**

| Code | Meaning |
|------|---------|
| `-32600` | Invalid request |
| `-32601` | Method not found |
| `-32602` | Invalid params |
| `-32603` | Internal error |

**Aitlas-specific errors:**

| Code | Meaning |
|------|---------|
| `-32001` | Tool execution error |
| `-32002` | Authentication failed |
| `-32003` | Credits exceeded |
| `-32004` | Rate limit reached |

---

## Authentication


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


All Aitlas actions require:

```
Authorization: Bearer <session_token>
```

**Token source:** Furma ID (BetterAuth)

Actions validate tokens via:

```
auth-bridge
```

**Unauthorized request:**
```json
{
  "error": {
    "code": -32002,
    "message": "Authentication failed"
  }
}
```

---

## Streaming Responses


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Some tools produce **large or long-running outputs**.

Aitlas supports **HTTP streaming responses**.

**Streaming format:**
```
Content-Type: text/event-stream
```

**Example:**
```
event: chunk
data: {"text": "Researching sources..."}

event: chunk
data: {"text": "Analyzing results..."}

event: done
data: {"report": "..."}
```

**Streaming rules:**

- Chunk size ≤ 32KB
- Final message must be `done`
- No partial JSON objects

---

## Timeouts


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Recommended tool execution limits:

| Tool Type | Timeout |
|-----------|---------|
| Search | 5 seconds |
| API calls | 10 seconds |
| Research tools | 60 seconds |

Long tasks must be delegated to:

```
Nexus runtime
```

---

## Agent Compatibility


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Aitlas MCP servers must work with:

| Agent System |
|--------------|
| OpenClaw |
| OpenCode |
| LangGraph |
| Claude Code |
| Autogen |
| CrewAI |
| Semantic Kernel |

**Compatibility rules:**

- Deterministic tool schemas
- Consistent response structures
- Predictable error handling

---

## Tool Best Practices


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Tools should:

- Do **one task well**
- Have **clear parameters**
- Avoid hidden behavior
- Return **structured results**

**Bad tool:**
```
do_everything
```

**Good tools:**
```
search_twitter
summarize_tweets
extract_entities
```

---

## Versioning


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Every action must declare:

```
x-aitlas-version
```

**Example:**
```
x-aitlas-version: 1.0
```

Versioning allows agents to adapt to API changes.

---

## Rate Limiting


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Default rate limits:

| Endpoint | Limit |
|----------|-------|
| `tools/list` | 60/min |
| `tools/call` | 120/min |

**Exceeded limit:**
```
error code -32004
```

---

## Observability


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


All tool calls must log:

- Tool name
- Execution duration
- Credits used
- User ID

**Example log:**
```json
{
  "tool": "search_twitter",
  "user_id": "usr_123",
  "credits": 1,
  "duration_ms": 140
}
```

---

## Security Guidelines


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**Actions must:**

- Validate tool parameters
- Sanitize external data
- Enforce credit limits
- Restrict outbound requests

**Never allow tools to:**

- Execute arbitrary shell commands
- Expose secrets
- Bypass authentication

---

## Compliance


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


All Aitlas actions must pass:

```
mcp-validator
```

**Checklist:**

- ✔ Valid JSON-RPC
- ✔ Valid JSON Schema
- ✔ Deterministic tool outputs
- ✔ Proper error handling
- ✔ Auth enforcement

---

## Future Extensions


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Planned MCP enhancements:

- Tool metadata
- Tool categories
- Tool cost hints
- Streaming tool execution
- Parallel tool calls

---

## Summary


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


The **Aitlas MCP Spec** ensures:

- Stable agent integrations
- Predictable tool behavior
- Scalable action architecture

> **It is the core interoperability contract of the Aitlas ecosystem.**

---

## Next Critical Document


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**`AITLAS_TOOL_DESIGN_GUIDE.md`** covers:

- How to design **tools agents actually use correctly**
- Parameter design patterns
- Avoiding **hallucinated tool calls**
- Designing tools for **Claude / GPT / open agents simultaneously**

This is **one of the hardest problems in agent infrastructure**, and most platforms get it wrong.