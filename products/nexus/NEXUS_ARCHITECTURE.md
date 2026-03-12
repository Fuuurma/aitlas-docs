# Nexus Architecture

> Agent Runtime & Execution Engine for Aitlas

---

## 1. What Nexus Is

Nexus is the core execution runtime for Aitlas agents.

It is responsible for:
- executing agent loops
- managing tool calls
- providing compute environments
- enforcing budgets
- orchestrating actions
- enabling agent-to-agent calls

Conceptually Nexus acts like an operating system for AI agents.

```
Agents
   ↓
Nexus Runtime
   ↓
Tool Executor
   ↓
Actions / Skills / Agents
   ↓
External APIs / Compute
```

Nexus is stateless between runs but persistent through Postgres logs and memory.

---

## 2. Core Runtime Responsibilities

| Responsibility | Description |
|---------------|-------------|
| Agent loop | Executes the plan → action → reflection cycle |
| Tool execution | Calls MCP tools and Actions |
| Compute environment | Provides shell + workspace runtime |
| Context management | Builds prompt context and compresses history |
| Budget enforcement | Controls token, credit, and runtime limits |
| Observability | Logs full deterministic execution traces |

---

## 3. Agent Execution Loop

Every task runs through the Nexus agent loop:

```
Goal → PLAN → ACTION → TOOL EXECUTION → REFLECTION → NEXT STEP
```

### Example Execution Flow

```
User request
   ↓
Create Task
   ↓
Agent loaded
   ↓
Context Builder
   ↓
LLM generates next step
   ↓
ToolExecutor executes tool
   ↓
Result returned
   ↓
Loop continues
```

**Loop ends when:**
- goal satisfied
- budget exhausted
- iteration limit reached

---

## 4. Agent Workspace (Compute Environment)

Each task gets a workspace environment.

**Purpose:**
- store files
- run scripts
- cache results
- persist intermediate outputs

**Workspace structure:**
```
/workspace/{task_id}/
 ├ files/
 ├ database/
 ├ cache/
 └ logs/
```

**Workspace lifetime:**
- Task start → created
- Task end → archived
- Retention → configurable

Workspace allows agents to work with large data without token limits.

---

## 5. Shell Runtime (Built Into Nexus)

Nexus provides a universal shell tool available to every agent.

**Tool name:** `runtime.shell`

**Purpose:**
- run CLI commands
- execute scripts
- process files
- interact with APIs

**Example usage:**
```json
{
  "name": "runtime.shell",
  "arguments": {
    "command": "python analyze.py data.csv"
  }
}
```

**Execution environment:**
- isolated sandbox
- filesystem access
- restricted network
- resource limits

**Supported commands may include:**
- bash
- python
- node
- curl
- jq
- git

The shell allows agents to perform complex workflows without needing specialized tools.

---

## 6. Tool Execution System

Nexus executes tools through a unified executor.

**Tool categories supported:**

| Type | Description |
|------|-------------|
| Actions | Furma hosted MCP services |
| Skills | Packaged workflows |
| Agents | Other agents callable as tools |
| Runtime tools | shell, filesystem, workspace |
| External MCP | Third-party servers |

**Execution flow:**
```
LLM tool call
   ↓
ToolExecutor
   ↓
Capability validation
   ↓
Budget check
   ↓
Execute tool
   ↓
Return result
```

All tools follow MCP specification.

---

## 7. Agent-to-Agent Execution

Agents can call other agents as tools.

**Example:**
```
Orchestrator Agent
   ↓
Research Agent
   ↓
Writer Agent
```

**Agent calls are implemented as tool calls:**
```json
{
  "name": "agent.call",
  "arguments": {
    "agent_id": "research-agent",
    "input": "AI startups in Europe"
  }
}
```

**Execution flow:**
```
Agent A
   ↓
ToolExecutor
   ↓
Spawn subtask
   ↓
Agent B executes
   ↓
Return result
```

**Limits enforced:**
- max_agent_depth = 3
- max_agent_calls = configurable

This enables agent teams and modular workflows.

---

## 8. Context Engine

Long-running agents generate large histories. Nexus includes a Context Engine to compress and structure prompts.

**Pipeline:**
```
Execution history
   ↓
Relevance filter
   ↓
Summarization
   ↓
Memory retrieval
   ↓
Prompt assembly
```

**Final context includes:**
- system prompt
- goal
- current plan
- recent steps
- memory
- tools

This prevents context overflow.

---

## 9. Capability-Based Tool Filtering

Instead of exposing all tools to the model, Nexus filters tools using a capability graph.

**Example capability structure:**
```
Knowledge
 ├ web_search
 ├ twitter_search
 └ research_synthesis

Development
 ├ code_execution
 └ deployment

Communication
 ├ email
 └ slack
```

When a task begins:
```
Goal analyzed
   ↓
Relevant capabilities selected
   ↓
Filtered tool list given to LLM
```

**Benefits:**
- fewer hallucinated tool calls
- smaller prompts
- faster reasoning

---

## 10. Execution Budgets

Every task has a runtime budget.

**Budget categories:**
- credit_budget
- token_budget
- tool_call_limit
- runtime_limit
- agent_depth_limit

**Example:**
```json
{
  "credits": 50,
  "tokens": 200000,
  "tool_calls": 30,
  "runtime": "5 minutes",
  "agent_depth": 3
}
```

BudgetGuard checks limits at every step. If exceeded, task terminated safely.

---

## 11. Deterministic Execution Logs

Nexus records full execution traces.

**Stored in Postgres tables:**
- tasks
- task_steps
- tool_calls

Each step stores:
- prompt hash
- model version
- tool inputs
- tool outputs
- token usage
- timestamp

This enables:
- task replay
- debugging
- auditing
- forking

Agents can be fully reproducible.

---

## 12. Parallel Tool Execution

Nexus can execute tools concurrently.

**Example:**
Agent decides:
- search web
- search twitter
- search docs

**Execution:**
```
Task Supervisor
 ├ tool_call_1
 ├ tool_call_2
 └ tool_call_3

Results returned once complete
```

This dramatically improves performance.

---

## 13. Action Integration

Actions are MCP servers hosted by Furma.

**Example actions:**
- f.twyt
- f.library
- f.rsrx
- f.guard
- f.support
- f.deploy
- f.loop

Agents call them like normal tools.

**Example:**
```
research startup
   ↓
f.rsrx
   ↓
synthesized report
```

Actions are the monetized compute layer.

---

## 14. Skill System

Skills are reusable tool bundles.

**Structure:**
```
skill/
 ├ SKILL.md
 ├ tools/
 ├ prompts/
 └ scripts/
```

Skills describe:
- purpose
- workflow
- inputs
- outputs

Nexus exposes skills as MCP tool sets.

---

## 15. Database Architecture

Nexus uses Postgres as the primary datastore.

**Core tables:**
- tasks
- task_steps
- tool_calls
- agent_runs
- workspace_files

**Optional extensions:**
- pgvector for memory

Postgres is used for:
- execution logs
- memory storage
- credit ledger
- agent registry

---

## 16. Security Model

Nexus enforces strict execution controls.

**Sandbox rules:**
- CPU limits
- memory limits
- runtime limits
- network restrictions
- filesystem isolation

**Tool calls validated through:**
- JSON schema
- argument validation
- allowlist checks

Secrets are never exposed to the model.

---

## 17. Observability

All execution events emit telemetry.

**Logs include:**
- task start
- step execution
- tool call
- tool failure
- task completion

These enable:
- performance monitoring
- agent debugging
- usage analytics

---

## 18. High Level Architecture

**Complete Aitlas stack:**
```
Agents Store
   ↓
Nexus Runtime
   ↓
Context Engine
   ↓
Tool Executor
   ↓
Actions / Skills / Agents
   ↓
Compute (shell / workspace)
   ↓
External APIs
```

Nexus becomes the central execution layer of the Aitlas ecosystem.

---

## 19. Strategic Outcome

With this design, Aitlas provides:
- open agent runtime
- standardized tool ecosystem
- reproducible agent workflows
- distributed MCP services

This makes Nexus effectively **an operating system for AI agents**.

---

## Implementation Notes

### Current Status
- [x] Architecture defined
- [ ] Nexus core implementation (Mastra-based)
- [ ] ToolExecutor
- [ ] Context Engine
- [ ] Agent Workspace
- [ ] Shell Runtime
- [ ] Agent-to-Agent calls
- [ ] Budget enforcement
- [ ] Execution logs

### Dependencies
- **Mastra** - TypeScript agent framework (selected)
- **trigger.dev** - Background jobs
- **PostgreSQL** - Primary database
- **pgvector** - Memory/embeddings
- **OpenCode/Claude Code** - Shell integration

### Related Documents
- [MULTI_PROVIDER_INTEGRATION.md](./nova/MULTI_PROVIDER_INTEGRATION.md)
- [SKILLS_INTEGRATION.md](./agents-store/SKILLS_INTEGRATION.md)
- [f-library](./f-library.md)
