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
│   ├── nexus.ex                          ← Application entry
│   ├── nexus/
│   │   │
│   │   ├── ── ENGINES ──────────────────────────────────────
│   │   │
│   │   ├── provider_router/
│   │   │   ├── provider_router.ex        ← Router + normalizer
│   │   │   ├── openai.ex                 ← OpenAI adapter
│   │   │   ├── anthropic.ex              ← Anthropic adapter
│   │   │   ├── gemini.ex                 ← Gemini adapter
│   │   │   ├── model_registry.ex         ← In-memory capability map
│   │   │   └── streaming.ex              ← SSE parsing utilities
│   │   │
│   │   ├── context_builder/
│   │   │   ├── context_builder.ex        ← Assembles full prompt
│   │   │   ├── prompt_builder.ex         ← Liquid template rendering (Solid)
│   │   │   ├── compactor.ex              ← Sliding window + summarization
│   │   │   └── skill_prompts.ex          ← Per-skill instruction blocks
│   │   │
│   │   ├── agent_loop/
│   │   │   ├── agent_loop.ex             ← Core GenServer loop
│   │   │   ├── heuristics.ex             ← Stuck detection
│   │   │   └── state.ex                  ← Loop state struct
│   │   │
│   │   ├── tool_executor/
│   │   │   ├── tool_executor.ex          ← Dispatch + credit + hash
│   │   │   └── mcp_client.ex             ← MCP over HTTP (JSON-RPC 2.0)
│   │   │
│   │   ├── tool_registry/
│   │   │   ├── tool_registry.ex          ← ETS table + registration
│   │   │   └── tool.ex                   ← Tool struct
│   │   │
│   │   ├── memory_engine/
│   │   │   ├── memory_engine.ex          ← Facade: all memory ops
│   │   │   ├── active_context.ex         ← GenServer state (hot path)
│   │   │   ├── short_term.ex             ← Redis (Upstash)
│   │   │   ├── vector_memory.ex          ← pgvector HNSW
│   │   │   └── episodic.ex               ← Postgres task history
│   │   │
│   │   ├── file_processor/
│   │   │   ├── file_processor.ex         ← Parse → Chunk → Embed → Index
│   │   │   ├── parsers/
│   │   │   │   ├── pdf.ex
│   │   │   │   ├── docx.ex
│   │   │   │   ├── markdown.ex
│   │   │   │   └── code.ex
│   │   │   └── chunker.ex
│   │   │
│   │   ├── observability/
│   │   │   ├── observability.ex          ← :telemetry event bus
│   │   │   └── logger_redactor.ex        ← Secrets redaction middleware
│   │   │
│   │   ├── workspace/
│   │   │   ├── workspace.ex              ← Per-task sandboxed dirs (Symphony)
│   │   │   └── hooks.ex                  ← Lifecycle hooks
│   │   │
│   │   ├── codex_client/
│   │   │   └── codex_client.ex           ← JSON-RPC over stdio (Symphony)
│   │   │
│   │   ├── capability_graph/
│   │   │   ├── capability_graph.ex       ← Semantic tool hierarchy
│   │   │   ├── capability_node.ex        ← Tree node struct
│   │   │   └── filter.ex                 ← Goal-based tool filtering
│   │   │
│   │   ├── budget_guard/
│   │   │   └── budget_guard.ex           ← Multi-layer budget enforcement
│   │   │
│   │   ├── replay_engine/
│   │   │   └── replay_engine.ex          ← Exact | Live | Fork
│   │   │
│   │   ├── ── DOMAIN ───────────────────────────────────────
│   │   │
│   │   ├── tasks/
│   │   │   ├── tasks.ex                  ← Task CRUD + state machine
│   │   │   ├── task.ex                   ← Ecto schema
│   │   │   ├── task_step.ex              ← Ecto schema
│   │   │   └── tool_call.ex              ← Ecto schema
│   │   │
│   │   ├── agents/
│   │   │   ├── agent_loader.ex           ← Load spec from Agents Store API
│   │   │   └── agent_spec.ex             ← Parsed spec struct
│   │   │
│   │   ├── credits/
│   │   │   └── credits.ex                ← Ledger: reserve/deduct/refund
│   │   │
│   │   ├── crypto/
│   │   │   └── crypto.ex                 ← AES-256-GCM encrypt/decrypt
│   │   │
│   │   ├── injection_guard/
│   │   │   └── injection_guard.ex        ← Tool call security validation
│   │   │
│   │   ├── repo.ex                       ← Ecto Repo
│   │   │
│   │   ├── ── WORKERS ──────────────────────────────────────
│   │   │
│   │   └── workers/
│   │       ├── agent_runner.ex           ← Main Oban worker
│   │       ├── memory_extractor.ex       ← Post-task fact extraction
│   │       ├── file_indexer.ex           ← Parse + embed uploaded files
│   │       ├── scheduled_task.ex         ← Recurring tasks (cron)
│   │       ├── replay_runner.ex          ← Replay Oban worker
│   │       └── watchdog.ex               ← Stale task cleanup
│   │
│   └── nexus_web/
│       ├── endpoint.ex                   ← Phoenix endpoint
│       ├── router.ex                     ← Routes
│       ├── channels/
│       │   ├── user_socket.ex            ← WebSocket authentication
│       │   └── task_channel.ex           ← Per-task live streaming
│       └── controllers/
│           ├── task_controller.ex        ← REST: tasks CRUD
│           ├── replay_controller.ex      ← REST: replay
│           └── health_controller.ex
│
├── priv/
│   └── repo/migrations/
│
├── config/
│   ├── config.exs
│   ├── dev.exs
│   ├── test.exs
│   └── runtime.exs                       ← All secrets loaded here
│
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
# lib/nexus.ex
defmodule Nexus.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # ── Database ──────────────────────────────────────────
      Nexus.Repo,

      # ── Registry (ETS) ────────────────────────────────────
      {Registry, keys: :unique, name: Nexus.TaskRegistry},

      # ── Engine: Tool Registry ─────────────────────────────
      Nexus.ToolRegistry,

      # ── Engine: Memory (Redis connection) ─────────────────
      {Redix, url: Application.fetch_env!(:nexus, :redis_url), name: :nexus_redis},

      # ── Web (Phoenix) ─────────────────────────────────────
      NexusWeb.Endpoint,

      # ── Task Supervisors ──────────────────────────────────
      {Task.Supervisor, name: Nexus.TaskSupervisor},
      {Task.Supervisor, name: Nexus.ToolSupervisor},

      # ── Oban (job queue) ──────────────────────────────────
      {Oban, Application.fetch_env!(:nexus, Oban)},

      # ── Orchestrator ──────────────────────────────────────
      Nexus.Orchestrator,
    ]

    opts = [strategy: :one_for_one, name: Nexus.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

---

## 5. Engine 1 — Provider Router

Normalizes all LLM calls across providers. The agent loop never calls a provider directly — always goes through the router.

### Model Registry

```elixir
# lib/nexus/provider_router/model_registry.ex
defmodule Nexus.ProviderRouter.ModelRegistry do
  @models %{
    # OpenAI
    "openai:gpt-4o"                        => %{tools: true,  vision: true,  stream: true, max_context: 128_000},
    "openai:gpt-4o-mini"                   => %{tools: true,  vision: true,  stream: true, max_context: 128_000},
    "openai:o3-mini"                       => %{tools: true,  vision: false, stream: true, max_context: 200_000},
    # Pinned versions (required for deterministic replay)
    "openai:gpt-4o-2024-11-20"             => %{tools: true,  vision: true,  stream: true, max_context: 128_000},
    # Anthropic
    "anthropic:claude-3-5-sonnet-20241022" => %{tools: true,  vision: true,  stream: true, max_context: 200_000},
    "anthropic:claude-3-haiku-20240307"    => %{tools: true,  vision: false, stream: true, max_context: 200_000},
    # Gemini
    "gemini:gemini-2.0-flash"              => %{tools: true,  vision: true,  stream: true, max_context: 1_000_000},
    "gemini:gemini-1.5-pro"                => %{tools: true,  vision: true,  stream: true, max_context: 2_000_000},
    # Local (Ollama)
    "local:llama3"                         => %{tools: false, vision: false, stream: true, max_context: 8_000},
  }

  def capabilities(model), do: Map.get(@models, model)
  def supports_tools?(model), do: get_in(@models, [model, :tools]) == true
  def max_context(model), do: get_in(@models, [model, :max_context]) || 8_000
  def all_models, do: Map.keys(@models)
end
```

### Provider Router

```elixir
# lib/nexus/provider_router/provider_router.ex
defmodule Nexus.ProviderRouter do
  alias Nexus.ProviderRouter.{OpenAI, Anthropic, Gemini, ModelRegistry}

  @spec call(map()) :: {:ok, map()} | {:error, term()}
  def call(%{model: model, messages: messages, tools: tools, api_key: api_key} = opts) do
    caps = ModelRegistry.capabilities(model)

    if is_nil(caps) do
      {:error, {:unknown_model, model}}
    else
      # Only pass tools if model supports them
      tools_arg = if caps.tools, do: tools, else: []

      {provider, model_id} = parse_model(model)

      call_provider(provider, %{
        model:      model_id,
        messages:   messages,
        tools:      tools_arg,
        api_key:    api_key,
        seed:       Map.get(opts, :seed),
        max_tokens: Map.get(opts, :max_tokens, 4096),
        stream:     Map.get(opts, :stream, false)
      })
    end
  end

  defp parse_model(model_string) do
    [provider | rest] = String.split(model_string, ":", parts: 2)
    {String.to_atom(provider), Enum.join(rest, ":")}
  end

  defp call_provider(:openai, opts),     do: OpenAI.call(opts)
  defp call_provider(:anthropic, opts),  do: Anthropic.call(opts)
  defp call_provider(:gemini, opts),     do: Gemini.call(opts)
  defp call_provider(:local, opts),      do: OpenAI.call(%{opts | base_url: "http://localhost:11434/v1"})
  defp call_provider(p, _),             do: {:error, {:unsupported_provider, p}}
end
```

### OpenAI Adapter

```elixir
# lib/nexus/provider_router/openai.ex
defmodule Nexus.ProviderRouter.OpenAI do
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
# lib/nexus/context_builder/context_builder.ex
defmodule Nexus.ContextBuilder do
  alias Nexus.{MemoryEngine, ToolRegistry, ContextBuilder.Compactor, ContextBuilder.PromptBuilder}

  @spec build(map()) :: list()
  def build(%{task: task, agent_spec: agent, loop_state: state} = opts) do
    system = build_system_prompt(agent, task, state)
    history = state.messages
    memories = fetch_memories(task, agent)
    tools = ToolRegistry.list_for_agent(agent)

    # Compact if approaching context limit
    messages = Compactor.compact(history, max_tokens: agent.execution.max_tokens)

    # Assemble final context
    [
      %{role: "system", content: system}
      | inject_memories(messages, memories)
    ]
    |> then(&{&1, tools})
  end

  defp build_system_prompt(agent, task, state) do
    PromptBuilder.build(agent.persona.system_prompt, %{
      user:   %{name: task.user_name, goal: task.goal},
      agent:  %{name: agent.name, role: agent.role},
      task:   %{id: task.id, attempt: state.attempt},
      memory: %{recent_summaries: state.memory_summaries},
      tools:  ToolRegistry.list_for_agent(agent)
    })
  end

  defp fetch_memories(task, agent) do
    if agent.memory.vector.enabled do
      MemoryEngine.search_vector(
        query:   task.goal,
        user_id: task.user_id,
        agent_id: agent.id,
        scopes:  agent.memory.vector.read_scopes,
        top_k:   agent.memory.vector.top_k
      )
    else
      []
    end
  end

  defp inject_memories(messages, []), do: messages
  defp inject_memories(messages, memories) do
    memory_block = Enum.map_join(memories, "\n", & &1.content)
    memory_message = %{
      role:    "system",
      content: "[MEMORY]\n#{memory_block}\n[/MEMORY]"
    }
    [memory_message | messages]
  end
end
```

### Prompt Builder (Liquid templates via Solid)

```elixir
# lib/nexus/context_builder/prompt_builder.ex
# Derived from Symphony (github.com/openai/symphony), Apache 2.0
# Modified by Furma.tech for Nexus

defmodule Nexus.ContextBuilder.PromptBuilder do
  @doc """
  Renders agent system prompts using Liquid templates.

  Available variables:
    {{ user.name }}, {{ user.goal }}
    {{ agent.name }}, {{ agent.role }}
    {{ task.id }}, {{ task.attempt }}
    {{ memory.recent_summaries | join: '\\n' }}
    {{ tools | map: 'name' | join: ', ' }}
  """
  def build(template_string, variables) when is_binary(template_string) do
    case Solid.parse(template_string) do
      {:ok, template} ->
        Solid.render!(template, normalize(variables),
          strict_variables: false,
          strict_filters:   true
        )
        |> to_string()

      {:error, reason} ->
        # Fall back to raw template if Liquid parse fails
        # (handles plain text system prompts without templates)
        template_string
    end
  rescue
    _ -> template_string
  end

  defp normalize(%{user: user, agent: agent, task: task, memory: memory, tools: tools}) do
    %{
      "user"   => %{"name" => user[:name], "goal" => user[:goal]},
      "agent"  => %{"name" => agent[:name], "role" => agent[:role]},
      "task"   => %{"id" => task[:id], "attempt" => task[:attempt] || 1},
      "memory" => %{"recent_summaries" => memory[:recent_summaries] || []},
      "tools"  => Enum.map(tools, &%{"name" => &1.name, "description" => &1.description})
    }
  end
end
```

### Context Compactor

```elixir
# lib/nexus/context_builder/compactor.ex
defmodule Nexus.ContextBuilder.Compactor do
  @max_messages_default 50

  def compact(messages, opts \\ []) do
    max_msgs = Keyword.get(opts, :max_messages, @max_messages_default)

    cond do
      length(messages) <= max_msgs ->
        messages

      true ->
        # Keep first message (original task context) + last N messages
        [List.first(messages) | Enum.take(messages, -max_msgs + 1)]
    end
  end
end
```

### Skill Prompts

```elixir
# lib/nexus/context_builder/skill_prompts.ex
defmodule Nexus.ContextBuilder.SkillPrompts do
  @skill_prompts %{
    "web_research" => """
    You are skilled at web research. When researching:
    - Always search multiple sources before forming conclusions
    - Prioritize primary sources over aggregators
    - Cross-reference claims across at least 3 sources
    - Synthesize findings in structured, scannable formats
    """,

    "code_review" => """
    You are a skilled code reviewer. When reviewing:
    - Check for correctness, security, performance, and maintainability
    - Reference exact file names and line numbers
    - Prioritize issues by severity: CRITICAL > WARNING > SUGGESTION
    - Explain WHY something is an issue, suggest concrete fixes
    """,

    "data_analysis" => """
    You are a skilled data analyst. When analyzing:
    - Describe the shape and quality of the data first
    - State your assumptions explicitly
    - Show your work: include the calculations or code
    - Distinguish between correlation and causation
    """,

    "lead_enrichment" => """
    You are skilled at B2B lead enrichment. When researching leads:
    - Find company size, funding, tech stack, decision makers
    - Verify information across multiple sources
    - Never fabricate data points — mark uncertain info as [UNVERIFIED]
    - Prioritize recency: information older than 12 months should be flagged
    """,
  }

  def for_skill(skill_name), do: Map.get(@skill_prompts, skill_name, "")

  def for_skills(skills) when is_list(skills) do
    skills
    |> Enum.map(&for_skill/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.join("\n\n")
  end
end
```

---

## 7. Engine 3 — Agent Loop

The core. A GenServer that runs the PLAN → ACT → REFLECT → PERSIST cycle with 5 hard limits and heuristic stuck detection.

```elixir
# lib/nexus/agent_loop/agent_loop.ex
defmodule Nexus.AgentLoop do
  use GenServer
  require Logger

  alias Nexus.{
    ContextBuilder, ProviderRouter, ToolExecutor,
    Tasks, Credits, Observability, Crypto
  }
  alias Nexus.AgentLoop.{Heuristics, State}

  # ── Hard limits (enforced every iteration) ───────────────
  @max_iterations_default   20
  @max_tool_calls_default   50
  @max_tokens_default       200_000
  @max_runtime_ms_default   30 * 60 * 1000   # 30 min

  # ── Public API ────────────────────────────────────────────

  def start_link(task) do
    GenServer.start_link(__MODULE__, task,
      name: via_registry(task.id),
      timeout: @max_runtime_ms_default + 5_000
    )
  end

  def cancel(task_id) do
    case Registry.lookup(Nexus.TaskRegistry, task_id) do
      [{pid, _}] -> GenServer.cast(pid, :cancel)
      []         -> {:error, :not_found}
    end
  end

  # ── GenServer callbacks ───────────────────────────────────

  @impl true
  def init(task) do
    # Fetch decrypted API key — never stored in state as named var
    # Passed inline to each ProviderRouter call
    Process.send_after(self(), :run, 0)
    {:ok, State.initial(task)}
  end

  @impl true
  def handle_info(:run, state) do
    case run_loop(state) do
      {:ok, final_state}    -> {:stop, :normal, final_state}
      {:error, reason}      -> {:stop, reason, state}
    end
  end

  @impl true
  def handle_cast(:cancel, state) do
    Tasks.transition(state.task, :cancelled)
    broadcast(state.task.id, "cancelled", %{})
    {:stop, :normal, state}
  end

  # ── Core Loop ─────────────────────────────────────────────

  defp run_loop(state) do
    start_ms = System.monotonic_time(:millisecond)
    Tasks.transition(state.task, :running)
    broadcast(state.task.id, "started", %{task_id: state.task.id})

    do_loop(state, start_ms)
  end

  defp do_loop(state, start_ms) do
    # 1. Check hard limits every iteration
    case check_limits(state, start_ms) do
      {:exceeded, reason} ->
        Tasks.transition(state.task, :timeout, error: inspect(reason))
        broadcast(state.task.id, "timeout", %{reason: reason})
        {:ok, state}

      :ok ->
        # 2. Check heuristics (stuck detection)
        case Heuristics.check(state) do
          {:stuck, reason} ->
            Tasks.transition(state.task, :stuck, error: inspect(reason))
            broadcast(state.task.id, "stuck", %{reason: reason})
            {:ok, state}

          :ok ->
            # 3. Build context
            {messages, tools} = ContextBuilder.build(%{
              task:       state.task,
              agent_spec: state.agent_spec,
              loop_state: state
            })

            prompt_hash = hash_messages(messages)

            # 4. Call LLM (API key decrypted inline, not stored)
            call_result = ProviderRouter.call(%{
              model:    state.task.provider,
              messages: messages,
              tools:    tools,
              api_key:  Crypto.decrypt_api_key(state.task.user_id, provider_name(state.task.provider)),
              seed:     state.task.seed
            })

            # 5. Handle response
            handle_response(call_result, state, prompt_hash, start_ms)
        end
    end
  end

  defp handle_response({:ok, %{type: :tool_call} = resp}, state, prompt_hash, start_ms) do
    # Write PLAN step
    step = Tasks.create_step!(state.task, %{
      type:        :action,
      step_number: state.iteration + 1,
      content:     "Calling #{resp.tool_name}",
      prompt_hash: prompt_hash,
      model:       state.task.provider,
      input_tokens: get_in(resp, [:raw, "usage", "prompt_tokens"]) || 0,
    })

    broadcast_step(state.task.id, step, :running)

    # Execute tool (injection guard inside ToolExecutor)
    case ToolExecutor.run(%{
      task:        state.task,
      step:        step,
      tool_name:   resp.tool_name,
      tool_args:   resp.tool_args,
      allowlist:   state.agent_spec.tools.tool_allowlist
    }) do
      {:ok, result, credits_used} ->
        # Update step with result
        Tasks.complete_step!(step, %{
          tool_output:  result,
          credits_used: credits_used,
          status:       :completed
        })
        broadcast_step(state.task.id, step, :completed)

        # Append tool result to message history
        new_state = state
          |> State.increment_iteration()
          |> State.increment_tool_calls()
          |> State.add_tokens(resp.raw["usage"]["total_tokens"] || 0)
          |> State.add_message(%{role: "assistant", content: nil, tool_calls: [resp]})
          |> State.add_message(%{role: "tool", tool_call_id: resp.tool_call_id, content: Jason.encode!(result)})

        do_loop(new_state, start_ms)

      {:error, :injection_blocked} ->
        Tasks.complete_step!(step, %{status: :blocked, error: "injection_blocked"})
        broadcast_step(state.task.id, step, :blocked)
        new_state = State.add_message(state, %{
          role: "tool",
          tool_call_id: resp.tool_call_id,
          content: "Tool call blocked by security policy."
        })
        do_loop(State.increment_iteration(new_state), start_ms)

      {:error, reason} ->
        Tasks.complete_step!(step, %{status: :failed, error: inspect(reason)})
        broadcast_step(state.task.id, step, :failed)
        new_state = State.add_message(state, %{
          role: "tool",
          tool_call_id: resp.tool_call_id,
          content: "Tool execution failed: #{inspect(reason)}"
        })
        do_loop(State.increment_iteration(new_state), start_ms)
    end
  end

  defp handle_response({:ok, %{type: :text, content: content}}, state, prompt_hash, _start_ms) do
    # Agent produced a final answer
    step = Tasks.create_step!(state.task, %{
      type:        :final,
      step_number: state.iteration + 1,
      content:     content,
      prompt_hash: prompt_hash,
      model:       state.task.provider,
      status:      :completed
    })

    broadcast_step(state.task.id, step, :completed)
    Tasks.complete!(state.task, content)
    broadcast(state.task.id, "complete", %{result: content, credits_used: state.task.credits_used})

    # Enqueue memory extraction
    %{task_id: state.task.id, user_id: state.task.user_id}
    |> Nexus.Workers.MemoryExtractor.new()
    |> Oban.insert()

    {:ok, state}
  end

  defp handle_response({:error, :rate_limited}, state, _hash, start_ms) do
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
    NexusWeb.Endpoint.broadcast("task:#{task_id}", event, payload)
  end

  defp broadcast_step(task_id, step, status) do
    broadcast(task_id, "step", Map.put(Map.from_struct(step), :status, status))
  end

  defp hash_messages(messages) do
    :crypto.hash(:sha256, Jason.encode!(messages)) |> Base.encode16(case: :lower)
  end

  defp provider_name(model), do: model |> String.split(":") |> List.first()

  defp via_registry(task_id) do
    {:via, Registry, {Nexus.TaskRegistry, task_id}}
  end
end
```

### Agent Loop State

```elixir
# lib/nexus/agent_loop/state.ex
defmodule Nexus.AgentLoop.State do
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
# lib/nexus/agent_loop/heuristics.ex
defmodule Nexus.AgentLoop.Heuristics do
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
# lib/nexus/tool_executor/tool_executor.ex
defmodule Nexus.ToolExecutor do
  alias Nexus.{ToolRegistry, InjectionGuard, Credits, Observability}

  @spec run(map()) :: {:ok, map(), integer()} | {:error, term()}
  def run(%{task: task, step: step, tool_name: name, tool_args: args, allowlist: allowlist}) do

    # 1. Injection guard — must pass before anything else
    with :ok <- InjectionGuard.validate(%{name: name, arguments: args}, allowlist),

    # 2. Resolve from registry (ETS, zero DB)
         {:ok, tool}  <- ToolRegistry.resolve(name),

    # 3. Credit pre-check (enough balance to cover this tool)
         :ok          <- Credits.check(task.user_id, tool.credit_cost),

    # 4. Execute (async, isolated process — crash doesn't kill agent loop)
         {:ok, result} <- execute_isolated(tool, args, task) do

      # 5. Deduct credits (ONLY on success)
      Credits.deduct(task.user_id, tool.credit_cost, %{
        task_id:   task.id,
        step_id:   step.id,
        tool_name: name,
        reason:    "tool:#{name}"
      })

      # 6. Hash output for replay
      output_hash = :crypto.hash(:sha256, Jason.encode!(result))
        |> Base.encode16(case: :lower)

      # 7. Log tool call
      Nexus.Tasks.create_tool_call!(task, %{
        step_id:      step.id,
        tool_name:    name,
        tool_input:   args,
        tool_output:  result,
        tool_version: tool.version,
        output_hash:  output_hash,
        credits_used: tool.credit_cost,
        status:       :completed
      })

      # 8. Telemetry
      Observability.emit("tool.executed", %{
        tool_name:    name,
        user_id:      task.user_id,
        credits_used: tool.credit_cost,
        task_id:      task.id
      })

      {:ok, result, tool.credit_cost}

    else
      {:error, :injection_blocked} ->
        Observability.emit("tool.injection_blocked", %{tool_name: name, task_id: task.id})
        {:error, :injection_blocked}

      {:error, :not_found} ->
        {:error, {:tool_not_found, name}}

      {:error, :insufficient_credits} ->
        {:error, :insufficient_credits}

      {:error, reason} ->
        # Log failed call (no credit charge)
        Nexus.Tasks.create_tool_call!(task, %{
          step_id:    step.id,
          tool_name:  name,
          tool_input: args,
          status:     :failed,
          error:      inspect(reason)
        })

        Observability.emit("tool.failed", %{
          tool_name: name,
          reason:    inspect(reason),
          task_id:   task.id
        })

        {:error, reason}
    end
  end

  defp execute_isolated(tool, args, task) do
    # Run in a separate supervised process
    # If this crashes, the agent loop GenServer is unaffected
    task_ref = Task.Supervisor.async_nolink(Nexus.ToolSupervisor, fn ->
      Nexus.MCP.Client.call(tool, args, task)
    end)

    case Task.yield(task_ref, tool.timeout_ms) || Task.shutdown(task_ref) do
      {:ok, result}    -> result
      {:exit, reason}  -> {:error, {:tool_crashed, reason}}
      nil              -> {:error, :tool_timeout}
    end
  end
end
```

### MCP Client

```elixir
# lib/nexus/tool_executor/mcp_client.ex
defmodule Nexus.MCP.Client do
  @doc "JSON-RPC 2.0 call to an Action's MCP endpoint"

  def call(tool, arguments, task) do
    payload = %{
      jsonrpc: "2.0",
      id:      System.unique_integer([:positive]),
      method:  "tools/call",
      params:  %{
        name:      tool.name,
        arguments: arguments
      }
    }

    headers = build_headers(task)

    case Req.post(tool.endpoint,
      json:            payload,
      headers:         headers,
      receive_timeout: tool.timeout_ms
    ) do
      {:ok, %{status: 200, body: %{"result" => result}}} ->
        {:ok, result}

      {:ok, %{status: 200, body: %{"error" => error}}} ->
        {:error, {:mcp_error, error["code"], error["message"]}}

      {:ok, %{status: 401}} ->
        {:error, :mcp_auth_failed}

      {:ok, %{status: 429}} ->
        {:error, :mcp_rate_limited}

      {:ok, %{status: status, body: body}} ->
        {:error, {:mcp_http_error, status, body}}

      {:error, reason} ->
        {:error, {:mcp_network_error, reason}}
    end
  end

  defp build_headers(task) do
    [
      {"content-type",     "application/json"},
      {"authorization",    "Bearer #{task.session_token}"},
      {"x-furma-internal", System.get_env("FURMA_INTERNAL_SECRET")},
      {"x-task-id",        task.id},
      {"x-user-id",        task.user_id}
    ]
  end
end
```

---

## 9. Engine 5 — Tool Registry

ETS-backed. All lookups are in-memory. Zero DB round-trips during agent execution.

```elixir
# lib/nexus/tool_registry/tool_registry.ex
defmodule Nexus.ToolRegistry do
  use GenServer
  require Logger

  @table :nexus_tool_registry

  # ── Tool struct ───────────────────────────────────────────

  defmodule Tool do
    defstruct [
      :name,            # "web_search"
      :namespace,       # "f.rsrx"
      :full_name,       # "f.rsrx.web_search"
      :version,         # "1"
      :endpoint,        # "https://rsrx.f.xyz/api/mcp"
      :description,
      :input_schema,    # JSON Schema map
      :credit_cost,     # integer
      :timeout_ms,      # default 30_000
      :requires_auth,   # boolean
      :tags             # ["search", "web"]
    ]
  end

  # ── Public API ────────────────────────────────────────────

  def register(%Tool{} = tool) do
    GenServer.call(__MODULE__, {:register, tool})
  end

  def resolve(full_name) do
    case :ets.lookup(@table, full_name) do
      [{^full_name, tool}] -> {:ok, tool}
      []                   -> {:error, :not_found}
    end
  end

  def validate(tool_name, arguments) do
    with {:ok, tool} <- resolve(tool_name) do
      validate_schema(arguments, tool.input_schema)
    end
  end

  def list_for_agent(agent_spec) do
    agent_spec.tools.tool_allowlist
    |> Enum.flat_map(fn name ->
      case resolve(name) do
        {:ok, tool}      -> [tool]
        {:error, _}      -> []
      end
    end)
  end

  def record_usage(tool_name, user_id, credits_used) do
    GenServer.cast(__MODULE__, {:record_usage, tool_name, user_id, credits_used})
  end

  def all_tools do
    :ets.tab2list(@table)
    |> Enum.map(fn {_key, tool} -> tool end)
  end

  # ── GenServer ─────────────────────────────────────────────

  def start_link(_), do: GenServer.start_link(__MODULE__, [], name: __MODULE__)

  @impl true
  def init(_) do
    :ets.new(@table, [:set, :public, :named_table, read_concurrency: true])
    register_builtin_tools()
    {:ok, %{}}
  end

  @impl true
  def handle_call({:register, tool}, _from, state) do
    :ets.insert(@table, {tool.full_name, tool})
    Logger.info("ToolRegistry: registered #{tool.full_name}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_cast({:record_usage, tool_name, _user_id, _credits}, state) do
    # V2: persist usage analytics
    {:noreply, state}
  end

  # ── Built-in tools (always available) ────────────────────

  defp register_builtin_tools do
    [
      %Tool{
        name:         "execute_code",
        namespace:    "builtin",
        full_name:    "execute_code",
        version:      "1",
        endpoint:     :builtin,
        description:  "Execute Python or JavaScript code in a sandbox",
        input_schema: %{
          "type"       => "object",
          "required"   => ["code", "language"],
          "properties" => %{
            "code"     => %{"type" => "string"},
            "language" => %{"type" => "string", "enum" => ["python", "javascript"]}
          }
        },
        credit_cost: 2,
        timeout_ms:  30_000
      },
      %Tool{
        name:         "web_fetch",
        namespace:    "builtin",
        full_name:    "web_fetch",
        version:      "1",
        endpoint:     :builtin,
        description:  "Fetch the raw content of a URL",
        input_schema: %{
          "type"       => "object",
          "required"   => ["url"],
          "properties" => %{"url" => %{"type" => "string", "format" => "uri"}}
        },
        credit_cost: 0,
        timeout_ms:  10_000
      },
      %Tool{
        name:         "memory_search",
        namespace:    "builtin",
        full_name:    "memory_search",
        version:      "1",
        endpoint:     :builtin,
        description:  "Semantic search over agent vector memory",
        input_schema: %{
          "type"       => "object",
          "required"   => ["query"],
          "properties" => %{"query" => %{"type" => "string"}}
        },
        credit_cost: 1,
        timeout_ms:  5_000
      }
    ]
    |> Enum.each(&register/1)
  end

  defp validate_schema(_args, nil), do: :ok
  defp validate_schema(args, schema) do
    # V1: basic type validation. V2: ExJsonSchema
    :ok
  end
end
```

---

## 10. Engine 6 — Memory Engine

Four memory tiers. The agent loop only touches active context (GenServer state). All other tiers are async.

```elixir
# lib/nexus/memory_engine/memory_engine.ex
defmodule Nexus.MemoryEngine do
  alias Nexus.MemoryEngine.{ShortTerm, VectorMemory, Episodic}

  # ── Vector search (called by ContextBuilder) ─────────────

  def search_vector(query:, user_id:, agent_id:, scopes:, top_k:) do
    VectorMemory.search(%{
      query:    query,
      user_id:  user_id,
      agent_id: agent_id,
      scopes:   scopes,
      top_k:    top_k
    })
  end

  # ── Store memory (called by MemoryExtractor worker) ──────

  def store_vector(content, embedding, user_id:, agent_id:, scope:) do
    VectorMemory.insert(%{
      content:   content,
      embedding: embedding,
      user_id:   user_id,
      agent_id:  agent_id,
      scope:     scope
    })
  end

  # ── Redis: persist active context on shutdown ─────────────

  def checkpoint_to_redis(task_id, messages) do
    ShortTerm.set(task_id, messages, ttl: 86_400)  # 24h
  end

  def restore_from_redis(task_id) do
    ShortTerm.get(task_id)
  end

  # ── Episodic: task outcome summary ───────────────────────

  def record_episode(task) do
    Episodic.insert(%{
      user_id:     task.user_id,
      agent_id:    task.agent_id,
      task_id:     task.id,
      goal:        task.goal,
      outcome:     task.status,
      result:      task.result,
      tools_used:  task.tools_used,
      credits_used: task.credits_used,
      duration_ms: task.duration_ms
    })
  end
end
```

### Vector Memory

```elixir
# lib/nexus/memory_engine/vector_memory.ex
defmodule Nexus.MemoryEngine.VectorMemory do
  import Ecto.Query
  alias Nexus.Repo

  defmodule Entry do
    use Ecto.Schema

    @primary_key {:id, :binary_id, autogenerate: true}
    schema "memory_vectors" do
      field :user_id,   :string
      field :agent_id,  :binary_id
      field :scope,     :string
      field :content,   :string
      field :embedding, Pgvector.Ecto.Vector
      timestamps()
    end
  end

  def search(%{query: query, user_id: user_id, agent_id: agent_id, scopes: scopes, top_k: k}) do
    # Embed query using user's OpenAI BYOK key
    case embed(query, user_id) do
      {:ok, embedding} ->
        Repo.all(
          from m in Entry,
          where: m.user_id == ^user_id and m.scope in ^scopes,
          order_by: fragment("embedding <=> ?", ^embedding),
          limit: ^k,
          select: %{id: m.id, content: m.content, scope: m.scope}
        )

      {:error, _} ->
        # No OpenAI key = no vector memory, graceful degradation
        []
    end
  end

  def insert(%{content: content, embedding: embedding} = attrs) do
    %Entry{}
    |> Ecto.Changeset.cast(attrs, [:user_id, :agent_id, :scope, :content, :embedding])
    |> Repo.insert!()
  end

  defp embed(text, user_id) do
    case Nexus.Crypto.decrypt_api_key(user_id, "openai") do
      {:ok, api_key} ->
        Nexus.ProviderRouter.OpenAI.embed(text, api_key)

      {:error, :no_key} ->
        {:error, :no_openai_key}
    end
  end
end
```

### Short Term (Redis)

```elixir
# lib/nexus/memory_engine/short_term.ex
defmodule Nexus.MemoryEngine.ShortTerm do
  @prefix "nexus:context:"

  def set(task_id, messages, ttl: ttl) do
    key   = @prefix <> task_id
    value = Jason.encode!(messages)
    Redix.command!(:nexus_redis, ["SET", key, value, "EX", ttl])
    :ok
  end

  def get(task_id) do
    key = @prefix <> task_id
    case Redix.command!(:nexus_redis, ["GET", key]) do
      nil   -> nil
      value -> Jason.decode!(value)
    end
  end

  def delete(task_id) do
    Redix.command!(:nexus_redis, ["DEL", @prefix <> task_id])
    :ok
  end
end
```

---

## 11. Engine 7 — File Processor

```elixir
# lib/nexus/file_processor/file_processor.ex
defmodule Nexus.FileProcessor do
  alias Nexus.{Repo, MemoryEngine}

  def process(file_path, user_id: user_id, task_id: task_id) do
    with {:ok, content} <- parse(file_path),
         chunks         <- chunk(content),
         {:ok, embeddings} <- embed_all(chunks, user_id) do

      Enum.each(Enum.zip(chunks, embeddings), fn {chunk, embedding} ->
        MemoryEngine.store_vector(chunk, embedding,
          user_id:  user_id,
          agent_id: nil,
          scope:    "user_global"
        )
      end)

      {:ok, length(chunks)}
    end
  end

  defp parse(path) do
    ext = Path.extname(path) |> String.downcase()
    case ext do
      ".pdf"  -> Nexus.FileProcessor.Parsers.PDF.parse(path)
      ".docx" -> Nexus.FileProcessor.Parsers.Docx.parse(path)
      ".md"   -> {:ok, File.read!(path)}
      ".txt"  -> {:ok, File.read!(path)}
      _       -> {:ok, File.read!(path)}
    end
  end

  defp chunk(content, max_chars \\ 800) do
    content
    |> String.split(~r/\n\n+/)
    |> Enum.flat_map(fn para ->
      if String.length(para) > max_chars do
        para |> String.graphemes() |> Enum.chunk_every(max_chars) |> Enum.map(&Enum.join/1)
      else
        [para]
      end
    end)
    |> Enum.reject(&(String.trim(&1) == ""))
  end

  defp embed_all(chunks, user_id) do
    results = Enum.map(chunks, fn chunk ->
      case Nexus.Crypto.decrypt_api_key(user_id, "openai") do
        {:ok, key} -> Nexus.ProviderRouter.OpenAI.embed(chunk, key)
        _          -> {:error, :no_key}
      end
    end)

    if Enum.all?(results, &match?({:ok, _}, &1)) do
      {:ok, Enum.map(results, fn {:ok, e} -> e end)}
    else
      {:error, :embedding_failed}
    end
  end
end
```

---

## 12. Engine 8 — Observability

```elixir
# lib/nexus/observability/observability.ex
defmodule Nexus.Observability do
  require Logger

  @events [
    "agent.started", "agent.completed", "agent.stuck",
    "agent.failed", "agent.replayed",
    "llm.called", "llm.tokens_used",
    "tool.executed", "tool.failed", "tool.timeout", "tool.injection_blocked",
    "memory.updated", "memory.retrieved",
    "task.created", "task.completed", "task.failed",
    "credits.reserved", "credits.deducted", "credits.refunded"
  ]

  def emit(event, metadata \\ %{}) when event in @events do
    Logger.info("[#{event}] #{inspect(metadata)}")

    :telemetry.execute(
      [:nexus | String.split(event, ".") |> Enum.map(&String.to_atom/1)],
      %{count: 1},
      metadata
    )
  end
end
```

### Logger Redactor

```elixir
# lib/nexus/observability/logger_redactor.ex
defmodule Nexus.Observability.LoggerRedactor do
  @redact_pattern ~r/(api_key|authorization|password|secret|token|bearer|sk-)[=:\s"']+\S+/i

  def filter({level, group_leader, {Logger, message, timestamp, metadata}}) do
    clean = Regex.replace(@redact_pattern, to_string(message), "[REDACTED]")
    {level, group_leader, {Logger, clean, timestamp, metadata}}
  end

  def filter(data), do: data
end
```

Add to `config/config.exs`:
```elixir
config :logger,
  backends: [:console],
  compile_time_purge_matching: [level_lower_than: :info]

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :task_id, :user_id]

# Add redactor
config :logger,
  translators: [{Nexus.Observability.LoggerRedactor, :filter}]
```

---

## 13. Engine 9 — Workspace Manager

Per-task sandboxed directory. Critical for Codex/Claude Code sessions and code execution isolation.
Derived from Symphony (Apache 2.0).

```elixir
# lib/nexus/workspace/workspace.ex
# Derived from Symphony (github.com/openai/symphony), Apache 2.0
# Modified by Furma.tech for Nexus (Aitlas)

defmodule Nexus.Workspace do
  require Logger

  @workspace_root Application.compile_env(:nexus, :workspace_root, "/tmp/nexus-workspaces")

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
    case Application.get_env(:nexus, [:workspace_hooks, hook]) do
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

---

## 14. Engine 10 — Codex Client

JSON-RPC 2.0 client over stdio. Enables Nexus to orchestrate locally-installed Codex, Claude Code, and OpenCode as managed agent sessions.
Derived from Symphony (Apache 2.0).

```elixir
# lib/nexus/codex_client/codex_client.ex
# Derived from Symphony (github.com/openai/symphony), Apache 2.0
# Modified by Furma.tech for Nexus (Aitlas)

defmodule Nexus.CodexClient do
  require Logger

  defstruct [:port, :thread_id, :workspace, :task_id, :request_id]

  @supported_commands %{
    "codex"       => "codex app-server",
    "claude-code" => "claude --server",
    "opencode"    => "opencode serve"
  }

  # ── Public API ────────────────────────────────────────────

  def start_session(workspace, provider, task_id) do
    command = Map.fetch!(@supported_commands, provider)

    port = Port.open(
      {:spawn_executable, System.find_executable("bash")},
      [:binary, :exit_status, args: ["-lc", command], cd: workspace]
    )

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
        clientInfo:      %{name: "nexus", version: "1.0.0"}
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
# In Nexus.AgentLoop — provider dispatch

defp classify_provider("codex"),       do: :local_agent
defp classify_provider("claude-code"), do: :local_agent
defp classify_provider("opencode"),    do: :local_agent
defp classify_provider(_),             do: :api

# run_local_agent replaces do_loop for :local_agent providers
defp run_local_agent(state, start_ms) do
  {:ok, workspace} = Nexus.Workspace.create(state.task.id)
  {:ok, session}   = Nexus.CodexClient.start_session(workspace, state.task.provider, state.task.id)

  tool_executor_fn = fn tool_name, args ->
    case Nexus.ToolExecutor.run(%{
      task:      state.task,
      step:      Tasks.current_step(state.task),
      tool_name: tool_name,
      tool_args: args,
      allowlist: state.agent_spec.tools.tool_allowlist
    }) do
      {:ok, result, _credits} -> result
      {:error, reason}        -> %{"error" => inspect(reason)}
    end
  end

  result = Nexus.CodexClient.run_turn(session, state.task.goal, tool_executor_fn)
  Nexus.CodexClient.stop_session(session)
  Nexus.Workspace.remove(state.task.id)

  case result do
    {:ok, params}    ->
      Tasks.complete!(state.task, params["output"] || "")
      {:ok, state}

    {:error, reason} ->
      Tasks.transition(state.task, :failed, error: inspect(reason))
      {:ok, state}
  end
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

```elixir
# lib/nexus/tool_registry/tool.ex
defmodule Nexus.ToolRegistry.Tool do
  defstruct [
    :name,
    :namespace,
    :full_name,
    :version,
    :endpoint,
    :description,
    :input_schema,
    :credit_cost,
    :timeout_ms,
    :requires_auth,
    :tags,
    # ── Capability Graph fields ──────────────────────────
    capabilities: [],        # ["knowledge", "search", "web"]
    latency_ms: 3000,        # average response time
    reliability_score: 0.98  # success rate (0.0 - 1.0)
  ]
end
```

### Capability Graph Module

```elixir
# lib/nexus/capability_graph/capability_graph.ex
defmodule Nexus.CapabilityGraph do
  use GenServer
  require Logger

  @table :nexus_capability_graph

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
    tools = Nexus.ToolRegistry.all_tools()

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
      |> Enum.uniq_by(& &1.full_name)

    # Filter by agent allowlist if present
    case context[:agent] do
      %{tools: %{tool_allowlist: allowlist}} when is_list(allowlist) ->
        Enum.filter(tools, fn tool -> tool.full_name in allowlist end)

      _ ->
        tools
    end
  end
end
```

### Integration with Tool Registry

```elixir
# In ToolRegistry.register/1
def register(%Tool{} = tool) do
  :ets.insert(@table, {tool.full_name, tool})
  # Rebuild capability graph on new tool registration
  Nexus.CapabilityGraph.build_index()
  :ok
end

# In ToolRegistry.list_for_agent/1 — updated to use CapabilityGraph
def list_for_agent(agent_spec) do
  # V1: Use allowlist directly (backward compatible)
  # V2: Use CapabilityGraph.filter for semantic selection
  agent_spec.tools.tool_allowlist
  |> Enum.flat_map(fn name ->
    case resolve(name) do
      {:ok, tool}      -> [tool]
      {:error, _}      -> []
    end
  end)
end
```

---

## 16. BudgetGuard

Centralized multi-layer budget enforcement. Prevents runaway agents across all budget dimensions.

### Budget Types

```elixir
defmodule Nexus.BudgetGuard do
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
# In Nexus.AgentLoop — updated check_limits
defp check_limits(state, start_ms) do
  guard = Nexus.BudgetGuard.from_task(state.task)

  case Nexus.BudgetGuard.check(guard, %{state | start_time: start_ms}) do
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
# lib/nexus/replay_engine/replay_engine.ex
defmodule Nexus.ReplayEngine do
  alias Nexus.{Tasks, Repo}

  @doc """
  Replay modes:
    :exact  — re-emit stored steps. Zero new tokens. 0 credits.
    :live   — re-run all steps fresh. Full credits.
    :fork   — replay 1..N-1 from cache, continue live from N.
  """
  def replay(task_id, opts \\ []) do
    mode       = Keyword.get(opts, :mode, :exact)
    fork_step  = Keyword.get(opts, :fork_from_step, nil)
    overrides  = Keyword.get(opts, :overrides, %{})

    original = Tasks.get_with_trace!(task_id)

    case mode do
      :exact -> replay_exact(original)
      :live  -> dispatch_live(original, overrides)
      :fork  -> dispatch_fork(original, fork_step, overrides)
    end
  end

  # ── Exact: re-broadcast stored steps, zero cost ──────────

  defp replay_exact(task) do
    Enum.each(task.steps, fn step ->
      NexusWeb.Endpoint.broadcast("task:#{task.id}", "step",
        Map.put(Map.from_struct(step), :replay, true)
      )
      Process.sleep(50)  # slight delay for UI rendering
    end)

    NexusWeb.Endpoint.broadcast("task:#{task.id}", "replay_complete", %{
      task_id: task.id, mode: "exact"
    })

    {:ok, :replayed}
  end

  # ── Live: create new task, run fresh ─────────────────────

  defp dispatch_live(original, overrides) do
    new_task = %{
      user_id:          original.user_id,
      agent_id:         original.agent_id,
      goal:             original.goal,
      provider:         Map.get(overrides, :model, original.provider),
      max_iterations:   original.max_iterations,
      max_tool_calls:   original.max_tool_calls,
      max_tokens:       original.max_tokens,
      credit_budget:    original.credit_budget,
      replay_of_task_id: original.id,
      fork_from_step:   nil
    }

    {:ok, task} = Tasks.create(new_task)
    {:ok, _job} = %{task_id: task.id} |> Nexus.Workers.AgentRunner.new() |> Oban.insert()
    {:ok, task}
  end

  # ── Fork: replay 1..N-1 from cache, live from N ──────────

  defp dispatch_fork(original, fork_step, overrides) do
    cached_steps = Enum.take(original.steps, fork_step - 1)

    new_task = %{
      user_id:          original.user_id,
      agent_id:         original.agent_id,
      goal:             original.goal,
      provider:         Map.get(overrides, :model, original.provider),
      max_iterations:   original.max_iterations,
      max_tool_calls:   original.max_tool_calls,
      max_tokens:       original.max_tokens,
      credit_budget:    original.credit_budget,
      replay_of_task_id: original.id,
      fork_from_step:   fork_step,
      cached_steps:     cached_steps,
      overrides:        overrides
    }

    {:ok, task} = Tasks.create(new_task)
    {:ok, _job} = %{task_id: task.id} |> Nexus.Workers.ReplayRunner.new() |> Oban.insert()
    {:ok, task}
  end
end
```

---

## 18. Phoenix Channels

Real-time streaming from Nexus to Nova. Every agent step is broadcast as it completes.

```elixir
# lib/nexus_web/channels/user_socket.ex
defmodule NexusWeb.UserSocket do
  use Phoenix.Socket

  channel "task:*", NexusWeb.TaskChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    # Validate Better Auth session token
    case Nexus.Auth.validate_session_token(token) do
      {:ok, user_id} ->
        {:ok, assign(socket, :user_id, user_id)}

      :error ->
        :error
    end
  end

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"
end
```

```elixir
# lib/nexus_web/channels/task_channel.ex
defmodule NexusWeb.TaskChannel do
  use NexusWeb, :channel
  alias Nexus.Tasks

  @impl true
  def join("task:" <> task_id, _params, socket) do
    # Verify this user owns this task
    case Tasks.get_for_user(task_id, socket.assigns.user_id) do
      {:ok, task} ->
        # Send current state immediately on join
        # (client may have missed steps if reconnecting)
        current_steps = Tasks.get_steps(task_id)
        {:ok, %{task: task, steps: current_steps}, assign(socket, :task_id, task_id)}

      {:error, :not_found} ->
        {:error, %{reason: "task_not_found"}}

      {:error, :unauthorized} ->
        {:error, %{reason: "unauthorized"}}
    end
  end

  # User can cancel a running task
  @impl true
  def handle_in("cancel", _params, socket) do
    case Nexus.AgentLoop.cancel(socket.assigns.task_id) do
      :ok             -> {:reply, :ok, socket}
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
# lib/nexus_web/endpoint.ex
defmodule NexusWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :nexus

  socket "/socket", NexusWeb.UserSocket,
    websocket: [timeout: 45_000],
    longpoll:  false

  # ... rest of endpoint config
end
```

---

## 19. Oban Workers

```elixir
# lib/nexus/workers/agent_runner.ex
defmodule Nexus.Workers.AgentRunner do
  use Oban.Worker,
    queue:        :agents,
    max_attempts: 3,
    unique:       [period: 60]

  @impl true
  def perform(%Oban.Job{args: %{"task_id" => task_id}}) do
    task = Nexus.Tasks.get_with_agent_spec!(task_id)

    # Start GenServer for this task
    case Nexus.AgentLoop.start_link(task) do
      {:ok, _pid} ->
        # GenServer runs the loop, completes async
        # Worker job is done — loop runs independently
        :ok

      {:error, {:already_started, _}} ->
        # Task already running (Oban unique constraint should prevent this)
        :ok

      {:error, reason} ->
        {:error, reason}
    end
  end
end
```

```elixir
# lib/nexus/workers/memory_extractor.ex
defmodule Nexus.Workers.MemoryExtractor do
  use Oban.Worker, queue: :memory, max_attempts: 3

  @impl true
  def perform(%Oban.Job{args: %{"task_id" => task_id, "user_id" => user_id}}) do
    task = Nexus.Tasks.get_with_steps!(task_id)

    if task.agent_spec.memory.vector.enabled do
      # Extract memorable facts from completed task
      facts = extract_facts(task)

      Enum.each(facts, fn fact ->
        case Nexus.ProviderRouter.OpenAI.embed(fact, get_openai_key(user_id)) do
          {:ok, embedding} ->
            Nexus.MemoryEngine.store_vector(fact, embedding,
              user_id:  user_id,
              agent_id: task.agent_id,
              scope:    "user_agent"
            )
          {:error, _} -> :skip
        end
      end)
    end

    # Always record episodic memory
    Nexus.MemoryEngine.record_episode(task)
    :ok
  end

  defp extract_facts(task) do
    # Simple V1: extract the final answer + tool results as facts
    final_step = Enum.find(task.steps, &(&1.type == :final))
    if final_step, do: [final_step.content], else: []
  end

  defp get_openai_key(user_id) do
    case Nexus.Crypto.decrypt_api_key(user_id, "openai") do
      {:ok, key} -> key
      _          -> nil
    end
  end
end
```

```elixir
# lib/nexus/workers/watchdog.ex
defmodule Nexus.Workers.Watchdog do
  use Oban.Worker, queue: :default

  @stale_threshold_ms 35 * 60 * 1000  # 35 min (5 min over max runtime)

  @impl true
  def perform(_job) do
    stale_cutoff = DateTime.add(DateTime.utc_now(), -@stale_threshold_ms, :millisecond)

    stale_tasks = Nexus.Tasks.find_stale(
      status:        :running,
      started_before: stale_cutoff
    )

    Enum.each(stale_tasks, fn task ->
      Nexus.Tasks.transition(task, :timeout, error: "watchdog: stale task")
      NexusWeb.Endpoint.broadcast("task:#{task.id}", "timeout", %{reason: "watchdog"})
    end)

    :ok
  end
end
```

### Oban Config

```elixir
# config/config.exs
config :nexus, Oban,
  repo:   Nexus.Repo,
  queues: [
    default: 10,
    agents:  20,   # main agent runners
    tools:   30,   # tool execution workers (future)
    memory:  5,    # memory extraction
    files:   5     # file indexing
  ],
  plugins: [
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},  # 7 days
    {Oban.Plugins.Cron,
      crontab: [
        {"*/5 * * * *", Nexus.Workers.Watchdog}         # every 5 min
      ]
    }
  ]
```

---

## 20. API Layer

```elixir
# lib/nexus_web/router.ex
defmodule NexusWeb.Router do
  use NexusWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug Nexus.Plugs.Auth           # validates Bearer session token
    plug Nexus.Plugs.RateLimit      # Upstash Redis rate limiting
  end

  pipeline :internal do
    plug :accepts, ["json"]
    plug Nexus.Plugs.InternalAuth   # X-Furma-Internal header
  end

  scope "/api/v1", NexusWeb do
    pipe_through :api

    # Tasks
    post   "/tasks",              TaskController,   :create
    get    "/tasks",              TaskController,   :index
    get    "/tasks/:id",          TaskController,   :show
    delete "/tasks/:id",          TaskController,   :cancel

    # Replay
    post   "/tasks/:id/replay",   ReplayController, :replay
  end

  scope "/internal", NexusWeb do
    pipe_through :internal

    get  "/health", HealthController, :check
  end
end
```

### Task Controller

```elixir
# lib/nexus_web/controllers/task_controller.ex
defmodule NexusWeb.TaskController do
  use NexusWeb, :controller
  alias Nexus.{Tasks, Credits, AgentLoader, ReplayEngine}

  # POST /api/v1/tasks
  def create(conn, params) do
    user_id = conn.assigns.user_id

    with {:ok, agent_spec} <- AgentLoader.load(params["agent_slug"]),
         :ok               <- Credits.reserve(user_id, agent_spec.execution.credit_budget),
         {:ok, task}       <- Tasks.create(%{
           user_id:       user_id,
           agent_id:      agent_spec.id,
           agent_spec:    agent_spec,
           goal:          params["goal"],
           provider:      params["model"] || agent_spec.model.provider,
           credit_budget: params["credit_budget"] || agent_spec.execution.credit_budget,
           max_iterations: agent_spec.execution.max_iterations,
           max_tool_calls: agent_spec.execution.max_tool_calls,
           max_tokens:     agent_spec.execution.max_tokens,
           seed:           params["seed"]
         }),
         {:ok, _job}       <- Nexus.Workers.AgentRunner.new(%{task_id: task.id}) |> Oban.insert() do

      conn
      |> put_status(:created)
      |> json(%{task_id: task.id, status: "PENDING"})
    else
      {:error, :insufficient_credits} ->
        conn |> put_status(402) |> json(%{error: "insufficient_credits"})

      {:error, :agent_not_found} ->
        conn |> put_status(404) |> json(%{error: "agent_not_found"})

      {:error, reason} ->
        conn |> put_status(422) |> json(%{error: inspect(reason)})
    end
  end

  # GET /api/v1/tasks/:id
  def show(conn, %{"id" => task_id}) do
    user_id = conn.assigns.user_id

    case Tasks.get_for_user(task_id, user_id) do
      {:ok, task} ->
        steps = Tasks.get_steps(task_id)
        json(conn, %{task: task, steps: steps})

      {:error, :not_found} ->
        conn |> put_status(404) |> json(%{error: "not_found"})
    end
  end

  # DELETE /api/v1/tasks/:id
  def cancel(conn, %{"id" => task_id}) do
    user_id = conn.assigns.user_id

    with {:ok, task}   <- Tasks.get_for_user(task_id, user_id),
         :ok           <- Nexus.AgentLoop.cancel(task_id) do
      json(conn, %{status: "cancelled"})
    else
      {:error, :not_found} ->
        conn |> put_status(404) |> json(%{error: "not_found"})
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
  agent_id            UUID,
  agent_slug          TEXT,
  agent_spec          JSONB,                 -- snapshot of spec at dispatch time
  goal                TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  provider            TEXT NOT NULL,         -- "openai:gpt-4o-2024-11-20"

  -- Limits (from agent spec, can be overridden at dispatch)
  max_iterations      INTEGER NOT NULL DEFAULT 20,
  max_tool_calls      INTEGER NOT NULL DEFAULT 50,
  max_tokens          INTEGER NOT NULL DEFAULT 200000,
  credit_budget       INTEGER NOT NULL DEFAULT 100,

  -- Runtime counters
  current_iteration   INTEGER NOT NULL DEFAULT 0,
  tool_calls_made     INTEGER NOT NULL DEFAULT 0,
  tokens_used         INTEGER NOT NULL DEFAULT 0,
  credits_reserved    INTEGER NOT NULL DEFAULT 0,
  credits_used        INTEGER NOT NULL DEFAULT 0,

  -- Scheduling
  scheduled_for       TIMESTAMPTZ,
  cron_expression     TEXT,

  -- Replay fields
  execution_hash      TEXT,
  agent_spec_version  TEXT,
  provider_version    TEXT,
  seed                INTEGER,
  replay_of_task_id   UUID REFERENCES tasks(id),
  fork_from_step      INTEGER,

  -- Output
  result              TEXT,
  error_message       TEXT,

  -- Heartbeat (worker health)
  worker_id           TEXT,
  heartbeat_at        TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_tasks_user_id_created  ON tasks(user_id, created_at DESC);
CREATE INDEX idx_tasks_status_running   ON tasks(status)
  WHERE status IN ('PENDING', 'RUNNING', 'CLAIMED');
CREATE INDEX idx_tasks_replay           ON tasks(replay_of_task_id)
  WHERE replay_of_task_id IS NOT NULL;


-- ─── Task Steps ─────────────────────────────────────────────
CREATE TABLE task_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_number   INTEGER NOT NULL,
  type          TEXT NOT NULL,     -- PLAN | ACTION | REFLECTION | FINAL
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | running | streaming | completed | failed | blocked
  content       TEXT,
  metadata      JSONB DEFAULT '{}',

  -- Replay
  prompt_hash   TEXT,
  model         TEXT,
  input_tokens  INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  seed          INTEGER,

  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_steps_task_id ON task_steps(task_id, step_number);


-- ─── Tool Calls ─────────────────────────────────────────────
CREATE TABLE tool_calls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_id       UUID REFERENCES task_steps(id),
  tool_name     TEXT NOT NULL,
  tool_input    JSONB NOT NULL DEFAULT '{}',
  tool_output   JSONB,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed | blocked | timeout
  credits_used  INTEGER DEFAULT 0,

  -- Replay
  tool_version  TEXT,
  output_hash   TEXT,

  error         TEXT,
  retry_count   INTEGER DEFAULT 0,
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_calls_task_id   ON tool_calls(task_id);
CREATE INDEX idx_tool_calls_tool_name ON tool_calls(tool_name);


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
defmodule Nexus.InjectionGuard do
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
    case Nexus.ToolRegistry.validate(tool_name, args) do
      :ok              -> true
      {:error, _}      -> false
    end
  end
end
```

### Auth Plug

```elixir
# lib/nexus_web/plugs/auth.ex
defmodule Nexus.Plugs.Auth do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, user_id}       <- Nexus.Auth.validate_session_token(token) do
      assign(conn, :user_id, user_id)
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
# lib/nexus/credits/credits.ex
defmodule Nexus.Credits do
  import Ecto.Query
  alias Nexus.Repo

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
# lib/nexus/crypto/crypto.ex
defmodule Nexus.Crypto do
  import Ecto.Query
  alias Nexus.Repo

  @aad "nexus-api-key-v1"

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

See §8 Engine 4 (ToolExecutor) for the full `Nexus.MCP.Client` implementation.

The MCP client speaks JSON-RPC 2.0 to any Action's `/api/mcp` endpoint.

External MCP connections (user-connected services like GitHub, Notion) follow the same pattern but use the user's OAuth/PAT credentials fetched from `mcp_connections` table, decrypted inline.

---

## 26. Config & Environment

```elixir
# config/runtime.exs
import Config

# ── Database ──────────────────────────────────────────────
config :nexus, Nexus.Repo,
  url:              System.fetch_env!("DATABASE_URL"),
  pool_size:        10,
  ssl:              true

# ── Web ───────────────────────────────────────────────────
config :nexus, NexusWeb.Endpoint,
  url:       [host: System.fetch_env!("PHX_HOST"), port: 443],
  secret_key_base: System.fetch_env!("SECRET_KEY_BASE"),
  server:    true

# ── Redis ─────────────────────────────────────────────────
config :nexus, :redis_url, System.fetch_env!("REDIS_URL")

# ── Workspace ─────────────────────────────────────────────
config :nexus, :workspace_root, System.get_env("WORKSPACE_ROOT", "/var/nexus/workspaces")

# ── Agents Store ──────────────────────────────────────────
config :nexus, :agents_store_url,    System.fetch_env!("AGENTS_STORE_API_URL")
config :nexus, :agents_store_secret, System.fetch_env!("FURMA_INTERNAL_SECRET")
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
- [ ] `Nexus.Repo` + DB connection to Neon
- [ ] All migrations: `tasks`, `task_steps`, `tool_calls`, `memory_vectors`, `episodic_memory`, `credit_ledger`
- [ ] All DB indexes from §19
- [ ] `GET /internal/health` returns 200 with DB ping
- [ ] `Nexus.Crypto` — encrypt/decrypt (tested)
- [ ] `Nexus.Credits` — reserve/deduct/refund/balance (tested)
- [ ] Logger redactor installed

**Milestone:** Nexus boots, connects to DB, health check passes, crypto works.

---

### Phase 2 — Tool Registry + Security (Day 3)

- [ ] `Nexus.ToolRegistry` — ETS table, start on boot
- [ ] Built-in tools registered: `execute_code`, `web_fetch`, `memory_search`
- [ ] `Nexus.InjectionGuard` — validate allowlist + injection patterns (tested)
- [ ] `Nexus.MCP.Client` — JSON-RPC 2.0 HTTP client
- [ ] `Nexus.ToolExecutor` — full flow: guard → resolve → execute → hash → charge

**Milestone:** Tool calls work end-to-end. Injection blocked. Credits deducted correctly.

---

### Phase 3 — Provider Router (Day 4)

- [ ] `Nexus.ProviderRouter.ModelRegistry` — capability map
- [ ] `Nexus.ProviderRouter.OpenAI` — call + normalize response
- [ ] `Nexus.ProviderRouter.Anthropic`
- [ ] `Nexus.ProviderRouter.Gemini`
- [ ] `Nexus.ProviderRouter` — dispatch + BYOK key inline
- [ ] `OpenAI.embed/2` for vector memory
- [ ] Tests: all providers return normalized `%{type: :tool_call}` or `%{type: :text}`

**Milestone:** Can call GPT-4o, Claude, Gemini with BYOK key. Normalized response shape.

---

### Phase 4 — Agent Loop (Day 5–6)

- [ ] `Nexus.AgentLoop.State` struct
- [ ] `Nexus.AgentLoop.Heuristics` (tested)
- [ ] `Nexus.ContextBuilder` + `PromptBuilder` (Solid/Liquid)
- [ ] `Nexus.AgentLoop` GenServer — full PLAN→ACT→REFLECT→PERSIST loop
- [ ] Hard limits enforced: all 5
- [ ] Task state machine: `Tasks.transition/2`
- [ ] `Nexus.Workers.AgentRunner` Oban worker
- [ ] Phoenix Channel: `UserSocket` + `TaskChannel`
- [ ] `NexusWeb.TaskController` — create + show + cancel
- [ ] `POST /api/v1/tasks` end-to-end test

**Milestone:** Agent task dispatched from `curl`, runs loop, broadcasts steps via WebSocket, completes.

---

### Phase 5 — Memory + File Processor (Day 7–8)

- [ ] `Nexus.MemoryEngine` facade
- [ ] `VectorMemory` — pgvector search + insert
- [ ] `ShortTerm` — Redis checkpoint/restore
- [ ] `Episodic` — task outcome records
- [ ] `Nexus.Workers.MemoryExtractor` Oban worker
- [ ] `Nexus.FileProcessor` — parse → chunk → embed → store
- [ ] `Nexus.Workers.FileIndexer` Oban worker
- [ ] ContextBuilder reads vector memories on each iteration

**Milestone:** Agent accumulates memories across runs. Files indexed and retrieved in context.

---

### Phase 6 — Replay Engine (Day 9)

- [ ] `Nexus.ReplayEngine` — exact, live, fork modes
- [ ] `Nexus.Workers.ReplayRunner` Oban worker
- [ ] `NexusWeb.ReplayController` — `POST /api/v1/tasks/:id/replay`
- [ ] Exact replay: re-broadcasts stored steps, 0 credits
- [ ] Fork replay: dispatches new task with `replay_of_task_id` + `fork_from_step`
- [ ] Execution hash computed and stored on task completion

**Milestone:** Any completed task can be replayed exactly for free. Fork creates new task from step N.

---

### Phase 7 — Workspace + Codex Client (Day 10)

- [ ] `Nexus.Workspace` — create, remove, path validation (from Symphony)
- [ ] `Nexus.CodexClient` — JSON-RPC over stdio (from Symphony)
- [ ] `AgentLoop` — `classify_provider` + `run_local_agent` branch
- [ ] Test: dispatch task with `provider: "claude-code"`, verify session starts
- [ ] `Nexus.Workers.Watchdog` Oban worker (stale task cleanup)

**Milestone:** Codex and Claude Code sessions manageable by Nexus as regular tasks.

---

### Phase 8 — Hardening (Day 11–12)

- [ ] `Nexus.AgentLoader` — load + cache agent specs from Agents Store API (ETS, 5min TTL)
- [ ] `Nexus.Auth.validate_session_token/1` — JWT validation via Better Auth
- [ ] `Nexus.Plugs.Auth` + `Nexus.Plugs.InternalAuth` + `Nexus.Plugs.RateLimit`
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
