# f.rsrx & f.library - Aitlas Alignment Plan

**Date:** March 6, 2026  
**Status:** 🟡 Needs Adaptation  
**Goal:** Align with furma-core-template + Aitlas ecosystem

---

## Current State

| Repo | GitHub | Local | Status |
|------|--------|-------|--------|
| **f.library** | ✅ github.com/Fuuurma/library | ✅ `/PROJECTS/f.library` | 🟡 Needs Aitlas alignment |
| **f.rsrx** | ✅ github.com/Fuuurma/f.rsrx | ✅ `/PROJECTS/f.rsrx` | 🟡 Needs Aitlas alignment |

---

## Required Changes (Both Repos)

### 1. Schema Updates (PRISMA)

**Add Furma DNA Models:**
```prisma
// ADD TO EXISTING SCHEMA

// 1. computeCredits (THE PAYWALL)
model User {
  computeCredits Int @default(0)  // ADD THIS
  // ...existing fields
}

// 2. BYOK API Keys (AES-256 Encrypted)
model ApiKey {
  id String @id @default(cuid())
  userId String
  provider String // "ANTHROPIC", "DEEPSEEK", "OPENAI"
  keyData String @db.Text  // Encrypted
  iv String  // Initialization vector
  authTag String  // Auth tag
  // ...timestamps, relations
  @@unique([userId, provider])
}

// 3. f.loop Task Queue (Ralph Engine)
model TaskQueue {
  id String @id @default(cuid())
  userId String
  agentId String?
  status String @default("PENDING")
  currentStep Int @default(0)
  maxSteps Int @default(15)
  inputData Json
  stateData Json?
  resultData Json?
  errorMessage String?
  // ...timestamps, relations
  @@index([status, createdAt])
}
```

---

### 2. Add Furma DNA Utilities

**Copy from furma-core-template:**
```
lib/
├── encryption.ts      ← AES-256-GCM BYOK (CRITICAL)
├── logger.ts          ← Pino structured logging
├── rate-limit.ts      ← Upstash rate limiting
├── cache.ts           ← LRU cache with TTL
├── utils.ts           ← Common utilities
├── constants.ts       ← Centralized constants
└── prisma.ts          ← Prisma singleton
```

---

### 3. Update AGENTS.md

**Replace with:** Furma-provided AGENTS.md from core-template

**Key Changes:**
- Rule Zero: Polyrepo isolation
- 15s timeout → f.loop for heavy tasks
- BYOK encryption required
- userId in EVERY Prisma query
- MCP-only communication

---

### 4. Rebrand to Aitlas Actions

**Naming Updates:**
```
f.library → Aitlas Action: "Knowledge Base"
f.rsrx → Aitlas Action: "Deep Research"

Both become:
- MCP servers (exposed to Nexus)
- Credit-burning actions (not free)
- BYOK-powered (user's API keys)
```

**MCP Tools to Expose:**

**f.library:**
- `search_documents` (1 credit)
- `ingest_document` (2 credits)
- `get_highlights` (1 credit)
- `vector_search` (2 credits)

**f.rsrx:**
- `web_search` (2 credits)
- `academic_search` (3 credits)
- `synthesize_research` (5 credits)
- `monitor_topic` (10 credits/hour)

---

### 5. Update Environment Variables

**Add to .env.example:**
```env
# Furma DNA - BYOK Encryption (CRITICAL)
BYOK_ENCRYPTION_KEY=""  # Generate: openssl rand -base64 32

# Furma DNA - Rate Limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Furma DNA - Logging
LOG_LEVEL="info"

# Furma DNA - Credit Costs (for reference)
LIBRARY_SEARCH_COST=1
LIBRARY_INGEST_COST=2
RSRX_SEARCH_COST=2
RSRX_SYNTHESIZE_COST=5
```

---

### 6. Add f.loop Worker Integration

**For Long Tasks:**
```typescript
// BEFORE (blocking API route)
export async function POST(req: Request) {
  const result = await doLongResearch();  // Can take 5+ minutes!
  return Response.json({ result });  // TIMEOUT!
}

// AFTER (f.loop async pattern)
export async function POST(req: Request) {
  const task = await prisma.taskQueue.create({
    data: {
      userId: session.user.id,
      type: 'rsrx_research',
      inputData: { query, depth },
      status: 'PENDING',
    },
  });
  return Response.json({ taskId: task.id, status: 'PENDING' });
}
```

---

## Execution Order

### Phase 1: f.library (Priority: HIGH)
**Why:** Already has users, production-ready, easier to adapt

**Steps:**
1. ✅ Backup current schema
2. ⏳ Add BYOK + credits + TaskQueue models
3. ⏳ Copy Furma DNA utilities from core-template
4. ⏳ Replace AGENTS.md
5. ⏳ Update .env.example
6. ⏳ Add MCP credit checks
7. ⏳ Test locally
8. ⏳ Push to GitHub

**Estimated Time:** 2-3 hours

---

### Phase 2: f.rsrx (Priority: MEDIUM)
**Why:** More complex research logic, needs Ralph loop integration

**Steps:**
1. ✅ Backup current code
2. ⏳ Add BYOK + credits + TaskQueue models
3. ⏳ Copy Furma DNA utilities
4. ⏳ Replace AGENTS.md
5. ⏳ Implement Ralph loops (Observe → Reason → Act)
6. ⏳ Add MCP credit checks
7. ⏳ Test locally
8. ⏳ Push to GitHub

**Estimated Time:** 4-6 hours

---

## Credit Model (Both Actions)

| Action | Credit Cost | Example |
|--------|-------------|---------|
| **f.library** | | |
| Search documents | 1 | Quick search |
| Ingest PDF | 2 | Upload + embed |
| Vector search | 2 | Semantic search |
| Get highlights | 1 | Retrieve annotations |
| **f.rsrx** | | |
| Web search | 2 | Search + scrape |
| Academic search | 3 | PubMed/arXiv |
| Synthesize report | 5 | Full research report |
| Monitor topic | 10/hour | Continuous Ralph loop |

**Credit Purchase:**
- $10 = 1,000 credits
- $25 = 3,000 credits (+20% bonus)
- $50 = 7,500 credits (+50% bonus)

---

## Testing Checklist

### Before Push

- [ ] Schema migration works
- [ ] BYOK encryption tested (100% coverage)
- [ ] Credit deduction works
- [ ] f.loop async pattern tested
- [ ] MCP tools exposed correctly
- [ ] Rate limiting active
- [ ] userId scoping in ALL queries
- [ ] AGENTS.md updated
- [ ] .env.example complete
- [ ] README.md updated with Aitlas branding

---

## Post-Alignment

**Both repos become:**
- ✅ Aitlas Actions (MCP servers)
- ✅ Credit-burning (revenue generating)
- ✅ BYOK-powered (zero token liability)
- ✅ f.loop integrated (no timeouts)
- ✅ Furma DNA compliant (security, logging, rate-limiting)

**Nexus can then:**
- Connect to f.library via MCP
- Connect to f.rsrx via MCP
- Charge credits for each action
- Track usage in TaskQueue

---

## Next Action

**Start with f.library** (easier, production-ready)

**Command to begin:**
```bash
cd C:\Users\34633\Desktop\PROJECTS\f.library
# Step 1: Backup schema
cp prisma/schema.prisma prisma/schema.prisma.backup
# Step 2: Add Furma DNA models
```

**Ready to execute?** 🫡
