# Furma.tech - Technical Architecture

**Version:** 1.0.0  
**Date:** March 6, 2026  
**Status:** Production Ready

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Furma.tech Ecosystem                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐         ┌─────────────────┐       │
│  │  B2B SaaS       │         │  Aitlas         │       │
│  │  (Cash Engine)  │         │  (Growth)       │       │
│  │                 │         │                 │       │
│  │  restauManager  │         │  Nova (Hub)    │       │
│  │  tours/Guides   │         │  Agents (Store) │       │
│  │                 │         │  Actions (f.xyz)│       │
│  └─────────────────┘         └─────────────────┘       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Core Architecture Principles

### 1. Standardized Polyrepo Strategy

**Why:** Prevent AI context collapse (Cursor/Claude Code)

**Rules:**
- No monorepos
- Every product = isolated repo
- All clone from `furma-core-template`
- Communication via MCP only

### 2. Furma DNA (Every Repo Must Have)

| Component | File | Purpose |
|-----------|------|---------|
| **BYOK Encryption** | `lib/encryption.ts` | AES-256-GCM API key storage |
| **Logging** | `lib/logger.ts` | Pino structured logging |
| **Rate Limiting** | `lib/rate-limit.ts` | Upstash Redis |
| **Cache** | `lib/cache.ts` | LRU with TTL |
| **Database** | `lib/prisma.ts` | Prisma singleton |
| **Constants** | `lib/constants.ts` | Centralized config |
| **Worker** | `worker.ts` | Nexus runtime Nexus engine |

### 3. Zero Token Liability (BYOK Model)

```
User provides API key → Furma never pays for tokens
                      ↓
Furma monetizes compute (Nexus runtime) + infrastructure (f.decloy)
```

---

## Technology Stack

### Framework Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js 16 | UI + API gateway |
| **Runtime** | Bun | Speed + Nexus runtime execution |
| **Database** | PostgreSQL + pgvector | Relational + vector search |
| **ORM** | Prisma 6 | Type-safe database access |
| **UI** | React 19 + Tailwind v4 | shadcn/ui components |

### AI & Integration

| Component | Technology | Purpose |
|-----------|------------|---------|
| **AI Protocol** | MCP (Model Context Protocol) | Tool standardization |
| **Validation** | Zod | Schema validation |
| **Logging** | Pino | Structured logging |
| **Rate Limiting** | Upstash Redis | API protection |
| **Encryption** | AES-256-GCM | BYOK key storage |

### Infrastructure

| Layer | Platform | Purpose |
|-------|----------|---------|
| **UI** | Vercel | Edge deployment (60s timeout) |
| **Workers** | Hetzner/Railway | Nexus runtime (unlimited execution) |
| **Database** | Neon/Supabase | Serverless PostgreSQL |
| **Cache** | Upstash Redis | Rate limiting + caching |

---

## Asynchronous Execution Pattern (Nexus runtime)

### The Problem

```
Next.js (Vercel) → 60s timeout
AI agents → 5-30 minutes execution
Result → TIMEOUT ❌
```

### The Solution (Nexus runtime)

```
┌─────────────────┐
│  Next.js (UI)   │
│  Vercel/Edge    │
└────────┬────────┘
         │ 1. Create task
         │ 2. Return taskId (immediate)
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Neon)        │
└────────┬────────┘
         │ 3. Poll for PENDING
         │ 4. Execute (unlimited time)
         │ 5. Update COMPLETED
         ▼
┌─────────────────┐
│  Nexus runtime Worker  │
│  Hetzner/Railway│
│  (Bun 24/7)     │
└─────────────────┘
```

### Code Pattern

```typescript
// API route (returns immediately)
export async function POST(request: Request) {
  const task = await prisma.taskQueue.create({
    data: {
      userId: session.user.id,
      type: 'library_ingest',
      inputData: { content, title },
      status: 'PENDING',
    },
  });
  
  return Response.json({ taskId: task.id, status: 'PENDING' });
}

// Nexus runtime worker (unlimited execution)
async function processQueue() {
  const task = await prisma.taskQueue.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  });
  
  if (task) {
    // Check credits
    // Decrypt BYOK key
    // Execute task
    // Update COMPLETED + deduct credits
  }
  
  setTimeout(processQueue, 1000);
}
```

---

## Database Schema (Furma DNA)

### Core Models (Every Product)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  computeCredits Int      @default(0)  // THE PAYWALL
  apiKeys       ApiKey[]
  tasks         TaskQueue[]
  // ...product-specific relations
}

model ApiKey {
  id        String @id @default(cuid())
  userId    String
  provider  String // "ANTHROPIC", "OPENAI", "DEEPSEEK"
  keyData   String @db.Text  // AES-256-GCM encrypted
  iv        String  // Initialization vector
  authTag   String  // Authentication tag
  @@unique([userId, provider])
}

model TaskQueue {
  id          String   @id @default(cuid())
  userId      String
  type        String   // Task type
  status      String   @default("PENDING")
  currentStep Int      @default(0)
  maxSteps    Int      @default(15)  // Nexus loop safety
  inputData   Json
  stateData   Json?    // Nexus state history
  resultData  Json?
  creditsUsed Int      @default(0)
  @@index([userId])
  @@index([status, createdAt])
}
```

### Product-Specific Models

**f.library:**
- Item (documents, PDFs, highlights)
- Topic (categorization)
- Collection (grouping)

**f.rsrx:**
- Research (projects)
- Source (web pages, papers)
- Finding (extracted insights)

---

## Security Architecture

### BYOK Encryption (AES-256-GCM)

```typescript
// Encrypt before storage
const { encrypted, iv, authTag } = encryptApiKey(userApiKey);
await prisma.apiKey.create({
  data: { userId, provider, keyData: encrypted, iv, authTag }
});

// Decrypt in-memory only (garbage-collect after use)
const apiKey = decryptApiKey(encrypted, iv, authTag);
// Use for LLM call → immediately garbage-collect
```

### Multi-Tenancy Isolation

**Rule:** userId in EVERY Prisma query

```typescript
// ✅ CORRECT
const items = await prisma.item.findMany({
  where: { userId: session.user.id }
});

// ❌ WRONG (IDOR vulnerability)
const items = await prisma.item.findMany({
  where: { topicId }
});
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| API | 100 req | 1 minute |
| Auth | 5 req | 1 minute |
| Search | 30 req | 1 minute |
| MCP | 50 req | 1 minute |

---

## Credit System (The Paywall)

### Free Tier (Nova Chat)

```
User logs in → Pastes BYOK key → Chats with agents → FREE
```

**Furma cost:** $0 (user pays OpenAI/Anthropic directly)

### Paid Actions (f.xyz Tools)

| Action | Credits | USD Value |
|--------|---------|-----------|
| f.library search | 1 | ~$0.01 |
| f.library ingest | 2 | ~$0.02 |
| f.rsrx search | 2 | ~$0.02 |
| f.rsrx synthesize | 5 | ~$0.05 |
| Nexus loop | 10/hour | ~$0.10/hr |

### Credit Flow

```
User purchases credits → Stored in User.computeCredits
                       ↓
User triggers action → Check credits → Deduct → Execute
                       ↓
CreditTransaction logged (audit trail)
```

---

## Deployment Architecture

### Production Stack

```
┌─────────────────────────────────────────────────────────┐
│  Vercel (UI Layer)                                      │
│  - Next.js 16                                           │
│  - Edge functions (60s timeout)                         │
│  - Automatic SSL                                        │
└─────────────────────────────────────────────────────────┘
                          │
                          │ MCP calls
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Hetzner/Railway (Worker Layer - Nexus runtime)               │
│  - Bun runtime                                          │
│  - 24/7 execution (no timeout)                          │
│  - Nexus loop engine                                    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Database queries
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Neon (Database Layer)                                  │
│  - PostgreSQL + pgvector                                │
│  - Serverless (scale-to-zero)                           │
│  - Branching for dev/staging                            │
└─────────────────────────────────────────────────────────┘
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://furma.tech"
NEXTAUTH_SECRET=""

# BYOK Encryption (CRITICAL)
BYOK_ENCRYPTION_KEY=""  # openssl rand -base64 32

# Rate Limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# AI (for local LLM routing in Nexus runtime)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
```

---

## Monitoring & Observability

### Logging Strategy

```typescript
// Structured logging (Pino)
logger.info('Task created', { taskId: '123', userId: '456' });
logger.error('Task failed', error, { taskId: '123' });
```

**Production:** JSON format (log aggregation ready)  
**Development:** Pretty-print with colors

### Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time | <500ms (p95) | >1s |
| Task Execution Time | <5 min (p95) | >10 min |
| Worker Uptime | >99% | <95% |
| Credit Sales | $10k/mo (M12) | <50% target |
| Error Rate | <1% | >5% |

---

## Disaster Recovery

### Backup Strategy

| Component | Frequency | Retention |
|-----------|-----------|-----------|
| Database | Daily | 30 days |
| Code | Every commit | Forever (GitHub) |
| Environment | Manual | 90 days |

### Incident Response

1. **Detect** (monitoring alerts)
2. **Triage** (severity assessment)
3. **Contain** (rollback if needed)
4. **Fix** (hotfix deployment)
5. **Review** (post-mortem)

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering  
**Next Review:** April 6, 2026
