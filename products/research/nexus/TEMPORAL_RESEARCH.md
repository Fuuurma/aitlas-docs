# Temporal — Research

**Status:** 🔵 Reference  
**Reference:** [temporalio/temporal](https://github.com/temporalio/temporal) (18K stars, MIT)  
**Use:** Enterprise durable execution / Workflow orchestration

---

## Overview

**Temporal** = Enterprise-grade durable workflow engine.

> "Durable execution for code. Temporal ensures your applications continue running despite infrastructure failures, process crashes, and network issues."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Durable Execution** | State survives failures, restarts |
| **Activity Retry** | Built-in retry policies |
| **Workflow History** | Complete audit trail |
| **Temporal Cloud** | Managed service option |
| **Multi-language** | Go, Java, Python, TypeScript, .NET |

---

## Architecture

```
┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Temporal   │
└─────────────┘     │   Server    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Database   │
                    │ (history)   │
                    └─────────────┘
```

---

## For Nexus

### What to Learn
- Durable execution model
- Activity retry patterns
- Workflow state management

### Weaknesses for Nexus
- Complex setup (requires PostgreSQL, Kafka)
- Python/Go centric, TypeScript support limited
- Enterprise-focused, not AI-native
- No built-in MCP support

---

## Related

- [Trigger.dev](./TRIGGERDEV_RESEARCH.md) — AI-native alternative
- [Floop Analysis](./FLOOP_ANALYSIS.md) — Competitor comparison
