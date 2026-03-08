# Actions Catalog

**All Aitlas actions: 68 planned across 9 categories.**

---

## Quick Reference

| Action | Status | Description |
|--------|--------|-------------|
| **f.loop** | ✅ Active | Durable agent runtime |
| **f.library** | ✅ Active | Memory/knowledge management |
| **f.twyt** | ✅ Active | Twitter automation |
| **f.rsrx** | 📋 Planned | Research assistant |
| **f.finance** | 📋 Planned | Financial data |
| **f.guard** | 📋 Planned | Security monitoring |
| **f.support** | 📋 Planned | Customer support |
| **f.decloy** | 📋 Planned | Deployment automation |

---

## Core Actions

### f.loop - Durable Agent Runtime

**The backbone of Aitlas.**

**Type:** Orchestration  
**Host:** Hetzner (Bun workers) + Vercel (API gateway)  
**Spec:** See `products/actions/f-loop.md` (41KB complete spec)

**What it does:**
- Executes tasks autonomously
- Persists state across failures
- Handles retries and recovery
- Emits real-time SSE events

**The 5-Phase Loop:**
```
① OBSERVE - Poll queue, load task, claim
② PLAN - LLM decides next action
③ ACT - Execute tool via Tool Gateway
④ REFLECT - Assess quality (optional)
⑤ PERSIST - Save to memory, emit SSE
```

**Key features:**
- Postgres queue (`FOR UPDATE SKIP LOCKED`)
- Tool Gateway for centralized auth/RTK/retry/credits
- SSE events for real-time UI updates
- Horizontal scaling via multiple workers

**API:**
```typescript
// Create task
POST /api/v1/loop/tasks
{
  "goal": "Research Solana DeFi yields",
  "tools": ["search_web", "scrape_url", "synthesize"],
  "reflectEnabled": false
}

// Response
{
  "taskId": "task_abc123",
  "status": "PENDING"
}
```

### f.library - Memory Management

**Type:** Knowledge  
**Purpose:** Persistent memory for agents

**What it does:**
- Store and retrieve memories
- Semantic search via QMD
- Memory decay (30-day half-life)
- Cross-session context

**Tools:**
- `create_memory` - Store a memory
- `search_memory` - Semantic search
- `update_memory` - Modify existing
- `delete_memory` - Remove memory

---

## Research Actions

### f.rsrx - Research Assistant

**Type:** Research  
**Purpose:** Autonomous research and report generation

**Pipeline:** DISCOVER → EXTRACT → SYNTHESIZE

**Phase 1 Tools:**
- `search_web` - Brave Search API
- `scrape_url` - Fetch + extract content
- `synthesize` - LLM summarization

**Example:**
```
Goal: "Research Solana DeFi yields"

Step 1: search_web({ query: "Solana DeFi yields 2026" })
Step 2: scrape_url({ url: "https://defillama.com/..." })
Step 3: synthesize({ findings: [...] })
Result: Structured markdown report
```

**Spec:** See `products/actions/f-rsrx.md`

### f.finance - Financial Data

**Type:** Finance  
**Purpose:** Market data, prices, analysis

**Tools:**
- `get_quote` - Stock/crypto price
- `get_financials` - Company financials
- `get_historical` - Price history
- `screen_stocks` - Filter stocks

---

## Automation Actions

### f.twyt - Twitter Automation

**Type:** Social  
**Purpose:** Twitter/X automation and curation

**Features:**
- Tweet scheduling
- Thread composition
- Analytics tracking
- Content curation

### f.support - Customer Support

**Type:** Support  
**Purpose:** Autonomous customer support

**Features:**
- Ticket classification
- Response drafting
- Knowledge base search
- Escalation handling

---

## DevOps Actions

### f.guard - Security Monitoring

**Type:** Security  
**Purpose:** Security monitoring and alerts

**Powered by:** Warden (Sentry's code review engine)

**Features:**
- Code vulnerability scanning
- Dependency auditing
- Security alerts
- Compliance checking

### f.decloy - Deployment Automation

**Type:** DevOps  
**Purpose:** Automated deployments

**Features:**
- Git-based deployments
- Environment management
- Rollback support
- Health checks

---

## Full Roadmap

### Tier 1 - Core (Q2 2026)

| Action | Purpose | Status |
|--------|---------|--------|
| **f.pay** | Payments (Stripe) | 📋 Planned |
| **f.news** | News aggregation | 📋 Planned |
| **f.crm** | CRM integration | 📋 Planned |
| **f.vault** | Secrets management | 📋 Planned |
| **f.scrape** | Web scraping | 📋 Planned |

### Tier 2 - Finance & Data (Q3 2026)

| Action | Purpose | Status |
|--------|---------|--------|
| **f.hack** | Security testing | 📋 Planned |
| **f.finance** | Market data | 📋 Planned |
| **f.crypto** | Crypto tools | 📋 Planned |
| **f.mcp** | MCP server generator | 📋 Planned |
| **f.assistant** | Generic assistant | 📋 Planned |

### Tier 3 - Specialized (Q4 2026+)

| Action | Purpose | Status |
|--------|---------|--------|
| **f.sports** | Sports data | 📋 Planned |
| **f.bets** | Betting odds | 📋 Planned |
| **f.psychology** | Mental health | 📋 Planned |
| **f.language** | Translation | 📋 Planned |
| **f.google** | Google Workspace | 📋 Planned |

---

## Integration: RTK (Rust Token Killer)

**What:** 60-80% token cost reduction on command outputs

**License:** MIT  
**Stars:** 4,700+  
**Integration:** Via Tool Gateway

**How it works:**
1. Tool call produces output
2. RTK compresses output
3. Compressed output sent to LLM
4. 60-80% fewer tokens used

**Benefit:** BYOK users' money goes further - competitive advantage at zero cost

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| f.loop spec | ✅ Complete | 41KB spec |
| f.rsrx spec | ✅ Complete | Phase 1 tools defined |
| Tool Gateway | 📋 Planned | Central auth/RTK/retry |
| RTK integration | 📋 Planned | In Tool Gateway |
| Worker pool | 📋 Planned | Hetzner Bun workers |

---

**Last Updated:** 2026-03-08