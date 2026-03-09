# Temporal — Enterprise Durable Execution

**Status:** 🔵 Reference  
**Reference:** [temporalio/temporal](https://github.com/temporalio/temporal)  
**Stars:** 18.7K ⭐ | **Language:** Go | **License:** MIT  
**Created:** October 2019  
**Website:** [temporal.io](https://temporal.io)

---

## Overview

**Temporal** = Enterprise-grade durable workflow engine.

> "Temporal is a durable execution platform that enables developers to build scalable applications without sacrificing productivity or reliability."

Originally a fork of Uber's **Cadence**. Developed by Temporal Technologies.

---

## Key Stats

| Metric | Value |
|--------|-------|
| Stars | 18.7K |
| Language | Go |
| License | MIT |
| Created | Oct 2019 |
| Forks | ~2K |
| Contributors | 500+ |

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    User Application                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   SDK       │───▶│  Temporal   │◀───│  Workers    │   │
│  │  (gRPC)     │    │   Server    │    │  (poll)     │   │
│  └─────────────┘    └──────┬──────┘    └─────────────┘   │
└─────────────────────────────┼─────────────────────────────┘
                              │
                    ┌────────▼────────┐
                    │  Task Queues    │
                    │   (Matching)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │History   │   │ Matching │   │ Frontend │
        │ Service  │   │ Service  │   │ Service  │
        └────┬─────┘   └────┬─────┘   └──────────┘
             │
     ┌──────▼──────┐
     │  Database   │
     │ (Event Log) │
     └─────────────┘
```

### Core Concepts

#### Workflow
- Code-defined business logic
- Must be **deterministic**
- No side effects
- Replays from event history

#### Activity
- Non-deterministic code (I/O, API calls)
- Can have side effects
- Retried on failure

#### Worker
- Polls Temporal server for tasks
- Executes Workflow/Activity code
- Multiple workers can scale horizontally

#### Task Queue
- Holds tasks for multiple workflows
- Used for load balancing

---

## SDKs

| Language | Repo | Status |
|----------|------|--------|
| Go | [temporalio/sdk-core](https://github.com/temporalio/sdk-core) | Core |
| Java | [temporalio/sdk-java](https://github.com/temporalio/sdk-java) | ✅ |
| Python | [temporalio/sdk-python](https://github.com/temporalio/sdk-python) | ✅ |
| TypeScript | [temporalio/typescript-sdk](https://github.com/temporalio/typescript-sdk) | ✅ |
| .NET | [David-ff/NETSDK](https://github.com/temporalio/NETSDK) | Community |

---

## Key Features

### 1. Durable Execution
- State survives infrastructure failures
- Complete event history stored
- Replay to recover state

### 2. Activity Retry
```go
// Retry policy
activityOptions := workflow.ActivityOptions{
    StartToCloseTimeout: time.Hour,
    RetryPolicy: &temporal.RetryPolicy{
        InitialInterval:    time.Second,
        BackoffCoefficient: 2.0,
        MaximumInterval:    100 * time.Second,
        MaximumAttempts:    5,
    },
}
```

### 3. Workflow History
- Complete audit trail
- Debug by replaying
- Time-travel debugging

### 4. Timers & Signals
- Durable timers
- Event-driven signals
- External events

### 5. Scaling
- History sharding
- Task queue partitioning
- Multi-cluster support

---

## Deployment Options

| Option | Description |
|--------|-------------|
| **Self-hosted** | Run your own cluster |
| **Temporal Cloud** | Managed service |
| **Docker** | Local development |

### Local Development
```bash
brew install temporal
temporal server start-dev
# Opens Web UI at http://localhost:8233
```

---

## For Nexus

### What to Learn

| Pattern | How to Apply |
|---------|-------------|
| **Event sourcing** | Store workflow events for replay |
| **Activity retries** | Built-in retry policies |
| **Worker polling** | Worker pattern for task execution |
| **Task queues** | Decouple task submission from execution |
| **Deterministic workflows** | Separate deterministic (workflow) from side effects (activity) |

### Weaknesses for Nexus

| Issue | Impact |
|-------|--------|
| Complex setup | Requires PostgreSQL, Kafka, Elasticsearch |
| Python/Go centric | TypeScript SDK less mature |
| Enterprise-focused | Not AI-native |
| No MCP support | Would need custom integration |
| Heavy | Overkill for simple agent tasks |
| No built-in LLM features | Token management, context windows |

---

## Comparison to Nexus Goals

| Temporal | Nexus |
|----------|-------|
| General purpose | AI-agent native |
| Enterprise | Developer-friendly |
| Complex setup | Simple deployment |
| Go/Java/Python | TypeScript-first |
| No MCP | MCP-first |
| No LLM concepts | Built-in context management |

---

## Code Example

```go
// Define Workflow
func HelloWorldWorkflow(ctx workflow.Context, name string) (string, error) {
    options := workflow.ActivityOptions{
        StartToCloseTimeout: time.Minute,
    }
    ctx = workflow.WithActivityOptions(ctx, options)

    var result string
    err := workflow.ExecuteActivity(ctx, HelloWorldActivity, name).Get(ctx, &result)
    return result, err
}

// Define Activity
func HelloWorldActivity(ctx context.Context, name string) (string, error) {
    return "Hello, " + name, nil
}
```

---

## Resources

- [Docs](https://docs.temporal.io/)
- [Learn Temporal](https://learn.temporal.io/)
- [Community](https://community.temporal.io)
- [Architecture Docs](./docs/architecture/README.md)

---

## Related

- [Trigger.dev](./TRIGGERDEV_RESEARCH.md) — AI-native alternative
- [LangGraph](./LANGGRAPH_RESEARCH.md) — Graph-based alternative
- [Floop Analysis](./FLOOP_ANALYSIS.md) — Competitor comparison
- [Nexus Architecture](../NEXUS_RUNTIME_ARCHITECTURE.md) — How Nexus differs
