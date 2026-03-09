# Aitlas — Full Architecture Document
**Version:** 1.0 | **Date:** March 2026 | **Status:** Active Spec  
**Owner:** Furma.tech | **Maintained by:** Herb (AI CTO)

---

## Table of Contents

1. [Vision & Mental Model](#1-vision--mental-model)
2. [Product Map](#2-product-map)
3. [Nova — The Hub](#3-nexus--the-hub)
4. [Agents — The Store](#4-agents--the-store)
5. [Actions — The Engine (f.xyz)](#5-actions--the-engine-fxyz)
6. [The Ralph Engine (Nexus runtime)](#6-the-ralph-engine-floop)
7. [MCP Strategy & Protocol](#7-mcp-strategy--protocol)
8. [aitlas-core-template — The DNA](#8-aitlas-core-template--the-dna)
9. [Shared Data Models (Prisma)](#9-shared-data-models-prisma)
10. [Auth Architecture](#10-auth-architecture)
11. [Credit System](#11-credit-system)
12. [Security & BYOK](#12-security--byok)
13. [Infrastructure & Deployment](#13-infrastructure--deployment)
14. [API Design Conventions](#14-api-design-conventions)
15. [Inter-Service Communication](#15-inter-service-communication)
16. [AGENTS.md — AI Coding Rules](#16-agentsmd--ai-coding-rules)
17. [Repo Registry](#17-repo-registry)

---

## 1. Vision & Mental Model

### The One-Sentence Version
Aitlas is a **sovereign agentic OS** — a web workspace where users bring their own AI keys, connect tools via MCP, hire autonomous agents, and run long background tasks without trusting (or paying) a single cloud AI vendor.

### The Mental Model

```
The Internet         →   Browser
The OS               →   Nova
The App Store        →   Agents
The System Utilities →   Actions (f.xyz)
The Background Daemons → Nexus runtime (Ralph)
The File System      →   f.library
The Network Layer    →   MCP
```

### The Core Bets

| Bet | Why it wins |
|-----|-------------|
| BYOK over hosted tokens | Users keep costs. Furma keeps trust. |
| MCP as the lingua franca | Standards win. Proprietary protocols die. |
| Credits only for compute, never tokens | Avoids token-bankruptcy and user resentment |
| Agents as composable skill stacks | More powerful than single-prompt wrappers |
| Durable async tasks over serverless | Long jobs need persistence, not timeouts |

---

## 2. Product Map

```
aitlas.xyz (Root Domain)
├── nova.aitlas.xyz     → Nova Web App (Next.js, Vercel)
├── agents.aitlas.xyz    → Agents Store (Next.js, Vercel)
├── f.xyz                → Actions API Gateway (Next.js, Vercel)
│     ├── /twyt          → f.twyt service
│     ├── /library       → f.library service
│     ├── /rsrx          → f.rsrx service
│     ├── /loop          → Nexus runtime orchestrator
│     └── /guard         → f.guard service
└── loop.internal        → Ralph workers (Hetzner, Bun, private)
```

### The Dependency Graph

```
Nova
  └── depends on → Auth Service (shared)
  └── depends on → Credit Ledger (shared DB)
  └── orchestrates → Nexus runtime (via task queue)
  └── calls → Actions (f.xyz) via MCP
  └── displays → Agents (from Agents Store manifest API)

Agents Store
  └── depends on → Auth Service (shared)
  └── reads → Agent manifests (DB)
  └── triggers → Nexus agent activation

Nexus runtime (Ralph)
  └── polls → Task Queue (Postgres, Neon)
  └── calls → f.xyz Actions (via HTTP MCP)
  └── calls → Third-party MCPs (via user config)
  └── uses → BYOK key (decrypted in-memory, never logged)
  └── writes → Task state (Postgres)
```

---

## 3. Nova — The Hub

### What It Is
A web-based AI workspace. Think Claude.ai but where the user owns the LLM key, the tools, and the compute. The UI is the command center for everything in Aitlas.

### Core UI Surfaces

| Surface | Description |
|---------|-------------|
| **Chat Panel** | Primary chat interface. BYOK-powered. Two modes (see below). |
| **Actions Sidebar** | Displays available f.xyz actions + third-party MCPs. Greyed in Basic mode. |
| **Agent Panel** | Active agents, their status, and their current task queue. |
| **Task Monitor** | Real-time view of all background jobs (Ralph tasks) with step-by-step progress. |
| **Settings** | BYOK key management, credit balance, MCP connections, preferences. |

### The Dual-Mode System

#### Mode A: Standard Chat (Free)
```
System prompt injected:
"You are Aitlas, a helpful AI assistant. You are in Basic Chat Mode.
You have NO access to external tools. Only converse with the user.
Do not reference any tools, agents, or actions."

UI state:
- Actions Sidebar: locked (grey, tooltip: "Enable Agentic Mode to unlock")
- Agent Panel: hidden
- Task Monitor: hidden
- Cost to Furma: $0
```

#### Mode B: Agentic Mode (Credits Required)
```
System prompt injected:
"You are Aitlas, a sovereign AI operating system. You have access to
the following tools via MCP: [DYNAMIC TOOL LIST INJECTED HERE].
For long-running tasks, dispatch to Nexus runtime. Always confirm before
dispatching tasks that will cost more than 10 credits."

Gate:
- User must have Pro subscription ($25/mo) OR credit balance >= $5
- Toggle lives in top-right of chat interface

UI state:
- Actions Sidebar: active
- Agent Panel: visible
- Task Monitor: visible
- Cost to Furma: credits consumed per tool call
```

### Nova Data Flow (Agentic Mode)

```
[User sends message]
       │
       ▼
[Next.js API Route: /api/chat]
       │
       ├─ Validate session (Auth)
       ├─ Check credit balance (>= required)
       ├─ Decrypt BYOK key (AES-256-GCM, in-memory only)
       ├─ Build MCP tool list from user's enabled actions
       ├─ Build system prompt with tool registry
       │
       ▼
[Stream LLM response (user's BYOK key → OpenAI/Anthropic/etc.)]
       │
       ├─ If LLM calls a tool:
       │     ├─ Short task (<30s): execute inline via f.xyz HTTP
       │     └─ Long task (>30s): dispatch to Nexus runtime task queue
       │           └─ Return taskId to UI immediately
       │           └─ UI polls /api/tasks/:id for progress
       │
       ▼
[Stream response back to user via SSE]
```

### Nova Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 15 (App Router) | SSE streaming, API routes, edge-ready |
| Runtime | Bun | Fast install, fast scripts |
| Hosting | Vercel | Zero-ops, global CDN, edge functions |
| Streaming | Vercel AI SDK (`useChat`) | SSE + tool call parsing out of the box |
| UI | React 19 + Tailwind v4 + shadcn/ui | Speed + consistency |
| State | Zustand | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Type-safe, validated |
| DB Client | Prisma 6 (Neon Postgres) | Type-safe, migrations |
| Auth | Better Auth | Self-hosted, BYOK-safe, no Clerk lock-in |

---

## 4. Agents — The Store

### What It Is
A marketplace of pre-built "Super Agents" — each agent is a curated stack of: a base persona prompt, a set of Skills (tool calls), and a manifest declaring which f.xyz Actions and third-party MCPs it needs.

### Agent Anatomy

```typescript
// Agent Manifest (stored in DB, returned via API)
interface AgentManifest {
  id: string;
  name: string;               // "The Crypto Quant"
  description: string;        // User-facing description
  avatar: string;             // Image URL
  category: AgentCategory;    // "research" | "dev" | "finance" | "support" | ...
  isPremium: boolean;
  creditCostEstimate: number; // Credits per typical session
  
  basePrompt: string;         // The core persona (stored encrypted)
  
  skills: AgentSkill[];       // What this agent CAN do
  requiredActions: string[];  // f.xyz actions it needs: ["f.rsrx", "f.twyt"]
  requiredMCPs: MCPRequirement[]; // Third-party MCPs it needs
  
  author: {
    id: string;
    name: string;
    verified: boolean;
  };
  
  revenueShare: number;       // 0.70 = 70% to author, 30% to Furma
}
```

### Store Architecture

- **Agents Store** is a separate Next.js app (`agents.aitlas.xyz`)
- It is **read-only for browsing** (no auth required)
- **Hiring an agent** redirects to Nexus with `?agentId=xxx` param
- Nova activates the agent, checks required actions are available, charges credits

### Agent Activation Flow

```
[User clicks "Hire Agent" in Store]
         │
         ▼
[Redirect: nexus.aitlas.xyz/activate?agentId=xxx]
         │
         ├─ Auth check: Is user logged in?
         ├─ Credits check: Sufficient for agent's estimated cost?
         ├─ MCP check: Are required MCPs configured?
         │     └─ If not: show "Setup Required" modal with instructions
         │
         ▼
[Agent activated: stored in UserAgent table]
[Next chat session in Nova uses agent's basePrompt + skill set]
```

### Revenue Share Mechanics

| Event | Furma Cut | Author Cut |
|-------|-----------|------------|
| Free agent used | 100% (credits) | 0% |
| Premium agent subscription | 30% | 70% |
| Credits burned by premium agent's native actions | 100% (f.xyz margin) | 0% |
| Credits burned by premium agent's MCP calls | 100% (if f.xyz MCP) | 0% |

> **Key insight:** Furma makes money on the compute (f.xyz credits), not just the agent sale. Authors make money on subscriptions. Aligned incentives: authors want powerful agents that use f.xyz tools.

---

## 5. Actions — The Engine (f.xyz)

### What Actions Are
Actions are **Furma-native MCP servers** — each is a standalone microservice that exposes one domain of capability through the MCP tool protocol. They are the monetized compute layer of Aitlas.

### Actions vs. Third-Party MCPs

| | Aitlas Actions (f.xyz) | Third-Party MCPs |
|--|------------------------|------------------|
| Built by | Furma.tech | Community / GitHub |
| Hosted on | Hetzner / Vercel | User or provider |
| Trust level | Verified & audited | Experimental |
| Credit cost | Yes — Furma revenue | No (user pays provider) |
| Fallback? | No (gated) | N/A |
| Example | f.rsrx, f.twyt | Google Search MCP |

### Actions Registry

| Action | MCP Tool Name | Description | Credit Cost | Status |
|--------|--------------|-------------|-------------|--------|
| **Nexus runtime** | `dispatch_background_task` | Dispatch long async jobs to Ralph | 10/hr of compute | 🟡 Dev |
| **f.twyt** | `search_twitter`, `get_user_timeline` | Twitter semantic search & ingestion | 1/query | ✅ Prod |
| **f.library** | `ingest_document`, `search_knowledge_base` | Vector knowledge base (pgvector) | 2/ingest, 1/search | ✅ Prod |
| **f.rsrx** | `deep_research`, `synthesize_report` | Multi-source research synthesis | 5/report | 🟡 Dev |
| **f.guard** | `review_code`, `security_scan` | AI code review + security audit | 2/review | 🟡 Roadmap |
| **f.support** | `create_ticket`, `resolve_ticket` | Autonomous helpdesk agent | 3/ticket | 🟡 Roadmap |
| **f.decloy** | `deploy_agent`, `get_agent_status` | Sovereign MicroVM agent deployment | 75/deploy | 🟡 Roadmap |

### Action Architecture Pattern

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

## 6. The Ralph Engine (Nexus runtime)

### What It Is
Ralph is Aitlas's **durable background execution layer** — a fleet of Bun workers running on Hetzner that pick up long-running agentic tasks from the PostgreSQL task queue and execute them step-by-step, surviving server reboots, LLM errors, and network failures.

### Why Not Serverless?
Vercel functions timeout at 60 seconds. Agentic tasks (deep research, autonomous support, code review of large repos) can take 5–30 minutes. Ralph runs on long-lived Bun processes that are cheap ($5–20/mo Hetzner VPS), persistent, and horizontally scalable.

### Ralph Architecture

```
┌──────────────────────────────────────────────────┐
│                  Nexus runtime (Ralph)                   │
│             Bun Worker Process                    │
│             Hetzner VPS (loop.internal)           │
├──────────────────────────────────────────────────┤
│                                                   │
│  OBSERVE (every 5 seconds)                        │
│  ├── SELECT * FROM tasks                          │
│  │   WHERE status = 'PENDING'                     │
│  │   ORDER BY created_at ASC                      │
│  │   LIMIT 1                                      │
│  │   FOR UPDATE SKIP LOCKED  ← concurrency-safe  │
│  └── Load task.toolRegistry (available MCP tools) │
│                                                   │
│  REASON                                           │
│  ├── Decrypt BYOK key (in-memory, never logged)   │
│  ├── Build prompt: goal + available tools + steps │
│  └── Call user's LLM (BYOK): "What's next step?"  │
│                                                   │
│  ACT                                              │
│  ├── Execute LLM tool call via MCP                │
│  ├── If f.xyz tool: deduct credits (atomic)       │
│  ├── Append result to task.steps[]                │
│  └── UPDATE task SET status='RUNNING',            │
│       steps=..., updated_at=now()                 │
│                                                   │
│  EVALUATE                                         │
│  ├── If LLM says "DONE": status = 'COMPLETED'     │
│  ├── If maxSteps reached: status = 'TIMEOUT'      │
│  ├── If error: status = 'FAILED', log error       │
│  └── If PENDING: loop back to OBSERVE             │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Task State Machine

```
PENDING → CLAIMED → RUNNING → COMPLETED
                         └──→ FAILED
                         └──→ TIMEOUT
                         └──→ CANCELLED (user-initiated)
```

---

## 7. MCP Strategy & Protocol

### Philosophy
MCP (Model Context Protocol) is the **nervous system of Aitlas**. Every interaction between Nexus and a tool — whether native (f.xyz) or third-party — goes through MCP. This means any MCP-compatible tool in the ecosystem works in Aitlas automatically.

### MCP Transport: HTTP (Streamable)
All f.xyz actions expose a **streamable HTTP MCP endpoint** at `/api/mcp`. This is the 2024 MCP standard (replaces old SSE transport). It supports both streaming and non-streaming tool calls.

```
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

## 8. aitlas-core-template — The DNA

### Purpose
Every single repo in the Aitlas ecosystem — Nexus, each f.xyz action, the Agents Store — is **cloned from this template**. It ensures zero configuration drift, shared auth, shared types, and consistent AI coding behavior.

### Template Structure

```
aitlas-core-template/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/route.ts    ← Better Auth handler
│   │   ├── health/
│   │   │   └── route.ts             ← GET /api/health (uptime monitoring)
│   │   └── mcp/
│   │       └── route.ts             ← MCP server endpoint (override per service)
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   └── layout.tsx
├── lib/
│   ├── auth.ts                      ← Better Auth config (shared)
│   ├── auth-client.ts               ← Client-side auth hooks
│   ├── db.ts                        ← Prisma client singleton
│   ├── mcp-server.ts                ← Empty MCP server (override per service)
│   ├── credit-middleware.ts         ← Credit check + deduct (shared logic)
│   ├── encryption.ts                ← AES-256-GCM helpers
│   ├── logger.ts                    ← Pino structured logger
│   ├── rate-limit.ts                ← Upstash Redis rate limiter
│   └── env.ts                       ← Type-safe env vars (t3-env)
├── prisma/
│   └── schema.prisma                ← Base schema (User, ApiKey, Task, Credits)
├── components/
│   └── ui/                          ← shadcn/ui components
├── AGENTS.md                        ← AI coding rules (CRITICAL — see §16)
├── .env.example                     ← All required env vars documented
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 9. Shared Data Models (Prisma)

The **base schema** lives in `aitlas-core-template/prisma/schema.prisma` and is copied to each repo. Each service only includes the models it needs, plus its own service-specific models.

```prisma
// ─── CORE (every service has this) ───────────────────────────────────────

model User {
  id              String      @id @default(cuid())
  email           String      @unique
  name            String?
  emailVerified   Boolean     @default(false)
  computeCredits  Int         @default(0)
  planTier        PlanTier    @default(FREE)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  apiKeys         ApiKey[]
  sessions        Session[]
  tasks           Task[]
  userAgents      UserAgent[]
  toolRegistry    ToolRegistry[]
  creditLedger    CreditLedgerEntry[]
}

enum PlanTier {
  FREE
  PRO
  ENTERPRISE
}

// ─── AUTH (Better Auth managed) ──────────────────────────────────────────

model Session {
  id          String   @id @default(cuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─── BYOK KEY STORAGE (AES-256-GCM encrypted) ────────────────────────────

model ApiKey {
  id        String      @id @default(cuid())
  userId    String
  provider  LLMProvider
  keyData   String      // Encrypted ciphertext
  iv        String      // Initialization vector (hex)
  tag       String      // Auth tag (hex)
  createdAt DateTime    @default(now())
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, provider])
}

enum LLMProvider {
  OPENAI
  ANTHROPIC
  DEEPSEEK
  GEMINI
  GROQ
}

// ─── CREDIT LEDGER (append-only, immutable) ───────────────────────────────

model CreditLedgerEntry {
  id          String          @id @default(cuid())
  userId      String
  delta       Int             // Positive = credit, Negative = debit
  balance     Int             // Snapshot balance after this entry
  reason      String          // "purchase", "f.twyt:search_twitter", "monthly_grant"
  referenceId String?         // taskId, paymentId, etc.
  createdAt   DateTime        @default(now())
  user        User            @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}

// ─── TASK QUEUE (Ralph's job board) ───────────────────────────────────────

model Task {
  id               String       @id @default(cuid())
  userId           String
  status           TaskStatus   @default(PENDING)
  goal             String       @db.Text
  agentId          String?
  toolRegistry     Json         // Serialized MCPToolRef[]
  steps            Json         @default("[]") // TaskStep[]
  currentStep      Int          @default(0)
  maxSteps         Int          @default(50)
  creditsReserved  Int          @default(0)
  creditsUsed      Int          @default(0)
  workerId         String?
  errorMessage     String?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  completedAt      DateTime?
  user             User         @relation(fields: [userId], references: [id])
  
  @@index([status, createdAt])
}

enum TaskStatus {
  PENDING
  CLAIMED
  RUNNING
  COMPLETED
  FAILED
  TIMEOUT
  CANCELLED
}

// ─── AGENTS (Agents Store) ────────────────────────────────────────────────

model Agent {
  id                  String        @id @default(cuid())
  name                String
  description         String        @db.Text
  avatarUrl           String?
  category            String
  isPremium           Boolean       @default(false)
  creditCostEstimate  Int           @default(5)
  basePrompt          String        @db.Text
  skillsJson          Json          // AgentSkill[]
  requiredActionsJson Json          // string[]
  requiredMCPsJson    Json          // MCPRequirement[]
  authorId            String
  revenueShare        Float         @default(0.70)
  isPublished         Boolean       @default(false)
  createdAt           DateTime      @default(now())
  userAgents          UserAgent[]
}

model UserAgent {
  id          String   @id @default(cuid())
  userId      String
  agentId     String
  activatedAt DateTime @default(now())
  isActive    Boolean  @default(true)
  user        User     @relation(fields: [userId], references: [id])
  agent       Agent    @relation(fields: [agentId], references: [id])
  
  @@unique([userId, agentId])
}

// ─── TOOL REGISTRY (per user) ─────────────────────────────────────────────

model ToolRegistry {
  id           String   @id @default(cuid())
  userId       String
  toolType     String   // "native_action" | "third_party_mcp"
  name         String
  mcpEndpoint  String
  isEnabled    Boolean  @default(true)
  configData   String?  // Encrypted credentials
  addedAt      DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, name])
}
```

---

## 10. Auth Architecture

### Choice: Better Auth
**Why not Clerk?** Clerk stores user data on their servers. For a BYOK-first, sovereign product, auth must be self-hosted. Better Auth runs entirely in our Neon Postgres instance.

**Why not NextAuth?** Better Auth has better TypeScript support, built-in 2FA, passkeys, and a cleaner API.

### Cross-Service Auth (Service-to-Service)

When Nexus calls an f.xyz action on behalf of a user:

```
1. Nexus has user session
2. Nexus calls f.twyt.xyz/api/mcp
   - Header: Authorization: Bearer <session_token>
   - Header: X-Furma-Internal: <FURMA_INTERNAL_SECRET>
3. f.twyt validates the session token against shared Neon DB
   (both services connect to same DB — session is valid cross-service)
4. If valid: extract userId, proceed with credit check
```

> **Key:** Because all services share the same Neon Postgres, a session token created in Nexus is valid in any f.xyz service. No JWT overhead, no token passing, just shared DB lookup.

---

## 11. Credit System

### Design Principles
1. **Append-only ledger** — never UPDATE credits directly. Always INSERT a ledger entry.
2. **Atomic operations** — credit check and task creation must be in the same DB transaction.
3. **Reserve on dispatch, settle on completion** — prevents double-spending on parallel tasks.
4. **Never charge for failed tool calls** — only deduct on successful execution.

### Credit Pricing Table

| Action | Credits | USD Equivalent (at $0.01/credit) |
|--------|---------|----------------------------------|
| Pro subscription/mo | +500 credits granted | $25/mo includes $5 credit value |
| Credit pack (100) | $1 | $0.01/credit |
| Credit pack (1,000) | $8 | $0.008/credit |
| f.twyt search | 1 credit | $0.01 |
| f.library ingest | 2 credits | $0.02 |
| f.library search | 1 credit | $0.01 |
| f.rsrx deep research | 5 credits | $0.05 |
| f.guard code review | 2 credits | $0.02 |
| f.support ticket | 3 credits | $0.03 |
| Nexus runtime compute (per hour) | 10 credits | $0.10/hr |

---

## 12. Security & BYOK

### BYOK Threat Model
Users trust Aitlas with their OpenAI/Anthropic API keys. A breach would expose their billing to adversarial use. The security model must prevent:
- Keys readable from DB breach
- Keys in server logs
- Keys in error messages
- Keys in memory longer than needed

### AES-256-GCM Encryption

```typescript
// lib/encryption.ts
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encryptApiKey(plaintext: string): {
  keyData: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  return {
    keyData: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
}

export function decryptApiKey(keyData: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(keyData, 'hex')),
    decipher.final()
  ]);
  
  // CRITICAL: This string must never be logged, stored, or included in errors
  return decrypted.toString('utf8');
}
```

### Security Rules (Enforced in AGENTS.md)
- `decryptApiKey()` result must NEVER be assigned to a variable named in a way that could be logged
- Never `console.log` or `logger.info` anything containing an API key
- Keys are decrypted **in the Ralph worker**, never in the Next.js API route
- The Next.js route writes the encrypted key to the task queue — Ralph decrypts at execution time
- `ENCRYPTION_KEY` rotates every 90 days (re-encrypt all keys on rotation)

---

## 13. Infrastructure & Deployment

### Service Map

| Service | Host | Scaling |
|---------|------|---------|
| nexus.aitlas.xyz | Vercel | Auto (edge) |
| agents.aitlas.xyz | Vercel | Auto (edge) |
| f.xyz (all actions) | Vercel | Auto (edge) |
| Nexus runtime (Ralph) | Hetzner CX21 | Manual horizontal |
| PostgreSQL | Neon (serverless) | Auto |
| Redis | Upstash | Auto |
| Static assets | Vercel / Cloudflare CDN | Auto |

---

## 14. API Design Conventions

### URL Structure
```
/api/v1/[resource]/[id]/[action]

Examples:
POST   /api/v1/tasks              ← Create task
GET    /api/v1/tasks/:id          ← Get task status
DELETE /api/v1/tasks/:id          ← Cancel task
POST   /api/v1/credits/purchase   ← Buy credits
GET    /api/v1/credits/balance    ← Get balance
POST   /api/v1/keys               ← Store BYOK key
DELETE /api/v1/keys/:provider     ← Remove BYOK key
POST   /api/mcp                   ← MCP endpoint (all f.xyz services)
```

### Response Format (All APIs)

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_01j...",
    "timestamp": "2026-03-06T10:00:00Z"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You need 5 credits, but have 3.",
    "details": { "required": 5, "available": 3 }
  }
}
```

---

## 15. Inter-Service Communication

### The Two Patterns

**Pattern 1: Synchronous MCP call (short tasks)**
```
Nexus → HTTP POST f.xyz/api/mcp → Result → Stream to user
Max duration: 25 seconds (Vercel limit)
Use for: Single tool calls, quick lookups
```

**Pattern 2: Async task dispatch (long tasks)**
```
Nexus → Write task to Postgres → Return taskId to UI
                    ↓
               Ralph picks up
               Ralph executes (minutes)
               Ralph writes steps + result
                    ↓
UI polls GET /api/tasks/:id every 3s → Shows live progress
```

---

## 16. AGENTS.md — AI Coding Rules

This file lives in the root of every repo and is the first thing AI coding assistants (Cursor, Copilot, Claude Code) read. It prevents hallucinations and enforces Furma conventions.

**See `/AGENTS.md` for the full rules.**

Key rules:
- NEVER create a monorepo. This is an isolated service.
- NEVER log, console.log, or include in error messages anything that could be an API key.
- ALL database mutations must use Prisma transactions.
- ALL API routes return the standard response format.
- ALL user inputs must be validated with Zod.
- Rate limiting is REQUIRED on all public API routes.
- NEVER deduct credits unless the tool call succeeded.

---

## 17. Repo Registry

| Repo | Domain | Stack | Status |
|------|--------|-------|--------|
| `aitlas-core-template` | — | Next.js 15 + Bun | ✅ Maintained |
| `aitlas-nexus` | nexus.aitlas.xyz | Nova web app | 🟡 Development |
| `aitlas-agents` | agents.aitlas.xyz | Agents Store | 🟡 Development |
| `aitlas-loop` | loop.internal | Ralph (Bun, Hetzner) | 🟡 Development |
| `f-twyt` | f.xyz/twyt | Twitter action | ✅ Production |
| `f-library` | f.xyz/library | Vector KB action | ✅ Production |
| `f-rsrx` | f.xyz/rsrx | Research action | 🟡 Development |
| `f-guard` | f.xyz/guard | Code review action | 🟡 Roadmap |
| `f-support` | f.xyz/support | Helpdesk action | 🟡 Roadmap |
| `f-decloy` | f.xyz/decloy | Agent deployment | 🟡 Roadmap |

---

## Appendix A: Decision Log

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| Repo structure | Polyrepo | Monorepo | Isolated context for AI coders, no toolchain complexity |
| Auth | Better Auth | Clerk, NextAuth | Self-hosted, BYOK-safe, TypeScript-first |
| Task queue | Postgres polling | BullMQ, Trigger.dev | Zero new infrastructure, Neon already there |
| Background workers | Bun on Hetzner | Vercel crons, AWS Lambda | Duration limits, cost, simplicity |
| MCP transport | HTTP streamable | SSE (deprecated) | Current MCP standard, works with all clients |
| DB | Neon Postgres | PlanetScale, Supabase | pgvector support, serverless, Prisma-first |
| Encryption | AES-256-GCM | Vault, KMS | Zero new infra, auditable, standard |

---

**Last Updated:** March 6, 2026  
**Next Review:** April 6, 2026  
**Maintained by:** Herb (AI CTO) + Furma (CEO)

> *Build fast. Stay sovereign. Zero token liability.*