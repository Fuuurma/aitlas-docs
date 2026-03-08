# Nexus - The Agent Operating System

**Domain:** nexus.aitlas.xyz  
**Status:** 🟡 Development  
**Stack:** Next.js 15, Bun, Neon Postgres, Prisma 6, Better Auth

---

## Strategic Value

**Nexus = Agent Operating System UI**

Similar to: Claude Code, OpenInterpreter, Cursor Agent Mode

Responsibilities:
- Chat interface
- Agent orchestration
- Task queue
- Tool execution
- Memory
- Credit system

```
User → Nexus → Agent → Tools
```

---

## Core Layout

```
┌────────────────────────────────────────────────────────────────┐
│  NEXUS                          [Credits: 420] [Mode Toggle]   │  ← Header
├──────────────┬─────────────────────────────────┬───────────────┤
│              │                                 │               │
│  THREAD      │         CHAT PANEL              │   ACTIONS     │
│  SIDEBAR     │                                 │   SIDEBAR     │
│              │  [Model Picker]                 │               │
│  [+ New]     │  ─────────────────────────────  │  f.twyt  ✓   │
│              │                                 │  f.library ✓  │
│  > Thread 1  │   [messages]                    │  f.rsrx  ✓   │
│    Thread 2  │                                 │  ─────────── │
│    Thread 3  │                                 │  MCPs         │
│              │                                 │  G.Calendar ✓ │
│  [Agent]     │   [input bar]         [Send]    │               │
│  > Quant     │                                 │  [+ Add MCP]  │
│              │                                 │               │
├──────────────┴─────────────────────────────────┴───────────────┤
│  TASK MONITOR (expanded only in Agentic Mode)                  │
│  [task_abc] Research EU AI Startups ░░░░░░░░ 3/12 steps  Live │
└────────────────────────────────────────────────────────────────┘
```

---

## Conversation & Thread Model

Conversations are **persistent, server-stored threads** — not ephemeral.

```prisma
model Thread {
  id          String    @id @default(cuid())
  userId      String
  title       String?   // Auto-generated from first message
  agentId     String?   // Active agent for this thread
  mode        ChatMode  @default(STANDARD)
  modelId     String?   // Selected model per-thread
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  messages    Message[]
  user        User      @relation(...)
}

enum ChatMode {
  STANDARD   // Basic, no tools
  AGENTIC    // Tools enabled
}

model Message {
  id           String      @id @default(cuid())
  threadId     String
  role         MessageRole // USER | ASSISTANT | TOOL_CALL | TOOL_RESULT | SYSTEM
  content      String      @db.Text
  toolName     String?     // If role = TOOL_CALL
  toolInput    Json?       // If role = TOOL_CALL
  toolOutput   Json?       // If role = TOOL_RESULT
  creditsUsed  Int         @default(0)
  taskId       String?     // If this triggered a background task
  createdAt    DateTime    @default(now())
  thread       Thread      @relation(...)
}

enum MessageRole {
  USER
  ASSISTANT
  TOOL_CALL
  TOOL_RESULT
  SYSTEM
}
```

**Thread Title Generation:** After first user message, background call generates 3-5 word title. Never blocks main chat stream.

---

## First-Run Onboarding (BYOK Setup Wizard)

```
Step 1: Welcome
  "Nexus is an AI workspace that runs on your keys.
   We never see your tokens. Let's get you set up in 2 minutes."
  [CTA: Get Started]

Step 2: Add Your API Key
  [Provider tabs: OpenAI | Anthropic | DeepSeek | Gemini]
  [Key input field — masked]
  [Validation: quick test call with user's key before saving]
  [Hint: "We encrypt this with AES-256. Even we can't read it."]

Step 3: Choose Your Mode
  ┌──────────────────┐  ┌──────────────────────┐
  │  🗣  Basic Chat  │  │  ⚡  Agentic Mode     │
  │  Free Forever    │  │  Requires Credits     │
  │  Just you + AI   │  │  Tools, Agents, Tasks │
  └──────────────────┘  └──────────────────────┘

Step 4 (if Agentic): Top Up Credits
  [$5 → 500] [$10 → 1,100] [$25 → 3,000 + Pro]

Step 5: First Chat
  Pre-loaded: "Ask me anything, or hire an agent from the Store"
```

---

## Dual-Mode System (State Machine)

### Mode Gate Logic

```typescript
type ModeCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'NO_API_KEY' | 'NO_CREDITS' | 'PLAN_REQUIRED' }

async function checkAgenticAccess(userId: string): Promise<ModeCheckResult> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { apiKeys: { select: { id: true } } }
  });

  if (user.apiKeys.length === 0) {
    return { allowed: false, reason: 'NO_API_KEY' };
  }

  if (user.planTier === 'PRO') return { allowed: true };
  if (user.computeCredits >= 500) return { allowed: true };

  return { allowed: false, reason: 'NO_CREDITS' };
}
```

### Mode Toggle UI States

```
STANDARD MODE:
  Toggle: [○ Basic ●]
  Actions Sidebar: greyed out, lock icon
  Tooltip: "Upgrade to Agentic Mode — add credits to unlock"
  Agent Panel: hidden
  Task Monitor: hidden

AGENTIC MODE:
  Toggle: [● Agentic ○] (glowing accent)
  Actions Sidebar: active
  Agent Panel: visible
  Task Monitor: visible

BLOCKED STATE (user toggles but fails gate):
  Modal:
    - NO_API_KEY: "Add an API key first" → [Go to Settings]
    - NO_CREDITS: "Top up credits to unlock" → [Buy Credits]
```

---

## Model Selector

```typescript
interface ModelOption {
  provider: LLMProvider;
  modelId: string;           // 'gpt-4o' | 'claude-sonnet-4-5'
  displayName: string;
  contextWindow: number;
  supportsToolUse: boolean;  // CRITICAL: Agentic Mode requires true
  costTier: 'budget' | 'standard' | 'premium';
}
```

| Provider | Models | Tool Use |
|----------|--------|----------|
| Anthropic | claude-sonnet-4-5, claude-opus-4-5 | ✅ |
| OpenAI | gpt-4o, gpt-4o-mini | ✅ |
| DeepSeek | deepseek-chat, deepseek-reasoner | ✅ |
| Gemini | gemini-2.0-flash, gemini-2.5-pro | ✅ |
| Groq | llama-3.3-70b | ✅ |

---

## Short vs Long Task Detection

**CRITICAL:** Time-based detection ("< 30s") is WRONG. You can't predict duration before running.

**Correct approach:** Each MCP tool declares `isAsync: boolean` in registry.

```typescript
interface MCPToolRegistryEntry {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  creditCost: number;
  isAsync: boolean;        // TRUE = always dispatch to Ralph
  estimatedMinutes?: number;
}

// Examples:
// f.twyt:search_twitter → isAsync: false (fast query)
// f.rsrx:deep_research  → isAsync: true  (5-30 min)
// f.library:search      → isAsync: false (fast query)
```

---

## Tool Call UI Visualization

```
[User]: Research the top AI startups in Barcelona

[Assistant]: I'll research that for you.

  ┌─────────────────────────────────────────────────┐
  │  ⚡ f.rsrx: deep_research                        │
  │  Query: "AI startups Barcelona Spain 2026"      │
  │  Cost: 5 credits                                │
  │  ● Dispatched to background (task_abc123)       │
  └─────────────────────────────────────────────────┘

[Task Monitor expands automatically]
  [task_abc123] Research: AI startups — Step 2/12 ░░░░░░░░░░
```

---

## Task Monitor — SSE Architecture

**NO POLLING.** Server-Sent Events stream per task.

```typescript
// app/api/tasks/[id]/stream/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  return new Response(
    new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        };

        const task = await getTask(params.id, session.userId);
        send({ type: 'snapshot', task });

        // Postgres LISTEN/NOTIFY via Neon
        const listener = await subscribeToTaskUpdates(params.id, (step) => {
          send({ type: 'step', step });
          if (['COMPLETED', 'FAILED'].includes(step.status)) {
            send({ type: 'done', status: step.status });
            controller.close();
          }
        });
      }
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  );
}
```

---

## Zustand Store Shape

```typescript
interface NexusStore {
  // Auth & Mode
  user: User | null;
  chatMode: 'STANDARD' | 'AGENTIC';
  setChatMode: (mode: 'STANDARD' | 'AGENTIC') => void;

  // Threads
  threads: Thread[];
  activeThreadId: string | null;
  setActiveThread: (id: string) => void;
  createThread: () => Promise<string>;

  // Messages
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;

  // Active Agent
  activeAgentId: string | null;
  setActiveAgent: (id: string | null) => void;

  // Tasks
  activeTasks: Task[];
  taskSteps: Record<string, TaskStep[]>;
  subscribeToTask: (taskId: string) => void;
  cancelTask: (taskId: string) => Promise<void>;

  // Tools
  enabledTools: ToolRegistryEntry[];
  toggleTool: (toolName: string) => Promise<void>;

  // Credits
  creditBalance: number;
  refreshCredits: () => Promise<void>;

  // UI State
  sidebarOpen: boolean;
  taskMonitorExpanded: boolean;
}
```

---

## Error States

| Error | Trigger | UI Response |
|-------|---------|-------------|
| Invalid BYOK key | LLM API rejects | Banner: "Your API key was rejected. [Update Key]" |
| Out of credits | Credit check fails | Modal: "You've run out of credits. [Top Up]" |
| Task failed | Ralph marks FAILED | Task Monitor: red + error + [Retry] |
| Task timeout | Ralph hits maxSteps | Task Monitor: yellow + "Timed out" + [Retry] |
| MCP tool down | Third-party unreachable | Inline: "⚠ f.rsrx unavailable. Retrying..." |
| Network error | Connection lost | Banner: "Reconnecting…" → auto-retry SSE |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Main chat (SSE streaming) |
| `/api/threads` | GET/POST | List/create threads |
| `/api/threads/:id` | GET/PATCH/DELETE | Thread CRUD |
| `/api/tasks` | POST | Create background task |
| `/api/tasks/:id` | GET/DELETE | Task status/cancel |
| `/api/tasks/:id/stream` | GET | SSE stream of task steps |
| `/api/keys` | GET/POST | BYOK key management |
| `/api/keys/:provider` | DELETE | Remove BYOK key |
| `/api/credits/balance` | GET | Current balance |
| `/api/credits/purchase` | POST | Buy credit pack |
| `/api/tools` | GET | List user's tool registry |
| `/api/tools/:name` | PATCH | Enable/disable tool |
| `/api/agents/activate` | POST | Activate agent (from Store) |
| `/api/onboarding/status` | GET | Check onboarding completion |

---

## Development Phases

**Phase 1 — Skeleton**
- [ ] Clone `aitlas-core-template` + env setup
- [ ] Better Auth (sign up, sign in, session)
- [ ] Thread model + CRUD
- [ ] Basic chat — Standard Mode only
- [ ] BYOK key storage (encrypt/validate)
- [ ] Onboarding wizard (Steps 1-3)

**Phase 2 — Agentic Mode**
- [ ] Tool registry (enable/disable)
- [ ] Mode toggle + gate logic
- [ ] MCP tool call execution (inline first)
- [ ] Tool call visualization UI
- [ ] Credit balance display

**Phase 3 — Background Tasks**
- [ ] Task dispatch to Ralph
- [ ] Task Monitor UI (SSE stream)
- [ ] Async tool routing
- [ ] Task cancellation

**Phase 4 — Polish**
- [ ] Thread title auto-generation
- [ ] Model selector UI
- [ ] Agent panel + activation
- [ ] Error state handling
- [ ] Credit purchase (Stripe)

---

**Repo:** https://github.com/Fuuurma/aitlas-nexus