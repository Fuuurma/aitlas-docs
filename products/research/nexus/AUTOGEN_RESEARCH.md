# AutoGen — Research

**Status:** 🔵 Reference (Multi-agent framework)  
**Reference:** [microsoft/autogen](https://github.com/microsoft/autogen) (55K stars, MIT)  
**Use:** Multi-agent orchestration / Research reference

---

## Overview

**AutoGen** = Microsoft's framework for building AI agents.

> "AutoGen enables next-generation AI applications with a diverse set of agents of varying capabilities that can work together to solve tasks."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-agent** | Multiple agents collaborate |
| **Customizable** | Agent roles, prompts, tools |
| **Conversation-driven** | Agents talk to each other |
| **Code Execution** | Built-in code generation/execution |
| **Human-in-loop** | Human can intervene |

---

## Architecture

```python
# Example: Two-agent conversation
assistant = AssistantAgent("assistant", llm_config=...)
user_proxy = UserProxyAgent("user_proxy")

user_proxy.initiate_chat(
    assistant,
    message="Write a Python script to analyze data"
)
```

---

## For Nexus

### What to Learn
- Multi-agent conversation patterns
- Role-based agent design
- Code execution sandbox patterns

### Weaknesses for Nexus
- Python-only (not TypeScript-native)
- Complex framework, hard to customize
- No built-in durable execution
- No background job system
- Heavy, overkill for simple agents

---

## Related

- [Floop Analysis](./FLOOP_ANALYSIS.md) — Competitor comparison
- [LangGraph](./LANGGRAPH_RESEARCH.md) — Graph-based alternative
- [Trigger.dev](./TRIGGERDEV_RESEARCH.md) — Background jobs
