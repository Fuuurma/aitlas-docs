# crewAI — Research (DEEP)

**Status:** 🔵 CORE Framework  
**Reference:** [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) (45.5K stars, MIT)  
**Use:** Multi-agent orchestration - Structure & clarity

---

## Overview

**crewAI** = Framework for building AI crews.

> "Orchestrating, connecting, and managing AI agents and LLMs in complex tasks."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Crews** | Groups of agents working on tasks |
| **Tasks** | Define work items for agents |
| **Processes** | Sequential, hierarchical |
| **Tools** | Agent tools (built-in + custom) |
| **Memory** | Agent short/long-term memory |
| **Guardrails** | Input/output validation |
| **Flows** | Visual workflow builder |
| **crewAI Studio** | No-code platform |
| **YAML Config** | Define crews in code or config |

---

## Architecture

```python
from crewai import Agent, Task, Crew

# Create agents
researcher = Agent(role="Researcher", goal="Find info", backstory="Expert researcher")
writer = Agent(role="Writer", goal="Write content", backstory="Skilled writer")

# Define tasks
task1 = Task(description="Research AI trends", agent=researcher)
task2 = Task(description="Write article", agent=writer)

# Create crew
crew = Crew(agents=[researcher, writer], tasks=[task1, task2])
result = crew.kickoff()
```

### Process Types

| Process | Description |
|---------|-------------|
| Sequential | Task B starts after Task A completes |
| Hierarchical | Manager delegates to workers |
| Latent | Parallel with dependency awareness |

---

## crewAI Components

| Component | What |
|-----------|------|
| **Agents** | Roles with goals, backstories, tools |
| **Tasks** | Descriptions, expected output, tools |
| **Crews** | Collection of agents + tasks + process |
| **Tools** | Search, scraper, calculator, etc. |
| **Memory** | Short-term, long-term, entity memory |
| **Guardrails** | Validate inputs/outputs |
| **Callbacks** | Hook into execution |

---

## For Aitlas: How It Fits

| crewAI Feature | Aitlas Use |
|----------------|------------|
| **Crews** | → Multi-agent collaboration |
| **Tasks** | → f.loop task definitions |
| **Processes** | → Symphony workflow patterns |
| **Memory** | → f.library integration |
| **crewAI Studio** | → Nexus agent builder |
| **YAML Config** | → Agent/crew definitions |

---

## Comparison

| Feature | crewAI | Aitlas |
|---------|---------|--------|
| Stars | 45.5K | - |
| Language | Python | TypeScript/Bun |
| Crews | ✅ Native | Our target |
| Tasks | ✅ Native | f.loop |
| Memory | ✅ | f.library |
| Studio | ✅ No-code | - |

---

## crewAI Studio

No-code platform for building crews:
- Visual crew builder
- Agent configuration
- Task definitions
- Process selection
- Deploy

---

## Use Cases

1. **Research teams** - Multiple agents researching
2. **Content creation** - Writer + editor + publisher
3. **Data analysis** - Analyst + visualizer + reporter
4. **Customer support** - Triage + response + escalation

---

## Next Steps for Aitlas

1. **Study** crewAI's process patterns
2. **Import** crew definitions to Agents Store
3. **Build** YAML config support in Nexus

---

## References

- [crewAI GitHub](https://github.com/crewAIInc/crewAI)
- [crewAI Docs](https://docs.crewai.com/)
- [crewAI Studio](https://app.crewai.com)

---

*Status: 🔵 CORE Framework - Best for structured multi-agent*
