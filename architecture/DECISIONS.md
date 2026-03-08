# Aitlas Architecture Decisions

**Last Updated:** 2026-03-06 23:52 CET
**Status:** LOCKED

This document captures all architectural decisions made for the Aitlas platform.

---

## 1. Actions Architecture v2.0 (2026-03-06)

**Decision:** Actions are split into two types:

| Type | Template | Has UI | Examples |
|------|----------|--------|----------|
| **Mini-App** | `aitlas-ui-template` (Next.js) | ✅ Full product | f.twyt, f.rsrx, f.library |
| **Utility** | `aitlas-action-template` (Hono) | ❌ Headless MCP only | f.guard, f.support, f.decloy |

**Rationale:**
- f.rsrx returns 5-page research reports → needs UI
- f.guard returns JSON issues → sidebar card is enough
- Mini-apps are standalone products (users visit rsrx.f.xyz directly)

**Reference:** `docs/architecture/ACTIONS_ARCHITECTURE.md`

---

## 2. Database: Neon (2026-03-06)

**Decision:** Single shared PostgreSQL database via Neon

**Details:**
- **Provider:** Neon (serverless Postgres)
- **Region:** eu-west-2 (London)
- **Database:** `neondb`
- **Branch:** `production`

**Connection Strings:**
```bash
# Direct (for migrations)
DATABASE_URL="postgresql://neondb_owner:npg_***@ep-patient-haze-ab7s4gtd.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Pooled (for running services)
DATABASE_URL_POOLED="postgresql://neondb_owner:npg_***@ep-patient-haze-ab7s4gtd-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
```

**Why Neon:**
- Pure Postgres (not a bundle like Supabase)
- pgvector built-in
- DB branching for PRs
- Scale-to-zero (saves cost)
- $19/mo vs Supabase $25/mo

---

## 3. Shared Secrets (2026-03-06)

**Decision:** All secrets are IDENTICAL across all Aitlas services

**Required Secrets:**
```bash
# Encryption (BYOK API keys) - NEVER CHANGE AFTER KEYS STORED
ENCRYPTION_KEY="b46cf97cd7e62b17165a6a9f71f1535d88f4e811191018cf7082f984657156b7"

# Auth (cross-service sessions)
BETTER_AUTH_SECRET="DoZUZ2kPtjucwt5ivpfSfhH0XaIeq+axw8yxiDX0Fr8="

# Inter-service auth
FURMA_INTERNAL_SECRET="1f6961fa81b7ba3220e0136ce9b3e84858256d0c0ac8d7ed"
```

**⚠️ SAVE TO 1PASSWORD!**

**Why identical:**
- Nexus encrypts user API keys
- Ralph workers decrypt them (need same ENCRYPTION_KEY)
- Better Auth sessions valid across all *.aitlas.xyz domains

---

## 4. No Shared Packages (2026-03-06)

**Decision:** NO `@aitlas/*` npm packages in v1

**Rationale:**
- Premature abstraction
- Each template imports `@prisma/client` directly
- Shared DB provides shared data
- Wait until 10+ repos before extracting packages

**Current pattern:**
```typescript
// In any template
import { prisma } from '@/lib/db'
```

**Reference:** DEPLOYMENT.md - "NO `@aitlas/*` npm packages in v1"

---

## 5. Template Strategy (2026-03-06)

**Decision:** Three template types, separate repos

| Template | Purpose | Deploy Target |
|----------|---------|---------------|
| `aitlas-ui-template` | Next.js 15 + shadcn + Better Auth | Vercel |
| `aitlas-action-template` | Hono + MCP (headless) | Vercel |
| `aitlas-worker-template` | Bun + Postgres queue | Hetzner |

**CLI usage:**
```bash
bunx aitlas-cli new ui my-project
bunx aitlas-cli new action my-action
bunx aitlas-cli new worker my-worker
```

---

## 6. Deployment Targets (2026-03-06)

**Decision:**

| Service | Platform | Why |
|---------|----------|-----|
| Nexus | Vercel | Next.js, edge CDN |
| Agents Store | Vercel | Next.js, edge CDN |
| Mini-App Actions (f.twyt, f.rsrx, f.library) | Vercel | Next.js, <25s timeout |
| Utility Actions (f.guard, f.support) | Vercel | Hono serverless |
| f.loop (Ralph workers) | **Hetzner** | Long-running (>60s) |
| PostgreSQL | **Neon** | Serverless, pgvector |
| Redis | **Upstash** | Serverless (not yet created) |

**Hetzner details:**
- CX21 server, Falkenstein
- 4 workers via systemd
- Only SSH inbound (port 22)
- No inbound HTTP

**Reference:** `docs/architecture/DEPLOYMENT.md`

---

## 7. Better Auth (2026-03-06)

**Decision:** Better Auth for all authentication

**Details:**
- Sessions in shared Neon DB
- Valid across all *.aitlas.xyz domains
- Cross-subdomain cookies enabled
- OAuth providers: Google, GitHub

**Config:**
```typescript
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  database: { provider: 'postgresql', url: env.DATABASE_URL },
  advanced: {
    crossSubdomainCookies: {
      enabled: true,
      domain: '.aitlas.xyz',
    }
  },
});
```

---

## 8. Agent Personas (2026-03-06)

**Decision:** Aitlas sells "Agent Personas" not just tools

**Initial Personas:**

| Persona | Vertical | Core Actions |
|---------|----------|--------------|
| **Rainmaker** | Marketing/Sales | f.twyt, f.rsrx, f.reach |
| **Tax Ghost** | Finance | f.vault, f.pay, f.legal |
| **Bio-Hacker** | Health | f.health, f.sense |
| **Concierge** | Travel | f.rsrx, f.brain |

**Launch priority:** Rainmaker (easiest ROI, low trust barrier)

**Reference:** Memory 2026-03-06 - "Strategic Research"

---

## 9. f.bridge Concept (2026-03-06)

**Decision:** Universal MCP connector for external integrations

**How it works:**
```typescript
// User: "Connect to my bank"
// Agent calls:
f.bridge("mcp://plaid.com/api")

// → Instantly has Plaid MCP tools
// → No coding required
// → Monetization: Orchestration through f.loop burns credits
```

**External MCP registries:**
- Smithery
- Pulse
- MCP.get

**Reference:** Memory 2026-03-06 - "f.bridge"

---

## 10. Monetization Model (2026-03-06)

**Decision:** Dual revenue stream

```
1. Agent Tax (Store)
   - One-time or recurring fee to hire agent
   
2. Infrastructure Tax (Credits)
   - Every action call burns credits
   - f.twyt: 1 credit/query
   - f.rsrx: 2-12 credits/report
   - f.decloy: 25 credits/deploy + 1/min
```

**Example:**
```
User opens Nexus (Free)
→ Hires "Rainmaker" (€9.99/mo)
→ Rainmaker uses f.twyt, f.rsrx (burns credits)
→ User buys credit pack (€10 = 100 credits)
```

---

## Pending Decisions

- [ ] Create Upstash Redis
- [ ] Create Vercel organization
- [ ] Deploy first service
- [ ] Save secrets to 1Password
- [ ] Build f.bridge prototype

---

**This document is the source of truth for all architectural decisions.**
**Update this whenever a new decision is made.**