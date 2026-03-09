# Nova Build Session (2026-03-09)

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
## Status: ✅ Foundation Complete

**Repo:** https://github.com/Fuuurma/Nova  
**Location:** `./Nova/`

---

## What Was Built

### 1. Multi-Provider Chat System

Based on T3 Code patterns (JSON-RPC over stdio, WebSocket streaming).

| Provider | File | Description |
|----------|------|-------------|
| OpenCode | `lib/providers/opencode.ts` | Primary provider |
| Codex | `lib/providers/codex.ts` | OpenAI CLI |
| Claude Code | `lib/providers/claude-code.ts` | Anthropic CLI |
| Aitlas | `lib/providers/aitlas.ts` | Custom agents |

### 2. Dashboard Panels

Based on Mission Control patterns (28 panels, SQLite, WebSocket+SSE).

| Panel | Description |
|-------|-------------|
| AgentsStorePanel | Browse/install agents |
| ActionsPanel | f.xyz marketplace |
| CreditsPanel | Credits/subscription UI |
| NexusRuntimePanel | Runtime monitoring |

### 3. API Routes

| Endpoint | Purpose |
|----------|---------|
| `/api/chat` | SSE streaming responses |
| `/api/agents-store` | List/install agents |
| `/api/actions` | List/execute actions |
| `/api/credits` | Get balance/purchase |

---

## Architecture

```
Nova = T3 Code (Chat) + Mission Control (Dashboard)
```

### Chat Flow
```
User → ChatInterface → ProviderRouter → ProviderAdapter → SSE Stream
```

### Provider Pattern
```typescript
interface ProviderAdapter {
  startSession(input: SessionStartInput): Promise<SessionStartResult>;
  sendMessage(input: SendMessageInput): Promise<TurnStartResult>;
  sendApproval(input: ApprovalResponseInput): Promise<void>;
  closeSession(): Promise<void>;
  on(event: ProviderEvent, callback: Function): void;
}
```

---

## Key Decisions

1. **OpenCode as primary provider** - Best fit for Nova's multi-model needs
2. **SSE for streaming** - Simpler than WebSocket for chat
3. **Route groups** - Separated /chat and /dashboard cleanly
4. **Rainmaker first** - First killer agent to seed ecosystem

---

## Files Created

**Total: 26 files, 6,000+ lines**

```
Nova/
├── lib/providers/         # 7 files (providers + router)
├── components/chat/       # 5 files (UI components)
├── components/panels/     # 8 files (dashboard panels)
├── app/api/               # 4 files (API routes)
├── app/ pages/            # 5 files (pages)
└── docs/agents/           # 1 file (Rainmaker spec)
```

---

## Commits

| Commit | Description |
|--------|-------------|
| `1bf186b` | feat: Nova multi-provider chat + dashboard panels |
| `992f5a8` | feat: add chat page and update Nova config |
| `59c0709` | fix: resolve TypeScript errors |
| `7910a1e` | feat: add Nova navigation and branding |
| `79ce83f` | feat: add dashboard, agents, actions, credits pages |
| `9813b7b` | docs: update README with architecture |
| `0ad6164` | feat: add chat API route and Rainmaker spec |

---

## Next Steps

1. **Test providers** - Connect to real OpenCode/Codex/Claude Code
2. **Build Rainmaker** - First killer agent
3. **Implement ADR-001** - BYOK key cache
4. **Implement ADR-002** - REFLECT opt-in
5. **Deploy** - Push to Vercel/Fly.io

---

## Lessons Learned

1. **Next.js parallel routes conflict** - Two route groups with page.tsx at root causes build error
2. **GitHub push protection is strict** - Filter secrets from git history before push
3. **SSE is simpler than WebSocket** - For chat streaming, SSE is sufficient

---

**Created:** 2026-03-09  
**Status:** Foundation complete, ready for development