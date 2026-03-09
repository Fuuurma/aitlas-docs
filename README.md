# Aitlas Documentation

**Source of truth for all Aitlas template repositories.**

---

## 🎯 What is Aitlas?

**Aitlas = Nexus + Agents Store + Actions**

| Component | Description |
|-----------|-------------|
| **Nexus** | AI Command Center UI |
| **Agents Store** | Marketplace of 56 pre-configured agents |
| **Actions** | 68 pre-built MCP tools |

**Key insight:** f.loop is the backbone - everything else is UI or tools on top of it.

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

| Doc | Description |
|-----|-------------|
| [MASTER_ARCHITECTURE.md](./architecture/MASTER_ARCHITECTURE.md) | **CANONICAL** - Single source of truth (1,091 lines) |
| [DECISIONS.md](./architecture/DECISIONS.md) | Architecture Decision Records (ADRs) |

### Key Sections in MASTER_ARCHITECTURE.md

| Section | Title | Key Insight |
|---------|-------|-------------|
| 1-24 | Core Architecture | Vision, Nexus, Agents, Actions, f.loop, Tool Gateway |
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

### Research

| Doc | Description |
|-----|-------------|
| [research/RESEARCH_CONSOLIDATED.md](./research/RESEARCH_CONSOLIDATED.md) | Frameworks, integrations, deployment models |

### Products

| Doc | Description |
|-----|-------------|
| [products/actions/f-loop.md](./products/actions/f-loop.md) | **f.loop spec (41KB)** - Durable agent runtime |
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
# Clone a template with docs
git clone --recurse-submodules https://github.com/Fuuurma/aitlas-ui-template.git my-project

# Install and run
cd my-project
pnpm install
pnpm dev
```

---

## 📊 Stats

| Metric | Count |
|--------|-------|
| **Actions Planned** | 68 (9 categories) |
| **Agents Planned** | 56 (10 categories) |
| **Template Repos** | 4 |
| **Architecture Quality** | 8.5/10 |

---

## 🔗 Template Repositories

| Template | Purpose | Stack |
|----------|---------|-------|
| [aitlas-ui-template](https://github.com/Fuuurma/aitlas-ui-template) | Web apps | Next.js 16, React, shadcn |
| [aitlas-action-template](https://github.com/Fuuurma/aitlas-action-template) | MCP tools | Hono, TypeScript |
| [aitlas-worker-template](https://github.com/Fuuurma/aitlas-worker-template) | Background jobs | Bun, Postgres |
| [aitlas-cli](https://github.com/Fuuurma/aitlas-cli) | CLI tools | Node.js, Commander |

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
  loop: f.loop

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
cd /path/to/aitlas-ui-template
git submodule update --remote aitlas-docs
git add aitlas-docs
git commit -m "docs: update from aitlas-docs"
git push
```

---

## 🗂️ Folder Structure

```
aitlas-docs/
├── README.md
├── DEVELOPER_GUIDE.md
│
├── architecture/
│   ├── MASTER_ARCHITECTURE.md    # CANONICAL (1,091 lines)
│   ├── DECISIONS.md              # ADRs
│   ├── DEPLOYMENT.md             # Deployment architecture
│   ├── ACTIONS_ARCHITECTURE.md   # Actions architecture
│   ├── credit-system.md          # Credit system
│   ├── AGENT_SPEC.md             # Agent specification
│   ├── AGENT_SYSTEM_PROMPT_TEMPLATE.md
│   ├── AITLAS_MCP_SPEC.md        # MCP specification
│   ├── mcp-protocol.md           # MCP implementation
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── SDK_SPEC.md
│   ├── TEMPLATE_STRATEGY.md
│   ├── performance.md
│   └── security.md
│
├── research/
│   └── *.md                      # Research docs
│
└── products/
    ├── actions/
    │   ├── f-loop.md             # 41KB spec
    │   └── CATALOG.md
    └── agents-store/
        ├── ROADMAP.md
        ├── WEALTH_ARCHITECT_ANALYSIS.md
        └── specs/
            └── f.investor.md
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

> *Build fast. Stay sovereign. Zero token liability. f.loop is the product.*