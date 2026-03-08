# Aitlas Architecture Documentation

**Version:** 1.0  
**Last Updated:** 2026-03-08  
**Status:** Design Phase  
**Authors:** Atlas + Sergi

---

## Executive Summary

**Aitlas** is an AI orchestration platform that augments LLM capabilities with persistent memory, intelligent compaction, multi-agent coordination, and a rich tool ecosystem.

**Core Principle:** We don't replace the LLM's brain—we build the orchestration layer around it.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [LLM Capabilities vs Platform Requirements](#2-llm-capabilities-vs-platform-requirements)
3. [Component Architecture](#3-component-architecture)
4. [Memory System](#4-memory-system)
5. [Compaction System](#5-compaction-system)
6. [Tool Ecosystem](#6-tool-ecosystem)
7. [Agent Orchestration](#7-agent-orchestration)
8. [Pricing Tiers](#8-pricing-tiers)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [System Prompts for Agents Store](#10-system-prompts-for-agents-store)
11. [MCP Actions API](#11-mcp-actions-api)
12. [Integration with Nexus](#12-integration-with-nexus)

---

## 1. Architecture Overview

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER                                      │
│                     (API Key Provider)                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NEXUS UI                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Chat    │  │  Code    │  │ Actions  │  │ Memory   │           │
│  │  View    │  │  View    │  │  Panel   │  │  Panel   │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AITLAS ORCHESTRATION LAYER                      │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Memory     │  │  Compaction  │  │   Planner    │              │
│  │    Layer     │  │    Layer     │  │    Layer     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Tool      │  │    Agent     │  │   Context    │              │
│  │   Router     │  │ Orchestrator │  │   Manager    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        LLM PROVIDER                                 │
│               (Claude, GPT-4, Gemini, etc.)                         │
│                                                                      │
│  Built-in: Reasoning, Tool Calling, Context Window, Streaming      │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXECUTION LAYER                                │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Shell   │  │  Files   │  │ Browser  │  │   MCP    │           │
│  │  Exec    │  │  System  │  │  Agent   │  │ Servers  │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. User sends request via Nexus UI
   ↓
2. Tool Router determines available tools
   ↓
3. Memory Layer injects relevant context
   ↓
4. Context Manager checks token count
   ↓ (if >80% full)
5. Compaction Layer summarizes old context
   ↓
6. Planner creates/updates task list
   ↓
7. Request sent to LLM (user's API key)
   ↓
8. LLM returns response + tool calls
   ↓
9. Execution Layer runs tools
   ↓
10. Memory Layer stores learnings
    ↓
11. Response streamed to Nexus UI
```

---

## 2. LLM Capabilities vs Platform Requirements

### What LLMs Provide (Built-in) ✅

| Capability | Description | Provider Support |
|------------|-------------|------------------|
| **Reasoning** | Model's intelligence and problem-solving | All LLMs |
| **Tool Calling** | Function calling API (we define schemas) | Claude, GPT, Gemini |
| **Context Window** | Token limit per session (128K-200K) | All LLMs |
| **Streaming** | Real-time response generation | All LLMs |
| **Code Generation** | Writing code in various languages | All LLMs |
| **Multi-modal** | Image, audio, video processing | Claude, GPT-4V, Gemini |

**Example: Tool Calling (Built-in)**

```json
// We define the schema
{
  "name": "read_file",
  "description": "Read file contents",
  "parameters": {
    "type": "object",
    "properties": {
      "path": { "type": "string" }
    },
    "required": ["path"]
  }
}

// LLM handles the rest
// - Decides when to call
// - Generates parameters
// - Returns structured output
```

### What We Must Build ❌

| Capability | Why LLMs Don't Have It | Complexity | Priority |
|------------|------------------------|------------|----------|
| **Persistent Memory** | LLMs have no memory between sessions | HIGH | P0 |
| **Compaction** | LLMs don't auto-summarize context | MEDIUM | P0 |
| **Agent Orchestration** | Multi-agent coordination not built-in | HIGH | P1 |
| **Codebase Indexing** | Semantic search across files | MEDIUM | P1 |
| **Tool Ecosystem** | Pre-built tools and integrations | LOW | P1 |
| **Planning/State** | Task management, progress tracking | LOW | P2 |
| **Browser Automation** | Web interaction capabilities | MEDIUM | P2 |
| **Shell Execution** | Running commands safely | MEDIUM | P1 |

### Why Each Component Matters

#### 1. Persistent Memory
**Problem:** LLMs start fresh every session. No recollection of past work, preferences, or decisions.

**Solution:** Database-backed memory system with semantic retrieval.

**Impact:**
- Remember user preferences across sessions
- Recall past decisions and rationale
- Build cumulative knowledge over time

#### 2. Compaction
**Problem:** When context fills up, LLMs truncate or error. No intelligent summarization.

**Solution:** Auto-detect when context >80% full, summarize old messages while preserving key information.

**Impact:**
- Unlimited conversation length
- Preserve important context
- Reduce token costs (summary < full history)

#### 3. Agent Orchestration
**Problem:** Complex tasks need multiple agents (researcher, coder, reviewer). LLMs don't coordinate.

**Solution:** CrewAI-style orchestration with role-based agents and handoffs.

**Impact:**
- Parallel task execution
- Specialized agents for different tasks
- Better output quality through collaboration

#### 4. Codebase Indexing
**Problem:** LLMs can't search codebases semantically. They only see what's in context.

**Solution:** QMD-powered hybrid search (BM25 + Vector) across all project files.

**Impact:**
- Find relevant code by meaning, not just exact text
- Understand large codebases quickly
- Better context for code generation

#### 5. Tool Ecosystem
**Problem:** Defining tools from scratch every time is tedious.

**Solution:** Pre-built library of 50+ tools (Git, Docker, Database, API, etc.)

**Impact:**
- Faster development
- Battle-tested tools
- Community contributions

---

## 3. Component Architecture

### 3.1 Memory Layer

**Purpose:** Persistent storage and retrieval of context across sessions.

**Architecture:**

```
┌─────────────────────────────────────────────┐
│            Memory Layer                     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   QMD        │      │  PostgreSQL  │   │
│  │  (Hybrid     │◄────►│  (Structured │   │
│  │   Search)    │      │   Storage)   │   │
│  └──────────────┘      └──────────────┘   │
│         │                      │           │
│         ▼                      ▼           │
│  ┌──────────────┐      ┌──────────────┐   │
│  │  Embeddings  │      │  Memory      │   │
│  │  (Local)     │      │  Records     │   │
│  └──────────────┘      └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Memory Types:**

| Type | Description | Storage | Retrieval |
|------|-------------|---------|-----------|
| **Short-term** | Current session context | In-memory | Direct access |
| **Long-term** | Persistent memories | PostgreSQL + QMD | Semantic search |
| **Episodic** | Task-specific context | PostgreSQL | Time-based |
| **Semantic** | Facts and knowledge | QMD | Hybrid search |

**Memory Lifecycle:**

```
1. CREATE: User provides information
   ↓
2. EMBED: Generate vector embedding (local model)
   ↓
3. STORE: Save to PostgreSQL + QMD index
   ↓
4. RETRIEVE: Query when relevant (semantic match)
   ↓
5. UPDATE: Modify when new information available
   ↓
6. DECAY: Reduce priority if not accessed
```

**API:**

```typescript
interface MemoryLayer {
  // Create memory
  create(memory: {
    type: 'fact' | 'preference' | 'decision' | 'pattern';
    content: string;
    tags?: string[];
    confidence?: number;
  }): Promise<Memory>;
  
  // Search memories (semantic)
  search(query: string, options?: {
    types?: string[];
    tags?: string[];
    limit?: number;
  }): Promise<Memory[]>;
  
  // Get specific memory
  get(id: string): Promise<Memory>;
  
  // Update memory
  update(id: string, updates: Partial<Memory>): Promise<Memory>;
  
  // Delete memory
  delete(id: string): Promise<void>;
}
```

### 3.2 Compaction Layer

**Purpose:** Intelligently summarize context when approaching token limits.

**Architecture:**

```
┌─────────────────────────────────────────────┐
│          Compaction Layer                   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Token      │      │  Summarizer  │   │
│  │   Counter    │─────►│  Agent       │   │
│  └──────────────┘      └──────────────┘   │
│         │                      │           │
│         ▼                      ▼           │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Trigger    │      │   Summary    │   │
│  │   (80% full) │      │   Storage    │   │
│  └──────────────┘      └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Compaction Process:**

```
1. Monitor token count continuously
   ↓
2. When >80% of context window:
   ├─ Identify old messages (>50% of history)
   ├─ Extract key information (decisions, facts, patterns)
   ├─ Generate summary using LLM
   ├─ Preserve recent context (last 20%)
   └─ Replace old messages with summary
   ↓
3. Continue session with compacted context
```

**Summary Format:**

```markdown
# Session Summary (2026-03-08)

## Key Decisions
- Decided to use QMD for hybrid search
- Chose CrewAI for orchestration
- Pricing: $20/mo subscription

## Progress Made
- Created memory system architecture
- Designed compaction workflow
- Documented 50+ tools

## Pending Tasks
- Implement memory layer
- Build compaction logic
- Create tool definitions

## User Preferences
- Prefers concise responses
- Values direct communication
- Wants documentation-first approach
```

**Trigger Thresholds:**

| Model | Context Window | Trigger Threshold | Action |
|-------|---------------|-------------------|--------|
| Claude 3.5 | 200K tokens | >160K (80%) | Compact |
| GPT-4 | 128K tokens | >102K (80%) | Compact |
| Gemini 1.5 | 1M tokens | >800K (80%) | Compact |

### 3.3 Tool Router

**Purpose:** Determine which tools are available for a given task.

**Architecture:**

```
┌─────────────────────────────────────────────┐
│            Tool Router                      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐                          │
│  │   Request    │                          │
│  │   Analyzer   │                          │
│  └──────┬───────┘                          │
│         │                                   │
│         ▼                                   │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Tool       │      │   Tool       │   │
│  │   Registry   │◄────►│   Matcher    │   │
│  └──────────────┘      └──────────────┘   │
│         │                      │           │
│         ▼                      ▼           │
│  ┌──────────────┐      ┌──────────────┐   │
│  │  Available   │      │  Tool Schemas│   │
│  │    Tools     │      │  (for LLM)   │   │
│  └──────────────┘      └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Tool Categories:**

| Category | Tools | Priority |
|----------|-------|----------|
| **Core** | read_file, write_file, edit_file, run_command | P0 |
| **Search** | codebase_search, grep_search, find_file | P0 |
| **Memory** | create_memory, search_memory, update_memory | P0 |
| **Planning** | create_plan, update_plan, add_task | P1 |
| **Git** | git_status, git_commit, git_push, git_pull | P1 |
| **Docker** | docker_build, docker_run, docker_stop | P1 |
| **Database** | query_db, migrate_db, seed_db | P2 |
| **API** | http_get, http_post, http_put | P2 |
| **Browser** | browser_navigate, browser_click, browser_screenshot | P2 |

**Tool Selection Logic:**

```typescript
function selectTools(request: string, context: Context): Tool[] {
  const availableTools: Tool[] = [];
  
  // Always include core tools
  availableTools.push(...CORE_TOOLS);
  
  // Add based on request type
  if (request.includes('file') || request.includes('code')) {
    availableTools.push(...FILE_TOOLS);
  }
  
  if (request.includes('search') || request.includes('find')) {
    availableTools.push(...SEARCH_TOOLS);
  }
  
  if (request.includes('git') || request.includes('commit')) {
    availableTools.push(...GIT_TOOLS);
  }
  
  // Add based on project type
  if (context.projectType === 'web') {
    availableTools.push(...WEB_TOOLS);
  }
  
  // Limit to prevent overwhelming LLM
  return availableTools.slice(0, 50);
}
```

### 3.4 Planner Layer

**Purpose:** Create and manage task lists for complex work.

**Architecture:**

```
┌─────────────────────────────────────────────┐
│            Planner Layer                    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Plan       │      │   Task       │   │
│  │   Creator    │─────►│   Manager    │   │
│  └──────────────┘      └──────────────┘   │
│         │                      │           │
│         ▼                      ▼           │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Plan       │      │   Task       │   │
│  │   Storage    │      │   Queue      │   │
│  └──────────────┘      └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Plan Structure:**

```typescript
interface Plan {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies: string[]; // Task IDs
  assignee?: string; // Agent ID
  result?: any;
}
```

**Planning Workflow:**

```
1. User makes request
   ↓
2. Plan Creator analyzes complexity
   ├─ Simple (<3 steps): Execute directly
   └─ Complex (>3 steps): Create plan
   ↓
3. Plan Creator generates tasks
   ↓
4. Task Manager prioritizes and queues
   ↓
5. Execute tasks sequentially/parallel
   ↓
6. Update task status as work progresses
   ↓
7. Mark plan complete when all tasks done
```

---

## 4. Memory System

### 4.1 Memory Types

#### Short-term Memory
**Purpose:** Current session context, conversation history.

**Storage:** In-memory (Redis or similar).

**Retention:** Duration of session.

**Access:** Fast, direct.

#### Long-term Memory
**Purpose:** Persistent facts, preferences, decisions.

**Storage:** PostgreSQL + QMD index.

**Retention:** Indefinite (with decay).

**Access:** Semantic search.

#### Episodic Memory
**Purpose:** Task-specific context, project state.

**Storage:** PostgreSQL.

**Retention:** Task duration + archive.

**Access:** Query by task/project ID.

#### Semantic Memory
**Purpose:** Knowledge base, learned patterns.

**Storage:** QMD index.

**Retention:** Indefinite.

**Access:** Hybrid search.

### 4.2 Memory Schema

```sql
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- fact, preference, decision, pattern
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- For semantic search
  tags TEXT[],
  confidence FLOAT DEFAULT 0.8,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Optional TTL
);

CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_tags ON memories USING GIN(tags);
```

### 4.3 Memory Operations

#### Create Memory

```typescript
async function createMemory(input: {
  type: MemoryType;
  content: string;
  tags?: string[];
  confidence?: number;
}): Promise<Memory> {
  // 1. Generate embedding (local model)
  const embedding = await generateEmbedding(input.content);
  
  // 2. Store in PostgreSQL
  const memory = await db.memories.create({
    ...input,
    embedding,
    confidence: input.confidence ?? 0.8,
  });
  
  // 3. Index in QMD
  await qmd.index(memory);
  
  return memory;
}
```

#### Search Memory

```typescript
async function searchMemory(query: string, options?: {
  types?: MemoryType[];
  tags?: string[];
  limit?: number;
}): Promise<Memory[]> {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Hybrid search via QMD (BM25 + Vector)
  const results = await qmd.search({
    query,
    embedding: queryEmbedding,
    filters: options,
    limit: options?.limit ?? 10,
  });
  
  // 3. Update access counts
  await db.memories.updateMany({
    where: { id: { in: results.map(r => r.id) } },
    data: { 
      access_count: { increment: 1 },
      last_accessed: new Date(),
    },
  });
  
  return results;
}
```

#### Inject Memory into Context

```typescript
async function injectMemory(
  context: Message[],
  query: string
): Promise<Message[]> {
  // 1. Search for relevant memories
  const memories = await searchMemory(query, { limit: 5 });
  
  if (memories.length === 0) {
    return context;
  }
  
  // 2. Format as context message
  const memoryContext = formatMemories(memories);
  
  // 3. Inject at beginning of context
  return [
    { role: 'system', content: memoryContext },
    ...context,
  ];
}
```

### 4.4 Memory Decay

**Purpose:** Prioritize frequently accessed memories, deprecate stale ones.

**Algorithm:**

```typescript
function calculateMemoryPriority(memory: Memory): number {
  const age = Date.now() - memory.created_at.getTime();
  const daysSinceCreation = age / (1000 * 60 * 60 * 24);
  
  const daysSinceAccess = memory.last_accessed
    ? (Date.now() - memory.last_accessed.getTime()) / (1000 * 60 * 60 * 24)
    : daysSinceCreation;
  
  // Decay factor: reduce priority for old, unaccessed memories
  const decayFactor = Math.exp(-daysSinceAccess / 30); // 30-day half-life
  
  // Boost for access count
  const accessBoost = Math.log10(memory.access_count + 1);
  
  // Confidence weight
  const confidenceWeight = memory.confidence;
  
  return decayFactor * (1 + accessBoost) * confidenceWeight;
}
```

---

## 5. Compaction System

### 5.1 Token Counting

**Methods:**

1. **Approximate:** Character count / 4 (fast, rough estimate)
2. **Accurate:** Use tokenizer library (tiktoken for GPT, similar for Claude)
3. **API:** Some providers return token counts in responses

**Implementation:**

```typescript
import { Tiktoken } from 'tiktoken';

class TokenCounter {
  private encoder: Tiktoken;
  
  constructor(model: string) {
    this.encoder = new Tiktoken(getEncodingForModel(model));
  }
  
  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }
  
  countMessages(messages: Message[]): number {
    // Account for message overhead (role, formatting)
    let total = 0;
    for (const msg of messages) {
      total += 4; // Message overhead
      total += this.countTokens(msg.content);
      total += this.countTokens(msg.role);
    }
    total += 2; // Conversation overhead
    return total;
  }
}
```

### 5.2 Compaction Triggers

**Threshold-based:**

```typescript
const TRIGGER_THRESHOLD = 0.8; // 80% of context window

function shouldCompact(context: Message[], maxTokens: number): boolean {
  const currentTokens = tokenCounter.countMessages(context);
  return currentTokens > maxTokens * TRIGGER_THRESHOLD;
}
```

**Size-based:**

```typescript
const MAX_MESSAGES = 100; // Maximum messages before compaction

function shouldCompactBySize(context: Message[]): boolean {
  return context.length > MAX_MESSAGES;
}
```

### 5.3 Summarization Process

**Step 1: Identify Messages to Compact**

```typescript
function identifyMessagesToCompact(context: Message[]): {
  toCompact: Message[];
  toKeep: Message[];
} {
  // Keep last 20% of messages (recent context)
  const keepCount = Math.ceil(context.length * 0.2);
  const toKeep = context.slice(-keepCount);
  
  // Compact the rest
  const toCompact = context.slice(0, -keepCount);
  
  return { toCompact, toKeep };
}
```

**Step 2: Extract Key Information**

```typescript
async function extractKeyInformation(messages: Message[]): Promise<{
  decisions: string[];
  facts: string[];
  patterns: string[];
  progress: string[];
  pending: string[];
}> {
  const prompt = `
Analyze the following conversation and extract:

1. Key decisions made
2. Important facts learned
3. Patterns identified
4. Progress made
5. Pending tasks

Messages:
${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Format as JSON.
  `;
  
  const extraction = await llm.generate(prompt, { responseFormat: 'json' });
  return JSON.parse(extraction);
}
```

**Step 3: Generate Summary**

```typescript
async function generateSummary(info: KeyInformation): Promise<string> {
  const prompt = `
Create a concise summary of the session so far.

Key Decisions:
${info.decisions.map(d => `- ${d}`).join('\n')}

Important Facts:
${info.facts.map(f => `- ${f}`).join('\n')}

Progress Made:
${info.progress.map(p => `- ${p}`).join('\n')}

Pending Tasks:
${info.pending.map(t => `- ${t}`).join('\n')}

Keep the summary under 500 tokens. Focus on actionable information.
  `;
  
  return await llm.generate(prompt);
}
```

**Step 4: Replace Old Context**

```typescript
async function compactContext(
  context: Message[],
  maxTokens: number
): Promise<Message[]> {
  // 1. Check if needed
  if (!shouldCompact(context, maxTokens)) {
    return context;
  }
  
  // 2. Identify messages
  const { toCompact, toKeep } = identifyMessagesToCompact(context);
  
  // 3. Extract key info
  const keyInfo = await extractKeyInformation(toCompact);
  
  // 4. Generate summary
  const summary = await generateSummary(keyInfo);
  
  // 5. Create new context
  const summaryMessage: Message = {
    role: 'system',
    content: `[Previous Session Summary]\n\n${summary}`,
  };
  
  // 6. Store summary in memory
  await createMemory({
    type: 'episodic',
    content: summary,
    tags: ['session-summary', 'compaction'],
  });
  
  return [summaryMessage, ...toKeep];
}
```

### 5.4 Compaction Metrics

**Track:**

```typescript
interface CompactionMetrics {
  timestamp: Date;
  messagesBefore: number;
  messagesAfter: number;
  tokensBefore: number;
  tokensAfter: number;
  compressionRatio: number;
  summaryQuality: number; // 1-5 rating
}
```

---

## 6. Tool Ecosystem

### 6.1 Tool Definition Schema

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  executor: (params: any) => Promise<any>;
  requiresApproval?: boolean;
  category: ToolCategory;
  tags?: string[];
}

interface JSONSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
    default?: any;
  }>;
  required: string[];
}
```

### 6.2 Core Tools (P0)

#### read_file

```typescript
const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to read',
      },
      startLine: {
        type: 'number',
        description: 'Start reading from this line (1-indexed)',
      },
      endLine: {
        type: 'number',
        description: 'Stop reading at this line (1-indexed)',
      },
    },
    required: ['path'],
  },
  executor: async ({ path, startLine, endLine }) => {
    const content = await fs.readFile(path, 'utf-8');
    if (startLine && endLine) {
      const lines = content.split('\n');
      return lines.slice(startLine - 1, endLine).join('\n');
    }
    return content;
  },
  category: 'core',
};
```

#### write_file

```typescript
const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file (creates or overwrites)',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to write',
      },
      content: {
        type: 'string',
        description: 'Content to write to the file',
      },
    },
    required: ['path', 'content'],
  },
  executor: async ({ path, content }) => {
    await fs.ensureDir(path.dirname(path));
    await fs.writeFile(path, content);
    return { success: true, path };
  },
  category: 'core',
  requiresApproval: true,
};
```

#### run_command

```typescript
const runCommandTool: Tool = {
  name: 'run_command',
  description: 'Execute a shell command',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Command to execute',
      },
      cwd: {
        type: 'string',
        description: 'Working directory',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds',
      },
    },
    required: ['command'],
  },
  executor: async ({ command, cwd, timeout }) => {
    const result = await exec(command, { cwd, timeout });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  },
  category: 'core',
  requiresApproval: true,
};
```

### 6.3 Search Tools (P0)

#### codebase_search

```typescript
const codebaseSearchTool: Tool = {
  name: 'codebase_search',
  description: 'Semantic search across the codebase (find code by meaning)',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query (e.g., "Where is user authentication handled?")',
      },
      directory: {
        type: 'string',
        description: 'Directory to search in (optional)',
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
      },
    },
    required: ['query'],
  },
  executor: async ({ query, directory, limit = 10 }) => {
    // Use QMD hybrid search
    const results = await qmd.search({
      query,
      path: directory,
      limit,
    });
    return results;
  },
  category: 'search',
};
```

#### grep_search

```typescript
const grepSearchTool: Tool = {
  name: 'grep_search',
  description: 'Exact text/regex search across files',
  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Pattern to search for (supports regex)',
      },
      path: {
        type: 'string',
        description: 'File or directory to search in',
      },
      caseInsensitive: {
        type: 'boolean',
        description: 'Case-insensitive search',
      },
    },
    required: ['pattern'],
  },
  executor: async ({ pattern, path, caseInsensitive }) => {
    const args = ['grep', '-n'];
    if (caseInsensitive) args.push('-i');
    if (path) args.push(path);
    args.push(pattern);
    
    const result = await exec(args.join(' '));
    return result.stdout;
  },
  category: 'search',
};
```

### 6.4 Memory Tools (P0)

#### create_memory

```typescript
const createMemoryTool: Tool = {
  name: 'create_memory',
  description: 'Create a persistent memory for future reference',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['fact', 'preference', 'decision', 'pattern'],
        description: 'Type of memory',
      },
      content: {
        type: 'string',
        description: 'Memory content',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorization',
      },
      confidence: {
        type: 'number',
        description: 'Confidence level (0-1)',
      },
    },
    required: ['type', 'content'],
  },
  executor: async (params) => {
    return await memoryLayer.create(params);
  },
  category: 'memory',
};
```

#### search_memory

```typescript
const searchMemoryTool: Tool = {
  name: 'search_memory',
  description: 'Search through stored memories',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      types: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by memory types',
      },
      limit: {
        type: 'number',
        description: 'Maximum results',
      },
    },
    required: ['query'],
  },
  executor: async ({ query, types, limit }) => {
    return await memoryLayer.search(query, { types, limit });
  },
  category: 'memory',
};
```

### 6.5 Planning Tools (P1)

#### create_plan

```typescript
const createPlanTool: Tool = {
  name: 'create_plan',
  description: 'Create a structured plan for complex tasks',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Plan title',
      },
      description: {
        type: 'string',
        description: 'Plan description',
      },
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } },
          },
        },
        description: 'Tasks in the plan',
      },
    },
    required: ['title', 'tasks'],
  },
  executor: async (params) => {
    return await planner.createPlan(params);
  },
  category: 'planning',
};
```

#### update_task

```typescript
const updateTaskTool: Tool = {
  name: 'update_task',
  description: 'Update task status',
  parameters: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'Task ID to update',
      },
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'failed'],
        description: 'New status',
      },
      result: {
        type: 'string',
        description: 'Task result or notes',
      },
    },
    required: ['taskId', 'status'],
  },
  executor: async ({ taskId, status, result }) => {
    return await planner.updateTask(taskId, { status, result });
  },
  category: 'planning',
};
```

### 6.6 Tool Registry

```typescript
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }
  
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  getByCategory(category: ToolCategory): Tool[] {
    return Array.from(this.tools.values())
      .filter(t => t.category === category);
  }
  
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  toOpenAISchema(): OpenAI.Tool[] {
    return this.getAll().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
  
  toAnthropicSchema(): Anthropic.Tool[] {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }
}

// Initialize registry
const toolRegistry = new ToolRegistry();

// Register all tools
toolRegistry.register(readFileTool);
toolRegistry.register(writeFileTool);
toolRegistry.register(runCommandTool);
// ... register all other tools
```

---

## 7. Agent Orchestration

### 7.1 Orchestration Patterns

#### Sequential Execution

```
Agent 1 → Agent 2 → Agent 3

Use case: Linear workflow with dependencies
Example: Research → Write → Review
```

#### Parallel Execution

```
Agent 1 ┐
Agent 2 ├→ Aggregator
Agent 3 ┘

Use case: Independent tasks
Example: Test multiple components simultaneously
```

#### Hierarchical

```
          Supervisor
         /    |    \
    Agent1 Agent2 Agent3
       |      |      |
    Worker Worker Worker

Use case: Complex delegation
Example: Project manager with specialists
```

#### Handoffs (OpenAI SDK)

```
User → Triage Agent
         ↓
    (classifies intent)
         ↓
    ┌────┼────┐
    ↓    ↓    ↓
  Coder QA  Researcher

Use case: Intent-based routing
Example: Customer support, code review
```

### 7.2 CrewAI Integration

**Crew Definition:**

```typescript
import { Crew, Agent, Task } from 'crewai';

const researcher = new Agent({
  role: 'Senior Researcher',
  goal: 'Find comprehensive information',
  backstory: 'Expert at gathering and synthesizing information',
  tools: [searchWebTool, readPDTool],
});

const writer = new Agent({
  role: 'Senior Writer',
  goal: 'Create engaging content',
  backstory: 'Award-winning technical writer',
  tools: [writeFileTool],
});

const reviewer = new Agent({
  role: 'Editor',
  goal: 'Ensure quality and accuracy',
  backstory: 'Meticulous editor with eye for detail',
  tools: [readFileTool, editFileTool],
});

const crew = new Crew({
  agents: [researcher, writer, reviewer],
  tasks: [
    new Task({
      description: 'Research the topic',
      agent: researcher,
    }),
    new Task({
      description: 'Write the article',
      agent: writer,
    }),
    new Task({
      description: 'Review and edit',
      agent: reviewer,
    }),
  ],
  process: 'sequential', // or 'parallel'
});

const result = await crew.run();
```

### 7.3 OpenAI Handoffs

**Handoff Definition:**

```typescript
import { Agent, handoff } from '@openai/agents';

const triageAgent = new Agent({
  name: 'Triage',
  instructions: 'Classify user intent and route to appropriate agent',
  handoffs: [
    handoff({
      agent: coderAgent,
      condition: 'User wants to write or modify code',
    }),
    handoff({
      agent: researcherAgent,
      condition: 'User wants to research a topic',
    }),
    handoff({
      agent: qaAgent,
      condition: 'User wants to test or review code',
    }),
  ],
});

const coderAgent = new Agent({
  name: 'Coder',
  instructions: 'Write clean, efficient code',
  tools: [readFileTool, writeFileTool, runCommandTool],
});

// Run with handoffs
const result = await runAgent(triageAgent, userMessage);
```

### 7.4 Agent Store Integration

**Agent Definition for Store:**

```typescript
interface StoreAgent {
  id: string;
  name: string;
  description: string;
  category: 'coding' | 'research' | 'testing' | 'deployment' | 'monitoring';
  systemPrompt: string;
  recommendedModel: string;
  tools: string[];
  exampleUseCases: string[];
  configuration: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

// Example: Frontend Expert
const frontendExpert: StoreAgent = {
  id: 'frontend-expert',
  name: 'Frontend Expert',
  description: 'Specialist in React, Vue, and modern web frameworks',
  category: 'coding',
  systemPrompt: `
You are an expert frontend developer with deep knowledge of:
- React, Vue, Angular, Svelte
- CSS, Tailwind, styled-components
- State management (Redux, Zustand, Pinia)
- Build tools (Vite, Webpack, esbuild)

You write clean, performant, accessible code.
You follow best practices and modern patterns.
  `.trim(),
  recommendedModel: 'claude-3.5-sonnet',
  tools: ['read_file', 'write_file', 'edit_file', 'run_command', 'codebase_search'],
  exampleUseCases: [
    'Build a React dashboard with charts',
    'Optimize Vue component performance',
    'Create a responsive landing page',
  ],
  configuration: {
    temperature: 0.7,
    maxTokens: 4096,
  },
};
```

---

## 8. Pricing Tiers

### 8.1 BYOK (Free)

**What You Get:**

| Feature | Availability |
|---------|-------------|
| LLM Access | ✅ Your API key (any provider) |
| Context Window | ✅ Native to your LLM |
| Basic Tools | ✅ Core tools (read/write/bash) |
| Memory | ❌ Session-only (no persistence) |
| Compaction | ❌ Manual (you manage context) |
| Orchestration | ❌ Single agent only |
| Codebase Search | ❌ Not available |
| Actions | ❌ Basic set only |

**Limitations:**
- No persistent memory between sessions
- Context limited to LLM's native window
- No auto-compaction (must manually manage)
- Single agent mode only
- No semantic codebase search

**Use Case:**
- Quick questions
- Simple code edits
- Testing the platform
- Users who want full control

### 8.2 Subscription ($20/month)

**Everything in BYOK plus:**

| Feature | Availability |
|---------|-------------|
| Persistent Memory | ✅ Unlimited storage |
| Auto-Compaction | ✅ Smart summarization |
| Agent Orchestration | ✅ Multi-agent crews |
| Codebase Search | ✅ QMD hybrid search |
| Tool Ecosystem | ✅ 50+ pre-built tools |
| Planning System | ✅ Task management |
| Agent Store | ✅ Access all agents |
| Actions | ✅ Full library |
| Browser Automation | ✅ Puppeteer integration |
| Priority Support | ✅ Discord + email |

**Benefits:**
- Remember everything across sessions
- Never run out of context (auto-compact)
- Run complex multi-step workflows
- Find code by meaning, not just exact text
- Access specialized agents from store
- Full tool ecosystem

**Use Case:**
- Professional developers
- Complex projects
- Long-running tasks
- Team collaboration

### 8.3 Credits (Pay-per-use)

**For occasional users:**

| Credits | Price | What You Get |
|---------|-------|--------------|
| 500 | $5 | ~50 compactions OR ~100 memory queries |
| 1000 | $9 | ~100 compactions OR ~200 memory queries |
| 2500 | $20 | ~250 compactions OR ~500 memory queries |

**Credit Costs:**

| Action | Credits |
|--------|---------|
| Memory create/update | 1 |
| Memory search | 2 |
| Compaction | 5 |
| Agent orchestration (per agent) | 3 |
| Codebase search | 2 |
| Browser automation (per minute) | 1 |

**Use Case:**
- Occasional users
- Testing advanced features
- Light usage

### 8.4 Enterprise (Custom)

**Everything in Subscription plus:**

| Feature | Availability |
|---------|-------------|
| Self-hosted option | ✅ |
| SSO/SAML | ✅ |
| Custom agents | ✅ Unlimited |
| Private tool registry | ✅ |
| Audit logs | ✅ |
| SLA | ✅ 99.9% uptime |
| Dedicated support | ✅ |
| Custom integrations | ✅ |

**Pricing:** Custom quote based on:
- Number of users
- Deployment type (cloud vs self-hosted)
- Custom development needs
- Support level required

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Core infrastructure for BYOK mode.

**Tasks:**
- [ ] Implement tool router
- [ ] Build basic tool set (read/write/bash)
- [ ] Create LLM provider abstraction
- [ ] Build Nexus chat interface
- [ ] Implement streaming responses
- [ ] Add token counting
- [ ] Create user authentication
- [ ] Set up PostgreSQL database
- [ ] Build API endpoints

**Deliverables:**
- Working BYOK mode
- Basic chat interface
- Core tools functional
- User accounts

### Phase 2: Memory (Weeks 3-4)

**Goal:** Persistent memory system.

**Tasks:**
- [ ] Design memory schema
- [ ] Implement PostgreSQL storage
- [ ] Integrate QMD for search
- [ ] Build embedding generation (local)
- [ ] Create memory tools
- [ ] Build memory UI in Nexus
- [ ] Add memory injection to context
- [ ] Implement memory decay
- [ ] Add memory analytics

**Deliverables:**
- Persistent memory across sessions
- Semantic memory search
- Memory management UI
- Memory metrics

### Phase 3: Compaction (Weeks 5-6)

**Goal:** Auto-compaction system.

**Tasks:**
- [ ] Implement token counter
- [ ] Build compaction trigger
- [ ] Create summarization agent
- [ ] Implement key info extraction
- [ ] Build summary storage
- [ ] Add compaction UI
- [ ] Track compaction metrics
- [ ] Optimize summary quality

**Deliverables:**
- Auto-compaction when context full
- Summary generation
- Compaction analytics
- User control over compaction

### Phase 4: Orchestration (Weeks 7-8)

**Goal:** Multi-agent coordination.

**Tasks:**
- [ ] Integrate CrewAI
- [ ] Implement handoffs (OpenAI SDK)
- [ ] Build agent registry
- [ ] Create orchestration UI
- [ ] Add parallel execution
- [ ] Implement agent communication
- [ ] Build agent monitoring
- [ ] Create agent templates

**Deliverables:**
- Multi-agent workflows
- Sequential/parallel execution
- Agent monitoring dashboard
- Pre-built agent templates

### Phase 5: Agent Store (Weeks 9-10)

**Goal:** Curated agent marketplace.

**Tasks:**
- [ ] Design agent schema
- [ ] Create 20+ starter agents
- [ ] Build agent store UI
- [ ] Implement agent installation
- [ ] Add agent ratings/reviews
- [ ] Create agent documentation
- [ ] Build agent configuration UI
- [ ] Add community submissions

**Deliverables:**
- Agent store with 20+ agents
- Agent installation workflow
- Community features
- Agent documentation

### Phase 6: Actions & MCP (Weeks 11-12)

**Goal:** Tool ecosystem and external API.

**Tasks:**
- [ ] Build 50+ tool definitions
- [ ] Implement MCP server
- [ ] Create Actions API
- [ ] Build Actions UI
- [ ] Add credit system
- [ ] Implement usage tracking
- [ ] Create billing integration
- [ ] Build API documentation

**Deliverables:**
- 50+ tools available
- MCP server for external use
- Actions API
- Credit system
- Billing integration

---

## 10. System Prompts for Agents Store

### 10.1 Coding Agents

#### Frontend Expert

```markdown
# Role
You are a Senior Frontend Developer specializing in modern web frameworks.

# Expertise
- React, Vue, Angular, Svelte
- CSS frameworks (Tailwind, styled-components, CSS Modules)
- State management (Redux, Zustand, Pinia, Jotai)
- Build tools (Vite, Webpack, esbuild, Rollup)
- Testing (Jest, Vitest, Testing Library, Cypress)

# Principles
1. Write clean, readable, maintainable code
2. Follow framework best practices
3. Ensure accessibility (WCAG 2.1 AA)
4. Optimize for performance (Core Web Vitals)
5. Write meaningful tests

# Communication Style
- Be concise and direct
- Explain trade-offs when suggesting approaches
- Provide code examples
- Reference documentation when helpful

# Tools Available
- read_file, write_file, edit_file
- codebase_search, grep_search
- run_command (for npm, build, test)
```

#### Backend Expert

```markdown
# Role
You are a Senior Backend Developer specializing in API design and system architecture.

# Expertise
- Node.js, Python, Go, Rust
- RESTful APIs, GraphQL, gRPC
- Databases (PostgreSQL, MongoDB, Redis)
- Authentication (JWT, OAuth, SAML)
- Microservices, event-driven architecture

# Principles
1. Design for scalability and reliability
2. Write comprehensive tests
3. Document APIs thoroughly
4. Handle errors gracefully
5. Optimize for performance

# Communication Style
- Explain architectural decisions
- Provide code examples with comments
- Suggest alternatives with trade-offs
- Reference best practices

# Tools Available
- read_file, write_file, edit_file
- run_command (for servers, tests, migrations)
- query_database
- http_get, http_post
```

#### DevOps Engineer

```markdown
# Role
You are a DevOps Engineer specializing in infrastructure automation and CI/CD.

# Expertise
- Docker, Kubernetes, Terraform
- CI/CD (GitHub Actions, GitLab CI, Jenkins)
- Cloud platforms (AWS, GCP, Azure)
- Monitoring (Prometheus, Grafana, Datadog)
- Security (secrets management, RBAC)

# Principles
1. Infrastructure as Code
2. Immutable infrastructure
3. Automated testing and deployment
4. Monitoring and observability
5. Security by default

# Communication Style
- Provide complete, runnable configurations
- Explain security implications
- Suggest cost optimizations
- Document procedures

# Tools Available
- read_file, write_file, edit_file
- run_command (docker, kubectl, terraform)
- http_get, http_post
```

### 10.2 Research Agents

#### Technical Researcher

```markdown
# Role
You are a Technical Researcher skilled at gathering and synthesizing information.

# Expertise
- Web research and fact-checking
- Technical documentation analysis
- Competitive analysis
- Best practices identification
- Technology evaluation

# Principles
1. Verify information from multiple sources
2. Cite sources clearly
3. Synthesize findings, don't just summarize
4. Highlight actionable insights
5. Identify knowledge gaps

# Communication Style
- Present findings in structured format
- Highlight key insights first
- Provide evidence for claims
- Suggest next steps

# Tools Available
- search_web
- read_file (for docs)
- http_get (for APIs, documentation)
```

#### Code Reviewer

```markdown
# Role
You are a Senior Code Reviewer focused on code quality and best practices.

# Expertise
- Code smell detection
- Security vulnerability identification
- Performance optimization
- Architecture review
- Testing strategies

# Principles
1. Be constructive and specific
2. Explain the "why" behind suggestions
3. Prioritize issues by severity
4. Acknowledge good patterns
5. Suggest concrete improvements

# Communication Style
- Use clear, respectful language
- Provide code examples for suggestions
- Reference style guides and best practices
- Distinguish between critical and nice-to-have

# Tools Available
- read_file
- codebase_search
- grep_search
```

### 10.3 Testing Agents

#### QA Engineer

```markdown
# Role
You are a QA Engineer specializing in test automation and quality assurance.

# Expertise
- Unit testing, integration testing, E2E testing
- Testing frameworks (Jest, Vitest, Cypress, Playwright)
- Test-driven development (TDD)
- Performance testing
- Accessibility testing

# Principles
1. Tests should be fast, reliable, and maintainable
2. Test behavior, not implementation
3. Aim for high coverage on critical paths
4. Use meaningful test descriptions
5. Isolate tests from external dependencies

# Communication Style
- Explain testing strategy
- Provide runnable test examples
- Suggest edge cases to test
- Document test setup

# Tools Available
- read_file, write_file, edit_file
- run_command (for test runners)
- codebase_search
```

---

## 11. MCP Actions API

### 11.1 Overview

**MCP (Model Context Protocol)** enables external applications to use Aitlas Actions.

**Use Cases:**
- IDE extensions (VS Code, JetBrains)
- CLI tools
- Custom integrations
- Third-party applications

### 11.2 Authentication

**API Keys:**

```typescript
interface APIKey {
  id: string;
  userId: string;
  key: string; // sk_live_xxx or sk_test_xxx
  permissions: Permission[];
  rateLimit: number; // requests per minute
  createdAt: Date;
  expiresAt?: Date;
}

interface Permission {
  resource: 'actions' | 'memory' | 'agents';
  actions: ('read' | 'write' | 'execute')[];
}
```

**Authentication Header:**

```
Authorization: Bearer sk_live_xxxxxxxxxxxx
```

### 11.3 Endpoints

#### List Available Actions

```http
GET /api/v1/actions

Response:
{
  "actions": [
    {
      "id": "git-commit",
      "name": "Git Commit",
      "description": "Create a git commit with staged changes",
      "category": "git",
      "credits": 1
    },
    ...
  ]
}
```

#### Execute Action

```http
POST /api/v1/actions/{actionId}/execute

Request:
{
  "parameters": {
    "message": "feat: add user authentication",
    "files": ["src/auth.ts", "src/user.ts"]
  }
}

Response:
{
  "success": true,
  "result": {
    "commit": "abc123",
    "message": "feat: add user authentication",
    "files": 2
  },
  "creditsUsed": 1,
  "creditsRemaining": 499
}
```

#### Create Memory

```http
POST /api/v1/memory

Request:
{
  "type": "preference",
  "content": "User prefers TypeScript over JavaScript",
  "tags": ["coding", "preference"]
}

Response:
{
  "id": "mem_xxx",
  "type": "preference",
  "content": "User prefers TypeScript over JavaScript",
  "tags": ["coding", "preference"],
  "createdAt": "2026-03-08T20:00:00Z"
}
```

#### Search Memory

```http
POST /api/v1/memory/search

Request:
{
  "query": "coding preferences",
  "limit": 10
}

Response:
{
  "memories": [
    {
      "id": "mem_xxx",
      "content": "User prefers TypeScript over JavaScript",
      "relevance": 0.95
    }
  ],
  "creditsUsed": 2
}
```

### 11.4 Rate Limiting

| Tier | Rate Limit |
|------|------------|
| Free | 10 req/min |
| Subscription | 100 req/min |
| Enterprise | Custom |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1617235200
```

### 11.5 Error Handling

**Error Response:**

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Not enough credits to execute this action",
    "required": 5,
    "available": 2
  }
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `INSUFFICIENT_CREDITS` | Not enough credits |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `UNAUTHORIZED` | Invalid API key |
| `ACTION_NOT_FOUND` | Action doesn't exist |
| `INVALID_PARAMETERS` | Missing or invalid params |
| `EXECUTION_FAILED` | Action execution failed |

---

## 12. Integration with Nexus

### 12.1 UI Integration

**Code View:**

```typescript
// Nexus Code Page
function CodePage() {
  return (
    <div className="flex h-screen">
      {/* Left: File tree */}
      <FileTree className="w-64" />
      
      {/* Center: Code editor + Chat */}
      <div className="flex-1 flex flex-col">
        <TabBar tabs={['Code', 'Chat', 'Terminal']} />
        <CodeEditor />
        <ChatPanel />
      </div>
      
      {/* Right: Tools */}
      <div className="w-80 border-l">
        <Accordion>
          <Panel title="Memory">
            <MemoryPanel />
          </Panel>
          <Panel title="Actions">
            <ActionsPanel />
          </Panel>
          <Panel title="Agents">
            <AgentsPanel />
          </Panel>
          <Panel title="Tasks">
            <TasksPanel />
          </Panel>
        </Accordion>
      </div>
    </div>
  );
}
```

### 12.2 State Management

**Zustand Store:**

```typescript
interface AppState {
  // Current context
  session: {
    id: string;
    messages: Message[];
    tokenCount: number;
  };
  
  // Memory
  memories: {
    recent: Memory[];
    searchResults: Memory[];
  };
  
  // Actions
  actions: {
    available: Action[];
    running: ActionExecution[];
    history: ActionExecution[];
  };
  
  // Agents
  agents: {
    active: Agent | null;
    store: Agent[];
  };
  
  // Tasks
  tasks: {
    plan: Plan | null;
    tasks: Task[];
  };
  
  // Settings
  settings: {
    provider: 'claude' | 'openai' | 'gemini';
    model: string;
    temperature: number;
    maxTokens: number;
  };
}
```

### 12.3 API Client

```typescript
class AitlasClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  // Chat
  async chat(messages: Message[]): Promise<AsyncIterable<ChatChunk>> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    
    return this.parseSSE(response.body);
  }
  
  // Memory
  async createMemory(params: CreateMemoryParams): Promise<Memory> {
    return this.post('/api/memory', params);
  }
  
  async searchMemory(query: string): Promise<Memory[]> {
    return this.post('/api/memory/search', { query });
  }
  
  // Actions
  async executeAction(actionId: string, params: any): Promise<ActionResult> {
    return this.post(`/api/actions/${actionId}/execute`, params);
  }
  
  // Agents
  async runAgent(agentId: string, input: string): Promise<AgentResult> {
    return this.post(`/api/agents/${agentId}/run`, { input });
  }
  
  // Tasks
  async createPlan(plan: CreatePlanParams): Promise<Plan> {
    return this.post('/api/plans', plan);
  }
  
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    return this.patch(`/api/tasks/${taskId}`, updates);
  }
}
```

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **BYOK** | Bring Your Own Key (user provides API key) |
| **Compaction** | Summarizing old context to free up tokens |
| **MCP** | Model Context Protocol (external API) |
| **QMD** | Query Markdown (hybrid search engine) |
| **Orchestration** | Coordinating multiple agents |
| **Handoffs** | Agent-to-agent delegation pattern |
| **Actions** | Pre-built tools/integrations |
| **Memory** | Persistent storage of context |
| **Embedding** | Vector representation of text |
| **Semantic Search** | Search by meaning, not exact text |

---

## Appendix B: References

- [CrewAI Documentation](https://docs.crewai.com)
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python)
- [Anthropic Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [QMD Repository](https://github.com/Arakiss/qmd)
- [MCP Specification](https://modelcontextprotocol.io)

---

*End of Architecture Documentation*