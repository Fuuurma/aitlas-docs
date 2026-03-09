# AutoGen — Research (DEEP)

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Status:** 🔵 CORE Framework  
**Reference:** [microsoft/autogen](https://github.com/microsoft/autogen) (55.3K stars, MIT)  
**Use:** Enterprise multi-agent - Microsoft-backed

---

## Overview

**AutoGen** = Microsoft's framework for multi-agent AI applications.

> "AutoGen is a framework for creating multi-agent AI applications that can act autonomously or work alongside humans."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-agent Chat** | Agents converse to solve tasks |
| **Human-in-loop** | Humans can intervene/approve |
| **AutoGen Studio** | No-code GUI for building agents |
| **Flexible Agents** | Customizable roles and behaviors |
| **Tool Use** | Agents can use external tools |
| **Code Execution** | Run generated code |
| **Memory** | Agent memory and context |
| **MCP Support** | Built-in MCP server! |
| **Various Patterns** | Sequential, group, speaker selection |
| **Enterprise-ready** | Microsoft-backed |

---

## Architecture

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

# Create agent
agent = AssistantAgent(
    "assistant",
    model_client=OpenAIChatCompletionClient(model="gpt-4o")
)

# Run task
result = await agent.run(task="Your task here")
```

### Agent Types

| Agent | Description |
|-------|-------------|
| AssistantAgent | General purpose AI assistant |
| UserProxyAgent | Represents human user |
| GroupChat | Multiple agents collaborating |
| Selector | Dynamic agent selection |

---

## For Aitlas: How It Fits

| AutoGen Feature | Aitlas Use |
|----------------|------------|
| **MCP Support** | → Our MCP server architecture |
| **Human-in-loop** | → Nexus runtime approval workflows |
| **AutoGen Studio** | → Nova for agent building |
| **Tool Use** | → f.xyz Actions integration |
| **Group Chat** | → Multi-agent collaboration |
| **Enterprise** | → Production-ready reference |

---

## Comparison

| Feature | AutoGen | Aitlas |
|---------|---------|--------|
| Stars | 55.3K | - |
| Language | Python | TypeScript/Bun |
| MCP | ✅ Native | ✅ Our focus |
| Human-in-loop | ✅ | → Nexus runtime |
| No-code Studio | ✅ | - |
| Enterprise | ✅ Microsoft | - |

---

## AutoGen Studio

No-code GUI for building agents:
- Visual agent builder
- Conversation flow designer
- Test and debug
- Deploy

---

## Use Cases

1. **Complex workflows** - Multi-step processes
2. **Human approval** - Tasks needing sign-off
3. **Code generation** - With execution
4. **Research agents** - Web search + analysis

---

## Next Steps for Aitlas

1. **Study** AutoGen's MCP implementation
2. **Reference** human-in-loop patterns for Nexus runtime
3. **Consider** AutoGen Studio as Nexus inspiration

---

## References

- [AutoGen GitHub](https://github.com/microsoft/autogen)
- [AutoGen Docs](https://microsoft.github.io/autogen/)
- [AutoGen Studio](https://microsoft.github.io/autogen/stable/user-guide/autogenstudio/quick-start.html)

---

*Status: 🔵 CORE Framework - Enterprise-grade, MCP support*