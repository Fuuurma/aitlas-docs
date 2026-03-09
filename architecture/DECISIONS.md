# Architecture Decision Records (ADRs)

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**Last Updated:** 2026-03-08

---

## ADR-001: BYOK Key Flow for Workers


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


### Context


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


When a worker needs to make an LLM call on behalf of a BYOK user, it needs access to the user's API key. Current spec says:

1. Task record stores `userId`
2. Worker fetches `ApiKey` by `userId + provider`
3. Worker decrypts key
4. Worker makes LLM call

**Concern:** Every PLAN call hits the DB for a decrypt. For a 20-step task, that's 20 DB calls + decrypts per task.

### Options Considered


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


#### Option A: Status Quo (Fetch on Every Call)


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

```
Worker → DB (get key) → Decrypt → LLM Call
```

**Pros:**
- Simple
- Key is always fresh (user can rotate anytime)
- No task record bloat

**Cons:**
- DB hit on every LLM call
- Decrypt overhead on every call

#### Option B: Ephemeral Encrypted Token in Task Record


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

```
Task created → Encrypt key with session key → Store in task record
Worker → Decrypt from task record → LLM Call
```

**Pros:**
- No DB hit during execution
- Faster loop

**Cons:**
- Task record stores encrypted key (security concern?)
- Key rotation doesn't affect running tasks
- More complex key management
- What if task is retried later with rotated key?

#### Option C: Worker Cache with TTL


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

```
First call → DB fetch + decrypt → Cache in memory (5 min TTL)
Subsequent calls → Use cache
```

**Pros:**
- No DB hit on every call
- Key still fresh (5 min TTL)
- No task record bloat

**Cons:**
- Cache invalidation complexity
- Multi-worker coordination (if using shared cache)

### Decision


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**Use Option C: Worker Cache with TTL (5 minutes)**

```typescript
// lib/key-cache.ts

const keyCache = new Map<string, { key: string; expiresAt: number }>();

async function getDecryptedKey(userId: string, provider: string): Promise<string> {
  const cacheKey = `${userId}:${provider}`;
  const cached = keyCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.key;
  }
  
  // Fetch from DB
  const apiKey = await db.apiKey.findFirst({
    where: { userId, provider, isActive: true }
  });
  
  if (!apiKey) throw new Error(`No API key for ${provider}`);
  
  const decrypted = await decrypt(apiKey.encryptedKey);
  
  // Cache for 5 minutes
  keyCache.set(cacheKey, {
    key: decrypted,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
  
  return decrypted;
}
```

**Rationale:**
- 5-minute TTL means key is "fresh enough" for most tasks
- User key rotation propagates within 5 minutes
- No task record bloat
- Simple implementation

**Impact:**
- 1 DB call per 5 minutes per (user, provider) instead of every LLM call
- For a 20-step task taking 10 minutes: 2 DB calls instead of 20

---

## ADR-002: REFLECT Phase Configuration


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


### Context


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


The 5-phase loop (OBSERVE → PLAN → ACT → REFLECT → PERSIST) adds 2 extra LLM calls per step:
- PLAN call before action
- REFLECT call after action

For a 20-step task, that's **40 extra LLM calls** on the user's BYOK key.

**Concern:** Is this acceptable? Should REFLECT be optional/configurable?

### Analysis


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**What REFLECT provides:**
1. Quality assessment of tool output
2. Error detection before compounding
3. Direction correction
4. Learning for memory

**When REFLECT is valuable:**
- Complex research tasks
- Multi-step reasoning
- High-stakes actions (code changes, payments)

**When REFLECT is overkill:**
- Simple lookups (single tool call)
- Deterministic actions
- Low-stakes tasks

### Decision


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**Make REFLECT configurable per task, default OFF for Phase 1**

```prisma
model Task {
  // ... existing fields
  reflectEnabled   Boolean @default(false)  // REFLECT phase on/off
  reflectThreshold Int     @default(2)      // Only reflect if steps >= threshold
}
```

```typescript
// Task creation
await db.task.create({
  data: {
    goal: "Research Solana DeFi",
    reflectEnabled: true,  // Complex task, enable REFLECT
    // ...
  }
});

await db.task.create({
  data: {
    goal: "Check BTC price",
    reflectEnabled: false,  // Simple lookup, skip REFLECT
    // ...
  }
});
```

**Agent-level defaults:**

| Agent | reflectEnabled | Reason |
|-------|---------------|--------|
| f.researcher | `true` | Complex research benefits from reflection |
| f.coder | `true` | Code changes need validation |
| f.investor | `true` | Financial analysis needs verification |
| f.assistant | `false` | Simple tasks don't need overhead |
| f.hacker | `true` | Security work needs verification |

**Phase 1 Implementation:**
- Default: `reflectEnabled: false`
- Explicit opt-in per task
- Add agent-level defaults in Phase 2

**Impact:**
- Phase 1: 3-phase loop (OBSERVE → PLAN → ACT → PERSIST)
- User opt-in for REFLECT when needed
- Reduces LLM calls by ~50% for most tasks

---

## ADR-003: STUCK State Notification


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


### Context


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


When a task enters STUCK state (3 consecutive poor reflections), someone needs to be notified. Current spec is unclear on:
1. Who gets notified?
2. How? (email, SSE push, both?)

### Decision


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**STUCK notification flow:**

```
Task STUCK → SSE event to Nexus (if connected) → In-app notification
           → Email notification (if task.emailOnStuck = true)
           → Webhook (if configured)
```

```prisma
model Task {
  // ... existing fields
  emailOnStuck  Boolean @default(false)
  webhookUrl    String?  // Optional webhook for external notification
}
```

```typescript
// When task enters STUCK
async function handleStuckTask(task: Task) {
  // 1. SSE push to connected clients
  await sse.broadcast(task.userId, {
    type: 'task.stuck',
    taskId: task.id,
    goal: task.goal,
    lastStep: task.steps[task.steps.length - 1],
  });
  
  // 2. Email if opted in
  if (task.emailOnStuck) {
    const user = await db.user.findUnique({ where: { id: task.userId } });
    await sendEmail({
      to: user.email,
      subject: `Task stuck: ${task.goal.slice(0, 50)}...`,
      body: `Your task "${task.goal}" got stuck. Review it in Nexus.`
    });
  }
  
  // 3. Webhook if configured
  if (task.webhookUrl) {
    await fetch(task.webhookUrl, {
      method: 'POST',
      body: JSON.stringify({ type: 'task.stuck', taskId: task.id })
    });
  }
}
```

**Default behavior:**
- SSE push (in-app notification) - always
- Email - opt-in per task
- Webhook - optional configuration

**Who can unstick:**
- User via Nova (retry, cancel, or provide guidance)
- Admin (for enterprise accounts)

---

## ADR-004: Phase 1 Minimum Viable f.rsrx


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


### Context


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


Phase 1 ships without REFLECT. What's the minimum to get a real f.rsrx research task running end-to-end?

### Decision


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


**Phase 1 Scope for f.rsrx:**

```
┌─────────────────────────────────────────────────────────┐
│           Phase 1 MVP - f.rsrx End-to-End               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ INCLUDED                                             │
│  ├── 3-phase loop (OBSERVE → PLAN → ACT → PERSIST)      │
│  ├── Tool Gateway (auth, retry, logging)                │
│  ├── f.rsrx tools:                                       │
│  │   ├── search_web (brave search API)                  │
│  │   ├── scrape_url (fetch + extract)                   │
│  │   └── synthesize (LLM summarization)                 │
│  ├── Postgres queue (FOR UPDATE SKIP LOCKED)            │
│  ├── Worker process (Bun)                               │
│  ├── SSE events to Nexus                                │
│  └── Task persistence (goal, steps, result)             │
│                                                          │
│  ❌ NOT INCLUDED (Phase 2+)                              │
│  ├── REFLECT phase                                       │
│  ├── Memory integration (f.library)                     │
│  ├── Scheduled tasks                                    │
│  ├── Multi-agent delegation                             │
│  ├── Credit system                                      │
│  └── Webhook callbacks                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Minimum viable f.rsrx tools:**

```typescript
// f.rsrx tools for Phase 1

export const rsrxTools = {
  // 1. Web search
  search_web: {
    description: "Search the web for information",
    input: { query: "string" },
    execute: async ({ query }) => {
      const results = await braveSearch(query);
      return { results };
    }
  },
  
  // 2. URL scraping
  scrape_url: {
    description: "Extract content from a URL",
    input: { url: "string" },
    execute: async ({ url }) => {
      const content = await fetch(url).then(r => r.text());
      return { content: extractText(content) };
    }
  },
  
  // 3. Synthesize findings
  synthesize: {
    description: "Synthesize research findings into a report",
    input: { findings: "array", format: "string" },
    execute: async ({ findings, format }) => {
      return await llm.synthesize(findings, format);
    }
  }
};
```

**End-to-end test:**

```
Goal: "Research best DeFi yield strategies on Solana"

Step 1: PLAN → "Search for Solana DeFi yields 2026"
        ACT   → search_web({ query: "Solana DeFi yields 2026" })
        Result → [5 search results]

Step 2: PLAN → "Scrape the top result for details"
        ACT   → scrape_url({ url: "https://..." })
        Result → [article content]

Step 3: PLAN → "Synthesize findings into report"
        ACT   → synthesize({ findings: [...], format: "markdown" })
        Result → [Final report]

Step 4: PLAN → "DONE - Report complete"
        Task → COMPLETED
```

**Success criteria:**
1. Task completes without manual intervention
2. Result is useful and accurate
3. Steps are visible in Nova via SSE
4. Total LLM calls: ~3-5 PLAN + 3 ACT = 6-8 calls (manageable)

---

## Summary


> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.


| ADR | Decision | Impact |
|-----|----------|--------|
| **001** | Worker key cache with 5-min TTL | 90% reduction in DB calls |
| **002** | REFLECT opt-in, default OFF for Phase 1 | 50% reduction in LLM calls |
| **003** | SSE push + optional email/webhook | Clear notification path |
| **004** | 3-phase loop + 3 f.rsrx tools | MVP scope defined |

---

**Last Updated:** 2026-03-08