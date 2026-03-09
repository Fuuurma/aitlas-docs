# Skills Integration for Agents Store

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Goal:** Populate Agents Store with quality skills from open source

---

## Skills Sources

### Tier 1: Massive Collections

| Source | Skills | Type | Format |
|--------|--------|------|--------|
| **Antigravity Awesome Skills** | 1000+ | Import | Claude Code |
| **sanyuan-skills** | 3 | Import | Claude Code |
| **Agency Agents** | 20+ | Build | Multi-tool |

### Tier 2: Quality Individual Skills

| Source | Skills | Type |
|--------|--------|------|
| claude-skills (alirezarezvani) | 169 | Import |
| claude-code-skills (daymade) | Professional | Import |
| mhattingpete/skills | Automation | Import |

### Tier 3: Prompt/Persona Collections

| Source | Stars | Use |
|--------|-------|-----|
| system-prompts-and-models | 129K | Prompts |
| Prompt-Engineering-Guide | 71K | Learning |
| botpress | 14K | Chatbots |

---

## Skills Format

### Claude Code Skill Format

```yaml
# skill.yaml
name: code-review-expert
description: Senior engineer code review with SOLID, security, performance
instructions: |
  You are a senior software engineer...
  Review code for:
  - SOLID principles
  - Security vulnerabilities
  - Performance issues
  - Error handling
tools:
  - Read
  - Bash
  - Glob
version: 1.0.0
author: username
```

### Structure

```
skill-name/
├── skill.yaml          # Definition
├── prompts/           # Prompt templates
├── scripts/           # Helper scripts
└── tests/             # Test cases
```

---

## Import Strategy

### Phase 1: Bulk Import

1. Clone Antigravity Awesome Skills
2. Parse all skill.yaml files
3. Convert to Aitlas format
4. Upload to Agents Store

```typescript
// Import script
import { readdir, readFile } from 'fs/promises';
import { parse } from 'yaml';

async function importSkills(repoPath: string) {
  const dirs = await readdir(repoPath);
  
  for (const dir of dirs) {
    const skillYaml = await readFile(`${repoPath}/${dir}/skill.yaml`, 'utf-8');
    const skill = parse(skillYaml);
    
    // Convert to Aitlas format
    const aitlasSkill = convertToAitlas(skill);
    
    // Upload to store
    await uploadToStore(aitlasSkill);
  }
}
```

### Phase 2: Curated Selection

Pick best skills:
- Code Review Expert
- Security Auditor
- Test Generator
- Refactor Expert
- Documentation Writer
- API Designer

### Phase 3: Custom Skills

Build unique skills:
- Domain-specific (healthcare, finance, etc.)
- Industry-specific (startups, enterprise)
- Custom workflows

---

## Aitlas Skill Format

```json
{
  "id": "code-review-expert",
  "name": "Code Review Expert",
  "description": "Senior engineer code review",
  "category": "engineering",
  "persona": {
    "role": "Senior Software Engineer",
    "expertise": ["SOLID", "Security", "Performance"],
    "communication": "Professional, detailed"
  },
  "prompts": {
    "system": "You are a senior software engineer...",
    "review": "Review this code for..."
  },
  "tools": ["read", "bash", "grep", "glob"],
  "constraints": {
    "maxIterations": 10,
    "timeout": 300
  },
  "pricing": {
    "credits": 5,
    "per": "review"
  }
}
```

---

## Categories

| Category | Examples | Count |
|----------|----------|-------|
| **Engineering** | Code Review, Testing, Refactoring, Security | 200+ |
| **DevOps** | CI/CD, Deployments, Monitoring | 100+ |
| **Data** | Analytics, SQL, ETL, Visualization | 50+ |
| **Product** | PRD, Roadmapping, User Research | 50+ |
| **Marketing** | Content, SEO, Social, Email | 100+ |
| **Design** | UI, UX, Branding, Research | 50+ |
| **Security** | Audit, Pen Testing, Compliance | 50+ |
| **Legal** | Contract Review, Compliance | 20+ |

---

## Quality Framework

| Criteria | Weight |
|----------|--------|
| **Instructions Clarity** | 20% |
| **Tool Usage** | 20% |
| **Output Quality** | 20% |
| **Test Coverage** | 15% |
| **Documentation** | 15% |
| **Community Rating** | 10% |

---

## Monetization

| Model | Description |
|-------|-------------|
| **Free** | Basic skills |
| **Credits** | Pay per use |
| **Subscription** | Unlimited access |
| **Premium** | Custom skills |

---

## Skills API

```typescript
// List all skills
GET /api/skills

// Get skill
GET /api/skills/:id

// Use skill
POST /api/skills/:id/use
{ messages: [...] }

// Create skill
POST /api/skills
{ skill: Skill }

// Rate skill
POST /api/skills/:id/rate
{ rating: 1-5 }
```

---

## Next Steps

1. **Clone** Antigravity Awesome Skills
2. **Build** import script
3. **Convert** 1000+ skills
4. **Launch** with 50 curated skills
5. **Iterate** based on usage

---

*Skills integration plan for Agents Store*