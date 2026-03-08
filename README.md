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

## 📚 Documentation Index

### Core Docs

| Doc | Description |
|-----|-------------|
| [AITLAS_ARCHITECTURE.md](./AITLAS_ARCHITECTURE.md) | Full architecture spec |
| [AITLAS_QUICK_REFERENCE.md](./AITLAS_QUICK_REFERENCE.md) | Quick reference card |

### Architecture

| Doc | Description |
|-----|-------------|
| [architecture/OVERVIEW.md](./architecture/OVERVIEW.md) | Consolidated architecture overview |
| [architecture/DECISIONS.md](./architecture/DECISIONS.md) | Architecture Decision Records (ADRs) |

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
vim architecture/OVERVIEW.md
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
├── AITLAS_ARCHITECTURE.md
├── AITLAS_QUICK_REFERENCE.md
├── DEVELOPER_GUIDE.md
│
├── architecture/
│   ├── OVERVIEW.md          # Consolidated overview
│   └── DECISIONS.md         # ADRs
│
├── research/
│   └── RESEARCH_CONSOLIDATED.md  # All research
│
└── products/
    ├── actions/
    │   ├── f-loop.md        # 41KB spec (keep)
    │   └── CATALOG.md       # Actions catalog
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
| ✅ Complete | Research docs consolidated |
| ✅ Complete | Actions catalog created |
| ✅ Complete | f.investor spec |
| 📋 Next | More agent specs (f.coder, f.researcher) |
| 📋 Next | Phase 1 implementation |

---

**License:** Apache 2.0  
**Last Updated:** 2026-03-08