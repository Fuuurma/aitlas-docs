# Aitlas SDK Specification

**Version:** 1.0.0  
**Date:** March 6, 2026  
**Status:** Production Design

---

## Overview

The Aitlas SDK allows developers to create, test, and publish agents, actions, and workflows.

```bash
npm install @aitlas/sdk
```

---

## Core Concepts

### 1. Agent

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

```bash
# Create
aitlas create agent my-agent
aitlas create action my-action
aitlas create workflow my-workflow

# Development
aitlas dev# Start local dev server
aitlas test# Run tests

# Deployment
aitlas deploy# Deploy to Aitlas cloud

# Publishing
aitlas publish# Publish to Agent Store

# Management
aitlas list# List all agents/actions
aitlas logs [id]# View execution logs
aitlas stats [id]# View usage stats

# Credits
aitlas credits balance# Check balance
aitlas credits purchase 1000# Buy credits
```

---

## Context Object

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

```
my-agent/
├── agent.json
├── persona.md# Optional: persona in markdown
├── tools.ts# Optional: custom tools
├── tests/
│   └── agent.test.ts
└── README.md
```

---

## Best Practices

### Agent Design
- Keep `maxSteps` reasonable (10-20)
- Provide clear fallback logic
- Use memory for context
- Test edge cases

### Action Design
- Validate all inputs with Zod
- Return structured outputs
- Handle errors gracefully
- Document credit costs

### Workflow Design
- Keep DAGs simple
- Add error handling nodes
- Test all paths
- Document dependencies

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering