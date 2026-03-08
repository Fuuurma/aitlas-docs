# f.rsrx — Research Agent

**Version:** 1.0 | **Date:** March 2026 | **Status:** Active Spec  
**Repo:** `f-rsrx` | **Host:** Vercel (API) + f.loop (execution)  
**Type:** Research Agent

---

## Overview

f.rsrx is the **Research Agent** for the Aitlas ecosystem. It autonomously researches any topic and produces structured, cited reports.

**Key capability:** "Research X and produce a report" → Done autonomously.

---

## Mental Model

```
┌─────────────────────────────────────────────────────────┐
│                    f.rsrx Pipeline                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Input: Research goal (natural language)                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  DISCOVER                                         │   │
│  │  ├── Web search (Brave API)                      │   │
│  │  ├── Twitter/X search                            │   │
│  │  ├── Academic papers (ArXiv, Semantic Scholar)   │   │
│  │  └── News sources (NewsAPI)                      │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  EXTRACT                                          │   │
│  │  ├── Scrape URLs                                 │   │
│  │  ├── Extract key content                         │   │
│  │  ├── Identify citations                          │   │
│  │  └── Deduplicate findings                        │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  SYNTHESIZE                                       │   │
│  │  ├── Structure findings                          │   │
│  │  ├── Write report (LLM)                          │   │
│  │  ├── Add citations                               │   │
│  │  └── Format output (markdown, JSON, etc.)        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Output: Structured research report                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Tool Registry

### Phase 1 Tools (MVP)

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `search_web` | Web search via Brave | `{ query: string, count?: number }` | `{ results: SearchResult[] }` |
| `scrape_url` | Extract content from URL | `{ url: string }` | `{ content: string, title: string }` |
| `synthesize` | Synthesize findings into report | `{ findings: Finding[], format: string }` | `{ report: string }` |

### Phase 2 Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `search_twitter` | Twitter/X search | `{ query: string }` | `{ tweets: Tweet[] }` |
| `search_arxiv` | Academic paper search | `{ query: string }` | `{ papers: Paper[] }` |
| `search_news` | News search via NewsAPI | `{ query: string }` | `{ articles: Article[] }` |
| `deep_research` | Multi-source deep research | `{ query: string, depth: number }` | `{ report: string, sources: Source[] }` |

---

## Tool Implementations

### search_web

```typescript
// tools/search_web.ts

import { web_search } from '@/lib/brave';

export const search_web = {
  name: 'search_web',
  description: 'Search the web for information',
  input: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      count: { type: 'number', default: 5, description: 'Number of results' }
    },
    required: ['query']
  },
  execute: async ({ query, count = 5 }: { query: string; count?: number }) => {
    const results = await web_search({ query, count });
    
    return {
      results: results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        published: r.published
      }))
    };
  }
};
```

### scrape_url

```typescript
// tools/scrape_url.ts

import { web_fetch } from '@/lib/fetcher';

export const scrape_url = {
  name: 'scrape_url',
  description: 'Extract content from a URL',
  input: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to scrape' }
    },
    required: ['url']
  },
  execute: async ({ url }: { url: string }) => {
    const content = await web_fetch(url);
    
    return {
      url,
      title: content.title,
      content: content.text,
      wordCount: content.text.split(' ').length
    };
  }
};
```

### synthesize

```typescript
// tools/synthesize.ts

import { generate } from '@/lib/llm';

export const synthesize = {
  name: 'synthesize',
  description: 'Synthesize research findings into a structured report',
  input: {
    type: 'object',
    properties: {
      findings: { type: 'array', description: 'Research findings' },
      format: { type: 'string', enum: ['markdown', 'json', 'bullet'], default: 'markdown' }
    },
    required: ['findings']
  },
  execute: async ({ findings, format = 'markdown' }: { findings: any[]; format?: string }) => {
    const prompt = `
You are a research synthesizer. Given the following findings, produce a structured report.

FINDINGS:
${JSON.stringify(findings, null, 2)}

OUTPUT FORMAT: ${format}

REQUIREMENTS:
1. Structure with clear sections
2. Cite sources inline [1], [2], etc.
3. Include key insights
4. Note any contradictions or gaps
5. End with a summary

Produce the report now:
`;

    const report = await generate(prompt);
    
    return {
      report,
      format,
      sourceCount: findings.length
    };
  }
};
```

---

## Example Execution Flow

### Goal: "Research best DeFi yield strategies on Solana"

```
═══════════════════════════════════════════════════════════
Step 1
═══════════════════════════════════════════════════════════

PLAN:
  "I need to search for current Solana DeFi yield information"

ACT:
  search_web({ query: "Solana DeFi yield strategies 2026", count: 5 })

RESULT:
  1. "Top Solana DeFi Protocols for Yield Farming" - defillama.com
  2. "Solana Yield Guide 2026" - beincrypto.com
  3. "Best Solana Staking and DeFi Yields" - coinbureau.com
  4. "Marinade vs Raydium vs Kamino" - twitter.com
  5. "Solana DeFi TVL Analysis" - messari.io

═══════════════════════════════════════════════════════════
Step 2
═══════════════════════════════════════════════════════════

PLAN:
  "Scrape the top 2 results for detailed information"

ACT:
  scrape_url({ url: "https://defillama.com/solana-defi-yields" })
  scrape_url({ url: "https://beincrypto.com/solana-yield-guide-2026" })

RESULT:
  [Content about Marinade Finance, Kamino, Raydium, Jito]

═══════════════════════════════════════════════════════════
Step 3
═══════════════════════════════════════════════════════════

PLAN:
  "I have enough information. Synthesize into a report."

ACT:
  synthesize({
    findings: [
      { source: "DefiLlama", content: "..." },
      { source: "BeInCrypto", content: "..." },
      { source: "Twitter", content: "..." }
    ],
    format: "markdown"
  })

RESULT:
  # Solana DeFi Yield Strategies 2026
  
  ## Overview
  [Summary of current Solana DeFi landscape]
  
  ## Top Protocols
  
  ### 1. Marinade Finance (Liquid Staking)
  - APY: 6-7%
  - Risk: Low
  - mSOL token usable across DeFi
  
  ### 2. Kamino Finance (Lending/Leverage)
  - APY: 8-15%
  - Risk: Medium
  - Automated leverage strategies
  
  ### 3. Raydium (AMM/Liquidity)
  - APY: 10-30%
  - Risk: High (impermanent loss)
  - Concentrated liquidity pools
  
  ## Recommendations
  [Based on risk tolerance]
  
  ## Sources
  [1] DefiLlama
  [2] BeInCrypto
  [3] Twitter sentiment analysis

═══════════════════════════════════════════════════════════
Step 4
═══════════════════════════════════════════════════════════

PLAN:
  "DONE - Report complete with actionable recommendations"

TASK: COMPLETED
═══════════════════════════════════════════════════════════
```

---

## Configuration

### Agent-Level Settings

```typescript
const rsrxConfig = {
  // LLM settings
  model: 'gpt-4o-mini',  // Fast, cheap for research
  maxTokens: 4000,
  
  // Search settings
  maxSearchResults: 10,
  maxScrapeDepth: 3,
  
  // Behavior
  reflectEnabled: false,  // Phase 1: disabled
  maxSteps: 10,
  
  // Output
  defaultFormat: 'markdown',
  includeCitations: true,
  includeConfidence: true
};
```

---

## API

### MCP Tool Registration

```typescript
// f.rsrx MCP server

import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'f.rsrx',
  version: '1.0.0',
  tools: [
    search_web,
    scrape_url,
    synthesize
  ]
});

// Register with f.loop Tool Gateway
await gateway.register({
  name: 'f.rsrx',
  tools: ['search_web', 'scrape_url', 'synthesize']
});
```

### REST API (Future)

```typescript
// POST /api/v1/rsrx/research

{
  "goal": "Research best DeFi yield strategies on Solana",
  "format": "markdown",
  "depth": "standard",  // quick | standard | deep
  "sources": ["web", "twitter", "news"],
  "callback": "https://..."  // Optional webhook
}
```

---

## Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| **Brave Search API** | Web search | $5/1000 queries |
| **Cheerio** | HTML parsing | npm package |
| **Turndown** | HTML → Markdown | npm package |
| **OpenAI/Anthropic** | Synthesis | BYOK |

---

## Implementation Status

| Phase | Status | Components |
|-------|--------|------------|
| **Phase 1** | 📋 Planned | search_web, scrape_url, synthesize |
| **Phase 2** | 📋 Planned | Twitter, ArXiv, News APIs |
| **Phase 3** | 📋 Planned | Deep research, multi-source synthesis |

---

**Last Updated:** 2026-03-08