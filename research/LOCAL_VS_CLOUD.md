# Local vs Cloud Architecture

**Last Updated:** 2026-03-08  
**Purpose:** Explain where data lives, what's local vs cloud, and how components connect

---

## The Question: Where is ~/.aitlas/?

**Short Answer:** `~/.aitlas/` is **LOCAL** to the user's machine, managed by `aitlas-cli`. It syncs WITH Nexus (cloud), but lives on your machine.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER'S MACHINE (Local)                       │
│                                                                 │
│  ~/.aitlas/                    ← Managed by aitlas-cli          │
│  ├── instincts/                ← Learned patterns               │
│  │   ├── personal/             ← Auto-learned globally          │
│  │   ├── inherited/            ← Imported from others           │
│  │   └── projects/             ← Project-specific               │
│  │       ├── f-twyt-abc123/                                     │
│  │       └── nexus-def456/                                      │
│  ├── config.json               ← User preferences               │
│  ├── credentials/              ← API keys (encrypted)           │
│  └── cache/                    ← Local cache                     │
│                                                                 │
│  aitlas-cli                    ← Local CLI tool                  │
│  - Manages ~/.aitlas/                                           │
│  - Syncs with Nexus                                             │
│  - Runs local agents                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                              │ HTTPS API
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    AITLAS CLOUD (Remote)                        │
│                                                                 │
│  nexus.aitlas.xyz              ← Main UI + orchestration         │
│  ├── Threads DB                ← Persistent conversations       │
│  ├── Memory DB                 ← Semantic memory (pgvector)     │
│  ├── Tasks DB                  ← Symphony-style tasks           │
│  ├── Agents (active)           ← Spawned agents                 │
│  └── Tool Registry             ← Enabled actions + MCPs         │
│                                                                 │
│  agents.aitlas.xyz             ← Agent marketplace               │
│  ├── Agent Manifests           ← Skills + prompts + tools       │
│  ├── Reviews                   ← Social proof                   │
│  └── Author Dashboard          ← Submit agents                  │
│                                                                 │
│  f.xyz                         ← Actions (tools)                 │
│  ├── f.twyt                    ← Twitter                        │
│  ├── f.guard                   ← Security                       │
│  ├── f.library                 ← Assets                         │
│  ├── f.support                 ← Support                        │
│  ├── f.rsrx                    ← Research                       │
│  ├── f.decloy                  ← Deployment                     │
│  └── f.loop                    ← Ralph engine                   │
│                                                                 │
│  f.loop (Ralph Engine)         ← Durable execution               │
│  ├── Observes                  ← Monitors tasks                 │
│  ├── Reasons                   ← Decides next action            │
│  ├── Acts                      ← Executes via agents            │
│  └── Repeats                   ← Continuous loop                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Lives Where

### Local (~/.aitlas/)

| Path | Purpose | Who Manages |
|------|---------|-------------|
| `~/.aitlas/instincts/` | Learned patterns from your usage | aitlas-cli |
| `~/.aitlas/config.json` | User preferences, defaults | aitlas-cli |
| `~/.aitlas/credentials/` | API keys (encrypted) | aitlas-cli |
| `~/.aitlas/cache/` | Local cache for speed | aitlas-cli |
| `~/.aitlas/workspaces/` | Isolated task workspaces | f.loop (local mode) |

### Cloud (Nexus DB)

| Table | Purpose | Who Manages |
|-------|---------|-------------|
| `threads` | Persistent conversations | Nexus |
| `messages` | Chat history | Nexus |
| `memory` | Semantic memory (pgvector) | Nexus |
| `tasks` | Symphony-style tasks | Nexus |
| `agents` | Active agent instances | Nexus |
| `actions` | Enabled f.xyz actions | Nexus |

---

## How They Sync

### Sync Flow

```
User works in Nexus (web)
        │
        ▼
Nexus captures all tool calls
        │
        ▼
PostgreSQL: observations table (per user)
        │
        ▼
Background worker (f.loop) analyzes
        │
        ├─ Project-specific instinct → ~/.aitlas/instincts/projects/<hash>/
        └─ Universal instinct → ~/.aitlas/instincts/personal/
        │
        ▼
aitlas-cli syncs instincts to local machine
        │
        ▼
Next session: instincts loaded into context
```

### API Endpoints for Sync

```
POST /api/sync/instincts         → Upload local instincts to cloud
GET  /api/sync/instincts         → Download cloud instincts to local
POST /api/sync/observations      → Upload tool call observations
GET  /api/sync/config            → Get user config
```

---

## When Each Is Used

### Local (~/.aitlas/) Used When:

1. **Running aitlas-cli** - Local agent execution
2. **Offline work** - Cache for when offline
3. **Privacy-sensitive** - Keep some learning local
4. **Project-specific rules** - Per-project instincts
5. **Credential storage** - API keys never leave machine

### Cloud (Nexus) Used When:

1. **Using web UI** - nexus.aitlas.xyz
2. **Multi-device** - Access from anywhere
3. **Team collaboration** - Shared agents, tasks
4. **Long-running tasks** - f.loop execution
5. **Agent marketplace** - Browse, install agents

---

## The Confusion: ECC's ~/.claude/ vs Aitlas

### How ECC Does It

```
~/.claude/                      ← Everything in ONE place
├── homunculus/                 ← Central brain
│   ├── instincts/              ← All learning
│   ├── skills/                 ← Extracted patterns
│   └── config.json             ← Settings
└── agents/                     ← Agent prompts
```

**ECC is single-harness** - one Claude Code instance, one user, one machine.

### How Aitlas Does It

```
~/.aitlas/                      ← LOCAL brain (CLI)
├── instincts/                  ← Personal learning
├── config.json                 ← Preferences
└── credentials/                ← Keys

nexus.aitlas.xyz                ← CLOUD brain (UI)
├── threads DB                  ← Conversations
├── memory DB                   ← Semantic memory
├── tasks DB                    ← Tasks
└── agents                      ← Active agents

agents.aitlas.xyz               ← MARKETPLACE
├── agent manifests             ← Templates
└── community agents            ← Shared

f.xyz                           ← TOOLS
└── actions                     ← Mini-apps + utilities
```

**Aitlas is multi-component** - CLI + Web UI + Marketplace + Tools, all connected.

---

## Why Split Local/Cloud?

### Benefits of Local (~/.aitlas/)

1. **Privacy** - Some learning stays on your machine
2. **Speed** - Local cache, no network latency
3. **Offline** - Work without internet
4. **Project-specific** - Different rules per project
5. **Credentials** - API keys never leave machine

### Benefits of Cloud (Nexus)

1. **Multi-device** - Access from anywhere
2. **Collaboration** - Team features
3. **Always-on** - f.loop runs 24/7
4. **Marketplace** - Browse, install agents
5. **Backup** - Never lose data

---

## Implementation

### aitlas-cli Commands

```bash
# Initialize local brain
aitlas init

# Sync with cloud
aitlas sync

# View local instincts
aitlas instincts list

# Add instinct
aitlas instincts add "prefer-functional-style"

# Run local agent
aitlas run "frontend-wizard"

# Connect to project
aitlas connect ./my-project
```

### Nexus Settings

```typescript
// In Nexus settings page
{
  "sync": {
    "enabled": true,
    "sync_instincts": true,      // Sync learned patterns
    "sync_config": true,          // Sync preferences
    "sync_credentials": false     // NEVER sync API keys
  }
}
```

---

## Summary

| Question | Answer |
|----------|--------|
| Where is ~/.aitlas/? | LOCAL on user's machine |
| Who manages it? | aitlas-cli |
| What's in it? | Instincts, config, credentials, cache |
| How does it connect to Nexus? | API sync |
| When is it used? | CLI usage, offline, privacy-sensitive |
| When is Nexus used? | Web UI, multi-device, collaboration |
| Is Aitlas BYOK? | **YES** - User provides model API keys |

**Key Insight:** ~/.aitlas/ is your personal brain that syncs with the cloud brain (Nexus). They complement each other, they don't replace each other.

---

## BYOK (Bring Your Own Keys)

**Aitlas is a BYOK product.** Users provide their own model API keys.

### Why BYOK?

| Benefit | Explanation |
|---------|-------------|
| **User owns costs** | Pay only for what you use |
| **Privacy** | Keys stay on user's machine |
| **Flexibility** | Use any model (GPT-4, Claude, GLM-5, etc.) |
| **No markup** | We don't charge for model usage |
| **Transparency** | User sees exact API costs |

### What We Provide (Paid)

| Feature | Free | Pro ($20/mo) |
|---------|------|--------------|
| Use your own model | ✅ | ✅ |
| Chat UI | ✅ | ✅ |
| Basic tools | ✅ | ✅ |
| f.xyz Actions | ❌ | ✅ |
| Agents Store | ❌ | ✅ |
| Memory (pgvector) | ❌ | ✅ |
| Tasks (Symphony) | ❌ | ✅ |
| f.loop orchestration | ❌ | ✅ |
| Multi-agent teams | ❌ | ✅ |

### How It Works

```
User signs up
    ↓
Adds API keys in ~/.aitlas/credentials/
    ├── OPENAI_API_KEY
    ├── ANTHROPIC_API_KEY
    ├── GLM_API_KEY
    └── etc.
    ↓
Selects model in Nexus settings
    ↓
All agent calls use user's key
    ↓
We provide orchestration, tools, memory
```

### Key Storage

API keys are stored locally in `~/.aitlas/credentials/` and **never sent to our servers**:

```bash
~/.aitlas/credentials/
├── openai.key      # Encrypted at rest
├── anthropic.key   # Encrypted at rest
└── glm.key         # Encrypted at rest
```

**Encryption:** AES-256-GCM, key derived from user password.

---

## File Locations

This file is shared across all templates:
- `aitlas-ui-template/docs/architecture/LOCAL_VS_CLOUD.md`
- `aitlas-action-template/docs/LOCAL_VS_CLOUD.md`
- `aitlas-worker-template/docs/LOCAL_VS_CLOUD.md`
- `aitlas-cli/docs/LOCAL_VS_CLOUD.md`