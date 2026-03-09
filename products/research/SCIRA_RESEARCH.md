# Scira — Research

**Status:** 🔵 Research  
**Reference:** [zaidmukaddam/scira](https://github.com/zaidmukaddam/scira) (11.5K stars, AGPL-3.0)  
**Use:** f.research - combined with Perplexica

---

## Overview

**Scira** = AI Research Engine with agentic planning and scheduled research (Lookouts).

> "AI-powered search engine with citations. Agentic planning, multi-source search, scheduled research."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Agentic Planning** | Breaks complex questions into steps |
| **Grounded Retrieval** | Every answer has citations |
| **17 Search Modes** | Web, X, Stocks, Code, Academic, Reddit, GitHub, YouTube, Crypto, etc. |
| **28 Tools** | Web search, academic, video, music, finance |
| **Lookouts** | Scheduled recurring research agents |
| **Self-hostable** | AGPL-3.0 license |

---

## For Aitlas: f.research

### Combine Perplexica + Scira

| Feature | Perplexica | Scira | Combined |
|---------|-----------|-------|----------|
| Search | ✅ | ✅ | ✅ |
| Citations | ✅ | ✅ | ✅ |
| Deep Research | ✅ | ✅ | ✅ |
| Lookouts (scheduled) | ❌ | ✅ | ✅ |
| 17 search modes | ❌ | ✅ | ✅ |

### The Hybrid Approach

```
┌─────────────────────────────────────────┐
│              f.research                   │
│                                         │
│  ┌─────────────┐    ┌─────────────┐    │
│  │ Perplexica │ +  │   Scira    │   │
│  │ (Core)     │    │ (Lookouts) │   │
│  └─────────────┘    └─────────────┘    │
│         │                  │            │
│    • Search           • Scheduled     │
│    • Deep research   • Monitoring    │
│    • Citations       • Alerts         │
└─────────────────────────────────────────┘
```

### Lookouts - Scheduled Research

Scira's **Lookouts** = scheduled recurring research:

| Use Case | Description |
|----------|-------------|
| Competitor monitoring | Daily news on competitors |
| Industry trends | Weekly summaries |
| Price tracking | Monitor specific assets |
| Security advisories | CVE alerts |

---

## Comparison

| Feature | Perplexica | Scira |
|---------|------------|-------|
| Stars | 32K | 11.5K |
| License | MIT | AGPL-3.0 |
| Local LLM | ✅ (Ollama) | ❌ |
| Lookouts | ❌ | ✅ |
| Search modes | Fewer | 17 modes |
| Self-hosted | ✅ | ✅ |

---

## Recommendation

### Use Perplexica as Core

- Better license (MIT)
- More stars
- Local LLM support
- Already integrated in docs

### Add Scira's Lookouts

- Implement scheduled research separately
- Or: build own lookahead system
- Not critical for v1

---

## Next Steps

1. **Start with Perplexica** (MIT, more stars)
2. **Build Lookouts** feature separately (or use Nexus runtime)
3. **Evaluate** Scira later for advanced features

---

## References

- [Scira GitHub](https://github.com/zaidmukaddam/scira)
- [Perplexica](https://github.com/ItzCrazyKns/Perplexica) (our core)

---

*Status: 🔵 Reference - Lower priority, Perplexica is sufficient for v1*
