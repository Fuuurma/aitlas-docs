# Nova — The Web UI

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Domain:** nova.aitlas.xyz  
**Status:** 🟡 Development  
**Stack:** Next.js 15, Bun, Neon Postgres, Prisma 6, Better Auth, T3 Code

---

## Overview

**Nova** = The Aitlas Web UI (formerly Nexus).

It's based on **T3 Code** and connects to multiple AI providers:
- **Codex** (OpenAI)
- **Claude Code** (Anthropic)
- **OpenCode** (independent)
- **Aitlas** (via Nexus orchestration)

---

## Strategic Value

Nova is the **main hub** where users:
- Chat with AI (via Codex/Claude/OpenCode/Aitlas)
- Manage their account
- View dashboard & stats
- Track tasks (Symphony integration)
- Connect to Actions (f.xyz)

---

## Core Features

| Feature | Description |
|---------|-------------|
| **AI Chat** | T3 Code clone - chat with Codex/Claude/OpenCode/Aitlas |
| **Dashboard** | Overview, stats, credit balance |
| **Tasks UI** | Symphony integration - track GitHub-linked tasks |
| **Account/Settings** | Profile, preferences, API keys |
| **Connections** | Link to f.xyz actions |
| **Agents Store** | Hire agents from marketplace |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  NEXUS (nexus.aitlas.xyz)                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    T3 Code Core                          │  │
│  │  • Chat interface                                       │  │
│  │  • Thread management                                    │  │
│  │  • Model selector (Codex/Claude/OpenCode/Aitlas)       │  │
│  │  • Tool execution                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Additional Features                   │  │
│  │  • Dashboard                                           │  │
│  │  • Tasks UI (Symphony)                                 │  │
│  │  • Account & Settings                                  │  │
│  │  • Action Connections (f.xyz)                          │  │
│  │  • Agents Store integration                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    External Integrations                        │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Codex    │  │Claude Code │  │     OpenCode       │  │
│  │ (OpenAI)  │  │(Anthropic)│  │   (Independent)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   f.xyz Actions                          │  │
│  │  f.twyt • f.pay • f.health • f.mcp • f.research • ...  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   Nexus runtime (Background)                   │  │
│  │            Long-running tasks via Symphony              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Payment Models

| Provider | Payment |
|----------|---------|
| **Aitlas** | Credits OR Subscription |
| Codex | OpenAI pricing |
| Claude Code | Anthropic pricing |
| OpenCode | OpenCode pricing |

---

## BYOK (Bring Your Own Key)

Users provide their own API keys:
- **OpenAI** - for Codex
- **Anthropic** - for Claude Code
- **DeepSeek** - for alternative
- **Gemini** - for alternative

Keys are encrypted (AES-256-GCM) and stored in DB. We never see them.

---

## Dual-Mode System

| Mode | Description | Requirements |
|------|-------------|--------------|
| **Standard** | Basic chat, no tools | API key |
| **Agentic** | Tools, agents, background tasks | API key + Credits |

---

## Task Integration (Symphony)

Nexus integrates with **Symphony** for task management:
- Connect GitHub repositories
- Track issues as tasks
- Background execution via Nexus runtime
- Real-time progress via SSE

---

## Credit System

Aitlas uses credits for:
- Action calls (f.xyz tools)
- Nexus runtime compute time
- Premium features

Users buy credits or subscribe. Other providers use their own pricing.

---

## Development Phases

**Phase 1 — Foundation**
- [ ] T3 Code clone setup
- [ ] Auth (Better Auth)
- [ ] BYOK key management

**Phase 2 — Core Chat**
- [ ] Model selector (Codex/Claude/OpenCode/Aitlas)
- [ ] Thread management
- [ ] Basic chat

**Phase 3 — Features**
- [ ] Dashboard
- [ ] Tasks UI (Symphony)
- [ ] Account/Settings
- [ ] Action connections

**Phase 4 — Agents**
- [ ] Agents Store integration
- [ ] Agent activation

---

## Repo

**GitHub:** https://github.com/Fuuurma/aitlas-nexus

---

*Last Updated: March 9, 2026*