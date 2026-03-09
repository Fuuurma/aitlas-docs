# Nexus Implementation Summary

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Product:** Nexus - Runtime Engine for Aitlas  
**Foundation:** trigger.dev + Mastra + AutoGen + Pi  
**Stack:** TypeScript + Bun + Hono

---

## Key Patterns Extracted

### 1. Durable Execution (From trigger.dev + Temporal)

```
┌─────────────────────────────────────────────────────────────┐
│                   Nexus Runtime Engine                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Queue     │───►│  Executor   │───►│  Checkpoint │    │
│  │  (Tasks)   │    │  (Run)      │    │  (State)    │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         ▲                                     │              │
│         └─────────────────────────────────────┘              │
│                    Retry on failure                          │
│                                                              │
│  Features:                                                   │
│  • No timeouts (long-running)                               │
│  • Checkpointing (survive restarts)                         │
│  • Automatic retries                                         │
│  • Queue management                                          │
│  • Human-in-the-loop                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2. Multi-Agent Orchestration (From AutoGen + crewAI)

```typescript
// Agent orchestration patterns
interface NexusRun {
  id: string;
  agents: Agent[];
  tasks: Task[];
  process: 'sequential' | 'hierarchical' | 'parallel';
  state: RunState;
  checkpoints: Checkpoint[];
}

// Sequential execution (crewAI pattern)
async function runSequential(tasks: Task[]) {
  for (const task of tasks) {
    await executeTask(task);
    await checkpoint(task.id, 'completed');
  }
}

// Hierarchical (AutoGen pattern)
async function runHierarchical(manager: Agent, workers: Agent[]) {
  const task = await manager.plan(input);
  const subtasks = await manager.delegate(task, workers);
  const results = await Promise.all(
    subtasks.map(st => executeTask(st))
  );
  return manager.synthesize(results);
}
```

### 3. Tool Calling (From MCP + Mastra)

```typescript
// Tool execution with MCP compliance
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (params: any) => Promise<any>;
}

// Tool execution
async function executeTool(tool: Tool, params: any) {
  // 1. Validate input
  const validated = validate(tool.inputSchema, params);
  
  // 2. Check credits
  const cost = calculateCost(tool);
  await deductCredits(userId, cost);
  
  // 3. Execute
  const result = await tool.handler(validated);
  
  // 4. Return MCP-compliant response
  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
    isError: false,
  };
}
```

### 4. Human-in-the-Loop (From AutoGen)

```typescript
// Approval workflow
async function waitForApproval(runId: string, action: string) {
  // Pause execution
  await checkpoint(runId, 'waiting_approval');
  
  // Notify user
  await notifyUser(userId, {
    type: 'approval_required',
    runId,
    action,
  });
  
  // Wait for response
  const decision = await waitForUserInput(runId);
  
  if (decision.approved) {
    return resume(runId);
  } else {
    return cancel(runId, decision.reason);
  }
}
```

### 5. Streaming Updates (From trigger.dev)

```typescript
// SSE streaming
app.get('/api/runs/:id/stream', async (c) => {
  const runId = c.req.param('id');
  
  return new Response(
    new ReadableStream({
      async start(controller) {
        // Subscribe to run updates
        const unsubscribe = subscribeToRun(runId, (event) => {
          controller.enqueue(
            `data: ${JSON.stringify(event)}\n\n`
          );
          
          if (event.type === 'complete') {
            controller.close();
          }
        });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
});
```

---

## Recommended Architecture

### Core Components

```
nexus-runtime/
├── src/
│   ├── index.ts              # Main entry
│   ├── runtime/
│   │   ├── executor.ts       # Task execution
│   │   ├── scheduler.ts      # Queue + scheduling
│   │   ├── checkpoint.ts     # State persistence
│   │   └── retry.ts          # Retry logic
│   ├── agents/
│   │   ├── agent.ts          # Agent definition
│   │   ├── crew.ts           # Multi-agent (crewAI)
│   │   └── conversation.ts   # Agent chat (AutoGen)
│   ├── tools/
│   │   ├── registry.ts       # Tool registry
│   │   ├── executor.ts       # Tool execution
│   │   └── mcp.ts            # MCP compliance
│   ├── llm/
│   │   ├── providers.ts      # Multi-provider (Pi pattern)
│   │   └── byok.ts           # User key support
│   ├── credits/
│   │   ├── billing.ts        # Credit deduction
│   │   └── tracking.ts       # Usage tracking
│   └── api/
│       ├── routes.ts         # HTTP routes
│       └── streaming.ts      # SSE handling
```

### Runtime Class

```typescript
// src/runtime/index.ts
import { Hono } from 'hono';
import { Redis } from 'ioredis';
import { PostgresStore } from './checkpoint';

export class NexusRuntime {
  private app = new Hono();
  private queue: Redis;
  private store: PostgresStore;
  private tools: Map<string, Tool>;
  
  constructor(config: NexusConfig) {
    this.queue = new Redis(config.redisUrl);
    this.store = new PostgresStore(config.databaseUrl);
    this.tools = new Map();
  }
  
  // Register tool
  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }
  
  // Execute run
  async execute(input: RunInput): Promise<RunResult> {
    const run = await this.createRun(input);
    
    try {
      // Process based on type
      switch (input.type) {
        case 'single':
          return await this.executeSingle(run);
        case 'crew':
          return await this.executeCrew(run);
        case 'conversation':
          return await this.executeConversation(run);
      }
    } catch (error) {
      await this.handleFailure(run, error);
      throw error;
    }
  }
  
  // Create checkpoint
  async checkpoint(run: Run, state: any) {
    await this.store.save(run.id, {
      state,
      timestamp: Date.now(),
    });
  }
  
  // Resume from checkpoint
  async resume(runId: string) {
    const checkpoint = await this.store.load(runId);
    return this.execute(checkpoint.input);
  }
}
```

### Agent Execution (Mastra Pattern)

```typescript
// src/agents/agent.ts
import { createAI } from '@mastra/core';

interface AgentConfig {
  name: string;
  model: string;
  instructions: string;
  tools: Tool[];
  maxSteps: number;
}

export class Agent {
  private config: AgentConfig;
  private llm: LLMClient;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }
  
  async run(prompt: string, context?: any) {
    let messages: Message[] = [
      { role: 'system', content: this.config.instructions },
      { role: 'user', content: prompt },
    ];
    
    for (let i = 0; i < this.config.maxSteps; i++) {
      const response = await this.llm.chat({
        messages,
        tools: this.config.tools,
      });
      
      // Tool call?
      if (response.toolCalls) {
        for (const call of response.toolCalls) {
          const result = await this.executeTool(call);
          messages.push({
            role: 'tool',
            content: JSON.stringify(result),
          });
        }
      }
      
      // Complete?
      if (response.content) {
        return response.content;
      }
    }
  }
}
```

### Crew Execution (crewAI Pattern)

```typescript
// src/agents/crew.ts
export class Crew {
  constructor(
    private agents: Agent[],
    private tasks: Task[],
    private process: 'sequential' | 'hierarchical'
  ) {}
  
  async kickoff(input: any) {
    switch (this.process) {
      case 'sequential':
        return this.runSequential(input);
      case 'hierarchical':
        return this.runHierarchical(input);
    }
  }
  
  private async runSequential(input: any) {
    let context = input;
    
    for (const task of this.tasks) {
      const agent = this.findAgent(task.agentId);
      const result = await agent.run(task.description, context);
      context = { ...context, [task.id]: result };
    }
    
    return context;
  }
  
  private async runHierarchical(input: any) {
    const manager = this.agents.find(a => a.role === 'manager');
    const workers = this.agents.filter(a => a.role !== 'manager');
    
    const plan = await manager.run('Create execution plan', input);
    const tasks = this.parsePlan(plan);
    
    const results = await Promise.all(
      tasks.map(t => this.findAgent(t.agentId).run(t.description))
    );
    
    return manager.run('Synthesize results', results);
  }
}
```

---

## BYOK Implementation (Unique to Aitlas)

```typescript
// src/llm/byok.ts
export class BYOKProvider {
  private userKeys: Map<string, UserKeys>;
  
  // User provides their own key
  async setUserKey(userId: string, provider: string, key: string) {
    await this.store.saveUserKey(userId, provider, encrypt(key));
  }
  
  // Get LLM client with user's key
  async getClient(userId: string, provider: string) {
    const key = await this.store.getUserKey(userId, provider);
    
    if (!key) {
      // Fall back to platform key with credit deduction
      return this.getPlatformClient(provider);
    }
    
    // User's own key - no credit deduction!
    return createLLMClient(provider, decrypt(key));
  }
}
```

---

## Credit System Integration

```typescript
// src/credits/billing.ts
export class CreditBilling {
  constructor(private store: CreditStore) {}
  
  async deductCredits(
    userId: string,
    action: string,
    tokens: { input: number; output: number }
  ) {
    const cost = this.calculateCost(action, tokens);
    
    // Check balance
    const balance = await this.store.getBalance(userId);
    if (balance < cost) {
      throw new Error('Insufficient credits');
    }
    
    // Deduct
    await this.store.deduct(userId, cost, {
      action,
      tokens,
      timestamp: Date.now(),
    });
    
    return { deducted: cost, remaining: balance - cost };
  }
  
  private calculateCost(action: string, tokens: { input: number; output: number }) {
    // Different actions have different costs
    const rates = {
      'f.research': 0.01,
      'f.twyt': 0.02,
      'f.pay': 0.05,
    };
    
    return Math.ceil(
      tokens.input * 0.0001 + tokens.output * 0.0005 + (rates[action] || 0)
    );
  }
}
```

---

## Integration Points

### With Nova (UI)

```typescript
// API routes for Nova
app.post('/api/runs', async (c) => {
  const input = await c.req.json();
  const userId = c.get('userId');
  
  const run = await runtime.execute({
    ...input,
    userId,
  });
  
  return c.json({ runId: run.id });
});

app.get('/api/runs/:id/stream', async (c) => {
  // SSE streaming
});
```

### With Agents Store

```typescript
// Fetch agent definition
async function loadAgent(agentId: string) {
  const response = await fetch(`${AGENTS_STORE_URL}/agents/${agentId}`);
  return response.json();
}
```

### With Actions (f.xyz)

```typescript
// Execute action as tool
async function executeAction(actionId: string, params: any) {
  const response = await fetch(`${FXYZ_URL}/actions/${actionId}/execute`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  
  return response.json();
}
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Bun runtime | Fast, TypeScript native |
| Hono framework | Lightweight, edge-ready |
| Redis for queues | Proven, fast |
| PostgreSQL for state | Durable, queryable |
| MCP compliance | Standard protocol |
| SSE for streaming | Simple, widely supported |

---

## Next Steps

1. **Implement core runtime** - Executor, checkpoint, retry
2. **Add agent support** - Single agent execution
3. **Add crew support** - Multi-agent orchestration
4. **Implement BYOK** - User key management
5. **Add credit billing** - Usage tracking
6. **Build API layer** - Routes and streaming
7. **Integrate with Nova** - UI connection
8. **Add Actions** - Tool execution

---

*Implementation Status: 🔵 Ready for development*