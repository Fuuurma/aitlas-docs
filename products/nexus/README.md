# Nexus — Agent Runtime

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

## Overview

Nexus is the **agent runtime** — the execution engine that runs AI agents.

**Foundation:** Cloned from [trigger.dev](https://github.com/triggerdotdev/trigger.dev) — customized for AI agents.

---

## Core Files

| File | Description |
|------|-------------|
| [nexus.md](./nexus.md) | Complete runtime specification (41KB) |
| [nexus-implementation.md](./nexus-implementation.md) | Implementation details |
| [ORCHESTRATION_MOAT.md](./ORCHESTRATION_MOAT.md) | Competitive analysis |
| [SYMPHONY_INTEGRATION.md](./SYMPHONY_INTEGRATION.md) | Symphony integration |

---

## Architecture

```
User Input → Nexus → Agent Loop → Tools → Memory → Response
                     ↑
              (5-Phase Loop)
              PLAN → REFLECT → ACT → OBSERVE → STORE
```

---

## Key Features

- **Durable Execution** — Tasks persist through failures
- **Auto-retry** — Built-in retry policies
- **Real-time SSE** — Live progress streaming
- **MCP-native** — First-class MCP tool support
- **Multi-provider** — OpenAI, Anthropic, Google

---

## Related

- [Nexus Research](../research/nexus/) — Competitor analysis
- [MASTER_ARCHITECTURE](../../architecture/MASTER_ARCHITECTURE.md) — Full system spec
