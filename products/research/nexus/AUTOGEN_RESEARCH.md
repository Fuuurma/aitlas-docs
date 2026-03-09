# AutoGen — Multi-Agent Framework

**Status:** 🔵 Reference  
**Reference:** [microsoft/autogen](https://github.com/microsoft/autogen)  
**Stars:** 55.3K ⭐ | **Language:** Python | **License:** MIT  
**Created:** August 2023  
**Website:** [microsoft.github.io/autogen](https://microsoft.github.io/autogen)

---

## Overview

**AutoGen** = Microsoft's framework for creating multi-agent AI applications.

> "AutoGen is a framework for creating multi-agent AI applications that can act autonomously or work alongside humans."

Now with **AutoGen Studio** for no-code GUI development.

---

## Key Stats

| Metric | Value |
|--------|-------|
| Stars | 55.3K |
| Language | Python |
| License | MIT |
| Created | Aug 2023 |
| Python | 3.10+ |
| Contributors | 700+ |

---

## Architecture

### Layered Design

```
┌─────────────────────────────────────────────────────────┐
│                    Applications                          │
│              (Magentic-One, etc.)                       │
├─────────────────────────────────────────────────────────┤
│                  AgentChat API                          │
│         (High-level, opinionated patterns)               │
├─────────────────────────────────────────────────────────┤
│                   Core API                              │
│     (Message passing, event-driven, runtime)             │
├─────────────────────────────────────────────────────────┤
│                 Extensions API                          │
│      (LLM clients, code execution, MCP tools)           │
└─────────────────────────────────────────────────────────┘
```

### Multi-Agent Patterns

```python
# Agent as Tool - agents can use other agents
math_agent = AssistantAgent("math_expert", ...)
math_agent_tool = AgentTool(math_agent, return_value_as_last_message=True)

agent = AssistantAgent(
    "assistant",
    tools=[math_agent_tool]
)
```

---

## Key Features

### 1. Multi-Agent Orchestration

**Two-Agent Chat**
```python
from autogen_agentchat.teams import SelectorGroupChat

team = SelectorGroupChat(
    participants=[assistant, critic],
    termination_condition=StopCondition("no more iterations")
)
```

**Group Chat**
```python
from autogen_agentchat.teams import RoundRobinGroupChat

team = RoundRobinGroupChat(participants=[agent1, agent2, agent3])
```

### 2. Human-in-the-Loop

```python
from autogen_agentchat.agents import UserProxyAgent

user_proxy = UserProxyAgent("user", input_func=input)
```

### 3. Code Execution

```python
from autogen_ext.code executors import LocalCommandLineCodeExecutor

executor = LocalCommandLineCodeExecutor()
```

### 4. MCP Integration

```python
from autogen_ext.tools.mcp import McpWorkbench, StdioServerParams

async with McpWorkbench(server_params) as mcp:
    agent = AssistantAgent("assistant", workbench=mcp)
```

### 5. AutoGen Studio

No-code GUI for building multi-agent workflows.

```bash
autogenstudio ui --port 8080
```

---

## SDK Structure

### Packages

| Package | Purpose |
|---------|---------|
| `autogen-core` | Low-level message passing, events |
| `autogen-agentchat` | High-level agent patterns |
| `autogen-ext` | Extensions (OpenAI, code executor, MCP) |
| `autogenstudio` | No-code GUI |
| `agbench` | Benchmarking |

### Language Support

| Language | Status |
|----------|--------|
| Python | ✅ Primary |
| .NET | ✅ (via AutoGen.NET) |

---

## Code Examples

### Hello World

```python
import asyncio
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

async def main():
    client = OpenAIChatCompletionClient(model="gpt-4.1")
    agent = AssistantAgent("assistant", model_client=client)
    print(await agent.run(task="Say 'Hello World!'"))

asyncio.run(main())
```

### Multi-Agent with Tools

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.tools import AgentTool

math_agent = AssistantAgent("math", system_message="Math expert")
math_tool = AgentTool(math_agent, return_value_as_last_message=True)

assistant = AssistantAgent(
    "assistant",
    tools=[math_tool],
    max_tool_iterations=10
)
```

### Code Execution

```python
from autogen_ext.code_executors import LocalCommandLineCodeExecutor

executor = LocalCommandLineCodeExecutor()
code_agent = AssistantAgent(
    "coder",
    code_executor=executor
)
```

---

## For Nexus

### What to Learn

| Pattern | How to Apply |
|---------|-------------|
| **Agent-as-tool** | Agents can invoke other agents |
| **Selector routing** | Dynamic agent selection |
| **Group chat** | Multiple agents collaborate |
| **Human-in-loop** | Approval workflows |
| **Layered API** | Core vs high-level separation |

### Weaknesses for Nexus

| Issue | Impact |
|-------|--------|
| Python-only | Not TypeScript-native |
| Heavy framework | Complex, hard to customize |
| No durable execution | No checkpointing for long tasks |
| No background jobs | Not for async workflows |
| No MCP built-in | Would need custom adapter |
| Microsoft ecosystem | Vendor lock-in |

---

## 🔌 How It Fits in Aitlas

### Product Alignment

| Aitlas Product | Fit Level | Use Case |
|---------------|-----------|----------|
| **Nexus** | 🔵 Medium | Multi-agent patterns |
| **Nova** | 🔵 Reference | UI patterns for agent chat |
| **Actions** | ❌ | Tool execution |
| **Agents Store** | 🔵 High | Agent definition patterns |

### How to Use AutoGen for Aitlas

#### Option 1: Agent Design Patterns (Recommended)
Use AutoGen's agent patterns for **Agents Store**:

```typescript
// Nexus agent definition (inspired by AutoGen)
interface Agent {
  name: string
  description: string
  model: ModelConfig
  skills: Skill[]
  tools: Tool[]
  humanInLoop?: boolean
  maxIterations?: number
}
```

#### Option 2: Multi-Agent Orchestration
For complex tasks, agents can invoke other agents:

```typescript
// Nexus: agent can call sub-agent
const agent = {
  name: 'research-team',
  subAgents: [
    'web-searcher',
    'data-analyzer',
    'report-writer'
  ],
  orchestration: 'sequential' // or 'parallel', 'group'
}
```

#### Option 3: Human-in-the-Loop
For approval workflows in Nexus:

```typescript
// Nexus approval workflow
const workflow = {
  steps: [
    { agent: 'planner', action: 'plan' },
    { type: 'approval', approver: 'user' },
    { agent: 'executor', action: 'execute' }
  ]
}
```

### What to Extract

1. **Agent-as-Tool Pattern** — Agents can use other agents
   ```typescript
   // Nexus: agent can invoke sub-agent
   const researchAgent = {
     name: 'research',
     canInvoke: ['search', 'scrape', 'summarize']
   }
   ```

2. **Selector Routing** — Dynamic agent selection
   ```typescript
   // Nexus: dynamic agent selection
   async function selectAgent(task: Task): Promise<Agent> {
     if (task.requiresCoding) return coderAgent
     if (task.requiresResearch) return researcherAgent
     return generalAgent
   }
   ```

3. **Group Chat** — Multiple agents collaborate
   ```typescript
   // Nexus: agent team collaboration
   const team = {
     agents: [planner, executor, reviewer],
     mode: 'round_robin', // or 'selector'
     termination: 'all_agreed' // or 'first_response'
   }
   ```

4. **Layered API** — Core vs high-level
   ```typescript
   // Nexus: layered design
   nexus.core        // Low-level: message passing, events
   nexus.agents     // High-level: agent patterns
   nexus.extensions  // Extensions: MCP, providers
   ```

5. **AutoGen Studio** — For Nova UI inspiration
   - No-code agent builder UI
   - Agent configuration interface
   - Team composition visualizer

### What NOT to Take

| Don't Take | Reason |
|------------|--------|
| Python framework | Use patterns only |
| Full AutoGen | Too heavy for Nexus |
| Microsoft SDK | Keep independent |
| AutoGen Studio | Build custom for Nova |

---

## Comparison

| Feature | AutoGen | LangGraph | Temporal | Nexus |
|---------|---------|-----------|----------|-------|
| Multi-agent | ✅ Excellent | ✅ | ❌ | Planned |
| Durable | ❌ | ✅ Checkpoint | ✅ | ✅ |
| Background jobs | ❌ | ❌ | ✅ | ✅ |
| MCP | ✅ New | ❌ | ❌ | ✅ |
| TypeScript | ❌ | Limited | Limited | ✅ |
| Python-first | ✅ | ✅ | ❌ | ❌ |
| Lightweight | ❌ | ❌ | ❌ | ✅ |

---

## Ecosystem

| Tool | Description |
|------|-------------|
| **AutoGen Studio** | No-code GUI |
| **AutoGen Bench** | Benchmarking suite |
| **Magentic-One** | SOTA multi-agent team |
| **Discord** | Community (15K+ members) |

---

## Resources

- [Docs](https://microsoft.github.io/autogen/)
- [AutoGen Studio](https://microsoft.github.io/autogen/stable/user-guide/autogenstudio-user-guide/)
- [Discord](https://aka.ms/autogen-discord)
- [Blog](https://devblogs.microsoft.com/autogen/)

---

## Related

- [LangGraph](./LANGGRAPH_RESEARCH.md) — Graph-based alternative
- [Temporal](./TEMPORAL_RESEARCH.md) — Enterprise workflows
- [Trigger.dev](./TRIGGERDEV_RESEARCH.md) — Background jobs
- [Floop Analysis](./FLOOP_ANALYSIS.md) — Competitor comparison
