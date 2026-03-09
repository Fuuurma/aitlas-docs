# LangGraph — Research

**Status:** 🔵 Reference  
**Reference:** [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) (26K stars, MIT)  
**Use:** Agent state graphs / Graph-based orchestration

---

## Overview

**LangGraph** = Graph-based orchestration for building agentic and multi-agent applications.

> "LangGraph is a library for building stateful, multi-actor applications with LLMs, built on top of LangChain."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Graph-based** | Nodes = actions, Edges = flow control |
| **State Management** | Shared state across nodes |
| **Cycles** | Supports looping (critical for agents) |
| **Checkpointing** | Save/restore graph state |
| **Streaming** | Real-time token streaming |
| **Multi-agent** | Built-in patterns for agents |

---

## Architecture

```python
# Example: Simple Agent Graph
graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tool", tool_node)
graph.add_edge("__start__", "agent")
graph.add_conditional_edges("agent", should_continue)
graph.add_edge("tool", "agent")
```

---

## For Nexus

### What to Learn
- Graph-based flow control
- State management patterns
- Checkpointing for durability
- Multi-agent patterns

### Weaknesses for Nexus
- Python-first (not TypeScript-native)
- Complex for simple workflows
- No built-in background jobs
- MCP integration via LangChain only

---

## Related

- [Trigger.dev](./TRIGGERDEV_RESEARCH.md) — Background jobs
- [Temporal](./TEMPORAL_RESEARCH.md) — Durable execution
- [Floop Analysis](./FLOOP_ANALYSIS.md) — Competitor comparison
