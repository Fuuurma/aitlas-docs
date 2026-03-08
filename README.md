# Aitlas Documentation

**Source of truth for all Aitlas template repositories.**

---

## 📚 Documentation Index

### Core Architecture

| Doc | Description |
|-----|-------------|
| [AITLAS_ARCHITECTURE.md](./AITLAS_ARCHITECTURE.md) | Full architecture spec - Memory, Compaction, Orchestration, Pricing |
| [AITLAS_QUICK_REFERENCE.md](./AITLAS_QUICK_REFERENCE.md) | Quick reference card |
| [AITLAS_PROJECT_SPEC.md](./AITLAS_PROJECT_SPEC.md) | Project specifications |
| [AITLAS_ALIGNMENT_PLAN.md](./AITLAS_ALIGNMENT_PLAN.md) | Alignment plan |

### Research & Analysis

| Doc | Description |
|-----|-------------|
| [OPENSANDBOX_RESEARCH.md](./OPENSANDBOX_RESEARCH.md) | OpenSandbox integration - Execution layer |
| [AGENTIC_WORKFLOW_RESEARCH.md](./AGENTIC_WORKFLOW_RESEARCH.md) | 20+ open source frameworks research |
| [LOCAL_VS_CLOUD.md](./LOCAL_VS_CLOUD.md) | BYOK model explanation |
| [NEXUS_HYBRID_MODEL.md](./NEXUS_HYBRID_MODEL.md) | BYOK + subscription/credits pricing |
| [OPEN_SOURCE_INTEGRATIONS.md](./OPEN_SOURCE_INTEGRATIONS.md) | 7 projects tracked for integration |

### Architecture Details

| Doc | Description |
|-----|-------------|
| [architecture/ACTIONS_ARCHITECTURE.md](./architecture/ACTIONS_ARCHITECTURE.md) | Actions system architecture |
| [architecture/AGENT_SPEC.md](./architecture/AGENT_SPEC.md) | Agent specifications |
| [architecture/AITLAS_MCP_SPEC.md](./architecture/AITLAS_MCP_SPEC.md) | MCP protocol spec |
| [architecture/TECHNICAL_ARCHITECTURE.md](./architecture/TECHNICAL_ARCHITECTURE.md) | Technical architecture |
| [architecture/DEPLOYMENT.md](./architecture/DEPLOYMENT.md) | Deployment guide |
| [architecture/credit-system.md](./architecture/credit-system.md) | Credit system design |
| [architecture/mcp-protocol.md](./architecture/mcp-protocol.md) | MCP protocol details |
| [architecture/security.md](./architecture/security.md) | Security architecture |
| [architecture/performance.md](./architecture/performance.md) | Performance considerations |

### Products

| Product | Description |
|---------|-------------|
| [products/nexus/](./products/nexus/) | Nexus UI - AI Command Center |
| [products/agents-store/](./products/agents-store/) | Agents Store - Marketplace |
| [products/actions/](./products/actions/) | Actions - MCP tools |

#### Actions Documentation

| Action | Description |
|--------|-------------|
| [f-loop](./products/actions/f-loop.md) | Orchestration engine (41KB) |
| [f-library](./products/actions/f-library.md) | Knowledge management |
| [f-twyt](./products/actions/f-twyt.md) | Twitter automation |
| [f-rsrx](./products/actions/f-rsrx.md) | Research assistant |
| [f-support](./products/actions/f-support.md) | Customer support |
| [f-guard](./products/actions/f-guard.md) | Security monitoring |
| [f-decloy](./products/actions/f-decloy.md) | Deployment automation |
| [RTK_INTEGRATION](./products/actions/RTK_INTEGRATION.md) | RTK integration spec |

### Guides

| Doc | Description |
|-----|-------------|
| [BUILDING_ON_TOP.md](./BUILDING_ON_TOP.md) | How to build on templates |
| [USAGE.md](./USAGE.md) | Usage guide |
| [INDEX.md](./INDEX.md) | Documentation index |
| [getting-started/setup.md](./getting-started/setup.md) | Setup guide |
| [developer-guide/api-routes.md](./developer-guide/api-routes.md) | API routes guide |
| [developer-guide/building-features.md](./developer-guide/building-features.md) | Building features guide |
| [migration/nextauth-to-better-auth.md](./migration/nextauth-to-better-auth.md) | Auth migration guide |

### Business & Marketing

| Doc | Description |
|-----|-------------|
| [business/BUSINESS_PLAN.md](./business/BUSINESS_PLAN.md) | Business plan |
| [marketing/MARKETING_STRATEGY.md](./marketing/MARKETING_STRATEGY.md) | Marketing strategy |

---

## 🔗 Template Repositories

These docs are included via git submodule in:

- [aitlas-ui-template](https://github.com/Fuuurma/aitlas-ui-template) - UI template (Next.js, React)
- [aitlas-action-template](https://github.com/Fuuurma/aitlas-action-template) - Action template (MCP tools)
- [aitlas-worker-template](https://github.com/Fuuurma/aitlas-worker-template) - Worker template (Background jobs)
- [aitlas-cli](https://github.com/Fuuurma/aitlas-cli) - CLI template (Command-line tools)

---

## 📋 Updating Docs

1. **Edit docs in this repo** (aitlas-docs)
2. **Commit and push changes**
3. **Update submodules in each template:**

```bash
# In each template repo
git submodule update --remote aitlas-docs
git add aitlas-docs
git commit -m "docs: update from aitlas-docs"
git push
```

---

## 🚀 Using Templates

When cloning a template to start a new project:

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/Fuuurma/aitlas-ui-template.git my-new-project

# If you forgot --recurse-submodules
git clone https://github.com/Fuuurma/aitlas-ui-template.git my-new-project
cd my-new-project
git submodule init
git submodule update
```

The `aitlas-docs/` folder will contain the latest documentation.

---

## 📖 Key Concepts

### What Aitlas Builds (LLMs Don't Have)

| Capability | Why | Priority |
|------------|-----|----------|
| Persistent Memory | LLMs forget between sessions | P0 |
| Auto-Compaction | LLMs don't auto-summarize | P0 |
| Agent Orchestration | Multi-agent coordination | P1 |
| Codebase Search | Semantic file search | P1 |
| Tool Ecosystem | 50+ pre-built tools | P1 |

### Pricing

| Tier | Cost | Features |
|------|------|----------|
| BYOK | Free | Basic tools, session-only |
| Subscription | $20/mo | Memory, compaction, orchestration |
| Credits | $5/500 | Pay-per-use features |

---

## 📊 Stats

- **Total Docs:** 45+ markdown files
- **Architecture Docs:** 20+ files
- **Product Docs:** 10+ files
- **Total Size:** ~300KB

---

**License:** Apache 2.0