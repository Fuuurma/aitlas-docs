# Nova Hybrid Model

**Last Updated:** 2026-03-08  
**Purpose:** Explain how Nova (Aitlas UI) combines free BYOK mode with paid Aitlas ecosystem

---

## Overview

**Aitlas = Nova + Agents Store + Actions**

Nova is the UI layer of Aitlas. It offers two modes:

- **Free tier:** BYOK with multiple coding agents (Codex, Claude Code, OpenCode, etc.)
- **Paid tier:** Full Aitlas ecosystem (Agents Store + Actions + Nexus runtime orchestration)

**Pricing for Nexus runtime:**
- Subscription: $20/month (unlimited)
- Credits: Pay-per-use ($5 = 500 credits)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Nova (T3 Code fork)                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Provider Router                      │   │
│  │                                                     │   │
│  │   BYOK Mode (Free)        Aitlas Mode (Paid)       │   │
│  │   ────────────────        ──────────────────       │   │
│  │   • Codex                 • Nova Backend          │   │
│  │   • Claude Code           • f.xyz Actions          │   │
│  │   • OpenCode              • Agents Store           │   │
│  │   • Gemini                • Memory (pgvector)      │   │
│  │   • (User's keys)         • Tasks (Symphony)       │   │
│  │                           • Nexus runtime orchestration    │   │
│  │                           • (User's keys)          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Mode Comparison

### BYOK Mode (Free)

| Aspect | Details |
|--------|---------|
| **Cost** | Free (user pays API costs) |
| **Agents** | Codex, Claude Code, OpenCode, Gemini, etc. |
| **Tools** | Agent's built-in tools |
| **Memory** | Local only (if supported by agent) |
| **Orchestration** | None (single agent per session) |
| **API Keys** | User provides, stored locally |

**What user gets:**
- Beautiful UI (T3 Code)
- Choice of coding agents
- Desktop + web app
- Real-time streaming

**What we get:**
- User acquisition
- Time on app
- Upsell opportunity

---

### Aitlas Mode (Paid - $20/mo OR Credits)

| Aspect | Details |
|--------|---------|
| **Cost** | $20/mo subscription OR pay-per-use credits |
| **Agents** | From Agents Store (61+ templates) |
| **Tools** | Actions library (50+ pre-built) |
| **Memory** | Persistent, semantic search |
| **Orchestration** | Nexus runtime (multi-agent coordination) |
| **API Keys** | User provides, stored locally |

**What user gets:**
- Everything in BYOK mode
- Agents Store access
- Actions library
- Nexus runtime orchestration
- Memory system
- Task scheduling
- Parallel execution
- Reactions (auto CI fixes)

**What we get:**
- Subscription revenue
- Credit purchases
- Loyal users
- Ecosystem growth

---

## Provider Architecture

### Directory Structure

```
apps/nexus/server/providers/
├── router.ts              # Mode detection + routing
├── byok/
│   ├── codex.ts           # Codex CLI wrapper
│   ├── claude-code.ts     # Claude Code CLI wrapper
│   ├── opencode.ts        # OpenCode CLI wrapper
│   └── gemini.ts          # Gemini CLI wrapper
└── aitlas/
    ├── agent-runtime.ts   # Our agent runtime
    ├── actions.ts         # f.xyz Actions integration
    ├── memory.ts          # Memory API
    └── orchestration.ts   # Nexus runtime integration
```

### Router Logic

```typescript
// apps/nexus/server/providers/router.ts

export async function routeRequest(session: Session, message: Message) {
  const mode = session.mode; // 'byok' | 'aitlas'
  const provider = session.provider; // 'codex' | 'claude' | 'opencode' | 'aitlas'
  
  // Check subscription for Aitlas mode
  if (mode === 'aitlas' && !hasActiveSubscription(session.userId)) {
    throw new SubscriptionRequiredError();
  }
  
  // Route to appropriate provider
  switch (provider) {
    case 'codex':
      return byok.codex.handle(session, message);
    case 'claude':
      return byok.claudeCode.handle(session, message);
    case 'opencode':
      return byok.opencode.handle(session, message);
    case 'aitlas':
      return aitlas.agentRuntime.handle(session, message);
    default:
      throw new UnsupportedProviderError(provider);
  }
}
```

---

## UI Flow

### Mode Selection (First Run)

```
┌─────────────────────────────────────────────┐
│  Welcome to Nova                           │
│                                             │
│  How would you like to use Nova?           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🆓 Free Mode (BYOK)                │   │
│  │                                     │   │
│  │  Use your own API keys with:        │   │
│  │  • Codex                            │   │
│  │  • Claude Code                      │   │
│  │  • OpenCode                         │   │
│  │  • Gemini                           │   │
│  │                                     │   │
│  │  You pay only for API usage.        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  ⭐ Pro Mode ($20/mo)               │   │
│  │                                     │   │
│  │  Full Aitlas ecosystem:             │   │
│  │  ✅ f.xyz Actions                   │   │
│  │  ✅ 61+ Agent templates             │   │
│  │  ✅ Persistent memory               │   │
│  │  ✅ Task orchestration              │   │
│  │  ✅ Multi-agent teams               │   │
│  │                                     │   │
│  │  Still BYOK - you provide keys.     │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### API Key Setup

```
┌─────────────────────────────────────────────┐
│  Add your API keys                          │
│                                             │
│  Keys are stored locally and encrypted.     │
│  We never see or store your keys.           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  OpenAI API Key                     │   │
│  │  [sk-••••••••••••••••••••]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Anthropic API Key                  │   │
│  │  [sk-ant-••••••••••••••••••••]      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  GLM API Key (OpenCode)             │   │
│  │  [••••••••••••••••••••••••]         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Save Keys]                                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Billing

### Subscription ($20/month)

```typescript
// Check subscription for Aitlas features
export async function checkSubscription(userId: string): Promise<boolean> {
  const subscription = await db.subscription.findUnique({
    where: { userId }
  });
  
  return subscription?.status === 'active';
}
```

### Credits (Pay-per-use)

```typescript
// Credit system for occasional users
const CREDIT_COSTS = {
  orchestration: 10,    // per task
  agent_execution: 5,   // per agent
  action: 1,            // simple actions
  action_complex: 5,    // complex actions
};

export async function deductCredits(userId: string, amount: number): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId } });
  
  if (user.credits < amount) {
    throw new InsufficientCreditsError();
  }
  
  await db.user.update({
    where: { id: userId },
    data: { credits: { decrement: amount } }
  });
  
  return true;
}
```

### Stripe Integration

```typescript
// Create checkout session
export async function createCheckoutSession(userId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: 'price_aitlas_pro_monthly',
      quantity: 1
    }],
    success_url: `${BASE_URL}/settings?subscription=success`,
    cancel_url: `${BASE_URL}/settings?subscription=canceled`
  });
  
  return session.url;
}
```

---

## Key Differences from T3 Code

| Aspect | T3 Code Original | Nova (Our Fork) |
|--------|------------------|------------------|
| **Providers** | Codex only | Codex, Claude, OpenCode, Gemini, Aitlas |
| **Business model** | Unknown | Free BYOK + Paid Aitlas |
| **Backend** | Codex CLI | Provider router + Nova API |
| **Features** | Basic chat | Full ecosystem for Aitlas mode |
| **Open source** | No contributions | We fork and maintain |

---

## File Locations

This file is shared across all templates:
- `aitlas-ui-template/docs/architecture/NEXUS_HYBRID_MODEL.md`
- `aitlas-action-template/docs/NEXUS_HYBRID_MODEL.md`
- `aitlas-worker-template/docs/NEXUS_HYBRID_MODEL.md`
- `aitlas-cli/docs/NEXUS_HYBRID_MODEL.md`