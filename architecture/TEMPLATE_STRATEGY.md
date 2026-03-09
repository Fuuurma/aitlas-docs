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
aitlas new worker aitlas-loop
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
SERVICE_NAME=                    # e.g., "f.twyt", "nexus", "aitlas-loop"
NODE_ENV=                        # "development" | "production"
```