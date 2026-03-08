# trigger.dev — Research

**Status:** 🔵 CORE  
**Reference:** [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev) (13.9K stars, Apache 2.0)  
**Use:** f.loop / Background execution layer - CORE of Aitlas

---

## Overview

**trigger.dev** = Open-source platform for building AI workflows in TypeScript.

> "Build and deploy fully-managed AI agents and workflows. Long-running tasks with retries, queues, observability, and elastic scaling."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Long-running** | No timeouts (unlike Lambda/Vercel) |
| **Durable** | Checkpointing, retries, queues |
| **Human-in-the-loop** | Pause for approval/rejection |
| **Real-time** | Streaming + live updates |
| **Cron schedules** | Scheduled tasks up to 1 year |
| **MCP support** | Built-in MCP server! |
| **Observability** | Full tracing & logging |
| **Self-hosted** | Can run yourself |

---

## For Aitlas: f.loop

### This IS what f.loop should be!

f.loop (our background execution) = trigger.dev

```
┌─────────────────────────────────────────┐
│              f.loop                         │
│        (trigger.dev-based)                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │       trigger.dev (core)           │  │
│  │  • Long-running tasks             │  │
│  │  • Durable (checkpoints)           │  │
│  │  • Retries & queues              │  │
│  │  • Human-in-the-loop             │  │
│  │  • Real-time streaming           │  │
│  │  • Cron schedules                │  │
│  │  • MCP support                  │  │
│  │  • Observability                │  │
│  └───────────────────────────────────┘  │
│                  │                        │
│  ┌───────────────────────────────────┐  │
│  │       Aitlas Layer                 │  │
│  │  • BYOK (user's LLM key)         │  │
│  │  • Credit billing                 │  │
│  │  • Integration with Nexus         │  │
│  │  • Integration with Actions      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### What trigger.dev Gives Us

| Feature | Aitlas Use |
|---------|------------|
| Long-running | ✅ f.loop handles long tasks |
| Durable | ✅ Checkpointing survives failures |
| Retries | ✅ Automatic retry on error |
| Queues | ✅ Task queuing |
| Human-in-the-loop | ✅ Approval workflows |
| Real-time | ✅ SSE to Nexus |
| Cron | ✅ Scheduled tasks |
| MCP | ✅ MCP integration |
| Observability | ✅ Full tracing |

---

## Comparison

| Feature | trigger.dev | Our Current f.loop |
|---------|-------------|-------------------|
| Stars | 13.9K | - |
| License | Apache 2.0 | - |
| Production-ready | ✅ | WIP |
| MCP | ✅ | Need to add |
| BYOK | ❌ | Need to add |
| Credit billing | ❌ | Need to add |

---

## Integration Path

### Option 1: Use trigger.dev as-is
- Deploy trigger.dev (self-hosted or cloud)
- Add BYOK layer on top
- Add credit billing

### Option 2: Build our own (based on trigger.dev patterns)
- Study trigger.dev architecture
- Build f.loop following their patterns
- Add Aitlas-specific features

---

## Next Steps

1. **Evaluate** trigger.dev for f.loop
2. **Consider** self-hosted vs cloud
3. **Design** BYOK integration
4. **Add** credit billing

---

## References

- [trigger.dev GitHub](https://github.com/triggerdotdev/trigger.dev)
- [trigger.dev Docs](https://trigger.dev/docs)
- [trigger.dev Website](https://trigger.dev)

---

*Status: 🔵 CORE - This IS what f.loop should be!*
