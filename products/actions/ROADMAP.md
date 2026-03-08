# Aitlas Actions - Future Roadmap

**Status:** Planning Phase  
**Last Updated:** 2026-03-08

---

## Overview

Actions are MCP-based tools that extend Aitlas capabilities. Each action is a standalone service that can be used by any AI agent.

**Naming Convention:** `f.{name}` (e.g., f.twyt, f.loop, f.library)

---

## Current Actions (Implemented)

| Action | Purpose | Status |
|--------|---------|--------|
| f.loop | Orchestration engine | ✅ Production |
| f.library | Knowledge management | ✅ Production |
| f.twyt | Twitter automation | ✅ Production |
| f.rsrx | Research assistant | ✅ Production |
| f.support | Customer support | ✅ Production |
| f.guard | Security monitoring | ✅ Production |
| f.decloy | Deployment automation | ✅ Production |

---

## Future Actions Roadmap

### Tier 1: High Priority (Q2 2026)

#### f.pay - Payment Processing
**Purpose:** Handle payments, subscriptions, and financial transactions.

**Features:**
- Stripe integration
- Subscription management
- Invoice generation
- Payment webhooks
- Multi-currency support

**Use Cases:**
- SaaS billing
- One-time payments
- Subscription workflows
- Invoice automation

**MCP Tools:**
- `create_payment_intent`
- `create_subscription`
- `cancel_subscription`
- `get_invoice`
- `process_refund`

---

#### f.news - News Aggregation
**Purpose:** Aggregate, filter, and summarize news from multiple sources.

**Features:**
- RSS/Atom feed parsing
- Web scraping
- AI summarization
- Sentiment analysis
- Topic categorization
- Personalized feeds

**Use Cases:**
- Daily news digest
- Industry monitoring
- Competitor tracking
- Trend analysis

**MCP Tools:**
- `add_source`
- `fetch_news`
- `summarize_article`
- `search_news`
- `get_trending`

---

#### f.crm - Customer Relationship Management
**Purpose:** Manage customer data, interactions, and relationships.

**Features:**
- Contact management
- Deal pipeline
- Email tracking
- Task automation
- Analytics dashboard

**Use Cases:**
- Sales automation
- Customer tracking
- Lead scoring
- Pipeline management

**MCP Tools:**
- `create_contact`
- `update_deal`
- `log_interaction`
- `search_contacts`
- `get_pipeline`

---

#### f.vault - Secure Storage
**Purpose:** Encrypted storage for sensitive data (API keys, credentials, secrets).

**Features:**
- AES-256-GCM encryption
- Secure key storage
- Secret rotation
- Access logging
- Audit trail

**Use Cases:**
- API key management
- Password storage
- Certificate management
- Secret sharing

**MCP Tools:**
- `store_secret`
- `retrieve_secret`
- `rotate_key`
- `list_secrets`
- `audit_access`

---

#### f.scrape - Web Scraping
**Purpose:** Extract data from websites with anti-bot bypass.

**Features:**
- Playwright/Puppeteer integration
- Anti-bot bypass (Cloudflare, etc.)
- Rate limiting
- Proxy rotation
- Data extraction
- Screenshot capture

**Use Cases:**
- Price monitoring
- Lead generation
- Content extraction
- Competitor analysis

**MCP Tools:**
- `scrape_url`
- `extract_data`
- `take_screenshot`
- `fill_form`
- `click_element`

---

### Tier 2: Medium Priority (Q3 2026)

#### f.hack - Security & Penetration Testing
**Purpose:** Security scanning, vulnerability detection, and penetration testing.

**Features:**
- Port scanning
- Vulnerability assessment
- SSL/TLS checking
- OWASP Top 10 scanning
- Report generation

**Use Cases:**
- Security audits
- Compliance checking
- Vulnerability management
- Penetration testing

**MCP Tools:**
- `scan_ports`
- `check_vulnerabilities`
- `test_ssl`
- `generate_report`
- `schedule_scan`

---

#### f.finance - Financial Analysis
**Purpose:** Financial data analysis, portfolio tracking, and market insights.

**Features:**
- Stock/ETF tracking
- Portfolio analysis
- Risk metrics
- Financial statements
- Market news integration

**Use Cases:**
- Investment research
- Portfolio management
- Financial reporting
- Risk assessment

**MCP Tools:**
- `get_quote`
- `analyze_portfolio`
- `get_financials`
- `calculate_metrics`
- `track_performance`

---

#### f.crypto - Cryptocurrency Tools
**Purpose:** Crypto market data, wallet tracking, and DeFi analysis.

**Features:**
- Price tracking (CoinGecko, CoinMarketCap)
- Wallet balance tracking
- DeFi protocol analysis
- NFT tracking
- On-chain data

**Use Cases:**
- Portfolio tracking
- Market analysis
- DeFi research
- Trading signals

**MCP Tools:**
- `get_price`
- `track_wallet`
- `analyze_defi`
- `get_nft_data`
- `search_token`

---

#### f.mcp - MCP Server Registry
**Purpose:** Discover, install, and manage MCP servers.

**Features:**
- MCP server registry
- One-click install
- Configuration management
- Health monitoring
- Version management

**Use Cases:**
- MCP discovery
- Server management
- Configuration automation
- Dependency tracking

**MCP Tools:**
- `search_servers`
- `install_server`
- `configure_server`
- `check_health`
- `update_server`

---

#### f.assistant - Personal Assistant
**Purpose:** General-purpose assistant for daily tasks.

**Features:**
- Calendar management
- Email drafting
- Task management
- Reminder system
- Note-taking

**Use Cases:**
- Daily planning
- Email automation
- Task tracking
- Meeting scheduling

**MCP Tools:**
- `create_task`
- `schedule_event`
- `draft_email`
- `set_reminder`
- `take_note`

---

### Tier 3: Future Exploration (Q4 2026+)

#### f.sports - Sports Data & Analytics
**Purpose:** Sports scores, statistics, and analysis.

**Features:**
- Live scores
- Statistics database
- Player tracking
- Team analysis
- Prediction models

**MCP Tools:**
- `get_scores`
- `get_stats`
- `analyze_team`
- `predict_outcome`

---

#### f.bets - Betting & Prediction Markets
**Purpose:** Sports betting analysis and prediction market data.

**Features:**
- Odds comparison
- Betting analytics
- Prediction market data
- Arbitrage detection
- Bankroll management

**MCP Tools:**
- `compare_odds`
- `analyze_bet`
- `get_predictions`
- `track_bankroll`

---

#### f.psychology - Mental Health & Psychology
**Purpose:** Mental health tracking, journaling, and psychological insights.

**Features:**
- Mood tracking
- Journal prompts
- CBT exercises
- Meditation guides
- Progress tracking

**MCP Tools:**
- `log_mood`
- `get_prompt`
- `track_progress`
- `generate_insights`

---

#### f.language - Language Learning
**Purpose:** Language learning, translation, and practice.

**Features:**
- Vocabulary building
- Grammar exercises
- Conversation practice
- Translation
- Progress tracking

**MCP Tools:**
- `learn_vocabulary`
- `practice_grammar`
- `translate`
- `track_progress`

---

#### f.google - Google Ecosystem Integration
**Purpose:** Integrate with Google Workspace and services.

**Features:**
- Gmail integration
- Calendar sync
- Drive management
- Docs editing
- Sheets automation

**MCP Tools:**
- `send_email`
- `create_event`
- `upload_file`
- `edit_doc`
- `update_sheet`

---

## Action Development Guidelines

### Naming Convention

```
f.{action_name}

Examples:
- f.pay (payment)
- f.news (news aggregation)
- f.crm (customer management)
```

### Required Components

1. **MCP Server** - JSON-RPC 2.0 compliant
2. **Tool Definitions** - Zod-validated schemas
3. **Credit System** - Usage-based billing
4. **Health Endpoint** - `/api/health`
5. **Docker Support** - Containerized deployment
6. **Documentation** - README + API docs

### Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Framework | Hono |
| Validation | Zod |
| Database | PostgreSQL |
| Queue | Redis |
| Logging | Pino |
| Testing | Vitest |

---

## Implementation Priority

### Phase 1 (Q2 2026)
1. f.pay - Payment processing
2. f.news - News aggregation
3. f.vault - Secure storage
4. f.scrape - Web scraping

### Phase 2 (Q3 2026)
5. f.crm - Customer management
6. f.hack - Security tools
7. f.finance - Financial analysis
8. f.crypto - Crypto tools

### Phase 3 (Q4 2026+)
9. f.mcp - MCP registry
10. f.assistant - Personal assistant
11. f.sports - Sports data
12. f.google - Google integration

---

## Contributing

To propose a new action:

1. Create issue in [aitlas-docs](https://github.com/Fuuurma/aitlas-docs/issues)
2. Use template: `New Action Proposal`
3. Include: Purpose, Features, Use Cases, MCP Tools

---

**Total Planned Actions:** 20+  
**Current:** 7  
**Roadmap:** 13+ new actions