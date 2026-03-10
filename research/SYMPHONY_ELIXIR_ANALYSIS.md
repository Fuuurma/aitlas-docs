# Symphony Elixir Code Analysis

**Repository:** https://github.com/openai/symphony  
**License:** Apache 2.0  
**Status:** Engineering Preview  
**Date:** 2026-03-10

---

## Overview

Symphony is a **long-running automation service** that orchestrates coding agents (Codex) to get project work done. It:

1. Polls Linear for issues in active states
2. Creates isolated workspaces per issue
3. Launches Codex app-server in each workspace
4. Monitors and manages agent execution
5. Handles retries, reconciliation, and cleanup

---

## Architecture

### Project Structure

```
elixir/
├── lib/
│   ├── symphony_elixir.ex          # Application entry
│   ├── symphony_elixir/
│   │   ├── orchestrator.ex         # Core scheduler (GenServer)
│   │   ├── agent_runner.ex         # Codex process management
│   │   ├── workspace.ex            # Per-issue workspace lifecycle
│   │   ├── workflow.ex             # WORKFLOW.md loader
│   │   ├── workflow_store.ex       # Hot reload store
│   │   ├── config.ex               # Typed config getters
│   │   ├── config/                 # Config schema
│   │   ├── codex/
│   │   │   ├── app_server.ex       # JSON-RPC 2.0 over stdio
│   │   │   └── dynamic_tool.ex     # Tool injection
│   │   ├── linear/
│   │   │   ├── adapter.ex          # Linear API adapter
│   │   │   ├── client.ex           # GraphQL client
│   │   │   └── issue.ex            # Normalized issue struct
│   │   ├── tracker.ex              # Tracker behaviour
│   │   ├── tracker/                # Memory tracker for tests
│   │   ├── prompt_builder.ex       # Liquid template rendering
│   │   ├── status_dashboard.ex     # Terminal UI (GenServer)
│   │   ├── http_server.ex          # Optional HTTP API
│   │   ├── log_file.ex             # Structured logging
│   │   └── cli.ex                  # CLI entry point
│   ├── symphony_elixir_web/
│   │   ├── endpoint.ex             # Phoenix endpoint
│   │   ├── router.ex               # Routes
│   │   ├── live/
│   │   │   └── dashboard_live.ex   # LiveView dashboard
│   │   └── components/             # UI components
│   └── mix/
│       └── tasks/                  # Mix tasks
├── config/
│   └── config.exs                  # App config
├── test/                           # ExUnit tests
├── WORKFLOW.md                     # Workflow contract
├── AGENTS.md                       # AI assistant context
└── mix.exs                         # Dependencies
```

---

## Core Components

### 1. Orchestrator (GenServer)

**File:** `lib/symphony_elixir/orchestrator.ex`

The orchestrator is the heart of Symphony - a GenServer that:

- **Polls Linear** on a configurable interval (default 30s)
- **Dispatches issues** to agent runners when slots available
- **Reconciles running issues** - stops agents when issue state changes
- **Handles retries** with exponential backoff
- **Tracks session metrics** (tokens, runtime)

```elixir
defmodule SymphonyElixir.Orchestrator do
  use GenServer
  
  defmodule State do
    defstruct [
      :poll_interval_ms,
      :max_concurrent_agents,
      :next_poll_due_at_ms,
      running: %{},           # issue_id -> running_entry
      completed: MapSet.new(),
      claimed: MapSet.new(),
      retry_attempts: %{},
      codex_totals: nil,
      codex_rate_limits: nil
    ]
  end
end
```

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `maybe_dispatch/1` | Poll Linear, filter candidates, dispatch to agents |
| `reconcile_running_issues/1` | Check if running issues changed state |
| `dispatch_issue/2` | Spawn Task.Supervised agent runner |
| `schedule_issue_retry/4` | Schedule retry with backoff |
| `snapshot/0` | Get current orchestrator state |

**Dispatch Flow:**

```
Poll Tick
    ↓
fetch_candidate_issues() → Linear GraphQL
    ↓
sort_issues_for_dispatch() → Priority sort
    ↓
should_dispatch_issue?() → Check eligibility
    ↓
dispatch_issue() → Task.Supervisor.start_child(AgentRunner)
    ↓
Monitor process, track in state.running
```

---

### 2. Agent Runner

**File:** `lib/symphony_elixir/agent_runner.ex`

Runs a single Codex session for one issue:

```elixir
def run(issue, codex_update_recipient, opts) do
  with {:ok, workspace} <- Workspace.create_for_issue(issue),
       :ok <- Workspace.run_before_run_hook(workspace, issue),
       {:ok, session} <- AppServer.start_session(workspace) do
    do_run_codex_turns(session, workspace, issue, ...)
  end
end
```

**Turn Loop:**

1. Build prompt from issue + workflow template
2. Run Codex turn via app-server
3. Check if issue still active
4. If active and turns remaining, continue
5. Otherwise, return control to orchestrator

---

### 3. Workspace Manager

**File:** `lib/symphony_elixir/workspace.ex`

Creates isolated per-issue workspaces:

```elixir
# Workspace path: <workspace.root>/<sanitized-identifier>
# Example: ~/code/symphony-workspaces/ABC-123/

def create_for_issue(issue) do
  safe_id = safe_identifier(issue.identifier)
  workspace = Path.join(Config.workspace_root(), safe_id)
  
  with :ok <- validate_workspace_path(workspace),
       {:ok, created?} <- ensure_workspace(workspace),
       :ok <- maybe_run_after_create_hook(workspace, issue, created?) do
    {:ok, workspace}
  end
end
```

**Hooks:**

| Hook | When | Failure Behavior |
|------|------|------------------|
| `after_create` | Workspace newly created | Abort creation |
| `before_run` | Before each agent attempt | Abort attempt |
| `after_run` | After each agent attempt | Log, ignore |
| `before_remove` | Before workspace deletion | Log, ignore |

**Security:**

- Validates workspace path is under root
- Checks for symlink escape attempts
- Sanitizes identifiers (alphanumeric + `._-`)

---

### 4. Codex App Server Client

**File:** `lib/symphony_elixir/codex/app_server.ex`

JSON-RPC 2.0 client over stdio:

```elixir
# Launch Codex app-server
def start_session(workspace) do
  port = Port.open(
    {:spawn_executable, "bash"},
    [args: ["-lc", codex_command], cd: workspace]
  )
  
  # JSON-RPC handshake
  send_initialize(port)
  {:ok, thread_id} = start_thread(port, workspace, policies)
  
  {:ok, %{port: port, thread_id: thread_id, ...}}
end

# Run a turn
def run_turn(session, prompt, issue) do
  send_message(port, %{
    "method" => "turn/start",
    "params" => %{
      "threadId" => thread_id,
      "input" => [%{"type" => "text", "text" => prompt}],
      "approvalPolicy" => approval_policy,
      "sandboxPolicy" => turn_sandbox_policy
    }
  })
  
  await_turn_completion(port, on_message, tool_executor)
end
```

**Protocol:**

```
Client                    Codex App Server
  |                             |
  |--- initialize ------------>|
  |<-- result ------------------|
  |--- initialized ------------>|
  |                             |
  |--- thread/start ----------->|
  |<-- thread_id ---------------|
  |                             |
  |--- turn/start ------------->|
  |<-- turn_id -----------------|
  |                             |
  |<-- tool/call ---------------|  (tool execution)
  |--- tool/result ------------>|
  |                             |
  |<-- turn/completed ----------|
  |                             |
  |--- thread/stop ------------>|
```

---

### 5. Workflow Store

**File:** `lib/symphony_elixir/workflow.ex`

Loads and parses `WORKFLOW.md`:

```yaml
---
tracker:
  kind: linear
  project_slug: "my-project"
  active_states: [Todo, In Progress]
  terminal_states: [Done, Cancelled]
polling:
  interval_ms: 30000
workspace:
  root: ~/workspaces
hooks:
  after_create: |
    git clone --depth 1 https://github.com/org/repo .
agent:
  max_concurrent_agents: 10
  max_turns: 20
codex:
  command: codex app-server
  approval_policy: never
  thread_sandbox: workspace-write
---

# Prompt template (Markdown with Liquid)
You are working on issue {{ issue.identifier }}...
```

**Hot Reload:**

- `WorkflowStore` GenServer watches for file changes
- Reloads config without restart
- Changes apply to future dispatch/retries

---

### 6. Linear Client

**File:** `lib/symphony_elixir/linear/client.ex`

GraphQL client for Linear API:

```elixir
@query """
query SymphonyLinearPoll($projectSlug: String!, $stateNames: [String!]!) {
  issues(filter: {
    project: {slugId: {eq: $projectSlug}},
    state: {name: {in: $stateNames}}
  }) {
    nodes {
      id
      identifier
      title
      description
      state { name }
      labels { nodes { name } }
      inverseRelations {
        nodes {
          type
          issue { id identifier state { name } }
        }
      }
    }
  }
}
"""
```

**Features:**

- Pagination support
- Blocker detection via `inverseRelations`
- Assignee routing filter
- In-memory tracker for tests

---

### 7. Prompt Builder

**File:** `lib/symphony_elixir/prompt_builder.ex`

Liquid template rendering with Solid:

```elixir
def build_prompt(issue, opts) do
  template = parse_template!(workflow_prompt())
  
  Solid.render!(template, %{
    "issue" => to_solid_map(issue),
    "attempt" => opts[:attempt]
  }, strict_variables: true, strict_filters: true)
end
```

**Available Variables:**

- `issue.id`, `issue.identifier`, `issue.title`
- `issue.description`, `issue.state`, `issue.labels`
- `issue.url`, `issue.branch_name`
- `issue.blocked_by` (list of blocker refs)
- `attempt` (retry number, nil on first run)

---

### 8. Status Dashboard

**File:** `lib/symphony_elixir/status_dashboard.ex`

Terminal UI with ANSI colors:

```
╭─ SYMPHONY STATUS
│ running=3 retrying=1 poll=5s
├────────────────────────────────────────────────────────
│ ID        STAGE          PID      AGE         TOKENS
│ ABC-123   executing      45678    2m 30s      15.2k
│ DEF-456   planning       45679    1m 15s      8.1k
│ GHI-789   validating     45680    45s         3.4k
╰────────────────────────────────────────────────────────
```

**Also:** LiveView dashboard at `/` for web UI

---

## Dependencies

From `mix.exs`:

| Dependency | Version | Purpose |
|------------|---------|---------|
| `phoenix` | ~1.8.0 | Web framework |
| `phoenix_live_view` | ~1.1.0 | Real-time UI |
| `bandit` | ~1.8 | HTTP server |
| `req` | ~0.5 | HTTP client |
| `jason` | ~1.4 | JSON parsing |
| `yaml_elixir` | ~2.12 | YAML parsing |
| `solid` | ~1.2 | Liquid templates |
| `ecto` | ~3.13 | Data structures |
| `credo` | ~1.7 | Linting |
| `dialyxir` | ~1.4 | Type checking |

---

## Key Patterns for Nexus

### 1. Orchestrator as GenServer

```elixir
# In aitlas-backend-template
defmodule Nexus.Orchestrator do
  use GenServer
  
  defmodule State do
    defstruct [
      :poll_interval_ms,
      running: %{},
      claimed: MapSet.new(),
      retry_attempts: %{}
    ]
  end
end
```

### 2. Workspace Isolation

```elixir
# Per-task workspaces
def create_task_workspace(task_id) do
  workspace = Path.join(workspace_root(), sanitize_id(task_id))
  File.mkdir_p!(workspace)
  run_hook(:after_create, workspace)
  {:ok, workspace}
end
```

### 3. Agent Protocol (JSON-RPC over stdio)

```elixir
# For Codex/Claude Code/acpx integration
def start_agent_session(workspace) do
  port = Port.open({:spawn_executable, "acpx"}, [cd: workspace])
  send_initialize(port)
  {:ok, session} = start_thread(port)
  {:ok, %{port: port, session: session}}
end
```

### 4. Hot Config Reload

```elixir
# Watch WORKFLOW.md or equivalent
def handle_info(:file_changed, state) do
  {:ok, new_config} = load_config()
  {:noreply, %{state | config: new_config}}
end
```

### 5. Tracker Adapter Pattern

```elixir
# For Linear/GitHub/Jira/etc
defmodule Nexus.Tracker do
  @callback fetch_candidate_tasks() :: {:ok, [Task.t()]} | {:error, term()}
  
  def adapter, do: config().tracker_adapter
end
```

---

## Differences from Nexus Architecture

| Aspect | Symphony | Nexus |
|--------|----------|-------|
| **Database** | None (in-memory state) | Postgres (persistent) |
| **User System** | None | Auth + sessions |
| **Credits** | None | Credit ledger |
| **API** | Minimal HTTP | Full MCP server |
| **Multi-tenant** | No | Yes (user isolation) |
| **Frontend** | LiveView dashboard | Next.js client (Nova) |

---

## References

- SPEC.md: Full specification (57KB, language-agnostic)
- WORKFLOW.md: Example workflow contract
- AGENTS.md: AI assistant context for future work
- `/docs`: Additional documentation

---

**Compiled:** 2026-03-10  
**Source:** https://github.com/openai/symphony (Apache 2.0)