# f.guard - Code Review & Security

**Domain:** f.xyz/guard  
**Status:** 🟡 Roadmap  
**Credits:** 2/review, 10/repo-scan

---

## Strategic Value

**f.guard = AI-powered code security + review**

Your edge must be: **AI + security + dependency + secrets**

Developers already have linters, CodeRabbit, Copilot review. f.guard must be **more**.

---

## Tools

### `review_code`

AI-powered code review with diff support.

**Parameters:**
```typescript
{
  code?: string;            // Full code (optional)
  diff?: string;            // Git diff (PR review)
  language?: string;        // Programming language
  focus_areas?: ("security" | "performance" | "style" | "maintainability")[];
}
```

**Returns:**
```typescript
{
  issues: Array<{
    line: number;
    severity: "error" | "warning" | "info";
    category: "security" | "performance" | "style" | "bug";
    message: string;
    suggestion: string;
  }>;
  overall_score: number;   // 0-100
  summary: string;
}
```

---

### `scan_repository`

Full repository security scan.

**Parameters:**
```typescript
{
  repo_url: string;         // GitHub/GitLab URL
  branch?: string;          // Branch to scan (default: main)
  depth?: "quick" | "full"; // Scan depth
}
```

**Returns:**
```typescript
{
  vulnerabilities: Array<{
    type: "dependency" | "secret" | "config" | "code";
    severity: "critical" | "high" | "medium" | "low";
    file: string;
    line?: number;
    description: string;
    fix: string;
  }>;
  dependency_issues: number;
  secret_leaks: number;
  config_issues: number;
  overall_score: number;
}
```

---

### `scan_dependencies`

Check for vulnerable dependencies.

**Parameters:**
```typescript
{
  package_json: string;     // package.json content
  lockfile?: string;        // package-lock.json or yarn.lock
}
```

**Returns:**
```typescript
{
  vulnerabilities: Array<{
    package: string;
    version: string;
    severity: string;
    cve?: string;
    advisory: string;
    patched_versions: string;
  }>;
  outdated: Array<{
    package: string;
    current: string;
    latest: string;
  }>;
}
```

Uses: OSV database, NVD, GitHub advisories

---

### `detect_secrets`

Find leaked secrets in code.

**Parameters:**
```typescript
{
  code: string;
  // OR
  repo_url: string;
}
```

**Returns:**
```typescript
{
  secrets: Array<{
    type: "api_key" | "token" | "private_key" | "password";
    file: string;
    line: number;
    preview: string;        // Masked for security
    recommendation: string;
  }>;
}
```

Detects patterns like:
- `sk_live_...` (Stripe)
- `ghp_...` (GitHub)
- `AKIA...` (AWS)
- Private keys

---

## GitHub Integration

**Critical for adoption:**

```
PR opened
    ↓
f.guard triggered
    ↓
Comment on PR with issues
```

### GitHub App Flow

1. Install f.guard GitHub App
2. Configure which repos to monitor
3. On PR: automatically run `review_code` with diff
4. Post review as PR comment

---

## Credits

| Action | Credits |
|--------|---------|
| review_code | 2 |
| scan_repository | 10 |
| scan_dependencies | 5 |
| detect_secrets | 3 |

---

## Roadmap

- [ ] GitHub App integration
- [ ] Custom rule sets (eslint-style)
- [ ] CI/CD integration (GitHub Actions)
- [ ] Multi-language support
- [ ] SARIF output (for GitHub Security)

---

## Product Score

| Metric | Score |
|--------|-------|
| Product Potential | 8/10 |
| Current Spec | 7/10 → 9/10 (updated) |

---

**Repo:** https://github.com/Fuuurma/f-guard