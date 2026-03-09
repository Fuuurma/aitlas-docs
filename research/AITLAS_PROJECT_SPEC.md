# AITLAS_PROJECT_SPEC.md

**Version:** 1.0.0  
**Created:** 2026-03-07  
**Status:** ✅ Production Standard

> Standard specification for all Aitlas projects. Ensures consistency, maintainability, and interoperability across the Aitlas ecosystem.

---

## 1. Project Types

Aitlas projects fall into three categories:

### 1.1 UI Projects

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
│   ├── (auth)/            # Public auth routes
│   ├── (dashboard)/       # Protected routes
│   ├── api/               # API routes
│   └── layout.tsx
├── components/
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth.ts           # Better Auth config
│   ├── db.ts             # Prisma client
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
│   ├── routes/            # API routes
│   ├── lib/
│   │   ├── mcp/           # MCP server
│   │   ├── tools/         # Tool implementations
│   │   └── ...
│   └── tools/             # Auto-registered tools
├── prisma/
├── __tests__/
├── scripts/
│   └── create-tool.ts     # Tool generator
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
│   ├── worker.ts          # Worker implementation
│   ├── queue.ts           # Queue management
│   ├── jobs/              # Job definitions
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

### 2.1 Database

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

**Provider:** Better Auth  
**Secret:** Shared across all services (`BETTER_AUTH_SECRET`)

**Requirements:**
- Email/password auth
- Session management
- Protected routes
- OAuth support (Google, GitHub)

### 2.3 Encryption (BYOK)

**Algorithm:** AES-256-GCM  
**Key:** Shared across all services (`ENCRYPTION_KEY`)

**Usage:**
- Encrypt user API keys before storage
- Decrypt in-memory only when used
- Never log or expose decrypted keys

### 2.4 Credit System

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

**Provider:** Upstash Redis  
**Types:**
- `api` - 100 requests/60s
- `auth` - 5 requests/60s
- `search` - 30 requests/60s
- `ingest` - 10 requests/60s
- `mcp` - 50 requests/60s

**Fallback:** In-memory for development

### 2.6 Logging

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

### 3.1 Required (All Projects)

```bash
# Database
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."

# Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="..."

# Inter-service Auth
FURMA_INTERNAL_SECRET="..."

# Service Identity
SERVICE_NAME="my-service"
NODE_ENV="production"
```

### 3.2 Optional

```bash
# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Monitoring
HEALTHCHECK_UUID="..."
```

---

## 4. Testing Standards

### 4.1 Framework

**Provider:** Vitest  
**Coverage Target:** 70%+

### 4.2 Test Categories

1. **Unit Tests** - Individual functions/components
2. **Integration Tests** - API routes, database
3. **E2E Tests** - Full user flows (optional)

### 4.3 Test Structure

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

### 5.1 Required Files

Every project MUST have:
- `README.md` - Project overview, quick start
- `AGENTS.md` - AI coding rules
- `.env.example` - Environment variables
- `docs/` - Detailed documentation

### 5.2 README Structure

```markdown
# Project Name

**Type:** UI/Action/Worker | **Stack:** ... | **Status:** ...

> One-line description

## Features

## Quick Start

## Configuration

## Usage

## Development

## Deployment

## License
```

### 5.3 Documentation Folder

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

### 6.1 Platforms

**UI Projects:** Vercel (preferred), Netlify, Docker  
**Action Projects:** Docker, Hetzner, Railway  
**Worker Projects:** Hetzner (persistent), Docker

### 6.2 Environment Variables

All required env vars must be set in deployment platform.

### 6.3 Health Checks

All projects must expose `/health` endpoint for monitoring.

### 6.4 Monitoring

**Recommended:**
- Healthchecks.io for uptime monitoring
- Prometheus + Grafana for metrics
- Pino logs for debugging

---

## 7. Security Standards

### 7.1 Authentication

- All user-facing routes must require auth
- API routes must validate tokens
- Sessions must expire

### 7.2 Authorization

- Users can only access their own data
- Implement row-level security in Prisma queries
- Validate user ownership

### 7.3 Data Protection

- Encrypt sensitive data (BYOK keys)
- Never log sensitive information
- Use HTTPS in production

### 7.4 Rate Limiting

- All public endpoints must be rate-limited
- Auth endpoints: 5 requests/minute
- API endpoints: 100 requests/minute

---

## 8. Quality Standards

### 8.1 Code Quality

- TypeScript strict mode
- ESLint passing
- Prettier formatted
- No `any` types (use `unknown` or proper types)

### 8.2 Performance

- Database queries optimized (use indexes)
- API responses < 500ms
- Bundle size < 500KB (UI projects)

### 8.3 Reliability

- Error handling on all async operations
- Graceful degradation (mock data fallback)
- Retry logic for transient failures

---

## 9. Project Lifecycle

### 9.1 Creation

```bash
aitlas new <type> <project-name>
cd <project-name>
bun install
cp .env.example .env
# Edit .env
bun db:generate
bun db:migrate
bun dev
```

### 9.2 Development

```bash
# Run dev server
bun dev

# Run tests
bun test

# Type check
bun run typecheck

# Commit
git add -A
git commit -m "feat: description"
git push
```

### 9.3 Deployment

```bash
# Build
bun run build

# Deploy (Vercel example)
vercel --prod
```

### 9.4 Maintenance

- Monitor health endpoints
- Review error logs weekly
- Update dependencies monthly
- Run security audits quarterly

---

## 10. Examples

### 10.1 UI Project: Nova

- **Type:** UI
- **Purpose:** AI Command Center
- **Features:** Dashboard, agent management, task tracking
- **Deployed:** Vercel

### 10.2 Action Project: f-twyt

- **Type:** Action
- **Purpose:** Twitter/X API integration
- **Features:** MCP tools, web dashboard, search, timeline
- **Deployed:** Vercel

### 10.3 Worker Project: (TBD)

- **Type:** Worker
- **Purpose:** Background job processing
- **Features:** Job queue, retry logic, metrics
- **Deployed:** Hetzner

---

## Appendix A: Checklist

### Pre-Launch Checklist

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

- [ ] Monitoring set up
- [ ] Error alerts configured
- [ ] Backup strategy implemented
- [ ] Documentation published
- [ ] Team trained

---

## Appendix B: Resources

- **Templates:** https://github.com/Fuuurma/aitlas-*-template
- **CLI:** https://github.com/Fuuurma/aitlas-cli
- **Docs:** https://docs.openclaw.ai
- **Community:** https://discord.gg/clawd

---

*This spec is living documentation. Update as the ecosystem evolves.*

**Maintained by:** Furma.tech  
**Last Updated:** 2026-03-07