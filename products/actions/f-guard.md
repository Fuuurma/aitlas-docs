# f.guard — AI Code Review & Security

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Domain:** f.guard.aitlas.xyz  
**Status:** 🟡 Development (Warden Integration)  
**Credits:** 2/review, 5/repo-scan, 3/PR-auto-scan, 2/auto-fix  
**Engine:** [Warden](https://github.com/getsentry/warden) (Sentry) + Custom UI  
**License:** FSL-1.1-ALv2 → MIT (negotiate)

---

## Strategic Value

**f.guard = Production-grade AI code review** — powered by Warden, enhanced with full UI.

Developers have linters, CodeRabbit, Copilot review. f.guard differentiates with:
- **GitHub native** — Every PR gets reviewed automatically
- **Skills-based** — Custom analysis rules via Skills
- **Auto-fix** — `--fix` applies fixes automatically
- **Full dashboard** — UI for viewing findings, history, settings

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      f.guard                                 │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   GitHub    │───▶│   Warden   │───▶│     UI      │     │
│  │  Webhooks   │    │   Engine   │    │  Dashboard  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                      │            │
│    • Commits                               View findings    │
│    • PRs opened/updated                    Auto-fix         │
│    • Branch changes                        Skills config    │
│                                              History         │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Components

| Component | Tech | Description |
|-----------|------|-------------|
| **UI** | Next.js (ui-template) | Full dashboard for findings, settings, history |
| **API** | Hono (action-template) | MCP endpoint + REST API |
| **Engine** | Warden (Sentry) | Core code analysis |
| **GitHub** | Webhooks | Trigger on commits/PRs |
| **DB** | PostgreSQL + pgvector | Scan history, findings, skills |
| **Auth** | GitHub OAuth | Login via GitHub |

### Deployment

- **UI:** Vercel (Next.js)
- **API:** Vercel Serverless (Hono)
- **Workers:** Hetzner (Bun) for background scans

---

## MCP Tools

### `scan_pull_request`

Scan a GitHub pull request automatically.

```typescript
{
  pr_url: string;           // e.g., https://github.com/user/repo/pull/123
  auto_fix?: boolean;       // Apply fixes automatically
  skills?: string[];        // Specific skills to use
}
```

**Returns:**
```typescript
{
  scan_id: string;
  pr_number: number;
  findings: Array<{
    id: string;
    severity: "error" | "warning" | "info";
    category: string;
    file: string;
    line: number;
    message: string;
    suggestion: string;
    fixed?: boolean;
  }>;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    auto_fixed: number;
  };
  duration_ms: number;
}
```

---

### `scan_repository`

Full repository scan (on-demand).

```typescript
{
  repo_url: string;
  branch?: string;          // default: main
  depth?: "quick" | "full";
  auto_fix?: boolean;
}
```

**Returns:**
```typescript
{
  scan_id: string;
  findings: Finding[];
  summary: {
    total: number;
    by_severity: Record<string, number>;
    by_category: Record<string, number>;
  };
  duration_ms: number;
}
```

---

### `scan_commit`

Scan a single commit.

```typescript
{
  repo_url: string;
  commit_sha: string;
}
```

---

### `apply_fix`

Apply a specific fix from findings.

```typescript
{
  finding_id: string;
  scan_id: string;
}
```

**Returns:**
```typescript
{
  success: boolean;
  applied: boolean;
  new_commit_sha?: string;
}
```

---

### `list_skills`

List available analysis skills.

```typescript
{}
```

**Returns:**
```typescript
{
  skills: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    enabled: boolean;
  }>;
}
```

---

### `add_skill`

Add a custom skill.

```typescript
{
  name: string;
  description: string;
  prompt: string;           // The analysis prompt
  category?: string;
}
```

**Returns:**
```typescript
{
  skill_id: string;
  success: boolean;
}
```

---

### `configure_webhook`

Configure GitHub webhook for auto-scanning.

```typescript
{
  repo_url: string;
  events: ("push" | "pull_request" | "create")[];
  auto_fix_on?: ("push" | "pull_request")[];
}
```

**Returns:**
```typescript
{
  webhook_id: string;
  webhook_url: string;       // Add to GitHub repo settings
  success: boolean;
}
```

---

### `get_scan_history`

Get past scans for a repository.

```typescript
{
  repo_url: string;
  limit?: number;            // default: 20
}
```

---

## GitHub Integration

### Webhook Events

f.guard automatically triggers on:

| Event | Trigger | Auto-scan |
|-------|---------|-----------|
| `push` | Commit pushed | ✅ |
| `pull_request` | PR opened/updated | ✅ |
| `create` | Branch created | ❌ |

### PR Comments

Findings appear as inline PR comments:

```
🔍 f.guard Code Review

⚠️ **Security** - `src/auth.ts:42`
Potential SQL injection detected. Use parameterized queries.

💡 **Suggestion**
Replace `query(\`SELECT * FROM users WHERE id = ${id}\`)`
with `query('SELECT * FROM users WHERE id = $1', [id])`

[View full report →](https://f.guard.aitlas.xyz/scan/abc123)
```

---

## UI Screens

### 1. Dashboard
- Recent scans
- Active repositories
- Credit usage
- Quick actions

### 2. Repository Settings
- Connected repos
- Webhook configuration
- Enabled skills
- Auto-fix settings

### 3. Scan Results
- File tree view
- Inline findings
- Severity filters
- Auto-fix buttons

### 4. Skills Library
- Built-in skills
- Custom skills
- Skill editor

---

## Credit Model

| Action | Credits | Notes |
|--------|---------|-------|
| On-demand PR scan | 3 | Manual trigger |
| Auto PR scan (webhook) | 2 | Per PR |
| Repository scan | 5 | Full repo |
| Commit scan | 1 | Single commit |
| Auto-fix | 2 | Per fix applied |
| Custom skill | 1 | Per skill added |

---

## Warden Integration Details

### Why Warden?

| Feature | Our Current f.guard | Warden |
|---------|-------------------|--------|
| Skills support | ❌ | ✅ |
| Auto-fix | ❌ | ✅ |
| PR comments | ❌ | ✅ |
| CLI + GitHub Action | ❌ | ✅ |
| Production-ready | ❌ | ✅ |

### Integration Approach

1. **Fork/modify** Warden engine for our needs
2. **Add MCP wrapper** around Warden CLI
3. **Build UI** on top (Next.js)
4. **Add webhook handler** for auto-scanning

### Custom Enhancements

- **pgvector storage** — Semantic search over findings
- **Skills marketplace** — Share/sell custom skills
- **Team features** — Organization-level settings
- **Credit integration** — Pay with Aitlas credits

---

## Future Enhancements

### v2.0
- **Security advisories** — Integrate OSV/GitHub Advisories
- **Dependency scanning** — npm audit, Dependabot-style
- **Secret detection** — GitHub token, AWS keys, etc.

### v3.0
- **Multi-repo org** — Scan entire organization
- **Custom rules** — Regex-based patterns
- **Integrations** — GitLab, Bitbucket support

---

## References

- [Warden GitHub](https://github.com/getsentry/warden)
- [Warden Docs](https://warden.sentry.dev/)
- [Skills Format](https://docs.anthropic.com/en/docs/claude-code/skills)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)

---

*Status: 🟡 Development — Warden integration in progress*