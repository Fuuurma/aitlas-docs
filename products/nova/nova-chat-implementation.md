# Nova Chat Implementation Plan

> ⚠️ **DEPRECATED** — Content merged into [NOVA_TECHNICAL_DOC.md](./NOVA_TECHNICAL_DOC.md)

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Created:** 2026-03-09  
**Status:** Deprecated  
**See:** [NOVA_TECHNICAL_DOC.md](./NOVA_TECHNICAL_DOC.md) (canonical)

---

## Executive Summary

Nova Chat is a desktop application that provides a unified interface for interacting with multiple AI coding agents. Based on the T3 Code architecture analysis, this document outlines the implementation strategy for supporting OpenCode, Codex, Claude Code, and Aitlas agents.

---

## 1. T3 Code Architecture Analysis

### 1.1 Project Structure

T3 Code uses a **monorepo** architecture with the following structure:

```
t3code/
├── apps/
│   ├── desktop/          # Electron desktop app (main process)
│   ├── server/           # Node.js backend server
│   └── web/              # Frontend web app (React/TypeScript)
├── packages/
│   ├── contracts/        # Shared schemas, types, IPC definitions
│   └── shared/           # Shared utilities (model normalization, etc.)
```

### 1.2 Core Architecture Patterns

#### A. Contracts-First Design

The `@t3tools/contracts` package defines:
- **Schema types** using Effect Schema for runtime validation
- **IPC message types** for communication between layers
- **Provider abstraction interfaces**
- **WebSocket API contracts**

Key contracts files:
- `provider.ts` - Provider session management schemas
- `providerRuntime.ts` - Runtime event types (40+ event types)
- `orchestration.ts` - Thread/turn/command orchestration
- `ws.ts` - WebSocket RPC method definitions
- `terminal.ts` - Terminal session schemas

#### B. Provider Abstraction Layer

T3 Code currently supports **only Codex** but is architected for extension:

```typescript
// Current provider kind (extensible)
export const ProviderKind = Schema.Literal("codex");

// Provider session states
type ProviderSessionStatus = "connecting" | "ready" | "running" | "error" | "closed";

// Provider runtime modes
type RuntimeMode = "approval-required" | "full-access";
```

Key provider interfaces:
- `ProviderSession` - Session state management
- `ProviderSessionStartInput` - Session initialization
- `ProviderSendTurnInput` - User message sending
- `ProviderEvent` - Streaming events from provider
- `ProviderApprovalDecision` - User approval responses

#### C. Streaming Architecture

T3 Code uses **JSON-RPC over stdio** for provider communication:

1. **Server spawns provider process** (e.g., `codex app-server`)
2. **JSON-RPC messages** exchanged via stdin/stdout
3. **Events streamed** as JSON-RPC notifications
4. **State changes** propagated to frontend via WebSocket

Event types for streaming:
```typescript
type ProviderRuntimeEventType =
  | "session.started"
  | "thread.started"
  | "turn.started"
  | "content.delta"        // Text streaming
  | "item.started"        // Tool/agent action started
  | "item.updated"        // Progress updates
  | "item.completed"      // Action finished
  | "request.opened"      // Approval request
  | "turn.completed"      // Turn finished
  // ... 40+ event types
```

#### D. Desktop App Architecture (Electron)

**Main Process** (`apps/desktop/src/main.ts`):
- Spawns backend server as child process
- Registers custom protocol (`t3://`)
- Handles app lifecycle, updates, menus
- Provides IPC bridge to renderer

**Backend Server** (`apps/server/src/`):
- WebSocket server for frontend communication
- Provider session management (CodexAppServerManager)
- Terminal session management
- Git operations
- File system operations

**Frontend** (React + TypeScript):
- Connects to backend via WebSocket
- Manages UI state
- Renders chat, terminal, file tree

### 1.3 Key Architectural Insights

1. **JSON-RPC over stdio** is the provider communication pattern
2. **Effect Schema** provides runtime validation and type safety
3. **Event sourcing** pattern for thread/turn state
4. **CQRS-lite**: Commands dispatched, events emitted
5. **Orchestration layer** abstracts provider differences

---

## 2. Multi-Provider Design

### 2.1 Provider Abstraction Strategy

Extend `ProviderKind` to support multiple agents:

```typescript
export const ProviderKind = Schema.Literals([
  "opencode",      // OpenCode (primary)
  "codex",         // OpenAI Codex CLI
  "claude-code",   // Anthropic Claude Code CLI
  "aitlas",        // Aitlas agent
]);
```

### 2.2 Provider Interface

Each provider must implement:

```typescript
interface ProviderAdapter {
  // Lifecycle
  startSession(input: SessionStartInput): Promise<ProviderSession>;
  stopSession(threadId: ThreadId): Promise<void>;
  
  // Communication
  sendTurn(input: SendTurnInput): Promise<TurnStartResult>;
  interruptTurn(threadId: ThreadId, turnId?: TurnId): Promise<void>;
  
  // Approval handling
  respondToApproval(input: ApprovalResponseInput): Promise<void>;
  respondToUserInput(input: UserInputResponseInput): Promise<void>;
  
  // Events
  on(event: "event", handler: (event: ProviderEvent) => void): void;
}
```

### 2.3 Provider-Specific Implementations

#### A. OpenCode Provider (Primary)

**Communication:** JSON-RPC over stdio (same as Codex)

```typescript
class OpenCodeProviderAdapter implements ProviderAdapter {
  // OpenCode uses similar app-server mode
  // Command: opencode app-server
  // Protocol: JSON-RPC 2.0 over stdio
  
  async startSession(input) {
    const child = spawn("opencode", ["app-server"], {
      cwd: input.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });
    
    // Initialize handshake
    await this.sendRequest("initialize", {
      clientInfo: { name: "nova-chat", version: "0.1.0" },
      capabilities: { experimentalApi: true },
    });
    
    // Start thread
    const result = await this.sendRequest("thread/start", {
      model: input.model ?? "glm-5",
      cwd: input.cwd,
    });
    
    return { threadId: result.thread.id, status: "ready" };
  }
}
```

**Model Configuration:**
```typescript
const OPENCODE_MODELS = [
  { slug: "glm-5", name: "GLM-5" },
  { slug: "kimi-k2.5", name: "Kimi K2.5" },
  { slug: "minimax-m2.5", name: "MiniMax M2.5" },
  { slug: "qwen3.5-plus", name: "Qwen 3.5 Plus" },
];

const OPENCODE_ENDPOINT = "https://opencode.ai/zen/v1";
```

#### B. Codex Provider

**Communication:** JSON-RPC over stdio

```typescript
class CodexProviderAdapter implements ProviderAdapter {
  // Already implemented in T3 Code
  // Command: codex app-server
  // Protocol: JSON-RPC 2.0 over stdio
  
  // Models: gpt-5.4, gpt-5.3-codex, gpt-5.3-codex-spark
}
```

#### C. Claude Code Provider

**Communication:** JSON-RPC over stdio

```typescript
class ClaudeCodeProviderAdapter implements ProviderAdapter {
  // Command: claude-code app-server (if available)
  // Or: claude --mcp-mode (MCP protocol variant)
  
  async startSession(input) {
    // Claude Code uses similar patterns
    // May need MCP-specific message handling
  }
}
```

**Key differences:**
- Different approval mechanisms
- Different model options (claude-sonnet-4, claude-opus-4, etc.)
- May support MCP tools natively

#### D. Aitlas Provider

**Communication:** Custom protocol (gRPC or WebSocket)

```typescript
class AitlasProviderAdapter implements ProviderAdapter {
  // Aitlas may use different transport
  // Could be gRPC, WebSocket, or stdio
  
  async startSession(input) {
    // Connect to Aitlas agent service
    // Could be local or remote
  }
}
```

### 2.4 Unified Event Mapping

Each provider emits events in its own format. The orchestration layer normalizes them:

```typescript
// Canonical event types (from providerRuntime.ts)
type CanonicalItemType =
  | "user_message"
  | "assistant_message"
  | "reasoning"
  | "plan"
  | "command_execution"
  | "file_change"
  | "mcp_tool_call"
  | "dynamic_tool_call"
  | "collab_agent_tool_call"
  | "web_search"
  | "error";

// Provider-specific mappers
function mapOpenCodeEvent(raw: unknown): ProviderEvent {
  // Map OpenCode-specific format to canonical
}

function mapCodexEvent(raw: unknown): ProviderEvent {
  // Map Codex-specific format to canonical
}

function mapClaudeCodeEvent(raw: unknown): ProviderEvent {
  // Map Claude Code format to canonical
}
```

---

## 3. Streaming Patterns

### 3.1 Content Streaming

Text content streams via `content.delta` events:

```typescript
interface ContentDeltaPayload {
  streamKind: RuntimeContentStreamKind;
  delta: string;
  contentIndex?: number;
}

type RuntimeContentStreamKind =
  | "assistant_text"
  | "reasoning_text"
  | "reasoning_summary_text"
  | "plan_text"
  | "command_output"
  | "file_change_output";
```

### 3.2 Frontend Subscription Pattern

```typescript
// WebSocket subscription
ws.send({
  method: "orchestration.dispatchCommand",
  params: {
    type: "thread.turn.start",
    threadId,
    message: { text: "Hello" },
  },
});

// Receive streaming events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === "push" && data.channel === "orchestration.domainEvent") {
    handleOrchestrationEvent(data.data);
  }
};
```

### 3.3 State Management

**Optimistic UI updates:**
1. User sends message → immediately show in UI
2. Backend confirms → update with server state
3. Streaming updates → append deltas in real-time
4. Turn completes → finalize message

---

## 4. Desktop App Considerations

### 4.1 Technology Stack

Based on T3 Code analysis:

| Component | Technology | Notes |
|-----------|------------|-------|
| **Desktop Framework** | Electron | T3 Code uses Electron, not Tauri |
| **Backend Runtime** | Node.js + Effect | Effect for functional error handling |
| **Schema Validation** | Effect Schema | Runtime validation + TypeScript types |
| **Frontend** | React + TypeScript | Standard React stack |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Communication** | WebSocket | Backend ↔ Frontend |
| **Provider Comm** | stdio JSON-RPC | Backend ↔ Provider processes |

### 4.2 Process Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  - App lifecycle                                         │
│  - Window management                                     │
│  - Protocol handling (nova://)                          │
│  - Auto-updates                                          │
└─────────────────────┬───────────────────────────────────┘
                      │ spawns
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend Server                        │
│  - WebSocket server (port: random)                      │
│  - Provider session management                           │
│  - Terminal management                                   │
│  - Git operations                                        │
│  - File operations                                       │
└─────────────────────┬───────────────────────────────────┘
                      │ spawns per thread
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Provider Processes (1 per thread)           │
│  - OpenCode: `opencode app-server`                      │
│  - Codex: `codex app-server`                            │
│  - Claude Code: `claude-code`                           │
│  - Aitlas: custom binary/service                        │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Security Considerations

1. **Sandboxed renderer** - Node integration disabled
2. **Context isolation** - preload script bridges IPC
3. **Provider sandboxing** - Optional approval modes
4. **Secure protocol** - `nova://` for local resources

### 4.4 Auto-Update Strategy

T3 Code uses `electron-updater`:
- GitHub Releases as update source
- Automatic background checks
- Manual update trigger from menu
- Graceful shutdown before install

---

## 5. File Structure

### 5.1 Proposed Project Structure

```
nova-chat/
├── apps/
│   ├── desktop/                    # Electron main process
│   │   ├── src/
│   │   │   ├── main.ts            # Entry point
│   │   │   ├── preload.ts         # Context bridge
│   │   │   ├── confirmDialog.ts   # Native dialogs
│   │   │   └── updateMachine.ts   # Auto-update state machine
│   │   ├── resources/
│   │   │   └── icon.{png,ico,icns}
│   │   └── package.json
│   │
│   ├── server/                    # Backend server
│   │   ├── src/
│   │   │   ├── index.ts           # Entry point
│   │   │   ├── main.ts            # CLI + server setup
│   │   │   ├── wsServer.ts        # WebSocket server
│   │   │   ├── config.ts          # Configuration
│   │   │   ├── providers/
│   │   │   │   ├── index.ts       # Provider registry
│   │   │   │   ├── base.ts        # Base provider class
│   │   │   │   ├── opencode.ts    # OpenCode adapter
│   │   │   │   ├── codex.ts       # Codex adapter
│   │   │   │   ├── claudeCode.ts  # Claude Code adapter
│   │   │   │   └── aitlas.ts      # Aitlas adapter
│   │   │   ├── orchestration/
│   │   │   │   ├── manager.ts     # Thread/turn orchestration
│   │   │   │   ├── commands.ts    # Command handlers
│   │   │   │   └── events.ts      # Event processing
│   │   │   ├── terminal/
│   │   │   │   └── manager.ts     # Terminal sessions
│   │   │   └── git/
│   │   │       └── operations.ts  # Git commands
│   │   └── package.json
│   │
│   └── web/                       # Frontend (renderer)
│       ├── src/
│       │   ├── App.tsx            # Root component
│       │   ├── main.tsx           # Entry point
│       │   ├── components/
│       │   │   ├── Chat/
│       │   │   │   ├── ThreadList.tsx
│       │   │   │   ├── MessageList.tsx
│       │   │   │   ├── MessageInput.tsx
│       │   │   │   └── StreamingMessage.tsx
│       │   │   ├── Terminal/
│       │   │   │   └── TerminalView.tsx
│       │   │   ├── Sidebar/
│       │   │   │   └── ProjectSidebar.tsx
│       │   │   └── Settings/
│       │   │       ├── ProviderSettings.tsx
│       │   │       └── ModelSelector.tsx
│       │   ├── hooks/
│       │   │   ├── useWebSocket.ts
│       │   │   ├── useThread.ts
│       │   │   └── useProvider.ts
│       │   ├── stores/
│       │   │   ├── threadStore.ts
│       │   │   ├── settingsStore.ts
│       │   │   └── providerStore.ts
│       │   └── utils/
│       │       ├── eventHandlers.ts
│       │       └── formatters.ts
│       └── package.json
│
├── packages/
│   ├── contracts/                  # Shared types/schemas
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── baseSchemas.ts     # IDs, timestamps
│   │   │   ├── provider.ts        # Provider types
│   │   │   ├── providerRuntime.ts # Runtime events
│   │   │   ├── orchestration.ts   # Thread/turn types
│   │   │   ├── terminal.ts        # Terminal types
│   │   │   ├── ws.ts              # WebSocket types
│   │   │   ├── git.ts             # Git types
│   │   │   └── model.ts           # Model types
│   │   └── package.json
│   │
│   └── shared/                     # Shared utilities
│       ├── src/
│       │   ├── model.ts           # Model normalization
│       │   ├── logging/           # Logging utilities
│       │   └── Net.ts             # Network utilities
│       └── package.json
│
├── package.json                   # Root package (workspaces)
├── pnpm-workspace.yaml           # pnpm workspace config
├── tsconfig.json                 # Base TypeScript config
├── turbo.json                    # Turborepo config
└── README.md
```

---

## 6. Key Components to Build

### 6.1 Core Components (Priority Order)

#### Phase 1: Foundation

1. **Contracts Package**
   - Define all schemas and types
   - Provider abstraction interfaces
   - Event types and commands

2. **Provider Base Class**
   - Abstract provider interface
   - JSON-RPC client implementation
   - Event emitter pattern

3. **OpenCode Provider Adapter**
   - Primary provider implementation
   - Model configuration
   - Event mapping

4. **Backend Server Core**
   - WebSocket server
   - Basic command routing
   - Thread/turn management

#### Phase 2: Desktop App

5. **Electron Main Process**
   - Window management
   - Backend spawning
   - Protocol registration

6. **Frontend Core**
   - WebSocket client
   - Thread UI
   - Message rendering

7. **Terminal Integration**
   - xterm.js integration
   - PTY backend
   - Session management

#### Phase 3: Multi-Provider

8. **Codex Provider Adapter**
   - Port from T3 Code
   - Model options

9. **Claude Code Provider Adapter**
   - Protocol adaptation
   - Event mapping

10. **Aitlas Provider Adapter**
    - Custom protocol
    - Integration layer

#### Phase 4: Polish

11. **Settings UI**
    - Provider configuration
    - Model selection
    - Keyboard shortcuts

12. **Git Integration**
    - Branch management
    - Worktree support
    - Diff viewing

13. **Auto-Updates**
    - electron-updater setup
    - Update UI

---

## 7. Implementation Roadmap

### 7.1 Sprint 1: Foundation (Week 1-2)

**Goals:**
- Set up monorepo structure
- Define contracts package
- Implement OpenCode provider adapter
- Basic backend server

**Deliverables:**
- `packages/contracts` with core schemas
- `packages/shared` with utilities
- `apps/server` with basic WebSocket
- OpenCode provider connecting and streaming

### 7.2 Sprint 2: Desktop Shell (Week 3-4)

**Goals:**
- Electron app setup
- Frontend scaffolding
- Basic chat UI

**Deliverables:**
- `apps/desktop` launching
- `apps/web` rendering
- WebSocket connection
- Message send/receive working

### 7.3 Sprint 3: Core Features (Week 5-6)

**Goals:**
- Thread management
- Terminal integration
- File operations

**Deliverables:**
- Create/delete threads
- Terminal sessions
- File browsing

### 7.4 Sprint 4: Multi-Provider (Week 7-8)

**Goals:**
- Codex adapter
- Claude Code adapter
- Provider switching UI

**Deliverables:**
- Multiple providers working
- Model selection per provider
- Provider-specific settings

### 7.5 Sprint 5: Polish & Ship (Week 9-10)

**Goals:**
- Aitlas integration
- Auto-updates
- Documentation
- Testing

**Deliverables:**
- Alpha release
- User documentation
- CI/CD pipeline

---

## 8. Technical Decisions

### 8.1 Why Electron (not Tauri)?

T3 Code uses Electron, and for good reasons:
- **Mature ecosystem** - More libraries, examples
- **Node.js integration** - Easier backend spawning
- **Effect compatibility** - Effect has Node runtime support
- **Familiar tooling** - electron-builder, electron-updater

Tauri benefits (smaller bundle) don't outweigh migration effort.

### 8.2 Why Effect Schema?

T3 Code uses Effect for:
- **Runtime validation** - Catch errors early
- **Type generation** - Automatic TypeScript types
- **Functional error handling** - Better error messages
- **Composable schemas** - Easy to extend

### 8.3 Why JSON-RPC over stdio?

Provider communication pattern:
- **Language agnostic** - Providers can be any language
- **Simple protocol** - Well-understood, many implementations
- **Process isolation** - Provider crashes don't kill app
- **Streaming native** - Line-delimited JSON works well

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Provider API changes | Medium | High | Version pinning, adapter pattern |
| Electron bundle size | Low | Medium | Code splitting, lazy loading |
| Provider process hangs | Medium | Medium | Timeout handling, process restart |
| Model availability | Low | High | Fallback models, provider redundancy |
| Auth/token management | Medium | High | Secure storage, keychain integration |

---

## 10. Open Questions

1. **Aitlas protocol** - What communication protocol does Aitlas use?
2. **Claude Code app-server** - Does Claude Code support app-server mode?
3. **Model fallback** - Should we auto-fallback between providers if one fails?
4. **Multi-thread per provider** - Can one provider process handle multiple threads?
5. **MCP integration** - Should Nova Chat expose MCP server for tools?

---

## 11. References

- **T3 Code Repository:** https://github.com/pingdotgg/t3code
- **Effect Schema:** https://effect.website/docs/schema/introduction/
- **Electron Docs:** https://www.electronjs.org/docs/latest/
- **JSON-RPC 2.0 Spec:** https://www.jsonrpc.org/specification

---

## Appendix A: Key Code Patterns from T3 Code

### A.1 Provider Session Management

```typescript
// From codexAppServerManager.ts
class CodexAppServerManager extends EventEmitter {
  private readonly sessions = new Map<ThreadId, CodexSessionContext>();

  async startSession(input: SessionStartInput): Promise<ProviderSession> {
    // 1. Spawn provider process
    const child = spawn("codex", ["app-server"], options);
    
    // 2. Set up JSON-RPC communication
    const output = readline.createInterface({ input: child.stdout });
    
    // 3. Initialize handshake
    await this.sendRequest(context, "initialize", params);
    
    // 4. Start thread
    const result = await this.sendRequest(context, "thread/start", params);
    
    // 5. Track session
    this.sessions.set(threadId, context);
    
    return session;
  }
}
```

### A.2 Event Streaming

```typescript
// Process JSON-RPC notifications
output.on("line", (line) => {
  const message = JSON.parse(line);
  
  if (message.method && message.params) {
    // It's a notification
    const event = this.mapToProviderEvent(message);
    this.emit("event", event);
  }
});

// Frontend receives via WebSocket
ws.onmessage = (data) => {
  if (data.type === "push" && data.channel === "orchestration.domainEvent") {
    updateUI(data.data);
  }
};
```

### A.3 Orchestration Commands

```typescript
// Command types from orchestration.ts
type OrchestrationCommand =
  | { type: "project.create", projectId: string, title: string }
  | { type: "thread.create", threadId: string, projectId: string, model: string }
  | { type: "thread.turn.start", threadId: string, message: MessageInput }
  | { type: "thread.turn.interrupt", threadId: string }
  | { type: "thread.approval.respond", threadId: string, decision: string }
  | ...;

// Event types
type OrchestrationEvent =
  | { type: "project.created", projectId: string }
  | { type: "thread.created", threadId: string }
  | { type: "thread.message.added", threadId: string, message: Message }
  | { type: "thread.message.delta", threadId: string, delta: string }
  | ...;
```

---

*End of Implementation Plan*