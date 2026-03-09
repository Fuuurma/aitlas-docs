# Aitlas SDK Specification

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**Version:** 1.0.0  
**Date:** March 6, 2026  
**Status:** Production Design

---

## Overview


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


The Aitlas SDK allows developers to create, test, and publish agents, actions, and workflows.

```bash
npm install @aitlas/sdk
```

---

## Core Concepts


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


### 1. Agent


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


```typescript
import { Agent } from "@aitlas/sdk";

export default Agent({
  name: "crypto-quant",
  version: "1.0.0",
  displayName: "The Crypto Quant",
  
  persona: {
    basePrompt: "You are a quantitative crypto researcher...",
    examples: [],
  },
  
  tools: {
    native: ["f.rsrx", "f.twyt"],
    mcp: ["coingecko.price"],
  },
  
  memory: {
    enabled: true,
    types: ["episodic", "semantic"],
    retention: "30d",
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

### 2. Action


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


```typescript
import { Action, Input, Output } from "@aitlas/sdk";

export default Action({
  name: "search-twitter",
  description: "Search Twitter for relevant tweets",
  
  input: Input({
    query: z.string().describe("Search query"),
    limit: z.number().optional().default(10),
  }),
  
  output: Output({
    tweets: z.array(z.object({
      id: z.string(),
      text: z.string(),
      author: z.string(),
    })),
  }),
  
  cost: 1,
  
  handler: async (input, context) => {
    const tweets = await searchTwitter(input.query, input.limit);
    return { tweets };
  },
});
```

### 3. Workflow


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


```typescript
import { Workflow, Node, Edge } from "@aitlas/sdk";

export default Workflow({
  name: "Research & Publish",
  description: "Research a topic and publish to Twitter",
  
  trigger: "manual",
  
  nodes: [
    Node({ id: "research", type: "agent", config: { agent: "researcher" } }),
    Node({ id: "search", type: "action", config: { action: "f.rsrx" } }),
    Node({ id: "write", type: "agent", config: { agent: "writer" } }),
    Node({ id: "publish", type: "action", config: { action: "f.twyt" } }),
  ],
  
  edges: [
    Edge({ from: "research", to: "search" }),
    Edge({ from: "search", to: "write" }),
    Edge({ from: "write", to: "publish" }),
  ],
});
```

---

## CLI Reference


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


```bash
# Create


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas create agent my-agent
aitlas create action my-action
aitlas create workflow my-workflow

# Development


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas dev# Start local dev server


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas test# Run tests


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


# Deployment


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas deploy# Deploy to Aitlas cloud


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


# Publishing


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas publish# Publish to Agent Store


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


# Management


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas list# List all agents/actions


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas logs [id]# View execution logs


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas stats [id]# View usage stats


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


# Credits


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas credits balance# Check balance


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

aitlas credits purchase 1000# Buy credits


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

```

---

## Context Object


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Actions and agents receive a context object:

```typescript
interface Context {
  userId: string;
  credits: number;
  
  // BYOK API keys (decrypted in-memory)
  apiKeys: {
    openai?: string;
    anthropic?: string;
    deepseek?: string;
  };
  
  // Memory access
  memory: {
    get: (query: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  
  // Logging
  logger: {
    info: (msg: string, data?: any) => void;
    error: (msg: string, error?: Error) => void;
  };
  
  // MCP client
  mcp: {
    call: (tool: string, input: any) => Promise<any>;
  };
}
```

---

## Project Structure


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


```
my-agent/
├── agent.json
├── persona.md# Optional: persona in markdown


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

├── tools.ts# Optional: custom tools


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

├── tests/
│   └── agent.test.ts
└── README.md
```

---

## Best Practices


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


### Agent Design


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

- Keep `maxSteps` reasonable (10-20)
- Provide clear fallback logic
- Use memory for context
- Test edge cases

### Action Design


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

- Validate all inputs with Zod
- Return structured outputs
- Handle errors gracefully
- Document credit costs

### Workflow Design


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

- Keep DAGs simple
- Add error handling nodes
- Test all paths
- Document dependencies

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering