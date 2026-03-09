# Nova Chat Build - Implementation Notes

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Created:** 2026-03-09
**Status:** Complete
**Task:** Build Nova's multi-provider chat system

---

## Summary

Successfully created the multi-provider chat system for Nova with:

1. **Provider System** (`lib/providers/`)
   - Types and interfaces for all providers
   - OpenCode provider (primary)
   - Codex provider
   - Claude Code provider
   - Aitlas provider
   - Provider router for unified access

2. **Chat Components** (`components/chat/`)
   - ChatInterface - Main chat UI
   - ProviderSelector - Provider/model dropdown
   - MessageList - Message display with streaming
   - ChatInput - Input with send/interrupt controls

---

## Files Created

### Provider System

| File | Lines | Purpose |
|------|-------|---------|
| `lib/providers/types.ts` | ~350 | Type definitions and Zod schemas |
| `lib/providers/opencode.ts` | ~400 | OpenCode JSON-RPC adapter |
| `lib/providers/codex.ts` | ~350 | Codex JSON-RPC adapter |
| `lib/providers/claude-code.ts` | ~400 | Claude Code adapter |
| `lib/providers/aitlas.ts` | ~400 | Aitlas HTTP/WebSocket adapter |
| `lib/providers/router.ts` | ~300 | Provider routing and registry |
| `lib/providers/index.ts` | ~60 | Clean exports |

### Chat Components

| File | Lines | Purpose |
|------|-------|---------|
| `components/chat/ChatInterface.tsx` | ~280 | Main chat container |
| `components/chat/ProviderSelector.tsx` | ~250 | Provider/model selection |
| `components/chat/MessageList.tsx` | ~320 | Message rendering |
| `components/chat/ChatInput.tsx` | ~250 | Input controls |
| `components/chat/index.ts` | ~10 | Clean exports |

---

## Architecture

### Provider Abstraction

Each provider implements the `ProviderAdapter` interface:

```typescript
interface ProviderAdapter {
  kind: ProviderKind;
  config: ProviderConfig;
  
  // Lifecycle
  startSession(input: SessionStartInput): Promise<SessionStartResult>;
  stopSession(threadId: string): Promise<void>;
  getSession(threadId: string): Promise<ProviderSession | undefined>;
  
  // Communication
  sendMessage(input: SendMessageInput): Promise<TurnStartResult>;
  interruptTurn(threadId: string, turnId?: string): Promise<void>;
  
  // Approval handling
  respondToApproval(input: ApprovalResponseInput): Promise<void>;
  
  // Events
  on(event: 'event', handler: (event: ProviderEvent) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'close', handler: () => void): void;
  
  // Health
  healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }>;
}
```

### Communication Patterns

| Provider | Protocol | Command |
|----------|----------|---------|
| OpenCode | JSON-RPC 2.0 over stdio | `opencode app-server` |
| Codex | JSON-RPC 2.0 over stdio | `codex app-server` |
| Claude Code | JSON-RPC 2.0 over stdio | `claude-code app-server` |
| Aitlas | HTTP/WebSocket | `http://localhost:3100` |

### Event Flow

```
User Input → ChatInterface → ProviderRouter → ProviderAdapter
                                         ↓
                                    Provider Process
                                         ↓
                              JSON-RPC Notification
                                         ↓
                                   Session Context
                                         ↓
                                    ProviderEvent
                                         ↓
                            ChatInterface (update UI)
```

### Streaming Events

Standard event types for all providers:

- `content.delta` - Text streaming chunks
- `turn.started` - New turn begun
- `turn.completed` - Turn finished
- `item.started` - Tool/action started
- `item.updated` - Progress update
- `item.completed` - Action finished
- `request.opened` - Approval needed

---

## Provider Details

### OpenCode (Primary)

- **Endpoint:** `https://opencode.ai/zen/v1`
- **Models:** GLM-5, Kimi K2.5, MiniMax M2.5, Qwen 3.5 Plus
- **Auth:** API key via `OPENCODE_API_KEY`
- **Features:** Streaming, approvals, multi-turn

### Codex

- **Auth:** `OPENAI_API_KEY`
- **Models:** GPT-5.4, GPT-5.3 Codex, GPT-5.3 Codex Spark
- **Features:** Code-optimized responses

### Claude Code

- **Auth:** `ANTHROPIC_API_KEY`
- **Models:** Claude Sonnet 4, Claude Opus 4, Claude 3.5 Sonnet/Haiku
- **Features:** Vision support, MCP tools

### Aitlas

- **Endpoint:** Configurable (default: `http://localhost:3100`)
- **Models:** Atlas Primary, Coder, Analyst, Architect
- **Auth:** None required
- **Features:** Multi-agent system

---

## Component Structure

### ChatInterface

Main container that:
- Manages thread lifecycle
- Handles provider/model selection
- Processes streaming events
- Coordinates message display

### ProviderSelector

Dual dropdown for:
- Provider selection (OpenCode, Codex, etc.)
- Model selection (provider-specific models)
- Shows vision support badge
- Compact mode available

### MessageList

Renders messages with:
- Role-based styling (user/assistant/system)
- Content type rendering (text, code, images, tools)
- Streaming message display with cursor
- Auto-scroll to bottom

### ChatInput

Text input with:
- Auto-resize textarea
- Send button (Enter key)
- Stop button during streaming
- Character count at 80%+ capacity
- Keyboard shortcut hints

---

## Usage Examples

### Basic Usage

```tsx
import { ChatInterface } from '@/components/chat';

function ChatPage() {
  return (
    <ChatInterface
      initialProvider="opencode"
      onThreadCreate={(thread) => console.log('Thread:', thread)}
      onMessageSend={(message) => console.log('Sent:', message)}
    />
  );
}
```

### Direct Provider Access

```tsx
import { getProviderRouter } from '@/lib/providers';

const router = getProviderRouter();

// Start session
await router.startSession({
  threadId: 'my-thread',
  provider: 'opencode',
  model: 'glm-5',
});

// Send message
await router.sendMessage({
  threadId: 'my-thread',
  content: [{ type: 'text', text: 'Hello!' }],
});

// Listen for events
router.on('event', (event) => {
  console.log('Event:', event);
});
```

### Health Check All Providers

```tsx
import { getProviderRouter } from '@/lib/providers';

const router = getProviderRouter();
const health = await router.healthCheckAll();

// Returns: { opencode: { healthy: true }, codex: { healthy: false, error: '...' }, ... }
```

---

## Next Steps

### Required

1. **API Routes** - Create WebSocket or API endpoints for frontend
2. **Session Persistence** - Store threads in database
3. **Error Handling** - Add retry logic, better error messages
4. **Testing** - Add unit and integration tests

### Optional

1. **File Attachments** - Implement file upload support
2. **Code Execution** - Run code blocks inline
3. **MCP Tools** - Expose Model Context Protocol tools
4. **Branching** - Support conversation branching
5. **Export** - Export conversations to markdown/JSON

---

## Dependencies

Existing shadcn/ui components used:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`, `Badge`, `Label`
- `Avatar`, `AvatarFallback`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Textarea`, `Input`
- `ScrollArea`, `Separator`
- `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`

---

## Notes

- All providers use EventEmitter pattern for events
- OpenCode/Codex/Claude Code use stdio JSON-RPC (T3 Code pattern)
- Aitlas uses HTTP/WebSocket for remote agent access
- Streaming is handled via `content.delta` events
- Provider router handles session-to-provider mapping
- Components are fully typed with TypeScript

---

## References

- T3 Code Architecture: [nova-chat-implementation.md](./nova-chat-implementation.md)
- Provider patterns from T3 Code analysis
- JSON-RPC 2.0 Specification: https://www.jsonrpc.org/specification