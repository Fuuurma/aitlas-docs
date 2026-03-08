# Dexter Integration Research

**Source:** https://github.com/virattt/dexter  
**Research Date:** 2026-03-08  
**Status:** Analysis Complete

---

## What is Dexter?

Dexter is an **autonomous financial research agent** that:
- Thinks, plans, and learns as it works
- Decomposes complex financial queries into step-by-step research plans
- Uses self-reflection and validation
- Accesses real-time financial data (income statements, balance sheets, cash flow)
- Has built-in safety features (loop detection, step limits)

**Tagline:** "Think Claude Code, but built specifically for financial research."

---

## Key Architecture Patterns

### 1. Intelligent Task Planning
```typescript
// Dexter decomposes complex queries
Query: "Should I invest in NVDA?"
↓
Plan:
1. Get NVDA financial statements
2. Analyze revenue growth
3. Check competitive position
4. Review valuation metrics
5. Generate recommendation
```

### 2. Autonomous Execution
- Selects appropriate tools automatically
- Executes tools with correct parameters
- Gathers and synthesizes data

### 3. Self-Validation Loop
- Checks own work
- Iterates until confident
- Validates data quality

### 4. Scratchpad Pattern
```
.dexter/scratchpad/
├── 2026-01-30-111400_9a8f10723f79.jsonl
└── ...

Each entry:
- init: Original query
- tool_result: Tool calls + results + LLM summary
- thinking: Agent reasoning
```

### 5. Safety Features
- Loop detection
- Step limits
- Timeout handling
- Error recovery

---

## Integration Options for Aitlas

### Option 1: New Action - `f.financial-research`

**Purpose:** Deep financial research as an MCP tool

**MCP Tools:**
```yaml
tools:
  - research_stock:
      description: "Comprehensive stock research with autonomous planning"
      params: ticker, question
      returns: research_report

  - compare_companies:
      description: "Compare multiple companies financially"
      params: tickers[], metrics[]
      returns: comparison_matrix

  - analyze_financials:
      description: "Deep dive into financial statements"
      params: ticker, statement_type, period
      returns: analysis_report

  - get_statements:
      description: "Fetch financial statements"
      params: ticker, type (income|balance|cashflow), period
      returns: financial_data

  - validate_data:
      description: "Self-check data quality"
      params: data, sources
      returns: validation_result
```

**Integration:**
- Use Dexter's task planning algorithm
- Connect to Financial Datasets API
- Implement scratchpad logging
- Add self-validation loop

---

### Option 2: New Agent - `f.financial-researcher`

**Purpose:** Specialized agent for deep financial research

**Capabilities:**
- Autonomous research planning
- Multi-step financial analysis
- Self-reflection and validation
- Report generation

**Tool Access:**
```yaml
tools:
  - f.finance       # Market data
  - f.scrape        # SEC filings, news
  - f.news          # Financial news
  - f.report        # Generate reports
  - f.vault         # Store API keys
```

**System Prompt Pattern:**
```markdown
You are f.financial-researcher, a specialized financial research agent.

## Capabilities
- Decompose complex financial questions into research steps
- Execute multi-step research autonomously
- Validate and cross-check financial data
- Generate data-backed recommendations

## Behavior
1. Plan: Break down query into steps
2. Execute: Run appropriate tools
3. Validate: Check data quality
4. Synthesize: Generate comprehensive report
5. Iterate: Refine if needed

## Safety
- Always cite data sources
- Flag uncertainty in analysis
- Never make guarantees about returns
- Include risk factors
```

---

### Option 3: Hybrid - Action + Agent

**Action:** `f.financial-research` (MCP tool)
- Provides financial research capabilities to any agent

**Agent:** `f.financial-researcher`
- Uses the action + other tools
- Specialized in financial research workflow
- Has deep domain knowledge

---

## Technical Integration

### Data Sources (from Dexter)
| Source | Purpose | API |
|--------|---------|-----|
| Financial Datasets | Income statements, balance sheets, cash flow | `financialdatasets.ai` |
| Exa | Web search for financial news | `exa.ai` |
| Tavily | Fallback web search | `tavily.com` |

### Architecture Components
| Component | Dexter | Aitlas Equivalent |
|-----------|--------|-------------------|
| Task Planner | Built-in | Aitlas Orchestration (f.loop) |
| Tool Execution | Custom | MCP Protocol |
| Self-Validation | Built-in | Aitlas Memory + Reflection |
| Scratchpad | JSONL files | Aitlas Memory System |
| Safety | Loop detection, step limits | Aitlas Guardrails (f.guard) |

### API Endpoints
```typescript
// Dexter tools to port as MCP
get_income_statements(ticker, period, limit)
get_balance_sheets(ticker, period, limit)
get_cash_flow_statements(ticker, period, limit)
get_company_facts(ticker)
search_filings(ticker, form_type)
analyze_trends(ticker, metric, timeframe)
```

---

## WhatsApp Integration

Dexter has WhatsApp integration via gateway:

```bash
# Link WhatsApp
bun run gateway:login

# Start gateway
bun run gateway
```

**For Aitlas:**
- Could integrate with `f.whatsapp` action
- Messages to self = trigger agent
- Responses sent back to same chat
- Use OpenClaw's existing WhatsApp gateway

---

## Recommended Integration Plan

### Phase 1: Create `f.financial-research` Action

**Week 1-2:**
1. Port Dexter's financial tools to MCP
2. Implement task planning algorithm
3. Add scratchpad logging
4. Create validation loop

**Deliverable:** MCP server with 6 financial research tools

### Phase 2: Create `f.financial-researcher` Agent

**Week 3-4:**
1. Design agent system prompt
2. Configure tool access
3. Add domain knowledge
4. Create example workflows

**Deliverable:** Specialized financial research agent

### Phase 3: Advanced Features

**Week 5-6:**
1. Multi-step research workflows
2. Comparative analysis
3. Report generation
4. Real-time alerts

**Deliverable:** Production-ready financial research system

---

## Key Learnings from Dexter

### 1. Scratchpad Pattern
**What:** Log all tool calls with timestamps, args, results, and LLM summaries
**Why:** Debugging, audit trail, learning from past queries
**Aitlas Integration:** Use in Aitlas Memory System

### 2. Task Decomposition
**What:** Break complex queries into steps
**Why:** Better results, transparent reasoning
**Aitlas Integration:** Use in f.loop orchestration

### 3. Self-Validation
**What:** Agent checks its own work
**Why:** Higher accuracy, confidence scoring
**Aitlas Integration:** Add to all research agents

### 4. Safety Limits
**What:** Loop detection, step limits, timeouts
**Why:** Prevent runaway execution
**Aitlas Integration:** Use in f.guard

### 5. Multi-LLM Support
**What:** OpenAI, Anthropic, Google, xAI, OpenRouter, Ollama
**Why:** Flexibility, cost optimization
**Aitlas Integration:** Already supported via BYOK

---

## Code Patterns to Borrow

### Task Planning
```typescript
// Dexter's planning pattern
const plan = await agent.plan(query);
for (const step of plan.steps) {
  const result = await agent.execute(step);
  const validated = await agent.validate(result);
  if (!validated.confident) {
    // Iterate or ask for clarification
  }
}
```

### Scratchpad Logging
```typescript
// Dexter's logging pattern
interface ScratchpadEntry {
  type: 'init' | 'tool_result' | 'thinking';
  timestamp: string;
  toolName?: string;
  args?: any;
  result?: any;
  llmSummary?: string;
}
```

### Self-Validation
```typescript
// Dexter's validation pattern
async function validate(result: ResearchResult): Promise<Validation> {
  const checks = [
    checkDataFreshness(result.data),
    checkSourceCredibility(result.sources),
    checkLogicalConsistency(result.analysis),
    crossReferenceWithMultipleSources(result.claims),
  ];
  
  return {
    confident: checks.every(c => c.passed),
    issues: checks.filter(c => !c.passed).map(c => c.issue),
  };
}
```

---

## Conclusion

**Best Integration:** Hybrid approach

1. **Action (`f.financial-research`):** Port Dexter's tools as MCP server
2. **Agent (`f.financial-researcher`):** Specialized agent using the action

**Priority:** HIGH - Financial research is a core use case for Aitlas

**Effort:** 
- Action: 2-3 weeks
- Agent: 1-2 weeks
- Total: 3-5 weeks

**Dependencies:**
- Financial Datasets API key
- Exa API key (optional, for web search)
- Aitlas orchestration layer (f.loop)

---

**Last Updated:** 2026-03-08