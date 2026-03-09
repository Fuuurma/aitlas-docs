# Nova Dashboard Implementation Plan

**Created:** 2026-03-09  
**Status:** Planning  
**Fork Source:** [Mission Control](https://github.com/builderz-labs/mission-control) v1.3.0

---

## Executive Summary

Nova Dashboard is a fork of Mission Control, customized specifically for OpenClaw/Aitlas. It serves as the central operations hub for:
- Agent management (Atlas and subagents)
- Actions marketplace (f.xyz integration)
- Credits/subscription management
- Nexus runtime monitoring
- OpenClaw Gateway control

---

## Part 1: Mission Control Architecture Analysis

### 1.1 Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 16.1.6 | App Router, React 19 |
| Database | SQLite (better-sqlite3) | Synchronous, fast, embedded |
| State | Zustand 5.0 | Client-side state with persistence |
| Styling | TailwindCSS 3.4 | Dark mode via next-themes |
| Real-time | WebSocket + SSE | Dual transport for reliability |
| Charts | Recharts 3.7 | Token usage, cost tracking |
| Diagrams | ReactFlow 12.10 | Pipeline visualization |

### 1.2 Database Schema (Core Tables)

```sql
-- Core Tables from Mission Control
tasks              -- Kanban task management
agents             -- Squad management with session keys
comments           -- Task discussion threads
activities         -- Real-time activity stream
notifications      -- @mentions and alerts
task_subscriptions -- Task followers
standup_reports    -- Daily agent reports
quality_reviews    -- Aegis gate approvals

-- Auth Tables
users              -- User accounts (local + OAuth)
user_sessions      -- Session tokens
agent_api_keys     -- Per-agent API keys
workspaces         -- Multi-tenant support

-- New Tables for Nova (see Part 3)
```

### 1.3 Panel System Architecture

**Panel Registration Pattern:**
```typescript
// src/components/panels/[panel-name]-panel.tsx
// Each panel exports a PanelConfig:
interface PanelConfig {
  id: string;
  title: string;
  icon: string;
  category: 'core' | 'agents' | 'system' | 'admin';
  requiredRole?: 'viewer' | 'operator' | 'admin';
  component: React.ComponentType;
}
```

**Current Panels (28 total):**

| Category | Panel | Purpose |
|----------|-------|---------|
| Core | `activity-feed-panel` | Real-time activity stream |
| Core | `notifications-panel` | Alerts and @mentions |
| Core | `task-board-panel` | Kanban board |
| Core | `standup-panel` | Daily standup reports |
| Agents | `agent-squad-panel` | Agent overview grid |
| Agents | `agent-squad-panel-phase3` | Enhanced squad view |
| Agents | `agent-detail-tabs` | Agent details (75KB!) |
| Agents | `agent-comms-panel` | Inter-agent chat |
| Agents | `agent-spawn-panel` | Spawn new agents |
| Agents | `agent-cost-panel` | Token/cost tracking |
| Agents | `agent-history-panel` | Agent history |
| System | `session-details-panel` | Active sessions |
| System | `log-viewer-panel` | System logs |
| System | `memory-browser-panel` | Memory file browser |
| System | `documents-panel` | Document management |
| System | `pipeline-tab` | Pipeline visualization |
| System | `cron-management-panel` | Scheduled jobs |
| System | `token-dashboard-panel` | Token usage stats |
| System | `gateway-config-panel` | Gateway settings |
| System | `multi-gateway-panel` | Multi-gateway support |
| System | `office-panel` | Virtual office (101KB!) |
| Admin | `settings-panel` | User settings |
| Admin | `user-management-panel` | User CRUD |
| Admin | `super-admin-panel` | Super admin tools |
| Admin | `audit-trail-panel` | Audit logs |
| Admin | `alert-rules-panel` | Alert configuration |
| Admin | `integrations-panel` | External integrations |
| Admin | `github-sync-panel` | GitHub integration |
| Admin | `webhook-panel` | Webhook management |

### 1.4 Real-time Architecture

**Dual Transport System:**

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Client    │────▶│  WebSocket/SSE   │────▶│   Gateway   │
│  (Browser)  │◀────│    (Next.js)     │◀────│  (OpenClaw) │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   SQLite     │
                    │  (Database)  │
                    └──────────────┘
```

**WebSocket Implementation:**
```typescript
// src/lib/websocket.ts patterns
- Connection management with auto-reconnect
- Message broadcasting to all clients
- Heartbeat/ping-pong for connection health
- Graceful degradation to SSE
```

### 1.5 RBAC Implementation

**Role Hierarchy:**
```
viewer < operator < admin
   0         1         2
```

**Auth Flow:**
```
1. Session cookie (mc-session) → validateSession()
2. API key (X-API-Key header) → validateAgentApiKey()
3. X-Agent-Name header for attribution
```

**Key Functions:**
- `requireRole(request, minRole)` - Gate for protected routes
- `getUserFromRequest(request)` - Unified auth extraction
- `validateAgentApiKey(key)` - Per-agent scoped keys

### 1.6 API Routes Structure

**40+ API Endpoints:**
```
/api/auth/*        - Authentication (login, logout, oauth)
/api/agents/*      - Agent CRUD and control
/api/tasks/*       - Task management
/api/sessions/*    - Session control
/api/connect/*     - WebSocket/SSE endpoint
/api/events/*      - Event streaming
/api/memory/*      - Memory file operations
/api/spawn/*       - Agent spawning
/api/cron/*        - Cron job management
/api/tokens/*      - Token usage tracking
/api/gateways/*    - Multi-gateway support
/api/standup/*     - Standup reports
/api/integrations/* - External integrations
/api/webhooks/*    - Webhook handling
/api/settings/*    - User settings
/api/backup/*      - Database backup
/api/audit/*       - Audit trail
/api/search/*      - Search functionality
```

---

## Part 2: Nova Dashboard Specific Design

### 2.1 Mission Statement

Nova Dashboard is the **mission control center for Aitlas**, providing:
1. **Agent Orchestration** - Manage Atlas and all subagents
2. **Actions Marketplace** - Browse and execute f.xyz actions
3. **Credits Management** - Track usage, manage subscriptions
4. **Nexus Runtime** - Monitor runtime health and performance
5. **OpenClaw Integration** - Native Gateway control

### 2.2 Panels to Keep (22 panels)

**Core (Keep All):**
- ✅ activity-feed-panel
- ✅ notifications-panel
- ✅ task-board-panel
- ✅ standup-panel

**Agents (Keep All):**
- ✅ agent-squad-panel (enhanced for Atlas)
- ✅ agent-detail-tabs
- ✅ agent-comms-panel
- ✅ agent-spawn-panel
- ✅ agent-cost-panel
- ✅ agent-history-panel

**System (Keep Most):**
- ✅ session-details-panel
- ✅ log-viewer-panel
- ✅ memory-browser-panel
- ✅ pipeline-tab
- ✅ token-dashboard-panel
- ✅ gateway-config-panel
- ❌ documents-panel (move to optional)
- ❌ cron-management-panel (move to admin)

**Admin (Keep Essential):**
- ✅ settings-panel
- ✅ user-management-panel
- ✅ audit-trail-panel
- ❌ super-admin-panel (too specific)
- ❌ multi-gateway-panel (single gateway for Nova)

### 2.3 Panels to Remove (6 panels)

| Panel | Reason |
|-------|--------|
| `office-panel` | 101KB virtual office, not needed |
| `agent-squad-panel-phase3` | Superseded by enhanced squad panel |
| `github-sync-panel` | Move to integrations |
| `webhook-panel` | Move to integrations |
| `integrations-panel` | Replace with Nova integrations |
| `alert-rules-panel` | Simplify to basic notifications |

### 2.4 New Panels for Nova (8 panels)

#### 2.4.1 Agents Store Panel
**Purpose:** Browse and install agent skills/personalities

```
┌─────────────────────────────────────────────────────────┐
│  🏪 Agents Store                                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Atlas   │ │  Coder   │ │ Research │               │
│  │  Core    │ │  Agent   │ │  Agent   │               │
│  │  ★ 4.9   │ │  ★ 4.7   │ │  ★ 4.8   │               │
│  │  [Install]│ │  [Install]│ │  [Install]│               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
│  Categories: [All] [Productivity] [Development] [Data] │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Browse available agent templates
- One-click install to workspace
- Rating system
- Categories and search
- Custom agent builder

#### 2.4.2 Actions Panel (f.xyz)
**Purpose:** Browse and execute Actions from f.xyz

```
┌─────────────────────────────────────────────────────────┐
│  ⚡ Actions (f.xyz)                                     │
├─────────────────────────────────────────────────────────┤
│  Search: [___________________________] [🔍]            │
│                                                         │
│  Trending Actions                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📧 Send Email          Send an email via Gmail  │   │
│  │ 10 credits • Used 1,234 times • ★ 4.8          │   │
│  │                              [Execute] [Details]│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Your Recent Actions                                    │
│  • Send Email (2h ago)                                 │
│  • Create Calendar Event (5h ago)                      │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Browse Actions marketplace
- Search and filter
- One-click execution
- Usage history
- Cost preview
- Rate actions

#### 2.4.3 Nexus Runtime Panel
**Purpose:** Monitor Nexus runtime health

```
┌─────────────────────────────────────────────────────────┐
│  🔮 Nexus Runtime                                       │
├─────────────────────────────────────────────────────────┤
│  Status: ● Online (latency: 45ms)                      │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐                  │
│  │  CPU: 23%     │  │  Memory: 2.1GB│                  │
│  │  ████████░░░░ │  │  ████████░░░░ │                  │
│  └───────────────┘  └───────────────┘                  │
│                                                         │
│  Active Sessions: 3                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Session        Model        Tokens    Status     │  │
│  │ main:atlas     glm-5        12,345    active     │  │
│  │ main:coder     kimi-k2.5    8,234     active     │  │
│  │ main:research  qwen3.5      3,456     idle       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [Restart Nexus] [View Logs] [Configure]               │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time health metrics
- Active session monitoring
- Resource usage graphs
- Quick actions (restart, configure)
- Log viewer integration

#### 2.4.4 Credits Panel
**Purpose:** Track credits and subscription

```
┌─────────────────────────────────────────────────────────┐
│  💰 Credits & Subscription                              │
├─────────────────────────────────────────────────────────┤
│  Current Plan: Pro ($29/month)                         │
│                                                         │
│  Credits Balance                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ████████████████████████░░░░░░░░  8,450 / 10,000│  │
│  └─────────────────────────────────────────────────┘   │
│  Resets on: March 15, 2026                             │
│                                                         │
│  Usage This Month                                       │
│  • Actions: 1,234 credits                              │
│  • Tokens: 567,890 (≈ 2,345 credits)                   │
│  • Premium Models: 890 credits                         │
│                                                         │
│  [Upgrade Plan] [Usage History] [Billing]              │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Balance display with progress bar
- Usage breakdown
- Plan management
- Billing history
- Upgrade/downgrade

#### 2.4.5 Quick Actions Panel
**Purpose:** One-click common actions

```
┌─────────────────────────────────────────────────────────┐
│  ⚡ Quick Actions                                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │  📧     │ │  📅     │ │  📝     │ │  🔍     │      │
│  │ Email   │ │Calendar │ │  Note   │ │ Search  │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │  🤖     │ │  💬     │ │  📊     │ │  ⚙️     │      │
│  │ Spawn   │ │  Chat   │ │ Report  │ │ Config  │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
└─────────────────────────────────────────────────────────┘
```

#### 2.4.6 Model Router Panel
**Purpose:** Configure model fallback chain

```
┌─────────────────────────────────────────────────────────┐
│  🧠 Model Router                                        │
├─────────────────────────────────────────────────────────┤
│  Primary: opencode/glm-5                               │
│  Fallback Chain:                                        │
│  1. opencode/kimi-k2.5                                 │
│  2. opencode/minimax-m2.5                              │
│  3. bailian/qwen3.5-plus                               │
│                                                         │
│  Cost Optimization: ● Enabled                          │
│  [Configure] [Test Latency] [View Stats]               │
└─────────────────────────────────────────────────────────┘
```

#### 2.4.7 Workspace Panel
**Purpose:** Manage multiple workspaces

```
┌─────────────────────────────────────────────────────────┐
│  📁 Workspaces                                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🌌 Atlas Personal                    [Active]    │  │
│  │ 3 agents • 12 actions • Pro plan                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🏢 Company Workspace                             │  │
│  │ 15 agents • 45 actions • Enterprise plan         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [+ New Workspace]                                      │
└─────────────────────────────────────────────────────────┘
```

#### 2.4.8 Insights Panel
**Purpose:** AI-powered insights and analytics

```
┌─────────────────────────────────────────────────────────┐
│  📊 Insights                                            │
├─────────────────────────────────────────────────────────┤
│  This Week's Highlights                                 │
│  • 📈 Productivity up 23% vs last week                 │
│  • ⏱️ Average response time: 1.2s (↓ 15%)              │
│  • 💰 Cost savings: $45 from model optimization        │
│                                                         │
│  Recommendations                                         │
│  💡 Consider spawning a research agent for project X   │
│  💡 You have 1,500 unused credits expiring soon        │
│                                                         │
│  [View Full Report] [Export]                           │
└─────────────────────────────────────────────────────────┘
```

---

## Part 3: Database Schema Extensions

### 3.1 New Tables for Nova

```sql
-- Credits & Subscription
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free', -- free, pro, enterprise
    credits_balance INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    credits_limit INTEGER NOT NULL DEFAULT 1000,
    billing_email TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start INTEGER,
    current_period_end INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    amount INTEGER NOT NULL, -- positive for add, negative for use
    type TEXT NOT NULL, -- purchase, usage, refund, expiry
    description TEXT,
    action_id INTEGER, -- if from an Action
    session_id TEXT, -- if from agent usage
    model TEXT, -- if from model usage
    tokens_used INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Actions (f.xyz integration)
CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE, -- f.xyz action ID
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    credits_cost INTEGER NOT NULL DEFAULT 1,
    icon TEXT,
    config TEXT, -- JSON for action parameters
    rating REAL DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    creator TEXT,
    is_verified INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS action_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    workspace_id INTEGER NOT NULL,
    user_id INTEGER,
    agent_id INTEGER,
    input TEXT, -- JSON input parameters
    output TEXT, -- JSON output
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, success, failed
    credits_charged INTEGER,
    duration_ms INTEGER,
    error_message TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER,
    FOREIGN KEY (action_id) REFERENCES actions(id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Agent Templates (Agents Store)
CREATE TABLE IF NOT EXISTS agent_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE, -- store ID
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    soul_content TEXT, -- SOUL.md template
    skills TEXT, -- JSON array of skill IDs
    default_model TEXT,
    icon TEXT,
    rating REAL DEFAULT 0,
    install_count INTEGER DEFAULT 0,
    creator TEXT,
    is_verified INTEGER DEFAULT 0,
    price INTEGER DEFAULT 0, -- credits, 0 = free
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Model Configuration
CREATE TABLE IF NOT EXISTS model_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model_id TEXT NOT NULL,
    api_key_ref TEXT, -- reference to secure storage
    is_primary INTEGER DEFAULT 0,
    fallback_order INTEGER DEFAULT 0,
    cost_per_1k_input REAL,
    cost_per_1k_output REAL,
    max_tokens INTEGER,
    enabled INTEGER DEFAULT 1,
    config TEXT, -- JSON for additional settings
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Nexus Runtime Metrics
CREATE TABLE IF NOT EXISTS runtime_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    metric_type TEXT NOT NULL, -- cpu, memory, latency, tokens
    value REAL NOT NULL,
    unit TEXT,
    metadata TEXT, -- JSON
    recorded_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_workspace ON credit_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_actions_category ON actions(category);
CREATE INDEX IF NOT EXISTS idx_actions_external_id ON actions(external_id);
CREATE INDEX IF NOT EXISTS idx_action_executions_workspace ON action_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_action_executions_status ON action_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_templates_category ON agent_templates(category);
CREATE INDEX IF NOT EXISTS idx_model_configs_workspace ON model_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_runtime_metrics_workspace ON runtime_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_runtime_metrics_type ON runtime_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_runtime_metrics_recorded ON runtime_metrics(recorded_at);
```

### 3.2 Schema Migration Strategy

```typescript
// src/lib/migrations.ts - Extend existing pattern
export function runMigrations(db: Database) {
  // Version tracking
  const version = db.prepare('PRAGMA user_version').get() as number;
  
  if (version < 1) {
    // Original Mission Control migrations
    runOriginalMigrations(db);
  }
  
  if (version < 2) {
    // Nova Dashboard extensions
    db.exec(novaSchemaV2);
    db.prepare('PRAGMA user_version = 2').run();
  }
  
  if (version < 3) {
    // Future migrations
    db.exec(novaSchemaV3);
    db.prepare('PRAGMA user_version = 3').run();
  }
}
```

---

## Part 4: OpenClaw Integration Points

### 4.1 Gateway Integration

**Existing Integration (keep):**
- Session management via WebSocket
- Real-time event streaming
- Agent spawning
- Memory access
- Log streaming

**Nova Enhancements:**
```typescript
// src/lib/openclaw-client.ts
export class OpenClawClient {
  // Existing
  async getSessions(): Promise<Session[]>
  async spawnAgent(request: SpawnRequest): Promise<Agent>
  async getMemory(path: string): Promise<string>
  
  // Nova Additions
  async executeAction(actionId: string, input: any): Promise<ActionResult>
  async getCredits(): Promise<CreditsInfo>
  async getRuntimeStatus(): Promise<RuntimeStatus>
  async getModelConfig(): Promise<ModelConfig[]>
  async updateModelConfig(config: ModelConfig): Promise<void>
}
```

### 4.2 Event Types Extension

```typescript
// src/lib/events.ts - Extend existing event types
export type NovaEventType = 
  // Existing from Mission Control
  | 'task_created' | 'task_updated' | 'task_completed'
  | 'agent_status_change' | 'agent_spawned'
  | 'activity_logged'
  // Nova additions
  | 'action_executed'
  | 'credits_updated'
  | 'model_changed'
  | 'runtime_alert'
  | 'subscription_updated'
  | 'workspace_switched'
```

### 4.3 API Endpoints for Nova

```
/api/nova/credits/*        - Credits management
/api/nova/actions/*        - Actions execution
/api/nova/runtime/*        - Runtime monitoring
/api/nova/models/*         - Model configuration
/api/nova/workspaces/*     - Workspace management
/api/nova/store/*          - Agents Store
```

---

## Part 5: File Structure

```
nova-dashboard/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                  # Overview
│   │   │   ├── agents/
│   │   │   │   ├── page.tsx              # Agent squad
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Agent detail
│   │   │   ├── actions/
│   │   │   │   ├── page.tsx              # Actions marketplace
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Action detail
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx              # Task board
│   │   │   ├── memory/
│   │   │   │   └── page.tsx              # Memory browser
│   │   │   ├── credits/
│   │   │   │   └── page.tsx              # Credits & billing
│   │   │   ├── runtime/
│   │   │   │   └── page.tsx              # Nexus runtime
│   │   │   ├── models/
│   │   │   │   └── page.tsx              # Model router
│   │   │   ├── store/
│   │   │   │   └── page.tsx              # Agents Store
│   │   │   └── settings/
│   │   │       └── page.tsx              # Settings
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── agents/
│   │   │   ├── tasks/
│   │   │   ├── sessions/
│   │   │   ├── memory/
│   │   │   ├── spawn/
│   │   │   ├── connect/                  # WebSocket/SSE
│   │   │   ├── events/
│   │   │   ├── nova/                     # Nova-specific
│   │   │   │   ├── credits/
│   │   │   │   ├── actions/
│   │   │   │   ├── runtime/
│   │   │   │   ├── models/
│   │   │   │   ├── workspaces/
│   │   │   │   └── store/
│   │   │   └── ...
│   │   └── layout.tsx
│   ├── components/
│   │   ├── panels/
│   │   │   ├── activity-feed-panel.tsx
│   │   │   ├── agent-squad-panel.tsx
│   │   │   ├── agent-detail-tabs.tsx
│   │   │   ├── agent-comms-panel.tsx
│   │   │   ├── agent-spawn-panel.tsx
│   │   │   ├── agent-cost-panel.tsx
│   │   │   ├── task-board-panel.tsx
│   │   │   ├── session-details-panel.tsx
│   │   │   ├── log-viewer-panel.tsx
│   │   │   ├── memory-browser-panel.tsx
│   │   │   ├── token-dashboard-panel.tsx
│   │   │   ├── gateway-config-panel.tsx
│   │   │   ├── standup-panel.tsx
│   │   │   ├── notifications-panel.tsx
│   │   │   ├── settings-panel.tsx
│   │   │   ├── user-management-panel.tsx
│   │   │   ├── audit-trail-panel.tsx
│   │   │   ├── pipeline-tab.tsx
│   │   │   └── # Nova panels
│   │   │       ├── agents-store-panel.tsx
│   │   │       ├── actions-panel.tsx
│   │   │       ├── nexus-runtime-panel.tsx
│   │   │       ├── credits-panel.tsx
│   │   │       ├── quick-actions-panel.tsx
│   │   │       ├── model-router-panel.tsx
│   │   │       ├── workspace-panel.tsx
│   │   │       └── insights-panel.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── command-palette.tsx
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   └── charts/
│   │       ├── usage-chart.tsx
│   │       ├── cost-chart.tsx
│   │       └── latency-chart.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── migrations.ts
│   │   ├── schema.sql
│   │   ├── auth.ts
│   │   ├── websocket.ts
│   │   ├── password.ts
│   │   ├── models.ts
│   │   ├── openclaw-client.ts
│   │   └── nova/
│   │       ├── credits.ts
│   │       ├── actions.ts
│   │       ├── runtime.ts
│   │       └── store.ts
│   ├── store/
│   │   └── index.ts                      # Zustand store
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-websocket.ts
│   │   ├── use-panel.ts
│   │   └── nova/
│   │       ├── use-credits.ts
│   │       ├── use-actions.ts
│   │       └── use-runtime.ts
│   └── types/
│       └── index.ts
├── public/
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Part 6: Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Get Nova running with core Mission Control features

1. **Fork and Setup**
   - [ ] Fork Mission Control repo
   - [ ] Rename to nova-dashboard
   - [ ] Update branding and colors
   - [ ] Remove unused panels (6 panels)
   - [ ] Update package.json with Nova branding

2. **Core Customization**
   - [ ] Update sidebar with Nova navigation
   - [ ] Customize theme (colors, logo)
   - [ ] Update default agents for Atlas
   - [ ] Configure model defaults (glm-5 primary)

3. **Database Extensions**
   - [ ] Add Nova tables to schema.sql
   - [ ] Create migrations for new tables
   - [ ] Test migrations

### Phase 2: Nova Panels (Week 3-4)
**Goal:** Build the 8 new Nova-specific panels

1. **Credits Panel**
   - [ ] Build UI components
   - [ ] Integrate with credit system
   - [ ] Add billing integration placeholder

2. **Actions Panel**
   - [ ] Build Actions marketplace UI
   - [ ] Create mock actions data
   - [ ] Implement execution flow

3. **Nexus Runtime Panel**
   - [ ] Build health monitoring UI
   - [ ] Add metrics collection
   - [ ] Integrate with log viewer

4. **Agents Store Panel**
   - [ ] Build store UI
   - [ ] Create mock templates
   - [ ] Add install/uninstall flow

5. **Model Router Panel**
   - [ ] Build configuration UI
   - [ ] Add model switching
   - [ ] Integrate with session spawning

6. **Quick Actions Panel**
   - [ ] Build grid layout
   - [ ] Add customizable shortcuts

7. **Workspace Panel**
   - [ ] Build workspace switcher
   - [ ] Add workspace management

8. **Insights Panel**
   - [ ] Build analytics UI
   - [ ] Add recommendation engine

### Phase 3: Integration (Week 5-6)
**Goal:** Connect Nova to real Aitlas services

1. **OpenClaw Integration**
   - [ ] Test Gateway connection
   - [ ] Verify WebSocket events
   - [ ] Test agent spawning

2. **Credits System**
   - [ ] Design credit calculation
   - [ ] Build usage tracking
   - [ ] Add Stripe integration (optional)

3. **Actions Integration**
   - [ ] Connect to f.xyz API
   - [ ] Build action execution pipeline
   - [ ] Add error handling

4. **Nexus Integration**
   - [ ] Add runtime monitoring
   - [ ] Build metrics collection
   - [ ] Add alerting

### Phase 4: Polish & Deploy (Week 7-8)
**Goal:** Production-ready Nova Dashboard

1. **Testing**
   - [ ] Unit tests for Nova panels
   - [ ] E2E tests for critical flows
   - [ ] Performance testing

2. **Documentation**
   - [ ] API documentation
   - [ ] User guide
   - [ ] Admin guide

3. **Deployment**
   - [ ] Docker configuration
   - [ ] Environment variables
   - [ ] CI/CD pipeline

4. **Monitoring**
   - [ ] Error tracking
   - [ ] Usage analytics
   - [ ] Performance monitoring

---

## Part 7: Configuration

### 7.1 Environment Variables

```bash
# .env.example

# Core
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/nova.db

# Auth
AUTH_USER=admin
AUTH_PASS=your-secure-password
SESSION_SECRET=your-session-secret

# OpenClaw Gateway
GATEWAY_URL=http://localhost:8080
GATEWAY_TOKEN=your-gateway-token

# API Keys (for model routing)
OPENCODE_API_KEY=sk-xxx
ALIBABA_API_KEY=sk-xxx

# Billing (optional)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Actions (f.xyz)
ACTIONS_API_URL=https://f.xyz/api
ACTIONS_API_KEY=xxx

# Analytics (optional)
POSTHOG_KEY=xxx
SENTRY_DSN=xxx
```

### 7.2 Default Model Configuration

```typescript
// src/lib/models.ts
export const MODEL_CATALOG = [
  {
    alias: 'glm-5',
    name: 'GLM-5',
    provider: 'OpenCode Zen',
    description: 'Primary reasoning model',
    costPer1k: 0.002,
    contextWindow: 128000,
  },
  {
    alias: 'kimi-k2.5',
    name: 'Kimi K2.5',
    provider: 'OpenCode Zen',
    description: 'Fallback reasoning model',
    costPer1k: 0.003,
    contextWindow: 256000,
  },
  {
    alias: 'minimax-m2.5',
    name: 'MiniMax M2.5',
    provider: 'OpenCode Zen',
    description: 'Fast fallback model',
    costPer1k: 0.001,
    contextWindow: 64000,
  },
  {
    alias: 'qwen3.5-plus',
    name: 'Qwen 3.5 Plus',
    provider: 'Alibaba Bailian',
    description: 'Alternative fallback',
    costPer1k: 0.002,
    contextWindow: 128000,
  },
]

export const DEFAULT_FALLBACK_CHAIN = [
  'opencode/glm-5',
  'opencode/kimi-k2.5',
  'opencode/minimax-m2.5',
  'bailian/qwen3.5-plus',
]
```

---

## Part 8: Success Metrics

### Technical Metrics
- [ ] Page load time < 2s
- [ ] WebSocket latency < 100ms
- [ ] Database query time < 50ms
- [ ] 99.9% uptime

### User Metrics
- [ ] Time to first action < 30s
- [ ] Panel switch time < 200ms
- [ ] Error rate < 0.1%
- [ ] User satisfaction > 4.5/5

### Business Metrics
- [ ] Actions executed per day
- [ ] Credits consumed per month
- [ ] Active agents count
- [ ] Subscription conversion rate

---

## Appendix A: Panel Priority Matrix

| Panel | Priority | Effort | Impact | Phase |
|-------|----------|--------|--------|-------|
| Credits Panel | P0 | M | H | 2 |
| Actions Panel | P0 | M | H | 2 |
| Nexus Runtime Panel | P0 | L | H | 2 |
| Model Router Panel | P1 | L | M | 2 |
| Quick Actions Panel | P1 | L | M | 2 |
| Agents Store Panel | P2 | H | M | 3 |
| Workspace Panel | P2 | M | L | 3 |
| Insights Panel | P3 | H | L | 4 |

---

## Appendix B: Dependencies

### New Dependencies for Nova

```json
{
  "dependencies": {
    "@stripe/stripe-js": "^3.0.0",
    "framer-motion": "^11.0.0",
    "date-fns": "^3.0.0",
    "react-hot-toast": "^2.4.0"
  }
}
```

### Dev Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^22.0.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.51.0"
  }
}
```

---

## Appendix C: Security Considerations

1. **API Key Storage**
   - Never store API keys in database
   - Use secure vault (env vars or secret manager)
   - Reference by ID in database

2. **Credit System**
   - Atomic transactions
   - Audit trail for all changes
   - Rate limiting on expensive operations

3. **RBAC**
   - Extend Mission Control's role system
   - Add action-level permissions
   - Scope credits to workspaces

4. **Data Isolation**
   - Workspace-scoped queries
   - No cross-workspace data access
   - Admin override for support

---

## Conclusion

Nova Dashboard extends Mission Control with Aitlas-specific features while maintaining compatibility with the upstream project. The modular panel system allows for easy customization, and the SQLite + Zustand architecture provides a solid foundation for real-time agent orchestration.

**Next Steps:**
1. Fork Mission Control repository
2. Complete Phase 1 setup
3. Begin Phase 2 panel development
4. Integrate with Aitlas services in Phase 3

---

*Generated: 2026-03-09*  
*Author: Atlas (AI Agent)*  
*Version: 1.0*