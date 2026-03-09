# LangGraph — Graph-Based Agent Orchestration

**Status:** 🔵 Reference  
**Reference:** [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)  
**Stars:** 26K ⭐ | **Language:** Python | **License:** MIT  
**Created:** August 2023  
**Website:** [langchain.com](https://langchain.com)

---

## Overview

**LangGraph** = Low-level orchestration framework for building resilient, stateful agents as graphs.

> "Build resilient language agents as graphs. LangGraph is a low-level orchestration framework for building, managing, and deploying long-running, stateful agents."

Built by **LangChain Inc.** — creators of LangChain.

---

## Key Stats

| Metric | Value |
|--------|-------|
| Stars | 26K |
| Language | Python |
| License | MIT |
| Created | Aug 2023 |
| Weekly Downloads | 1M+ |
| Used by | Klarna, Replit, Elastic |

---

## Architecture

### Core Concept: Graph-Based

```
Nodes = Actions/Steps
Edges  = Flow Control
State  = Shared Data
```

### Graph Types

```python
# 1. StateGraph - Mutable shared state
class State(TypedDict):
    messages: list
    answer: str

# 2. MessageGraph - Immutable messages
# For chat-like applications
```

### Execution Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Node   │────▶│  Node   │────▶│  Node   │
│ (step 1)│     │ (step 2)│     │ (step 3)│
└────┬────┘     └────┬────┘     └────┬────┘
     │                │                │
     └────────────────┴────────────────┘
                    │
              ┌─────▼─────┐
              │   State   │
              │  (shared) │
              └───────────┘
```

---

## Key Features

### 1. Durable Execution
- Persists through failures
- Auto-resumes from checkpoint
- Long-running agents

```python
# Checkpointing - save state
from langgraph.checkpoint.sqlite import SqliteSaver
checkpointer = SqliteSaver.from_conn_string("./checkpoints.db")
graph = graph.compile(checkpointer=checkpointer)
```

### 2. Human-in-the-Loop
- Inspect state during execution
- Modify flow mid-run
- Approve/reject decisions

```python
# Interrupt for human approval
from langgraph.types import interrupt

def approval_node(state):
    result = interrupt({"question": "Approve this action?"})
    return {"approved": result}
```

### 3. Comprehensive Memory

**Short-term (Working Memory)**
```python
# Messages persist across calls
graph = graph.compile(checkpoint=SqliteSaver(...))
```

**Long-term (Persistent)**
```python
# Store and retrieve memories
from langgraph.store.memory import MemoryStore
store = MemoryStore()
```

### 4. Cycles Support (Critical for Agents)

```python
# Conditional edge - loop back
def should_continue(state):
    if state["attempts"] < 3:
        return "retry"
    return "end"

graph.add_conditional_edges("agent", should_continue)
```

### 5. Streaming

```python
# Stream tokens as generated
for event in graph.stream(input, stream_mode="values"):
    print(event)
```

---

## SDKs

| Language | Repo | Status |
|----------|------|--------|
| Python | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | ✅ Primary |
| JavaScript | [langchain-ai/langgraphjs](https://github.com/langchain-ai/langgraphjs) | ✅ |

---

## Code Examples

### Simple Agent

```python
from langgraph.graph import START, StateGraph
from typing import TypedDict

class State(TypedDict):
    query: str
    answer: str

def analyze(state):
    return {"answer": f"Analysis of: {state['query']}"}

def execute(state):
    return {"answer": state["answer"] + " [executed]"}

graph = StateGraph(State)
graph.add_node("analyze", analyze)
graph.add_node("execute", execute)
graph.add_edge(START, "analyze")
graph.add_edge("analyze", "execute")

result = graph.invoke({"query": "hello"})
```

### Tool-using Agent

```python
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(
    model,
    tools=[search_tool, calculator],
    state_modifier="You are a helpful assistant."
)

result = agent.invoke({"messages": [("user", "What's 2+2?")])
```

---

## Ecosystem

| Product | Purpose |
|---------|---------|
| **LangSmith** | Observability, debugging, evals |
| **LangChain** | Integrations, components |
| **LangGraph Cloud** | Deployment, scaling |
| **LangGraph Studio** | Visual prototyping |

---

## For Nexus

### What to Learn

| Pattern | How to Apply |
|---------|-------------|
| **Graph execution** | Nodes = tools, edges = flow |
| **Checkpointing** | Durable state across failures |
| **Conditional edges** | Dynamic routing |
| **Human-in-loop** | Approval workflows |
| **Memory layers** | Short + long term |

### Weaknesses for Nexus

| Issue | Impact |
|-------|--------|
| Python-first | Not TypeScript-native |
| Complex for simple cases | Overhead for basic agents |
| No background jobs | Not for long-running tasks |
| LangChain dependency | Tight coupling |
| No MCP built-in | Would need custom adapter |
| Enterprise pricing | LangSmith costs |

---

## Comparison

| Feature | LangGraph | Temporal | Nexus |
|---------|-----------|----------|-------|
| Language | Python | Go/Java | TypeScript |
| Model | Graph | Workflow | Agent Loop |
| Durable | ✅ Checkpointing | ✅ Event Sourcing | Planned |
| MCP | ❌ | ❌ | ✅ |
| Background Jobs | ❌ | ✅ | ✅ |
| TypeScript | Limited | Limited | ✅ Native |
| AI-native | ✅ | ❌ | ✅ |

---

## Code: Agent with Memory

```python
from langgraph.graph import START, StateGraph
from langgraph.checkpoint.sqlite import SqliteSaver

class AgentState(TypedDict):
    messages: list
    user_id: str

graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", tools_node)
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_use_tools)
graph.add_edge("tools", "agent")

# Compile with memory
checkpointer = SqliteSaver.from_conn_string("./memory.db")
agent = graph.compile(checkpointer=checkpointer)

# Invoke with thread
result = agent.invoke(
    {"messages": [("user", "Hi")],
     "user_id": "user123"},
    config={"configurable": {"thread_id": "user123"}}
)
```

---

## Resources

- [Docs](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph Academy](https://academy.langchain.com/courses/intro-to-langgraph)
- [Examples](https://docs.langchain.com/oss/python/langgraph/agentic-rag)

---

## Related

- [Temporal](./TEMPORAL_RESEARCH.md) — Enterprise workflows
- [Trigger.dev](./TRIGGERDEV_RESEARCH.md) — Background jobs
- [AutoGen](./AUTOGEN_RESEARCH.md) — Multi-agent
- [Floop Analysis](./FLOOP_ANALYSIS.md) — Competitor comparison
