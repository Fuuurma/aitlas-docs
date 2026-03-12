# Nexus — Technical Implementation Document
**Version:** 1.1 | **Date:** March 2026 | **Status:** CANONICAL  
**Owner:** Furma.tech | **Maintained by:** Herb (AI CTO)

> Nexus is the agent operating system of Aitlas.  
> Pure Elixir/OTP. Every agent task is a GenServer process.  
> Every run is a commit. Nexus is the Git.

> **Supersedes:** `nexus-architecture.md` (deprecated)  
> **References:** `MASTER_ARCHITECTURE.md` §5, §11, §12 | `symphony-analysis-doc.md`

---

## Table of Contents

1. [What Nexus Is](#1-what-nexus-is)
2. [Repo Structure](#2-repo-structure)
3. [The Eleven Engines](#3-the-eleven-engines)
4. [Application Supervision Tree](#4-application-supervision-tree)
5. [Engine 1 — Provider Router](#5-engine-1--provider-router)
6. [Engine 2 — Context Builder](#6-engine-2--context-builder)
7. [Engine 3 — Agent Loop](#7-engine-3--agent-loop)
8. [Engine 4 — Tool Executor](#8-engine-4--tool-executor)
9. [Engine 5 — Tool Registry](#9-engine-5--tool-registry)
10. [Engine 6 — Memory Engine](#10-engine-6--memory-engine)
11. [Engine 7 — File Processor](#11-engine-7--file-processor)
12. [Engine 8 — Observability](#12-engine-8--observability)
13. [Engine 9 — Workspace Manager](#13-engine-9--workspace-manager)
14. [Engine 10 — Codex Client](#14-engine-10--codex-client)
15. [Engine 11 — Capability Graph](#15-engine-11--capability-graph)
16. [BudgetGuard](#16-budgetguard)
17. [Replay Engine](#17-replay-engine)
18. [Phoenix Channels](#18-phoenix-channels)
19. [Oban Workers](#19-oban-workers)
20. [API Layer](#20-api-layer)
21. [Database Schema](#21-database-schema)
22. [Security Layer](#22-security-layer)
23. [Credit System](#23-credit-system)
24. [BYOK Key Handling](#24-byok-key-handling)
25. [MCP Client](#25-mcp-client)
26. [Config & Environment](#26-config--environment)
27. [Dependencies](#27-dependencies)
28. [Build Order](#28-build-order)

---

## 1. What Nexus Is

Nexus is the execution kernel. It does not have a UI. It does not manage users. It does not run a marketplace. It executes agents.
Nexus **owns task orchestration** end‑to‑end: tasks live in the Nexus DB and are dispatched internally by the runtime. External issue trackers are optional and not required for core operation.

```
WHAT NEXUS OWNS
  Task lifecycle        PENDING → RUNNING → COMPLETED/FAILED/STUCK
  Agent loop            PLAN → ACT → REFLECT → PERSIST (repeat)
  Tool execution        Resolve → Validate → Execute → Hash → Charge
  Memory                Active context + vector + episodic
  Replay                Deterministic trace, fork, export
  Credit charging       Reserve → deduct → refund
  Real-time streaming   Phoenix Channels → Nova

WHAT NEXUS DOES NOT OWN
  User accounts         → aitlas_core DB tables (shared)
  Agent definitions     → Agents Store API
  Tool implementations  → Actions (f.xyz)
  UI                    → Nova
  Payments              → Stripe via Nova
```

### The BEAM Advantage

Each agent task is one `GenServer` process. The BEAM VM gives this for free:

```
1000 concurrent agent tasks = 1000 GenServer processes
Memory cost per process: ~2KB (BEAM default)
Crash isolation: one task crash never affects others
Auto-restart: OTP Supervisors restart crashed processes
No threads, no mutexes, no shared state
```

This is why Nexus is Elixir. Not because it's fashionable. Because the concurrency model maps exactly to the problem.

---

## 2. Repo Structure

```
aitlas-nexus/
├── lib/
│   ├── aitlas.ex                         ← Context entry module
│   ├── aitlas/application.ex             ← OTP supervision tree
│   ├── aitlas/
│   │   ├── agent_loop/                   ← Core GenServer loop
│   │   ├── context/                      ← ContextBuilder + tools filtering
│   │   ├── provider_router/              ← OpenAI/Anthropic/Gemini adapters
│   │   ├── tool_executor/                ← Tool execution + MCP client
│   │   ├── tasks/                        ← Task schemas + workflow
│   │   ├── tools/                        ← Built-in tool handlers
│   │   ├── memory_engine/                ← Episodic memory + indexing
│   │   ├── memory/                       ← In-memory helpers
│   │   ├── mcp/                          ← MCP dispatcher + tools
│   │   ├── credits/                      ← Credit ledger
│   │   ├── circuit_breaker/              ← Provider breaker
│   │   ├── orchestrator.ex               ← Task dispatcher
│   │   ├── reconciliation.ex             ← Stale task cleanup
│   │   ├── capability_graph.ex           ← Tool hierarchy
│   │   ├── tool_registry.ex              ← ETS tool registry
│   │   ├── replay_engine.ex              ← Trace | reexecute | fork
│   │   ├── replay_sanitizer.ex           ← Replay-safe redaction
│   │   ├── file_processor.ex             ← Parse → Chunk → Embed → Index
│   │   ├── workspace.ex                  ← Per-task workspace
│   │   ├── codex_client.ex               ← Local agent JSON-RPC
│   │   └── observability.ex              ← :telemetry helpers
│   │
│   └── aitlas_web/
│       ├── endpoint.ex                   ← Phoenix endpoint
│       ├── router.ex                     ← Routes
│       ├── channels/                     ← Task streaming
│       ├── controllers/                  ← REST + MCP endpoints
│       └── plugs/                        ← Auth/MCP auth
│
├── priv/repo/migrations/
├── config/
├── test/
├── AGENTS.md
└── mix.exs
```

---

## 3. The Eleven Engines

Nexus is composed of eleven internal engines. Each is a distinct module boundary. Engines call each other in one direction: down the stack. No circular dependencies.

```
NEXUS RUNTIME

  ┌──────────────────────────────────────────────────────────┐
  │  ENGINE 1   Provider Router                              │
  │             OpenAI / Anthropic / Gemini / local          │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 2   Context Builder                              │
  │             system + history + memory + files + tools    │
  │             Liquid templates via Solid                   │
  │             Context Compression Pipeline (v1.1)          │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 3   Agent Loop                  ← CORE           │
  │             PLAN → ACT → REFLECT → PERSIST              │
  │             5 hard limits + heuristic fallback           │
  │             BudgetGuard: multi-layer enforcement         │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 4   Tool Executor                                │
  │             Validate → Execute → Hash → Charge           │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 5   Tool Registry                                │
  │             ETS table. Zero DB in hot loop.              │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 6   Memory Engine                                │
  │             Active (GenServer) + Redis + pgvector        │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 7   File Processor                               │
  │             Parse → Chunk → Embed → HNSW index           │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 8   Observability                                │
  │             :telemetry events + Logger redaction         │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 9   Workspace Manager          ← FROM SYMPHONY   │
  │             Per-task sandboxed directories               │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 10  Codex Client               ← FROM SYMPHONY   │
  │             JSON-RPC 2.0 over stdio                      │
  │             Codex / Claude Code / OpenCode               │
  ├──────────────────────────────────────────────────────────┤
  │  ENGINE 11  Capability Graph           ← NEW v1.1        │
  │             Semantic tool hierarchy                      │
  │             Capability-aware tool filtering              │
  └──────────────────────────────────────────────────────────┘
  
  + REPLAY ENGINE  (cross-cutting, uses all engines)
  + BUDGET GUARD  (cross-cutting, multi-layer enforcement)
  + PHOENIX CHANNELS  (streaming layer)
```

---

## 4. Application Supervision Tree

```elixir
# lib/aitlas/application.ex
defmodule Aitlas.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      Aitlas.Repo,
      Aitlas.Redix,
      {Phoenix.PubSub, name: Aitlas.PubSub},
      {Registry, keys: :unique, name: Aitlas.AgentLoop.Registry},
      {Registry, keys: :unique, name: Aitlas.CircuitBreaker.Registry},
      Aitlas.ToolRegistry,
      Aitlas.CapabilityGraph,
      Aitlas.AgentLoader,
      Aitlas.RetryQueue,
      Aitlas.Orchestrator,
      Aitlas.Reconciliation,
      {Aitlas.CircuitBreaker.Supervisor, []},
      AitlasWeb.Endpoint,
      {Oban, Application.fetch_env!(:aitlas, Oban)}
    ]

    opts = [strategy: :one_for_one, name: Aitlas.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

---

## 5. Engine 1 — Provider Router

Normalizes all LLM calls across providers. The agent loop never calls a provider directly — always goes through the router.

### Model Registry

```elixir
# lib/aitlas/provider_router/model_registry.ex
defmodule Aitlas.ProviderRouter.ModelRegistry do
  @models %{
    "openai:gpt-4o" => %{tools: true, vision: true, stream: true, max_context: 128_000, default_temperature: 0.7},
    "anthropic:claude-3-5-sonnet-20241022" => %{tools: true, vision: true, stream: true, max_context: 200_000},
    "gemini:gemini-2.0-flash" => %{tools: true, vision: true, stream: true, max_context: 1_000_000},
    "local:llama3.2" => %{tools: false, vision: false, stream: true, max_context: 128_000},
    "mock:echo" => %{tools: true, vision: false, stream: false, max_context: 4_096}
  }

  def capabilities(model), do: Map.get(@models, model)
  def supports_tools?(model), do: get_in(@models, [model, :tools]) == true
  def max_context(model), do: get_in(@models, [model, :max_context]) || 8_000
  def all_models, do: Map.keys(@models)
end
```

Full, up-to-date model list lives in `lib/aitlas/provider_router/model_registry.ex`.

### Provider Router

```elixir
# lib/aitlas/provider_router/provider_router.ex
defmodule Aitlas.ProviderRouter do
  alias Aitlas.ProviderRouter.{OpenAI, Anthropic, Gemini, ModelRegistry}

  @spec call([map()], keyword()) :: {:ok, map()} | {:error, term()}
  def call(messages, opts) do
    model = Keyword.fetch!(opts, :model)
    user_id = Keyword.fetch!(opts, :user_id)

    with {:ok, provider, model_name} <- ModelRegistry.parse_provider(model),
         :ok <- validate_model(model),
         {:ok, provider_opts} <- build_provider_opts(provider, model_name, opts) do
      dispatch(provider, messages, provider_opts)
    end
  end
end
```

### OpenAI Adapter

```elixir
# lib/aitlas/provider_router/openai.ex
defmodule Aitlas.ProviderRouter.OpenAI do
  @base_url "https://api.openai.com/v1"

  def call(%{model: model, messages: messages, tools: tools, api_key: api_key} = opts) do
    body = %{
      model:      model,
      messages:   messages,
      max_tokens: opts[:max_tokens] || 4096,
      stream:     opts[:stream] || false
    }

    # Only add tools if non-empty
    body = if tools != [], do: Map.put(body, :tools, normalize_tools(tools)), else: body
    body = if opts[:seed], do: Map.put(body, :seed, opts[:seed]), else: body

    base_url = Map.get(opts, :base_url, @base_url)

    case Req.post("#{base_url}/chat/completions",
      json: body,
      headers: [{"authorization", "Bearer #{api_key}"}],
      receive_timeout: 120_000
    ) do
      {:ok, %{status: 200, body: body}} ->
        {:ok, normalize_response(body)}

      {:ok, %{status: 429}} ->
        {:error, :rate_limited}

      {:ok, %{status: 401}} ->
        {:error, :invalid_api_key}

      {:ok, %{status: status, body: body}} ->
        {:error, {:provider_error, status, body}}

      {:error, reason} ->
        {:error, {:network_error, reason}}
    end
  end

  defp normalize_response(%{"choices" => [%{"message" => message} | _]} = raw) do
    case message do
      %{"tool_calls" => [tool_call | _]} ->
        %{
          type:      :tool_call,
          tool_name: tool_call["function"]["name"],
          tool_args: Jason.decode!(tool_call["function"]["arguments"]),
          tool_call_id: tool_call["id"],
          raw:       raw
        }

      %{"content" => content} ->
        %{
          type:    :text,
          content: content,
          raw:     raw
        }
    end
  end

  defp normalize_tools(tools) do
    Enum.map(tools, fn tool ->
      %{
        type: "function",
        function: %{
          name:        tool.name,
          description: tool.description,
          parameters:  tool.input_schema
        }
      }
    end)
  end
end
```

---

## 6. Engine 2 — Context Builder

Assembles the full prompt for each agent loop iteration. Reads from active context (GenServer state), vector memory, files, and tool definitions.

```elixir
# lib/aitlas/context/context_builder.ex
defmodule Aitlas.ContextBuilder do
  alias Aitlas.{ToolRegistry, MemoryEngine, CapabilityGraph}
  alias Aitlas.Context.Compactor

  @spec build(keyword()) :: [map()]
  def build(opts) do
    agent_spec = Keyword.get(opts, :agent_spec)
    goal = Keyword.fetch!(opts, :goal)
    task_context = Keyword.get(opts, :task_context)
    history = Keyword.get(opts, :history, [])
    model = Keyword.get(opts, :model, "openai:gpt-4o")
    user_id = Keyword.get(opts, :user_id)

    _tools = get_tools_for_agent(agent_spec, goal)

    messages = []

    messages =
      if agent_spec && agent_spec["system_prompt"] do
        [%{role: "system", content: render_system_prompt(agent_spec, opts)} | messages]
      else
        messages
      end

    messages =
      if user_id do
        case fetch_relevant_memories(user_id, goal) do
          [] -> messages
          memories -> [%{role: "system", content: format_memories(memories)} | messages]
        end
      else
        messages
      end

    messages =
      messages ++ [
        %{role: "user", content: build_initial_message(goal, task_context, agent_spec)}
      ]

    messages = messages ++ format_history(history)
    Compactor.compact(messages, max_tokens: Aitlas.ProviderRouter.ModelRegistry.max_context(model), target_ratio: 0.7)
  end
end
```

### Prompt Builder (Liquid via Solid)

Prompt rendering is handled inline in `Aitlas.ContextBuilder` using `Solid`.
Assigns are minimal: `goal`, `context`, `agent_name`, `iteration`.

### Context Compactor

```elixir
# lib/aitlas/context/compactor.ex
defmodule Aitlas.Context.Compactor do
  def compact(messages, opts \\ []) do
    # Keep system + last N, summarize middle if needed
  end
end
```

### Skill Prompts

Skill prompt blocks live in agent specs (Agents Store). Nexus does not embed a static skill prompt registry.

---

## 7. Engine 3 — Agent Loop

The core. A GenServer that runs the PLAN → ACT → REFLECT → PERSIST cycle with hard limits and heuristic stuck detection.

```elixir
# lib/aitlas/agent_loop/agent_loop.ex
defmodule Aitlas.AgentLoop do
  use GenServer

  # PLAN: build context + call LLM
  # ACT: execute tool calls via ToolExecutor
  # REFLECT: summarize tool outputs
  # PERSIST: update task counters + broadcast
end
```

Local agent mode: when `provider` is `codex`, `claude-code`, or `opencode`, the loop dispatches via `Aitlas.CodexClient` and routes tool calls back through `Aitlas.ToolExecutor`.
    # Back off and retry
    Process.sleep(5_000)
    do_loop(state, start_ms)
  end

  defp handle_response({:error, :invalid_api_key}, state, _hash, _start_ms) do
    Tasks.transition(state.task, :failed, error: "invalid_api_key")
    broadcast(state.task.id, "error", %{reason: "invalid_api_key"})
    {:ok, state}
  end

  defp handle_response({:error, reason}, state, _hash, _start_ms) do
    Tasks.transition(state.task, :failed, error: inspect(reason))
    broadcast(state.task.id, "error", %{reason: inspect(reason)})
    {:ok, state}
  end

  # ── Limits ────────────────────────────────────────────────

  defp check_limits(state, start_ms) do
    elapsed = System.monotonic_time(:millisecond) - start_ms

    cond do
      state.iteration >= state.task.max_iterations ->
        {:exceeded, :max_iterations}
      state.tool_calls_made >= state.task.max_tool_calls ->
        {:exceeded, :max_tool_calls}
      state.tokens_used >= state.task.max_tokens ->
        {:exceeded, :max_tokens}
      state.credits_used >= state.task.credit_budget ->
        {:exceeded, :credit_budget}
      elapsed >= @max_runtime_ms_default ->
        {:exceeded, :max_runtime_ms}
      true ->
        :ok
    end
  end

  # ── Helpers ───────────────────────────────────────────────

  defp broadcast(task_id, event, payload) do
    AitlasWeb.Endpoint.broadcast("task:#{task_id}", event, payload)
  end

  defp broadcast_step(task_id, step, status) do
    broadcast(task_id, "step", Map.put(Map.from_struct(step), :status, status))
  end

  defp hash_messages(messages) do
    :crypto.hash(:sha256, Jason.encode!(messages)) |> Base.encode16(case: :lower)
  end

  defp provider_name(model), do: model |> String.split(":") |> List.first()

  defp via_registry(task_id) do
    {:via, Registry, {Aitlas.AgentLoop.Registry, task_id}}
  end
end
```

### Agent Loop State

```elixir
defmodule Aitlas.AgentLoop.State do
  defstruct [
    :task,
    :agent_spec,
    messages:         [],
    iteration:        0,
    tool_calls_made:  0,
    tokens_used:      0,
    credits_used:     0,
    attempt:          1,
    memory_summaries: []
  ]

  def initial(task) do
    %__MODULE__{
      task:       task,
      agent_spec: task.agent_spec,
      messages:   build_initial_messages(task)
    }
  end

  def increment_iteration(state), do: %{state | iteration: state.iteration + 1}
  def increment_tool_calls(state), do: %{state | tool_calls_made: state.tool_calls_made + 1}
  def add_tokens(state, n), do: %{state | tokens_used: state.tokens_used + n}
  def add_credits(state, n), do: %{state | credits_used: state.credits_used + n}
  def add_message(state, msg), do: %{state | messages: state.messages ++ [msg]}

  defp build_initial_messages(task) do
    [%{role: "user", content: task.goal}]
  end
end
```

### Heuristics

```elixir
defmodule Aitlas.AgentLoop.Heuristics do
  @doc "Detect pathological loop behavior before it burns credits"

  def check(state) do
    cond do
      duplicate_tool_calls?(state)   -> {:stuck, :tool_loop}
      last_n_failed?(state, 3)       -> {:stuck, :repeated_failures}
      no_progress?(state, 5)         -> {:stuck, :no_progress}
      true                           -> :ok
    end
  end

  # Same tool called with same args in last 3 iterations
  defp duplicate_tool_calls?(state) do
    recent = Enum.take(state.messages, -6)

    tool_calls = for %{role: "assistant", tool_calls: calls} <- recent,
                     call <- (calls || []),
                     do: {call["function"]["name"], call["function"]["arguments"]}

    unique = Enum.uniq(tool_calls)
    length(tool_calls) > 0 and length(tool_calls) != length(unique)
  end

  # Last N tool results were all errors
  defp last_n_failed?(state, n) do
    recent_tool_results = state.messages
      |> Enum.filter(&(&1[:role] == "tool"))
      |> Enum.take(-n)

    length(recent_tool_results) == n and
      Enum.all?(recent_tool_results, &String.contains?(&1.content, "failed"))
  end

  # Last N assistant messages have identical content (model is looping)
  defp no_progress?(state, n) do
    recent_assistant = state.messages
      |> Enum.filter(&(&1[:role] == "assistant" and &1[:content] != nil))
      |> Enum.map(& &1.content)
      |> Enum.take(-n)

    length(recent_assistant) == n and length(Enum.uniq(recent_assistant)) == 1
  end
end
```

---

## 8. Engine 4 — Tool Executor

Every tool call flows through here. No exceptions.

```elixir
# lib/aitlas/tool_executor.ex
defmodule Aitlas.ToolExecutor do
  @spec execute(String.t(), map(), keyword()) :: map()
  def execute(tool_name, args, opts) do
    # 1. Validate schema + injection guard + allowlist
    # 2. Resolve tool from ToolRegistry (ETS)
    # 3. Execute (built-in or MCP)
    # 4. Hash output for replay
    # 5. Charge credits on success
  end
end
```

### MCP Client

```elixir
# lib/aitlas/tool_executor/mcp_client.ex
defmodule Aitlas.ToolExecutor.MCPClient do
  @doc "JSON-RPC 2.0 call to an MCP endpoint"
  def call_tool(endpoint, name, arguments, opts \\ []) do
    # POST /api/mcp with tools/call
  end
end
```

---

## 9. Engine 5 — Tool Registry

ETS-backed. All lookups are in-memory. Zero DB round-trips during agent execution.

```elixir
# lib/aitlas/tool_registry.ex
defmodule Aitlas.ToolRegistry do
  use GenServer

  @table :aitlas_tool_registry

  def register(tool), do: :ets.insert(@table, {tool.name, tool})
  def get(name), do: case :ets.lookup(@table, name) do [{^name, tool}] -> tool; [] -> nil end
  def all, do: :ets.tab2list(@table) |> Enum.map(fn {_k, v} -> v end)
  def for_llm, do: all() |> prioritize_tools() |> Enum.map(&format_for_llm/1)
end
```

Tool discovery includes MCP refresh (`Aitlas.Workers.MCPRefresh`) and Aitlas Action placeholders (f.*) with high priority until endpoints are live.

---

## 10. Engine 6 — Memory Engine

Three memory tiers. The agent loop primarily uses episodic + semantic search; short-term is Redis-backed.

```elixir
# lib/aitlas/memory_engine.ex
defmodule Aitlas.MemoryEngine do
  alias Aitlas.MemoryEngine.{ShortTerm, Episodic, Semantic}

  def add_turn(task_id, role, content), do: ShortTerm.push(task_id, %{role: role, content: content})
  def get_context(task_id, opts \\ []), do: ShortTerm.get(task_id, Keyword.get(opts, :limit, 20))

  def persist_episode(task_id, user_id, step) do
    Episodic.insert(%{task_id: task_id, user_id: user_id, step_number: step.step_number, type: step.type, content: step.content})
  end

  def add_knowledge(user_id, content, opts \\ []) do
    # embed via ProviderRouter.embed/2 and store in Semantic
  end

  def search(user_id, query, opts \\ []) do
    # embed query and run Semantic.similarity_search/4
  end
end
```

### Semantic Memory

```elixir
# lib/aitlas/memory_engine/semantic.ex
defmodule Aitlas.MemoryEngine.Semantic do
  # pgvector-backed similarity search
end
```

### Short Term (Redis)

```elixir
# lib/aitlas/memory_engine/short_term.ex
defmodule Aitlas.MemoryEngine.ShortTerm do
  def push(task_id, turn), do: :ok
  def get(task_id, limit \\ 50), do: []
end
```

---

## 11. Engine 7 — File Processor

```elixir
# lib/aitlas/file_processor.ex
defmodule Aitlas.FileProcessor do
  def process(file_path, opts \\ []) do
    # parse → chunk → embed → index via MemoryEngine.add_knowledge/3
  end
end
```

---

## 12. Engine 8 — Observability

```elixir
# lib/aitlas/observability.ex
defmodule Aitlas.Observability do
  def task_started(task_id, user_id, agent_slug), do: :ok
  def task_completed(task_id, duration_ms, iterations, credits_used), do: :ok
  def tool_call_completed(task_id, tool_name, status, duration_ms), do: :ok
end
```

### Logger Redactor

Use `Aitlas.LoggerRedactor.redact/1` for sanitizing user content before persistence or logging.
It is used by `Aitlas.ReplaySanitizer` to remove secrets from replay traces.

---

## 13. Engine 9 — Workspace Manager

Per-task sandboxed directory. Critical for Codex/Claude Code sessions and code execution isolation.
Derived from Symphony (Apache 2.0).

```elixir
# lib/aitlas/workspace.ex
defmodule Aitlas.Workspace do
  require Logger

  @workspace_root Application.compile_env(:aitlas, :workspace_root, "/tmp/aitlas-workspaces")

  def create(task_id) do
    safe_id   = sanitize_id(task_id)
    workspace = Path.join(@workspace_root, safe_id)

    with :ok <- validate_path(workspace),
         :ok <- File.mkdir_p(workspace),
         :ok <- run_hook(:after_create, workspace) do
      Logger.info("Workspace created: #{workspace}")
      {:ok, workspace}
    end
  end

  def remove(task_id) do
    workspace = path_for(task_id)
    run_hook(:before_remove, workspace)
    File.rm_rf(workspace)
    Logger.info("Workspace removed: #{workspace}")
    :ok
  end

  def path_for(task_id) do
    Path.join(@workspace_root, sanitize_id(task_id))
  end

  def exists?(task_id) do
    path_for(task_id) |> File.dir?()
  end

  # ── Security ──────────────────────────────────────────────

  # Prevent path traversal: ../../../etc/passwd via malicious task_ids
  defp validate_path(path) do
    root     = Path.expand(@workspace_root)
    expanded = Path.expand(path)

    if String.starts_with?(expanded, root <> "/") or expanded == root do
      :ok
    else
      Logger.warning("Workspace path escape attempt: #{path}")
      {:error, :path_escape_attempt}
    end
  end

  defp sanitize_id(id) do
    id
    |> to_string()
    |> String.replace(~r/[^a-zA-Z0-9._\-]/, "_")
    |> String.slice(0, 64)
  end

  # ── Hooks ─────────────────────────────────────────────────

  defp run_hook(hook, workspace) do
    case Application.get_env(:aitlas, [:workspace_hooks, hook]) do
      nil      -> :ok
      cmd      ->
        case System.cmd("bash", ["-c", cmd], cd: workspace) do
          {_, 0}      -> :ok
          {output, _} -> {:error, {:hook_failed, hook, output}}
        end
    end
  end
end
```

**RTK integration (optional):** When `RTK_ENABLED=true`, `Aitlas.Workspace.exec/3` attempts to rewrite
shell commands using `rtk rewrite` before execution. This pairs with the optional `shell_exec` tool
(`SHELL_EXEC_ENABLED=true`) to reduce CLI output tokens in tool responses.

---

## 14. Engine 10 — Codex Client

JSON-RPC 2.0 client over stdio. Enables Nexus to orchestrate locally-installed Codex, Claude Code, and OpenCode as managed agent sessions.
Derived from Symphony (Apache 2.0).

```elixir
# lib/aitlas/codex_client.ex
defmodule Aitlas.CodexClient do
  require Logger

  defstruct [:port, :thread_id, :workspace, :task_id, :request_id]

  @supported_commands %{
    "codex"       => "codex app-server",
    "claude-code" => "claude --server",
    "opencode"    => "opencode serve"
  }

  # ── Public API ────────────────────────────────────────────

  def start_session(workspace, provider, task_id) do
    # resolves provider to command, spawns port, runs MCP handshake

    with :ok             <- handshake(port),
         {:ok, thread_id} <- start_thread(port, workspace) do
      {:ok, %__MODULE__{
        port:       port,
        thread_id:  thread_id,
        workspace:  workspace,
        task_id:    task_id,
        request_id: 3
      }}
    end
  end

  def run_turn(%__MODULE__{} = session, prompt, tool_executor_fn) do
    send_message(session.port, %{
      jsonrpc: "2.0",
      id:      session.request_id,
      method:  "turn/start",
      params:  %{
        threadId:       session.thread_id,
        input:          [%{type: "text", text: prompt}],
        approvalPolicy: "never",
        sandboxPolicy:  "workspace-write"
      }
    })

    await_turn_completion(session.port, tool_executor_fn)
  end

  def stop_session(%__MODULE__{} = session) do
    send_message(session.port, %{
      jsonrpc: "2.0",
      id:      99,
      method:  "thread/stop",
      params:  %{threadId: session.thread_id}
    })
    Port.close(session.port)
    :ok
  end

  def supported?(provider), do: Map.has_key?(@supported_commands, provider)

  # ── Protocol ──────────────────────────────────────────────

  defp handshake(port) do
    send_message(port, %{
      jsonrpc: "2.0",
      id:      1,
      method:  "initialize",
      params:  %{
        protocolVersion: "2024-11-05",
        clientInfo:      %{name: "aitlas-nexus", version: "1.0.0"}
      }
    })

    receive do
      {^port, {:data, raw}} ->
        case Jason.decode!(raw) do
          %{"result" => _}  -> :ok
          %{"error" => err} -> {:error, {:init_failed, err}}
        end
    after
      10_000 -> {:error, :init_timeout}
    end
  end

  defp start_thread(port, workspace) do
    send_message(port, %{
      jsonrpc: "2.0",
      id:      2,
      method:  "thread/start",
      params:  %{workingDirectory: workspace}
    })

    receive do
      {^port, {:data, raw}} ->
        case Jason.decode!(raw) do
          %{"result" => %{"threadId" => tid}} -> {:ok, tid}
          %{"error" => err}                   -> {:error, {:thread_start_failed, err}}
        end
    after
      10_000 -> {:error, :thread_start_timeout}
    end
  end

  defp await_turn_completion(port, tool_executor_fn) do
    receive do
      {^port, {:data, raw}} ->
        case Jason.decode!(raw) do
          %{"method" => "tool/call", "params" => %{"name" => name, "arguments" => args, "callId" => call_id}} ->
            # Route tool call through Nexus ToolExecutor
            result = tool_executor_fn.(name, args)
            send_message(port, %{
              jsonrpc: "2.0",
              method:  "tool/result",
              params:  %{callId: call_id, result: result}
            })
            await_turn_completion(port, tool_executor_fn)

          %{"method" => "turn/completed", "params" => params} ->
            {:ok, params}

          %{"method" => "turn/failed", "params" => params} ->
            {:error, {:turn_failed, params}}

          _ ->
            await_turn_completion(port, tool_executor_fn)
        end

      {^port, {:exit_status, status}} ->
        {:error, {:process_exited, status}}

    after
      300_000 -> {:error, :turn_timeout}
    end
  end

  defp send_message(port, message) do
    Port.command(port, Jason.encode!(message) <> "\n")
  end
end
```

### Local Agent Execution in AgentLoop

When `provider` is `codex`, `claude-code`, or `opencode`, the Agent Loop forks to `run_local_agent/2` instead of the standard API loop:

```elixir
# In Aitlas.AgentLoop — provider dispatch
defp local_agent?(provider) when is_binary(provider),
  do: provider in ["codex", "claude-code", "opencode"]

# run_local_agent_loop replaces run_loop for local providers
defp run_local_agent_loop(state) do
  {:ok, workspace} = Aitlas.Workspace.create(state.task_id)
  {:ok, session} = Aitlas.CodexClient.start_session(workspace, state.provider, state.task_id)

  tool_executor_fn = fn tool_name, args ->
    Aitlas.ToolExecutor.execute(tool_name, args,
      user_id: state.user_id,
      task_id: state.task_id,
      allowlist: get_in(state.agent_spec, ["tools", "tool_allowlist"])
    )
  end

  result = Aitlas.CodexClient.run_turn(session, state.goal, tool_executor_fn)
  Aitlas.CodexClient.stop_session(session)
  Aitlas.Workspace.remove(state.task_id)
  result
end
```

---

## 15. Engine 11 — Capability Graph

**Problem:** At 100+ tools, LLMs struggle to select tools correctly. A flat list of all tools overwhelms the model and leads to poor selections. This is a known failure point in agent systems.

**Solution:** Semantic capability hierarchy. Tools are organized by capability, and Nexus filters tools *before* the LLM sees them based on the task context.

### Capability Hierarchy

```
Knowledge
 ├ Web Search
 ├ Twitter Search
 ├ Academic Papers
 └ Vector Library

Development
 ├ Code Execution
 ├ Repo Analysis
 └ Deployment

Communication
 ├ Email
 ├ Slack
 └ Discord
```

### Tool Registration with Capabilities

Tool capability metadata is stored directly on the tool definition maps (e.g., `capabilities`, `tags`, `priority`) in `Aitlas.ToolRegistry`.

### Capability Graph Module

```elixir
# lib/aitlas/capability_graph.ex
defmodule Aitlas.CapabilityGraph do
  use GenServer
  require Logger

  @table :aitlas_capability_graph

  # ── Public API ────────────────────────────────────────────

  @doc "Build capability index from all registered tools"
  def build_index do
    GenServer.call(__MODULE__, :build_index)
  end

  @doc "Filter tools based on task goal + context"
  def filter(goal: goal, context: context) do
    # V1: keyword matching on goal vs capabilities
    # V2: embedding similarity on goal vs capability embeddings
    capabilities = infer_capabilities(goal)
    tools_for_capabilities(capabilities, context)
  end

  @doc "Get all tools for a capability path"
  def tools_for_capability(capability_path) do
    case :ets.lookup(@table, capability_path) do
      [{^capability_path, tools}] -> tools
      [] -> []
    end
  end

  @doc "Suggest capabilities for a goal (Nova UI helper)"
  def suggest_capabilities(goal) do
    # Keyword extraction + matching
    infer_capabilities(goal)
  end

  # ── GenServer ─────────────────────────────────────────────

  def start_link(_), do: GenServer.start_link(__MODULE__, [], name: __MODULE__)

  @impl true
  def init(_) do
    :ets.new(@table, [:set, :public, :named_table, read_concurrency: true])
    {:ok, %{}}
  end

  @impl true
  def handle_call(:build_index, _from, state) do
    tools = Aitlas.ToolRegistry.all()

    # Build capability → tools mapping
    by_capability = Enum.group_by(tools, fn tool ->
      tool.capabilities |> List.first() || "general"
    end)

    Enum.each(by_capability, fn {cap, tools} ->
      :ets.insert(@table, {cap, tools})
    end)

    Logger.info("CapabilityGraph: indexed #{length(tools)} tools into #{map_size(by_capability)} capabilities")
    {:reply, :ok, state}
  end

  # ── Private ───────────────────────────────────────────────

  defp infer_capabilities(goal) do
    goal_lower = String.downcase(goal)

    capabilities = []

    # Keyword-based capability inference (V1)
    capabilities = if String.contains?(goal_lower, ["search", "find", "research", "look up"]),
      do: ["knowledge", "search"] ++ capabilities, else: capabilities

    capabilities = if String.contains?(goal_lower, ["code", "implement", "build", "develop"]),
      do: ["development", "code"] ++ capabilities, else: capabilities

    capabilities = if String.contains?(goal_lower, ["email", "send", "message", "notify"]),
      do: ["communication", "messaging"] ++ capabilities, else: capabilities

    capabilities = if String.contains?(goal_lower, ["analyze", "data", "report", "metrics"]),
      do: ["analysis", "data"] ++ capabilities, else: capabilities

    capabilities
  end

  defp tools_for_capabilities(capabilities, context) do
    # Get tools matching any of the inferred capabilities
    # Plus always include agent tools if agent.allow_subagents
    tools = capabilities
      |> Enum.flat_map(fn cap -> tools_for_capability(cap) end)
      |> Enum.uniq_by(& &1.name)

    # Filter by agent allowlist if present
    case context[:agent] do
      %{tools: %{tool_allowlist: allowlist}} when is_list(allowlist) ->
        Enum.filter(tools, fn tool -> tool.name in allowlist end)

      _ ->
        tools
    end
  end
end
```

### Integration with Tool Registry

```elixir
ToolRegistry calls `Aitlas.CapabilityGraph.build_index/0` on refresh to keep the index in sync.
```

---

## 16. BudgetGuard

Centralized multi-layer budget enforcement. Prevents runaway agents across all budget dimensions.

### Budget Types

```elixir
defmodule Aitlas.BudgetGuard do
  @moduledoc """
  Multi-layer budget enforcement. Checked on every agent loop iteration.
  """

  @default_limits %{
    credit_budget:      nil,      # User-set, no default
    token_budget:       200_000,
    tool_call_budget:   50,
    runtime_budget_ms:  30 * 60 * 1000,  # 30 min
    agent_depth_budget: 3         # For agent graphs
  }

  defstruct Map.keys(@default_limits)

  # ── Public API ────────────────────────────────────────────

  @doc "Create a budget guard from task config"
  def from_task(task) do
    %__MODULE__{
      credit_budget:      task.credit_budget,
      token_budget:       task.max_tokens || @default_limits[:token_budget],
      tool_call_budget:   task.max_tool_calls || @default_limits[:tool_call_budget],
      runtime_budget_ms:  task.max_runtime_ms || @default_limits[:runtime_budget_ms],
      agent_depth_budget: task.max_agent_depth || @default_limits[:agent_depth_budget]
    }
  end

  @doc "Check if execution can proceed"
  def check(guard, state) do
    cond do
      state.credits_used >= guard.credit_budget ->
        {:exceeded, :credit_budget, state.credits_used, guard.credit_budget}

      state.tokens_used >= guard.token_budget ->
        {:exceeded, :token_budget, state.tokens_used, guard.token_budget}

      state.tool_calls_made >= guard.tool_call_budget ->
        {:exceeded, :tool_call_budget, state.tool_calls_made, guard.tool_call_budget}

      elapsed_ms(state) >= guard.runtime_budget_ms ->
        {:exceeded, :runtime_budget_ms, elapsed_ms(state), guard.runtime_budget_ms}

      state.graph_depth >= guard.agent_depth_budget ->
        {:exceeded, :agent_depth_budget, state.graph_depth, guard.agent_depth_budget}

      true ->
        :ok
    end
  end

  @doc "Get remaining budget across all dimensions"
  def remaining(guard, state) do
    %{
      credits:    guard.credit_budget && max(0, guard.credit_budget - state.credits_used),
      tokens:     max(0, guard.token_budget - state.tokens_used),
      tool_calls: max(0, guard.tool_call_budget - state.tool_calls_made),
      runtime_ms: max(0, guard.runtime_budget_ms - elapsed_ms(state)),
      agent_depth: max(0, guard.agent_depth_budget - (state.graph_depth || 0))
    }
  end

  # ── Private ───────────────────────────────────────────────

  defp elapsed_ms(state) do
    System.monotonic_time(:millisecond) - state.start_time
  end
end
```

### Integration with Agent Loop

```elixir
# In Aitlas.AgentLoop — updated check_limits
defp check_limits(state, start_ms) do
  guard = Aitlas.BudgetGuard.from_task(state.task)

  case Aitlas.BudgetGuard.check(guard, %{state | start_time: start_ms}) do
    :ok -> :ok
    {:exceeded, reason, current, max} -> {:exceeded, {reason, current, max}}
  end
end
```

### Why Multiple Budget Types

| Budget | Purpose | Failure Prevented |
|--------|---------|-------------------|
| `credit_budget` | Cost control | Unexpected charges |
| `token_budget` | Key protection | Burning user's API key |
| `tool_call_budget` | Tool spam | Infinite tool loops |
| `runtime_budget_ms` | Wall clock | Zombie processes |
| `agent_depth_budget` | Graph depth | Recursive agent spawning |

Enterprise customers require multi-layer budgets. A single credit limit is insufficient.

---

## 17. Replay Engine

```elixir
# lib/aitlas/replay_engine.ex
defmodule Aitlas.ReplayEngine do
  @doc """
  Replay modes:
    :exact     — re-emit stored steps/tool calls over channels
    :trace     — return persisted steps + tool calls (graph-aware)
    :reexecute — re-run PLAN/REFLECT from stored prompts (best-effort)
    :fork      — create a new task starting from a step with overrides
  """
  def trace(task_id, user_id) do
    # returns %{task, steps, tool_calls, children: [...]}
  end

  def reexecute(task_id, user_id) do
    # returns %{task, replayed, children: [...]}
  end

  def fork_from_step(task_id, user_id, step_number, opts \\ []) do
    # creates a new task with replay_of_task_id + fork_from_step
  end
end
```

Graph replay propagation: `trace/2` and `reexecute/2` include child tasks recursively (`children`), using `parent_task_id` links.

---

## 18. Phoenix Channels

Real-time streaming from Nexus to Nova. Every agent step is broadcast as it completes.

```elixir
# lib/aitlas_web/channels/user_socket.ex
defmodule AitlasWeb.UserSocket do
  use Phoenix.Socket

  channel "task:*", AitlasWeb.TaskChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    # Validate Better Auth session token
    # JWT validation lives in AitlasWeb.UserSocket (Better Auth)
  end

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"
end
```

```elixir
# lib/aitlas_web/channels/task_channel.ex
defmodule AitlasWeb.TaskChannel do
  use AitlasWeb, :channel
  alias Aitlas.Tasks

  @impl true
  def join("task:" <> task_id, _params, socket) do
    # Verify this user owns this task
    case Tasks.get_for_user(socket.assigns.user_id, task_id) do
      nil -> {:error, %{reason: "task_not_found"}}
      task -> {:ok, assign(socket, :task_id, task_id)}
    end
  end

  # User can cancel a running task
  @impl true
  def handle_in("cancel", _params, socket) do
    case Aitlas.Tasks.Workflow.cancel_task(socket.assigns.task_id) do
      :ok -> {:reply, :ok, socket}
      {:error, reason} -> {:reply, {:error, reason}, socket}
    end
  end

  # User can pause a running task (V2)
  @impl true
  def handle_in("pause", _params, socket) do
    {:reply, {:error, %{reason: "not_implemented"}}, socket}
  end
end
```

Mount in endpoint:

```elixir
# lib/aitlas_web/endpoint.ex
defmodule AitlasWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :aitlas

  socket "/socket", AitlasWeb.UserSocket,
    websocket: [timeout: 45_000],
    longpoll:  false

  # ... rest of endpoint config
end
```

---

## 19. Oban Workers

```elixir
# lib/aitlas/workers/agent_runner.ex
defmodule Aitlas.Workers.AgentRunner do
  use Oban.Worker, queue: :agents, max_attempts: 3

  @impl true
  def perform(%Oban.Job{args: %{"task_id" => task_id, "user_id" => user_id}}) do
    # Starts AgentLoop and waits for completion
  end
end
```

`MemoryExtractor` and `Watchdog` workers are not implemented in this codebase. Stale-task cleanup is handled by `Aitlas.Reconciliation`, and MCP tool refresh runs via `Aitlas.Workers.MCPRefresh`.

### Oban Config

```elixir
# config/config.exs
config :aitlas, Oban,
  repo: Aitlas.Repo,
  queues: [
    default: 10,
    agents: 20,
    tools: 30,
    memory: 5,
    files: 5
  ],
  plugins: [
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},
    {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(5)},
    {Oban.Plugins.Cron, crontab: [
      {"*/5 * * * *", Aitlas.Workers.MCPRefresh}
    ]}
  ]
```

---

## 20. API Layer

```elixir
# lib/aitlas_web/router.ex
defmodule AitlasWeb.Router do
  use AitlasWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session
  end

  pipeline :authenticated do
    plug AitlasWeb.Plugs.Auth
  end

  pipeline :internal do
    plug AitlasWeb.Plugs.InternalAuth
  end

  pipeline :mcp_auth do
    plug AitlasWeb.Plugs.MCPAuth
  end

  scope "/api", AitlasWeb do
    pipe_through :api
    get "/health", HealthController, :index
  end

  scope "/api", AitlasWeb do
    pipe_through [:api, :mcp_auth]
    post "/mcp", MCPController, :handle
  end

  scope "/api/v1", AitlasWeb do
    pipe_through [:api, :authenticated]
    resources "/tasks", TaskController, only: [:index, :create, :show, :delete]
    post "/tasks/:id/retry", TaskController, :retry
    post "/tasks/:id/replay", ReplayController, :replay
  end
end
```

### Task Controller

```elixir
# lib/aitlas_web/controllers/task_controller.ex
defmodule AitlasWeb.TaskController do
  use AitlasWeb, :controller
  alias Aitlas.{Tasks, AgentLoader}
  alias Aitlas.Tasks.Workflow

  # POST /api/v1/tasks
  def create(conn, params) do
    user_id = conn.assigns.current_user_id

    with {:ok, agent_spec} <- AgentLoader.resolve(params["agent_slug"]),
         {:ok, task} <- Workflow.create_task(user_id, %{
           agent_slug: params["agent_slug"],
           agent_spec: agent_spec,
           goal: params["goal"],
           context: params["context"],
           provider: params["provider"],
           model: params["model"],
           seed: params["seed"],
           credit_budget: params["credit_budget"] || 100,
           max_iterations: params["max_iterations"] || 20,
           max_tool_calls: params["max_tool_calls"] || 50,
           max_tokens: params["max_tokens"] || 200_000,
           max_runtime_ms: params["max_runtime_ms"] || 1_800_000
         }) do
      # Orchestrator will dispatch pending tasks
      conn
      |> put_status(:created)
      |> json(%{task_id: task.id, status: "pending"})
    else
      {:error, :insufficient_credits} ->
        conn |> put_status(402) |> json(%{error: "insufficient_credits"})

      {:error, :agent_not_found, _slug} ->
        conn |> put_status(404) |> json(%{error: "agent_not_found"})

      {:error, reason} ->
        conn |> put_status(422) |> json(%{error: inspect(reason)})
    end
  end

  # GET /api/v1/tasks/:id
  def show(conn, %{"id" => task_id}) do
    user_id = conn.assigns.current_user_id

    case Tasks.get_for_user(user_id, task_id) do
      nil -> conn |> put_status(404) |> json(%{error: "task_not_found"})
      task -> json(conn, %{task: task})
    end
  end

  # DELETE /api/v1/tasks/:id
  def delete(conn, %{"id" => task_id}) do
    user_id = conn.assigns.current_user_id

    with {:ok, task} <- Tasks.get_for_user(user_id, task_id),
         :ok <- Workflow.cancel_task(task.id) do
      json(conn, %{status: "cancelled"})
    else
      {:error, :not_found} ->
        conn |> put_status(404) |> json(%{error: "task_not_found"})
    end
  end
end
```

---

## 21. Database Schema

```sql
-- ─── Tasks ──────────────────────────────────────────────────
CREATE TABLE tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL,
  agent_slug          TEXT NOT NULL,
  agent_spec          JSONB,                 -- snapshot of spec at dispatch time
  goal                TEXT NOT NULL,
  context             TEXT,
  provider            TEXT NOT NULL,         -- "openai" (provider name)
  model               TEXT,                  -- "openai:gpt-4o"
  seed                INTEGER,

  -- Execution state
  status              TEXT NOT NULL DEFAULT 'pending',

  -- Limits (from agent spec, can be overridden at dispatch)
  max_iterations      INTEGER NOT NULL DEFAULT 20,
  max_tool_calls      INTEGER NOT NULL DEFAULT 50,
  max_tokens          INTEGER NOT NULL DEFAULT 200000,
  max_runtime_ms      INTEGER NOT NULL DEFAULT 1800000,
  credit_budget       INTEGER NOT NULL DEFAULT 100,

  -- Runtime counters
  iteration           INTEGER NOT NULL DEFAULT 0,
  tool_calls_made     INTEGER NOT NULL DEFAULT 0,
  tokens_used         INTEGER NOT NULL DEFAULT 0,
  credits_reserved    INTEGER NOT NULL DEFAULT 0,
  credits_used        INTEGER NOT NULL DEFAULT 0,
  retry_count         INTEGER NOT NULL DEFAULT 0,

  -- Replay fields
  execution_hash      TEXT,
  replay_of_task_id   UUID REFERENCES tasks(id),
  fork_from_step      INTEGER,

  -- Output
  result              TEXT,
  error               TEXT,

  -- Heartbeat (worker health)
  worker_id           TEXT,
  heartbeat_at        TIMESTAMPTZ,

  -- Agent graph
  parent_task_id      UUID REFERENCES tasks(id),
  root_task_id        UUID REFERENCES tasks(id),
  graph_depth         INTEGER NOT NULL DEFAULT 0,

  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  inserted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id_created  ON tasks(user_id, inserted_at DESC);
CREATE INDEX idx_tasks_status_running   ON tasks(status)
  WHERE status IN ('pending', 'running');
CREATE INDEX idx_tasks_replay           ON tasks(replay_of_task_id)
  WHERE replay_of_task_id IS NOT NULL;


-- ─── Task Steps ─────────────────────────────────────────────
CREATE TABLE task_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_number   INTEGER NOT NULL,
  type          TEXT NOT NULL,     -- PLAN | ACT | REFLECT
  content       TEXT,
  metadata      JSONB DEFAULT '{}',

  -- Replay
  prompt_hash   TEXT,
  response_hash TEXT,
  model         TEXT,
  tokens_in     INTEGER DEFAULT 0,
  tokens_out    INTEGER DEFAULT 0,
  latency_ms    INTEGER,
  inserted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_steps_task_id ON task_steps(task_id, step_number);


-- ─── Tool Calls ─────────────────────────────────────────────
CREATE TABLE tool_calls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_id       UUID REFERENCES task_steps(id),
  tool_name     TEXT NOT NULL,
  tool_input    JSONB,
  tool_output   JSONB,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed | timeout
  credit_cost   INTEGER DEFAULT 0,

  -- Replay + audit
  output_hash   TEXT,
  metadata      JSONB,

  -- Agent graphs
  child_task_id UUID REFERENCES tasks(id),

  error         TEXT,
  latency_ms    INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_calls_task_id   ON tool_calls(task_id);
CREATE INDEX idx_tool_calls_tool_name ON tool_calls(tool_name);
CREATE INDEX idx_tool_calls_child_task_id ON tool_calls(child_task_id)
  WHERE child_task_id IS NOT NULL;


-- ─── Memory Vectors ─────────────────────────────────────────
CREATE TABLE memory_vectors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  agent_id    UUID,
  scope       TEXT NOT NULL,  -- user_agent | user_global | agent_global | task
  content     TEXT NOT NULL,
  embedding   vector(1536),   -- OpenAI text-embedding-3-small dimension
  source_task_id UUID REFERENCES tasks(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memory_vectors_user   ON memory_vectors(user_id, scope);
CREATE INDEX idx_memory_vectors_hnsw
  ON memory_vectors USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);


-- ─── Episodic Memory ────────────────────────────────────────
CREATE TABLE episodic_memory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  agent_id     UUID,
  task_id      UUID REFERENCES tasks(id),
  goal         TEXT,
  outcome      TEXT,     -- completed | failed | stuck | timeout
  result       TEXT,
  tools_used   TEXT[],
  credits_used INTEGER,
  duration_ms  INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_episodic_user    ON episodic_memory(user_id, created_at DESC);
CREATE INDEX idx_episodic_agent   ON episodic_memory(agent_id, created_at DESC);


-- ─── Credit Ledger (append-only) ────────────────────────────
CREATE TABLE credit_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  amount      INTEGER NOT NULL,   -- positive = credit, negative = debit
  reason      TEXT NOT NULL,      -- reserve | tool:name | compute | refund | grant | purchase
  task_id     UUID REFERENCES tasks(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_ledger_user ON credit_ledger(user_id, created_at DESC);

-- Balance view (computed from ledger)
CREATE VIEW credit_balances AS
  SELECT user_id, SUM(amount) AS balance
  FROM credit_ledger
  GROUP BY user_id;
```

---

## 22. Security Layer

```elixir
# lib/nexus/injection_guard/injection_guard.ex
defmodule Aitlas.InjectionGuard do
  @suspicious_patterns [
    ~r/ignore (previous|all|above) instructions/i,
    ~r/exfiltrate/i,
    ~r/reveal (api|secret|key|token|password)/i,
    ~r/execute (system|shell|bash|cmd)/i,
    ~r/call .+ instead of/i,
    ~r/pretend you are/i,
    ~r/jailbreak/i,
    ~r/DAN mode/i
  ]

  def validate(%{name: tool_name, arguments: args}, allowlist) do
    cond do
      tool_name not in allowlist ->
        {:error, :tool_not_in_allowlist}

      contains_injection?(args) ->
        {:error, :injection_detected}

      not valid_arguments?(tool_name, args) ->
        {:error, :invalid_arguments}

      true ->
        :ok
    end
  end

  defp contains_injection?(args) when is_map(args) do
    args
    |> Map.values()
    |> Enum.any?(&contains_injection?/1)
  end

  defp contains_injection?(value) when is_binary(value) do
    Enum.any?(@suspicious_patterns, &Regex.match?(&1, value))
  end

  defp contains_injection?(_), do: false

  defp valid_arguments?(tool_name, args) do
    case Aitlas.ToolRegistry.validate(tool_name, args) do
      :ok              -> true
      {:error, _}      -> false
    end
  end
end
```

### Auth Plug

```elixir
# lib/aitlas_web/plugs/auth.ex
defmodule AitlasWeb.Plugs.Auth do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, user_id}       <- AitlasWeb.Plugs.Auth.validate_session_token(token) do
      assign(conn, :current_user_id, user_id)
    else
      _ ->
        conn
        |> put_status(401)
        |> Phoenix.Controller.json(%{error: "unauthorized"})
        |> halt()
    end
  end
end
```

---

## 23. Credit System

```elixir
# lib/aitlas/credits.ex
defmodule Aitlas.Credits do
  import Ecto.Query
  alias Aitlas.Repo

  # ── Read ─────────────────────────────────────────────────

  def balance(user_id) do
    case Repo.one(
      from l in "credit_ledger",
      where: l.user_id == ^user_id,
      select: coalesce(sum(l.amount), 0)
    ) do
      nil     -> 0
      balance -> balance
    end
  end

  def check(user_id, required) do
    if balance(user_id) >= required, do: :ok, else: {:error, :insufficient_credits}
  end

  # ── Write (all append-only) ──────────────────────────────

  def reserve(user_id, amount, opts \\ []) do
    Repo.transact(fn ->
      with :ok <- check(user_id, amount) do
        insert_entry(user_id, -amount, "reserve", opts)
      end
    end)
  end

  def deduct(user_id, amount, opts) do
    # Called only on successful tool execution
    insert_entry(user_id, -amount, opts[:reason] || "deduct", opts)
    :ok
  end

  def refund(user_id, amount, opts \\ []) do
    insert_entry(user_id, amount, "refund", opts)
    :ok
  end

  def grant(user_id, amount, reason) do
    insert_entry(user_id, amount, reason, [])
    :ok
  end

  # ── Internal ─────────────────────────────────────────────

  defp insert_entry(user_id, amount, reason, opts) do
    Repo.insert_all("credit_ledger", [%{
      id:         Ecto.UUID.generate(),
      user_id:    user_id,
      amount:     amount,
      reason:     reason,
      task_id:    opts[:task_id],
      created_at: DateTime.utc_now()
    }])
  end
end
```

---

## 24. BYOK Key Handling

```elixir
# lib/aitlas/crypto.ex
defmodule Aitlas.Crypto do
  import Ecto.Query
  alias Aitlas.Repo

  @aad "aitlas-api-key-v1"

  def encrypt(plaintext) do
    key   = get_encryption_key()
    iv    = :crypto.strong_rand_bytes(12)
    {ciphertext, tag} = :crypto.crypto_one_time_aead(:aes_256_gcm, key, iv, plaintext, @aad, true)
    %{
      ciphertext: Base.encode64(ciphertext <> tag),
      iv:         Base.encode64(iv)
    }
  end

  # CRITICAL: result is never assigned to a named variable in calling code
  # Always call inline: Crypto.decrypt_api_key(user_id, provider)
  # and pass directly to the function that needs it
  def decrypt_api_key(user_id, provider) do
    case Repo.one(
      from k in "api_keys",
      where: k.user_id == ^user_id and k.provider == ^provider,
      select: %{encrypted_key: k.encrypted_key, iv: k.iv}
    ) do
      nil  -> {:error, :no_key}
      row  -> {:ok, decrypt(row.encrypted_key, row.iv)}
    end
  end

  defp decrypt(ciphertext_b64, iv_b64) do
    key       = get_encryption_key()
    iv        = Base.decode64!(iv_b64)
    combined  = Base.decode64!(ciphertext_b64)
    ciphertext = binary_part(combined, 0, byte_size(combined) - 16)
    tag        = binary_part(combined, byte_size(combined) - 16, 16)
    :crypto.crypto_one_time_aead(:aes_256_gcm, key, iv, ciphertext, @aad, tag, false)
  end

  defp get_encryption_key do
    System.fetch_env!("ENCRYPTION_KEY") |> Base.decode16!(case: :mixed)
  end
end
```

---

## 25. MCP Client

See §8 Engine 4 (ToolExecutor) for `Aitlas.ToolExecutor.MCPClient`.

The MCP client speaks JSON-RPC 2.0 to any MCP endpoint (`POST /api/mcp`) using tools/list and tools/call.
External MCP callers must provide `task_id` to enforce tool allowlists; internal callers may omit it.

---

## 26. Config & Environment

```elixir
# config/runtime.exs
import Config

# ── Database ──────────────────────────────────────────────
config :aitlas, Aitlas.Repo,
  url:              System.fetch_env!("DATABASE_URL"),
  pool_size:        10,
  ssl:              true

# ── Web ───────────────────────────────────────────────────
config :aitlas, AitlasWeb.Endpoint,
  url:       [host: System.fetch_env!("PHX_HOST"), port: 443],
  secret_key_base: System.fetch_env!("SECRET_KEY_BASE"),
  server:    true

# ── Redis ─────────────────────────────────────────────────
config :aitlas, :redis_url, System.fetch_env!("REDIS_URL")

# ── Workspace ─────────────────────────────────────────────
config :aitlas, :workspace_root, System.get_env("WORKSPACE_ROOT", "/tmp/aitlas-workspaces")

# ── RTK / Shell Exec ──────────────────────────────────────
config :aitlas, :rtk_enabled, System.get_env("RTK_ENABLED", "false") in ["true", "1", "yes"]
config :aitlas, :rtk_path, System.get_env("RTK_PATH", "rtk")
config :aitlas, :shell_exec_enabled, System.get_env("SHELL_EXEC_ENABLED", "false") in ["true", "1", "yes"]

# ── Agents Store ──────────────────────────────────────────
config :aitlas, :agents_store_url,    System.fetch_env!("AGENTS_STORE_API_URL")
config :aitlas, :agents_store_secret, System.fetch_env!("FURMA_INTERNAL_SECRET")
```

### `.env` (Hetzner server)

```bash
# Database
DATABASE_URL="postgresql://...@ep-xxx.eu-west-2.aws.neon.tech/nexus?sslmode=require"

# Phoenix
PHX_HOST="nexus.aitlas.xyz"
SECRET_KEY_BASE="64-char-hex"

# Auth
BETTER_AUTH_SECRET="same-as-nova"

# Internal
FURMA_INTERNAL_SECRET="shared-across-all-services"
ENCRYPTION_KEY="64-char-hex-aes-key"

# Redis
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"

# Agents Store
AGENTS_STORE_API_URL="https://api.agents.aitlas.xyz"

# Workspace
WORKSPACE_ROOT="/var/nexus/workspaces"

# RTK (optional)
RTK_ENABLED="true"
RTK_PATH="rtk"
SHELL_EXEC_ENABLED="true"

# MCP
MCP_API_KEY="external-mcp-key"
```

---

## 27. Dependencies

```elixir
# mix.exs
defp deps do
  [
    # ── Web ───────────────────────────────────────────────
    {:phoenix,             "~> 1.7"},
    {:phoenix_live_view,   "~> 1.0"},       # operator dashboard only
    {:bandit,              "~> 1.2"},

    # ── Database ──────────────────────────────────────────
    {:ecto_sql,            "~> 3.12"},
    {:postgrex,            "~> 0.19"},
    {:pgvector,            "~> 0.3"},       # vector memory

    # ── Job Queue ─────────────────────────────────────────
    {:oban,                "~> 2.19"},

    # ── Redis ─────────────────────────────────────────────
    {:redix,               "~> 1.5"},

    # ── HTTP ──────────────────────────────────────────────
    {:req,                 "~> 0.5"},

    # ── JSON ──────────────────────────────────────────────
    {:jason,               "~> 1.4"},

    # ── Liquid templates (from Symphony pattern) ──────────
    {:solid,               "~> 1.2"},

    # ── Crypto ────────────────────────────────────────────
    {:joken,               "~> 2.6"},       # JWT validation (session tokens)

    # ── Rate limiting ─────────────────────────────────────
    {:hammer,              "~> 7.0"},

    # ── Observability ─────────────────────────────────────
    {:telemetry,           "~> 1.3"},
    {:telemetry_metrics,   "~> 1.0"},

    # ── Dev/Test ──────────────────────────────────────────
    {:credo,               "~> 1.7",  only: [:dev, :test]},
    {:dialyxir,            "~> 1.4",  only: [:dev, :test]},
    {:excoveralls,         "~> 0.18", only: :test},
  ]
end
```

---

## 28. Build Order

Build in strict sequence. Each phase is independently runnable.

### Phase 1 — Skeleton (Day 1–2)

- [ ] `mix phx.new nexus --no-html --no-assets --no-live --binary-id`
- [ ] Add all deps to `mix.exs`, `mix deps.get`
- [ ] `config/runtime.exs` — all env vars validated at boot
- [ ] `Aitlas.Repo` + DB connection to Neon
- [ ] All migrations: `tasks`, `task_steps`, `tool_calls`, `memory_vectors`, `episodic_memory`, `credit_ledger`
- [ ] All DB indexes from §19
- [ ] `GET /internal/health` returns 200 with DB ping
- [ ] `Aitlas.Crypto` — encrypt/decrypt (tested)
- [ ] `Aitlas.Credits` — reserve/deduct/refund/balance (tested)
- [ ] Logger redactor installed

**Milestone:** Nexus boots, connects to DB, health check passes, crypto works.

---

### Phase 2 — Tool Registry + Security (Day 3)

- [ ] `Aitlas.ToolRegistry` — ETS table, start on boot
- [ ] Built-in tools registered: `execute_code`, `web_fetch`, `memory_search`
- [ ] `Aitlas.InjectionGuard` — validate allowlist + injection patterns (tested)
- [ ] `Aitlas.ToolExecutor.MCPClient` — JSON-RPC 2.0 HTTP client
- [ ] `Aitlas.ToolExecutor` — full flow: guard → resolve → execute → hash → charge

**Milestone:** Tool calls work end-to-end. Injection blocked. Credits deducted correctly.

---

### Phase 3 — Provider Router (Day 4)

- [ ] `Aitlas.ProviderRouter.ModelRegistry` — capability map
- [ ] `Aitlas.ProviderRouter.OpenAI` — call + normalize response
- [ ] `Aitlas.ProviderRouter.Anthropic`
- [ ] `Aitlas.ProviderRouter.Gemini`
- [ ] `Aitlas.ProviderRouter` — dispatch + BYOK key inline
- [ ] `OpenAI.embed/2` for vector memory
- [ ] Tests: all providers return normalized `%{type: :tool_call}` or `%{type: :text}`

**Milestone:** Can call GPT-4o, Claude, Gemini with BYOK key. Normalized response shape.

---

### Phase 4 — Agent Loop (Day 5–6)

- [ ] `Aitlas.AgentLoop.State` struct
- [ ] `Aitlas.AgentLoop.Heuristics` (tested)
- [ ] `Aitlas.ContextBuilder` (Solid/Liquid)
- [ ] `Aitlas.AgentLoop` GenServer — full PLAN→ACT→REFLECT→PERSIST loop
- [ ] Hard limits enforced: all 5
- [ ] Task state machine: `Tasks.transition/2`
- [ ] `Aitlas.Workers.AgentRunner` Oban worker
- [ ] Phoenix Channel: `UserSocket` + `TaskChannel`
- [ ] `AitlasWeb.TaskController` — create + show + cancel
- [ ] `POST /api/v1/tasks` end-to-end test

**Milestone:** Agent task dispatched from `curl`, runs loop, broadcasts steps via WebSocket, completes.

---

### Phase 5 — Memory + File Processor (Day 7–8)

- [ ] `Aitlas.MemoryEngine` facade
- [ ] `VectorMemory` — pgvector search + insert
- [ ] `ShortTerm` — Redis checkpoint/restore
- [ ] `Episodic` — task outcome records
- [ ] `Aitlas.FileProcessor` — parse → chunk → embed → store
- [ ] ContextBuilder reads vector memories on each iteration

**Milestone:** Agent accumulates memories across runs. Files indexed and retrieved in context.

---

### Phase 6 — Replay Engine (Day 9)

- [ ] `Aitlas.ReplayEngine` — exact, trace, reexecute, fork modes
- [ ] `AitlasWeb.ReplayController` — `POST /api/v1/tasks/:id/replay`
- [ ] Exact replay: re-broadcasts stored steps, 0 credits
- [ ] Fork replay: dispatches new task with `replay_of_task_id` + `fork_from_step`
- [ ] Execution hash computed and stored on task completion

**Milestone:** Any completed task can be replayed exactly for free. Fork creates new task from step N.

---

### Phase 7 — Workspace + Codex Client (Day 10)

- [ ] `Aitlas.Workspace` — create, remove, path validation (from Symphony)
- [ ] `Aitlas.CodexClient` — JSON-RPC over stdio (from Symphony)
- [ ] `AgentLoop` — `classify_provider` + `run_local_agent` branch
- [ ] Test: dispatch task with `provider: "claude-code"`, verify session starts
- [ ] `Aitlas.Reconciliation` periodic cleanup (stale tasks)

**Milestone:** Codex and Claude Code sessions manageable by Nexus as regular tasks.

---

### Phase 8 — Hardening (Day 11–12)

- [ ] `Aitlas.AgentLoader` — load + cache agent specs from Agents Store API (ETS, 5min TTL)
- [ ] `AitlasWeb.Plugs.Auth` + `AitlasWeb.Plugs.InternalAuth` + `AitlasWeb.Plugs.MCPAuth`
- [ ] Rate limiting on all public routes (Hammer + Upstash)
- [ ] Watchdog cron job running every 5 minutes
- [ ] Load test: 50 concurrent agent tasks, verify isolation
- [ ] All secrets redacted in logs — manual verification

**Milestone:** Nexus is production-hardened. Rate limited. Stale tasks cleaned. Auth tested.

---

**Last Updated:** March 2026  
**Maintained by:** Herb (AI CTO)

> *Every agent run is a commit.*  
> *Nexus is the Git.*  
> *Build engines, not features.*
