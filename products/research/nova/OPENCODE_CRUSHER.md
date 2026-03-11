# OpenCode/Crush Integration Research

**Date:** March 11, 2026  
**Status:** Research Complete

---

## TL;DR

**OpenCode is archived** → The project moved to **Crush** (21k ⭐, by Charm).  
Crush is a TUI-based CLI, **NOT an app-server** like Codex. Integration would require a different approach.

---

## Current Architecture: Codex Provider

### How Codex Works (t3code integration)

1. **Spawns `codex app-server`** as a child process
2. **JSON-RPC over stdin/stdout** for communication
3. **Key methods:**
   - `initialize` - Set up client info
   - `model/list` - List available models
   - `account/read` - Get user subscription
   - `thread/start` or `thread/resume` - Start new or resume existing thread
   - `turn/start` - Send input to agent
   - `turn/interrupt` - Stop current turn

4. **Session management:** Handled entirely by Codex process
5. **Approvals:** JSON-RPC requests for file read/write/command execution

### Key Files

| File | Purpose |
|------|---------|
| `codexAppServerManager.ts` | Spawns/manages Codex process, JSON-RPC protocol |
| `Layers/CodexAdapter.ts` | Wraps manager in Effect service layer |
| `contracts/src/provider.ts` | Provider types and schemas |
| `contracts/src/orchestration.ts` | `ProviderKind = "codex"` |

---

## Alternative: Crush (OpenCode's Successor)

### What is Crush?

| Attribute | Details |
|-----------|---------|
| **Repo** | [charmbracelet/crush](https://github.com/charmbracelet/crush) |
| **Stars** | 21,165 ⭐ |
| **Language** | Go |
| **Status** | Active (not archived) |
| **Successor to** | OpenCode (archived) |

### Features

- Multi-model support (Anthropic, OpenAI, Gemini, Groq, etc.)
- MCP servers (stdio, HTTP, SSE)
- LSP integration
- Session-based context
- Permission system for tools
- Agent Skills support

### Key Limitation

**No app-server mode.** Crush is a TUI application, not a daemon with a protocol.

---

## Integration Approaches

### Option A: Non-Interactive CLI Mode (Recommended)

Run Crush as a subprocess with prompt input, parse JSON output.

```bash
crush -p "fix this bug" -f json -c /project/path
```

**Pros:**
- No code changes to Crush
- Quick to implement

**Cons:**
- No streaming responses
- Session state managed externally (file-based)
- Approvals handled via config (`--yolo` flag or `permissions`)

### Option B: Fork Crush + Add App-Server Mode

Fork Crush and add a `--server` flag that runs a JSON-RPC server (like Codex).

**Pros:**
- Full parity with Codex integration
- Clean protocol

**Cons:**
- Ongoing maintenance burden
- More upfront work

### Option C: Use MCP as Abstraction Layer

Treat Crush as an MCP server and communicate via MCP protocol.

**Pros:**
- Crush already supports MCP
- Standardized protocol

**Cons:**
- MCP is designed for tools, not full agent control
- Would need to wrap MCP in agent logic

---

## Implementation Plan (Option A)

### Phase 1: Contracts

```typescript
// packages/contracts/src/orchestration.ts
export const ProviderKind = Schema.Literal("codex", "crush");
export type ProviderKind = typeof ProviderKind.Type;

// packages/contracts/src/provider.ts
const CrushProviderStartOptions = Schema.Struct({
  binaryPath: Schema.optional(TrimmedNonEmptyStringSchema),
  configPath: Schema.optional(TrimmedNonEmptyStringSchema),
});

export const ProviderStartOptions = Schema.Struct({
  codex: Schema.optional(CodexProviderStartOptions),
  crush: Schema.optional(CrushProviderStartOptions),
});
```

### Phase 2: Manager Layer

Create `crushAppServerManager.ts` (new file):

- Spawn `crush` process
- Handle `-p` prompt mode
- Parse JSON output streams
- Manage session state via filesystem (`.crush/`)

### Phase 3: Adapter Layer

Create `Layers/CrushAdapter.ts`:

- Wrap manager in Effect service
- Implement `ProviderAdapterShape` interface
- Map events to provider events

### Phase 4: Registry

Update `Layers/ProviderAdapterRegistry.ts`:

```typescript
const registry = Layer.merge(
  CodexAdapterLive,
  CrushAdapterLive,  // Add this
);
```

---

## Risks & Considerations

| Risk | Mitigation |
|------|-------------|
| Crush CLI changes breaking integration | Version pin, integration tests |
| No streaming support | Option B (fork + server mode) for production |
| Approval flow complexity | Use `--yolo` for auto-approve or config-based permissions |
| Session management | External session store + file-based state |

---

## Recommendation

**Short-term:** Implement Option A (CLI mode) for MVP - quick to ship, validates demand.

**Long-term:** If Crush gains app-server mode (or we fork it), migrate to full Protocol integration.

---

## References

- Codex integration: `apps/server/src/codexAppServerManager.ts`
- Crush repo: https://github.com/charmbracelet/crush
- OpenCode (archived): https://github.com/opencode-ai/opencode
