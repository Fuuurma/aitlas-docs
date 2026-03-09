# OpenAI Swarm — Research (DEEP)

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Status:** 🔵 Framework  
**Reference:** [openai/swarm](https://github.com/openai/swarm) (21.1K stars, MIT)  
**Use:** Simple orchestration - Educational

---

## Overview

**Swarm** = OpenAI's experimental framework for multi-agent orchestration.

> "Swarm: An educational framework exploring ergonomic, lightweight multi-agent orchestration."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Lightweight** | Minimal, easy to understand |
| **Handoffs** | Agents transfer to other agents |
| **Function calling** | Tools as functions |
| **Context variables** | Shared state between agents |
| **Tutorials** | Great for learning |
| **No state** | Stateless orchestration |
| **Python** | Simple Python implementation |

---

## Architecture

```python
from swarm import Swarm, Agent

# Define agents with handoffs
def transfer_to_sales():
    return sales_agent

def transfer_to_support():
    return support_agent

sales_agent = Agent(
    name="Sales Agent",
    instructions="You help with sales questions. Transfer to support for tech issues.",
    functions=[transfer_to_support],
)

support_agent = Agent(
    name="Support Agent",
    instructions="You help with technical support. Transfer to sales for pricing.",
    functions=[transfer_to_sales],
)

# Run
client = Swarm()
response = client.run(
    agent=sales_agent,
    messages=[{"role": "user", "content": "I have a pricing question"}],
)
```

### Core Concepts

| Concept | What |
|---------|------|
| **Agent** | Instructions + functions |
| **Handoff** | Transfer to another agent |
| **Function** | Tool definition |
| **Swarm** | Orchestrator |

---

## For Aitlas: How It Fits

| Swarm Feature | Aitlas Use |
|----------------|------------|
| **Handoffs** | → Agent-to-agent communication |
| **Lightweight** | → Reference for simple patterns |
| **Educational** | → Learn orchestration |
| **OpenAI** | → Future OpenAI integration |
| **No state** | → Stateless Nexus runtime tasks |

---

## Comparison

| Feature | Swarm | Aitlas |
|---------|-------|--------|
| Stars | 21.1K | - |
| Language | Python | TypeScript |
| Complexity | Minimal | Full-featured |
| Production | Experimental | Production |
| Handoffs | ✅ | Our target |

---

## When to Use Swarm

Swarm is **educational** - best for:
- Learning multi-agent patterns
- Simple use cases
- Prototyping
- Understanding handoff concepts

**Not for production** - use AutoGen/Mastra/crewAI instead.

---

## Use Cases (Educational)

1. **Customer service** - Triage → Sales/Support
2. **Information retrieval** - Search → Summarize → Respond
3. **Routing** - Simple task routing

---

## Next Steps for Aitlas

1. **Study** Swarm's handoff patterns
2. **Learn** for understanding agents
3. **Don't use** in production

---

## References

- [Swarm GitHub](https://github.com/openai/swarm)
- [Swarm Cookbooks](https://cookbook.openai.com/examples/orchestrate_agents)

---

*Status: 🔵 Framework - Educational, not production*