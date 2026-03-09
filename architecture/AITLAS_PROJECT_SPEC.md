# AITLAS_PROJECT_SPEC.md


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Version:** 1.0.0  
**Created:** 2026-03-07  
**Status:** ✅ Production Standard

> Standard specification for all Aitlas projects. Ensures consistency, maintainability, and interoperability across the Aitlas ecosystem.

---

## 1. Project Types


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


Aitlas projects fall into three categories:

### 1.1 UI Projects


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Template:** `aitlas-ui-template`  
**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui

**Use Cases:**
- Dashboards (Nova, Agents Store)
- Product landing pages
- Admin interfaces
- User-facing applications

**Structure:**
```
my-ui-project/
├── app/                    # Next.js App Router


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   ├── (auth)/            # Public auth routes


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   ├── (dashboard)/       # Protected routes


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   ├── api/               # API routes


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   └── layout.tsx
├── components/
│   └── ui/               # shadcn/ui components


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

├── lib/
│   ├── auth.ts           # Better Auth config


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   ├── db.ts             # Prisma client


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   └── ...
├── prisma/
│   └── schema.prisma
├── __tests__/
└── docs/
```

**Required Features:**
- [ ] Better Auth integration
- [ ] Prisma database layer
- [ ] Credit system
- [ ] Rate limiting
- [ ] BYOK support
- [ ] Health endpoint (`/api/health`)
- [ ] Comprehensive tests (60%+ coverage)

---

### 1.2 Action Projects


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Template:** `aitlas-action-template`  
**Stack:** Hono + MCP + TypeScript + Prisma

**Use Cases:**
- API services (f.xyz actions)
- MCP tool servers
- Microservices
- AI agent integrations

**Structure:**
```
my-action/
├── src/
│   ├── index.ts           # Entry point


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   ├── routes/            # API routes


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   ├── lib/
│   │   ├── mcp/           # MCP server


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   │   ├── tools/         # Tool implementations


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   │   └── ...
│   └── tools/             # Auto-registered tools


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

├── prisma/
├── __tests__/
├── scripts/
│   └── create-tool.ts     # Tool generator


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

└── docs/
```

**Required Features:**
- [ ] MCP server with tool registration
- [ ] Credit system integration
- [ ] Rate limiting (Upstash Redis)
- [ ] Health endpoint (`/health`)
- [ ] Tool generator CLI
- [ ] Comprehensive tests (70%+ coverage)
- [ ] ACTION.md manifest

---

### 1.3 Worker Projects


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Template:** `aitlas-worker-template`  
**Stack:** Bun + PostgreSQL + Prisma

**Use Cases:**
- Background job processing
- Scheduled tasks
- Data pipelines
- Async workflows

**Structure:**
```
my-worker/
├── src/
│   ├── index.ts           # Entry point


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   ├── worker.ts          # Worker implementation


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   ├── queue.ts           # Queue management


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   ├── jobs/              # Job definitions


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

│   └── lib/
│       ├── db.ts
│       ├── logger.ts
│       └── metrics.ts
├── prisma/
├── src/**/*.test.ts
└── docs/
```

**Required Features:**
- [ ] Job system with registry
- [ ] Retry logic with backoff
- [ ] Metrics (Prometheus format)
- [ ] Health endpoints (`/health`, `/metrics`)
- [ ] Comprehensive tests (70%+ coverage)
- [ ] WORKER.md manifest

---

## 2. Shared Standards


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### 2.1 Database


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Provider:** Neon PostgreSQL  
**ORM:** Prisma  
**Region:** eu-west-2 (London)

**Shared Schema:**
All projects MUST include the base Aitlas schema:
- `User` - User accounts
- `Session` - Auth sessions
- `Account` - OAuth accounts
- `ApiKey` - BYOK encrypted keys
- `CreditLedger` - Credit tracking
- `CreditBalance` - User balances

**Custom Models:**
Prefix with service name (e.g., `TwytQuery`, `NovaProject`)

### 2.2 Authentication


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Provider:** Better Auth  
**Secret:** Shared across all services (`BETTER_AUTH_SECRET`)

**Requirements:**
- Email/password auth
- Session management
- Protected routes
- OAuth support (Google, GitHub)

### 2.3 Encryption (BYOK)


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Algorithm:** AES-256-GCM  
**Key:** Shared across all services (`ENCRYPTION_KEY`)

**Usage:**
- Encrypt user API keys before storage
- Decrypt in-memory only when used
- Never log or expose decrypted keys

### 2.4 Credit System


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Purpose:** Track and deduct credits for actions

**Implementation:**
```typescript
import { deductCredits } from '@/lib/credit-middleware';

await deductCredits({
  userId: 'user_123',
  amount: 5,
  reason: 'action:search_tweets',
  referenceId: 'search_456',
});
```

**Credit Costs:**
- Read operations: 1-2 credits
- Write operations: 3-5 credits
- Complex operations: 5-10 credits

### 2.5 Rate Limiting


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Provider:** Upstash Redis  
**Types:**
- `api` - 100 requests/60s
- `auth` - 5 requests/60s
- `search` - 30 requests/60s
- `ingest` - 10 requests/60s
- `mcp` - 50 requests/60s

**Fallback:** In-memory for development

### 2.6 Logging


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Provider:** Pino  
**Format:** JSON  
**Level:** info (production), debug (development)

**Usage:**
```typescript
import { logger } from '@/lib/logger';

logger.info({ userId: '123' }, 'User logged in');
logger.error({ error }, 'Operation failed');
```

---

## 3. Environment Variables


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### 3.1 Required (All Projects)


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


```bash
# Database


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."

# Auth


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Encryption


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

ENCRYPTION_KEY="..."

# Inter-service Auth


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

FURMA_INTERNAL_SECRET="..."

# Service Identity


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

SERVICE_NAME="my-service"
NODE_ENV="production"
```

### 3.2 Optional


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


```bash
# Redis (Rate Limiting)


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# OAuth


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Monitoring


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

HEALTHCHECK_UUID="..."
```

---

## 4. Testing Standards


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### 4.1 Framework


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Provider:** Vitest  
**Coverage Target:** 70%+

### 4.2 Test Categories


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


1. **Unit Tests** - Individual functions/components
2. **Integration Tests** - API routes, database
3. **E2E Tests** - Full user flows (optional)

### 4.3 Test Structure


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


```typescript
// __tests__/feature.test.ts
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### 4.4 Required Tests


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**UI Projects:**
- Auth flows (signup, login, logout)
- Credit operations
- API routes
- Key components

**Action Projects:**
- MCP server (initialize, tools/list, tools/call)
- Tool execution
- Credit deduction
- Rate limiting

**Worker Projects:**
- Job registry
- Retry logic
- Metrics export
- Health endpoints

---

## 5. Documentation Standards


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### 5.1 Required Files


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


Every project MUST have:
- `README.md` - Project overview, quick start
- `AGENTS.md` - AI coding rules
- `.env.example` - Environment variables
- `docs/` - Detailed documentation

### 5.2 README Structure


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


```markdown
# Project Name


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Type:** UI/Action/Worker | **Stack:** ... | **Status:** ...

> One-line description

## Features


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


## Quick Start


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


## Configuration


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


## Usage


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


## Development


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


## Deployment


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


## License


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

```

### 5.3 Documentation Folder


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


```
docs/
├── getting-started/
├── architecture/
├── developer-guide/
├── api/
└── products/
```

---

## 6. Deployment Standards


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### 6.1 Platforms


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**UI Projects:** Vercel (preferred), Netlify, Docker  
**Action Projects:** Docker, Hetzner, Railway  
**Worker Projects:** Hetzner (persistent), Docker

### 6.2 Environment Variables


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


All required env vars must be set in deployment platform.

### 6.3 Health Checks


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


All projects must expose `/health` endpoint for monitoring.

### 6.4 Monitoring


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


**Recommended:**
- Healthchecks.io for uptime monitoring
- Prometheus + Grafana for metrics
- Pino logs for debugging

---

## 7. Security Standards


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### 7.1 Authentication


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- All user-facing routes must require auth
- API routes must validate tokens
- Sessions must expire

### 7.2 Authorization


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- Users can only access their own data
- Implement row-level security in Prisma queries
- Validate user ownership

### 7.3 Data Protection


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- Encrypt sensitive data (BYOK keys)
- Never log sensitive information
- Use HTTPS in production

### 7.4 Rate Limiting


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- All public endpoints must be rate-limited
- Auth endpoints: 5 requests/minute
- API endpoints: 100 requests/minute

---

## 8. Quality Standards


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### 8.1 Code Quality


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- TypeScript strict mode
- ESLint passing
- Prettier formatted
- No `any` types (use `unknown` or proper types)

### 8.2 Performance


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- Database queries optimized (use indexes)
- API responses < 500ms
- Bundle size < 500KB (UI projects)

### 8.3 Reliability


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- Error handling on all async operations
- Graceful degradation (mock data fallback)
- Retry logic for transient failures

---

## 9. Project Lifecycle


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### 9.1 Creation


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


```bash
aitlas new <type> <project-name>
cd <project-name>
bun install
cp .env.example .env
# Edit .env


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

bun db:generate
bun db:migrate
bun dev
```

### 9.2 Development


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


```bash
# Run dev server


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

bun dev

# Run tests


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

bun test

# Type check


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

bun run typecheck

# Commit


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

git add -A
git commit -m "feat: description"
git push
```

### 9.3 Deployment


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


```bash
# Build


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

bun run build

# Deploy (Vercel example)


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

vercel --prod
```

### 9.4 Maintenance


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- Monitor health endpoints
- Review error logs weekly
- Update dependencies monthly
- Run security audits quarterly

---

## 10. Examples


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### 10.1 UI Project: Nova


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- **Type:** UI
- **Purpose:** AI Command Center
- **Features:** Dashboard, agent management, task tracking
- **Deployed:** Vercel

### 10.2 Action Project: f-twyt


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- **Type:** Action
- **Purpose:** Twitter/X API integration
- **Features:** MCP tools, web dashboard, search, timeline
- **Deployed:** Vercel

### 10.3 Worker Project: (TBD)


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- **Type:** Worker
- **Purpose:** Background job processing
- **Features:** Job queue, retry logic, metrics
- **Deployed:** Hetzner

---

## Appendix A: Checklist


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


### Pre-Launch Checklist


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- [ ] All required env vars configured
- [ ] Database migrations run
- [ ] Tests passing (70%+ coverage)
- [ ] TypeScript compiles without errors
- [ ] README.md complete
- [ ] Documentation in `/docs`
- [ ] Health endpoint working
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Logging configured

### Post-Launch Checklist


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- [ ] Monitoring set up
- [ ] Error alerts configured
- [ ] Backup strategy implemented
- [ ] Documentation published
- [ ] Team trained

---

## Appendix B: Resources


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---


- **Templates:** https://github.com/Fuuurma/aitlas-*-template
- **CLI:** https://github.com/Fuuurma/aitlas-cli
- **Docs:** https://docs.openclaw.ai
- **Community:** https://discord.gg/clawd

---

*This spec is living documentation. Update as the ecosystem evolves.*

**Maintained by:** Furma.tech  
**Last Updated:** 2026-03-07

---\n
# Aitlas Template Strategy — Locked Decisions
**Version:** 1.0 | **Date:** March 2026 | **Status:** LOCKED — Do not change without Herb sign-off  
**Scope:** All Aitlas ecosystem repos

---

## The Decision: Option B + CLI Wrapper

**Separate template repos per type, with a generator CLI on top.**

This is the only option compatible with the polyrepo-first strategy.
Monorepos are explicitly banned (context collapse in AI coders).
The CLI is a thin convenience layer — it doesn't add architectural complexity.

```
GitHub: Fuuurma/
├── aitlas-ui-template        ← Next.js 15 + shadcn (Nova, Agents Store, dashboards)
├── aitlas-action-template    ← Hono + MCP (all f.xyz actions)
├── aitlas-worker-template    ← Bun + Postgres queue (Nexus / Nexus runtime workers)
└── aitlas-cli                ← Generator CLI: `aitlas new <type> <name>`
```

Shared logic is **copied into each repo at scaffold time**, not imported from a shared package.
This is intentional. It eliminates cross-repo dependency hell at the cost of some duplication.
The duplication is managed by the CLI scaffolding the correct version at clone time.

> **Rule:** No `@aitlas/*` npm packages in v1. Copy-on-scaffold. Revisit at 10+ active repos.

---

## Three Template Types

| Template | Stack | Used For | Host |
|----------|-------|----------|------|
| `ui` | Next.js 15 + Bun + shadcn/ui + Better Auth | Nova, Agents Store, product dashboards | Vercel |
| `action` | Hono + Bun + Zod + MCP | All f.xyz actions (f.twyt, f.rsrx, f.library…) | Vercel (serverless) |
| `worker` | Bun + Postgres + Pino | Nexus (Nexus runtime), schedulers, watchers | Hetzner (long-running) |

### Decision Guide

```
Need a user-facing web UI?         → ui template
Need an MCP tool server / API?     → action template
Need a long-running background job? → worker template
Need UI + light API together?      → ui template (Next.js API routes handle it)
```

---

## Shared Database Strategy

All Aitlas services share **one Neon Postgres instance**.

This is the architectural foundation of the cross-service auth and credit system.

```
Neon Postgres (single instance)
├── All User records
├── All Session records (Better Auth — valid cross-service)
├── All ApiKey records (encrypted BYOK keys)
├── All CreditLedger records
├── All Task records (Nexus runtime queue)
├── All ToolRegistry records
└── Service-specific tables (prefixed by service name)
```

### How it works in practice

Every template ships with the **full base Prisma schema** (User, Session, ApiKey, CreditLedger, Task, ToolRegistry, Agent, UserAgent).

Each service adds its own models in the same `schema.prisma` file — prefixed with the service name to avoid collisions:

```prisma
// f.twyt adds:
model TwytQuery {
  id        String   @id @default(cuid())
  userId    String
  query     String
  results   Json
  createdAt DateTime @default(now())
}
```

**Migration rule:** Service-specific migrations run from that repo. Core schema migrations run from `aitlas-nexus` (the canonical source).

### Cross-service auth (how it works)

Because sessions live in the shared DB, any service can validate a Nexus session token:

```typescript
// In f.twyt (action template):
// The user's session token from Nexus is valid here.
// Both services point to the same Neon DB.
// No JWT. No token exchange. Just a DB lookup.

const session = await auth.api.getSession({ headers: req.headers });
// session.user.id is valid — same User table
```

### Connection strings

```bash
# Pooled connection — use in all services (workers, API routes)
DATABASE_URL=postgresql://...@ep-xxx.pooler.neon.tech/aitlas?pgbouncer=true

# Direct connection — use ONLY for migrations (never in workers)
DATABASE_URL_UNPOOLED=postgresql://...@ep-xxx.neon.tech/aitlas
```

---

## The CLI

Simple generator. Not a framework. Does one thing.

```bash
# Install
npm install -g @aitlas/cli

# Scaffold a new product
aitlas new ui aitlas-nexus
aitlas new ui aitlas-agents
aitlas new action f-twyt
aitlas new action f-rsrx
aitlas new worker aitlas-nexus
```

### What the CLI does

1. Copies the correct template into a new directory
2. Renames all placeholder strings (`{{PROJECT_NAME}}` → `f-twyt`)
3. Runs `bun install`
4. Runs `git init && git add . && git commit -m "chore: scaffold from aitlas-action-template"`
5. Prints next steps

### What the CLI does NOT do

- Create GitHub repos (use `gh repo create` manually)
- Configure Vercel (use `vercel` CLI separately)
- Set up environment variables (follow `.env.example`)

---

## Versioning & Template Updates

Templates use **date-stamped versions** in `package.json`:

```json
{ "template-version": "2026-03-06" }
```

When the template is updated, existing repos are **not automatically updated** (polyrepo — they're isolated). A `CHANGELOG.md` in each template repo tracks what changed and how to manually apply critical fixes.

> There is no automated template sync. This is intentional. Forced updates break isolated repos.

---

## Environment Variables (Standard Across All Templates)

Every Aitlas service uses this base set. Additional vars are appended per service.

```bash
# ─── Database (ALL services) ────────────────────────────────────
DATABASE_URL=                    # Neon pooled connection string
DATABASE_URL_UNPOOLED=           # Neon direct (migrations only)

# ─── Auth (ui + action templates) ──────────────────────────────
BETTER_AUTH_SECRET=              # 32-char random secret
BETTER_AUTH_URL=                 # This service's public URL

# ─── Encryption (BYOK key storage) ─────────────────────────────
ENCRYPTION_KEY=                  # 32-byte hex (AES-256) — NEVER commit

# ─── Rate Limiting (ui + action templates) ──────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ─── Inter-service auth ─────────────────────────────────────────
FURMA_INTERNAL_SECRET=           # Shared secret for service-to-service calls

# ─── Service identity ───────────────────────────────────────────
SERVICE_NAME=                    # e.g., "f.twyt", "nexus", "aitlas-nexus"
NODE_ENV=                        # "development" | "production"
```
