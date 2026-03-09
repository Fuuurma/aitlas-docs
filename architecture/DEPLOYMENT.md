# Aitlas — Deployment Architecture
**Version:** 1.0 | **Date:** March 2026 | **Status:** LOCKED  
**Maintained by:** Herb (AI CTO)

---

## The Answer in One Table

| Service | Host | Why | Monthly Cost |
|---------|------|-----|-------------|
| **Nexus** | Vercel | Next.js, edge CDN, zero-ops | ~$0–20 |
| **Agents Store** | Vercel | Next.js, edge CDN, zero-ops | ~$0–20 |
| **f.twyt** | Vercel | Hono serverless, <25s calls | ~$0 |
| **f.rsrx** | Vercel | Hono serverless, <25s calls | ~$0 |
| **f.library** | Vercel | Hono serverless, <25s calls | ~$0 |
| **f.guard** | Vercel | Hono serverless, <25s calls | ~$0 |
| **f.support** | Vercel | Hono serverless, <25s calls | ~$0 |
| **Nexus runtime (Nexus workers)** | Hetzner | Long-running Bun process (>60s) | ~€5–20 |
| **PostgreSQL** | Neon | Serverless, pgvector, DB branching | ~$0–19 |
| **Redis** | Upstash | Serverless, per-request pricing | ~$0 |
| **Domains** | Cloudflare | DNS + proxy + DDoS protection | ~$0 |
| **Secrets** | Vercel + Hetzner .env | Encrypted at rest | $0 |
| **TOTAL** | | | **~€30–80/mo** |

---

## 1. Why Each Platform Was Chosen

### Vercel — Nova, Agents Store, All Actions

**Why Vercel over Railway, Fly.io, or raw VPS:**
- Zero configuration for Next.js and Hono — push to GitHub, it deploys
- Edge network: Nexus loads fast globally (CDN, not a single datacenter)
- Preview deployments per branch — test Nexus changes before merging
- Vercel's function runtime matches local Bun/Node dev environment exactly
- Hobby tier is genuinely free for low traffic; Pro ($20/mo) when needed

**Why NOT Railway for Nexus/Actions:**
- Railway is excellent but adds ~$5/service/mo even for idle services
- Vercel's cold starts are acceptable for our use case (users aren't on dial-up)
- Railway shines for persistent services — that's Hetzner territory here

**The 25-second limit:**
All f.xyz actions use Hono and are designed to respond in <25s.
If a tool call is longer, it's dispatched to Nexus (Nexus runtime), not executed inline.
This is the architectural split that makes Vercel viable for actions.

### Hetzner — Nexus runtime (Nexus workers only)

**Why Hetzner over Vercel/Railway for Nexus:**
- Nexus runs an infinite `while(true)` loop — not a serverless function
- Vercel kills functions after 25s (Pro) or 60s (Enterprise) — Nexus needs hours
- Railway persistent services: valid, but €15–25/mo per worker vs Hetzner's €4.5/mo
- Hetzner CX21 (2 vCPU, 4GB RAM) = €4.51/mo. Run 4 Bun workers on it. Unbeatable.
- Full SSH access = install systemd, `journalctl`, configure exactly as needed

**What runs on Hetzner:**
- `worker.ts` — Nexus worker processes (4 per CX21 box)
- `watchdog.ts` — Dead worker recovery
- `scheduler.ts` — Cron/delayed task spawner

**What does NOT run on Hetzner:**
- Any HTTP API endpoint (use Vercel for that)
- Any database (use Neon for that)
- Any static files (use Vercel/Cloudflare for that)

### Neon — PostgreSQL

**Why Neon over Supabase:**

| | Neon | Supabase |
|--|------|----------|
| **Core** | Pure Postgres, nothing else | Postgres + Auth + Storage + Edge Functions + Realtime |
| **pgvector** | ✅ First-class | ✅ Supported |
| **Branching** | ✅ Per-PR DB branches | ❌ Not available |
| **Scale-to-zero** | ✅ (saves cost at low traffic) | ✅ |
| **Complexity** | Low — just a database | Higher — bundle of services |
| **Price (free tier)** | 0.5GB, 1 branch | 500MB, 2 projects |
| **Price (paid)** | $19/mo (Launch) | $25/mo (Pro) |

We don't need Supabase's auth (using Better Auth), storage (no files), or Edge Functions (using Vercel). Paying for that bundle makes no sense. Neon is a better, cheaper, focused database.

**Why Neon over Railway Postgres:**
- Railway Postgres: ~$5–10/mo but no branching, no pgvector built-in, no scale-to-zero
- Neon free tier is generous enough to launch on; upgrade when MRR covers it

### Upstash — Redis

**Why Upstash over Vercel KV or self-hosted Redis:**
- Serverless: no persistent connection, works perfectly with Vercel edge functions
- Per-request pricing: ~$0 until significant traffic
- Vercel KV is powered by Upstash anyway — cut out the middleman
- Self-hosted Redis on Hetzner: don't waste a box on Redis when Upstash is free

### Cloudflare — DNS + Proxy

**Why Cloudflare for DNS:**
- Free tier covers everything needed: DNS, DDoS protection, SSL, analytics
- Proxy mode hides origin IP of Hetzner server (security)
- Vercel domains work fine behind Cloudflare in DNS-only mode
- Zero cost for our traffic levels

---

## 2. Service → Deploy Mapping

### Nexus
```
Repo:     github.com/Fuuurma/aitlas-nexus
Platform: Vercel
Domain:   nexus.aitlas.xyz
Branch:   main → production
          feat/* → preview.nexus.aitlas.xyz (auto)

Build:
  Framework: Next.js
  Build cmd: bun run build
  Output:    .next/
  Install:   bun install

Environment:
  Production: Vercel Dashboard → nexus project → Environment Variables
  Preview:    Same vars, BETTER_AUTH_URL overridden per-branch
```

### Agents Store
```
Repo:     github.com/Fuuurma/aitlas-agents
Platform: Vercel
Domain:   agents.aitlas.xyz
Branch:   main → production
          feat/* → preview (auto)

Build: identical to Nexus (same template type)
```

### f.xyz Actions (each is its own Vercel project)
```
Repos:    github.com/Fuuurma/f-twyt
          github.com/Fuuurma/f-rsrx
          github.com/Fuuurma/f-library
          etc.

Platform: Vercel (serverless functions)
Domains:  f.xyz/twyt → f-twyt.vercel.app (custom domain routing)
          f.xyz/rsrx → f-rsrx.vercel.app
          OR: each action gets own subdomain: twyt.f.xyz

Build:
  Framework: Other (Hono)
  Build cmd: bun run build
  Output:    dist/
  Install:   bun install

Function timeout:
  vercel.json: { "functions": { "src/index.ts": { "maxDuration": 25 } } }
```

### Nexus runtime (Nexus) — Hetzner
```
Repo:     github.com/Fuuurma/aitlas-loop
Platform: Hetzner CX21 (€4.51/mo)
          Location: Falkenstein (EU, low latency to Neon EU)

NOT on Vercel. NOT serverless. A real server.

Processes (all managed by systemd):
  Nexus-worker@1.service   ← Worker process 1
  Nexus-worker@2.service   ← Worker process 2
  Nexus-worker@3.service   ← Worker process 3
  Nexus-worker@4.service   ← Worker process 4
  Nexus-watchdog.service   ← Dead task recovery
  Nexus-scheduler.service  ← Cron/delayed task spawner

Deploy process:
  git pull → bun install → systemctl restart Nexus-worker@*
  (No CI/CD needed at this scale — manual deploy is fine)
```

---

## 3. Database Setup (Neon)

### One Project, One Database, Multiple Branches

```
Neon Project: aitlas-prod
├── Branch: main          → Production DB (all live services connect here)
├── Branch: preview       → Staging/preview deployments
└── Branch: feat/my-pr    → Per-PR branch (auto-created by Vercel integration)
```

### Connection Strings Per Service

Every service gets the **same database** but two connection strings:

```bash
# Pooled — use in all running services (Vercel functions, Hetzner workers)
# pgBouncer handles connection pooling → prevents "too many connections"
DATABASE_URL=postgresql://aitlas:xxx@ep-xxx.eu-central-1.aws.neon.tech/aitlas?pgbouncer=true&connection_limit=1

# Direct — use ONLY for Prisma migrations (never in running code)
DATABASE_URL_UNPOOLED=postgresql://aitlas:xxx@ep-xxx.eu-central-1.aws.neon.tech/aitlas
```

**Why `connection_limit=1` in pooled URL:**
Vercel serverless functions spin up many instances simultaneously. Each instance opens a DB connection. Without `connection_limit=1`, you'll hit Postgres's max_connections limit instantly. pgBouncer pools them on Neon's side.

### Migrations

Migrations run from **one repo only** — `aitlas-nexus` (the canonical service).
This prevents two services from running conflicting migrations simultaneously.

```bash
# In aitlas-nexus repo only:
bun db:migrate   # Uses DATABASE_URL_UNPOOLED
```

Other services run `bun db:generate` (generates the Prisma client from the schema) but never `bun db:migrate`.

### pgvector Setup (one-time)

```sql
-- Run once in Neon SQL editor after project creation
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 4. Vercel Setup

### Organization Structure

```
Vercel Organization: furma-tech
├── Project: aitlas-nexus         → nexus.aitlas.xyz
├── Project: aitlas-agents        → agents.aitlas.xyz
├── Project: f-twyt               → twyt.f.xyz (or f.xyz/twyt)
├── Project: f-rsrx               → rsrx.f.xyz
├── Project: f-library            → library.f.xyz
├── Project: f-guard              → guard.f.xyz
└── Project: f-support            → support.f.xyz
```

### Shared Environment Variables

Set these in **Vercel Team Settings → Environment Variables** so they're inherited by all projects:

```bash
# All projects share these automatically
FURMA_INTERNAL_SECRET=    # Service-to-service auth
NODE_ENV=production
```

### Per-project Environment Variables

Set these in each project's Settings → Environment Variables:

```bash
# Every project
DATABASE_URL=             # Neon pooled
DATABASE_URL_UNPOOLED=    # Neon direct (Nexus only needs this)
BETTER_AUTH_SECRET=       # SAME value across all projects (shared auth)
BETTER_AUTH_URL=          # THIS project's URL (different per project)
ENCRYPTION_KEY=           # SAME value across all projects (same keys DB)
UPSTASH_REDIS_REST_URL=   # Same Upstash instance
UPSTASH_REDIS_REST_TOKEN= # Same Upstash instance
SERVICE_NAME=             # Different per project: "nexus", "f.twyt", etc.
```

### Vercel + Neon Integration

Enable the Neon integration in Vercel:
- Automatically creates preview DB branches for each PR
- Injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED` per environment
- Preview deployments get isolated DB state — no production data contamination

```
Vercel Dashboard → nexus project → Integrations → Neon → Connect
```

---

## 5. Hetzner Setup (Nexus)

### Server Sizing

| Tasks/day | Server | Workers | Cost |
|-----------|--------|---------|------|
| 0–100 | CX21 (2 vCPU, 4GB) | 4 | €4.51/mo |
| 100–500 | CX31 (4 vCPU, 8GB) | 8 | €9.01/mo |
| 500–2,000 | 2× CX31 | 16 | €18/mo |
| 2,000+ | 4× CCX23 (4 vCPU dedicated) | 32 | €80/mo |

**Start with CX21. Upgrade when queue depth consistently > 20.**

### Server Location

Choose **Falkenstein (FSN1)** or **Nuremberg (NBG1)** — EU datacenter, low latency to Neon's EU region (`eu-central-1.aws`). Never use US datacenter for Nexus — adds 100ms+ to every DB query in the loop.

### One-Time Server Setup

```bash
# Run as root after first login via SSH

# 1. Create non-root user
adduser Nexus
usermod -aG sudo Nexus

# 2. Install Bun
curl -fsSL https://bun.sh/install | bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 3. Clone repo
git clone git@github.com:Fuuurma/aitlas-loop.git /opt/aitlas-loop
cd /opt/aitlas-loop
bun install

# 4. Copy environment
cp .env.example .env
nano .env   # Fill in DATABASE_URL, ENCRYPTION_KEY, etc.
chmod 600 .env   # Only root can read it

# 5. Install systemd services
cp scripts/Nexus-worker@.service /etc/systemd/system/
cp scripts/Nexus-watchdog.service /etc/systemd/system/
cp scripts/Nexus-scheduler.service /etc/systemd/system/
systemctl daemon-reload

# 6. Enable + start
systemctl enable Nexus-worker@{1,2,3,4}
systemctl enable Nexus-watchdog
systemctl enable Nexus-scheduler
systemctl start Nexus-worker@{1,2,3,4}
systemctl start Nexus-watchdog
systemctl start Nexus-scheduler

# 7. Verify
systemctl status Nexus-worker@1
journalctl -u Nexus-worker@1 -f
```

### systemd Service Files

```ini
# scripts/Nexus-worker@.service
# The @ makes it a template — Nexus-worker@1, Nexus-worker@2, etc.
[Unit]
Description=Aitlas Nexus Worker %i
After=network.target

[Service]
Type=simple
User=Nexus
WorkingDirectory=/opt/aitlas-loop
EnvironmentFile=/opt/aitlas-loop/.env
Environment=WORKER_ID=%i
ExecStart=/root/.bun/bin/bun run src/worker.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```ini
# scripts/Nexus-watchdog.service
[Unit]
Description=Aitlas Nexus Watchdog
After=network.target

[Service]
Type=simple
User=Nexus
WorkingDirectory=/opt/aitlas-loop
EnvironmentFile=/opt/aitlas-loop/.env
ExecStart=/root/.bun/bin/bun run src/watchdog.ts
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Deploying Updates to Hetzner

```bash
# SSH into server
ssh Nexus@your-hetzner-ip

# Pull + restart (zero-downtime: workers finish current task before stopping)
cd /opt/aitlas-loop
git pull origin main
bun install
systemctl restart Nexus-worker@{1,2,3,4}
systemctl restart Nexus-watchdog
```

### Hetzner Firewall Rules

```
Inbound:  22 (SSH, your IP only) — ONLY this. No web ports.
Outbound: ALL (workers need to reach Neon, Vercel, external APIs)
```

Nexus workers have **no inbound HTTP**. They only make outbound calls (to Neon, to f.xyz MCP endpoints, to LLM providers). This is both secure and correct — Nexus pushes tasks into Postgres; Nexus pulls them.

---

## 6. DNS & Domain Setup (Cloudflare)

### Zone: aitlas.xyz

```
Type    Name              Value                    Proxy
────────────────────────────────────────────────────────
CNAME   nexus             cname.vercel-dns.com     DNS only*
CNAME   agents            cname.vercel-dns.com     DNS only*
A       @                 76.76.21.21 (Vercel)     DNS only*
```

### Zone: f.xyz (Actions)

```
Type    Name              Value                    Proxy
────────────────────────────────────────────────────────
CNAME   twyt              cname.vercel-dns.com     DNS only
CNAME   rsrx              cname.vercel-dns.com     DNS only
CNAME   library           cname.vercel-dns.com     DNS only
CNAME   guard             cname.vercel-dns.com     DNS only
CNAME   support           cname.vercel-dns.com     DNS only
```

*Use DNS-only (grey cloud) for Vercel domains — Vercel manages SSL. Proxied (orange cloud) breaks Vercel's SSL certificate provisioning.

### Hetzner (Nexus) — No Public Domain Needed

Nexus has no HTTP server and no public domain. It connects outbound only.
Its only "address" is the Postgres connection string — it pulls work from the DB.

---

## 7. Environment Variables — Master Reference

### How Secrets Are Managed

| Secret | Where stored | Who accesses |
|--------|-------------|--------------|
| `DATABASE_URL` | Vercel project env + Hetzner `.env` | All services |
| `ENCRYPTION_KEY` | Vercel project env + Hetzner `.env` | All services |
| `BETTER_AUTH_SECRET` | Vercel project env | Nova, Agents Store, Actions |
| `FURMA_INTERNAL_SECRET` | Vercel team env | All Vercel services |
| `UPSTASH_*` | Vercel team env | All Vercel services |
| Hetzner `.env` | `/opt/aitlas-loop/.env` (chmod 600) | Nexus workers only |

**Source of truth for secret values:** 1Password vault `Aitlas/Production`.  
Never store secrets in git. Never store secrets in Notion/Slack/email.

### Critical: ENCRYPTION_KEY must be identical everywhere

The `ENCRYPTION_KEY` is used to encrypt/decrypt BYOK API keys stored in Postgres.
If it differs between Nexus (which encrypts) and Nexus (which decrypts), all decryption fails.

```bash
# Generate once, use everywhere
openssl rand -hex 32
# → Copy this value to ALL services' ENCRYPTION_KEY
# → Store in 1Password immediately
```

### BETTER_AUTH_SECRET must be identical across all Vercel projects

Sessions are validated cross-service. The secret must match.

```bash
# Generate once
openssl rand -base64 32
# → Same value in: aitlas-nexus, aitlas-agents, f-twyt, f-rsrx, ...
```

### BETTER_AUTH_URL is different per project

```bash
# aitlas-nexus:    BETTER_AUTH_URL=https://nexus.aitlas.xyz
# aitlas-agents:   BETTER_AUTH_URL=https://agents.aitlas.xyz
# f-twyt:          BETTER_AUTH_URL=https://twyt.f.xyz
# For preview:     BETTER_AUTH_URL=https://aitlas-nexus-git-feat-xxx.vercel.app
```

---

## 8. CI/CD Pipeline

### Vercel (automatic — no configuration needed)

```
Push to feat/*  → Vercel builds preview deployment automatically
Push to main    → Vercel builds + deploys to production automatically
PR opened       → Vercel comments with preview URL + Neon creates DB branch
PR merged       → Vercel deploys main to production + Neon branch deleted
```

### Hetzner (manual deploy — intentional)

Nexus deploys are manual via SSH. This is intentional:
- Workers are stateful (they're in the middle of tasks)
- Auto-deploy on push could interrupt running tasks
- Manual deploy means you choose when to restart workers

When automatic deploys become needed (multiple engineers, multiple boxes), add a simple deploy script triggered by GitHub Actions:

```yaml
# .github/workflows/deploy-Nexus.yml
# Only when manual — triggered via GitHub Actions UI
on:
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Hetzner
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HETZNER_IP }}
          username: Nexus
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd /opt/aitlas-loop
            git pull origin main
            bun install
            sudo systemctl restart Nexus-worker@{1,2,3,4}
```

---

## 9. Monitoring & Alerts

### What to watch

| Signal | Tool | Alert threshold |
|--------|------|-----------------|
| Vercel function errors | Vercel Analytics | >1% error rate |
| Nexus worker down | systemd + Healthchecks.io | Worker not seen in 5min |
| DB connection pool | Neon dashboard | >80% pool usage |
| Task queue depth | Postgres query | >50 PENDING tasks |
| Credit anomaly | Pino log + query | Single task >200 credits |

### Healthchecks.io (Free tier)

Heartbeat check for Nexus — each worker pings a URL every minute:

```typescript
// In worker.ts — ping after each successful task
await fetch(`https://hc-ping.com/${env.HEALTHCHECK_UUID}`);
```

If no ping for 5 minutes → email alert → worker is dead.
Cost: $0. No other monitoring tool needed at launch.

### Vercel Analytics

Enable in Vercel Dashboard → each project → Analytics.
Free tier shows: error rates, function duration, cold starts.
No configuration needed.

---

## 10. Launch Sequence

Do this in order. Do not skip steps.

```
1. Create Neon project (aitlas-prod)
   └─ Note: DATABASE_URL, DATABASE_URL_UNPOOLED
   └─ Run: CREATE EXTENSION IF NOT EXISTS vector;
   └─ Enable Vercel integration

2. Create Upstash Redis database (aitlas-rate-limit)
   └─ Note: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

3. Generate shared secrets (store in 1Password immediately)
   └─ ENCRYPTION_KEY:      openssl rand -hex 32
   └─ BETTER_AUTH_SECRET:  openssl rand -base64 32
   └─ FURMA_INTERNAL_SECRET: openssl rand -hex 24

4. Create Vercel organization (furma-tech)
   └─ Set team-level env vars: FURMA_INTERNAL_SECRET, UPSTASH_*

5. Deploy aitlas-nexus to Vercel
   └─ Connect GitHub repo
   └─ Set all env vars
   └─ Set custom domain: nexus.aitlas.xyz
   └─ Run migrations: bun db:migrate (locally, with DATABASE_URL_UNPOOLED)
   └─ Verify: https://nexus.aitlas.xyz/api/health → { "status": "ok" }

6. Deploy aitlas-agents to Vercel
   └─ Same process as Nexus (no migrations — Nexus owns migrations)
   └─ Set custom domain: agents.aitlas.xyz

7. Deploy f.xyz actions to Vercel (one project per action)
   └─ Start with f-twyt (simplest)
   └─ Set custom domain: twyt.f.xyz
   └─ Verify: https://twyt.f.xyz/api/health → { "status": "ok" }

8. Provision Hetzner server (CX21, Falkenstein)
   └─ Run setup script
   └─ Configure .env
   └─ Start workers + watchdog
   └─ Verify: systemctl status Nexus-worker@1 → active (running)
   └─ Verify: tail -f task in Nexus runs end-to-end

9. Configure Cloudflare DNS
   └─ Add CNAME records for nexus.aitlas.xyz, agents.aitlas.xyz
   └─ Add CNAME records for twyt.f.xyz, rsrx.f.xyz, etc.

10. Smoke test the full flow
    └─ Sign up in Nexus
    └─ Add BYOK key
    └─ Enable Agentic Mode
    └─ Send a message that triggers f.twyt
    └─ Verify credits deducted
    └─ Dispatch a background task
    └─ Verify Nexus picks it up and runs it
    └─ Verify Task Monitor shows live progress
```

---

## Appendix: Cost Breakdown at Scale

### Launch (Month 1–3, <100 users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby (free) | $0 |
| Neon | Free tier | $0 |
| Upstash | Free tier | $0 |
| Hetzner CX21 | 1 server | €4.51/mo |
| Cloudflare | Free | $0 |
| **TOTAL** | | **~€5/mo** |

### Growth (Month 4–8, 500–2,000 users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro ($20/mo) | $20 |
| Neon | Launch ($19/mo) | $19 |
| Upstash | Pay-as-you-go | ~$5 |
| Hetzner CX31 | 1 server | €9/mo |
| Cloudflare | Free | $0 |
| **TOTAL** | | **~$55/mo** |

### Scale (Month 9–12, 5,000–10,000 users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro + usage | ~$50 |
| Neon | Scale ($69/mo) | $69 |
| Upstash | ~$20 | $20 |
| Hetzner 2× CX31 | 2 servers | €18/mo |
| Cloudflare | Free | $0 |
| **TOTAL** | | **~$160/mo** |

All of this is covered by ~8 Pro subscribers ($25/mo each) at the growth tier.  
The unit economics are extremely healthy.

---

*Last updated: March 2026 | Maintained by Herb (AI CTO)*
