# Actions — The Engine (f.xyz)

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Domain:** f.xyz  
**Status:** 🟡 Development  
**Stack:** Next.js 15, Bun, Neon Postgres, Prisma 6

---

## ⚠️ IMPORTANT: Two Action Types (v2.0 Architecture)

**Actions are not all the same kind of thing.**

| Type | Actions | Template | Has Standalone UI |
|------|---------|----------|-------------------|
| **Mini-App** | f.twyt, f.rsrx, f.library | `aitlas-ui-template` (Next.js) | ✅ Full product |
| **Utility** | f.guard, f.support, f.decloy | `aitlas-action-template` (Hono) | ❌ Headless MCP only |

**See:** [ACTIONS_ARCHITECTURE.md](../../architecture/ACTIONS_ARCHITECTURE.md) for full spec.

---

## What Actions Are

Actions are **Furma-native MCP servers** — each is a standalone microservice that exposes one domain of capability through the MCP tool protocol.

> **They are the monetized compute layer of Aitlas.**

### Mini-App Actions (Next.js)

f.twyt, f.rsrx, f.library are **standalone products first**.

They have their own UI, their own domain, their own value proposition — and they *also* expose an MCP endpoint so Nexus and agents can call them.

```
rsrx.f.xyz
├── Full Next.js app (ui-template)
├── Rich result viewer UI
├── Auth (shared Better Auth / shared DB)
├── Saved results, history, exports
└── /api/mcp  ← MCP endpoint (callable by Nexus/agents)
```

Users can visit `rsrx.f.xyz` directly without ever touching Nexus.

### Utility Actions (Hono)

f.guard, f.support, f.decloy produce simple structured outputs.

No user visits `guard.f.xyz` to browse a UI. They only exist to be called by agents and Nexus.

```
guard.f.xyz
├── Hono server (action-template)
├── /api/mcp  ← Only endpoint
└── /api/health  ← Uptime check
```

### Actions vs. Third-Party MCPs

| | Aitlas Actions (f.xyz) | Third-Party MCPs |
|--|------------------------|------------------|
| **Built by** | Furma.tech | Community / GitHub |
| **Hosted on** | Hetzner / Vercel | User or provider |
| **Trust level** | Verified & audited | Experimental |
| **Credit cost** | Yes — Furma revenue | No (user pays provider) |
| **Quality guarantee** | Production-grade | Variable |
| **Example** | f.rsrx, f.twyt | Google Search MCP |

### The Unix Philosophy

Actions should be like **Unix tools**:

```
grep  |  curl  |  sed
```

- **Small** — Single purpose
- **Focused** — Does one thing well
- **Composable** — Agents combine them

**Good Action:**
```
f.twyt:search_twitter
```

**Bad Action:**
```
analyze_social_media_trends (too heavy)
```

Keep Actions simple. Let Agents be the intelligence.

---

## Actions Registry

### By Category

| Category | Actions | Purpose |
|----------|---------|---------|
| **Infrastructure** | Nexus runtime, f.decloy | Platform foundation |
| **Intelligence** | f.rsrx, f.guard, f.library | Agent reasoning |
| **Business Automation** | f.support | Vertical solutions |
| **Core Primitives** | f.browser, f.exec, f.search, f.files, f.notify | Essential capabilities |

### All Actions

| Action | Domain | Description | Credit Cost | Status |
|--------|--------|-------------|-------------|--------|
| **f.twyt** | f.xyz/twyt | Twitter search & ingestion | 1/query | ✅ Prod |
| **f.library** | f.xyz/library | Vector knowledge base | 2/ingest, 1/search | ✅ Prod |
| **f.rsrx** | f.xyz/rsrx | Multi-source research synthesis | 2-12/report | 🟡 Dev |
| **f.guard** | f.xyz/guard | AI code review + security audit | 2/review | 🟡 Roadmap |
| **f.support** | f.xyz/support | AI helpdesk automation | 1-3/ticket | 🟡 Roadmap |
| **f.decloy** | f.xyz/decloy | MicroVM agent deployment | 25/deploy + 1/min | 🟡 Roadmap |
| **Nexus runtime** | f.xyz/loop | Durable agent runtime (Nexus) | 1/task + 2/hr | 🟡 Dev |
| **f.browser** | f.xyz/browser | Web browsing automation | 3/session | 🔴 Planned |
| **f.exec** | f.xyz/exec | Sandboxed code execution | 2/execution | 🔴 Planned |
| **f.search** | f.xyz/search | Web search (Brave/Google) | 1/query | 🔴 Planned |
| **f.files** | f.xyz/files | File operations | 1/operation | 🔴 Planned |
| **f.notify** | f.xyz/notify | Notifications (email, slack, webhook) | 1/notification | 🔴 Planned |

---

## Action Architecture Pattern

Every f.xyz action follows the same internal structure (cloned from `aitlas-core-template`):

```
f.twyt/
├── app/
│   ├── api/
│   │   └── mcp/
│   │       └── route.ts          ← MCP server endpoint (POST /api/mcp)
│   └── (dashboard)/              ← Optional standalone UI
├── lib/
│   ├── tools/
│   │   ├── search-twitter.ts     ← Tool implementation
│   │   └── get-timeline.ts       ← Tool implementation
│   ├── mcp-server.ts             ← MCP server definition (list + call tools)
│   ├── credit-middleware.ts      ← Shared: check + deduct credits
│   └── auth-bridge.ts            ← Shared: validate Furma ID session
├── prisma/
│   └── schema.prisma             ← Service-local schema (extends shared models)
├── AGENTS.md                     ← AI coding rules for this repo
└── .env.example
```

---

## Action Gateway ⭐ PLATFORM COMPONENT

Agents should not call Actions directly. They go through the **Action Gateway**.

### Why This Layer Exists

Without a gateway:
- No centralized logging
- No rate limiting
- No tool discovery
- No metrics

With a gateway:
- All calls go through one point
- Full observability
- Automatic auth validation
- Cost tracking

### Architecture

```
Agent
  ↓
Action Gateway
  ├─ Auth validation
  ├─ Rate limiting
  ├─ Logging
  ├─ Metrics
  └─ Tool discovery
  ↓
f.twyt / f.library / f.rsrx
```

### Implementation

```typescript
// lib/action-gateway.ts

interface ActionCall {
  action: string;        // "f.twyt:search_twitter"
  params: object;
  userId: string;
}

async function callAction(call: ActionCall): Promise<ActionResponse> {
  // 1. Validate auth
  const session = await validateSession(call.userId);
  
  // 2. Check rate limit
  await checkRateLimit(call.userId, call.action);
  
  // 3. Get action endpoint
  const endpoint = await resolveActionEndpoint(call.action);
  
  // 4. Log the call
  logger.info({ action: call.action, userId: call.userId }, 'action_call_start');
  
  // 5. Call the action
  const result = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.token}` },
    body: JSON.stringify(call.params)
  });
  
  // 6. Track metrics
  metrics.increment('action.calls', { action: call.action });
  
  return result;
}
```

---

## Tool Registry ⭐ PLATFORM COMPONENT

Agents need automatic tool discovery. The Tool Registry provides this.

### Why It Exists

Without a registry:
- Agents manually configure tools
- No schema validation
- No cost discovery

With a registry:
- `GET /actions` returns all available actions
- Each action includes schema, cost, description
- Agents auto-load tools

### Registry API

```
GET /api/actions
```

**Returns:**
```typescript
{
  actions: Array<{
    name: string;              // "f.twyt"
    domain: string;            // "f.xyz/twyt"
    description: string;
    category: string;          // "intelligence" | "infrastructure" | "automation"
    
    tools: Array<{
      name: string;            // "search_twitter"
      description: string;
      inputSchema: ZodSchema;
      outputSchema: ZodSchema;
      creditCost: number;
      isAsync: boolean;
    }>;
    
    status: "production" | "development" | "planned";
  }>;
}
```

### Agent Auto-Loading

```typescript
// In Nexus, agents automatically load tools
const actions = await fetch('/api/actions');

for (const action of actions) {
  if (user.hasAccess(action)) {
    agent.tools.push(...action.tools);
  }
}
```

---

## Missing Core Actions

These are **almost mandatory** for a complete agent ecosystem:

### 1. f.browser — Web Browsing

Agents need to browse the web.

```typescript
{
  navigate: (url: string) => void;
  extract: () => string;
  click: (selector: string) => void;
  scroll: (direction: "up" | "down") => void;
  screenshot: () => string;  // Base64
}
```

**Without this:** Research agents are limited.

---

### 2. f.exec — Code Execution

Sandboxed code execution.

```typescript
{
  run_python: (code: string) => { output: string, error?: string };
  run_node: (code: string) => { output: string, error?: string };
  run_shell: (command: string) => { output: string, error?: string };
}
```

**Without this:** No data analysis, no code testing, no automation.

---

### 3. f.search — Web Search

Generic web search (Brave/Google).

```typescript
{
  search: (query: string) => Array<{ title, url, snippet }>;
}
```

**Note:** `f.rsrx` should use this internally.

---

### 4. f.files — File Operations

Agents need file operations.

```typescript
{
  read: (path: string) => string;
  write: (path: string, content: string) => void;
  upload: (file: File) => string;  // Returns URL
  download: (url: string) => File;
}
```

---

### 5. f.notify — Notifications

Agents need to communicate results.

```typescript
{
  email: (to: string, subject: string, body: string) => void;
  slack: (channel: string, message: string) => void;
  discord: (channel: string, message: string) => void;
  webhook: (url: string, payload: object) => void;
}
```

---

## Action SDK (Developer Ecosystem)

Long-term, developers should build Actions too.

### Developer Workflow

```bash
# Create a new action
npx create-aitlas-action my-action

# Development
cd my-action
bun dev

# Deploy
aitlas deploy action
```

### SDK Example

```typescript
import { createAction } from "@aitlas/action-sdk";
import { z } from "zod";

export const search = createAction({
  name: "search_twitter",
  description: "Search Twitter for tweets",
  
  cost: 1,
  isAsync: false,
  
  input: z.object({
    query: z.string(),
    limit: z.number().optional()
  }),
  
  output: z.object({
    tweets: z.array(z.object({
      id: z.string(),
      text: z.string(),
      author: z.string()
    }))
  }),
  
  run: async ({ query, limit = 10 }) => {
    const results = await twitterClient.search(query, limit);
    return { tweets: results };
  }
});
```

### What the SDK Provides

- **MCP server auto-generation**
- **Credit middleware integration**
- **Logging built-in**
- **Schema validation**
- **Error handling**

---

## MCP Endpoint

All actions expose a **streamable HTTP MCP endpoint** at `/api/mcp`:

```typescript
POST https://f.twyt.xyz/api/mcp
Content-Type: application/json
Authorization: Bearer <furma_session_token>

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search_twitter",
    "arguments": { "query": "AI agents 2026", "limit": 10 }
  }
}
```

---

## Credit Middleware

Every action uses the shared credit middleware:

```typescript
import { creditMiddleware } from 'aitlas-core-template/lib/credit-middleware';

// In tool handler
await creditMiddleware({
  userId: session.userId,
  action: 'f.twyt:search_twitter',
  credits: 1,  // Cost in credits
});
```

**Requirements:**
- **Atomic** — Check + deduct in one transaction
- **Logged** — Every deduction is recorded
- **Refundable** — On failure, credits are returned

---

## Scaling Strategy

Actions are microservices. Eventually you'll have 50-100 actions.

### Deployment Model

```
Docker containers
    ↓
Hetzner VPS
    ↓
Kubernetes (later, if needed)
```

### Isolation Model

Each Action runs independently:

```
f.twyt    ← If this fails, others work
f.library
f.rsrx
f.guard
```

No shared state. No cascading failures.

### Scale Tiers

| Actions | Infrastructure | Cost/month |
|---------|----------------|------------|
| 1-10 | 1× Hetzner CX21 | ~€5 |
| 10-30 | 1× Hetzner CX31 | ~€10 |
| 30-50 | 2× Hetzner CX31 | ~€20 |
| 50+ | Kubernetes cluster | ~€50+ |

---

## The Real Aitlas Architecture

```
Aitlas
│
├── Nexus (UI + orchestration)
│
├── Agents marketplace
│
├── Action Registry
│
├── Action Gateway
│
├── Actions (f.xyz)
│   ├── f.twyt
│   ├── f.library
│   ├── f.rsrx
│   ├── f.guard
│   ├── f.support
│   ├── f.decloy
│   ├── f.browser (planned)
│   ├── f.exec (planned)
│   ├── f.search (planned)
│   ├── f.files (planned)
│   └── f.notify (planned)
│
├── Nexus runtime (agent runtime)
│
└── MCP ecosystem
```

---

## Layer Separation

| Layer | Product | Purpose |
|-------|---------|---------|
| **Interface** | Nova | User interaction |
| **Runtime** | Nexus runtime | Agent execution |
| **Capabilities** | Actions | Tools and skills |
| **Deployment** | f.decloy | Agent hosting |
| **Memory** | f.library | Knowledge persistence |

Very clean separation.

---

## Individual Actions

| Action | Docs | Status |
|--------|------|--------|
| [f.twyt](./f-twyt.md) | Twitter search & ingestion | ✅ Production |
| [f.library](./f-library.md) | Vector knowledge base | ✅ Production |
| [f.rsrx](./f-rsrx.md) | Research synthesis | 🟡 Development |
| [f.guard](./f-guard.md) | Code review + security | 🟡 Roadmap |
| [f.support](./f-support.md) | AI helpdesk | 🟡 Roadmap |
| [f.decloy](./f-decloy.md) | MicroVM deployment | 🟡 Roadmap |
| [Nexus runtime](./nexus.md) | Nexus engine (durable execution) | 🟡 Development |

---

## Platform Evaluation

| Category | Score |
|----------|-------|
| **Concept** | 9.5/10 |
| **Architecture** | 8.5/10 |
| **Documentation** | 8/10 |
| **Scalability** | 9/10 |
| **Monetization** | 9/10 |

**This is a very strong system already.**

---

**Last Updated:** March 6, 2026