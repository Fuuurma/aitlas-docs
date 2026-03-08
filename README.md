# Aitlas Documentation

**Source of truth for all Aitlas template repositories.**

---

## 📚 Documentation Index

### Core Docs (Root)

| Doc | Description |
|-----|-------------|
| [AITLAS_ARCHITECTURE.md](./AITLAS_ARCHITECTURE.md) | Full architecture spec - Memory, Compaction, Orchestration, Pricing |
| [AITLAS_QUICK_REFERENCE.md](./AITLAS_QUICK_REFERENCE.md) | Quick reference card |

---

### Research (`research/`)

| Doc | Description |
|-----|-------------|
| [OPENSANDBOX_RESEARCH.md](./research/OPENSANDBOX_RESEARCH.md) | OpenSandbox integration - Execution layer for Aitlas |
| [DEXTER_INTEGRATION.md](./research/DEXTER_INTEGRATION.md) | Dexter financial research agent integration |
| [AGENTIC_WORKFLOW_RESEARCH.md](./research/AGENTIC_WORKFLOW_RESEARCH.md) | 20+ open source frameworks research |
| [LOCAL_VS_CLOUD.md](./research/LOCAL_VS_CLOUD.md) | BYOK model explanation |
| [NEXUS_HYBRID_MODEL.md](./research/NEXUS_HYBRID_MODEL.md) | BYOK + subscription/credits pricing |
| [OPEN_SOURCE_INTEGRATIONS.md](./research/OPEN_SOURCE_INTEGRATIONS.md) | 7 projects tracked for integration |
| [AITLAS_ALIGNMENT_PLAN.md](./research/AITLAS_ALIGNMENT_PLAN.md) | Alignment plan |
| [AITLAS_PROJECT_SPEC.md](./research/AITLAS_PROJECT_SPEC.md) | Project specifications |

---

### Architecture (`architecture/`)

| Doc | Description |
|-----|-------------|
| [ACTIONS_ARCHITECTURE.md](./architecture/ACTIONS_ARCHITECTURE.md) | Actions system architecture |
| [AGENT_SPEC.md](./architecture/AGENT_SPEC.md) | Agent specifications |
| [AGENT_SYSTEM_PROMPT_TEMPLATE.md](./architecture/AGENT_SYSTEM_PROMPT_TEMPLATE.md) | Professional system prompt template |
| [AITLAS_MCP_SPEC.md](./architecture/AITLAS_MCP_SPEC.md) | MCP protocol spec |
| [TECHNICAL_ARCHITECTURE.md](./architecture/TECHNICAL_ARCHITECTURE.md) | Technical architecture |
| [DEPLOYMENT.md](./architecture/DEPLOYMENT.md) | Deployment guide |
| [credit-system.md](./architecture/credit-system.md) | Credit system design |
| [mcp-protocol.md](./architecture/mcp-protocol.md) | MCP protocol details |
| [security.md](./architecture/security.md) | Security architecture |
| [performance.md](./architecture/performance.md) | Performance considerations |

---

### Products

#### Nexus (AI Command Center)
- [products/nexus/README.md](./products/nexus/README.md) - Nexus UI overview

#### Agents Store (Marketplace)
- [products/agents-store/README.md](./products/agents-store/README.md) - Agents Store overview
- [products/agents-store/ROADMAP.md](./products/agents-store/ROADMAP.md) - 56 agents planned
- [products/agents-store/WEALTH_ARCHITECT_ANALYSIS.md](./products/agents-store/WEALTH_ARCHITECT_ANALYSIS.md) - Professional prompt analysis
- [products/agents-store/specs/f.investor.md](./products/agents-store/specs/f.investor.md) - Complete f.investor spec

#### Actions (MCP Tools)
- [products/actions/README.md](./products/actions/README.md) - Actions overview
- [products/actions/ROADMAP.md](./products/actions/ROADMAP.md) - 68 actions planned
- [products/actions/f-loop.md](./products/actions/f-loop.md) - Orchestration engine (41KB)
- [products/actions/f-library.md](./products/actions/f-library.md) - Knowledge management
- [products/actions/f-twyt.md](./products/actions/f-twyt.md) - Twitter automation
- [products/actions/f-rsrx.md](./products/actions/f-rsrx.md) - Research assistant
- [products/actions/f-support.md](./products/actions/f-support.md) - Customer support
- [products/actions/f-guard.md](./products/actions/f-guard.md) - Security monitoring
- [products/actions/f-decloy.md](./products/actions/f-decloy.md) - Deployment automation

---

### Guides

| Doc | Description |
|-----|-------------|
| [research/BUILDING_ON_TOP.md](./research/BUILDING_ON_TOP.md) | How to build on templates |
| [research/USAGE.md](./research/USAGE.md) | Usage guide |
| [getting-started/setup.md](./getting-started/setup.md) | Setup guide |
| [developer-guide/api-routes.md](./developer-guide/api-routes.md) | API routes guide |
| [developer-guide/building-features.md](./developer-guide/building-features.md) | Building features guide |
| [migration/nextauth-to-better-auth.md](./migration/nextauth-to-better-auth.md) | Auth migration guide |

---

### Business & Marketing

| Doc | Description |
|-----|-------------|
| [business/BUSINESS_PLAN.md](./business/BUSINESS_PLAN.md) | Business plan |
| [marketing/MARKETING_STRATEGY.md](./marketing/MARKETING_STRATEGY.md) | Marketing strategy |

---

## 🔗 Template Repositories

These docs are included via git submodule in:

| Template | Purpose | Tech Stack |
|----------|---------|------------|
| [aitlas-ui-template](https://github.com/Fuuurma/aitlas-ui-template) | UI apps | Next.js 16, React, shadcn |
| [aitlas-action-template](https://github.com/Fuuurma/aitlas-action-template) | MCP tools | Hono, TypeScript |
| [aitlas-worker-template](https://github.com/Fuuurma/aitlas-worker-template) | Background jobs | Bun, Redis |
| [aitlas-cli](https://github.com/Fuuurma/aitlas-cli) | CLI tools | Node.js, Commander |

---

## 📋 Updating Docs

```bash
# 1. Edit docs in this repo (aitlas-docs)
vim architecture/AGENT_SPEC.md

# 2. Commit and push
git add . && git commit -m "docs: update" && git push

# 3. Update submodules in templates
cd /Users/sergi/Projects/aitlas-ui-template
git submodule update --remote aitlas-docs
git add aitlas-docs
git commit -m "docs: update from aitlas-docs"
git push
```

---

## 🚀 Using Templates

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/Fuuurma/aitlas-ui-template.git my-project

# If you forgot --recurse-submodules
git clone https://github.com/Fuuurma/aitlas-ui-template.git my-project
cd my-project
git submodule init && git submodule update
```

---

## 📖 Key Concepts

### What Aitlas Builds (LLMs Don't Have)

| Capability | Why | Priority |
|------------|-----|----------|
| Persistent Memory | LLMs forget between sessions | P0 |
| Auto-Compaction | LLMs don't auto-summarize | P0 |
| Agent Orchestration | Multi-agent coordination | P1 |
| Codebase Search | Semantic file search | P1 |
| Tool Ecosystem | 68+ pre-built tools | P1 |

### Pricing

| Tier | Cost | Features |
|------|------|----------|
| BYOK | Free | Basic tools, session-only |
| Subscription | $20/mo | Memory, compaction, orchestration |
| Credits | $5/500 | Pay-per-use features |

---

## 📊 Stats

| Category | Count |
|----------|-------|
| **Total Docs** | 58 markdown files |
| **Actions Planned** | 68 (7 current + 61 planned) |
| **Agents Planned** | 56 across 10 categories |
| **Research Docs** | 10 files |
| **Architecture Docs** | 16 files |

---

## 🎯 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Docs Structure** | ✅ Complete | Organized into research/, architecture/, products/ |
| **Actions Roadmap** | ✅ Complete | 68 actions planned across 9 categories |
| **Agents Roadmap** | ✅ Complete | 56 agents across 10 categories |
| **System Prompt Template** | ✅ Complete | Professional-grade template |
| **f.investor Spec** | ✅ Complete | Full agent specification |
| **Dexter Integration** | ✅ Researched | Financial research agent |
| **OpenSandbox Integration** | ✅ Researched | Execution layer |

---

**License:** Apache 2.0  
**Last Updated:** 2026-03-08