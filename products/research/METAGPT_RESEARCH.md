# MetaGPT — Research (DEEP)

**Status:** 🔵 CORE Framework  
**Reference:** [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) (64.9K stars, MIT)  
**Use:** Multi-agent collaboration - Software company simulation

---

## Overview

**MetaGPT** = Multi-agent collaboration framework where LLMs form a software company.

> "Assign different roles to GPTs to form a collaborative entity for complex tasks."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Role-based Agents** | PM, Architect, Engineer, QA, Product Owner |
| **SOP-driven** | Software Engineering processes as code |
| **Software Company** | Full dev workflow in one prompt |
| **Code Generation** | Creates working code from requirements |
| **Document Generation** | User stories, specs, APIs, docs |
| **Multi-model Support** | OpenAI, Anthropic, Ollama, etc. |
| **RAG Support** | Knowledge retrieval |
| **Persistence** | Save/restore agent states |

---

## Architecture

```
User Input: "Create a 2048 game"
         │
         ▼
┌─────────────────────────────────────────┐
│           MetaGPT Pipeline                │
│  ┌───────────────────────────────────┐ │
│  │  Product Manager                   │ │
│  │  → User Stories, Requirements     │ │
│  └───────────────────────────────────┘ │
│                  │                        │
│  ┌───────────────────────────────────┐ │
│  │  Architect                         │ │
│  │  → System Design, APIs            │ │
│  └───────────────────────────────────┘ │
│                  │                        │
│  ┌───────────────────────────────────┐ │
│  │  Project Manager                   │ │
│  │  → Tasks, Sprint Planning         │ │
│  └───────────────────────────────────┘ │
│                  │                        │
│  ┌───────────────────────────────────┐ │
│  │  Engineer                         │ │
│  │  → Write Code                     │ │
│  └───────────────────────────────────┘ │
│                  │                        │
│  ┌───────────────────────────────────┐ │
│  │  QA Engineer                      │ │
│  │  → Test, Validate                 │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
              │
              ▼
    Working Software!
```

---

## For Aitlas: How It Fits

| MetaGPT Feature | Aitlas Use |
|-----------------|------------|
| **Role-based agents** | → Agents Store (personas) |
| **SOP-driven** | → f.loop task templates |
| **Multi-agent collaboration** | → Complex tasks in Nexus |
| **Code generation** | → f.guard integration |
| **Full workflow** | → Symphony integration |

---

## Comparison

| Feature | MetaGPT | Aitlas |
|---------|---------|--------|
| Stars | 64.9K | - |
| Language | Python | TypeScript/Bun |
| Multi-agent | ✅ | f.loop |
| Role-based | ✅ | Agents Store |
| Workflow | ✅ | Symphony |

---

## Use Cases

1. **Complex coding tasks** - Full software from scratch
2. **Code review** - Multiple perspectives
3. **Architecture design** - System design collaboration
4. **Documentation** - Automated docs generation

---

## Next Steps for Aitlas

1. **Study** MetaGPT's SOP patterns
2. **Import** role definitions to Agents Store
3. **Integrate** with f.loop for multi-agent tasks

---

## References

- [MetaGPT GitHub](https://github.com/FoundationAgents/MetaGPT)
- [MetaGPT Docs](https://docs.deepwisdom.ai/)
- [MGX Product](https://mgx.dev/)

---

*Status: 🔵 CORE Framework - Multi-agent collaboration leader*
