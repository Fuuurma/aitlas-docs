# Nexus Runtime Architecture — Deep Research

**Status:** 🔵 ACTIVE RESEARCH  
**Date:** 2026-03-09  
**Focus:** Agent runtime layer design

---

## Overview

This document captures critical design decisions for **Nexus** — the runtime layer of Aitlas. Many AI platforms fail by mixing UI, runtime, memory, tools, and providers into one system. Aitlas separates these concerns cleanly:

| Component | Responsibility |
|-----------|---------------|
| **Nova** | UI (chat, dashboard, tasks) |
| **Nexus** | Runtime (execution, orchestration) |
| **Actions** | Apps (f.xyz MCP tools) |
| **Agents** | Behavior (config, prompts) |
| **MCP** | Integrations |

---

## 1. Tool Calling Architecture

### Hierarchy

```
Agents → Skills → Actions → MCP
```

**Agents** — High-level behavior
- system prompt
- skills
- actions
- memory policy
- permissions

**Skills** — Core primitive capabilities
```
web_search, summarize, reason, plan, code_edit, task_planning, memory_recall
```

**Actions** — Ecosystem apps (f.xyz)
```
f.research, f.library, f.crypto, f.pay, f.scrape, f.crm
```

**MCP** — External integrations
```
Google Drive, Slack, Figma, Notion, GitHub
```

---

## 2. Core Read/Write Tools

Every agent runtime needs **core tools** living in Nexus (not actions):

### Filesystem
```
filesystem.read
filesystem.write
filesystem.list
filesystem.search
```

### HTTP
```
http.fetch
http.post
```

### Tasks
```
task.create
task.update
task.search
```

### Memory
```
memory.store
memory.retrieve
```

### User
```
user.profile
workspace.info
```

Think of these as **operating system tools** — they must always exist.

---

## 3. Filesystem Access & Permission Layers

Powerful but risky. Use **scopes**:

```
project/      → agent: code-assistant
workspace/    → agent: personal-assistant  
user/         → agent: user-assistant
system/       → restricted
```

Without scoping:
- agents read private files
- agents leak secrets
- agents modify system configs

Enforce: `scope + permissions + rate limits`

---

## 4. Memory vs Library

### f.memory — Agent memory
- user preferences
- facts
- previous conversations
- task outcomes
- Storage: vector embeddings (pgvector), structured data

### f.library — Documents and files
- PDFs, notes, datasets, code, images
- Agents retrieve via: `library.search`, `library.read`, `library.chunk`

**Concept:**
```
f.memory → knowledge about the user
f.library → documents and artifacts
```

Both feed context into Nexus.

---

## 5. Multimodal I/O

### Input Types (native to Nexus, not actions)
```
text, images, audio, video, files
```

Example message:
```json
{
  "role": "user",
  "content": [
    {"type": "text", "content": "Analyze this"},
    {"type": "image", "url": "..."}
  ]
}
```

### Output Types
```
text, files, images, structured JSON, audio, video
```

Nexus normalizes all tool outputs. Nova renders them.

---

## 6. Context Builder

Before every model call, Nexus assembles:

```
system prompt
agent config
relevant memory
library documents
recent conversation
tool schemas
```

Then compacts to fit context window:
- truncate history
- summarize old messages
- retrieve relevant docs

---

## 7. Suggested Nexus Runtime Layers

```
Nexus Runtime
├── Agent Manager
├── Task Engine
├── Context Builder
├── Tool Orchestrator
├── Memory Engine
├── Library Retrieval
├── Permission System
└── Provider Adapter (OpenAI, Anthropic, Google, local)
```

---

## 8. Task Engine Model

Everything is a **task**:

```typescript
Task {
  id: string
  agent: string
  status: TaskStatus
  inputs: any
  outputs: any
  step: number
  metadata: any
}

enum TaskStatus {
  PENDING
  RUNNING
  WAITING_TOOL
  WAITING_MODEL
  COMPLETED
  FAILED
}
```

### Task Loop
```
Agent Request → Task Queue → Worker → Execution Step → State Stored → Next Step Scheduled
```

This allows agents to:
- pause / resume
- retry on failure
- run long workflows
- scale horizontally

---

## 9. Worker Architecture

```
API Server
    ↓
Task Queue (Trigger.dev / BullMQ)
    ↓
Workers (model inference, tool execution, file processing, scraping)
```

Workers are stateless. State lives in DB.

---

## 10. The Agent Loop

```
Step 1: build context
Step 2: call model
Step 3: model response
Step 4: if tool → execute tool
Step 5: update memory
Step 6: continue or finish
```

**Key:** Nexus controls the loop, not the model.

---

## 11. Observability (Critical)

Users must see:
- what the agent did
- why it did it
- what tools it used
- what memory it accessed

Without this, the system is a **black box**.

Nova should display:
```
Step 1: reasoning...
Step 2: used f.research
Step 3: read library file
Step 4: wrote summary
```

This is the **best developer experience**.

---

## 12. Minimal Nexus v1

```
Task queue (Trigger.dev)
Agent loop
Tool execution
Context builder
Provider adapter
```

Memory, compaction, multimodal, scheduling can evolve.

---

## Key Insights

1. **Don't build everything from scratch** — use Trigger.dev for workflows
2. **Extract patterns from AutoGen** — don't embed deeply
3. **Multimodal is native to Nexus** — not an action
4. **Separation is strength** — Nova ≠ Nexus ≠ Actions
5. **Observability first** — black boxes fail

---

## Related Research

- [Floop Analysis](./FLOOP_ANALYSIS.md) — Nexus runtime analysis
- [Trigger.dev Research](./TRIGGERDEV_RESEARCH.md) — task orchestration
- [Coze Research](./COZE_RESEARCH.md) — no-code workflow reference
- [Dify Research](./DIFY_RESEARCH.md) — workflow platform reference
