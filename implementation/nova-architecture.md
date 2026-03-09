# Nova — Architecture Decision (2026-03-09)

**Status:** 🔵 ACTIVE  
**Architecture:** T3 Code (Chat) + Mission Control (Dashboard)  
**License:** MIT + MIT

---

## Architecture Decision

Nova is **TWO products merged**:

| Component | Source | Purpose |
|-----------|--------|---------|
| **Chat** | T3 Code | Agent interaction UI |
| **Dashboard** | Mission Control | 28 panels, monitoring |

```
┌─────────────────────────────────────────┐
│                NOVA                       │
├─────────────────────────────────────────┤
│  CHAT (T3 Code)                          │
│  • Multi-provider support                │
│  • OpenCode, Codex, Claude Code, Aitlas  │
│  • Streaming responses                   │
│  • Desktop app (Tauri)                   │
├─────────────────────────────────────────┤
│  DASHBOARD (Mission Control)             │
│  • 28 panels                             │
│  • Agents, Tasks, Tokens, Logs           │
│  • Real-time monitoring                  │
│  • OpenClaw integration                  │
└─────────────────────────────────────────┘
```

---

## T3 Code — Chat Core

**Repo:** https://github.com/pingdotgg/t3code  
**Stars:** 4.2K  
**License:** MIT  
**By:** t3 creators

### What T3 Code Provides

| Feature | Status |
|---------|--------|
| Chat UI | ✅ |
| Codex | ✅ |
| Claude Code | Coming |
| Desktop App | ✅ |
| Minimal design | ✅ |

### What Nova Adds

| Feature | T3 Code | Nova |
|---------|---------|-------|
| Chat UI | ✅ | ✅ |
| Codex | ✅ | ✅ |
| Claude Code | Coming | ✅ |
| **OpenCode** | ❌ | ✅ |
| **Aitlas Agents** | ❌ | ✅ |
| **BYOK** | ❌ | ✅ |
| **Credits** | ❌ | ✅ |

---

## Mission Control — Dashboard Core

**Repo:** https://github.com/builderz-labs/mission-control  
**License:** MIT  
**Built for:** OpenClaw (Aitlas uses OpenClaw!)

### What Mission Control Provides

| Feature | Status |
|---------|--------|
| 28 Panels | ✅ |
| OpenClaw Integration | ✅ |
| SQLite Database | ✅ |
| WebSocket/SSE | ✅ |
| RBAC | ✅ |
| 148 E2E Tests | ✅ |
| Zero external deps | ✅ |

### Panels Available

| Panel | Description |
|-------|-------------|
| Dashboard | Overview with live metrics |
| Task Board | Kanban with 6 columns |
| Agents | Agent management |
| Sessions | Active gateway sessions |
| Tokens | Usage and costs |
| Logs | Agent log browser |
| Memory | File browser/search |
| Webhooks | Outbound webhooks |
| Alerts | Alert rules |
| Cron | Scheduled tasks |
| Pipelines | Workflow orchestration |
| Gateways | Multi-gateway connections |
| Integrations | GitHub, 1Password |
| Settings | App configuration |
| ... | 14 more panels |

### What Nova Adds

| Panel | Purpose |
|-------|---------|
| **Agents Store** | Browse/install agents |
| **Actions (f.xyz)** | MCP tools marketplace |
| **Nexus Runtime** | Agent execution monitoring |
| **Credits** | Subscription/billing UI |

---

## Implementation Plan

### Phase 1: Fork and Branding (Day 1-2)

```bash
# Fork T3 Code
git clone https://github.com/pingdotgg/t3code.git aitlas-nova-chat

# Fork Mission Control
git clone https://github.com/builderz-labs/mission-control.git aitlas-nova-dashboard

# Apply Aitlas branding
# - Replace logos
# - Update colors
# - Add Aitlas domain
```

### Phase 2: Multi-Provider Support (Day 3-5)

**Provider Router Pattern:**

```typescript
// lib/providers/router.ts
type Provider = 'opencode' | 'codex' | 'claude-code' | 'aitlas';

interface ProviderConfig {
  name: string;
  apiKey?: string;  // BYOK
  baseUrl: string;
  models: string[];
}

const providers: Record<Provider, ProviderConfig> = {
  opencode: {
    name: 'OpenCode',
    baseUrl: 'https://opencode.ai/zen/v1',
    models: ['glm-5', 'kimi-k2.5', 'minimax-m2.5']
  },
  codex: {
    name: 'Codex',
    baseUrl: 'https://api.openai.com/v1',
    models: ['o1', 'o3-mini', 'gpt-4o']
  },
  'claude-code': {
    name: 'Claude Code',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3.5-sonnet', 'claude-3-opus']
  },
  aitlas: {
    name: 'Aitlas',
    baseUrl: 'https://nexus.aitlas.xyz/v1',
    models: ['curated-agents']
  }
};
```

### Phase 3: Aitlas Panels (Day 6-8)

**Agents Store Panel:**

```typescript
// components/panels/AgentsStorePanel.tsx
export function AgentsStorePanel() {
  const { data: agents } = useQuery(['agents-store'], () =>
    fetch('/api/agents-store').then(r => r.json())
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      {agents?.map(agent => (
        <AgentCard 
          key={agent.id} 
          agent={agent}
          onInstall={() => installAgent(agent.id)}
        />
      ))}
    </div>
  );
}
```

**Credits Panel:**

```typescript
// components/panels/CreditsPanel.tsx
export function CreditsPanel() {
  const { data: credits } = useQuery(['credits'], () =>
    fetch('/api/credits').then(r => r.json())
  );

  return (
    <div className="space-y-4">
      <CreditBalance balance={credits?.balance} />
      <CreditUsageChart usage={credits?.usage} />
      <BuyCreditsButton />
    </div>
  );
}
```

### Phase 4: Merge and Deploy (Day 9-10)

```bash
# Option A: Single app with routing
nova.aitlas.xyz/chat      → T3 Code
nova.aitlas.xyz/dashboard → Mission Control

# Option B: Separate apps
chat.aitlas.xyz      → T3 Code
nova.aitlas.xyz      → Mission Control
```

---

## Key Differentiators

| Feature | T3 Code | Mission Control | Nova |
|---------|---------|-----------------|------|
| Chat UI | ✅ | ❌ | ✅ |
| Dashboard | ❌ | ✅ | ✅ |
| OpenClaw | ❌ | ✅ | ✅ |
| **Multi-provider** | ❌ | ❌ | ✅ |
| **BYOK** | ❌ | ❌ | ✅ |
| **Credits** | ❌ | ❌ | ✅ |
| **Agents Store** | ❌ | ❌ | ✅ |
| **Actions (f.xyz)** | ❌ | ❌ | ✅ |

---

## Time to MVP

| Phase | Duration | Output |
|-------|----------|--------|
| Fork & Branding | 2 days | Two repos branded |
| Multi-provider | 3 days | Chat with 4 providers |
| Aitlas Panels | 3 days | Store, Actions, Credits |
| Merge & Deploy | 2 days | Single deployed app |

**Total: 10 days to MVP**

---

## Subagents Working

| Task | Status |
|------|--------|
| T3 Code analysis | 🔄 Running |
| Mission Control analysis | 🔄 Running |

---

**Last Updated:** 2026-03-09 07:45  
**Next:** Subagent completion → Merge analyses