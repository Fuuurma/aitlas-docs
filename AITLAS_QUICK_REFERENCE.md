# Aitlas Architecture - Quick Reference

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

**Full Doc:** `/Users/sergi/atlas/AITLAS_ARCHITECTURE.md` (50KB)

---

## What LLMs Have (Don't Build) ✅

| Capability | Description |
|------------|-------------|
| Reasoning | Model's intelligence |
| Tool calling | Function calling API |
| Context window | 128K-200K tokens |
| Streaming | Real-time responses |

## What We Build ❌

| Capability | Why | Complexity |
|------------|-----|------------|
| Memory | LLMs forget between sessions | HIGH |
| Compaction | LLMs don't auto-summarize | MEDIUM |
| Orchestration | Multi-agent coordination | HIGH |
| Codebase search | Semantic file search | MEDIUM |
| Tool ecosystem | 50+ pre-built tools | LOW |

---

## Architecture Layers

```
1. Nova (Chat, Code, Actions, Memory panels)
   ↓
2. Orchestration (Memory, Compaction, Planner, Tool Router)
   ↓
3. LLM Provider (Claude/GPT/Gemini - user's API key)
   ↓
4. Execution (Shell, Files, Browser, MCP)
```

---

## Pricing

| Tier | Cost | What You Get |
|------|------|--------------|
| **BYOK** | Free | Basic tools, session-only |
| **Subscription** | $20/mo | Memory, compaction, orchestration |
| **Credits** | $5/500 | Pay-per-use features |
| **Enterprise** | Custom | Self-hosted, SSO, SLA |

---

## Implementation Phases

| Phase | Weeks | Goal |
|-------|-------|------|
| 1 | 1-2 | Foundation (BYOK, core tools) |
| 2 | 3-4 | Memory (persistent storage) |
| 3 | 5-6 | Compaction (auto-summarize) |
| 4 | 7-8 | Orchestration (multi-agent) |
| 5 | 9-10 | Agent Store (marketplace) |
| 6 | 11-12 | Actions API (MCP, credits) |

---

## Key Insights

1. **We augment, not replace** - Build orchestration around LLM
2. **BYOK for everyone** - User provides API key
3. **Memory is key** - Persistent context is the differentiator
4. **Compaction enables unlimited sessions** - Never run out of tokens
5. **MCP enables external use** - Actions API for integrations

---

## Next Steps

1. Read full architecture doc
2. Review implementation roadmap
3. Prioritize Phase 1 tasks
4. Set up project structure
5. Begin core tool implementation