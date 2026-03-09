# Aitlas Actions — Revised Architecture
**Version:** 2.0 | **Date:** March 2026 | **Status:** LOCKED  
**Supersedes:** Previous headless-only action spec  
**Maintained by:** Herb (AI CTO)

---

## The Core Insight

Actions are not all the same kind of thing.

f.rsrx returns a 5-page research report with 30 sources.  
f.twyt returns 200 ranked tweets with sentiment, engagement, and author data.  
f.library returns a searchable vector knowledge base over your documents.  
f.guard returns a JSON list of code issues.  
f.support creates a ticket and returns a ticket ID.

The first three produce **dense, rich, explorable data** — they need a real UI.  
The last two produce **simple structured outputs** — a sidebar card is enough.

This is the distinction that drives the entire architecture.

---

## The Two Action Types

### Type 1: Mini-App Actions (Next.js)
**f.twyt · f.rsrx · f.library**

These are **standalone products first**. They have their own UI, their own domain, their own value proposition — and they *also* expose an MCP endpoint so Nexus and agents can call them.

Users can visit `rsrx.f.xyz` directly and use it like a product without ever touching Nexus.

```
rsrx.f.xyz
├── Full Next.js app (ui-template)
├── Rich result viewer UI
├── Auth (same Better Auth / shared DB — one account)
├── Saved results, history, exports
└── /api/mcp  ← MCP endpoint (callable by Nexus/agents)
```

**Template:** `aitlas-ui-template` (Next.js 15)  
**Deploy:** Vercel  
**Actions in this category:** f.twyt, f.rsrx, f.library

### Type 2: Utility Actions (Hono, headless)
**f.guard · f.support · Nexus runtime · f.decloy**

These produce simple structured outputs. No user ever visits `guard.f.xyz` to browse a UI. They only exist to be called by agents and Nexus.

```
guard.f.xyz (or internally routed)
├── Hono server (action-template)
├── /api/mcp  ← Only endpoint that exists
└── /api/health  ← Uptime check
```

**Template:** `aitlas-action-template` (Hono)  
**Deploy:** Vercel serverless  
**Actions in this category:** f.guard, f.support, Nexus runtime API gateway, f.decloy

---

## Revised Action Registry

| Action | Type | Template | UI | Has Standalone Value |
|--------|------|----------|----|---------------------|
| **f.twyt** | Mini-App | Next.js (ui) | Full dashboard | ✅ Yes |
| **f.rsrx** | Mini-App | Next.js (ui) | Report viewer + history | ✅ Yes |
| **f.library** | Mini-App | Next.js (ui) | Document store + search | ✅ Yes |
| **f.guard** | Utility | Hono | ❌ None | ❌ Only in Nexus |
| **f.support** | Utility | Hono | ❌ None | ❌ Only in Nexus |
| **Nexus runtime** | Worker | Bun | ❌ None | ❌ Internal runtime |
| **f.decloy** | Utility | Hono | ❌ None | ❌ Only in Nexus |

---

## How Mini-App Actions Work

### Part 1: The Standalone Product

Each mini-app action is a full Next.js product. Users sign in with their Aitlas account (shared auth), and use the product directly.

**f.rsrx standalone experience:**
```
rsrx.f.xyz

┌─────────────────────────────────────────────────────────┐
│  f.rsrx                              [Credits: 420] [+]  │
├──────────────────────┬──────────────────────────────────┤
│  MY REPORTS          │  REPORT: EU AI Startups 2026      │
│                      │                                   │
│  > EU AI Startups    │  Executive Summary                │
│    Mar 6, 2026       │  ─────────────────                │
│                      │  The European AI startup scene... │
│  > DeFi Yield        │                                   │
│    Mar 5, 2026       │  Sources (28)                     │
│                      │  ─────────────────                │
│  > Competitor Scan   │  [source cards]                   │
│    Mar 4, 2026       │                                   │
│                      │  [Export PDF] [Share] [Save]      │
│  [+ New Research]    │                                   │
└──────────────────────┴──────────────────────────────────┘
```

**f.twyt standalone experience:**
```
twyt.f.xyz

┌─────────────────────────────────────────────────────────┐
│  f.twyt                                                  │
├──────────────────────────────────────────────────────────┤
│  [Search query bar]                    [1h|24h|7d|30d]   │
├──────────────────────┬───────────────────────────────────┤
│  RESULTS (124)       │  INSIGHTS                         │
│                      │  Sentiment: 68% positive          │
│  @user  · 2h         │  Top topics: agents, MCP, Claude  │
│  "AI agents are..."  │  Peak activity: 14:00–16:00 UTC   │
│  ♥ 2.4k  🔁 890      │                                   │
│                      │  TOP ACCOUNTS                     │
│  @user2 · 5h         │  @karpathy (12 mentions)          │
│  "The real alpha..." │  @sama (8 mentions)               │
│  ♥ 1.1k  🔁 340      │                                   │
└──────────────────────┴───────────────────────────────────┘
```

**f.library standalone experience:**
```
library.f.xyz

┌─────────────────────────────────────────────────────────┐
│  f.library                                               │
├───────────────────────────────────────────────────────── │
│  [Search your knowledge base...]            [+ Upload]   │
├──────────────────────┬───────────────────────────────────┤
│  COLLECTIONS         │  RESULTS for "AI regulation EU"   │
│                      │                                   │
│  > crypto_research   │  ▪ EU AI Act Summary.pdf          │
│    48 documents      │    "...high-risk systems must..."  │
│                      │    Relevance: 94%                 │
│  > competitor_intel  │                                   │
│    12 documents      │  ▪ Research Note Mar 2026.md      │
│                      │    "...compliance deadline..."     │
│  > [+ New Collection]│    Relevance: 87%                 │
└──────────────────────┴───────────────────────────────────┘
```

---

### Part 2: The MCP Endpoint (same app, same domain)

Every mini-app action also exposes `/api/mcp` — the same endpoint utility actions use.
Built directly into the Next.js app as an API route.

```typescript
// rsrx.f.xyz/app/api/mcp/route.ts
// This is the MCP endpoint inside the Next.js app.
// Nexus calls this. Agents call this. Same domain, same auth.

import { mcpServer } from '@/lib/mcp-server';
import { authBridge } from '@/lib/auth-bridge';

export async function POST(req: Request) {
  const session = await authBridge.validate(req);
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  return mcpServer.handleRequest(req, { userId: session.user.id });
}
```

---

### Part 3: The Nexus Integration — Result Cards

When Nova or an agent calls a mini-app action via MCP, the result comes back as structured data. Nova renders a **compact result card** inline in chat, with a deep link to the full experience.

```
[Chat message from assistant]
"I ran the research. Here's the summary:"

┌─────────────────────────────────────────────────┐
│  ⚡ f.rsrx result                    5 credits   │
│  ─────────────────────────────────────────────── │
│  EU AI Startups 2026                             │
│                                                  │
│  Found 47 companies across 12 countries. Top     │
│  clusters: Paris (9), Berlin (7), London (6).    │
│  Notable: Mistral AI, Aleph Alpha, Poolside.     │
│                                                  │
│  Sources: 28  ·  Confidence: High                │
│                                                  │
│  [Open full report →]  [Save to f.library]       │
└─────────────────────────────────────────────────┘
```

The "Open full report →" link is a **deep link** into f.rsrx:
```
https://rsrx.f.xyz/reports/report_abc123
```

The result is already saved in f.rsrx's database. The user clicks through to the full viewer — no data is lost, no re-running the research.

**For f.twyt:**
```
┌─────────────────────────────────────────────────┐
│  ⚡ f.twyt result                    1 credit    │
│  ─────────────────────────────────────────────── │
│  "AI agents 2026"  ·  24h  ·  124 tweets        │
│                                                  │
│  Sentiment: 68% positive ↑                       │
│  Top voices: @karpathy, @sama, @ylecun           │
│  Trending angle: "agentic reasoning beats RAG"   │
│                                                  │
│  [Explore in f.twyt →]                          │
└─────────────────────────────────────────────────┘
```

---

## Data Model: Results Belong to the Action

Results are **stored in the action's DB** (same shared Neon, but action-owned tables).
Nexus never stores the result data — it only stores a reference.

```prisma
// In f.rsrx's schema.prisma:

model ResearchReport {
  id          String   @id @default(cuid())
  userId      String
  query       String
  report      String   @db.Text   // Full markdown report
  sources     Json                // Array of sources
  confidence  String              // "high" | "medium" | "low"
  taskId      String?             // If triggered by Nexus runtime task
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt(sort: Desc)])
}

// In f.twyt's schema.prisma:

model TwytSearch {
  id          String   @id @default(cuid())
  userId      String
  query       String
  dateRange   String
  tweets      Json     // Full tweet results
  insights    Json     // Computed insights
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt(sort: Desc)])
}
```

The MCP tool call creates a record, returns the ID + summary to Nexus.
Nexus stores the result ID in the message's `toolOutput` field.
Deep link: `https://rsrx.f.xyz/reports/{id}`

---

## How Nexus Renders Result Cards

Nexus detects tool results from mini-app actions and renders a rich card instead of raw JSON.

```typescript
// In Nova: components/chat/ToolResultCard.tsx

interface ToolResult {
  toolName: string;
  output: unknown;
}

const MINI_APP_RENDERERS: Record<string, React.FC<{ output: unknown }>> = {
  'f.rsrx:deep_research':      ResearchResultCard,
  'f.rsrx:synthesize_report':  ResearchResultCard,
  'f.twyt:search_twitter':     TwitterResultCard,
  'f.twyt:get_user_timeline':  TwitterResultCard,
  'f.library:search_knowledge_base': LibraryResultCard,
};

export function ToolResultCard({ toolName, output }: ToolResult) {
  const Renderer = MINI_APP_RENDERERS[toolName];
  
  if (Renderer) {
    return <Renderer output={output} />;
  }
  
  // Utility actions (f.guard, f.support) — compact text result
  return <UtilityResultCard toolName={toolName} output={output} />;
}
```

---

## Authentication Across Mini-Apps

All three mini-apps share the same Neon DB and the same `BETTER_AUTH_SECRET`.
A user signs in once (at Nexus) and is automatically authenticated at rsrx.f.xyz, twyt.f.xyz, and library.f.xyz — their session cookie is valid cross-domain via Better Auth's cross-domain session support.

```typescript
// lib/auth.ts (same in all three mini-apps)
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  database: { provider: 'postgresql', url: env.DATABASE_URL },
  
  // Enable cross-domain session: cookie shared across f.xyz subdomains
  advanced: {
    crossSubdomainCookies: {
      enabled: true,
      domain: '.f.xyz',   // Valid for all *.f.xyz
    }
  },
});
```

This means: **one account, all products**. Sign into Nexus, open f.rsrx — already authenticated.

---

## Updated Template Assignment

```
aitlas-ui-template (Next.js 15)
├── aitlas-nexus          → nexus.aitlas.xyz
├── aitlas-agents         → agents.aitlas.xyz
├── f-twyt                → twyt.f.xyz           ← Mini-app action
├── f-rsrx                → rsrx.f.xyz           ← Mini-app action
└── f-library             → library.f.xyz        ← Mini-app action

aitlas-action-template (Hono, headless)
├── f-guard               → guard.f.xyz          ← Utility action
├── f-support             → support.f.xyz        ← Utility action
└── f-decloy              → decloy.f.xyz         ← Utility action

aitlas-worker-template (Bun, no HTTP)
└── aitlas-nexus           → Hetzner              ← Nexus workers
```

---

## Updated Deployment Map

| Service | Host | Template | Domain |
|---------|------|----------|--------|
| Nexus | Vercel | ui | nexus.aitlas.xyz |
| Agents Store | Vercel | ui | agents.aitlas.xyz |
| **f.twyt** | **Vercel** | **ui (Next.js)** | **twyt.f.xyz** |
| **f.rsrx** | **Vercel** | **ui (Next.js)** | **rsrx.f.xyz** |
| **f.library** | **Vercel** | **ui (Next.js)** | **library.f.xyz** |
| f.guard | Vercel | action (Hono) | guard.f.xyz |
| f.support | Vercel | action (Hono) | support.f.xyz |
| f.decloy | Vercel | action (Hono) | decloy.f.xyz |
| Nexus runtime workers | Hetzner | worker (Bun) | (no domain) |
| PostgreSQL | Neon | — | — |
| Redis | Upstash | — | — |

**Bolded rows are the change from v1.** Everything else is the same.

---

## GTM Implication: Three Standalone Products

f.twyt, f.rsrx, and f.library each have a standalone value proposition and can be
marketed, launched, and monetized independently of Nexus.

| Product | Standalone pitch | Direct CTA |
|---------|-----------------|-----------|
| **f.twyt** | "Twitter intelligence. Search, analyze, and monitor X in seconds." | Try f.twyt free |
| **f.rsrx** | "Deep research in minutes. Multi-source synthesis with cited reports." | Run your first research |
| **f.library** | "Your AI knowledge base. Upload documents, search with meaning." | Add your first document |

Each can hit Product Hunt independently. Each drives users into the Aitlas ecosystem who then discover Nexus, Agents, and the credit system.

The funnel: **standalone product → Aitlas account → discover Nexus → upgrade to Agentic Mode → buy credits**.

---

## Summary of Changes from Previous Spec

| Was | Now |
|-----|-----|
| All actions = Hono (headless) | Split: Mini-Apps = Next.js, Utilities = Hono |
| Actions have no UI | f.twyt, f.rsrx, f.library have full product UIs |
| Results only appear in Nova chat | Rich cards in Nova + deep link to full action UI |
| Actions not sellable standalone | f.twyt, f.rsrx, f.library are standalone products |
| Single action-template | Two templates: ui-template for mini-apps, action-template for utilities |
| Results not persisted in action | Results stored in action's DB, referenced by ID in Nexus |

---

*Last updated: March 2026 | Maintained by Herb (AI CTO)*
