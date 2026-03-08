# Aitlas Documentation

**Source of truth for all Aitlas template repositories.**

---

## 📚 Documentation

| Doc | Description |
|-----|-------------|
| [AITLAS_ARCHITECTURE.md](./AITLAS_ARCHITECTURE.md) | Full architecture spec (55KB) - Memory, Compaction, Orchestration, Pricing |
| [AITLAS_QUICK_REFERENCE.md](./AITLAS_QUICK_REFERENCE.md) | Quick reference card (2KB) |
| [OPENSANDBOX_RESEARCH.md](./OPENSANDBOX_RESEARCH.md) | OpenSandbox integration - Execution layer for Aitlas |
| [AGENTIC_WORKFLOW_RESEARCH.md](./AGENTIC_WORKFLOW_RESEARCH.md) | 20+ open source agentic frameworks research |
| [LOCAL_VS_CLOUD.md](./LOCAL_VS_CLOUD.md) | BYOK model explanation |
| [NEXUS_HYBRID_MODEL.md](./NEXUS_HYBRID_MODEL.md) | BYOK + subscription/credits pricing |
| [OPEN_SOURCE_INTEGRATIONS.md](./OPEN_SOURCE_INTEGRATIONS.md) | 7 projects tracked for integration |

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
git submodule update --remote docs
git add docs
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

The `docs/` folder will contain the latest documentation.

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

**License:** Apache 2.0