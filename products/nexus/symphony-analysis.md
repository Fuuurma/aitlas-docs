# Symphony — Analysis & Integration Decision
**Date:** March 2026 | **Status:** CANONICAL  
**Owner:** Furma.tech | **Maintained by:** Herb (AI CTO)

> Symphony is OpenAI's Elixir agent orchestration runtime.  
> Apache 2.0. Not a UI library. Not a task monitor.  
> A backend agent OS — with real patterns we can use in Nexus.

---

## Table of Contents

1. [What Symphony Is](#1-what-symphony-is)
2. [What Symphony Is Not](#2-what-symphony-is-not)
3. [Impact on Nova](#3-impact-on-nova)
4. [Impact on Nexus](#4-impact-on-nexus)
5. [What We Take — Pattern by Pattern](#5-what-we-take--pattern-by-pattern)
6. [What We Don't Take](#6-what-we-dont-take)
7. [The Big Find — JSON-RPC over stdio](#7-the-big-find--json-rpc-over-stdio)
8. [Revised Architecture Decisions](#8-revised-architecture-decisions)
9. [License Clearance](#9-license-clearance)

---

## 1. What Symphony Is

Symphony is OpenAI's production Elixir service for running Codex agents against Linear issues. It is:

- A **long-running orchestration daemon**, not a web app
- Built on **GenServer + Task.Supervisor** (same stack as Nexus)
- A **per-task workspace manager** — creates isolated directories per agent run
- A **JSON-RPC 2.0 client over stdio** — how it talks to Codex app-server
- A **Linear adapter** — polls issues, dispatches agents per issue, reconciles state
- A **LiveView dashboard** — terminal UI + web inspector for the operator

```
Symphony's mental model:
  Linear issue = task
  Codex app-server = the LLM agent
  Workspace = task sandbox
  Orchestrator GenServer = the scheduler

Nexus's mental model:
  User goal = task
  Provider Router + Agent Loop = the LLM agent
  Oban queue = the scheduler
  GenServer per task = process isolation
```

These are structurally identical. Symphony is what Nexus would look like if it only ever ran Codex against Linear, with no users, no credits, no MCP, and no multi-tenancy.

---

## 2. What Symphony Is Not

**Not a React/Next.js UI library.** The LiveView dashboard is Phoenix LiveView — it cannot be ported to Next.js. It is a server-rendered Elixir web UI for the operator to inspect running agents. It has no value to Nova.

**Not a task monitor component.** The Symphony UI is an internal DevOps dashboard for whoever runs the Symphony service. It is not a user-facing product. It shows PIDs, token counts, and ANSI-colored terminal output. Nova's task monitor needs to be built from scratch.

**Not a drop-in for Nexus.** Symphony has no DB, no user system, no credits, no MCP, no multi-tenancy. It cannot be run as Nexus. But its patterns — the way it structures GenServer state, broadcasts, dispatches, retries — are directly applicable to Nexus.

---

## 3. Impact on Nova

### Task Monitor Zone — Verdict: Build From Scratch

```
BEFORE: Tasks zone source → Symphony (clone + port)
AFTER:  Tasks zone source → Build fresh (spec already written in Nova doc §10)
```

Symphony's frontend is LiveView. Nothing to port. Nothing to clone. The Nova task monitor spec written in the Nova technical doc is the complete plan — it stands as-is. Build those ~5 components fresh:

```
TaskList          → ~100 lines
TaskDetail        → ~120 lines
StepTimeline      → ~150 lines
StepCard          → ~80 lines
ReplayControls    → ~60 lines
```

Total: ~2.5 days of build. No external dependency needed.

**Design reference** (visual only, no code): Trigger.dev's run inspector at `triggerdotgg/trigger.dev` (MIT). Use it for UI inspiration only.

### Nova Source Table — Updated

| Zone | Source | License | Approach |
|------|--------|---------|---------|
| Chat | `pingdotgg/t3code` | MIT | Clone + port |
| Tasks | **Build fresh** | — | Spec in Nova doc §10 |
| Dashboard | `builderz-labs/mission-control` | MIT | Clone + port |

---

## 4. Impact on Nexus

This is where Symphony delivers real value.

Symphony is what Nexus's `AgentLoop`, `Orchestrator`, and `Workspace` modules look like at OpenAI scale, in production Elixir. The patterns are battle-tested. The structure maps directly.

```
Symphony                    Nexus
──────────────────────────────────────────────────────
Orchestrator GenServer  →   Nexus.Scheduler (Oban + GenServer)
AgentRunner             →   Nexus.AgentLoop (GenServer per task)
Workspace               →   Nexus.Workspace (per-task sandbox)
AppServer (JSON-RPC)    →   Nexus.CodexClient (NEW — see §7)
WorkflowStore           →   Nexus.AgentLoader (hot spec reload)
Tracker behaviour       →   Nexus.Tracker (adapter pattern)
PromptBuilder           →   Nexus.ContextBuilder (Liquid templates)
StatusDashboard         →   Nexus.Observability (events + metrics)
```

Five specific patterns to adopt. Documented in §5.

---

## 5. What We Take — Pattern by Pattern

### Pattern 1 — Orchestrator State Shape

Symphony's `Orchestrator.State` is clean and directly applicable to Nexus's task dispatcher. Adopt the `running` map + `claimed` MapSet pattern:

```elixir
# lib/nexus/orchestrator/state.ex
defmodule Nexus.Orchestrator.State do
  defstruct [
    :poll_interval_ms,
    :max_concurrent_tasks,
    running: %{},             # task_id => %{pid, user_id, started_at, credits_reserved}
    claimed: MapSet.new(),    # task_ids currently being dispatched (prevent double-dispatch)
    retry_attempts: %{},      # task_id => attempt_count
    rate_limits: nil          # provider rate limit state (from Symphony's codex_rate_limits)
  ]
end
```

The `claimed` MapSet is important — Symphony uses it to prevent a task from being dispatched twice during the same poll tick if the state update is slow. Nexus needs this for the same reason (Oban can have race conditions on fast poll intervals).

---

### Pattern 2 — Dispatch Flow

Symphony's dispatch logic is clean. The `maybe_dispatch/1` → `should_dispatch_issue?/2` → `dispatch_issue/2` chain is exactly what Nexus needs for its Oban-based dispatcher:

```elixir
# lib/nexus/orchestrator.ex
defmodule Nexus.Orchestrator do
  use GenServer

  # Called by Oban on schedule, or triggered by POST /api/v1/tasks
  def maybe_dispatch(state) do
    pending_tasks = Tasks.fetch_pending(limit: available_slots(state))

    pending_tasks
    |> Enum.filter(&should_dispatch?(&1, state))
    |> Enum.reduce(state, &dispatch_task(&2, &1))
  end

  defp should_dispatch?(task, state) do
    not MapSet.member?(state.claimed, task.id) and
    not Map.has_key?(state.running, task.id) and
    within_credit_budget?(task) and
    provider_not_rate_limited?(task.provider, state.rate_limits)
  end

  defp dispatch_task(state, task) do
    state = %{state | claimed: MapSet.put(state.claimed, task.id)}

    Task.Supervisor.start_child(Nexus.TaskSupervisor, fn ->
      Nexus.AgentLoop.run(task)
    end)

    state
  end

  defp available_slots(state) do
    state.max_concurrent_tasks - map_size(state.running)
  end
end
```

---

### Pattern 3 — Workspace Isolation

Symphony creates a per-issue directory. Nexus should create a per-task workspace for:
- Temporary files written by the agent (code, reports, downloads)
- Code execution sandbox (OpenSandbox input/output)
- File processor staging (uploaded files for embedding)

```elixir
# lib/nexus/workspace.ex
defmodule Nexus.Workspace do
  @workspace_root Application.compile_env(:nexus, :workspace_root, "/tmp/nexus-workspaces")

  def create(task_id) do
    safe_id = sanitize_id(task_id)
    workspace = Path.join(@workspace_root, safe_id)

    with :ok <- validate_path(workspace),    # no symlink escape
         :ok <- File.mkdir_p(workspace),
         :ok <- run_hook(:after_create, workspace) do
      {:ok, workspace}
    end
  end

  def remove(task_id) do
    workspace = path_for(task_id)
    run_hook(:before_remove, workspace)
    File.rm_rf(workspace)
    :ok
  end

  def path_for(task_id), do: Path.join(@workspace_root, sanitize_id(task_id))

  # Symphony's security: validate path is actually under root
  # Prevents path traversal attacks via malicious task_ids
  defp validate_path(path) do
    root = Path.expand(@workspace_root)
    expanded = Path.expand(path)

    if String.starts_with?(expanded, root) do
      :ok
    else
      {:error, :path_escape_attempt}
    end
  end

  defp sanitize_id(id) do
    Regex.replace(~r/[^a-zA-Z0-9._\-]/, to_string(id), "_")
  end
end
```

The `validate_path` security check from Symphony is worth taking verbatim — path traversal via task IDs is a real attack vector.

---

### Pattern 4 — Tracker Adapter Behaviour

Symphony defines a `Tracker` behaviour for swapping between Linear, GitHub, Jira etc. In Nexus, this becomes the pattern for **external task sources** — services that can trigger agent tasks from outside Nova:

```elixir
# lib/nexus/tracker.ex
defmodule Nexus.Tracker do
  @moduledoc """
  Adapter behaviour for external task sources.
  Linear, GitHub Issues, Jira — anything that can trigger agent tasks.
  """

  @callback fetch_candidate_tasks() :: {:ok, [map()]} | {:error, term()}
  @callback update_task_status(external_id :: String.t(), status :: atom()) :: :ok | {:error, term()}
  @callback post_comment(external_id :: String.t(), comment :: String.t()) :: :ok | {:error, term()}

  # In-memory tracker for tests (taken from Symphony's approach)
  defmodule Memory do
    @behaviour Nexus.Tracker
    use Agent

    def start_link(tasks), do: Agent.start_link(fn -> tasks end, name: __MODULE__)
    def fetch_candidate_tasks, do: {:ok, Agent.get(__MODULE__, & &1)}
    def update_task_status(_id, _status), do: :ok
    def post_comment(_id, _comment), do: :ok
  end
end
```

This gives Nexus a clean extension point for the **f.bridge** action and future Linear/GitHub integrations without touching core dispatch logic.

---

### Pattern 5 — Prompt Builder with Liquid Templates

Symphony uses Solid (Elixir Liquid) for prompt templating. Nexus's ContextBuilder currently builds prompts imperatively in Elixir. Taking Symphony's Liquid approach gives agent creators a clean, declarative way to define how prompts are assembled:

```elixir
# Add to mix.exs
{:solid, "~> 1.2"}
```

```elixir
# lib/nexus/context_builder/prompt_builder.ex
defmodule Nexus.ContextBuilder.PromptBuilder do
  @moduledoc """
  Renders agent system prompts using Liquid templates.
  Template variables available to all agents:
    {{ user.name }}, {{ user.goal }}
    {{ agent.name }}, {{ agent.role }}
    {{ task.id }}, {{ task.attempt }}
    {{ memory.recent | join: '\n' }}
    {{ tools | map: 'name' | join: ', ' }}
  """

  def build(template_string, variables) do
    template = Solid.parse!(template_string)

    Solid.render!(template, normalize(variables),
      strict_variables: false,   # don't crash if variable missing
      strict_filters: true
    )
  rescue
    e -> {:error, {:template_render_failed, Exception.message(e)}}
  end

  defp normalize(%{user: user, task: task, agent: agent, memory: memory, tools: tools}) do
    %{
      "user"   => %{"name" => user.name, "goal" => task.goal},
      "agent"  => %{"name" => agent.name, "role" => agent.role},
      "task"   => %{"id" => task.id, "attempt" => task.attempt || 1},
      "memory" => %{"recent" => memory.recent_summaries},
      "tools"  => Enum.map(tools, &%{"name" => &1.name, "description" => &1.description})
    }
  end
end
```

Agent system prompts in AgentSpec YAML can now use Liquid:

```yaml
persona:
  system_prompt: |
    You are {{ agent.name }}, working on: "{{ user.goal }}".
    This is attempt {{ task.attempt }}.
    You have access to: {{ tools | map: 'name' | join: ', ' }}.
    {% if memory.recent.size > 0 %}
    Recent context:
    {{ memory.recent | join: '\n' }}
    {% endif %}
```

---

## 6. What We Don't Take

### LiveView Dashboard
Not portable to Next.js. Nova builds its own task monitor fresh. The `status_dashboard.ex` terminal UI is useful for Nexus operators (internal tooling), not for Nova users.

Nexus can keep Symphony's terminal dashboard as an **internal operator tool** — run it on the Hetzner box to inspect running tasks without needing Nova. But it has no bearing on Nova's UI.

### Linear Client
Nexus doesn't poll Linear at the core level. Linear integration becomes the `f.bridge` Action (or a Tracker adapter in Phase 2). The GraphQL client pattern is useful as reference for building Linear-specific adapters.

### WorkflowStore Hot Reload
Symphony hot-reloads `WORKFLOW.md` to change agent behavior without restart. Nexus loads agent specs from the Agents Store API (with ETS caching). This is a different approach and doesn't need WORKFLOW.md-style hot reload. Agent spec updates flow through the Agents Store versioning system instead.

However, the **ETS-based config store pattern** from `WorkflowStore` is worth applying to Nexus's model capability registry — making it hot-reloadable without Nexus restart.

### Retry with Exponential Backoff
Symphony implements its own backoff scheduler. Nexus uses Oban, which has built-in exponential backoff on failed jobs. Don't reimplement what Oban gives for free:

```elixir
# Oban handles this automatically
use Oban.Worker,
  queue: :agents,
  max_attempts: 3
  # Oban backsoff: 15s, 60s, 300s between attempts
```

---

## 7. The Big Find — JSON-RPC over stdio

This is the most important thing in Symphony for Nexus — not the orchestration, not the workspaces.

**Symphony communicates with Codex app-server via JSON-RPC 2.0 over stdio.**

This is the protocol for talking to **Codex, Claude Code, and OpenCode** from within a running agent task. Nova's free tier shows Codex/Claude Code/OpenCode buttons in the chat panel — these buttons need to connect to something. That something is a running agent session using exactly this protocol.

Symphony's `AppServer` module is the complete, working Elixir implementation of a JSON-RPC client that speaks to these tools.

```elixir
# lib/symphony_elixir/codex/app_server.ex — what Symphony has

# Launch Codex app-server
def start_session(workspace) do
  port = Port.open(
    {:spawn_executable, "bash"},
    [args: ["-lc", codex_command], cd: workspace]
  )
  send_initialize(port)
  {:ok, thread_id} = start_thread(port, workspace, policies)
  {:ok, %{port: port, thread_id: thread_id}}
end

# Run a turn
def run_turn(session, prompt, issue) do
  send_message(port, %{
    "method" => "turn/start",
    "params" => %{
      "threadId" => thread_id,
      "input" => [%{"type" => "text", "text" => prompt}],
      "approvalPolicy" => "never",
      "sandboxPolicy" => "workspace-write"
    }
  })
  await_turn_completion(port, on_message, tool_executor)
end
```

### The Protocol

```
Nexus (Elixir)              Codex / Claude Code / OpenCode
       |                              |
       |--- initialize ------------>  |
       |<-- result ----------------   |
       |--- initialized ----------->  |
       |                              |
       |--- thread/start ---------->  |
       |<-- thread_id -------------   |
       |                              |
       |--- turn/start ------------>  |
       |<-- turn_id ---------------   |
       |                              |
       |<-- tool/call -------------   |  (agent calls a tool)
       |--- tool/result ----------->  |  (Nexus executes it)
       |                              |
       |<-- turn/completed --------   |
       |                              |
       |--- thread/stop ----------->  |
```

This is fundamentally different from Nexus's current LLM integration. The current design has Nexus calling the LLM API directly (Provider Router). This protocol is for running **local agentic tools** (Codex, Claude Code) that themselves manage the LLM conversation.

### What This Unlocks

**Nexus becomes the orchestrator for Codex/Claude Code sessions:**

```
User in Nova (free tier):
  "Run Claude Code on my repo"
        │
        ▼
Nova: open Claude Code button
        │
        ▼
IF paid tier:
  Nexus spawns task
  Nexus.CodexClient.start_session(workspace)
  Nexus.CodexClient.run_turn(session, goal)
  Steps broadcast via Phoenix Channel
  Nova Task Monitor shows live progress
        │
        ▼
IF free tier:
  Direct: user runs Claude Code locally
  Nova shows instructions
```

This turns the "Codex / Claude Code / OpenCode buttons" in Nova from being just shortcuts/links into **actual agentic sessions managed by Nexus**.

### Nexus CodexClient Module

```elixir
# lib/nexus/codex_client.ex
defmodule Nexus.CodexClient do
  @moduledoc """
  JSON-RPC 2.0 client over stdio for Codex, Claude Code, and OpenCode.
  Derived from Symphony's AppServer implementation (Apache 2.0).
  
  This module enables Nexus to orchestrate locally-installed
  agentic coding tools as part of an agent task.
  """

  defstruct [:port, :thread_id, :workspace, :task_id]

  @doc """
  Start a Codex/Claude Code/OpenCode session in the given workspace.
  command: "codex app-server" | "claude code --server" | "opencode serve"
  """
  def start_session(workspace, command, task_id) do
    port = Port.open(
      {:spawn_executable, "bash"},
      [:binary, :exit_status, args: ["-lc", command], cd: workspace]
    )

    with :ok <- send_initialize(port),
         :ok <- await_ready(port),
         {:ok, thread_id} <- start_thread(port, workspace) do
      {:ok, %__MODULE__{
        port: port,
        thread_id: thread_id,
        workspace: workspace,
        task_id: task_id
      }}
    end
  end

  @doc """
  Run one turn of the agent loop.
  Returns {:ok, result} | {:error, reason}
  Tool calls are intercepted and forwarded to Nexus.ToolExecutor.
  """
  def run_turn(%__MODULE__{} = session, prompt, tool_executor) do
    send_message(session.port, %{
      "method" => "turn/start",
      "params" => %{
        "threadId"       => session.thread_id,
        "input"          => [%{"type" => "text", "text" => prompt}],
        "approvalPolicy" => "never",
        "sandboxPolicy"  => "workspace-write"
      }
    })

    await_turn_completion(session.port, tool_executor)
  end

  def stop_session(%__MODULE__{} = session) do
    send_message(session.port, %{
      "method" => "thread/stop",
      "params" => %{"threadId" => session.thread_id}
    })
    Port.close(session.port)
    :ok
  end

  # ── Internal ─────────────────────────────────────────────

  defp await_turn_completion(port, tool_executor) do
    receive do
      {^port, {:data, raw}} ->
        case Jason.decode!(raw) do
          %{"method" => "tool/call", "params" => params} ->
            # Intercept tool call, run through Nexus.ToolExecutor
            result = tool_executor.(params["name"], params["arguments"])
            send_tool_result(port, params["callId"], result)
            await_turn_completion(port, tool_executor)

          %{"method" => "turn/completed", "params" => params} ->
            {:ok, params}

          %{"method" => "turn/failed", "params" => params} ->
            {:error, params}

          _ ->
            await_turn_completion(port, tool_executor)
        end

      {^port, {:exit_status, status}} ->
        {:error, {:process_exited, status}}
    after
      300_000 -> {:error, :timeout}
    end
  end

  defp send_message(port, message) do
    Port.command(port, Jason.encode!(message) <> "\n")
  end

  defp send_initialize(port) do
    send_message(port, %{
      "jsonrpc" => "2.0",
      "id"      => 1,
      "method"  => "initialize",
      "params"  => %{
        "protocolVersion" => "2024-11-05",
        "clientInfo"      => %{"name" => "nexus", "version" => "1.0.0"}
      }
    })
    :ok
  end

  defp start_thread(port, workspace) do
    send_message(port, %{
      "jsonrpc" => "2.0",
      "id"      => 2,
      "method"  => "thread/start",
      "params"  => %{"workingDirectory" => workspace}
    })

    receive do
      {^port, {:data, raw}} ->
        case Jason.decode!(raw) do
          %{"result" => %{"threadId" => thread_id}} -> {:ok, thread_id}
          _ -> {:error, :thread_start_failed}
        end
    after
      10_000 -> {:error, :thread_start_timeout}
    end
  end
end
```

### Integration With Agent Loop

The CodexClient becomes a **special execution mode** in Nexus — when an agent's provider is `codex`, `claude-code`, or `opencode` instead of an API-based model:

```elixir
# lib/nexus/agent_loop.ex — provider dispatch
defmodule Nexus.AgentLoop do
  def run(task) do
    case classify_provider(task.provider) do
      :api ->
        # Standard: call LLM API, manage loop ourselves
        run_api_loop(task)

      :local_agent ->
        # Codex/Claude Code/OpenCode: hand off to CodexClient
        run_local_agent(task)
    end
  end

  defp run_local_agent(task) do
    workspace = Workspace.create!(task.id)
    command   = provider_to_command(task.provider)

    {:ok, session} = CodexClient.start_session(workspace, command, task.id)

    # Tool executor bridges Codex's tool calls → Nexus's ToolExecutor
    tool_executor = fn tool_name, args ->
      case ToolExecutor.run(tool_name, args, task) do
        {:ok, result}   -> result
        {:error, error} -> %{"error" => inspect(error)}
      end
    end

    result = CodexClient.run_turn(session, task.goal, tool_executor)
    CodexClient.stop_session(session)
    Workspace.remove(task.id)

    result
  end

  defp provider_to_command("codex"),       do: "codex app-server"
  defp provider_to_command("claude-code"), do: "claude --server"
  defp provider_to_command("opencode"),    do: "opencode serve"

  defp classify_provider("codex"),       do: :local_agent
  defp classify_provider("claude-code"), do: :local_agent
  defp classify_provider("opencode"),    do: :local_agent
  defp classify_provider(_),             do: :api
end
```

---

## 8. Revised Architecture Decisions

### Nexus Provider Types — Extended

```
NEXUS PROVIDER TYPES (updated)

:api providers        → Provider Router → HTTP call to OpenAI/Anthropic/Gemini API
  openai:gpt-4o
  anthropic:claude-3-5-sonnet
  gemini:gemini-2.0-flash

:local_agent providers → CodexClient → JSON-RPC over stdio → local tool
  codex
  claude-code
  opencode
```

Both flow through the same Task state machine. Both broadcast steps via Phoenix Channel. Both charge credits (local agents charge compute time, no tokens). The difference is only at the execution layer inside `AgentLoop`.

### Nova Free Tier Buttons — Revised

```
BEFORE:
  Codex / Claude Code / OpenCode buttons → "Coming soon" or external links

AFTER (with CodexClient):
  Codex button → if paid: dispatches Nexus task with provider: "codex"
                           Nexus manages the session
                           Task Monitor shows live steps
               → if free: show "requires Pro + local install" message
```

This is a meaningful product upgrade. The free tier now has a clear upgrade path that feels concrete: "your Codex runs managed and monitored on Nexus."

### Workspace Module — Added to Nexus

Not in the original Nexus architecture. Add it:

```
NEXUS RUNTIME (updated)
├── 1. Provider Router      — API: OpenAI/Anthropic/Gemini | Local: Codex/Claude Code
├── 2. Context Builder      — prompts via Liquid templates (Solid)
├── 3. Agent Loop           — api loop | local agent handoff
├── 4. Tool Executor        — MCP + internal + APIs + code + filesystem
├── 5. Tool Registry        — register/resolve/validate tools
├── 6. Memory Engine        — short-term + vector + episodic
├── 7. File Processor       — parse/chunk/embed/index
├── 8. Observability        — events, metrics, traces
├── 9. Workspace Manager    — per-task sandboxed directories  ← NEW (from Symphony)
└──10. Codex Client         — JSON-RPC over stdio             ← NEW (from Symphony)
    + Replay Engine
```

---

## 9. License Clearance

| Item | License | Usage | Cleared |
|------|---------|-------|---------|
| Symphony patterns (Orchestrator, Workspace, Tracker) | Apache 2.0 | Adapt into Nexus | ✅ Yes — Apache 2.0 allows use in proprietary software |
| Symphony CodexClient | Apache 2.0 | Port into Nexus | ✅ Yes — attribution comment in file |
| Symphony LiveView UI | Apache 2.0 | Not used | N/A |
| Trigger.dev UI | MIT | Visual reference only (no code) | ✅ Yes |

**Attribution requirement (Apache 2.0):** Add a comment to any directly ported file:

```elixir
# Derived from Symphony (github.com/openai/symphony)
# Copyright OpenAI, Apache License 2.0
# Modified by Furma.tech for Nexus (Aitlas)
```

---

## Summary

| Question | Answer |
|----------|--------|
| Is Symphony a UI library? | No. Pure Elixir backend. LiveView only. |
| Does Nova get anything from Symphony? | No. Task monitor built fresh. |
| Does Nexus get anything from Symphony? | Yes — 5 patterns + CodexClient |
| Most valuable Symphony contribution? | JSON-RPC over stdio (CodexClient) |
| License risk? | None. Apache 2.0, cleared for proprietary use. |
| Nova build plan changes? | Task Monitor: lose "clone Symphony", gain "build fresh" |
| Nexus architecture changes? | +Workspace Manager, +CodexClient, +Liquid templates |
| Timeline impact? | Task monitor: +2 days (build fresh). Nexus CodexClient: +3 days. Net: +5 days total. |

---

**Last Updated:** March 2026  
**Maintained by:** Herb (AI CTO)

> *Symphony proved the pattern works at OpenAI scale.*  
> *We take the patterns. We leave the Linear client.*  
> *The CodexClient is the unexpected gift.*
