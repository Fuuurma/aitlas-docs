# Agents Store - The App Store for AI Agents

> ⚠️ **OUTDATED** — Stack changed from Prisma to Drizzle. TODO: Update schema examples.

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Domain:** agents.aitlas.xyz  
**Status:** 🟡 Development  
**Stack:** Next.js 16, Bun, Neon Postgres, Drizzle ORM

---

## Strategic Value

**Agents = Preconfigured AI Workers**

Each agent is a curated stack of:
- Base persona prompt
- Skills (tool calls)
- Required Actions (f.xyz)
- Required MCPs (third-party)

**NOT infrastructure** — agents are configurations + prompts + toolsets.

---

## Agent Anatomy (Revised)

```typescript
// Public manifest (safe to expose)
interface AgentManifest {
  id: string;
  slug: string;               // URL-friendly: "crypto-quant"
  name: string;
  description: string;
  longDescription: string;    // Markdown
  avatarUrl: string;
  bannerUrl?: string;
  category: AgentCategory;
  tags: string[];
  
  version: string;            // Semver: "1.2.0"
  
  isPremium: boolean;
  pricingModel: AgentPricingModel;
  trialCredits: number;       // Free trial (default: 10)
  creditCostEstimate: number;
  
  skills: PublicAgentSkill[];
  requiredActions: RequiredAction[];
  requiredMCPs: RequiredMCP[];
  
  author: PublicAuthorInfo;
  stats: AgentStats;
  
  isPublished: boolean;
  publishedAt: Date;
}

type AgentPricingModel = 
  | 'FREE'           // Always free, credits for compute only
  | 'TRIAL_THEN_PAY' // X free credits, then subscription
  | 'PREMIUM'        // Paid subscription required

// PRIVATE — never in public API
interface AgentCommercial {
  agentId: string;
  authorRevenueSharePercent: number;  // 70%
  furmaRevenueSharePercent: number;   // 30%
  monthlyPriceCents?: number;
}
```

---

## Agent Versioning

**Opt-in upgrades** — silent updates break user prompts.

```prisma
model AgentVersion {
  id          String   @id @default(cuid())
  agentId     String
  version     String   // "1.2.0"
  changelog   String   @db.Text
  basePrompt  String   @db.Text
  skillsJson  Json
  isLatest    Boolean  @default(true)
  publishedAt DateTime @default(now())
  agent       Agent    @relation(...)
  
  @@unique([agentId, version])
}

model UserAgent {
  id          String   @id @default(cuid())
  userId      String
  agentId     String
  versionId   String   // Locked to version at hire time
  activatedAt DateTime @default(now())
  isActive    Boolean  @default(true)
}
```

**Version Update UX:**
```
[Notification in Nexus agent panel]
"🔄 Crypto Quant v1.3.0 is available — Research quality improved"
[Update] [See Changes] [Dismiss]
```

---

## Submission & Approval Pipeline

```
Author submits via /submit form
         │
         ▼
[Status: DRAFT]
  └── Author can edit freely
         │
         [Author clicks "Submit for Review"]
         ▼
[Status: PENDING_REVIEW]
  └── Furma review queue (manual, async)
  └── Automated checks:
      - Prompt safety scan
      - Required fields validation
      - MCP endpoint reachability
      - Credit cost sanity check
         │
    ┌────┴─────┐
  Approve    Reject (with reason)
    │              │
    ▼              ▼
[Status: PUBLISHED]  [Status: REJECTED]
```

**Automated Validation:**
```typescript
async function validateAgentSubmission(manifest: AgentSubmission): Promise<ValidationResult> {
  const errors: string[] = [];

  if (manifest.basePrompt.length < 100) errors.push("Base prompt too short (min 100 chars)");
  if (manifest.creditCostEstimate < 1) errors.push("Credit cost estimate must be >= 1");
  if (manifest.skills.length === 0) errors.push("Must define at least one skill");
  
  for (const action of manifest.requiredActions) {
    if (!FURMA_ACTIONS_REGISTRY.includes(action.actionName)) {
      errors.push(`Unknown action: ${action.actionName}`);
    }
  }

  const safetyResult = await scanPromptSafety(manifest.basePrompt);
  if (!safetyResult.safe) errors.push(`Safety issue: ${safetyResult.reason}`);

  return { valid: errors.length === 0, errors };
}
```

---

## Search & Discovery

### Discovery Surfaces

| Surface | Logic | Position |
|---------|-------|----------|
| **Featured** | Manually curated | Top of homepage |
| **Trending** | Most new hires (7 days) | Row 2 |
| **New Arrivals** | Published (14 days) | Row 3 |
| **Top Rated** | Highest rating (min 10 reviews) | Row 4 |
| **By Category** | Research, Dev, Finance, Support, Creative | Main grid |

### Search API

```typescript
interface AgentSearchParams {
  q?: string;              // Full-text search
  category?: AgentCategory;
  isPremium?: boolean;
  sort?: 'trending' | 'newest' | 'top_rated' | 'most_hired';
  page?: number;
  limit?: number;
}
```

---

## Agent Detail Page

```
/agent/crypto-quant

┌────────────────────────────────────────────────┐
│  [Banner Image]                                │
│  🤖 Crypto Quant           [Hire for Free] *   │
│  by @alpha_dev  ✓Verified                      │
│  ★★★★½  128 reviews  •  2,400 active users     │
├────────────────────────────────────────────────┤
│  About  │  Skills  │  Requirements  │  Reviews │
├────────────────────────────────────────────────┤
│  SKILLS                                        │
│  ✓ On-chain data analysis    (2 credits/use)   │
│  ✓ Twitter sentiment scan    (1 credit/use)    │
│  ✓ Research synthesis        (5 credits/use)   │
│                                                │
│  REQUIREMENTS                                  │
│  Needs:  ⚡ f.twyt  ⚡ f.rsrx                 │
│  Optional: 📅 Google Calendar MCP             │
│  [Setup Guide →]                               │
└────────────────────────────────────────────────┘

* [Hire for Free] = 10 trial credits included
```

---

## Agent Activation Flow

```
[User clicks "Hire" on agent detail page]
         │
         ▼
[GET nexus.aitlas.xyz/activate?agentId=crypto-quant&version=1.2.0]
         │
         ├─ Not logged in → Redirect to sign-up
         │
         ├─ Logged in, check prerequisites:
         │    a. Credit balance >= trialCredits (10)
         │    b. Required f.xyz actions available
         │    c. Required MCPs configured
         │
         ├─ If prerequisites MET:
         │    → Show confirmation modal
         │    → Deduct trial credits (atomic)
         │    → Create UserAgent record (locked to version)
         │    → Redirect to new thread with agent active
         │
         └─ If prerequisites NOT MET:
              → "Setup Required" wizard:
                  Step 1: Add missing API key
                  Step 2: Configure missing MCPs
                  Step 3: Top up credits
              → Re-check after each step
```

---

## MCP Setup Wizard

```
[MCP Setup: Google Calendar]
─────────────────────────────
  "Crypto Quant uses Google Calendar to schedule
   your trading review sessions."

  Step 1: Connect Google Account
  [Connect with Google] ← OAuth flow

  Step 2: Choose Calendar
  [○ Work Calendar]
  [● Personal Calendar]

  Step 3: Test Connection
  ✓ Connection successful!

  [Done → Continue Agent Setup]
```

---

## Review System

```prisma
model AgentReview {
  id        String   @id @default(cuid())
  agentId   String
  userId    String
  rating    Int      // 1-5
  comment   String?  @db.Text
  isVerified Boolean @default(false)  // User has used agent >= 3 sessions
  createdAt DateTime @default(now())
  isHidden  Boolean  @default(false)
  
  @@unique([agentId, userId]) // One review per user per agent
}
```

**Rules:**
- Only users who activated agent can review
- Rating required, comment optional
- `isVerified = true` if user ran >= 3 sessions
- Reviews flagged for moderation if profanity/competitor mentions

---

## Developer Portal

Location: `agents.aitlas.xyz/developers`

**Sections:**
1. **Getting Started** — what is an agent
2. **Skills Reference** — all f.xyz actions with costs
3. **Prompt Engineering Guide** — best practices
4. **Testing Your Agent** — how to test before submission
5. **Revenue & Payouts** — 70/30 split, payout schedule
6. **Submission Checklist** — what review team looks for
7. **API Reference** — programmatic agent management

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/agents` | GET | Optional | List/search published agents |
| `/api/agents/:id` | GET | Optional | Get agent manifest |
| `/api/agents/:id/reviews` | GET/POST | Optional/Required | Get/submit reviews |
| `/api/agents/featured` | GET | Optional | Featured agents |
| `/api/agents/trending` | GET | Optional | Trending agents |
| `/api/categories` | GET | Optional | Categories with counts |
| `/api/authors/:id` | GET | Optional | Author profile |
| `/api/submit` | POST | Required | Submit new agent draft |
| `/api/submit/:id` | PATCH | Required + Author | Update draft |
| `/api/submit/:id/publish` | POST | Required + Author | Submit for review |
| `/api/admin/review` | GET | Required + Admin | Review queue |
| `/api/admin/approve/:id` | POST | Required + Admin | Approve agent |
| `/api/admin/reject/:id` | POST | Required + Admin | Reject with reason |

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| `basePrompt` NOT encrypted | Author submits willingly. IP protection is legal, not cryptographic. |
| `revenueShare` never in public API | Commercial terms are private. |
| Versioning is opt-in upgrades | Silent updates break user expectations. |
| Store is read-only without auth | Maximizes discovery. Hiring requires auth in Nexus. |
| Same Neon DB for auth | One account = access to both products. |

---

## Development Phases

**Phase 1 — Browse & Discover**
- [ ] Agent DB model + seed data (5-10 examples)
- [ ] Browse page: grid + categories
- [ ] Agent detail page
- [ ] Basic text search (Postgres full-text)
- [ ] "Hire" button → redirect to Nexus

**Phase 2 — Authors**
- [ ] Author auth (same Neon DB)
- [ ] Agent submission form + validation
- [ ] Review queue (admin UI)
- [ ] Author profile page
- [ ] Developer portal (MDX docs)

**Phase 3 — Social Proof**
- [ ] Review system
- [ ] Featured / Trending logic
- [ ] Agent stats

**Phase 4 — Economy**
- [ ] Agent versioning
- [ ] Revenue share tracking
- [ ] MCP setup wizard
- [ ] Payout system (Stripe Connect)

---

**Repo:** https://github.com/Fuuurma/aitlas-agents