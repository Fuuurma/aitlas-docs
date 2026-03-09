# Aitlas Actions - Future Roadmap

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Status:** Planning Phase  
**Last Updated:** 2026-03-08

---

## Overview

Actions are MCP-based tools that extend Aitlas capabilities. Each action is a standalone service that can be used by any AI agent.

**Naming Convention:** `f.{name}` (e.g., f.twyt, Nexus runtime, f.library)

---

## Current Actions (Implemented)

| Action | Purpose | Status |
|--------|---------|--------|
| Nexus runtime | Orchestration engine | ✅ Production |
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

### Tier 4: Extended Ecosystem (2027)

#### Communication & Messaging

| Action | Purpose | Priority |
|--------|---------|----------|
| f.email | Email automation (draft, send, schedule) | High |
| f.sms | SMS notifications & automation | Medium |
| f.slack | Slack workspace automation | High |
| f.discord | Discord bot & moderation | Medium |
| f.whatsapp | WhatsApp Business API | Medium |
| f.telegram | Telegram bot automation | Low |

#### Content & Media

| Action | Purpose | Priority |
|--------|---------|----------|
| f.video | Video processing, transcription, clips | High |
| f.image | Image generation, editing, optimization | High |
| f.audio | Audio transcription, generation, editing | High |
| f.slides | Presentation generation (PowerPoint, PDF) | Medium |
| f.docs | Document generation (Word, PDF) | Medium |
| f.pdf | PDF manipulation (merge, split, convert) | Medium |

#### Automation & Integration

| Action | Purpose | Priority |
|--------|---------|----------|
| f.automation | Workflow automation (Zapier-style) | High |
| f.webhook | Webhook management & routing | Medium |
| f.sync | Data synchronization across platforms | Medium |
| f.etl | ETL pipeline builder | Low |
| f.migrate | Data migration tools | Low |

#### Business & Operations

| Action | Purpose | Priority |
|--------|---------|----------|
| f.analytics | Analytics integration (GA, Mixpanel, etc.) | High |
| f.seo | SEO optimization & auditing | Medium |
| f.forms | Form handling & validation | Medium |
| f.survey | Survey creation & analysis | Low |
| f.feedback | Feedback collection & analysis | Medium |

#### Development & DevOps

| Action | Purpose | Priority |
|--------|---------|----------|
| f.monitor | Monitoring & alerting (Datadog-style) | High |
| f.logs | Log aggregation & search | Medium |
| f.backup | Automated backup management | Medium |
| f.feature | Feature flag management | Medium |
| f.abtest | A/B testing framework | Low |

#### Data & Intelligence

| Action | Purpose | Priority |
|--------|---------|----------|
| f.report | Automated report generation | High |
| f.dashboard | Dashboard builder | Medium |
| f.search | Advanced search (semantic, full-text) | High |
| f.qa | Q&A system builder | Medium |
| f.translate | Translation & localization | Medium |

#### Lifestyle & Personal

| Action | Purpose | Priority |
|--------|---------|----------|
| f.weather | Weather data & forecasts | Medium |
| f.maps | Maps, geocoding, routing | Medium |
| f.travel | Travel planning & booking | Low |
| f.food | Recipe search & meal planning | Low |
| f.fitness | Fitness tracking & workouts | Medium |
| f.habit | Habit tracking & formation | Medium |

#### Ecommerce & Sales

| Action | Purpose | Priority |
|--------|---------|----------|
| f.shopify | Shopify store automation | Medium |
| f.stripe | Stripe payment automation | High |
| f.inventory | Inventory management | Low |
| f.cart | Shopping cart integration | Low |

#### Social & Community

| Action | Purpose | Priority |
|--------|---------|----------|
| f.social | Multi-platform social media | High |
| f.community | Community management | Medium |
| f.forum | Forum/discussion automation | Low |
| f.wiki | Wiki/knowledge base builder | Medium |

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
---

## Extended Actions Catalog (70+ Actions Planned)

### Communication & Messaging (6 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.email** | Email automation (draft, send, schedule) | `draft_email`, `send_email`, `schedule_email`, `search_emails` |
| **f.sms** | SMS notifications & automation | `send_sms`, `schedule_sms`, `get_delivery_status` |
| **f.slack** | Slack workspace automation | `send_message`, `create_channel`, `search_messages`, `add_reaction` |
| **f.discord** | Discord bot & moderation | `send_message`, `create_channel`, `manage_roles`, `moderate` |
| **f.whatsapp** | WhatsApp Business API | `send_message`, `send_template`, `get_contacts` |
| **f.telegram** | Telegram bot automation | `send_message`, `create_group`, `manage_members` |

### Content & Media (6 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.video** | Video processing, transcription, clips | `transcribe`, `extract_clips`, `compress`, `add_subtitles` |
| **f.image** | Image generation, editing, optimization | `generate`, `resize`, `compress`, `convert`, `edit` |
| **f.audio** | Audio transcription, generation, editing | `transcribe`, `generate_speech`, `edit`, `convert` |
| **f.slides** | Presentation generation | `create_deck`, `add_slide`, `export_pdf`, `add_charts` |
| **f.docs** | Document generation | `create_doc`, `add_section`, `export_pdf`, `template` |
| **f.pdf** | PDF manipulation | `merge`, `split`, `convert`, `ocr`, `compress` |

### Automation & Integration (5 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.automation** | Workflow automation (Zapier-style) | `create_workflow`, `add_trigger`, `add_action`, `run` |
| **f.webhook** | Webhook management & routing | `create_endpoint`, `list_webhooks`, `get_logs` |
| **f.sync** | Data synchronization | `sync_data`, `resolve_conflicts`, `get_status` |
| **f.etl** | ETL pipeline builder | `create_pipeline`, `add_transform`, `run_job` |
| **f.migrate** | Data migration tools | `analyze_source`, `create_mapping`, `migrate` |

### Business & Operations (5 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.analytics** | Analytics integration | `track_event`, `get_report`, `create_dashboard` |
| **f.seo** | SEO optimization & auditing | `audit_site`, `analyze_keywords`, `get_rankings` |
| **f.forms** | Form handling & validation | `create_form`, `get_responses`, `validate` |
| **f.survey** | Survey creation & analysis | `create_survey`, `get_responses`, `analyze` |
| **f.feedback** | Feedback collection | `collect_feedback`, `analyze_sentiment`, `generate_report` |

### Development & DevOps (5 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.monitor** | Monitoring & alerting | `create_check`, `get_alerts`, `create_incident` |
| **f.logs** | Log aggregation & search | `ingest`, `search`, `create_alert`, `export` |
| **f.backup** | Backup management | `create_backup`, `restore`, `schedule`, `verify` |
| **f.feature** | Feature flags | `create_flag`, `toggle`, `get_status`, `rollout` |
| **f.abtest** | A/B testing | `create_experiment`, `assign_variant`, `get_results` |

### Data & Intelligence (5 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.report** | Report generation | `create_report`, `schedule`, `export`, `template` |
| **f.dashboard** | Dashboard builder | `create_dashboard`, `add_widget`, `share` |
| **f.search** | Advanced search | `semantic_search`, `fulltext_search`, `hybrid` |
| **f.qa** | Q&A system | `create_qa`, `answer_question`, `train` |
| **f.translate** | Translation & localization | `translate`, `detect_language`, `batch_translate` |

### Lifestyle & Personal (6 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.weather** | Weather data & forecasts | `current`, `forecast`, `alerts`, `historical` |
| **f.maps** | Maps, geocoding, routing | `geocode`, `reverse_geocode`, `route`, `search_places` |
| **f.travel** | Travel planning | `search_flights`, `search_hotels`, `create_itinerary` |
| **f.food** | Recipe & meal planning | `search_recipes`, `create_meal_plan`, `shopping_list` |
| **f.fitness** | Fitness tracking | `log_workout`, `get_stats`, `create_plan` |
| **f.habit** | Habit tracking | `track_habit`, `get_streak`, `analyze` |

### Ecommerce & Sales (4 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.shopify** | Shopify automation | `get_products`, `create_order`, `update_inventory` |
| **f.stripe** | Stripe payments | `create_customer`, `create_charge`, `get_balance` |
| **f.inventory** | Inventory management | `check_stock`, `reorder`, `get_forecast` |
| **f.cart** | Shopping cart | `create_cart`, `add_item`, `checkout` |

### Social & Community (4 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.social** | Multi-platform social media | `post`, `schedule`, `analytics`, `engage` |
| **f.community** | Community management | `manage_members`, `moderate`, `analytics` |
| **f.forum** | Forum automation | `create_thread`, `reply`, `moderate` |
| **f.wiki** | Wiki/knowledge base | `create_page`, `search`, `update` |

---

## Total Actions Summary

| Category | Count |
|----------|-------|
| Current (Production) | 7 |
| Tier 1 (Q2 2026) | 5 |
| Tier 2 (Q3 2026) | 5 |
| Tier 3 (Q4 2026) | 5 |
| Tier 4 (Extended) | 46 |
| **Total Planned** | **68** |

---

**Last Updated:** 2026-03-08

---

## Extended Actions Catalog (70+ Actions Planned)

### Communication & Messaging (6 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.email** | Email automation (draft, send, schedule) | `draft_email`, `send_email`, `schedule_email`, `search_emails` |
| **f.sms** | SMS notifications & automation | `send_sms`, `schedule_sms`, `get_delivery_status` |
| **f.slack** | Slack workspace automation | `send_message`, `create_channel`, `search_messages`, `add_reaction` |
| **f.discord** | Discord bot & moderation | `send_message`, `create_channel`, `manage_roles`, `moderate` |
| **f.whatsapp** | WhatsApp Business API | `send_message`, `send_template`, `get_contacts` |
| **f.telegram** | Telegram bot automation | `send_message`, `create_group`, `manage_members` |

### Content & Media (6 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.video** | Video processing, transcription, clips | `transcribe`, `extract_clips`, `compress`, `add_subtitles` |
| **f.image** | Image generation, editing, optimization | `generate`, `resize`, `compress`, `convert`, `edit` |
| **f.audio** | Audio transcription, generation, editing | `transcribe`, `generate_speech`, `edit`, `convert` |
| **f.slides** | Presentation generation | `create_deck`, `add_slide`, `export_pdf`, `add_charts` |
| **f.docs** | Document generation | `create_doc`, `add_section`, `export_pdf`, `template` |
| **f.pdf** | PDF manipulation | `merge`, `split`, `convert`, `ocr`, `compress` |

### Automation & Integration (5 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.automation** | Workflow automation (Zapier-style) | `create_workflow`, `add_trigger`, `add_action`, `run` |
| **f.webhook** | Webhook management & routing | `create_endpoint`, `list_webhooks`, `get_logs` |
| **f.sync** | Data synchronization | `sync_data`, `resolve_conflicts`, `get_status` |
| **f.etl** | ETL pipeline builder | `create_pipeline`, `add_transform`, `run_job` |
| **f.migrate** | Data migration tools | `analyze_source`, `create_mapping`, `migrate` |

### Business & Operations (5 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.analytics** | Analytics integration | `track_event`, `get_report`, `create_dashboard` |
| **f.seo** | SEO optimization & auditing | `audit_site`, `analyze_keywords`, `get_rankings` |
| **f.forms** | Form handling & validation | `create_form`, `get_responses`, `validate` |
| **f.survey** | Survey creation & analysis | `create_survey`, `get_responses`, `analyze` |
| **f.feedback** | Feedback collection | `collect_feedback`, `analyze_sentiment`, `generate_report` |

### Development & DevOps (5 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.monitor** | Monitoring & alerting | `create_check`, `get_alerts`, `create_incident` |
| **f.logs** | Log aggregation & search | `ingest`, `search`, `create_alert`, `export` |
| **f.backup** | Backup management | `create_backup`, `restore`, `schedule`, `verify` |
| **f.feature** | Feature flags | `create_flag`, `toggle`, `get_status`, `rollout` |
| **f.abtest** | A/B testing | `create_experiment`, `assign_variant`, `get_results` |

### Data & Intelligence (5 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.report** | Report generation | `create_report`, `schedule`, `export`, `template` |
| **f.dashboard** | Dashboard builder | `create_dashboard`, `add_widget`, `share` |
| **f.search** | Advanced search | `semantic_search`, `fulltext_search`, `hybrid` |
| **f.qa** | Q&A system | `create_qa`, `answer_question`, `train` |
| **f.translate** | Translation & localization | `translate`, `detect_language`, `batch_translate` |

### Lifestyle & Personal (6 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.weather** | Weather data & forecasts | `current`, `forecast`, `alerts`, `historical` |
| **f.maps** | Maps, geocoding, routing | `geocode`, `reverse_geocode`, `route`, `search_places` |
| **f.travel** | Travel planning | `search_flights`, `search_hotels`, `create_itinerary` |
| **f.food** | Recipe & meal planning | `search_recipes`, `create_meal_plan`, `shopping_list` |
| **f.fitness** | Fitness tracking | `log_workout`, `get_stats`, `create_plan` |
| **f.habit** | Habit tracking | `track_habit`, `get_streak`, `analyze` |

### Ecommerce & Sales (4 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.shopify** | Shopify automation | `get_products`, `create_order`, `update_inventory` |
| **f.stripe** | Stripe payments | `create_customer`, `create_charge`, `get_balance` |
| **f.inventory** | Inventory management | `check_stock`, `reorder`, `get_forecast` |
| **f.cart** | Shopping cart | `create_cart`, `add_item`, `checkout` |

### Social & Community (4 actions)

| Action | Purpose | Tools |
|--------|---------|-------|
| **f.social** | Multi-platform social media | `post`, `schedule`, `analytics`, `engage` |
| **f.community** | Community management | `manage_members`, `moderate`, `analytics` |
| **f.forum** | Forum automation | `create_thread`, `reply`, `moderate` |
| **f.wiki** | Wiki/knowledge base | `create_page`, `search`, `update` |

---

## Total Actions Summary

| Category | Count |
|----------|-------|
| Current (Production) | 7 |
| Tier 1 (Q2 2026) | 5 |
| Tier 2 (Q3 2026) | 5 |
| Tier 3 (Q4 2026) | 5 |
| Extended (2027) | 46 |
| **Total** | **68** |
