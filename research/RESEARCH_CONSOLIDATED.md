# Research: Frameworks & Integrations

**Consolidated research for Aitlas development.**

---

## Table of Contents

1. [Agentic Frameworks](#1-agentic-frameworks)
2. [OpenSandbox Integration](#2-opensandbox-integration)
3. [Dexter Integration](#3-dexter-integration)
4. [Coding Agent References](#4-coding-agent-references)
5. [Deployment Models](#5-deployment-models)

---

## 1. Agentic Frameworks

### Tier 1 - Coding Agents (BYOK)

| Project | Stars | License | Key Feature |
|---------|-------|---------|-------------|
| **OpenCode** | ~20K | MIT | Provider-agnostic, TUI + Desktop |
| **Cline** | ~50K | Apache 2.0 | VS Code extension, autonomous |
| **Aider** | ~30K | Apache 2.0 | Pair programming, git-aware |
| **Cursor** | ~100K | Proprietary | IDE with AI, codebase search |

### Tier 2 - Multi-Agent Orchestration

| Project | Stars | License | Key Feature |
|---------|-------|---------|-------------|
| **CrewAI** | 44K+ | MIT | Role-based agents, Crews + Flows |
| **LangGraph** | 50K+ | MIT | Graph-based workflows, stateful |
| **OpenAI Agents SDK** | 19K+ | MIT | Lightweight, Python-first, handoffs |
| **Microsoft Agent Framework** | ~10K | MIT | Python + .NET, graph orchestration |

### Tier 3 - Parallel Execution

| Project | Stars | License | Key Feature |
|---------|-------|---------|-------------|
| **Agent Orchestrator** | ~2K | MIT | Parallel coding agents, git worktrees |

### What We Learned

**BYOK is standard** - All tools support user-provided API keys

**$20/mo is market rate** - Cursor, Windsurf, etc. all charge ~$20/month

**Memory/planning is key differentiator** - This is what separates tools from each other

**Tool ecosystem is critical** - Pre-built tools = faster adoption

---

## 2. OpenSandbox Integration

### Overview

**OpenSandbox** is an open-source code execution sandbox - PERFECT FIT for Aitlas execution layer.

**Repo:** `OpenLogicProject/OpenSandbox`  
**License:** MIT  
**Features:** Docker-based, secure, multi-language

### Why It's Perfect

| Need | OpenSandbox Solution |
|------|---------------------|
| Execute code safely | Docker sandbox isolation |
| Support multiple languages | Python, JavaScript, TypeScript, etc. |
| Resource limits | CPU, memory, time constraints |
| Stateless execution | No persistent state between runs |
| API access | REST API for code execution |

### Integration Architecture

```
f.loop Worker
     │
     ▼
Tool Gateway
     │
     ▼
OpenSandbox API
     │
     ▼
Docker Container (isolated)
     │
     ▼
Code Execution Result
```

### Use Cases

1. **f.coder** - Execute generated code safely
2. **f.hacker** - Run security tools in sandbox
3. **f.researcher** - Execute data analysis scripts
4. **f.decloy** - Test deployments before production

### Implementation

```typescript
// Tool Gateway integration
const sandbox = new OpenSandboxClient({
  apiUrl: process.env.OPENSANDBOX_URL,
  timeout: 30000, // 30 seconds
  memory: '512m',
  cpu: '0.5'
});

const result = await sandbox.execute({
  language: 'python',
  code: generatedCode
});
```

---

## 3. Dexter Integration

### Overview

**Dexter** is a financial research agent - excellent reference for f.investor and f.researcher.

**Repo:** `virattt/dexter`  
**License:** MIT  

### Key Patterns to Adopt

| Pattern | Description | Use in Aitlas |
|---------|-------------|---------------|
| **Scratchpad Logging** | Agent writes reasoning to file | Debugging, transparency |
| **Task Decomposition** | Break complex goals into subtasks | f.loop planning |
| **Self-Validation** | Agent checks own work before completion | REFLECT phase |
| **Safety Limits** | Max steps, max cost, timeout | f.loop guardrails |

### Architecture

```
User Query
     │
     ▼
Task Decomposition (LLM)
     │
     ├──► Subtask 1 → Tool → Result
     ├──► Subtask 2 → Tool → Result
     └──► Subtask 3 → Tool → Result
            │
            ▼
     Self-Validation (LLM)
            │
            ▼
     Final Report
```

### Integration Options

**Option A: f.financial-research Action**
- MCP tool that wraps Dexter
- Use for financial research tasks
- Return structured reports

**Option B: f.financial-researcher Agent**
- Agent with Dexter-like behavior
- Use system prompt patterns
- Full autonomy for financial analysis

**Recommendation:** Hybrid - action for simple queries, agent for complex research

---

## 4. Coding Agent References

### Codex (OpenAI)

**Key patterns:**
- Task-based execution
- Git integration
- Code review automation

### PI (Inflection)

**Key patterns:**
- Conversational AI
- Multi-modal input
- Emotional intelligence

### MCP Integration

**Model Context Protocol** - Standard for tool integration

```json
{
  "name": "f.tool",
  "description": "Tool description",
  "input": { "type": "object", "properties": {...} },
  "execute": async (input) => { ... }
}
```

---

## 5. Deployment Models

### BYOK (Bring Your Own Key)

**What it means:**
- User provides API keys (OpenAI, Anthropic, etc.)
- Aitlas never sees or stores the keys in plaintext
- Keys encrypted at rest, decrypted only in memory

**Benefits:**
- No markup on API costs
- User controls their data
- Privacy-focused

**Implementation:**
```typescript
// User provides key
const encryptedKey = await encrypt(userApiKey, ENCRYPTION_KEY);

// Worker decrypts for execution
const decryptedKey = await decrypt(encryptedKey, ENCRYPTION_KEY);
const client = new OpenAI({ apiKey: decryptedKey });
```

### Local vs Cloud

| Mode | Data | Cost | Speed |
|------|------|------|-------|
| Local (BYOK) | Stays on device | User pays API | Depends on API |
| Cloud (Subscription) | On Aitlas servers | $20/mo unlimited | Optimized |

### Pricing Rationale

**$20/mo** matches market rate (Cursor, Windsurf, etc.)

**Credits** for occasional users ($5 = 500 credits)

**Free tier** = BYOK only, no memory/persistence

---

## Key Insights

### From System Prompts Research

**Source:** https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools

**30,000+ lines** of system prompts from 25+ AI coding tools

**Common patterns:**
1. Conciseness enforced via explicit rules
2. Tool calling is expensive - minimize calls
3. Memory/planning is the differentiator
4. Security boundaries are strict

### From Wealth Architect Prompt

**Professional system prompt structure:**
1. System Identity (role, persona, forbidden behaviors)
2. Activation Protocol (exact first output)
3. Diagnostic Protocol (data collection)
4. Frameworks (phases, blockers)
5. Output Structure (sections)
6. Ongoing Rules (accountability)

---

**Last Updated:** 2026-03-08