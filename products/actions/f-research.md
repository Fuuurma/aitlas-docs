# f.research — AI Research Engine

**Domain:** f.research.aitlas.xyz  
**Status:** 🟡 Development (Perplexica Integration)  
**Credits:** 5/query, 10/deep-research, 3/scheduled  
**Engine:** [Perplexica](https://github.com/ItzCrazyKns/Perplexica) (32K stars, MIT) + Custom Enhancements

---

## Strategic Value

**f.research = Production-grade AI research** — powered by Perplexica, enhanced with Aitlas integration.

This is a flagship Action — agents use it for:
- Market research
- Technical research
- Competitive intelligence
- Trend analysis
- Academic research
- Scheduled monitoring (Lookouts)

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      f.research                              │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Perplexica│───▶│   Next.js   │───▶│    Nexus    │     │
│  │   Engine   │    │      UI     │    │  Integration│     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                  │            │
│    • Search            • Dashboard            MCP           │
│    • Deep research     • History           • Nexus runtime        │
│    • Citations        • Export           • Agents         │
│                                           • BYOK           │
└─────────────────────────────────────────────────────────────┘
```

---

## BYOK: User Provides Their Own LLM

**Critical differentiator:** Unlike Perplexity/ChatGPT, f.research uses **user's LLM key**.

| Provider | User Provides | Aitlas Cost |
|----------|---------------|-------------|
| OpenAI | ✅ Their API key | $0 |
| Anthropic | ✅ Their API key | $0 |
| Google Gemini | ✅ Their API key | $0 |
| Groq | ✅ Their API key | $0 |
| Ollama (local) | ✅ Their model | $0 |

**Aitlas only charges for the research orchestration** (credits), not the LLM.

---

## Architecture

### Components

| Component | Tech | Description |
|-----------|------|-------------|
| **UI** | Next.js (ui-template) | Full dashboard for research, history |
| **API** | Hono (action-template) | MCP endpoint + REST API |
| **Engine** | Perplexica | Core search + LLM orchestration |
| **Search** | SearxNG | Privacy-focused search |
| **LLM** | User's key (BYOK) | OpenAI/Claude/Gemini/Groq/Ollama |
| **DB** | PostgreSQL + pgvector | Research history, embeddings |
| **Scheduled** | Nexus runtime | Lookouts (scheduled research) |

### Deployment

- **UI:** Vercel (Next.js)
- **API:** Vercel Serverless (Hono)
- **Engine:** Hetzner (Bun) for compute
- **Search:** SearxNG (self-hosted or cloud)

---

## MCP Tools

### `research`

Standard research query.

```typescript
{
  query: string;
  mode?: "speed" | "balanced" | "quality";
  sources?: ("web" | "academic" | "news" | "github")[];
  focus_area?: string;
}
```

**Returns:**
```typescript
{
  research_id: string;
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }>;
  follow_up_questions: string[];
  mode_used: string;
  tokens_used: number;
  duration_ms: number;
}
```

---

### `deep_research`

In-depth research with agentic planning.

```typescript
{
  query: string;
  max_sources?: number;      // default: 10
  max_depth?: number;         // default: 3
  report_format?: "brief" | "detailed" | "comprehensive";
}
```

**Returns:**
```typescript
{
  research_id: string;
  report: string;             // Markdown report
  sections: Array<{
    title: string;
    content: string;
    sources: string[];
  }>;
  sources: Source[];
  metadata: {
    queries_generated: number;
    pages_visited: number;
    reasoning_steps: number;
  };
  tokens_used: number;
  duration_ms: number;
}
```

---

### `academic_search`

Research specific to academic papers.

```typescript
{
  query: string;
  max_results?: number;       // default: 10
  date_from?: string;         // ISO date
}
```

---

### `scheduled_research`

Set up recurring research (via Nexus runtime).

```typescript
{
  query: string;
  schedule: string;            // Cron expression
  mode?: "speed" | "balanced" | "quality";
  notification?: ("email" | "push" | "webhook")[];
  alert_on_change?: boolean;  // Notify on new findings
}
```

**Returns:**
```typescript
{
  research_id: string;
  schedule_id: string;
  next_run: string;
  status: "active" | "paused";
}
```

---

### `get_research_history`

Past research results.

```typescript
{
  limit?: number;             // default: 20
  mode_filter?: string;
}
```

---

### `compare_sources`

Compare information across multiple sources.

```typescript
{
  sources: string[];           // URLs or research IDs
  question: string;
}
```

---

### `extract_insights`

Extract structured data from research.

```typescript
{
  research_id: string;
  schema: object;             // JSON schema for extraction
}
```

---

## Search Modes

| Mode | Use Case | Speed | Depth |
|------|----------|-------|-------|
| **Speed** | Quick answers | ~10s | Shallow |
| **Balanced** | Everyday research | ~30s | Medium |
| **Quality** | Deep research | ~2-5min | Deep |

---

## Perplexica Integration Details

### Why Perplexica?

| Feature | Perplexica | Scira | Others |
|--------|------------|-------|--------|
| **Stars** | 32,230 | 11,501 | - |
| **License** | MIT | AGPL-3.0 | - |
| **Self-hosted** | ✅ | ❌ | - |
| **Local LLM** | ✅ (Ollama) | ❌ | - |
| **Search** | SearxNG | Exa | - |
| **Deep research** | ✅ | ✅ | - |

### Integration Approach

1. **Use Perplexica as the core** — Fork and enhance
2. **Add MCP wrapper** — Expose as Aitlas Action
3. **Add BYOK layer** — User provides their LLM key
4. **Build UI on top** — Next.js dashboard
5. **Add Nexus runtime integration** — Scheduled research (Lookouts)

### Custom Enhancements

- **pgvector storage** — Semantic search over past research
- **Credit billing** — Pay with Aitlas credits
- **Team features** — Organization research
- **Export formats** — PDF, Markdown, Notion

---

## Credit Model

| Action | Credits | Notes |
|--------|---------|-------|
| Quick research (speed) | 3 | ~10 seconds |
| Standard research | 5 | ~30 seconds |
| Deep research | 10 | ~2-5 minutes |
| Academic search | 4 | Papers only |
| Scheduled (per run) | 3 | Via Nexus runtime |
| Compare sources | 2 | Per comparison |

**LLM costs:** User pays via their own API key (BYOK)

---

## Nexus runtime Integration (Lookouts)

**Scheduled research** — Monitor topics over time.

```
┌─────────────────────────────────────────┐
│             Nexus runtime                       │
│                                         │
│  Schedule: cron("0 9 * * *")          │
│       ↓                                 │
│  f.research(query)                     │
│       ↓                                 │
│  Compare with previous results          │
│       ↓                                 │
│  If changes → notify user              │
│       ↓                                 │
│  Store in history                       │
└─────────────────────────────────────────┘
```

### Use Cases

- **Competitor monitoring** — Track competitor news
- **Industry trends** — Daily research summaries
- **Price tracking** — Product/asset monitoring
- **Security advisories** — CVE/vulnerability alerts

---

## UI Screens

### 1. Research Console
- Query input with mode selector
- Real-time progress
- Source preview
- Answer with citations

### 2. Deep Research
- Agentic planning visualization
- Multi-stage progress
- Full report viewer

### 3. History
- Past research list
- Search within history
- Re-run option

### 4. Scheduled (Lookouts)
- Active schedules
- Results over time
- Change alerts

### 5. Settings
- LLM provider selection
- API key management
- Default modes

---

## Future Enhancements

### v2.0
- **Multi-modal research** — Images, videos
- **Notion integration** — Auto-export to Notion
- **Collaborative research** — Team features

### v3.0
- **Custom agents** — Specialized research agents
- **API for developers** — External access
- **Marketplace** — Share research templates

---

## References

- [Perplexica GitHub](https://github.com/ItzCrazyKns/Perplexica)
- [Perplexica Docs](https://github.com/ItzCrazyKns/Perplexica/tree/master/docs)
- [SearxNG](https://searxng.github.io/searxng/)
- [Aitlas MCP Spec](../../architecture/AITLAS_MCP_SPEC.md)

---

*Status: 🟡 Development — Perplexica integration in progress*
