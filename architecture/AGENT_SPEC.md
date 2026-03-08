# Aitlas - Agent Specification

**Version:** 1.0.0  
**Date:** March 6, 2026  
**Status:** Production Design

---

## Overview

Agents in Aitlas are **real software agents**, not just prompts. They are installable packages with:

- Persona (base prompt)
- Tools (f.xyz actions + MCPs)
- Memory configuration
- Execution policy
- Pricing model

Think: **npm for AI Agents**

---

## Agent Package Structure

### `agent.json`

```json
{
  "name": "crypto-quant",
  "version": "1.0.0",
  "displayName": "The Crypto Quant",
  "description": "Autonomous crypto research and trading assistant",
  "author": "furma.tech",
  
  "persona": {
    "basePrompt": "You are a quantitative crypto researcher...",
    "systemPrompt": "...",
    "examples": []
  },
  
  "tools": {
    "native": ["f.rsrx", "f.twyt"],
    "mcp": ["coingecko.price", "twitter.search"],
    "fallback": {
      "f.rsrx": "Use web search instead"
    }
  },
  
  "memory": {
    "enabled": true,
    "types": ["episodic", "semantic"],
    "retention": "30d",
    "maxTokens": 10000
  },
  
  "execution": {
    "maxSteps": 15,
    "timeout": "30m",
    "retryPolicy": {
      "maxRetries": 3,
      "backoff": "exponential"
    },
    "safetyLimits": {
      "maxCreditsPerTask": 100,
      "maxExternalCalls": 50
    }
  },
  
  "pricing": {
    "model": "freemium",
    "credits": 10,
    "subscription": null
  },
  
  "metadata": {
    "category": "finance",
    "tags": ["crypto", "research", "trading"],
    "rating": 4.8,
    "installs": 1250
  }
}
```

---

## Agent Manifest Schema

### Persona

| Field | Type | Description |
|-------|------|-------------|
| `basePrompt` | string | Core behavior instructions |
| `systemPrompt` | string | Full system prompt (auto-generated if not provided) |
| `examples` | array | Few-shot examples for the agent |

### Tools

| Field | Type | Description |
|-------|------|-------------|
| `native` | array | f.xyz actions (high trust) |
| `mcp` | array | External MCP tools (variable trust) |
| `fallback` | object | Alternative logic if tool unavailable |

### Memory

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Enable memory layer |
| `types` | array | Memory types: episodic, semantic, state |
| `retention` | string | How long to keep memories |
| `maxTokens` | number | Max context window for memory |

### Execution

| Field | Type | Description |
|-------|------|-------------|
| `maxSteps` | number | Safety limit for Ralph Loop |
| `timeout` | string | Max execution time |
| `retryPolicy` | object | How to handle failures |
| `safetyLimits` | object | Credit/call limits |

### Pricing

| Model | Description |
|-------|-------------|
| `free` | No credits required |
| `freemium` | Free tier + paid upgrade |
| `credits` | Per-use credit cost |
| `subscription` | Monthly fee |

---

## Agent Installation Flow

```
1. User browses Agent Store
2. User clicks "Install Agent"
3. System checks:
   - User has sufficient credits?
   - Required tools available?
   - Compatible with user's plan?
4. Agent added to user's workspace
5. Agent appears in Nexus sidebar
```

---

## Agent Execution Flow

```
1. User invokes agent from Nexus
2. System creates Task
3. Loop Engine picks up task
4. Ralph Loop begins:
   ┌─────────────────────────────────────┐
   │ OBSERVE                             │
   │  - Load agent persona               │
   │  - Load available tools             │
   │  - Load memory context              │
   │                                     │
   │ REASON                              │
   │  - Call LLM (BYOK)                  │
   │  - LLM decides next action          │
   │                                     │
   │ ACT                                 │
   │  - Execute tool (MCP call)          │
   │  - Deduct credits if f.xyz tool     │
   │  - Log step                         │
   │                                     │
   │ REPEAT                              │
   │  - Check maxSteps                   │
   │  - Check timeout                    │
   │  - Continue until goal met          │
   └─────────────────────────────────────┘
5. Task completed, result returned
6. Memory updated
```

---

## Agent Types

### 1. Research Agents
- f.rsrx for deep research
- Long execution time
- High credit cost

### 2. Code Agents
- f.guard for review
- f.decloy for deployment
- Medium execution time

### 3. Automation Agents
- f.support for helpdesk
- f.twyt for social
- Continuous execution

### 4. Creative Agents
- Writing, design, content
- Short execution time
- Low credit cost

---

## Agent Marketplace Rules

### Publishing

1. Agent must pass validation
2. Agent must have tests
3. Agent must declare all tools
4. Agent must have safety limits

### Revenue Share

| Tier | Creator Share | Platform Share |
|------|---------------|----------------|
| Free | 0% | 0% |
| Freemium | 70% | 30% |
| Paid | 70% | 30% |

### Quality Metrics

- Success rate > 95%
- User rating > 4.0
- Response time < 30s (p95)

---

## Developer SDK

### Creating an Agent

```typescript
import { Agent, Tool, Memory } from "@aitlas/sdk";

export default Agent({
  name: "crypto-quant",
  version: "1.0.0",
  
  persona: {
    basePrompt: "You are a quantitative researcher...",
  },
  
  tools: [
    Tool.native("f.rsrx"),
    Tool.mcp("coingecko.price"),
  ],
  
  memory: {
    enabled: true,
    types: ["episodic", "semantic"],
  },
  
  execution: {
    maxSteps: 15,
    timeout: "30m",
  },
  
  pricing: {
    model: "freemium",
    credits: 10,
  },
});
```

---

## CLI Commands

```bash
# Create new agent
aitlas create agent my-agent

# Test agent locally
aitlas agent test

# Publish to store
aitlas agent publish

# View agent stats
aitlas agent stats
```

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering