# Symphony (OpenAI) — Research

**Status:** 🔵 Reference  
**Reference:** [openai/symphony](https://github.com/openai/symphony)  
**Stars:** 10.3K ⭐ | **Language:** Elixir | **License:** Apache 2.0  
**Created:** 2025

---

## Overview

> "Symphony turns project work into isolated, autonomous implementation runs, allowing teams to manage work instead of supervising coding agents."

OpenAI's autonomous coding agent system written in **Elixir**.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Linear Integration** | Monitors Linear board for work |
| **Autonomous Agents** | Spawns agents to handle tasks |
| **Proof of Work** | CI status, PR feedback, complexity analysis |
| **Safe Landing** | Agents PRs reviewed before merge |
| **Elixir/OTP** | Built on same stack as Nexus |

---

## Architecture

```
Linear Board
     ↓
Symphony (Elixir)
     ↓
Coding Agents ( Codex)
     ↓
PR with Proof → Human Review → Land
```

---

## For Nexus

### Perfect Fit

| Aspect | Why |
|--------|-----|
| **Language** | Both Elixir! |
| **Use Case** | Autonomous agents |
| **Pattern** | Monitor → Execute → Prove |
| **Scale** | Proven at OpenAI |

### What to Learn

| Pattern | Apply to Nexus |
|---------|----------------|
| Linear integration | Task来源 (Linear, GitHub Issues) |
| Proof of work | Replay + Observability |
| Safe landing | Human-in-loop approvals |
| Agent spawning | Multi-agent orchestration |

### Code Reference

```elixir
# Symphony is Elixir - same as Nexus!
# Check elixir/ folder for implementation
```

---

## Comparison

| Feature | Symphony | Nexus |
|---------|-----------|-------|
| Language | Elixir | Elixir |
| Task Source | Linear | Any (API, Webhook) |
| Coding Agent | Codex | Any (OpenAI, Anthropic) |
| Proof | CI + PR | Replay + Logs |
| Status | Preview | Building |

---

## Related

- [Nexus Technical Architecture](../research/nexus/NEXUS_TECHNICAL_ARCHITECTURE.md)
- [Elixir/OTP](./) — Nexus foundation
