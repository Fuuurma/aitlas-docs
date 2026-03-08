# f.rsrx — Research Synthesis

**Domain:** f.xyz/rsrx  
**Status:** 🟡 Development  
**Category:** Intelligence / Reasoning Tool

---

## Strategic Value

**f.rsrx is a flagship Action of Aitlas.**

Think of it as: **Perplexity + Deep Research + Multi-agent synthesis**

This is one of the most powerful tools in the ecosystem — agents use it for:
- Market research
- Technical research
- Competitive intelligence
- Trend analysis
- Academic research

---

## Research Pipeline Architecture

Instead of a simple LLM prompt, f.rsrx implements a **multi-stage research pipeline**:

```
┌─────────────────────────────────────────────────────────────┐
│                    f.rsrx Research Pipeline                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DISCOVER ──→ FETCH ──→ EXTRACT ──→ RANK ──→ SYNTHESIZE     │
│                                                              │
│  ┌─────────┐   ┌────────┐   ┌──────────┐   ┌──────┐   ┌───────────┐
│  │ Search  │──▶│ Scraper│──▶│ LLM      │──▶│ Score│──▶│ Report    │
│  │ Layer   │   │        │   │ Extractor│   │      │   │ Generator │
│  └─────────┘   └────────┘   └──────────┘   └──────┘   └───────────┘
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Stage 1: DISCOVER (Search Layer)

```
Search Layer
 ├─ Web search (Brave, Google, Bing)
 ├─ Academic search (arXiv, Semantic Scholar)
 ├─ News search (NewsAPI, Google News)
 └─ GitHub search (code, repos)
```

### Stage 2: FETCH (Scraper)

- Fetch full page content
- Handle JavaScript-rendered pages
- Extract main content (remove nav, ads, etc.)

### Stage 3: EXTRACT (LLM Extractor)

- Extract key information
- Identify claims and facts
- Find citations and references

### Stage 4: RANK (Credibility Scorer)

- Relevance to query
- Source credibility (domain authority)
- Recency
- Citation count

### Stage 5: SYNTHESIZE (Report Generator)

- Cluster insights by topic
- Find contradictions
- Generate structured report
- Add citations

---

## Tools API

### `deep_research`

Multi-source research with synthesis.

**Parameters:**
```typescript
{
  // Required
  topic: string;              // Research topic/question
  
  // Configuration
  depth?: "quick" | "standard" | "deep";  // Default: "standard"
  max_sources?: number;       // Default: 10, max: 50
  
  // Source selection
  source_types?: Array<
    | "web"      // General web search
    | "news"     // News articles
    | "academic" // Academic papers
    | "github"   // Code repositories
  >;
  
  // Time filtering
  timeframe?: "24h" | "7d" | "30d" | "year" | "all";
  
  // Output configuration
  output_format?: "summary" | "report" | "brief" | "academic";
  
  // Advanced
  include_citations?: boolean;    // Default: true
  include_research_graph?: boolean; // Default: false
}
```

**Returns:**
```typescript
{
  // Summary
  summary: string;            // 2-3 sentence overview
  
  // Key findings
  key_insights: string[];     // Top 5-10 insights
  
  // Sources used
  sources: Array<{
    title: string;
    url: string;
    source_type: "web" | "news" | "academic" | "github";
    credibility_score: number;  // 0-100
    relevance_score: number;    // 0-100
    published_at?: string;
  }>;
  
  // Citations
  citations: Array<{
    claim: string;
    source_url: string;
    source_title: string;
    quote?: string;
  }>;
  
  // Full report
  report: string;             // Markdown formatted
  
  // Research graph (if enabled)
  research_graph?: {
    nodes: Array<{ id: string; title: string; url: string }>;
    edges: Array<{ from: string; to: string; type: "cites" | "references" | "contradicts" }>;
  };
  
  // Metadata
  metadata: {
    depth: string;
    sources_analyzed: number;
    credits_used: number;
    duration_seconds: number;
  };
}
```

---

### `extract_article`

Extract structured content from a URL.

**Why this exists:** Agents often need to extract content from a specific URL they found. This is a fundamental building block.

**Parameters:**
```typescript
{
  url: string;                // URL to extract from
  
  // Optional
  extract_metadata?: boolean; // Default: true
  extract_links?: boolean;    // Default: false
  extract_images?: boolean;   // Default: false
}
```

**Returns:**
```typescript
{
  // Core content
  title: string;
  content: string;            // Main article text (markdown)
  
  // Metadata
  author?: string;
  published_at?: string;
  site_name?: string;
  
  // Optional extractions
  links?: Array<{ text: string; url: string }>;
  images?: Array<{ alt: string; url: string }>;
  
  // Quality metrics
  word_count: number;
  reading_time_minutes: number;
}
```

---

### `search_sources`

Search across multiple source types without full synthesis.

**Parameters:**
```typescript
{
  query: string;
  
  source_types?: Array<"web" | "news" | "academic" | "github">;
  max_results?: number;       // Default: 10 per source type
  timeframe?: "24h" | "7d" | "30d" | "year" | "all";
}
```

**Returns:**
```typescript
{
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    source_type: string;
    published_at?: string;
  }>;
  
  total_found: number;
}
```

---

### `synthesize_report`

Combine pre-fetched sources into a report.

**Parameters:**
```typescript
{
  sources: Array<{
    url: string;
    title?: string;
    content: string;          // Pre-fetched content
  }>;
  
  topic: string;              // What to synthesize around
  format?: "summary" | "report" | "brief" | "academic";
}
```

**Returns:**
```typescript
{
  report: string;
  key_insights: string[];
  contradictions_found?: Array<{
    claim_a: string;
    claim_b: string;
    source_a: string;
    source_b: string;
  }>;
}
```

---

## Research Graph Feature

When `include_research_graph: true`, f.rsrx tracks connections between sources:

```
Source A ──cites──▶ Source B
Source C ──references──▶ Source B
Source D ──contradicts──▶ Source A
```

**Why this matters:**
- Sources that cite other sources = higher credibility
- Contradictions are flagged for the agent
- Agent can trace claims back to primary sources

**Example output:**
```typescript
{
  research_graph: {
    nodes: [
      { id: "s1", title: "AI Agents Survey 2025", url: "arxiv.org/..." },
      { id: "s2", title: "LangChain Paper", url: "arxiv.org/..." },
      { id: "s3", title: "Critique of Chain-of-Thought", url: "blog.example.com/..." }
    ],
    edges: [
      { from: "s1", to: "s2", type: "cites" },
      { from: "s3", to: "s1", type: "contradicts" }
    ]
  }
}
```

---

## Credits Model

| Depth | Credits | Duration | Sources | Use Case |
|-------|---------|----------|---------|----------|
| **quick** | 2 | ~30s | 5 | Fast lookup, simple questions |
| **standard** | 5 | ~2min | 10 | Regular research, most common |
| **deep** | 12 | ~5-10min | 25 | Thorough analysis, competitive intel |

**Additional costs:**
- `extract_article`: 0.5 credits
- `search_sources`: 1 credit
- `synthesize_report`: 2 credits
- Research graph: +2 credits

---

## f.rsrx + f.loop Synergy

This Action works best when run through **f.loop** for autonomous research agents:

```
f.loop task (autonomous research)
│
├─ OBSERVE: Load goal + memory context
│
├─ PLAN: Decide what to research
│
├─ ACT: Call f.rsrx:deep_research
│
├─ REFLECT: Evaluate research quality
│
├─ PERSIST: Store findings in f.library
│
└─ REPEAT or DONE
```

**Example autonomous agent:**
```typescript
// Competitor Intelligence Agent (runs weekly via f.loop cron)
{
  goal: "Monitor competitor X for new features and pricing changes",
  schedule: { type: "cron", expression: "0 9 * * 1" }, // Every Monday 9am
  toolRegistry: ["f.rsrx", "f.library"],
  memoryCollection: "competitor_intel_x"
}
```

---

## Implementation Roadmap

### Phase 1 — Core Research
- [ ] Web search integration (Brave API)
- [ ] Basic scraper (Fetch)
- [ ] LLM extraction
- [ ] Simple report synthesis
- [ ] `deep_research` tool (standard depth only)

### Phase 2 — Extended Sources
- [ ] Academic search (arXiv)
- [ ] News search (NewsAPI)
- [ ] GitHub search
- [ ] `search_sources` tool
- [ ] `extract_article` tool

### Phase 3 — Advanced Features
- [ ] Credibility scoring
- [ ] Research graph
- [ ] Contradiction detection
- [ ] Deep research mode
- [ ] Quick research mode

### Phase 4 — Integration
- [ ] f.library integration (auto-store)
- [ ] f.loop optimization
- [ ] Caching layer
- [ ] Cost optimization

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       f.rsrx Server                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Search API   │  │ Scraper      │  │ LLM Client   │       │
│  │ - Brave      │  │ - Playwright │  │ - Claude     │       │
│  │ - arXiv      │  │ - Readability│  │ - GPT-4      │       │
│  │ - NewsAPI    │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Credibility  │  │ Graph Engine │  │ Report Gen   │       │
│  │ Scorer       │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                             │
│  Redis (cache) + Postgres (history) + f.library (memory)    │
└─────────────────────────────────────────────────────────────┘
```

---

**Repo:** https://github.com/Fuuurma/f-rsrx