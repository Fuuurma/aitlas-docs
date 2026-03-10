# DenchClaw Research - OpenClaw Framework Analysis

**Repository:** https://github.com/DenchHQ/DenchClaw  
**License:** MIT  
**Stars:** 1,014  
**Language:** TypeScript  
**Updated:** 2026-03-10

---

## Overview

**DenchClaw** is a "fully managed OpenClaw framework" - essentially a distribution/profile built on top of OpenClaw for CRM automation, sales outreach, and knowledge work. It demonstrates how to build a complete product on the OpenClaw platform.

**Key Insight:** DenchClaw proves OpenClaw can be extended into domain-specific products with custom skills, UI, and workflows.

---

## Architecture

### Project Structure

```
denchclaw/
├── denchclaw.mjs              # CLI entry point
├── src/
│   ├── entry.ts               # Main entry (respawns Node with flags)
│   ├── cli/                   # CLI implementation
│   │   ├── run-main.ts        # Main CLI runner
│   │   ├── bootstrap.ts       # Setup/onboarding
│   │   ├── profile.ts         # Profile management
│   │   └── web-runtime.ts     # Web server management
│   ├── infra/                 # Infrastructure
│   ├── process/               # Process management
│   └── telemetry/             # PostHog analytics
├── apps/
│   └── web/                   # Next.js 15 web UI
│       ├── app/
│       │   ├── api/           # API routes
│       │   │   ├── chat/      # Chat streaming
│       │   │   ├── workspace/ # Workspace CRUD
│       │   │   ├── sessions/  # Session management
│       │   │   └── terminal/  # Terminal server
│       │   ├── components/    # React components
│       │   └── workspace/     # Workspace pages
│       └── lib/               # Core libraries
│           ├── agent-runner.ts    # OpenClaw Gateway client
│           ├── active-runs.ts     # Run management
│           ├── subagent-runs.ts   # Subagent orchestration
│           ├── workspace.ts       # Workspace management
│           └── workspace-seed.ts  # Bootstrap templates
├── packages/
│   └── dench/                 # Dench package (thin wrapper)
├── skills/
│   ├── crm/SKILL.md           # CRM/Database skill (DuckDB)
│   └── browser/SKILL.md       # Browser automation skill
└── extensions/
    └── posthog-analytics/     # Analytics extension
```

---

## Key Components

### 1. CLI Profile System

DenchClaw runs as an OpenClaw profile:

```bash
npx denchclaw                    # Runs onboarding
npx denchclaw start              # Start web server
npx denchclaw stop               # Stop web server
npx denchclaw restart            # Restart web server
npx denchclaw update             # Update with current settings

# OpenClaw commands with dench profile
openclaw --profile dench <command>
```

**Implementation:**

```typescript
// src/cli/profile.ts
export function applyCliProfileEnv(options: { profile?: string }) {
  const profile = options.profile ?? "dench";
  process.env.OPENCLAW_PROFILE = profile;
  // Sets up profile-specific state directory
}
```

### 2. Workspace System

DenchClaw uses a workspace-based architecture:

```typescript
// apps/web/lib/workspace.ts
export function resolveOpenClawStateDir(): string {
  return join(homedir(), ".openclaw-dench");
}

export function resolveWorkspaceDir(workspaceName: string): string {
  const stateDir = resolveOpenClawStateDir();
  return join(stateDir, `workspace-${workspaceName}`);
}
```

**Workspace structure:**

```
~/.openclaw-dench/
├── workspace-default/
│   ├── workspace.duckdb        # DuckDB database
│   ├── workspace_context.yaml  # Org context (READ-ONLY)
│   ├── people/                 # Object directories
│   │   └── .object.yaml        # Object metadata
│   ├── companies/
│   ├── projects/
│   └── .dench-ui-state.json    # UI state
└── .dench-ui-state.json        # Active workspace
```

### 3. CRM Skill (DuckDB + Markdown)

The CRM skill manages structured data in DuckDB with markdown documents:

**DuckDB Schema:**

```sql
-- Core tables
CREATE TABLE objects (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  description VARCHAR,
  icon VARCHAR,
  default_view VARCHAR DEFAULT 'table'
);

CREATE TABLE fields (
  id VARCHAR PRIMARY KEY,
  object_id VARCHAR REFERENCES objects(id),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,  -- text, email, enum, relation, etc.
  enum_values JSON,
  required BOOLEAN DEFAULT false
);

CREATE TABLE entries (
  id VARCHAR PRIMARY KEY,
  object_id VARCHAR REFERENCES objects(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE entry_fields (
  id VARCHAR PRIMARY KEY,
  entry_id VARCHAR REFERENCES entries(id),
  field_id VARCHAR REFERENCES fields(id),
  value VARCHAR
);

-- Auto-generated PIVOT views for easy querying
CREATE OR REPLACE VIEW v_leads AS
PIVOT (
  SELECT e.id, e.created_at, f.name as field_name, ef.value
  FROM entries e
  JOIN entry_fields ef ON ef.entry_id = e.id
  JOIN fields f ON f.id = ef.field_id
  WHERE e.object_id = (SELECT id FROM objects WHERE name = 'leads')
) ON field_name USING first(value);
```

**Object Metadata (`.object.yaml`):**

```yaml
id: "abc123"
name: "leads"
description: "Sales leads tracking"
icon: "user-plus"
default_view: "table"
entry_count: 42
fields:
  - name: "Full Name"
    type: text
    required: true
  - name: "Email Address"
    type: email
    required: true
  - name: "Status"
    type: enum
    values: ["New", "Contacted", "Qualified", "Converted"]
view_settings:
  kanbanField: "Status"
views:
  - name: "Active leads"
    filters:
      rules:
        - field: status
          operator: is_any_of
          value: ["New", "Contacted"]
```

### 4. Agent Runner (Gateway Client)

Connects to OpenClaw Gateway via WebSocket:

```typescript
// apps/web/lib/agent-runner.ts
type GatewayFrame = 
  | { type: "req"; id: string; method: string; params?: unknown }
  | { type: "res"; id: string; ok: boolean; payload?: unknown }
  | { type: "event"; event: string; payload?: unknown };

export async function callGatewayRpc(
  ws: WebSocket,
  method: string,
  params: unknown
): Promise<unknown> {
  const id = randomUUID();
  ws.send(JSON.stringify({ type: "req", id, method, params }));
  // Wait for response with matching id
}
```

**Methods:**
- `run/start` - Start a new agent run
- `run/subscribe` - Subscribe to run events
- `run/stop` - Stop a running session

### 5. Subagent System

Manages spawned subagents for parallel work:

```typescript
// apps/web/lib/subagent-runs.ts
export type SubagentInfo = {
  sessionKey: string;
  runId: string;
  parentWebSessionId: string;
  task: string;
  status: "running" | "completed" | "error";
};

// Singleton registry
const registry = {
  runs: Map<string, SubagentRun>,
  parentIndex: Map<string, Set<string>>  // parent → children
};
```

**Event persistence:**

```typescript
// Events stored as JSONL for replay
function persistEvent(sessionKey: string, event: SseEvent): void {
  const dir = join(resolveWebChatDir(), "subagent-events");
  appendFileSync(join(dir, `${sessionKey}.jsonl`), JSON.stringify(event) + "\n");
}
```

### 6. Chat API

SSE streaming for chat responses:

```typescript
// apps/web/app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, sessionId, sessionKey } = await req.json();
  
  // Start agent run
  startRun({ sessionId, message: userText });
  
  // Stream events via SSE
  const stream = new ReadableStream({
    start(controller) {
      unsubscribe = subscribeToRun(runKey, (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });
    }
  });
  
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
```

### 7. Browser Automation Skill

Spins up Chromium with user's auth state:

```yaml
# skills/browser/SKILL.md
---
name: browser-automation
description: Browser automation skill - spin up a Chromium browser with the user's existing auth state
---

## Steps:
1. FIND THE USER'S DEFAULT CHROME PROFILE
2. COPY THAT PROFILE INTO OWN CHROMIUM PROFILE
3. Now you have all the same access as the user
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **CLI** | Commander, tslog, @clack/prompts |
| **Web** | Next.js 15, React 19, Tailwind v4 |
| **Database** | DuckDB (embedded SQL) |
| **Editor** | TipTap (rich text), Monaco (code) |
| **Tables** | @tanstack/react-table, react-spreadsheet |
| **Charts** | Recharts |
| **Terminal** | @xterm/xterm, node-pty |
| **Streaming** | SSE (Server-Sent Events) |
| **Analytics** | PostHog |
| **Linting** | oxlint, oxfmt (fast Rust-based) |

---

## Key Patterns for Aitlas

### 1. Profile-Based Distribution

```bash
# DenchClaw runs as an OpenClaw profile
openclaw --profile dench <command>

# Aitlas could do the same
openclaw --profile aitlas <command>
```

### 2. Workspace Isolation

```typescript
// Each workspace has its own database and state
~/.openclaw-aitlas/
├── workspace-default/
│   ├── workspace.duckdb
│   └── projects/
└── workspace-client-a/
    ├── workspace.duckdb
    └── projects/
```

### 3. DuckDB for Structured Data

**Advantages:**
- Embedded (no server)
- Fast analytics
- SQL interface
- PIVOT views for EAV pattern

**Aitlas use cases:**
- Task tracking
- Agent execution history
- Credit ledger
- Analytics/metrics

### 4. Object Metadata Projection

The `.object.yaml` pattern separates concerns:
- **DuckDB** = source of truth for data
- **Filesystem** = navigation tree, documents
- **YAML** = UI metadata (views, filters, icons)

### 5. Event Streaming Architecture

```
Agent Run → Gateway WebSocket → SSE Events → Web Client
                ↓
         JSONL Persistence (for replay)
```

### 6. Subagent Registry

```typescript
// Track subagents by parent session
registry.parentIndex.set(parentSessionId, new Set([childKey1, childKey2]));

// Query active subagents for a session
const children = registry.parentIndex.get(parentSessionId);
```

---

## Differences from Aitlas

| Aspect | DenchClaw | Aitlas |
|--------|-----------|--------|
| **Focus** | CRM/Sales | Autonomous agents |
| **Database** | DuckDB (embedded) | Postgres (Neon) |
| **Multi-tenant** | Workspaces | Users + Organizations |
| **Credits** | External (CRM) | Core feature |
| **Backend** | Next.js API routes | Phoenix (Elixir) |
| **Agent Protocol** | OpenClaw Gateway | ACP + MCP |

---

## Applicable Components

### High Value

1. **Workspace system** - Profile isolation pattern
2. **DuckDB skill** - Local analytics/metrics
3. **Subagent registry** - Spawn tracking
4. **SSE streaming** - Real-time updates
5. **Event persistence** - Replay capability

### Medium Value

1. **Object metadata pattern** - UI projection
2. **Browser skill** - Web automation
3. **PostHog analytics** - Usage tracking

### Low Value (different approach)

1. **Next.js API routes** - Aitlas uses Phoenix
2. **DuckDB for primary data** - Aitlas uses Postgres
3. **CRM-specific skills** - Aitlas is agent-focused

---

## References

- **Website:** https://denchclaw.com
- **Discord:** https://discord.gg/PDFXNVQj9n
- **Skills Store:** https://skills.sh
- **Demo Video:** https://www.youtube.com/watch?v=pfACTbc3Bh4

---

**Compiled:** 2026-03-10  
**Researcher:** Atlas (OpenClaw)