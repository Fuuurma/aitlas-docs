# Aitlas Core Template - Documentation Index

**Last Updated:** March 8, 2026  
**Status:** ✅ CANONICAL  
**Version:** 4.0

---

## 📚 Start Here

| Document | Location | Description |
|----------|----------|-------------|
| **MASTER_ARCHITECTURE.md** | `/MASTER_ARCHITECTURE.md` | **SINGLE SOURCE OF TRUTH** — supersedes all |
| **AGENTS.md** | `/AGENTS.md` | AI coding guidelines (REQUIRED) |

---

## 📦 Products

| Product | Domain | Docs | Status |
|---------|--------|------|--------|
| **Nexus** | nexus.aitlas.xyz | [README](./products/nexus/README.md) | 🟡 Development |
| **Agents Store** | agents.aitlas.xyz | [README](./products/agents-store/README.md) | 🟡 Development |
| **Actions (f.xyz)** | f.xyz | [README](./products/actions/README.md) | 🟡 Mixed |

### Research & Integration

| Doc | Location | Description |
|-----|----------|-------------|
| **Pi Integration** | [Research](./products/research/PI_INTEGRATION.md) | Agent framework reference |
| **Codex Reference** | [Research](./products/research/CODEX_REFERENCE.md) | Competitor reference |
| **Symphony** | [Nexus](./products/nexus/SYMPHONY_INTEGRATION.md) | Tasks UI integration |

---

### Actions Registry

| Action | Docs | Credits | Status |
|--------|------|---------|--------|
| **f.twyt** | [Docs](./products/actions/f-twyt.md) | 1/query | ✅ Production |
| **f.library** | [Docs](./products/actions/f-library.md) | 2/ingest, 1/search | ✅ Production |
| **f.research** | [Docs](./products/actions/f-research.md) | 3-10/query | 🟡 Development (Perplexica) |
| **f.finance** | [Docs](./products/actions/f-finance.md) | 1-5/analyze | 🔵 Research |
| **f.guard** | [Docs](./products/actions/f-guard.md) | 2-5/scan | 🟡 Development (Warden) |
| **f.support** | [Docs](./products/actions/f-support.md) | 1-3/ticket | 🟡 Roadmap |
| **f.decloy** | [Docs](./products/actions/f-decloy.md) | 25/deploy | 🟡 Roadmap |
| **f.bridge** | - | - | 🟡 Roadmap |
| **f.loop** | [Docs](./products/actions/f-loop.md) | 1 + 2/hr | ✅ Production |

---

## 📖 Quick Navigation

| Category | Documents | Purpose |
|----------|-----------|---------|
| **[Architecture](#-architecture)** | Full spec, Agent spec, SDK spec | System design |
| **[Business](#-business)** | Business Plan, Master Blueprint | Strategy, financials |
| **[Technical](#-technical)** | Architecture, Security | Implementation |
| **[Setup](#-setup)** | USAGE.md, SETUP_COMPLETE.md | Getting started |

---

## 🏗️ Architecture

| Document | Location | Description |
|----------|----------|-------------|
| **AITLAS_ARCHITECTURE.md** | `/docs/AITLAS_ARCHITECTURE.md` | **Definitive architecture spec** - Vision, Product Map, Nexus, Agents, Actions, Ralph Engine, MCP, Auth, Credits, Security, API Design |
| **ARCHITECTURE_SPEC.md** | `/docs/architecture/ARCHITECTURE_SPEC.md` | Technical architecture details |
| **AGENT_SPEC.md** | `/docs/architecture/AGENT_SPEC.md` | Agent package specification (npm for AI Agents) |
| **SDK_SPEC.md** | `/docs/architecture/SDK_SPEC.md` | Developer SDK design |

### Key Architecture Concepts

**The Mental Model:**
```
The Internet         →   Browser
The OS               →   Nexus
The App Store        →   Agents
The System Utilities →   Actions (f.xyz)
The Background Daemons → f.loop (Ralph)
The File System      →   f.library
The Network Layer    →   MCP
```

**Dual-Mode Chat (Nexus):**
- **Mode A: Standard Chat (Free)** - BYOK, no tools, $0 to Furma
- **Mode B: Agentic Mode (Credits)** - Tool access, MCP calls, revenue

**The Ralph Loop:**
```
OBSERVE → REASON → ACT → REPEAT
```

---

## 🏢 Business

| Document | Location | Description |
|----------|----------|-------------|
| **FURMA_MASTER.md** | `/FURMA_MASTER.md` | Complete business + technical blueprint |
| **BUSINESS_PLAN.md** | `/docs/business/BUSINESS_PLAN.md` | Financials, revenue model, projections |
| **MARKETING_STRATEGY.md** | `/docs/marketing/MARKETING_STRATEGY.md` | Brand positioning, launch strategy |

### Dual-Vertical Strategy

1. **B2B SaaS (Cash Engine)** - restauManager, tours/Guides
2. **Aitlas Ecosystem (Growth)** - Nexus, Agents, f.xyz

### Monetization

- Zero-burn BYOK model (users bring their own API keys)
- Credit system for compute-heavy actions
- f.decloy subscriptions (MicroVM rental)

---

## 🔧 Technical

| Document | Location | Description |
|----------|----------|-------------|
| **TECHNICAL_ARCHITECTURE.md** | `/docs/architecture/TECHNICAL_ARCHITECTURE.md` | System architecture, patterns, security |
| **AITLAS_ALIGNMENT_PLAN.md** | `/docs/AITLAS_ALIGNMENT_PLAN.md` | f.library & f.rsrx adaptation |
| **GITHUB_CONFIG.md** | `/docs/GITHUB_CONFIG.md` | GitHub PAT & repo management |

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Runtime | Bun |
| Database | PostgreSQL + pgvector (Neon) |
| ORM | Prisma 6 |
| Auth | Better Auth |
| UI | React 19 + Tailwind v4 + shadcn/ui |
| Validation | Zod |
| MCP | Model Context Protocol |

---

## 🚀 Setup

| Document | Location | Description |
|----------|----------|-------------|
| **USAGE.md** | `/docs/USAGE.md` | Template usage guide |
| **README.md** | `/README.md` | Project overview |
| **SETUP_COMPLETE.md** | `/SETUP_COMPLETE.md` | Production checklist |

### Quick Start

```bash
# Clone and customize
git clone https://github.com/Fuuurma/aitlas-core-template.git my-product
cd my-product && rm -rf .git && git init
bun install && bun run setup

# Set up database
bun run db:generate && bun run db:migrate

# Start developing
bun run dev
```

---

## 💰 Credit System

**The Paywall:** Free chat (BYOK) + Paid actions (compute credits)

| Action | Credits | USD Value |
|--------|---------|-----------|
| f.twyt search | 1 | ~$0.01 |
| f.library ingest | 2 | ~$0.02 |
| f.rsrx research | 5 | ~$0.05 |
| f.guard review | 2 | ~$0.02 |
| f.loop compute | 10/hr | ~$0.10/hr |

---

## 🏗️ Aitlas Ecosystem

### Repo Registry

| Repo | Domain | Status |
|------|--------|--------|
| `aitlas-core-template` | — | ✅ Maintained |
| `aitlas-nexus` | nexus.aitlas.xyz | 🟡 Development |
| `aitlas-agents` | agents.aitlas.xyz | 🟡 Development |
| `aitlas-loop` | loop.internal | 🟡 Development |
| `f-twyt` | f.xyz/twyt | ✅ Production |
| `f-library` | f.xyz/library | ✅ Production |
| `f-rsrx` | f.xyz/rsrx | 🟡 Development |
| `f-guard` | f.xyz/guard | 🟡 Roadmap |
| `f-support` | f.xyz/support | 🟡 Roadmap |
| `f-decloy` | f.xyz/decloy | 🟡 Roadmap |

---

## 🔐 Security Standards

### BYOK Encryption
- **Algorithm:** AES-256-GCM
- **Key Storage:** Environment variable (ENCRYPTION_KEY)
- **IV:** Unique per encryption (randomBytes)
- **Auth Tag:** Included for integrity verification

### Critical Rules
- NEVER log, console.log, or include in error messages anything that could be an API key
- NEVER store a decrypted API key in a variable outside the scope that uses it
- Keys are decrypted **in the Ralph worker**, never in the Next.js API route

---

## 📝 How to Use This Documentation

### For New Products
1. Clone `aitlas-core-template`
2. Run `bun run setup` (interactive customization)
3. Read `AGENTS.md` (AI coding guidelines)
4. Read `AITLAS_ARCHITECTURE.md` (full system design)
5. Extend Prisma schema with product-specific models

### For Contributors
1. Read `AITLAS_ARCHITECTURE.md` (architecture)
2. Read `AGENTS.md` (coding standards)
3. Use `lib/` utilities (don't reinvent)

### For AI Assistants
1. `AGENTS.md` is THE source of truth
2. `AITLAS_ARCHITECTURE.md` is THE architecture spec
3. Always output schema first
4. Use Furma DNA utilities
5. `userId` in EVERY query

---

**Maintained by:** Furma.tech Engineering  
**Last Review:** March 6, 2026  
**Next Review:** April 6, 2026