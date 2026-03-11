# OpenCode Integration Research

**Date:** March 11, 2026  
**Status:** Research Complete ✅

---

## TL;DR

**This is the right repo:** https://github.com/anomalyco/opencode  
**120k ⭐** (massive!), **TypeScript**, **Active**  
**Protocol:** REST API over HTTP + SSE for events

---

## What is OpenCode?

| Attribute | Details |
|-----------|---------|
| **Repo** | [anomalyco/opencode](https://github.com/anomalyco/opencode) |
| **Stars** | 119,771 ⭐ |
| **Language** | TypeScript (Bun-native) |
| **Status** | Active |
| **License** | MIT |
| **Default Branch** | `dev` |

### Key Features (from README)

- 100% open source
- Provider-agnostic (Anthropic, OpenAI, Google, local models)
- Out-of-the-box LSP support
- Client/server architecture → **TUI is just one client**
- Built-in agents: `build` (full-access), `plan` (read-only), `general` (complex tasks)
- MCP support (stdio, HTTP, SSE)
- Agent Skills support

### How It Differs from Claude Code

> "A client/server architecture. This, for example, can allow OpenCode to run on your computer while you drive it remotely from a mobile app, meaning that the TUI frontend is just one of the possible clients."

---

## Server Architecture

OpenCode runs as an **HTTP server** with REST endpoints. This is much cleaner than Codex's JSON-RPC over stdin/stdout.

### Starting the Server

```bash
opencode4096 --hostname 0 serve --port .0.0.0
# Optional: --password for basic auth
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/session` | List all sessions |
| `POST` | `/session` | Create new session |
| `GET` | `/session/:sessionID` | Get session info |
| `POST` | `/session/:sessionID/message` | Send message (streaming) |
| `POST` | `/session/:sessionID/prompt_async` | Send message async |
| `GET` | `/session/:sessionID/message` | Get session messages |
| `POST` | `/session/:sessionID/abort` | Abort running session |
| `POST` | `/session/:sessionID/permissions/:permissionID` | Approve/deny permission |
| `GET` | `/event` | SSE event stream |
| `GET` | `/provider` | List providers |
| `GET` | `/agent` | List agents |
| `GET` | `/skill` | List skills |
| `GET` | `/path` | Get paths (home, state, config, worktree, directory) |

### Authentication

- Optional basic auth via `--password` flag
- CORS support for browser clients

### Event Stream

SSE (Server-Sent Events) at `/event` for real-time updates:
- `server.connected`
- `server.heartbeat`
- Session events (tool calls, permission requests, etc.)

---

## Comparison: Codex vs OpenCode

| Aspect | Codex (current) | OpenCode |
|--------|-----------------|----------|
| **Protocol** | JSON-RPC (stdin/stdout) | REST API (HTTP) |
| **Stars** | 1.8k | 120k |
| **Language** | TypeScript | TypeScript |
| **Provider** | Anthropic-only | Multi-provider |
| **Architecture** | App-server (child process) | HTTP Server |
| **Integration** | Complex (process spawn) | Simple (HTTP client) |
| **Auth** | None | Optional basic auth |
| **Events** | JSON-RPC notifications | SSE |

---

## Implementation Plan

### Phase 1: Contracts

```typescript
// packages/contracts/src/orchestration.ts
export const ProviderKind = Schema.Literal("codex", "opencode");

// packages/contracts/src/provider.ts
const OpenCodeProviderStartOptions = Schema.Struct({
  port: Schema.optional(Schema.Number),
  hostname: Schema.optional(TrimmedNonEmptyStringSchema),
  password: Schema.optional(TrimmedNonEmptyStringSchema),
});

export const ProviderStartOptions = Schema.Struct({
  codex: Schema.optional(CodexProviderStartOptions),
  opencode: Schema.optional(OpenCodeProviderStartOptions),
});
```

### Phase 2: Manager Layer

Create `opencodeServerManager.ts`:

- Spawn `opencode serve` process
- Wait for server ready (port listening)
- HTTP client for REST calls
- Parse streaming responses

### Phase 3: Adapter Layer

Create `Layers/OpenCodeAdapter.ts`:

- Wrap manager in Effect service
- Implement `ProviderAdapterShape` interface
- Map REST responses to provider events

### Phase 4: Registry

Update `Layers/ProviderAdapterRegistry.ts`:

```typescript
const registry = Layer.merge(
  CodexAdapterLive,
  OpenCodeAdapterLive,  // Add this
);
```

---

## Advantages of OpenCode Integration

1. **Simpler protocol** - HTTP REST > JSON-RPC over stdio
2. **Provider flexibility** - Users can use any LLM (Anthropic, OpenAI, Gemini, local, etc.)
3. **Massive community** - 120k stars vs 1.8k
4. **Active development** - Not a niche project
5. **Better scalability** - HTTP server can run remotely
6. **Built-in auth** - No custom auth layer needed

---

## Risks

| Risk | Mitigation |
|------|-------------|
| Bun dependency | Server runs on Bun; CLI wrapper available |
| API changes | Version pin + integration tests |
| Feature parity | Full feature map needed |

---

## Recommendation

**Add OpenCode as second provider** alongside Codex. Architecture is cleaner, community is massive, and provider flexibility is a huge win for users.

---

## References

- OpenCode repo: https://github.com/anomalyco/opencode
- Server implementation: `packages/opencode/src/server/server.ts`
- Session routes: `packages/opencode/src/server/routes/session.ts`
- Install: `npm i -g opencode-ai`
