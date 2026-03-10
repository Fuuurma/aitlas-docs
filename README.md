# Aitlas Documentation

**Source of truth for all Aitlas products.**

> **Version:** 1.1 | **Updated:** March 2026 | **Status:** ✅ Cleaned up

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

## 🎯 What is Aitlas?

**Aitlas = Nova + Nexus + Agents Store + Actions**

| Component | Description |
|-----------|-------------|
| **Nova** | The Web UI - chat, dashboard, tasks |
| **Nexus** | Orchestration runtime - executes agents |
| **Agents Store** | Marketplace of pre-configured agents |
| **Actions** | Pre-built MCP tools (f.xyz) |

**Key insight:** Nexus is the backbone - everything else is UI or tools on top of it.

---

## 🚀 Strategic Vision

### The $1B Scenario: "Stripe for Autonomous Software"

```
developers → build agents → agents use tools → tools use credits
```

**Economic Model:**
- Tokens → User pays (BYOK)
- Compute → Aitlas charges
- Tools → Aitlas charges
- **Revenue = orchestration + tools + deployment**
- **Cost = almost zero**

### Positioning

| NOT | BUT |
|-----|-----|
| AI agent app | **Agent operating system** |
| Marketplace | **Kubernetes for agents** |

### Three-Layer Economy

| Layer | What | Monetization |
|-------|------|--------------|
| **Agent Economy** | Agents = apps | Revenue share |
| **Action Economy** | Actions = APIs | Per-call credits |
| **Runtime Economy** | Hooks = infrastructure | Per-loop credits |

---

## 📚 Documentation Index

### Core Architecture

| File | Description |
|------|-------------|
| [`MASTER_ARCHITECTURE.md`](./architecture/MASTER_ARCHITECTURE.md) | **CANONICAL** - Single source of truth |

### Architecture Subfolders

| Folder | Description |
|--------|-------------|
| [`reference/`](architecture/reference/) | SDK, style guides |
| [`integrations/`](architecture/integrations/) | MCP, protocols |
| [`operations/`](architecture/operations/) | Deployment, decisions |
| [`agents/`](architecture/agents/) | Agent specs, prompts |
| [`deprecated/`](architecture/deprecated/) | Outdated - see canonical |

### Key Sections in MASTER_ARCHITECTURE.md

| Section | Title | Key Insight |
|---------|-------|-------------|
| 1-24 | Core Architecture | Vision, Nexus, Agents, Actions, Nexus runtime, Tool Gateway |
| **25** | What Aitlas Builds | LLM gaps we fill (Memory, Orchestration, Tools) |
| **26** | Dependency Graph | How components connect |
| **27** | Tool Access Matrix | Agent × Tool permissions |
| **28** | How They Work Together | Example flow (landing page) |
| **29** | Open Source Leverage | Component sourcing |
| **30** | Extensible Loop | Hook system for developer platform |
| **31** | Agent Distribution | `.aitlas-agent` format, viral mechanism |
| **32** | Docker for Agents | AgentSpec → AgentImage → AgentInstance |
| **33** | Cold Start Strategy | 3-step bootstrap |
| **34** | Rollout Plan | Day 1 → Week 12, 5 phases |

### Products

| Doc | Description |
|-----|-------------|
| [products/nexus/nexus.md](./products/nexus/nexus.md) | **Nexus runtime spec (41KB)** - Based on trigger.dev |
| [products/actions/CATALOG.md](./products/actions/CATALOG.md) | Actions catalog (68 actions) |
| [products/agents-store/ROADMAP.md](./products/agents-store/ROADMAP.md) | Agents roadmap (56 agents) |
| [products/agents-store/specs/f.investor.md](./products/agents-store/specs/f.investor.md) | f.investor complete spec |

### Developer

| Doc | Description |
|-----|-------------|
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Getting started, templates, API reference |

---

## 🚀 Quick Start

```bash
# Clone a template
git clone https://github.com/Fuuurma/aitlas-frontend-template.git my-project

# Install and run
cd my-project
bun install
bun dev
```

---

## 📊 Stats

| Metric | Count |
|--------|-------|
| **Products** | 4 (Nova, Nexus, Agents Store, Actions) |
| **Template Repos** | 3 |
| **Tech Stack** | Next.js 16 + Elixir + Drizzle |

---

## 🔗 Template Repositories

| Template | Purpose | Stack |
|----------|---------|-------|
| [aitlas-frontend-template](https://github.com/Fuuurma/aitlas-frontend-template) | Web apps | Next.js 16, Bun, shadcn/ui |
| [aitlas-backend-template](https://github.com/Fuuurma/aitlas-backend-template) | Backend services | Elixir, Phoenix, Oban |
| [aitlas-cli](https://github.com/Fuuurma/aitlas-cli) | CLI tools | Bun, Commander |

---

## 📋 Architecture Decisions

| ADR | Decision | Impact |
|-----|----------|--------|
| **001** | BYOK key cache: 5-min TTL | 90% fewer DB calls |
| **002** | REFLECT opt-in, default OFF | 50% fewer LLM calls |
| **003** | STUCK: SSE + optional email/webhook | Clear notification |
| **004** | Phase 1 MVP: 3-phase loop | Defined scope |

See: [architecture/DECISIONS.md](./architecture/DECISIONS.md)

---

## 🐳 Docker for Agents

### The Analogy

| Docker | Aitlas |
|--------|--------|
| Dockerfile | **AgentSpec** |
| Image | **AgentImage** |
| Container | **AgentInstance** |
| Docker Hub | **Agent Store** |
| Kubernetes | **f.deploy infrastructure** |

### AgentSpec Format

```yaml
agent:
  name: startup-research
  version: 1.2

runtime:
  loop: Nexus runtime

skills:
  - web_research
  - summarization

actions:
  - twyt.post
  - library.search

permissions:
  - internet
  - files

memory:
  type: vector
```

### Deployment Targets

- Local machine
- Cloud workers (Hetzner)
- Enterprise server
- Edge device
- CI/CD pipeline

---

## 🔄 Cold Start Strategy

### The Problem
```
No agents → No users → No agents → (vicious cycle)
```

### 3-Step Solution

1. **Seed the Agent Layer** - 10-20 must-have agents from day one
2. **Make Agents Viral** - Shareable artifacts (`.aitlas-agent` format)
3. **Low-Friction Dev Path** - Agent Spec → f.deploy → Agent Store

---

## 💰 Pricing

| Tier | Cost | Features |
|------|------|----------|
| BYOK | Free | Basic tools, session-only |
| Subscription | $20/mo | Memory, compaction, orchestration |
| Credits | $5/500 | Pay-per-use features |

---

## 📝 Updating Docs

```bash
# In this repo
vim architecture/MASTER_ARCHITECTURE.md
git add . && git commit -m "docs: update" && git push

# Update templates
cd /path/to/aitlas-frontend-template
git submodule update --remote aitlas-docs
git add aitlas-docs
git commit -m "docs: update from aitlas-docs"
git push
```

---

## 🗂️ Folder Structure

```
aitlas-docs/
├── README.md                    # This file
├── ROADMAP.md                   # Product roadmap
├── DEVELOPER_GUIDE.md           # Developer setup guide
│
├── architecture/
│   ├── MASTER_ARCHITECTURE.md   # CANONICAL - Full architecture spec
│   ├── reference/               # SDK, style guides
│   ├── integrations/            # MCP, protocols
│   ├── operations/              # Deployment, decisions
│   ├── agents/                  # Agent specs
│   └── deprecated/              # Outdated (see canonical)
│
└── products/
    ├── nova/                   # Web UI
    ├── nexus/                  # Agent runtime (Elixir)
    ├── actions/                # MCP tools (f.xyz)
    └── agents-store/           # Agent marketplace
```

---

## 🎯 Current Focus

| Status | Item |
|--------|------|
| ✅ Complete | Architecture docs consolidated |
| ✅ Complete | Strategic insights documented (Sections 30-34) |
| ✅ Complete | Extensible Loop concept |
| ✅ Complete | Docker for Agents concept |
| ✅ Complete | Cold Start Strategy |
| ✅ Complete | Rollout Plan (Day 1 → Week 12) |
| 📋 Next | Build first killer agent (Rainmaker) |
| 📋 Next | Seed 10-20 must-have agents |
| 📋 Next | Implement hook system |

---

## 🎯 The Single Most Important Thing

> **The first killer agent = Rainmaker**

If it generates leads/content → users will come.
If it doesn't → no architecture matters.

---

**Maintained by:** Herb (AI CTO) + Furma (CEO)

> *Build fast. Stay sovereign. Zero token liability. Nexus runtime is the product.*