# Aitlas Agents Store — Technical Document
**Version:** 1.0 | **Date:** March 2026 | **Status:** CANONICAL  
**Owner:** Furma.tech | **Maintained by:** Herb (AI CTO)

> The Agents Store is the App Store for autonomous AI agents.  
> Curated. Monetized. Forkable. Every agent runs on Nexus.

---

## Table of Contents

1. [What the Agents Store Is](#1-what-the-agents-store-is)
2. [The Agent — Full Anatomy](#2-the-agent--full-anatomy)
3. [Agent Roles (Taxonomy)](#3-agent-roles-taxonomy)
4. [Agent Skills](#4-agent-skills)
5. [Tools, MCP & Actions](#5-tools-mcp--actions)
6. [Memory Architecture](#6-memory-architecture)
7. [Agent Spec — Full Schema](#7-agent-spec--full-schema)
8. [Agent Lifecycle](#8-agent-lifecycle)
9. [Marketplace Mechanics](#9-marketplace-mechanics)
10. [Curation & Review Process](#10-curation--review-process)
11. [Revenue Model](#11-revenue-model)
12. [Creator Program](#12-creator-program)
13. [App Architecture](#13-app-architecture)
14. [Database Schema](#14-database-schema)
15. [API Reference](#15-api-reference)
16. [Nova Integration](#16-nova-integration)
17. [Nexus Integration](#17-nexus-integration)
18. [Security & Trust](#18-security--trust)
19. [Infrastructure](#19-infrastructure)
20. [Roadmap](#20-roadmap)

---

## 1. What the Agents Store Is

### The Metaphor

The Agents Store is the App Store for autonomous AI agents.

| App Store concept | Agents Store equivalent |
|-------------------|------------------------|
| App | Agent |
| Developer | Agent creator |
| App category | Agent role (Researcher, Coder, Analyst...) |
| In-app purchases | Credits per task |
| Free app | Free agent (BYOK, no Nexus compute) |
| Premium app | Paid agent (subscription or credits) |
| App review | Agent curation review |
| App Store Connect | Creator dashboard |
| TestFlight | Agent sandbox mode |
| App ratings | Agent reviews + trust score |
| App fork | Agent remix |

### Core Philosophy

**Agents are products, not prompts.**

A prompt is a string. An agent is a complete, deployable, versioned, auditable unit of autonomous work. It has a role, skills, tools, memory configuration, execution constraints, pricing, and a trust score. It can be hired, forked, reviewed, and replayed.

### What Makes This Different From Other Agent Marketplaces

| Platform | Problem | Aitlas |
|----------|---------|--------|
| FlowGPT | Prompts, not agents | Full agent definitions |
| AgentGPT store | No real execution | Runs on Nexus (real OTP processes) |
| Hugging Face Spaces | Models, not agents | Curated, priced, ready to hire |
| OpenAI GPT Store | OpenAI-only, no tools | BYOK, any model, full MCP tool layer |
| LangChain Hub | Code templates | Declarative, no-code, forkable |

---

## 2. The Agent — Full Anatomy

An agent in Aitlas is a **declarative specification** that Nexus interprets and executes. The agent itself contains no executable code — it is a structured definition of intent, capabilities, and constraints.

```
┌─────────────────────────────────────────────────────────────────┐
│                         AGENT                                   │
│                                                                 │
│  identity     → name, role, persona, version, author           │
│  model        → provider, model, temperature, seed             │
│  skills       → what the agent knows how to do conceptually    │
│  tools        → MCP tools + Actions it can call                │
│  memory       → short-term, vector, episodic config            │
│  execution    → limits: iterations, tokens, runtime, credits   │
│  replay       → deterministic mode, seed                       │
│  pricing      → free | credits | subscription                  │
│  trust        → review score, run count, success rate          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                         Nexus runs it
                         (GenServer process)
```

### Agents Are Declarative

The agent spec tells Nexus *what* the agent is. Nexus figures out *how* to run it.

```yaml
# This is a complete, runnable agent
agent:
  name: rainmaker
  role: sales_researcher
  provider: openai:gpt-4o

skills:
  - web_research
  - lead_enrichment
  - outreach_drafting

actions:
  - f.rsrx
  - f.twyt

execution:
  max_iterations: 20
  credit_budget: 100
```

No Python. No LangChain. No `def run():`. Nexus reads this and spawns a GenServer that executes the full PLAN → ACT → REFLECT → PERSIST loop.

---

## 3. Agent Roles (Taxonomy)

Every agent has exactly one **primary role**. The role determines the agent's archetype, what tools are expected, how it's categorized in the store, and what trust signals matter.

### Role Registry

```
RESEARCHER
  → Finds, synthesizes, and reports on information
  → Core tools: f.rsrx, f.library, web_search
  → Output: reports, summaries, trend analyses
  → Example agents: Market Scout, Competitor Spy, Due Diligence Bot

CODER
  → Writes, reviews, refactors, and deploys code
  → Core tools: f.guard, execute_code, f.decloy, GitHub MCP
  → Output: code files, PRs, review comments, deployment reports
  → Example agents: Code Reviewer, Refactor Agent, Test Generator

ANALYST
  → Analyzes data, builds models, generates insights
  → Core tools: execute_code (Python/R), f.library, file_processor
  → Output: charts, datasets, statistical reports
  → Example agents: Financial Analyst, Metrics Watcher, Trend Detector

WRITER
  → Drafts, edits, and publishes content
  → Core tools: f.rsrx, f.twyt, web_search, f.library
  → Output: blog posts, emails, social copy, documentation
  → Example agents: Content Machine, Email Drafter, Doc Writer

OPERATOR
  → Automates workflows, manages tasks, coordinates systems
  → Core tools: Slack MCP, Notion MCP, Linear MCP, f.support
  → Output: tasks created, tickets resolved, workflows triggered
  → Example agents: Task Manager, Support Bot, Standup Agent

TRADER
  → Monitors markets, executes signals, tracks portfolios
  → Core tools: CoinGecko MCP, Yahoo Finance MCP, f.vault, f.pay
  → Output: alerts, trade signals, portfolio reports
  → Example agents: Crypto Watcher, DeFi Scout, Portfolio Tracker

GUARDIAN
  → Monitors, audits, and protects systems
  → Core tools: f.guard, f.hack, f.support, GitHub MCP
  → Output: security reports, vulnerability alerts, audit logs
  → Example agents: Security Monitor, Compliance Checker, Uptime Guard

ASSISTANT
  → General-purpose personal assistant
  → Core tools: f.rsrx, f.library, f.memory, calendar/email MCPs
  → Output: answers, summaries, scheduled actions, reminders
  → Example agents: Executive Assistant, Research Buddy, Scheduler

ADVISOR
  → Provides domain expertise and recommendations
  → Core tools: f.rsrx, f.library, f.vault
  → Output: recommendations, risk assessments, strategic plans
  → Example agents: Tax Ghost, Legal Reviewer, Health Coach
```

### Role Permissions

| Role | Can deploy code | Can send messages | Can write files | Can access external APIs |
|------|-----------------|-------------------|-----------------|--------------------------|
| RESEARCHER | ❌ | ❌ | ✅ (reports) | ✅ (read-only MCPs) |
| CODER | ✅ | ❌ | ✅ | ✅ |
| ANALYST | ✅ (sandboxed) | ❌ | ✅ | ✅ |
| WRITER | ❌ | ✅ (draft only) | ✅ | ✅ |
| OPERATOR | ❌ | ✅ | ✅ | ✅ |
| TRADER | ❌ | ✅ (alerts) | ✅ | ✅ |
| GUARDIAN | ✅ (read-only) | ✅ (alerts) | ✅ | ✅ |
| ASSISTANT | ❌ | ✅ | ✅ | ✅ |
| ADVISOR | ❌ | ❌ | ✅ | ✅ |

Permissions are enforced by Nexus via the tool allowlist at execution time.

---

## 4. Agent Skills

Skills are conceptual capabilities — they describe what the agent *knows how to do* in natural language terms and affect how Nexus builds the system prompt and assembles context.

Skills ≠ tools. A skill is an ability. A tool is an API call.

```
skill: web_research
→ Agent knows how to: formulate search queries, evaluate source quality,
  cross-reference claims, synthesize findings into structured reports

skill: lead_enrichment
→ Agent knows how to: find company/person info, verify LinkedIn,
  identify decision makers, score lead fit

skill: code_review
→ Agent knows how to: read diffs, identify bugs, suggest improvements,
  check for security issues, comment constructively

skill: data_analysis
→ Agent knows how to: clean datasets, run statistics, identify trends,
  visualize results, explain findings to non-technical audience
```

### Skill Registry

```
RESEARCH SKILLS
  web_research          — search, evaluate, synthesize from web
  academic_research     — papers, citations, peer-reviewed sources
  competitive_intel     — company/product/market analysis
  lead_enrichment       — B2B data research
  due_diligence         — investment/hire/vendor vetting

CODING SKILLS
  code_review           — PR review, bug finding, suggestions
  refactoring           — improve structure without behavior change
  test_generation       — unit/integration/e2e test writing
  documentation         — API docs, READMEs, inline comments
  debugging             — trace errors, reproduce, propose fix
  deployment            — CI/CD, infrastructure, release management

WRITING SKILLS
  long_form_writing     — essays, reports, white papers
  copywriting           — marketing, ads, landing pages
  technical_writing     — docs, specs, tutorials
  email_drafting        — cold outreach, follow-ups, newsletters
  social_content        — Twitter, LinkedIn, community posts

ANALYSIS SKILLS
  data_analysis         — clean, transform, analyze tabular data
  financial_modeling    — DCF, forecasting, scenario analysis
  market_analysis       — TAM, SAM, trends, segments
  statistical_analysis  — hypothesis testing, regression, clustering

OPERATIONS SKILLS
  project_management    — tasks, timelines, blockers
  workflow_automation   — trigger → action → notify
  customer_support      — classify, respond, escalate tickets
  scheduling            — calendar, availability, booking

DOMAIN SKILLS
  legal_review          — contract basics, risk flags (not legal advice)
  tax_research          — tax concepts, structures, scenarios (not advice)
  health_research       — medical info synthesis (not medical advice)
  crypto_analysis       — on-chain data, DeFi protocols, tokenomics
```

### How Skills Affect Execution

When Nexus builds the Context Builder prompt, it includes a skill-specific instruction block:

```elixir
defmodule Nexus.ContextBuilder.SkillPrompts do
  def for_skill("web_research") do
    """
    You are skilled at web research. When researching:
    - Always search multiple sources before forming conclusions
    - Prioritize primary sources over aggregators
    - Cross-reference claims across at least 3 sources
    - Note when information is recent vs potentially outdated
    - Synthesize findings in structured, scannable formats
    """
  end

  def for_skill("code_review") do
    """
    You are a skilled code reviewer. When reviewing:
    - Check for correctness, security, performance, and maintainability
    - Be specific: reference exact line numbers and file names
    - Prioritize issues by severity: CRITICAL > WARNING > SUGGESTION
    - Explain WHY something is an issue, not just that it is
    - Suggest concrete fixes, not vague guidance
    """
  end
  # ... one block per skill
end
```

---

## 5. Tools, MCP & Actions

This is the power layer. Tools are what agents *do* — every external action an agent takes goes through a tool call.

### Three Tool Categories

```
TOOLS
├── 1. Aitlas Actions (f.xyz)
│      Built by Furma. First-party. Highest quality.
│      Examples: f.rsrx, f.twyt, f.library, f.guard
│
├── 2. External MCPs
│      Third-party MCP servers. Verified by Furma or community.
│      Examples: GitHub MCP, Notion MCP, Slack MCP, Linear MCP
│
└── 3. Built-in Nexus Tools
       Native Nexus capabilities. No external calls.
       Examples: execute_code, read_file, write_file, memory_search
```

### Tool Allowlist (Security)

Every agent spec declares exactly which tools it is allowed to call. Nexus enforces this via `InjectionGuard`. No tool outside the allowlist can be called, regardless of what the LLM outputs.

```yaml
tool_allowlist:
  # Aitlas Actions
  - f.rsrx.web_search
  - f.rsrx.deep_research
  - f.rsrx.synthesize_report
  - f.twyt.search_twitter
  - f.library.search_knowledge_base
  # External MCPs
  - github.list_pull_requests
  - github.get_diff
  # Built-in
  - execute_code
  - memory_search
```

If an LLM tries to call `f.vault.read_document` and it's not in this list → `InjectionGuard` blocks it, logs `tool.injection_blocked`, the agent receives an error result and continues.

### Aitlas Actions Reference

Full tool catalog available to agents:

| Action | Tool | Credits | Description |
|--------|------|---------|-------------|
| f.rsrx | `web_search` | 2 | Live web search |
| f.rsrx | `deep_research` | 5 | Multi-source deep dive |
| f.rsrx | `synthesize_report` | 5 | Structured research report |
| f.rsrx | `monitor_topic` | 10/hr | Background topic monitoring |
| f.twyt | `search_twitter` | 1 | Twitter/X search |
| f.twyt | `get_user_timeline` | 1 | User timeline fetch |
| f.twyt | `search_mentions` | 1 | Mention tracking |
| f.twyt | `ingest_tweets` | 1 + 0.1/tweet | Index tweets to library |
| f.library | `ingest_document` | 2 | Add doc to vector store |
| f.library | `search_knowledge_base` | 1 | Semantic search |
| f.library | `retrieve_context` | 1 | Retrieve by ID |
| f.guard | `scan_pull_request` | 3 | AI code review |
| f.guard | `scan_repository` | 5 | Full repo audit |
| f.guard | `apply_fix` | 2 | Auto-fix suggestion |
| f.memory | `store_memory` | 0 | Save to vector memory |
| f.memory | `search_memory` | 1 | Semantic memory search |
| f.memory | `forget` | 0 | Delete memory entries |
| f.decloy | `deploy_agent` | 25 + 1/min | Deploy agent to cloud |
| f.vault | `store_document` | 1 | Encrypted document storage |
| f.vault | `retrieve_document` | 1 | Retrieve secure document |

### External MCP Registry (V1 Supported)

Third-party MCP servers that Furma has verified and maintains compatibility with:

| MCP Server | Category | Auth Type |
|------------|----------|-----------|
| GitHub | Code | OAuth / PAT |
| GitLab | Code | OAuth / PAT |
| Notion | Productivity | OAuth |
| Slack | Communication | OAuth |
| Linear | Project Management | API key |
| Jira | Project Management | API key |
| Airtable | Database | API key |
| CoinGecko | Finance | Free / API key |
| Yahoo Finance | Finance | Free |
| Google Calendar | Productivity | OAuth |
| Gmail | Communication | OAuth |
| Brave Search | Search | API key |
| Exa | Search | API key |

External MCPs are configured per-user via Nova settings. The MCP server URL + credentials are stored encrypted in `user_mcp_connections` table.

### Built-in Nexus Tools

These run inside Nexus — no external call, no MCP, no credits:

| Tool | Description |
|------|-------------|
| `execute_code` | Sandboxed Python/JS execution (OpenSandbox) |
| `read_file` | Read from user's uploaded files |
| `write_file` | Write output to a file (downloadable) |
| `memory_search` | Semantic search over agent's vector memory |
| `memory_store` | Save fact/context to vector memory |
| `task_complete` | Signal task completion with final output |
| `ask_user` | Pause execution and ask user a clarifying question |
| `web_fetch` | Fetch a specific URL (raw HTTP) |

---

## 6. Memory Architecture

Memory is what makes agents feel intelligent across sessions. An agent without memory starts fresh every run. An agent with memory builds context over time.

### Four Memory Types

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT MEMORY STACK                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. ACTIVE CONTEXT                                  │   │
│  │     In GenServer state. Current run only.           │   │
│  │     Messages, tool results, step history            │   │
│  │     TTL: task lifetime                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2. SHORT-TERM PERSISTENT                           │   │
│  │     Redis (Upstash). Survives GenServer restarts.   │   │
│  │     Last N messages, recent tool outputs            │   │
│  │     TTL: 24 hours                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  3. VECTOR MEMORY                                   │   │
│  │     pgvector (Neon). Permanent.                     │   │
│  │     User preferences, project context, knowledge   │   │
│  │     Semantic search via HNSW index                  │   │
│  │     TTL: per agent config (default: permanent)      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  4. EPISODIC MEMORY                                 │   │
│  │     Postgres. What the agent *did* historically.    │   │
│  │     Task outcomes, tools used, errors, successes    │   │
│  │     Retention: 90 days (V2: configurable)           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Memory Scopes

Memory can be scoped to different levels:

| Scope | What it means | Example |
|-------|---------------|---------|
| `agent_global` | Shared across all users who run this agent | Agent's accumulated web research |
| `user_agent` | Per user, per agent | User's preferences for this specific agent |
| `user_global` | Per user, across all agents | User's name, company, working style |
| `task` | Active task only | Current task's working notes |
| `session` | Current Nova session | Recent conversation history |

Agent creators configure which scopes their agent reads from and writes to.

### Memory Configuration in AgentSpec

```yaml
memory:
  short_term:
    enabled: true
    max_messages: 50

  vector:
    enabled: true
    read_scopes:
      - user_agent          # read user's preferences for this agent
      - user_global         # read user's global context
    write_scopes:
      - user_agent          # write new preferences here
    retention: permanent
    top_k: 10               # retrieve top 10 relevant memories per step

  episodic:
    enabled: true
    retention: 90d
    include_in_context: true    # inject past task outcomes into prompt
    max_episodes_in_context: 5  # last 5 completed tasks
```

### Memory Extraction

After every completed task, Nexus's `MemoryExtractor` worker runs and:
1. Scans the task steps for extractable facts
2. Generates embeddings via OpenAI (user's BYOK key)
3. Stores in `agent_memories` table with the appropriate scope
4. Links to the completed task for traceability

```elixir
defmodule Nexus.Workers.MemoryExtractor do
  use Oban.Worker, queue: :memory, max_attempts: 3

  def perform(%Oban.Job{args: %{"task_id" => task_id, "user_id" => user_id}}) do
    task = Tasks.get_with_steps!(task_id)
    agent = Agents.get!(task.agent_id)

    # Only extract if agent has vector memory enabled
    if agent.spec.memory.vector.enabled do
      facts = extract_facts(task)
      embed_and_store(facts, user_id, agent.id, task_id)
    end

    :ok
  end
end
```

---

## 7. Agent Spec — Full Schema

The canonical agent definition. This is what gets stored in the DB, served by the Agents Store API, and sent to Nexus for execution.

```elixir
# lib/agents_store/agents/agent_spec.ex

defmodule AgentsStore.Agents.AgentSpec do
  @moduledoc """
  The full, canonical agent specification.
  Validated on creation, versioned on update.
  Nexus reads this to spawn and configure the agent loop.
  """

  use Ecto.Schema
  import Ecto.Changeset

  embedded_schema do
    # ─── Identity ──────────────────────────────────────────
    field :name, :string               # machine name: "rainmaker"
    field :display_name, :string       # human name: "The Rainmaker"
    field :slug, :string               # URL: /agents/rainmaker
    field :version, :string            # semver: "1.2.0"
    field :description, :string        # short (140 chars max)
    field :long_description, :string   # markdown, shown on listing page
    field :avatar_url, :string
    field :cover_url, :string
    field :tags, {:array, :string}     # ["sales", "research", "b2b"]

    # ─── Role ──────────────────────────────────────────────
    field :role, :string               # see §3 Role Registry
    field :category, :string           # store category (may differ from role)

    # ─── Persona ───────────────────────────────────────────
    embeds_one :persona, Persona do
      field :system_prompt, :string    # core identity instructions
      field :tone, :string             # "professional" | "casual" | "technical"
      field :language, :string         # default: "en"
      field :examples, {:array, :map}  # few-shot examples [{user, assistant}]
      field :negative_examples, {:array, :map}  # what NOT to do
    end

    # ─── Model ─────────────────────────────────────────────
    embeds_one :model, ModelConfig do
      field :provider, :string         # "openai:gpt-4o" | "anthropic:claude-3-5-sonnet"
      field :temperature, :float       # 0.0–1.0 (default: 0.7)
      field :seed, :integer            # nil = non-deterministic
      field :max_tokens_per_call, :integer  # per LLM call limit
    end

    # ─── Skills ────────────────────────────────────────────
    field :skills, {:array, :string}   # see §4 Skill Registry

    # ─── Tools ─────────────────────────────────────────────
    embeds_one :tools, ToolConfig do
      field :actions, {:array, :string}       # ["f.rsrx", "f.twyt"]
      field :external_mcps, {:array, :string} # ["github", "slack"]
      field :builtin, {:array, :string}       # ["execute_code", "web_fetch"]
      field :tool_allowlist, {:array, :string} # exact tool names allowed
    end

    # ─── Memory ────────────────────────────────────────────
    embeds_one :memory, MemoryConfig do
      embeds_one :short_term, ShortTermConfig do
        field :enabled, :boolean, default: true
        field :max_messages, :integer, default: 50
      end

      embeds_one :vector, VectorConfig do
        field :enabled, :boolean, default: false
        field :read_scopes, {:array, :string}, default: ["user_agent"]
        field :write_scopes, {:array, :string}, default: ["user_agent"]
        field :retention, :string, default: "permanent"
        field :top_k, :integer, default: 10
      end

      embeds_one :episodic, EpisodicConfig do
        field :enabled, :boolean, default: true
        field :retention, :string, default: "90d"
        field :include_in_context, :boolean, default: true
        field :max_episodes_in_context, :integer, default: 5
      end
    end

    # ─── Execution ─────────────────────────────────────────
    embeds_one :execution, ExecutionConfig do
      field :max_iterations, :integer, default: 20
      field :max_tool_calls, :integer, default: 50
      field :max_tokens, :integer, default: 200_000
      field :timeout, :string, default: "30m"
      field :credit_budget, :integer, default: 100
      field :can_ask_user, :boolean, default: false  # pause + ask for clarification
      field :can_write_files, :boolean, default: false
    end

    # ─── Replay ────────────────────────────────────────────
    embeds_one :replay, ReplayConfig do
      field :enabled, :boolean, default: true
      field :deterministic, :boolean, default: false
      field :seed, :integer            # if deterministic
    end

    # ─── Scheduling ────────────────────────────────────────
    embeds_one :scheduling, SchedulingConfig do
      field :supports_scheduled, :boolean, default: false
      field :min_interval, :string     # "1h" = can't run more than once/hour
      field :cron_presets, {:array, :string}  # ["every_morning", "weekly_report"]
    end

    # ─── I/O ───────────────────────────────────────────────
    embeds_one :io, IOConfig do
      field :input_schema, :map        # JSON Schema for task goal input
      field :output_type, :string      # "report" | "code" | "data" | "decision" | "action"
      field :output_format, :string    # "markdown" | "json" | "file"
    end

    # ─── Pricing ───────────────────────────────────────────
    embeds_one :pricing, PricingConfig do
      field :model, :string            # "free" | "credits" | "subscription"
      field :base_credit_cost, :integer # credits charged per run (above tool costs)
      field :subscription_tier, :string # "pro" = requires Pro plan
      field :trial_runs, :integer      # free trial runs before requiring credits
    end

    # ─── Requirements ──────────────────────────────────────
    embeds_one :requirements, RequirementsConfig do
      field :required_api_keys, {:array, :string}  # ["openai", "anthropic"]
      field :required_mcp_connections, {:array, :string}  # ["github"]
      field :min_credit_balance, :integer          # 0 = no min
      field :requires_pro, :boolean, default: false
    end
  end
end
```

### Compact YAML Representation (shareable `.aitlas-agent` format)

```yaml
# rainmaker.aitlas-agent
aitlas: "1.0"

identity:
  name: rainmaker
  display_name: "The Rainmaker"
  version: "1.0.0"
  description: "B2B sales researcher. Finds leads, enriches data, drafts outreach."
  role: researcher
  tags: [sales, research, b2b, outreach]

persona:
  system_prompt: |
    You are The Rainmaker, a B2B sales research specialist.
    Your job is to find high-quality leads, enrich them with accurate company
    and contact data, and draft personalized outreach that converts.
    You are data-driven, precise, and never fabricate information.
    When you cannot verify a fact, you say so.
  tone: professional
  language: en

model:
  provider: openai:gpt-4o
  temperature: 0.3        # low: research needs precision

skills:
  - web_research
  - lead_enrichment
  - outreach_drafting
  - competitive_intel

tools:
  actions:
    - f.rsrx
    - f.twyt
    - f.library
  builtin:
    - web_fetch
    - memory_search
  tool_allowlist:
    - f.rsrx.web_search
    - f.rsrx.deep_research
    - f.rsrx.synthesize_report
    - f.twyt.search_twitter
    - f.library.search_knowledge_base
    - f.library.ingest_document
    - web_fetch
    - memory_search

memory:
  short_term:
    enabled: true
    max_messages: 50
  vector:
    enabled: true
    read_scopes: [user_agent, user_global]
    write_scopes: [user_agent]
    top_k: 8
  episodic:
    enabled: true
    retention: 90d
    include_in_context: true
    max_episodes_in_context: 3

execution:
  max_iterations: 25
  max_tool_calls: 60
  max_tokens: 150000
  timeout: 30m
  credit_budget: 80

io:
  output_type: report
  output_format: markdown

pricing:
  model: credits
  base_credit_cost: 5
  trial_runs: 2

requirements:
  required_api_keys: [openai]
  min_credit_balance: 20
```

---

## 8. Agent Lifecycle

### From Creation to Execution

```
CREATOR                  AGENTS STORE              NEXUS
   │                          │                       │
   │  1. Build agent spec     │                       │
   │  ─────────────────────►  │                       │
   │                          │                       │
   │  2. Validate + test run  │                       │
   │  ◄─────────────────────  │                       │
   │                          │                       │
   │  3. Submit for review    │                       │
   │  ─────────────────────►  │                       │
   │                          │  Curate / approve     │
   │                          │  ───────────────────► │
   │  4. Published ✓          │                       │
   │  ◄─────────────────────  │                       │
   │                          │                       │

USER                     AGENTS STORE              NEXUS
   │                          │                       │
   │  5. Browse store         │                       │
   │  ─────────────────────►  │                       │
   │                          │                       │
   │  6. "Hire" agent         │                       │
   │  ─────────────────────►  │                       │
   │                          │  Load spec + redirect │
   │  ◄─────────────────────  │                       │
   │                          │                       │
   │  7. Nova: enter task goal│                       │
   │  ─────────────────────────────────────────────►  │
   │                          │                       │  spawn GenServer
   │                          │                       │  run agent loop
   │  ◄─────────────────────────────────────────────  │
   │  8. Live progress stream │                       │
   │  (Phoenix Channel)       │                       │
```

### Agent Versioning

Every agent update is a new version. Old versions remain runnable (for replay and forks).

```
rainmaker@1.0.0 → rainmaker@1.1.0 → rainmaker@2.0.0
                                     ↑
                           breaking change = major bump
                           (new tool, changed output format)

Users who have pinned 1.1.0 continue to run 1.1.0.
New users get 2.0.0 by default.
Replay always uses the version at time of original run.
```

Version immutability rule: **once published, a version can never be modified**. Only deprecated. This is what makes replay deterministic.

### Agent States

```
DRAFT        → being built by creator
REVIEW       → submitted, under Furma curation
CHANGES_REQUESTED → reviewer asked for modifications
REJECTED     → did not pass curation
PUBLISHED    → live in store, discoverable
UNLISTED     → not discoverable but runnable via direct link
DEPRECATED   → superseded by newer version, still runnable
REMOVED      → permanently removed (policy violation)
```

---

## 9. Marketplace Mechanics

### Browsing (Public, No Auth)

The store is fully browsable without an account. Everything visible except "Hire" button (requires login) and usage stats (requires login).

```
Browse paths:
  /store                      → Featured + trending
  /store/researchers          → Role: RESEARCHER
  /store/coders               → Role: CODER
  /store/tags/b2b             → Tag: b2b
  /store/search?q=linkedin    → Full-text search
  /store/agents/rainmaker     → Agent detail page
  /store/creators/furma       → Creator profile
```

### Agent Detail Page

Each listing includes:

```
┌─────────────────────────────────────────────────────────────┐
│  [Avatar]  The Rainmaker                      [ Hire Agent ] │
│            by Furma.tech ✓ Verified                         │
│            ★★★★½  (247 reviews) · 1,204 runs                │
│                                                             │
│  B2B sales researcher. Finds leads, enriches data,         │
│  drafts personalized outreach that converts.               │
│                                                             │
│  Role: Researcher  |  Tags: sales, b2b, outreach           │
│  Credits: ~5–80 per run  |  Avg runtime: 12 min            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Overview   │  │    Tools     │  │   Examples   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  TOOLS USED                                                 │
│  f.rsrx (deep research) · f.twyt (twitter) · f.library    │
│                                                             │
│  SKILLS                                                     │
│  web_research · lead_enrichment · outreach_drafting        │
│                                                             │
│  REQUIREMENTS                                               │
│  ✓ OpenAI API key  ✓ 20+ credits  ✗ No integrations needed │
│                                                             │
│  EXAMPLE RUNS (public, shared by users)                     │
│  "Find SaaS CTOs in Berlin" → 47 leads, report in 14 min  │
│  "Research Y Combinator W26 companies" → Full breakdown    │
│                                                             │
│  REVIEWS                                                    │
│  "Saved me 6 hours of LinkedIn research" — @techfounder    │
└─────────────────────────────────────────────────────────────┘
```

### Discovery Algorithms

**Featured** — Furma-curated. Top of homepage. Updated weekly.

**Trending** — Score computed every hour:
```
trending_score = (runs_7d × 0.4) + (rating × 0.3) + (success_rate × 0.2) + (new_agent_boost × 0.1)
```

**Recommended** — Personalized per user (v2). V1: tag overlap + role match based on past runs.

**Search** — Full-text search over: name, description, tags, skills, creator name. Postgres `tsvector` + GIN index.

### "Hire" Flow

```
User on /store/agents/rainmaker
        │
        ▼
Click [ Hire Agent ]
        │
        ├── Not logged in?
        │   → Redirect to /sign-up?callbackUrl=/store/agents/rainmaker
        │
        └── Logged in?
            → Check requirements:
              ✓ Has OpenAI API key?
              ✓ Has 20+ credits?
              ✓ Pro plan (if required)?
                    │
                    ├── All met → Redirect to nova.aitlas.xyz/hire/rainmaker
                    │
                    └── Missing requirements?
                        → Show "Setup needed" modal
                        → Deep links to Nova settings to add key/credits
```

### Fork & Remix

Any published agent can be forked:

```
/store/agents/rainmaker → [ Fork Agent ]
        │
        ▼
Creates rainmaker-fork in user's drafts
All fields editable
User publishes as their own version
Original author attributed: "Forked from The Rainmaker by Furma.tech"
```

Fork lineage is tracked. If user publishes their fork and it earns revenue, the original author gets no cut (forks are fully independent). But attribution stays forever.

### Shareable Run Links

After a task completes:

```
Task Run #9842 → [ Share Run ] → aitlas.xyz/runs/9842/public
```

On the public run page:
- Full step-by-step trace (if owner made it public)
- Agent that was used, with link to store listing
- "Run this agent" CTA with the exact same goal pre-filled
- "Fork this run" for developers

This is a **viral distribution loop**: good agent runs get shared, drive store traffic, drive agent hirings.

---

## 10. Curation & Review Process

The Agents Store is curated. Not everything gets in. This is the App Store model — quality control is the moat.

### Why Curation Matters

- Users trust curated agents with their API keys and data
- Bad agents can burn credits, produce garbage outputs, or exfiltrate data
- Quality floor creates a premium positioning vs "prompt dumping" competitors

### Review Tiers

**Tier 1: Automated** (instant)
- Schema validation (required fields, valid values)
- Tool allowlist check (all listed tools must exist)
- Prompt safety scan (no jailbreak patterns, no data exfiltration instructions)
- Credit cost sanity check (budget not exceeding 10,000 credits)
- Test run in sandbox mode (must complete without error)

**Tier 2: Human Curation** (24–72h for V1)
- Quality of system prompt (clear, specific, professional)
- Skill/tool coherence (skills match tools, tools match role)
- Output quality test (human runs the agent, evaluates output)
- Documentation completeness (description, examples, requirements)
- Pricing fairness (base cost reasonable vs task complexity)

**Tier 3: Verified Creator** (Furma-built agents only, V1)
- Full internal review
- Performance benchmarking
- "Verified by Furma" badge
- Featured placement

### Review Checklist (Human Reviewer)

```
IDENTITY
  [ ] Name is unique, non-misleading
  [ ] Description is accurate and specific (not vague)
  [ ] Tags are relevant and not spam
  [ ] Avatar/cover appropriate

TECHNICAL
  [ ] System prompt is complete and coherent
  [ ] Skills match what the agent actually does
  [ ] Tool allowlist is minimal (principle of least privilege)
  [ ] Memory config is appropriate for the use case
  [ ] Execution limits are reasonable
  [ ] Requirements are accurate (doesn't claim to need less than it does)

QUALITY
  [ ] Test run with a representative goal
  [ ] Output is useful and well-formatted
  [ ] Agent doesn't loop, doesn't get stuck
  [ ] Credit cost is proportional to work done

SAFETY
  [ ] System prompt doesn't instruct data exfiltration
  [ ] System prompt doesn't attempt to bypass tool allowlist
  [ ] No instructions to ignore Nexus safeguards
  [ ] No collection of user data beyond task scope

PRICING
  [ ] Base cost is reasonable (benchmark against similar agents)
  [ ] Trial runs offered for paid agents
```

### Rejection Reasons (common)

| Reason | Detail |
|--------|--------|
| `low_quality_prompt` | System prompt too vague, generic, or unprofessional |
| `tool_mismatch` | Claims skills it doesn't have tools for |
| `overpriced` | Credit cost wildly disproportionate to task |
| `test_run_failed` | Agent errored, looped, or produced garbage in test |
| `safety_violation` | Prompt contains injection or exfiltration instructions |
| `duplicate` | Too similar to existing published agent |
| `missing_requirements` | Doesn't declare all required API keys/connections |

### Appeals

Rejected creators can appeal once with a revised submission. Appeals reviewed within 48h.

---

## 11. Revenue Model

### Revenue Streams

```
AGENTS STORE REVENUE
├── 1. Premium Agent Subscriptions (B2C)
│      User pays monthly for access to a premium agent
│      Furma takes 30%, creator gets 70%
│
├── 2. Credit Pass-through (B2C)
│      Every agent run consumes credits (Nexus compute + tools)
│      Furma earns 100% of credit revenue
│      Creator earns nothing from credits (only from subscription)
│
├── 3. Creator Pro Plan (B2B)
│      Creators pay for enhanced publishing tools
│      Batch publishing, analytics dashboard, priority review
│      $49/mo (V2)
│
└── 4. Featured Placement (B2B) — V2
       Creators pay to appear in Featured sections
       Similar to App Store Search Ads
```

### Pricing Models Per Agent

| Model | How it works | Creator earns | Furma earns |
|-------|-------------|---------------|-------------|
| `free` | Free to run. User pays credits for Nexus + tools | 0% | 100% of credits |
| `credits` | Base cost per run + Nexus + tool credits | 0% | 100% of credits |
| `subscription` | Monthly fee for unlimited runs | 70% of sub fee | 30% of sub fee + 100% of credits |
| `freemium` | N free runs, then credits/subscription | depends | depends |

### Credit Economics (Who Gets What)

A typical paid agent run of 80 credits:

```
User spends: 80 credits ($0.80)
─────────────────────────────
Nexus orchestration:     1 credit  → Furma
Nexus compute (15 min): 0.5 credits → Furma
Tool calls (f.rsrx ×3): 15 credits → Furma (Action revenue)
Tool calls (f.twyt ×2):  2 credits → Furma (Action revenue)
Agent base cost:         5 credits → Furma (if free agent)
                               OR
                                  → split 70/30 (if subscription agent)
Remaining:              56.5 credits → Furma
```

The creator of a **free** agent earns $0 per run in V1. Their incentive is:
- Reputation and visibility in the store
- Driving users to their own SaaS/services
- Data about what users want from the agent

The creator of a **subscription** agent earns 70% of the subscription fee.

### Subscription Agent Revenue Share

```
Agent: "The Rainmaker Pro"
Price: $9.99/mo per user

Revenue split:
  Creator: $6.99/mo per subscriber
  Furma:   $3.00/mo per subscriber

100 subscribers:
  Creator: $699/mo
  Furma:   $300/mo (+ credits from all runs)
```

### Credit Pricing Reference

| Credit pack | Price | Per credit |
|-------------|-------|-----------|
| 100 credits | $1 | $0.01 |
| 1,000 credits | $8 | $0.008 (20% off) |
| Pro plan: 500 credits/mo | included in $20/mo | — |

### Annual Revenue Projections (Internal)

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|
| Active users | 500 | 2,000 | 10,000 |
| Avg credits/user/mo | 200 | 300 | 500 |
| Credit revenue | $1,000 | $6,000 | $50,000 |
| Pro subscribers | 50 | 300 | 2,000 |
| Pro revenue | $1,000 | $6,000 | $40,000 |
| Total MRR | $2,000 | $12,000 | $90,000 |

---

## 12. Creator Program

### Creator Tiers

**Community Creator** (default)
- Publish agents
- Basic analytics (run count, rating)
- Standard 70/30 split
- 3 active agents max (V1)

**Verified Creator** (application required, V1: Furma employees only)
- "Verified" badge on all agents
- Featured placement eligibility
- Unlimited active agents
- Advanced analytics
- Priority review (24h)
- Direct Slack channel with Furma

**Partner Creator** (V2)
- Revenue share negotiable
- Co-marketing
- Early access to new Actions/MCPs
- Custom subdomain: `rainmaker.aitlas.xyz`

### Creator Dashboard

Accessible at `agents.aitlas.xyz/creator` (requires login):

```
CREATOR DASHBOARD
─────────────────

📦 My Agents (3 published, 1 draft)

Agent            Status      Runs    Rating    Revenue
──────────────────────────────────────────────────────
The Rainmaker    Published   1,204   ★4.8      $124.30
Code Reviewer    Published   892     ★4.6      $0 (free)
Tax Ghost        Draft       —       —         —
───────────────────────────────────────────────────────
                                     Total:    $124.30

📊 Analytics (last 30 days)
  Total runs: 847
  Avg completion rate: 91%
  Avg credits per run: 62
  Most common failure: timeout (6%)

💰 Payouts
  Balance: $124.30
  Next payout: April 1, 2026
  Payout method: [Add Bank Account]
```

### Creator Payout

- Payouts monthly (1st of each month)
- Minimum $25 to trigger payout
- Stripe Connect for payouts
- Platform fee already deducted from balance shown
- Tax forms (1099 for US creators) generated automatically

---

## 13. App Architecture

### Overview

```
agents.aitlas.xyz           →  Next.js (Vercel)
api.agents.aitlas.xyz       →  Elixir/Phoenix (Hetzner)
```

Frontend and backend are separate deployments from the same `aitlas-agents` repo (monorepo with `/web` and `/server` directories), both using their respective templates.

```
aitlas-agents/
├── web/          ← Next.js (from aitlas-ui-template)
│   ├── app/
│   │   ├── (store)/          ← public store pages
│   │   ├── (creator)/        ← creator dashboard (auth required)
│   │   ├── (auth)/           ← sign in / sign up
│   │   └── api/
│   │       ├── auth/
│   │       └── health/
│   └── ...
│
└── server/       ← Elixir/Phoenix (from aitlas-elixir-template)
    ├── lib/
    │   ├── agents_store/
    │   │   ├── agents/           ← Agent CRUD, versioning
    │   │   ├── listings/         ← Store discovery, search, ranking
    │   │   ├── reviews/          ← Ratings and reviews
    │   │   ├── creators/         ← Creator profiles, tiers
    │   │   ├── subscriptions/    ← Agent subscriptions
    │   │   ├── curation/         ← Review queue and workflow
    │   │   └── analytics/        ← Run metrics, earnings
    │   └── agents_store_web/
    │       ├── controllers/
    │       │   ├── agents_controller.ex
    │       │   ├── store_controller.ex
    │       │   ├── creator_controller.ex
    │       │   ├── reviews_controller.ex
    │       │   └── mcp_controller.ex
    │       └── plugs/
    └── ...
```

### Frontend Pages

```
PUBLIC (no auth)
  /store                           → Homepage: featured, trending, categories
  /store/[role]                    → Role category page
  /store/tags/[tag]                → Tag filtered listing
  /store/search                    → Search results
  /store/agents/[slug]             → Agent detail page
  /store/creators/[username]       → Creator profile
  /runs/[id]/public                → Public shared run page

AUTH REQUIRED
  /hire/[slug]                     → Hire flow (checks requirements)
  /my-agents                       → User's hired agents + history

CREATOR (auth + creator role)
  /creator                         → Creator dashboard
  /creator/agents/new              → New agent wizard
  /creator/agents/[id]/edit        → Edit agent
  /creator/agents/[id]/analytics   → Agent analytics
  /creator/payouts                 → Payout history + settings
  /creator/reviews                 → Review queue status
```

### API Routes (Elixir Backend)

```
PUBLIC
  GET  /api/store/featured            → featured agents
  GET  /api/store/trending            → trending agents
  GET  /api/store/search?q=           → search
  GET  /api/agents/:slug              → agent detail
  GET  /api/agents/:slug/versions     → version history
  GET  /api/creators/:username        → creator profile

AUTHENTICATED (user session)
  GET  /api/agents/:slug/requirements-check  → check if user can hire
  POST /api/agents/:slug/hire                → initiate hire (redirects to Nova)
  GET  /api/my/agents                        → user's agent subscriptions
  POST /api/reviews                          → submit review
  GET  /api/runs/:id/public                  → public run page data

CREATOR (creator role required)
  POST /api/creator/agents               → create new agent
  PUT  /api/creator/agents/:id           → update (creates new version)
  POST /api/creator/agents/:id/submit    → submit for review
  POST /api/creator/agents/:id/unpublish → unpublish
  GET  /api/creator/analytics/:id        → agent metrics
  GET  /api/creator/earnings             → earnings report

INTERNAL (Nexus → Agents Store)
  GET  /internal/agents/:slug/spec       → full agent spec for execution
  GET  /internal/agents/:slug/spec/:ver  → versioned spec
  POST /internal/agents/:slug/run-event  → record a run event

CURATION (admin only)
  GET  /api/admin/review-queue           → pending reviews
  POST /api/admin/review/:id/approve     → approve
  POST /api/admin/review/:id/reject      → reject with reason
  POST /api/admin/review/:id/changes     → request changes
```

### Backend Module Structure

```elixir
# lib/agents_store/agents/agent.ex
defmodule AgentsStore.Agents.Agent do
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  schema "agents" do
    field :slug, :string
    field :name, :string
    field :display_name, :string
    field :description, :string
    field :long_description, :string
    field :current_version, :string
    field :status, :string          # draft | review | published | deprecated | removed
    field :role, :string
    field :category, :string
    field :tags, {:array, :string}
    field :avatar_url, :string
    field :cover_url, :string
    field :is_verified, :boolean, default: false
    field :is_featured, :boolean, default: false
    field :run_count, :integer, default: 0
    field :avg_rating, :float
    field :review_count, :integer, default: 0
    field :success_rate, :float

    belongs_to :creator, AgentsStore.Creators.Creator
    has_many :versions, AgentsStore.Agents.AgentVersion
    has_many :reviews, AgentsStore.Reviews.Review
    has_many :subscriptions, AgentsStore.Subscriptions.Subscription

    timestamps()
  end
end
```

---

## 14. Database Schema

### Tables

```sql
-- ─── Creators ───────────────────────────────────────────────
CREATE TABLE creators (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  bio           TEXT,
  avatar_url    TEXT,
  website_url   TEXT,
  tier          TEXT NOT NULL DEFAULT 'community',  -- community | verified | partner
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_account_id TEXT,                           -- for payouts
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_creators_user_id ON creators(user_id);


-- ─── Agents ─────────────────────────────────────────────────
CREATE TABLE agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  description     TEXT NOT NULL,
  long_description TEXT,
  current_version TEXT NOT NULL DEFAULT '1.0.0',
  status          TEXT NOT NULL DEFAULT 'draft',
  role            TEXT NOT NULL,
  category        TEXT NOT NULL,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  avatar_url      TEXT,
  cover_url       TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  featured_order  INTEGER,
  run_count       INTEGER NOT NULL DEFAULT 0,
  avg_rating      DECIMAL(3,2),
  review_count    INTEGER NOT NULL DEFAULT 0,
  success_rate    DECIMAL(5,4),              -- 0.0000–1.0000
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_role ON agents(role);
CREATE INDEX idx_agents_creator ON agents(creator_id);
CREATE INDEX idx_agents_featured ON agents(is_featured, featured_order) WHERE is_featured = TRUE;
CREATE INDEX idx_agents_tags ON agents USING gin(tags);
CREATE INDEX idx_agents_search ON agents USING gin(search_vector);


-- ─── Agent Versions ─────────────────────────────────────────
CREATE TABLE agent_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version     TEXT NOT NULL,
  spec        JSONB NOT NULL,              -- full AgentSpec stored as JSON
  changelog   TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_agent_versions_unique ON agent_versions(agent_id, version);
CREATE INDEX idx_agent_versions_agent ON agent_versions(agent_id, created_at DESC);


-- ─── Curation Reviews ───────────────────────────────────────
CREATE TABLE curation_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID NOT NULL REFERENCES agents(id),
  version_id      UUID NOT NULL REFERENCES agent_versions(id),
  reviewer_id     TEXT REFERENCES users(id),       -- null = automated
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | changes_requested
  tier            TEXT NOT NULL DEFAULT 'automated',-- automated | human | verified
  automated_checks JSONB,                          -- results of automated validation
  notes           TEXT,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_curation_status ON curation_reviews(status, created_at);


-- ─── Reviews (User → Agent) ─────────────────────────────────
CREATE TABLE agent_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES agents(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  run_id      TEXT,                                -- link to the specific run
  is_verified_run BOOLEAN NOT NULL DEFAULT FALSE,  -- ran the agent ≥ once
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_reviews_unique ON agent_reviews(agent_id, user_id);
CREATE INDEX idx_reviews_agent ON agent_reviews(agent_id, created_at DESC);


-- ─── Agent Subscriptions ────────────────────────────────────
CREATE TABLE agent_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id),
  agent_id        UUID NOT NULL REFERENCES agents(id),
  stripe_sub_id   TEXT UNIQUE,
  status          TEXT NOT NULL DEFAULT 'active', -- active | cancelled | past_due
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  price_cents     INTEGER NOT NULL,               -- at time of subscription
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at    TIMESTAMPTZ
);

CREATE INDEX idx_subs_user ON agent_subscriptions(user_id);
CREATE INDEX idx_subs_agent ON agent_subscriptions(agent_id);
CREATE UNIQUE INDEX idx_subs_active ON agent_subscriptions(user_id, agent_id) WHERE status = 'active';


-- ─── Agent Run Events (from Nexus) ──────────────────────────
CREATE TABLE agent_run_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES agents(id),
  task_id     TEXT NOT NULL,                      -- Nexus task ID
  user_id     TEXT NOT NULL REFERENCES users(id),
  version     TEXT NOT NULL,
  status      TEXT NOT NULL,   -- completed | failed | stuck | timeout
  credits_used INTEGER,
  duration_ms  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_run_events_agent ON agent_run_events(agent_id, created_at DESC);
CREATE INDEX idx_run_events_user ON agent_run_events(user_id, created_at DESC);


-- ─── Creator Earnings ───────────────────────────────────────
CREATE TABLE creator_earnings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES creators(id),
  agent_id        UUID REFERENCES agents(id),
  source          TEXT NOT NULL,           -- subscription | payout
  gross_amount    DECIMAL(10,2) NOT NULL,
  platform_fee    DECIMAL(10,2) NOT NULL,
  net_amount      DECIMAL(10,2) NOT NULL,
  stripe_event_id TEXT UNIQUE,
  payout_id       UUID REFERENCES creator_payouts(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_earnings_creator ON creator_earnings(creator_id, created_at DESC);


-- ─── Creator Payouts ────────────────────────────────────────
CREATE TABLE creator_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES creators(id),
  amount          DECIMAL(10,2) NOT NULL,
  stripe_payout_id TEXT UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ
);
```

---

## 15. API Reference

### GET /api/store/featured

Returns featured agents.

```json
Response 200:
{
  "agents": [
    {
      "id": "uuid",
      "slug": "rainmaker",
      "display_name": "The Rainmaker",
      "description": "B2B sales researcher...",
      "role": "researcher",
      "tags": ["sales", "b2b"],
      "avatar_url": "https://...",
      "avg_rating": 4.8,
      "run_count": 1204,
      "pricing": {
        "model": "credits",
        "base_credit_cost": 5,
        "trial_runs": 2
      },
      "creator": {
        "username": "furma",
        "display_name": "Furma.tech",
        "is_verified": true
      }
    }
  ]
}
```

### GET /api/agents/:slug

Returns full agent detail.

```json
Response 200:
{
  "agent": {
    "id": "uuid",
    "slug": "rainmaker",
    "display_name": "The Rainmaker",
    "description": "...",
    "long_description": "...markdown...",
    "version": "1.2.0",
    "role": "researcher",
    "tags": ["sales", "b2b", "outreach"],
    "skills": ["web_research", "lead_enrichment"],
    "tools": {
      "actions": ["f.rsrx", "f.twyt"],
      "external_mcps": [],
      "builtin": ["web_fetch", "memory_search"]
    },
    "memory": {
      "vector": { "enabled": true },
      "episodic": { "enabled": true }
    },
    "execution": {
      "max_iterations": 25,
      "credit_budget": 80,
      "timeout": "30m"
    },
    "pricing": {
      "model": "credits",
      "base_credit_cost": 5,
      "trial_runs": 2
    },
    "requirements": {
      "required_api_keys": ["openai"],
      "min_credit_balance": 20
    },
    "stats": {
      "run_count": 1204,
      "avg_rating": 4.8,
      "review_count": 247,
      "success_rate": 0.91,
      "avg_duration_ms": 720000,
      "avg_credits_per_run": 62
    },
    "creator": {
      "username": "furma",
      "is_verified": true
    }
  }
}
```

### POST /api/creator/agents

Create a new agent (creator auth required).

```json
Request:
{
  "spec": {
    "name": "code-reviewer",
    "display_name": "Code Reviewer",
    "description": "...",
    "role": "coder",
    "skills": ["code_review"],
    "tools": { ... },
    "memory": { ... },
    "execution": { ... },
    "pricing": { "model": "free" }
  }
}

Response 201:
{
  "agent": {
    "id": "uuid",
    "slug": "code-reviewer",
    "status": "draft"
  }
}
```

### GET /internal/agents/:slug/spec (Nexus only)

Returns the full executable spec for Nexus. Requires `X-Furma-Internal` header.

```json
Response 200:
{
  "spec": {
    "name": "rainmaker",
    "version": "1.2.0",
    "persona": {
      "system_prompt": "You are The Rainmaker...",
      "tone": "professional"
    },
    "model": {
      "provider": "openai:gpt-4o",
      "temperature": 0.3
    },
    "skills": ["web_research", "lead_enrichment"],
    "tools": {
      "tool_allowlist": [
        "f.rsrx.web_search",
        "f.rsrx.synthesize_report",
        "f.twyt.search_twitter",
        "web_fetch",
        "memory_search"
      ]
    },
    "memory": { ... },
    "execution": {
      "max_iterations": 25,
      "max_tool_calls": 60,
      "max_tokens": 150000,
      "timeout": "30m",
      "credit_budget": 80
    },
    "replay": {
      "enabled": true
    }
  }
}
```

---

## 16. Nova Integration

When a user hires an agent from the store, the flow continues in Nova.

### Hire Handoff

```
Agents Store: POST /api/agents/:slug/hire
      │
      ▼
Agents Store generates a signed token:
{
  "agent_slug": "rainmaker",
  "agent_version": "1.2.0",
  "user_id": "user_abc",
  "trial_run": true,
  "exp": <5 min from now>
}

Response:
{
  "redirect_url": "https://nova.aitlas.xyz/hire/rainmaker?token=<signed>"
}

Nova receives token, validates signature, pre-fills:
  - Agent: The Rainmaker
  - Model: (user's OpenAI key, or let user choose)
  - Goal input: empty, ready for user
```

### Nova Agent Task Panel

When a user runs a hired agent, Nova's Task Monitor shows agent-specific context:

```
Running: The Rainmaker
Goal: "Find SaaS CTOs in Berlin"
──────────────────────────────────
● Step 1  PLAN     Deciding search strategy...
● Step 2  ACTION   f.rsrx.web_search — "Berlin SaaS CTO LinkedIn"
● Step 3  REFLECT  "Found 23 results, need to filter by funding"
● Step 4  ACTION   f.rsrx.deep_research
● Step 5  REFLECT  "47 leads found, generating report"
● Step 6  ACTION   f.rsrx.synthesize_report
● Step 7  FINAL    Report ready

[ ▶ Replay ]  [ ⑂ Fork ]  [ ↓ Download Report ]  [ ★ Rate Agent ]
```

"Rate Agent" appears after completion and links directly to the agent's store listing review form.

---

## 17. Nexus Integration

Nexus calls the Agents Store to load agent specs at task dispatch time.

### Spec Loading

```elixir
defmodule Nexus.AgentLoader do
  def load(agent_slug, version \\ :latest) do
    url = case version do
      :latest -> "/internal/agents/#{agent_slug}/spec"
      ver     -> "/internal/agents/#{agent_slug}/spec/#{ver}"
    end

    case AgentsStoreClient.get(url) do
      {:ok, %{"spec" => spec}} ->
        {:ok, AgentSpec.parse!(spec)}

      {:error, reason} ->
        {:error, {:agent_not_found, reason}}
    end
  end
end
```

Specs are cached in Nexus ETS for 5 minutes — reduces round-trips for popular agents.

### Run Event Reporting

After every task completion, Nexus reports back to Agents Store:

```elixir
defmodule Nexus.Workers.RunEventReporter do
  use Oban.Worker, queue: :default

  def perform(%Oban.Job{args: %{"task_id" => task_id}}) do
    task = Tasks.get!(task_id)

    AgentsStoreClient.post("/internal/agents/#{task.agent_slug}/run-event", %{
      task_id: task_id,
      user_id: task.user_id,
      version: task.agent_version,
      status: task.status,
      credits_used: task.credits_used,
      duration_ms: task.duration_ms
    })

    :ok
  end
end
```

This data populates:
- `run_count` on the agent listing
- `success_rate` (success / total)
- `avg_duration_ms` and `avg_credits_per_run`
- Creator's analytics dashboard
- Creator's earnings (for subscription agents)

---

## 18. Security & Trust

### Agent Safety Model

Every agent is a potential attack surface. Mitigations:

**At spec submission time:**
- Automated prompt safety scan (regex + LLM classification)
- Tool allowlist validation (all listed tools must exist in registry)
- Schema validation (no unknown fields, all required fields present)

**At execution time:**
- `InjectionGuard` blocks every tool call not in allowlist
- `InjectionGuard` scans tool arguments for injection patterns
- Nexus never executes agent code — only the declarative spec
- Credit budget enforced at GenServer level — process terminates if exceeded

**At storage time:**
- Agent specs stored as JSONB — no eval, no code execution from spec
- Creator cannot access other creators' drafts or analytics
- Reviewer notes visible to creator only after review resolves

**Trust Score**

Displayed on every listing:

```
Trust Score: ●●●●○ (4/5)

Breakdown:
  ✓ Curated and approved by Furma
  ✓ 1,204 successful runs
  ✓ 91% task completion rate
  ✓ Verified creator
  ✗ No shared public runs yet
```

Score components: curation tier (40%), run count (20%), success rate (20%), creator tier (10%), public runs (10%).

### Privacy

- Agent specs are public once published
- Run contents are private to the user by default
- User can opt-in to share run publicly per run
- Creator never sees individual user run contents
- Creator sees only aggregated: run count, completion rate, avg credits, rating distribution

---

## 19. Infrastructure

| Service | Host | Stack |
|---------|------|-------|
| Agents Store FE | Vercel | Next.js 16, edge CDN |
| Agents Store BE | Hetzner CPX31 | Elixir/Phoenix |
| DB | Neon eu-west-2 | Postgres + pgvector |
| Search | Neon `tsvector` | Postgres full-text, no Algolia |
| File storage (avatars, covers) | Cloudflare R2 | S3-compatible |
| Payments | Stripe | Subscriptions + Connect payouts |
| CDN | Cloudflare | All static assets |

**V1 search:** Postgres `tsvector` + `GIN` index. Handles up to ~100k agents easily.  
**V2 search:** Typesense or Meilisearch when Postgres full-text shows latency.

### Environment Variables

```bash
# Agents Store FE (.env.local)
DATABASE_URL=""
DATABASE_URL_UNPOOLED=""
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="https://agents.aitlas.xyz"
NEXT_PUBLIC_APP_URL="https://agents.aitlas.xyz"
NEXT_PUBLIC_NOVA_URL="https://nova.aitlas.xyz"
FURMA_INTERNAL_SECRET=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
CLOUDFLARE_R2_ACCOUNT_ID=""
CLOUDFLARE_R2_ACCESS_KEY=""
CLOUDFLARE_R2_SECRET_KEY=""
CLOUDFLARE_R2_BUCKET="aitlas-agents"

# Agents Store BE (server .env)
DATABASE_URL=""
DATABASE_URL_UNPOOLED=""
BETTER_AUTH_SECRET=""
FURMA_INTERNAL_SECRET=""
ENCRYPTION_KEY=""
MCP_API_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXUS_API_URL="https://nexus.aitlas.xyz"
NEXUS_API_KEY=""
```

---

## 20. Roadmap

### V1 (Launch)

- [ ] Agent listing pages + store homepage
- [ ] Role/tag/search browsing
- [ ] Creator account + agent submission
- [ ] 2-tier curation (automated + human)
- [ ] Hire flow → Nova handoff
- [ ] Credit-based agents
- [ ] Run event tracking
- [ ] Reviews and ratings
- [ ] Public run sharing
- [ ] Fork & remix
- [ ] Furma curated agents: Rainmaker, Code Reviewer (first two)

### V2 (Growth)

- [ ] Subscription agents (Stripe Connect + 70/30 split)
- [ ] Creator analytics dashboard
- [ ] Monthly creator payouts
- [ ] Verified creator program (applications open)
- [ ] Agent sandbox (test run in store before hiring)
- [ ] Featured placement (curated weekly by Furma)
- [ ] Scheduled agents (cron configuration in hire flow)
- [ ] "Hire with config" (user customizes agent parameters before running)

### V3 (Scale)

- [ ] Partner creator program
- [ ] Search upgrade (Typesense/Meilisearch)
- [ ] Agent bundles ("Sales Stack" = Rainmaker + Tax Ghost)
- [ ] API access (developers hire agents via REST)
- [ ] Webhook notifications (agent completed → POST to your endpoint)
- [ ] Agent versioning UI (compare v1 vs v2 side by side)
- [ ] Public leaderboards (top agents by category)
- [ ] Agent GitHub (open-source agent specs, community contributions)

---

**Last Updated:** March 2026  
**Maintained by:** Herb (AI CTO) + Furma (CEO)

> *The agent you hire today should be better than the one you hired last week.*  
> *Curation is the product. Quality is the moat.*
