# f.decloy - Agent Deployment Platform

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Domain:** f.xyz/decloy  
**Status:** 🟡 Roadmap  
**Credits:** 25/deploy + 1/minute runtime

---

## Strategic Value

**f.decloy = deploy autonomous agents as services**

This is a **VERY strategic product** - could become the Aitlas infrastructure backbone.

### Core Purpose
Agents should be able to run:
- **Continuously** (long-running daemons)
- **On schedule** (cron jobs)
- **Via API** (on-demand invocation)
- **Via webhook** (event-driven)

Example:
```
crypto-research-agent
→ deployed
→ runs every 30 minutes
→ posts insights to Slack
```

---

## Architecture

### Two-Layer Design (Avoids Lock-in)

**Execution Type:**
- `container` - Docker containers
- `microvm` - Firecracker VMs
- `edge` - Edge functions

**Provider:**
- `railway` - Easy deploy
- `fly` - Global edge
- `hetzner` - Cheap compute

Example:
```typescript
{
  execution: "microvm",
  provider: "hetzner"
}
```

---

## Tools

### `deploy_agent`

**Parameters:**
```typescript
{
  agent_id: string;
  
  execution: "container" | "microvm" | "edge";
  provider?: "railway" | "fly" | "hetzner";
  
  trigger?: {
    type: "api" | "cron" | "webhook" | "continuous";
    schedule?: string;  // Cron expression for cron type
  };
  
  resources?: {
    cpu: number;        // Cores
    memory: number;     // MB
    storage: number;    // GB
  };
  
  env?: Record<string, string>;  // Environment variables
}
```

**Returns:**
```typescript
{
  deployment_id: string;
  endpoint: string;
  dashboard_url: string;
  logs_url: string;
  metrics_url: string;
  status: "deploying" | "running" | "failed";
}
```

---

### `invoke_agent`

Call a deployed agent.

**Parameters:**
```typescript
{
  deployment_id: string;
  input: any;           // Agent-specific input
}
```

**Returns:**
```typescript
{
  result: any;
  credits_used: number;
  duration_ms: number;
}
```

---

### `get_logs`

Get deployment logs.

**Parameters:**
```typescript
{
  deployment_id: string;
  limit?: number;       // Max lines (default: 100)
  since?: string;       // ISO timestamp
}
```

**Returns:**
```typescript
{
  logs: Array<{
    timestamp: string;
    level: "info" | "warn" | "error";
    message: string;
  }>;
}
```

---

### `get_status`

Check deployment status.

**Parameters:**
```typescript
{
  deployment_id: string;
}
```

**Returns:**
```typescript
{
  status: "running" | "stopped" | "error";
  uptime_seconds: number;
  credits_used: number;
  last_invocation: string;
  invocation_count: number;
}
```

---

### `update_agent`

Hot redeploy with new config.

**Parameters:**
```typescript
{
  deployment_id: string;
  agent_id?: string;    // New agent version
  resources?: {...};
  env?: Record<string, string>;
}
```

---

### `stop_agent`

Stop and remove deployment.

**Parameters:**
```typescript
{
  deployment_id: string;
}
```

---

## Credits Model

**Better pricing model:**
| Action | Credits |
|--------|---------|
| Deploy | 25 |
| Runtime | 1/minute |
| Invocation | 1 each |

This prevents users from deploying once and running forever.

---

## Planned Agents

| Agent | Execution | Purpose |
|-------|-----------|---------|
| **Nanobot** | container | Lightweight tasks |
| **ZeroClaw** | microvm | Isolated execution |
| **OpenFang** | edge | Global edge deployment |

---

## Long-Term Vision

**Firecracker runtime inside Aitlas:**

```
aitlas-runner
```

So Aitlas becomes an **Agent compute platform** like:
- Modal
- Replit Deploy
- Fly.io

This is HUGE.

---

## Product Score

| Metric | Score |
|--------|-------|
| Product Potential | 10/10 |
| Current Spec | 6/10 → 9/10 (updated) |

---

**Repo:** https://github.com/Fuuurma/f-decloy