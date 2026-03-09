# Agents Store Implementation Summary

**Product:** Agents Store - Marketplace for AI Agents & Skills  
**Foundation:** Agency Agents + sanyuan-skills + Antigravity Awesome Skills  
**Stack:** TypeScript + PostgreSQL

---

## Key Patterns Extracted

### 1. Agent Definition Format (From Agency Agents)

```yaml
# agent.yaml - Agent definition format
id: frontend-developer
name: Frontend Developer
version: 1.0.0
author: agency-agents

# Core info
role: Frontend Development Expert
specialty: React/Vue/Angular, UI, Performance
description: >
  Senior frontend engineer with deep expertise in modern 
  frameworks, performance optimization, and UI patterns.

# Agent configuration
model: claude-3-5-sonnet
instructions: |
  You are a senior frontend developer with 10+ years of experience.
  You specialize in React, Vue, and Angular.
  You follow best practices and write clean, maintainable code.

# Tools available to this agent
tools:
  - code_editor
  - file_system
  - git
  - npm

# Credits
credits_per_use: 5

# Tags for discovery
tags:
  - frontend
  - react
  - vue
  - angular
  - ui

# Avatar
avatar: 🎨
```

### 2. Skills Format (From sanyuan-skills)

```yaml
# skill.yaml - Skill definition
id: code-review-expert
name: Code Review Expert
version: 1.0.0
author: sanyuan

# Skill type
type: skill  # vs agent

# When to use
triggers:
  - code_review
  - pull_request
  - security_audit

# Instructions
instructions: |
  You are a senior engineer conducting code review.
  Focus on: SOLID principles, security, performance, error handling.
  
# Deliverables
deliverables:
  - security_issues
  - performance_concerns
  - best_practice_violations
  - suggestions

# Credits
credits_per_use: 2
```

### 3. Marketplace Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      Agents Store                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   AGENTS                              │   │
│  │   Complete AI personas with workflows                │   │
│  │                                                       │   │
│  │   • Frontend Developer (5 credits/use)               │   │
│  │   • Backend Architect (5 credits/use)                │   │
│  │   • DevOps Automator (5 credits/use)                 │   │
│  │   • Security Engineer (8 credits/use)                │   │
│  │   • UI Designer (4 credits/use)                      │   │
│  │   • Growth Marketer (3 credits/use)                  │   │
│  │   ... 1000+ agents                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   SKILLS                              │   │
│  │   Specific capabilities agents can use               │   │
│  │                                                       │   │
│  │   • Code Review Expert (2 credits/use)               │   │
│  │   • Security Auditor (3 credits/use)                 │   │
│  │   • Performance Analyzer (2 credits/use)             │   │
│  │   • Documentation Writer (1 credit/use)              │   │
│  │   ... 1000+ skills (Antigravity)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   CREWS                               │   │
│  │   Pre-configured teams of agents                     │   │
│  │                                                       │   │
│  │   • Dev Team (Frontend + Backend + QA)               │   │
│  │   • Marketing Team (Content + Social + Growth)       │   │
│  │   • Security Team (Audit + Fix + Monitor)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Categories (From Agency Agents Roster)

| Category | Agents | Description |
|----------|--------|-------------|
| **Engineering** | 8 | Frontend, Backend, Mobile, AI, DevOps, Security |
| **Design** | 6 | UI, UX, Brand, Visual |
| **Marketing** | 3 | Growth, Social, Content |
| **Data** | 4 | Analyst, Engineer, Scientist |
| **Operations** | 5 | PM, Support, QA |

---

## Recommended Implementation

### Database Schema

```sql
-- Agents
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  author_id UUID REFERENCES users(id),
  
  -- Definition
  role VARCHAR(255),
  specialty TEXT,
  description TEXT,
  instructions TEXT,
  
  -- Config
  model VARCHAR(100) DEFAULT 'claude-3-5-sonnet',
  tools TEXT[], -- Available tools
  skills TEXT[], -- Required skills
  
  -- Monetization
  credits_per_use INTEGER DEFAULT 5,
  
  -- Discovery
  tags TEXT[],
  category VARCHAR(100),
  avatar VARCHAR(10),
  
  -- Stats
  uses_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  
  -- Version
  version VARCHAR(20) DEFAULT '1.0.0'
);

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  author_id UUID REFERENCES users(id),
  
  -- Definition
  type VARCHAR(50) DEFAULT 'skill',
  triggers TEXT[],
  instructions TEXT,
  deliverables TEXT[],
  
  -- Monetization
  credits_per_use INTEGER DEFAULT 2,
  
  -- Discovery
  tags TEXT[],
  category VARCHAR(100),
  
  -- Stats
  uses_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Crews (pre-configured teams)
CREATE TABLE crews (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  author_id UUID REFERENCES users(id),
  
  -- Definition
  agents UUID[], -- Agent IDs
  tasks JSONB, -- Task definitions
  process VARCHAR(50) DEFAULT 'sequential',
  
  -- Monetization
  credits_per_use INTEGER DEFAULT 15,
  
  -- Discovery
  tags TEXT[],
  category VARCHAR(100),
  
  -- Stats
  uses_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

```typescript
// src/api/routes.ts
import { Hono } from 'hono';

const app = new Hono();

// List agents
app.get('/agents', async (c) => {
  const { category, tag, search, sort, page } = c.req.query();
  
  const agents = await db.agents.findMany({
    where: { published: true },
    filter: { category, tag },
    search,
    sort,
    page,
  });
  
  return c.json(agents);
});

// Get agent
app.get('/agents/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  const agent = await db.agents.findBySlug(slug);
  if (!agent) return c.json({ error: 'Not found' }, 404);
  
  return c.json(agent);
});

// Activate agent (for use in Nexus)
app.post('/agents/:id/activate', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  
  const agent = await db.agents.findById(id);
  
  // Create activation record
  const activation = await db.activations.create({
    userId,
    agentId: id,
    status: 'active',
  });
  
  return c.json({
    activationId: activation.id,
    agent,
    creditsRequired: agent.credits_per_use,
  });
});

// List skills
app.get('/skills', async (c) => {
  const skills = await db.skills.findMany({
    where: { published: true },
  });
  
  return c.json(skills);
});

// List crews
app.get('/crews', async (c) => {
  const crews = await db.crews.findMany({
    where: { published: true },
    include: { agents: true },
  });
  
  return c.json(crews);
});
```

### Agent Activation Flow

```typescript
// src/services/activation.ts
export class AgentActivation {
  constructor(
    private agentStore: AgentStore,
    private creditBilling: CreditBilling,
    private nexusRuntime: NexusRuntime
  ) {}
  
  async activate(userId: string, agentId: string) {
    // 1. Get agent
    const agent = await this.agentStore.getAgent(agentId);
    
    // 2. Check credits
    const balance = await this.creditBilling.getBalance(userId);
    if (balance < agent.credits_per_use) {
      throw new Error('Insufficient credits');
    }
    
    // 3. Create session
    const session = await this.nexusRuntime.createSession({
      userId,
      agent,
      model: agent.model,
      instructions: agent.instructions,
      tools: agent.tools,
    });
    
    return {
      sessionId: session.id,
      agent,
      creditsRemaining: balance - agent.credits_per_use,
    };
  }
  
  async execute(sessionId: string, prompt: string) {
    // 1. Get session
    const session = await this.nexusRuntime.getSession(sessionId);
    
    // 2. Deduct credits
    await this.creditBilling.deduct(
      session.userId,
      session.agent.credits_per_use
    );
    
    // 3. Execute
    const result = await this.nexusRuntime.execute({
      sessionId,
      prompt,
    });
    
    // 4. Update stats
    await this.agentStore.incrementUses(session.agent.id);
    
    return result;
  }
}
```

---

## Importing Existing Agents

### From Agency Agents

```typescript
// scripts/import-agency-agents.ts
import { parse } from 'yaml';

const AGENCY_AGENTS_URL = 'https://github.com/msitarzewski/agency-agents';

async function importAgencyAgents() {
  // 1. Clone repo
  const repo = await clone(AGENCY_AGENTS_URL);
  
  // 2. Find agent files
  const agentFiles = await glob('**/*.yaml', { cwd: repo });
  
  // 3. Parse and import
  for (const file of agentFiles) {
    const content = await readFile(file);
    const agentDef = parse(content);
    
    // Convert to our format
    const agent = {
      name: agentDef.name,
      slug: slugify(agentDef.name),
      role: agentDef.role,
      specialty: agentDef.specialty,
      description: agentDef.description,
      instructions: agentDef.instructions,
      model: agentDef.model || 'claude-3-5-sonnet',
      tools: agentDef.tools || [],
      credits_per_use: 5, // Default
      tags: agentDef.tags || [],
      category: agentDef.category,
      avatar: agentDef.avatar,
      author_id: SYSTEM_USER_ID,
    };
    
    await db.agents.create(agent);
  }
}
```

### From Antigravity Skills

```typescript
// scripts/import-antigravity-skills.ts
const ANTIGRAVITY_URL = 'https://github.com/sickn33/antigravity-awesome-skills';

async function importAntigravitySkills() {
  // Import 1000+ skills from Antigravity
  const repo = await clone(ANTIGRAVITY_URL);
  
  const skillFiles = await glob('**/*.md', { cwd: repo });
  
  for (const file of skillFiles) {
    const skill = parseSkillFile(file);
    
    await db.skills.create({
      name: skill.name,
      slug: slugify(skill.name),
      instructions: skill.instructions,
      triggers: skill.triggers,
      credits_per_use: 2,
      tags: skill.tags,
      category: skill.category,
    });
  }
}
```

---

## Monetization Model

### Credit Pricing

| Type | Credits | Notes |
|------|---------|-------|
| **Basic Agent** | 5 | Simple single-purpose |
| **Specialized Agent** | 10 | Domain expert |
| **Complex Agent** | 15 | Multi-tool workflows |
| **Skill** | 2 | Individual capability |
| **Crew** | 15-30 | Team of agents |

### Revenue Split

```
┌─────────────────────────────────────────────────────────────┐
│                    Revenue Split                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User pays 10 credits for Premium Agent                     │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Author: 7 credits (70%)                            │  │
│   │  Platform: 3 credits (30%)                          │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                              │
│   Authors earn passive income from their agents!            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Discovery & Search

```typescript
// Search and filter
app.get('/agents/search', async (c) => {
  const { q, category, tags, sort } = c.req.query();
  
  // Full-text search
  const results = await db.agents.search({
    query: q,
    filters: {
      category,
      tags: tags?.split(','),
    },
    sort: sort || 'popular', // popular, rating, recent
  });
  
  return c.json(results);
});

// Recommendations
app.get('/agents/recommended', async (c) => {
  const userId = c.get('userId');
  
  // Based on usage history
  const history = await db.activations.findByUser(userId);
  const categories = extractCategories(history);
  
  const recommended = await db.agents.findMany({
    where: { category: { in: categories } },
    sort: 'rating',
    limit: 10,
  });
  
  return c.json(recommended);
});
```

---

## Integration Points

### With Nova

```typescript
// Nova fetches agents from store
const { data: agents } = useQuery({
  queryKey: ['agents'],
  queryFn: () => fetch('https://agents.aitlas.io/agents').then(r => r.json()),
});
```

### With Nexus

```typescript
// Nexus loads agent definition for execution
async function loadAgentForExecution(agentId: string) {
  const response = await fetch(`${AGENTS_STORE_URL}/agents/${agentId}`);
  const agent = await response.json();
  
  return {
    model: agent.model,
    instructions: agent.instructions,
    tools: agent.tools,
  };
}
```

### With Actions

```typescript
// Agents can use Actions as tools
const agentWithActions = {
  ...agent,
  tools: [
    ...agent.tools,
    'f.research',  // Can use Actions
    'f.twyt',
    'f.health',
  ],
};
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| PostgreSQL | Complex queries, relations |
| YAML format | Human-readable, git-friendly |
| Credit system | Monetization for authors |
| Categories | Easy discovery |
| Version support | Updates without breaking |

---

## Next Steps

1. **Create database schema** - Agents, Skills, Crews
2. **Build API layer** - CRUD, search, activation
3. **Import Agency Agents** - 20+ starter agents
4. **Import Antigravity Skills** - 1000+ skills
5. **Build frontend** - Marketplace UI
6. **Add credit billing** - Usage tracking
7. **Create author tools** - Submit/edit agents

---

*Implementation Status: 🔵 Ready for development*