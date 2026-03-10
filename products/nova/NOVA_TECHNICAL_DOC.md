# Nova — Technical Planning Document
**Version:** 1.0 | **Date:** March 2026 | **Status:** CANONICAL  
**Owner:** Furma.tech | **Maintained by:** Herb (AI CTO)

> Nova is the user-facing shell of Aitlas.  
> It is intentionally a "zombie" — three cloned open source repos glued together  
> with integration work. No novel UI engineering. Only connection work.

---

## Table of Contents

1. [What Nova Is](#1-what-nova-is)
2. [The Three Zones](#2-the-three-zones)
3. [Source Repos — Clone Strategy](#3-source-repos--clone-strategy)
4. [Unified App Structure](#4-unified-app-structure)
5. [Routing Architecture](#5-routing-architecture)
6. [Free vs Paid Tier](#6-free-vs-paid-tier)
7. [Auth & Session](#7-auth--session)
8. [BYOK Key Management](#8-byok-key-management)
9. [Zone 1 — Chat (T3 Code)](#9-zone-1--chat-t3-code)
10. [Zone 2 — Tasks (Symphony)](#10-zone-2--tasks-symphony)
11. [Zone 3 — Dashboard (Mission Control)](#11-zone-3--dashboard-mission-control)
12. [Nexus Integration](#12-nexus-integration)
13. [Agents Store Integration](#13-agents-store-integration)
14. [Actions Integration](#14-actions-integration)
15. [Real-Time Architecture](#15-real-time-architecture)
16. [State Management](#16-state-management)
17. [Nova API Routes](#17-nova-api-routes)
18. [Database Schema](#18-database-schema)
19. [Environment Variables](#19-environment-variables)
20. [Infrastructure & Deployment](#20-infrastructure--deployment)
21. [Build Order](#21-build-order)

---

## 1. What Nova Is

Nova is the browser/desktop interface for Aitlas. It is **not** a standalone product — it is the shell that connects:

- The user ↔ their AI keys (BYOK, free tier)
- The user ↔ Nexus (agent execution, paid tier)
- The user ↔ Agents Store (hire and run agents)
- The user ↔ Actions (f.xyz tools)

```
┌─────────────────────────────────────────────────────────────┐
│                         NOVA                                │
│                                                             │
│   ┌──────────────┬──────────────────┬──────────────────┐   │
│   │   CHAT       │     TASKS        │    DASHBOARD     │   │
│   │  (T3 Code)   │   (Symphony)     │ (MissionControl) │   │
│   │              │                  │                  │   │
│   │  BYOK chat   │  Agent monitor   │  Overview +      │   │
│   │  Free tier   │  Live steps      │  Metrics +       │   │
│   │  Provider    │  Replay viewer   │  Agent mgmt      │   │
│   │  switcher    │  Paid tier       │  Paid tier       │   │
│   └──────────────┴──────────────────┴──────────────────┘   │
│                          │                                  │
│         ┌────────────────┼───────────────────┐             │
│         │                │                   │             │
│       Nexus         Agents Store         Actions           │
│    (agent OS)      (marketplace)         (f.xyz)           │
└─────────────────────────────────────────────────────────────┘
```

### The Zombie Philosophy

Nova owns **zero business logic**. All intelligence lives in Nexus. All tools live in Actions. All agents live in the Agents Store. Nova is the surface — it renders, streams, and routes.

This means:
- Nova never calls an LLM directly for paid/agentic flows
- Nova never stores task state — Nexus owns that
- Nova never knows what tools are available — Nexus resolves them
- Nova renders what Nexus streams

**Exception:** Free tier. In free tier, Nova calls the provider directly with the user's BYOK key (simple chat, no Nexus). This is the only case where Nova touches an LLM.

---

## 2. The Three Zones

| Zone | Source Repo | License | What we take | What we add |
|------|------------|---------|--------------|-------------|
| **Chat** | `pingdotgg/t3code` | MIT | Entire chat UI, model switcher, file attachments, system prompt editor | Nexus dispatch, agent mode toggle, Actions sidebar, BYOK key picker |
| **Tasks** | `openai/symphony` | MIT | Task list, step-by-step progress UI, worker panels | Phoenix Channel connection, Replay viewer, fork/export controls, agent info panel |
| **Dashboard** | `builderz-labs/mission-control` | MIT | Overview stats cards, metrics panels, sidebar navigation, dark theme | Nexus metrics, credit balance, hired agents, activity feed, settings pages |

### Zone Boundaries

Each zone is a distinct Next.js route group. They share:
- The auth session
- The sidebar navigation
- The top bar (credits, user menu)
- The theme + design system

They do **not** share state. Each zone manages its own data independently.

---

## 3. Source Repos — Clone Strategy

### Step 1 — Clone All Three Into The Repo

```bash
# Start from aitlas-ui-template
git clone https://github.com/Fuuurma/aitlas-ui-template nova
cd nova

# Clone source repos into /vendor (read-only reference)
mkdir vendor
git clone https://github.com/pingdotgg/t3code vendor/t3code
git clone https://github.com/openai/symphony vendor/symphony
git clone https://github.com/builderz-labs/mission-control vendor/mission-control
```

Add to `.gitignore`:
```
vendor/
```

These repos are **reference only** — we read their code and manually port what we need into our own `src/` structure. We do not import or symlink from `/vendor`.

### Step 2 — What to Port From Each Repo

**From T3 Code (`vendor/t3code`):**
```
src/components/chat/
  message-list.tsx          → render conversation messages
  message-input.tsx         → textarea + send + attach
  message-bubble.tsx        → user/assistant message rendering
  model-selector.tsx        → provider + model picker dropdown
  system-prompt-editor.tsx  → system prompt sidebar panel
  file-attachment.tsx       → file upload + preview
  streaming-message.tsx     → live token streaming display

src/lib/
  streaming.ts              → SSE handling utilities
  providers.ts              → provider/model catalog
```

**From Symphony (`vendor/symphony`):**
```
src/components/tasks/
  task-list.tsx             → left panel: list of all tasks
  task-detail.tsx           → right panel: selected task detail
  step-card.tsx             → individual PLAN/ACT/REFLECT step
  step-type-badge.tsx       → colored badge per step type
  worker-panel.tsx          → agent info + status
  task-status-badge.tsx     → PENDING/RUNNING/COMPLETED etc.
  progress-timeline.tsx     → vertical step timeline

src/lib/
  task-types.ts             → TypeScript types for tasks + steps
```

**From Mission Control (`vendor/mission-control`):**
```
src/components/dashboard/
  stats-card.tsx            → metric display card
  activity-feed.tsx         → recent events list
  sidebar.tsx               → main navigation sidebar
  top-bar.tsx               → header with user menu
  metric-chart.tsx          → recharts wrapper

src/app/layout patterns      → overall shell layout
src/styles/                  → color system, typography
```

### Step 3 — Integrate Into Nova Structure

After porting, each component lives under its zone path in our own `src/`. We never reference `vendor/` at runtime.

---

## 4. Unified App Structure

```
nova/
├── src/
│   ├── app/
│   │   ├── layout.tsx                      ← root layout (theme, auth, providers)
│   │   ├── page.tsx                        ← redirect: / → /chat or /sign-in
│   │   │
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   │
│   │   ├── (shell)/                        ← authenticated shell layout
│   │   │   ├── layout.tsx                  ← sidebar + topbar wrapper
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx                ← new conversation
│   │   │   │   └── [id]/page.tsx           ← existing conversation
│   │   │   │
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx                ← task list
│   │   │   │   └── [id]/page.tsx           ← task detail + replay
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                ← overview metrics
│   │   │   │
│   │   │   ├── agents/
│   │   │   │   ├── page.tsx                ← hired agents
│   │   │   │   └── hire/[slug]/page.tsx    ← hire flow handoff
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx                ← general settings
│   │   │       ├── keys/page.tsx           ← API key management
│   │   │       ├── credits/page.tsx        ← credit balance + purchase
│   │   │       └── connections/page.tsx    ← MCP connections
│   │   │
│   │   └── api/
│   │       ├── auth/[...all]/route.ts      ← Better Auth
│   │       ├── health/route.ts
│   │       ├── chat/route.ts               ← free tier: direct BYOK call
│   │       ├── tasks/route.ts              ← paid: proxy to Nexus
│   │       ├── tasks/[id]/route.ts         ← task status
│   │       ├── tasks/[id]/stream/route.ts  ← SSE fallback
│   │       └── keys/route.ts               ← encrypt + store API keys
│   │
│   ├── components/
│   │   ├── ui/                             ← shadcn (all components)
│   │   ├── shell/                          ← sidebar, topbar, shell chrome
│   │   ├── chat/                           ← ported from T3 Code
│   │   ├── tasks/                          ← ported from Symphony
│   │   ├── dashboard/                      ← ported from Mission Control
│   │   ├── agents/                         ← agent card, hire panel
│   │   └── shared/                         ← credit display, provider badge, etc.
│   │
│   ├── hooks/
│   │   ├── use-chat.ts                     ← chat state + streaming
│   │   ├── use-task.ts                     ← task state + Phoenix Channel
│   │   ├── use-nexus-stream.ts             ← Phoenix Channel WebSocket
│   │   ├── use-credits.ts                  ← credit balance + optimistic update
│   │   └── use-byok-keys.ts               ← available provider keys
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── auth-client.ts
│   │   ├── api.ts                          ← typed fetch helpers
│   │   ├── nexus-client.ts                 ← Nexus REST + WS client
│   │   ├── providers.ts                    ← model catalog
│   │   ├── streaming.ts                    ← SSE parsing utilities
│   │   └── phoenix-channel.ts              ← Phoenix Channel JS client
│   │
│   ├── server/
│   │   ├── auth.ts
│   │   ├── get-session.ts
│   │   └── db/
│   │       ├── index.ts
│   │       └── schema.ts
│   │
│   └── env.ts
│
├── vendor/                                 ← reference only, gitignored
├── AGENTS.md
├── .env.local
└── package.json
```

---

## 5. Routing Architecture

### Route Groups

Two route groups handle the fundamental split:

**`(auth)` group** — unauthenticated. No sidebar, no topbar.
```
/sign-in
/sign-up
```

**`(shell)` group** — requires auth. Wraps all app routes with the shell layout.
```
/chat
/chat/[id]
/tasks
/tasks/[id]
/dashboard
/agents
/settings/*
```

### Shell Layout (`(shell)/layout.tsx`)

```tsx
// src/app/(shell)/layout.tsx
import { redirect } from "next/navigation";
import { requireSession } from "@/server/get-session";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/sign-in");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={session.user} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Sidebar Navigation

```tsx
// src/components/shell/sidebar.tsx
const NAV_ITEMS = [
  { href: "/chat",       icon: MessageSquare,  label: "Chat",      tier: "free" },
  { href: "/tasks",      icon: ListTodo,       label: "Tasks",     tier: "paid" },
  { href: "/dashboard",  icon: LayoutDashboard,label: "Dashboard", tier: "paid" },
  { href: "/agents",     icon: Bot,            label: "Agents",    tier: "paid" },
];

// Paid items show a lock icon + upgrade tooltip if user is on free tier
```

### Root Redirect

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/server/get-session";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  redirect("/chat");
}
```

---

## 6. Free vs Paid Tier

### Tier Determination

```tsx
// src/lib/tier.ts
import type { Session } from "@/server/auth";

export type Tier = "free" | "paid";

export function getUserTier(session: Session): Tier {
  // V1: paid = has Pro subscription OR credit balance >= 500
  // This is checked server-side on every relevant page
  if (session.user.isPro) return "paid";
  if (session.user.creditBalance >= 500) return "paid";
  return "free";
}
```

Tier is read from the session — never from client state. The DB is the source of truth.

### What Each Tier Unlocks

| Feature | Free | Paid |
|---------|------|------|
| Chat with BYOK key | ✅ | ✅ |
| Provider switcher (OpenAI, Anthropic, Gemini) | ✅ | ✅ |
| System prompt editor | ✅ | ✅ |
| File attachments (direct to LLM) | ✅ | ✅ |
| Codex / Claude Code / OpenCode buttons | ✅ | ✅ |
| Conversation history | ✅ | ✅ |
| Task Monitor | ❌ | ✅ |
| Nexus agent dispatch | ❌ | ✅ |
| Replay Viewer | ❌ | ✅ |
| Hire agents from store | ❌ | ✅ |
| Actions sidebar in chat | ❌ | ✅ |
| f.xyz tool cards in responses | ❌ | ✅ |
| Dashboard metrics | ❌ | ✅ |
| MCP connections | ❌ | ✅ |
| Scheduled tasks | ❌ | ✅ |

### Free Tier Gate Components

```tsx
// src/components/shared/tier-gate.tsx
"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TierGateProps {
  tier: "free" | "paid";
  feature: string;
  children: React.ReactNode;
}

export function TierGate({ tier, feature, children }: TierGateProps) {
  if (tier === "paid") return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg border border-border/50 bg-background/80 backdrop-blur-sm">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{feature} requires Pro</p>
        <Button size="sm" variant="default">
          Upgrade →
        </Button>
      </div>
    </div>
  );
}
```

---

## 7. Auth & Session

Built on Better Auth (same config as `aitlas-ui-template`). Session is checked in every `(shell)` layout and relevant API routes.

### Session Shape

```ts
// What we need on the session user object
type SessionUser = {
  id: string;
  name: string;
  email: string;
  isPro: boolean;           // has active Pro subscription
  creditBalance: number;    // current credit balance (snapshot)
  hasOpenAiKey: boolean;    // has OpenAI BYOK key stored
  hasAnthropicKey: boolean;
  hasGeminiKey: boolean;
};
```

The `creditBalance` on the session is a **snapshot** updated on sign-in and on credit mutations. For real-time credit display, use the `/api/credits/balance` route polled every 30s (or optimistically updated on spend).

### Cross-Domain Cookies

Nova runs on `nova.aitlas.xyz`. Agents Store runs on `agents.aitlas.xyz`. Both share the session because Better Auth is configured with `domain: '.aitlas.xyz'`.

When a user clicks "Hire Agent" on the Agents Store and lands on `nova.aitlas.xyz/hire/[slug]`, the session is already valid — no re-login.

---

## 8. BYOK Key Management

Nova is the only place users enter and manage their API keys. Keys are encrypted on the server before storage.

### Settings Page (`/settings/keys`)

```tsx
// src/app/(shell)/settings/keys/page.tsx

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    label: "API Key",
    placeholder: "sk-...",
    hint: "Required for GPT-4o, embeddings, and vector memory",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    label: "API Key",
    placeholder: "sk-ant-...",
    hint: "Required for Claude models",
    docsUrl: "https://console.anthropic.com",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    label: "API Key",
    placeholder: "AI...",
    hint: "Required for Gemini models",
    docsUrl: "https://aistudio.google.com/apikey",
  },
];
```

### Key Storage Flow

```
User enters API key in settings page
        │
        ▼
POST /api/keys
{
  provider: "openai",
  key: "sk-abc123..."
}
        │
        ▼
Nova API route (server-side only):
  1. Validate: key format check (regex)
  2. Validate: live ping to provider (GET /models, verify 200)
  3. Encrypt: AES-256-GCM with ENCRYPTION_KEY
  4. Store: INSERT INTO api_keys (user_id, provider, encrypted_key, iv, hint)
     hint = last 4 chars of key ("...3abc")
  5. Update session: hasOpenAiKey = true
        │
        ▼
Response: { success: true, hint: "...3abc" }

UI shows: OpenAI ✓ (....3abc) [Delete]
```

**Nova API route for key storage:**

```ts
// src/app/api/keys/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/server/get-session";
import { db } from "@/server/db";
import { apiKeys } from "@/server/db/schema";
import { encrypt } from "@/server/crypto";
import { validateKey } from "@/lib/provider-validation";
import { z } from "zod";

const schema = z.object({
  provider: z.enum(["openai", "anthropic", "gemini"]),
  key: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = schema.parse(await req.json());

  // Live ping to verify key works
  const isValid = await validateKey(body.provider, body.key);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
  }

  // Encrypt — key never stored in plaintext, never logged
  const { ciphertext, iv } = encrypt(body.key);
  const hint = body.key.slice(-4);

  await db
    .insert(apiKeys)
    .values({
      userId: session.user.id,
      provider: body.provider,
      encryptedKey: ciphertext,
      iv,
      hint,
    })
    .onConflictDoUpdate({
      target: [apiKeys.userId, apiKeys.provider],
      set: { encryptedKey: ciphertext, iv, hint, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true, hint });
}
```

---

## 9. Zone 1 — Chat (T3 Code)

### What It Is

The chat interface is Nova's entry point. Free tier users live here. Paid users use it for quick single-turn interactions. When a request needs an agent loop, the chat dispatches to Tasks and redirects.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar   │              CHAT                   │ Actions  │
│            │  ┌─────────────────────────────┐   │ Sidebar  │
│  Chat ●    │  │  Conversation               │   │         │
│  Tasks     │  │                             │   │ [PAID]  │
│  Dashboard │  │  [messages]                 │   │         │
│  Agents    │  │                             │   │ f.rsrx  │
│            │  │                             │   │ f.twyt  │
│  ─────     │  │                             │   │ f.library│
│            │  │                             │   │         │
│  Settings  │  │─────────────────────────────│   │         │
│            │  │  [ModelSelector] [Agent▼]   │   │         │
│            │  │  ┌─────────────────────────┐│   │         │
│            │  │  │ Type a message...        ││   │         │
│            │  │  └─────────────────────────┘│   │         │
│            │  │  [📎 Attach] [⌘↵ Send]      │   │         │
│            └──┴─────────────────────────────┴───┘         │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

**`ModelSelector`** — Provider + model picker:
```tsx
// src/components/chat/model-selector.tsx
const MODELS = [
  // OpenAI
  { provider: "openai", id: "gpt-4o",       label: "GPT-4o",         context: "128k" },
  { provider: "openai", id: "gpt-4o-mini",  label: "GPT-4o Mini",    context: "128k" },
  { provider: "openai", id: "o3-mini",      label: "o3 Mini",        context: "200k" },
  // Anthropic
  { provider: "anthropic", id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", context: "200k" },
  { provider: "anthropic", id: "claude-3-haiku-20240307",    label: "Claude 3 Haiku",    context: "200k" },
  // Gemini
  { provider: "gemini", id: "gemini-2.0-flash",  label: "Gemini 2.0 Flash",  context: "1M" },
  { provider: "gemini", id: "gemini-1.5-pro",    label: "Gemini 1.5 Pro",    context: "2M" },
];

// Shows lock icon for providers where user has no BYOK key stored
// Shows "Add key →" tooltip pointing to /settings/keys
```

**`AgentModeToggle`** — Switches between direct chat and agent dispatch:
```tsx
// PAID ONLY
// When toggled ON: sends to Nexus, shows agent selector dropdown
// When toggled OFF: sends directly to provider via /api/chat (BYOK)
```

**`MessageList`** — Renders conversation history:
```tsx
// Messages render as:
// user: right-aligned, bg-primary
// assistant: left-aligned, markdown rendered
// tool_result: collapsed card with expand toggle (PAID)
// agent_step: inline step card (PAID, from task stream)
// error: red banner
```

**`StreamingMessage`** — Live token display:
```tsx
// Consumes ReadableStream from /api/chat SSE response
// Shows cursor blinking while streaming
// Renders markdown progressively (remark + rehype)
```

**`ActionsPanel`** — Right sidebar (PAID):
```tsx
// Shows available f.xyz Actions
// User can pin actions they use frequently
// Each action shows: name, description, credit cost
// Click → opens action UI in a slide-over (iframe or embedded component)
```

### Chat API Route (Free Tier — Direct BYOK)

```ts
// src/app/api/chat/route.ts
import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/server/get-session";
import { getDecryptedKey } from "@/server/crypto";
import { z } from "zod";

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })),
  model: z.string(),
  provider: z.enum(["openai", "anthropic", "gemini"]),
  systemPrompt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = schema.parse(await req.json());

  // Get user's BYOK key for this provider
  // decrypt inline — never assigned to named variable
  const stream = await callProvider({
    provider: body.provider,
    model: body.model,
    messages: body.messages,
    systemPrompt: body.systemPrompt,
    apiKey: await getDecryptedKey(session.user.id, body.provider),
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

### Provider Abstraction

```ts
// src/lib/providers.ts
export async function callProvider({
  provider,
  model,
  messages,
  systemPrompt,
  apiKey,
}: CallProviderArgs): Promise<ReadableStream> {
  switch (provider) {
    case "openai":
      return callOpenAI({ model, messages, systemPrompt, apiKey });
    case "anthropic":
      return callAnthropic({ model, messages, systemPrompt, apiKey });
    case "gemini":
      return callGemini({ model, messages, systemPrompt, apiKey });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Each returns a ReadableStream of SSE events:
// data: {"type":"text","content":"Hello"}
// data: {"type":"done"}
```

### Conversation Persistence

Conversations are stored in Nova's DB (not Nexus). Nexus owns task history; Nova owns chat history.

```
conversations:    id, user_id, title, model, provider, created_at
messages:         id, conversation_id, role, content, created_at
                  + task_id (if message spawned an agent task)
```

---

## 10. Zone 2 — Tasks (Symphony)

### What It Is

The Task Monitor is where agent execution lives. Every time Nexus runs an agent, that run appears here with live step-by-step updates streamed via Phoenix Channels (WebSocket).

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar   │  TASK LIST        │  TASK DETAIL               │
│            │                   │                             │
│  Chat      │  ● Running        │  The Rainmaker              │
│  Tasks ●   │  Research EU...   │  "Find EU AI startups"      │
│  Dashboard │  Started 2m ago   │  Status: RUNNING ●          │
│  Agents    │                   │  Credits: 12 / 80 budget    │
│            │  ✓ Completed      │                             │
│            │  Code Review #4   │  ─────────────────────      │
│            │  12 min, 34cr     │                             │
│            │                   │  ● Step 1  PLAN             │
│            │  ✗ Failed         │    "Search for EU AI..."    │
│            │  Deploy Bot       │                             │
│            │  Timeout          │  ● Step 2  ACTION           │
│            │                   │    f.rsrx.web_search        │
│            │  [ + New Task ]   │    → 47 results found       │
│            │                   │                             │
│            │                   │  ◌ Step 3  REFLECT (live)  │
│            │                   │    Analyzing results...▌    │
│            │                   │                             │
└────────────┴───────────────────┴─────────────────────────────┘
```

### Task List Panel

```tsx
// src/components/tasks/task-list.tsx
"use client";

import { useTaskList } from "@/hooks/use-task-list";

export function TaskList() {
  const { tasks, isLoading } = useTaskList();

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between p-4">
        <h2 className="font-semibold">Tasks</h2>
        <NewTaskButton />
      </div>

      <div className="flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <TaskListItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

```tsx
// src/components/tasks/task-list-item.tsx
// Shows:
//   - Agent name + avatar
//   - Task goal (truncated)
//   - Status badge (PENDING | RUNNING | COMPLETED | FAILED | STUCK)
//   - Duration or "X min ago"
//   - Credits used
//   - Active pulse animation if RUNNING
```

### Task Detail Panel

```tsx
// src/components/tasks/task-detail.tsx
"use client";

import { useTask } from "@/hooks/use-task";
import { useNexusStream } from "@/hooks/use-nexus-stream";
import { StepTimeline } from "./step-timeline";
import { ReplayControls } from "./replay-controls";
import { AgentInfoPanel } from "./agent-info-panel";

interface TaskDetailProps {
  taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const { task, steps, isLoading } = useTask(taskId);

  // Connect to Phoenix Channel for live updates
  useNexusStream(taskId, {
    onStep: (step) => appendStep(step),
    onComplete: (result) => markComplete(result),
    onError: (error) => markFailed(error),
  });

  if (!task) return <TaskDetailSkeleton />;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <TaskDetailHeader task={task} />

      {/* Agent info + status */}
      <AgentInfoPanel agent={task.agent} status={task.status} />

      {/* Live step timeline */}
      <StepTimeline steps={steps} status={task.status} />

      {/* Replay controls (completed tasks only) */}
      {task.status === "COMPLETED" && (
        <ReplayControls taskId={task.id} />
      )}
    </div>
  );
}
```

### Step Timeline

```tsx
// src/components/tasks/step-timeline.tsx

const STEP_TYPE_CONFIG = {
  PLAN:       { label: "Plan",    color: "blue",   icon: Brain },
  ACTION:     { label: "Action",  color: "orange", icon: Zap },
  REFLECTION: { label: "Reflect", color: "purple", icon: Eye },
  FINAL:      { label: "Done",    color: "green",  icon: CheckCircle },
};

function StepCard({ step }: { step: TaskStep }) {
  const config = STEP_TYPE_CONFIG[step.type];
  const isLive = step.status === "streaming";

  return (
    <div className="flex gap-3 py-3">
      {/* Step type indicator */}
      <div className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-${config.color}-100`}>
        <config.icon className={`h-3 w-3 text-${config.color}-600`} />
      </div>

      <div className="flex-1">
        {/* Step header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {config.label}
          </span>
          {step.tool_name && (
            <ToolBadge toolName={step.tool_name} />
          )}
          {step.duration_ms && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(step.duration_ms)}
            </span>
          )}
        </div>

        {/* Step content */}
        <div className="mt-1 text-sm">
          {isLive ? (
            <StreamingText text={step.content} />
          ) : (
            <p>{step.content}</p>
          )}
        </div>

        {/* Tool input/output (collapsed by default) */}
        {step.tool_input && (
          <ToolCallDetails input={step.tool_input} output={step.tool_output} />
        )}
      </div>
    </div>
  );
}
```

### Replay Controls (Symphony addition)

```tsx
// src/components/tasks/replay-controls.tsx
"use client";

export function ReplayControls({ taskId }: { taskId: string }) {
  const [forkStep, setForkStep] = useState<number | null>(null);
  const { replay, isReplaying } = useReplay(taskId);

  return (
    <div className="border-t p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => replay({ mode: "exact" })}
          disabled={isReplaying}
        >
          <Play className="mr-2 h-3 w-3" />
          Replay
        </Button>

        <ForkStepPicker
          taskId={taskId}
          onSelect={(step) => replay({ mode: "fork", forkFromStep: step })}
        />

        <Button variant="outline" size="sm" onClick={exportTrace}>
          <Download className="mr-2 h-3 w-3" />
          Export
        </Button>

        <ShareRunButton taskId={taskId} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Exact replay uses cached results — no new tokens consumed.
      </p>
    </div>
  );
}
```

---

## 11. Zone 3 — Dashboard (Mission Control)

### What It Is

The Dashboard gives users an overview of their Aitlas activity: credits, agent performance, recent tasks, hired agents, and settings shortcuts.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar   │                  DASHBOARD                      │
│            │                                                 │
│  Chat      │  Good morning, Alex.               March 2026  │
│  Tasks     │                                                 │
│  Dashboard●│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  Agents    │  │Credits  │ │Tasks    │ │Success  │          │
│            │  │ 847     │ │ 24      │ │ 91%     │          │
│            │  │ -120 today│ this mo  │ rate     │          │
│            │  └─────────┘ └─────────┘ └─────────┘          │
│            │                                                 │
│            │  MY AGENTS                          [ Browse ] │
│            │  The Rainmaker ●  Code Reviewer ●              │
│            │  Tax Ghost ◌      [+ Hire Agent]               │
│            │                                                 │
│            │  RECENT ACTIVITY                                │
│            │  ✓ Rainmaker — EU Startups     2h ago  62cr   │
│            │  ✓ Code Review — PR #142       5h ago  34cr   │
│            │  ✗ Deploy Bot — Timeout        1d ago  12cr   │
│            │                                                 │
│            │  CREDIT USAGE (30 days)                        │
│            │  [─────────────────chart─────────────────────] │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

### Stats Cards

```tsx
// src/components/dashboard/stats-card.tsx
interface StatsCardProps {
  label: string;
  value: string | number;
  delta?: string;           // "+120 this week"
  deltaDirection?: "up" | "down" | "neutral";
  icon: React.ComponentType;
}
```

Data fetched on server (React Server Component):

```tsx
// src/app/(shell)/dashboard/page.tsx
import { requireSession } from "@/server/get-session";
import { getDashboardStats } from "@/server/dashboard";

export default async function DashboardPage() {
  const session = await requireSession();
  const stats = await getDashboardStats(session.user.id);

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader user={session.user} />
      <StatsRow stats={stats} />
      <div className="grid grid-cols-3 gap-6">
        <MyAgents agents={stats.hiredAgents} />
        <RecentActivity activities={stats.recentActivity} />
        <CreditChart data={stats.creditHistory} />
      </div>
    </div>
  );
}
```

### Credits Display (TopBar)

Credit balance is shown in the top bar on every page. Optimistically updated when credits are spent.

```tsx
// src/components/shell/top-bar.tsx
"use client";

import { useCredits } from "@/hooks/use-credits";

export function TopBar({ user }: { user: User }) {
  const { balance, isLoading } = useCredits();

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div />
      <div className="flex items-center gap-3">
        <CreditBadge balance={balance} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

function CreditBadge({ balance }: { balance: number }) {
  return (
    <Link href="/settings/credits">
      <div className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
        <Coins className="h-3.5 w-3.5 text-amber-500" />
        <span>{balance.toLocaleString()}</span>
      </div>
    </Link>
  );
}
```

---

## 12. Nexus Integration

This is the most critical integration. Nova talks to Nexus two ways:
- **REST** — dispatch tasks, check status, replay
- **Phoenix Channels (WebSocket)** — live step streaming

### Nexus Client

```ts
// src/lib/nexus-client.ts
import "server-only";
import { env } from "@/env";

const NEXUS_BASE = env.NEXUS_API_URL;
const NEXUS_KEY = env.NEXUS_API_KEY;

export const nexus = {
  async dispatchTask(payload: DispatchTaskPayload): Promise<{ taskId: string }> {
    const res = await fetch(`${NEXUS_BASE}/api/v1/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NEXUS_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Nexus dispatch failed: ${res.status}`);
    return res.json();
  },

  async getTask(taskId: string): Promise<NexusTask> {
    const res = await fetch(`${NEXUS_BASE}/api/v1/tasks/${taskId}`, {
      headers: { "Authorization": `Bearer ${NEXUS_KEY}` },
    });
    if (!res.ok) throw new Error(`Task not found: ${taskId}`);
    return res.json();
  },

  async cancelTask(taskId: string): Promise<void> {
    await fetch(`${NEXUS_BASE}/api/v1/tasks/${taskId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${NEXUS_KEY}` },
    });
  },

  async replayTask(taskId: string, opts: ReplayOptions): Promise<{ taskId: string }> {
    const res = await fetch(`${NEXUS_BASE}/api/v1/tasks/${taskId}/replay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NEXUS_KEY}`,
      },
      body: JSON.stringify(opts),
    });
    return res.json();
  },
};
```

### Task Dispatch (Nova API Route)

```ts
// src/app/api/tasks/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/server/get-session";
import { nexus } from "@/lib/nexus-client";
import { getUserTier } from "@/lib/tier";
import { z } from "zod";

const schema = z.object({
  goal: z.string().min(1).max(2000),
  agentSlug: z.string().optional(),     // if hiring a specific agent
  provider: z.string().optional(),
  model: z.string().optional(),
  creditBudget: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireSession();

  // Gate: paid tier only
  if (getUserTier(session) === "free") {
    return NextResponse.json(
      { error: "Agent tasks require a Pro plan or 500+ credits" },
      { status: 403 }
    );
  }

  const body = schema.parse(await req.json());

  // Dispatch to Nexus
  const { taskId } = await nexus.dispatchTask({
    userId: session.user.id,
    goal: body.goal,
    agentSlug: body.agentSlug,
    provider: body.provider,
    model: body.model,
    creditBudget: body.creditBudget ?? 100,
  });

  return NextResponse.json({ taskId });
}
```

### Phoenix Channel Connection (Client-Side)

```ts
// src/lib/phoenix-channel.ts
"use client";

import { Socket, Channel } from "phoenix";
import { env } from "@/env";

let socket: Socket | null = null;

export function getSocket(userToken: string): Socket {
  if (socket) return socket;

  socket = new Socket(`wss://nexus.aitlas.xyz/socket`, {
    params: { token: userToken },
  });
  socket.connect();
  return socket;
}

export function joinTaskChannel(
  taskId: string,
  userToken: string,
  handlers: TaskChannelHandlers
): Channel {
  const sock = getSocket(userToken);
  const channel = sock.channel(`task:${taskId}`, {});

  channel.on("step", (payload) => handlers.onStep(payload));
  channel.on("complete", (payload) => handlers.onComplete(payload));
  channel.on("error", (payload) => handlers.onError(payload));
  channel.on("stuck", (payload) => handlers.onStuck(payload));

  channel.join()
    .receive("ok", () => console.log(`Joined task:${taskId}`))
    .receive("error", (err) => console.error("Join error", err));

  return channel;
}

export interface TaskChannelHandlers {
  onStep: (step: TaskStep) => void;
  onComplete: (result: TaskResult) => void;
  onError: (error: TaskError) => void;
  onStuck: (info: TaskStuck) => void;
}
```

Install Phoenix JS client:
```bash
bun add phoenix
```

### `useNexusStream` Hook

```ts
// src/hooks/use-nexus-stream.ts
"use client";

import { useEffect, useRef } from "react";
import { joinTaskChannel } from "@/lib/phoenix-channel";
import { useSession } from "@/lib/auth-client";
import type { TaskChannelHandlers } from "@/lib/phoenix-channel";

export function useNexusStream(
  taskId: string | null,
  handlers: TaskChannelHandlers
) {
  const { data: session } = useSession();
  const channelRef = useRef<ReturnType<typeof joinTaskChannel> | null>(null);

  useEffect(() => {
    if (!taskId || !session?.user) return;

    channelRef.current = joinTaskChannel(
      taskId,
      session.session.token,   // Better Auth session token
      handlers
    );

    return () => {
      channelRef.current?.leave();
    };
  }, [taskId, session?.user.id]);
}
```

### Nexus Event Shape

What Nova receives from Phoenix Channel:

```ts
// Task step event
{
  type: "step",
  payload: {
    id: "step_uuid",
    step_number: 3,
    type: "ACTION",          // PLAN | ACTION | REFLECTION | FINAL
    content: "Searching for EU AI startups...",
    tool_name: "f.rsrx.web_search",
    tool_input: { query: "EU AI startups 2026" },
    tool_output: null,       // null while executing
    credits_used: 2,
    duration_ms: null,       // null while executing
    status: "streaming"      // streaming | completed | failed
  }
}

// Task complete event
{
  type: "complete",
  payload: {
    task_id: "task_uuid",
    result: "Final report: 47 EU AI startups found...",
    total_credits_used: 62,
    total_duration_ms: 720000,
    total_steps: 7
  }
}
```

---

## 13. Agents Store Integration

Nova is where hired agents actually run. The Agents Store redirects to Nova after hire.

### Hire Handoff Route

```ts
// src/app/(shell)/agents/hire/[slug]/page.tsx
import { requireSession } from "@/server/get-session";
import { verifyHireToken } from "@/lib/hire-token";
import { HireAgentPanel } from "@/components/agents/hire-agent-panel";

interface HirePageProps {
  params: { slug: string };
  searchParams: { token?: string };
}

export default async function HirePage({ params, searchParams }: HirePageProps) {
  const session = await requireSession();

  // Validate the signed token from Agents Store
  const hire = searchParams.token
    ? await verifyHireToken(searchParams.token)
    : null;

  // If no token (direct navigation), just load the agent info
  const agentSlug = params.slug;

  return (
    <HireAgentPanel
      agentSlug={agentSlug}
      userId={session.user.id}
      prefilledGoal={hire?.prefilledGoal}
      isTrial={hire?.isTrial}
    />
  );
}
```

### HireAgentPanel Component

```tsx
// src/components/agents/hire-agent-panel.tsx
"use client";

export function HireAgentPanel({ agentSlug, userId, prefilledGoal, isTrial }) {
  const [goal, setGoal] = useState(prefilledGoal ?? "");
  const { agent, isLoading } = useAgent(agentSlug);
  const router = useRouter();

  async function handleHire() {
    const { taskId } = await fetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ goal, agentSlug }),
    }).then(r => r.json());

    // Redirect to task detail immediately
    router.push(`/tasks/${taskId}`);
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <AgentHeader agent={agent} />

      <RequirementsCheck agent={agent} userId={userId} />

      <div className="mt-6 space-y-4">
        <label className="text-sm font-medium">What do you want to accomplish?</label>
        <Textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={agent?.io?.inputPlaceholder ?? "Describe your goal..."}
          rows={4}
        />
      </div>

      {isTrial && (
        <p className="mt-2 text-sm text-muted-foreground">
          This is a trial run. Trial runs are free.
        </p>
      )}

      <Button onClick={handleHire} className="mt-6 w-full" size="lg">
        Run {agent?.displayName} →
      </Button>
    </div>
  );
}
```

### My Agents Page

```tsx
// src/app/(shell)/agents/page.tsx
// Shows:
//   - Active agent subscriptions (from DB)
//   - Recently run agents (from task history)
//   - [ Browse Agents Store ] → links to agents.aitlas.xyz
//   - [ + Hire Agent ] → search agents.aitlas.xyz inline (V2) or redirect (V1)
```

---

## 14. Actions Integration

Actions (f.xyz) appear in two places in Nova:

1. **Actions Sidebar** in Chat (paid tier) — quick-launch panel
2. **Tool Result Cards** in Chat + Task steps — inline rendered results

### Actions Sidebar

```tsx
// src/components/chat/actions-panel.tsx
"use client";

const FEATURED_ACTIONS = [
  { id: "f.rsrx",    name: "Research",  icon: Search,    url: "https://rsrx.f.xyz" },
  { id: "f.twyt",    name: "Twitter",   icon: Twitter,   url: "https://twyt.f.xyz" },
  { id: "f.library", name: "Library",   icon: Library,   url: "https://library.f.xyz" },
  { id: "f.guard",   name: "Code Guard",icon: Shield,    url: "https://guard.f.xyz" },
];

export function ActionsPanel() {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  return (
    <div className="flex h-full w-64 flex-col border-l">
      <div className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Actions
      </div>

      {FEATURED_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => setActiveAction(action.id)}
          className="flex items-center gap-3 px-3 py-2 hover:bg-accent"
        >
          <action.icon className="h-4 w-4" />
          <span className="text-sm">{action.name}</span>
        </button>
      ))}

      {/* Action iframe/embed (when one is open) */}
      {activeAction && (
        <ActionEmbed actionId={activeAction} />
      )}
    </div>
  );
}
```

### Tool Result Card

When an agent uses a tool with a `_aitlas` extension in its MCP response, Nova renders a result card:

```tsx
// src/components/tasks/tool-result-card.tsx
interface ToolResultCardProps {
  toolName: string;
  result: {
    content: string;
    _aitlas?: {
      resultId: string;
      deepLinkUrl: string;
      creditsUsed: number;
      summary: string;
    };
  };
}

export function ToolResultCard({ toolName, result }: ToolResultCardProps) {
  if (!result._aitlas) {
    // Plain text result
    return <PlainToolResult toolName={toolName} content={result.content} />;
  }

  // Rich result card
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ToolBadge name={toolName} />
          <span className="text-xs text-muted-foreground">
            {result._aitlas.creditsUsed} credits
          </span>
        </div>
        <a
          href={result._aitlas.deepLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Open in {getActionName(toolName)} →
        </a>
      </div>
      <p className="mt-2 text-sm">{result._aitlas.summary}</p>
    </div>
  );
}
```

---

## 15. Real-Time Architecture

### Three Streaming Contexts

| Context | Method | Direction | Used for |
|---------|--------|-----------|---------|
| Chat (free tier) | SSE (`ReadableStream`) | Server → Client | Token streaming from provider |
| Task steps (paid) | Phoenix Channel (WebSocket) | Nexus → Nova → Client | Live agent step updates |
| Task complete | Phoenix Channel | Nexus → Nova → Client | Final result + credits |

### Why Both SSE and WebSocket?

**Chat (SSE):** One-directional, simple, perfect for token streaming. Next.js supports it natively via `ReadableStream` response.

**Tasks (Phoenix Channel):** Bidirectional needed — user can cancel a task, inject context mid-run, or request a pause. SSE can't handle this. Phoenix Channels are WebSocket-based and built into Nexus.

### Client-Side WebSocket Lifecycle

```ts
// src/lib/phoenix-channel.ts

// Single socket per user session (not per task)
// Multiple channels can be opened on same socket
// e.g. socket → channel task:abc123
//             → channel task:def456 (if user has two running tasks)

// On page unload: socket.disconnect()
// On task complete: channel.leave()
// On navigation: channels leave, socket stays alive
```

```tsx
// Socket is initialized once in the shell layout
// src/app/(shell)/layout.tsx

// Store socket in a React context
const NexusSocketContext = createContext<Socket | null>(null);

export function NexusSocketProvider({ token, children }) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket(token);
    return () => socketRef.current?.disconnect();
  }, [token]);

  return (
    <NexusSocketContext.Provider value={socketRef.current}>
      {children}
    </NexusSocketContext.Provider>
  );
}
```

### Task Polling Fallback

If Phoenix Channel connection fails (network issue, Nexus restart), Nova falls back to polling:

```ts
// src/hooks/use-task.ts
export function useTask(taskId: string) {
  const [task, setTask] = useState<NexusTask | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Try WebSocket first
  useNexusStream(isConnected ? taskId : null, {
    onStep: appendStep,
    onComplete: markComplete,
  });

  // Poll as fallback (every 3s if not connected)
  useInterval(
    async () => {
      if (isConnected) return;
      const data = await fetch(`/api/tasks/${taskId}`).then(r => r.json());
      setTask(data);
    },
    isConnected ? null : 3000
  );
}
```

---

## 16. State Management

Nova uses a minimal approach. No Redux. No Zustand at the global level.

### Per-Zone State Strategy

| Zone | State approach |
|------|---------------|
| Chat | Local React state + URL params for conversation ID |
| Tasks | Server state (React Query) + Phoenix Channel for live |
| Dashboard | Server components — data fetched at render time |

### React Query for Server State

```bash
bun add @tanstack/react-query
```

```tsx
// src/app/(shell)/layout.tsx — add QueryClientProvider
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30s before refetch
      refetchOnWindowFocus: false,
    },
  },
});
```

Key queries:

```ts
// Tasks list
useQuery({ queryKey: ["tasks", userId], queryFn: () => fetch("/api/tasks").then(r => r.json()) })

// Single task (initial load, then WS takes over)
useQuery({ queryKey: ["task", taskId], queryFn: () => fetch(`/api/tasks/${taskId}`).then(r => r.json()) })

// Credit balance
useQuery({ queryKey: ["credits", userId], queryFn: () => fetch("/api/credits").then(r => r.json()), refetchInterval: 30_000 })

// Hired agents
useQuery({ queryKey: ["agents", userId], queryFn: () => fetch("/api/agents/hired").then(r => r.json()) })
```

### Optimistic Updates

Credits are optimistically deducted in the UI when a task is dispatched:

```ts
// When POST /api/tasks succeeds:
queryClient.setQueryData(["credits", userId], (old) => ({
  ...old,
  balance: old.balance - estimatedCost,
}));
// On task complete: refetch to get real balance from DB
```

---

## 17. Nova API Routes

All routes in `src/app/api/`:

```
PUBLIC
  GET  /api/health                  → db ping + status

AUTH REQUIRED — Chat
  POST /api/chat                    → free tier BYOK streaming
  GET  /api/conversations           → list conversations
  GET  /api/conversations/[id]      → get conversation + messages
  DELETE /api/conversations/[id]    → delete conversation

AUTH REQUIRED — Keys
  GET  /api/keys                    → list stored providers (never returns key, just provider + hint)
  POST /api/keys                    → encrypt + store new key
  DELETE /api/keys/[provider]       → delete key for provider

AUTH REQUIRED — Tasks (proxy to Nexus)
  POST /api/tasks                   → dispatch task to Nexus
  GET  /api/tasks                   → list user's tasks
  GET  /api/tasks/[id]              → get task + steps
  DELETE /api/tasks/[id]            → cancel task
  POST /api/tasks/[id]/replay       → replay task

AUTH REQUIRED — Credits
  GET  /api/credits                 → current balance
  GET  /api/credits/history         → ledger entries

AUTH REQUIRED — Agents
  GET  /api/agents/hired            → user's subscribed/used agents
  POST /api/agents/[slug]/hire      → initiate hire (validates requirements)

AUTH REQUIRED — MCP Connections
  GET  /api/connections             → list MCP connections
  POST /api/connections             → add new MCP connection
  DELETE /api/connections/[id]      → remove connection
```

---

## 18. Database Schema

Nova's own DB tables (within the shared Neon instance). Nova does **not** duplicate Nexus task data — it only stores its own UI-layer data.

```sql
-- ─── Conversations (Chat history) ───────────────────────────
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  model         TEXT NOT NULL,
  provider      TEXT NOT NULL,
  system_prompt TEXT,
  last_message_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id, last_message_at DESC);


-- ─── Messages ───────────────────────────────────────────────
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content         TEXT NOT NULL,
  model           TEXT,
  task_id         TEXT,          -- if this message triggered an agent task (Nexus task_id)
  tokens_used     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);


-- ─── API Keys (BYOK, encrypted) ─────────────────────────────
-- (same table as in aitlas-ui-template)
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  iv            TEXT NOT NULL,
  hint          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_api_keys_user_provider ON api_keys(user_id, provider);


-- ─── MCP Connections ────────────────────────────────────────
CREATE TABLE mcp_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mcp_server_id     TEXT NOT NULL,    -- "github" | "notion" | "slack"
  display_name      TEXT NOT NULL,    -- "My GitHub"
  encrypted_config  TEXT NOT NULL,    -- JSON: { access_token, refresh_token, etc. }
  iv                TEXT NOT NULL,
  scopes            TEXT[],
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mcp_connections_user ON mcp_connections(user_id);


-- ─── User Preferences (Nova-specific) ───────────────────────
CREATE TABLE user_preferences (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_provider  TEXT DEFAULT 'openai',
  default_model     TEXT DEFAULT 'gpt-4o',
  default_system_prompt TEXT,
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  theme             TEXT DEFAULT 'system',
  pinned_actions    TEXT[] DEFAULT '{}',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── Hired Agents (local cache of Agent Store subscriptions) ─
CREATE TABLE hired_agents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_slug  TEXT NOT NULL,
  agent_name  TEXT NOT NULL,
  last_run_at TIMESTAMPTZ,
  run_count   INTEGER NOT NULL DEFAULT 0,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_hired_agents_unique ON hired_agents(user_id, agent_slug);
CREATE INDEX idx_hired_agents_user ON hired_agents(user_id, is_pinned DESC, last_run_at DESC);
```

---

## 19. Environment Variables

```bash
# ─── Database ──────────────────────────────────────────────
DATABASE_URL="postgresql://...@ep-xxx.eu-west-2.aws.neon.tech/nova?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://...@ep-xxx-direct.eu-west-2.aws.neon.tech/nova?sslmode=require"

# ─── Auth ──────────────────────────────────────────────────
BETTER_AUTH_SECRET="your-64-char-hex"
BETTER_AUTH_URL="https://nova.aitlas.xyz"
NEXT_PUBLIC_APP_URL="https://nova.aitlas.xyz"

# ─── Internal ──────────────────────────────────────────────
FURMA_INTERNAL_SECRET="your-internal-secret"
ENCRYPTION_KEY="your-64-char-hex-aes-key"

# ─── Nexus ─────────────────────────────────────────────────
NEXUS_API_URL="https://nexus.aitlas.xyz"
NEXUS_API_KEY="your-nexus-api-key"
NEXT_PUBLIC_NEXUS_WS_URL="wss://nexus.aitlas.xyz"

# ─── Agents Store ──────────────────────────────────────────
AGENTS_STORE_API_URL="https://api.agents.aitlas.xyz"
AGENTS_STORE_INTERNAL_SECRET="your-shared-internal-secret"

# ─── Hire Token ────────────────────────────────────────────
HIRE_TOKEN_SECRET="your-hire-token-signing-secret"

# ─── Actions ───────────────────────────────────────────────
# Base URLs for each action (used to proxy or deep-link)
NEXT_PUBLIC_RSRX_URL="https://rsrx.f.xyz"
NEXT_PUBLIC_TWYT_URL="https://twyt.f.xyz"
NEXT_PUBLIC_LIBRARY_URL="https://library.f.xyz"

# ─── Stripe (credits purchase) ─────────────────────────────
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
```

---

## 20. Infrastructure & Deployment

| Concern | Solution |
|---------|----------|
| Host | Vercel (Next.js native) |
| Domain | `nova.aitlas.xyz` |
| Build | `bun run build` |
| DB | Neon Postgres `eu-west-2` |
| WebSocket (Phoenix) | Client connects directly to `nexus.aitlas.xyz` |
| Static assets | Vercel CDN |
| Auth cookies | Domain: `.aitlas.xyz` (shared with Agents Store) |
| Secrets | Vercel environment variables |

### Vercel Config

```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ],
  "redirects": [
    { "source": "/", "destination": "/chat", "permanent": false }
  ]
}
```

---

## 21. Build Order

Build in this exact sequence. Each step is a shippable milestone.

### Phase 1 — Shell (Week 1)

- [ ] Scaffold from `aitlas-ui-template`
- [ ] Set up Neon DB + Drizzle + schema
- [ ] Better Auth + session
- [ ] Root layout: sidebar + topbar (from Mission Control)
- [ ] Route groups: `(auth)` + `(shell)`
- [ ] `/sign-in` + `/sign-up` pages
- [ ] `GET /api/health` working
- [ ] Sidebar navigation (locked icons for paid features)
- [ ] Credit badge in topbar (reads from DB)
- [ ] User menu + sign out

**Milestone:** Authenticated shell renders. Navigation works. Credits show.

---

### Phase 2 — Free Tier Chat (Week 2)

- [ ] Port MessageList + MessageInput + MessageBubble from T3 Code
- [ ] ModelSelector component (hardcoded catalog)
- [ ] `/settings/keys` page (BYOK key entry + validation)
- [ ] `POST /api/keys` + encryption
- [ ] Provider abstraction (`callOpenAI`, `callAnthropic`, `callGemini`)
- [ ] `POST /api/chat` SSE streaming route
- [ ] `StreamingMessage` component (live token display)
- [ ] `GET + POST /api/conversations` + message persistence
- [ ] Conversation list in sidebar
- [ ] `/chat` + `/chat/[id]` pages

**Milestone:** Free tier is fully functional. BYOK chat with token streaming.

---

### Phase 3 — Task Monitor (Week 3)

- [ ] `POST /api/tasks` → Nexus dispatch (gate: paid)
- [ ] Phoenix JS client (`phoenix` package)
- [ ] `useNexusStream` hook
- [ ] `NexusSocketProvider` in shell layout
- [ ] Port TaskList + TaskDetail from Symphony
- [ ] StepTimeline + StepCard components
- [ ] ToolResultCard component
- [ ] `/tasks` + `/tasks/[id]` pages
- [ ] Task polling fallback (3s interval if WS fails)
- [ ] Cancel task button (`DELETE /api/tasks/[id]`)
- [ ] AgentModeToggle in Chat (dispatches to /api/tasks instead of /api/chat)

**Milestone:** Agent tasks dispatch to Nexus. Steps stream live. Cancel works.

---

### Phase 4 — Replay + Dashboard (Week 4)

- [ ] ReplayControls component
- [ ] `POST /api/tasks/[id]/replay` proxy to Nexus
- [ ] ForkStepPicker + fork dispatch
- [ ] Export trace (JSON download)
- [ ] ShareRunButton (generates public URL)
- [ ] Port stats cards + activity feed from Mission Control
- [ ] `/dashboard` page with server-fetched data
- [ ] Credit history chart (recharts)
- [ ] CreditBadge optimistic updates

**Milestone:** Replay works. Dashboard shows real metrics.

---

### Phase 5 — Agents + Actions (Week 5)

- [ ] `/agents` page (hired agents list)
- [ ] `/agents/hire/[slug]` hire flow
- [ ] Hire token validation from Agents Store
- [ ] HireAgentPanel component
- [ ] RequirementsCheck (has key? has credits? has Pro?)
- [ ] ActionsPanel (paid sidebar in chat)
- [ ] Action deep-link buttons
- [ ] `/settings/connections` (MCP connections management)
- [ ] `/settings/credits` (balance + Stripe purchase flow)

**Milestone:** Full product connected. Agent hire → task → live stream → replay.

---

**Last Updated:** March 2026  
**Maintained by:** Herb (AI CTO) + Furma (CEO)

> *Nova is a surface, not a brain.*  
> *Build thin. Connect fast. Let Nexus do the work.*
