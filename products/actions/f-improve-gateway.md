# Tool Gateway Integration — f.improve

> ⚠️ **Proprietary** — All Aitlas products are **closed source**.

---

## Overview

f.improve integrates with the Aitlas Tool Gateway for:
- **Authentication** — Verify user session
- **Credit deduction** — Charge credits per tool call
- **RTK compression** — Reduce token costs 60-80%
- **Retry logic** — Handle failures gracefully
- **Rate limiting** — Prevent abuse

---

## Tool Registration

```typescript
// tool-gateway/tools/f-improve.ts

export const f_improve_tools = {
  improve_code: {
    name: 'improve_code',
    category: 'developer',
    credits: 10,
    timeout: 300000, // 5 minutes
    rate_limit: { window: 3600, max: 10 }, // 10 per hour
    handler: 'f-improve/handlers/improve_code',
  },
  
  quick_scan: {
    name: 'quick_scan',
    category: 'developer',
    credits: 5,
    timeout: 60000, // 1 minute
    rate_limit: { window: 3600, max: 20 },
    handler: 'f-improve/handlers/quick_scan',
  },
  
  deep_improve: {
    name: 'deep_improve',
    category: 'developer',
    credits: 50,
    timeout: 600000, // 10 minutes
    rate_limit: { window: 86400, max: 5 }, // 5 per day
    handler: 'f-improve/handlers/deep_improve',
  },
  
  get_experiments: {
    name: 'get_experiments',
    category: 'developer',
    credits: 0, // Free
    timeout: 5000,
    rate_limit: { window: 60, max: 60 }, // 1 per second
    handler: 'f-improve/handlers/get_experiments',
  },
};
```

---

## Gateway Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Tool Gateway Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. REQUEST                                                  │
│     POST /api/v1/tools/improve_code                         │
│     Authorization: Bearer <session_token>                    │
│     { code, tests, goal }                                    │
│                                                              │
│  2. AUTH CHECK                                               │
│     ├── Validate session token                              │
│     ├── Load user credits                                   │
│     └── Check BYOK API key exists                           │
│                                                              │
│  3. CREDIT CHECK                                             │
│     ├── Credits >= 10?                                      │
│     ├── Reserve credits (atomic)                            │
│     └── If insufficient → 402 Payment Required              │
│                                                              │
│  4. RATE LIMIT                                               │
│     ├── Check rate limit (Redis)                            │
│     └── If exceeded → 429 Too Many Requests                 │
│                                                              │
│  5. EXECUTE                                                   │
│     ├── Load BYOK API key (encrypted)                       │
│     ├── Decrypt key (never log/assign to var)               │
│     ├── Call f.improve backend                              │
│     └── Wait for response (timeout: 5 min)                  │
│                                                              │
│  6. RTK COMPRESS                                             │
│     ├── Compress output (60-80% token reduction)            │
│     └── Return compressed to caller                         │
│                                                              │
│  7. FINALIZE                                                  │
│     ├── Deduct credits (if success)                         │
│     ├── Release reserved credits (if failed)                │
│     └── Log to audit trail                                  │
│                                                              │
│  8. RESPONSE                                                  │
│     { improved_code, metrics, iterations_used }              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Credit Pricing

| Tool | Credits | Approx Cost* |
|------|---------|--------------|
| `improve_code` | 10 | ~$0.10 |
| `quick_scan` | 5 | ~$0.05 |
| `deep_improve` | 50 | ~$0.50 |
| `get_experiments` | 0 | Free |

*Based on $0.01/credit pricing. User's LLM costs are separate (BYOK).

---

## BYOK Key Flow

```
User registers API key:
  → Encrypted with AES-256-GCM
  → Stored in api_keys table
  → Never logged, never assigned to variable

Tool call:
  → Gateway fetches encrypted key
  → Decrypts inline (never stores)
  → Passes directly to LLM client
  → Key leaves process only via HTTPS to LLM provider
```

---

## Nexus Runtime Integration

f.improve tools are callable from Nexus's 5-phase loop:

```typescript
// In Nexus agent

async function planPhase(task) {
  const tools = await toolGateway.listAvailable();
  
  // f.improve tools appear automatically
  if (task.needsCodeImprovement) {
    return {
      tool: 'improve_code',
      params: {
        code: task.code,
        tests: task.tests,
        goal: 'performance'
      }
    };
  }
}
```

---

## Implementation Files

| File | Purpose |
|------|---------|
| `tool-gateway/tools/f-improve.ts` | Tool registration |
| `tool-gateway/handlers/f-improve/` | Tool handlers |
| `tool-gateway/middleware/auth.ts` | Session validation |
| `tool-gateway/middleware/credits.ts` | Credit deduction |
| `tool-gateway/middleware/rate-limit.ts` | Rate limiting |
| `tool-gateway/rtk/compress.ts` | RTK compression |

---

## Error Handling

| Error | Code | Response |
|-------|------|----------|
| No session | 401 | `{ error: "unauthorized" }` |
| No credits | 402 | `{ error: "payment_required", credits_needed: 10 }` |
| No BYOK key | 403 | `{ error: "api_key_required" }` |
| Rate limited | 429 | `{ error: "rate_limited", retry_after: 3600 }` |
| Timeout | 504 | `{ error: "timeout" }` |
| LLM error | 502 | `{ error: "llm_error", details: "..." }` |

---

## Next Steps

1. [ ] Implement `tool-gateway/tools/f-improve.ts`
2. [ ] Implement handlers for each tool
3. [ ] Add credit deduction to Nexus
4. [ ] Test end-to-end: Nova → Nexus → Tool Gateway → f.improve

---

**Last Updated:** 2026-03-12