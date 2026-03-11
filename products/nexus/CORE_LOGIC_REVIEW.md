# Nexus Core Logic Review

**Date:** 2026-03-11
**Reviewer:** Atlas
**Status:** 🔴 Critical Issues Found

---

## Task Flow Overview

```
POST /api/v1/tasks
  ↓
TaskController.create/2
  → validate_create_params/1
  → AgentLoader.resolve(agent_slug) → agent_spec
  → Tasks.create/1
  → Credits.reserve/3
  → dispatch_task/1
  ↓
AgentLoop.start_link + run
  ↓
[LOOP] plan_phase → act_phase → reflect_phase → persist_phase
  ↓
plan_phase:
  → ContextBuilder.build/1 → messages
  → ProviderRouter.call/2 → LLM response
  ↓
act_phase:
  → ToolExecutor.execute/3 → tool results
  ↓
persist_phase:
  → Tasks.update_progress/2
  → TaskChannel.broadcast_step/2
```

---

## 🔴 CRITICAL ISSUES

### 1. LLM Token Costs Not Charged

**Location:** `AgentLoop.plan_phase/1`

**Problem:** After a successful LLM call, tokens are tracked but credits are never charged:

```elixir
{:ok, response} ->
  # Records tokens but NEVER charges credits for them!
  %{state |
    tokens_used: state.tokens_used + response.usage.input_tokens + response.usage.output_tokens
  }
```

**Impact:** Users get free LLM calls. Only tool calls charge credits.

**Fix:**
```elixir
# In plan_phase, after successful LLM call:
tokens_used = response.usage.input_tokens + response.usage.output_tokens
credit_cost = calculate_token_cost(tokens_used, state.model)
Credits.deduct(state.user_id, credit_cost, task_id: state.task_id, reason: "llm_tokens")

%{state |
  tokens_used: state.tokens_used + tokens_used,
  credits_used: state.credits_used + credit_cost
}
```

---

### 2. Reserved Credits Never Used

**Location:** `TaskController.create/2` + `Credits.reserve/3`

**Problem:** Credits are reserved before task starts:
```elixir
Credits.reserve(user_id, budget, task.id)
```

But:
1. Tools charge NEW credits (not from reservation)
2. Reservation is never refunded
3. User's balance goes negative

**Flow Today:**
```
1. Reserve 500 credits → balance: 500 → 0 (just a pre-check)
2. Tool call charges 50 → balance: 450 → 400 (new deduction)
3. Task ends with 450 reserved credits still "held"
```

**Expected Flow:**
```
1. Reserve 500 credits → mark as "held"
2. Tool call uses 50 from reservation → 450 remaining
3. Task ends → refund 450 unused credits
```

**Fix:** Either:
- **Option A:** Deduct from reservation, not balance
- **Option B:** Remove reservation entirely (just pre-check balance)

---

## 🟠 HIGH ISSUES

### 3. Provider Field Unused

**Location:** `Task` schema, `TaskController`, `AgentLoop`

**Problem:** Task has both `provider` and `model` fields:
```elixir
schema "tasks" do
  field :provider, :string  # NEVER USED
  field :model, :string     # Used by ProviderRouter
end
```

`ProviderRouter.call/2` only uses `model`:
```elixir
ProviderRouter.call(messages, model: state.model, ...)
```

**Impact:** Confusion, dead code

**Fix:** Remove `provider` field OR use it for validation before LLM call

---

### 4. No Pre-Check for Credit Balance

**Location:** `AgentLoop.plan_phase/1`

**Problem:** Before making an LLM call, there's no check if user has enough credits.

**Current:**
```elixir
# Just makes the call, charges after
case ProviderRouter.call(messages, ...) do
  {:ok, response} -> # charge tokens
  {:error, _} -> # no charge
end
```

**Risk:** If user has 100 credits and call costs 200, they go negative.

**Fix:**
```elixir
# Before LLM call:
estimated_cost = estimate_llm_cost(messages, state.model)
if state.credits_used + estimated_cost > state.credit_budget do
  %{state | status: :failed, error: "Credit budget exceeded"}
else
  # proceed with call
end
```

---

### 5. API Key Error Not User-Friendly

**Location:** `AgentLoop.plan_phase/1` → `ProviderRouter.call/2`

**Problem:** If user has no API key stored:
```elixir
{:error, {:no_api_key, provider}}
```

This becomes:
```elixir
%{state | status: :failed, error: "LLM call failed: {:no_api_key, :openai}"}
```

User sees: "LLM call failed" - doesn't know they need to add API key.

**Fix:**
```elixir
{:error, {:no_api_key, provider}} ->
  %{state | 
    status: :failed, 
    error: "No API key configured for #{provider}. Please add your #{provider} API key in settings."
  }
```

---

## 🟡 MEDIUM ISSUES

### 6. Token Estimation Missing

**Location:** `ContextBuilder.truncate_messages/2`

**Problem:** Token estimation is rough (4 chars per token). No pre-call estimation.

**Impact:** Could fail at API level if context too large.

---

### 7. Agent Spec Stale

**Location:** `TaskController.create_task/2`

**Problem:** Agent spec is resolved once and stored. If agent definition changes, old tasks have stale specs.

**Impact:** Minor - historical accuracy vs. current definition.

---

## ✅ WHAT WORKS WELL

### BYOK Key Security
- Keys encrypted with AES-256-GCM
- Never logged or assigned to variables
- Fetched inline and passed directly to provider
- Hints stored for UI display ("sk-...abc")

### Tool Execution
- Schema validation
- Injection guard
- Dangerous tool protection
- Output hashing for replay
- Proper credit charging

### Budget Guard
- Multi-layer limits (credits, tokens, tool_calls, runtime, depth)
- Checked every iteration
- Graceful failure messages

### Agent Loader
- ETS cache with 5-min TTL
- Fallback to built-in agents
- Proper API integration with Agents Store

---

## RECOMMENDED FIXES

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | LLM token charging | 2h | Critical - Revenue leak |
| 🔴 P0 | Reservation flow | 3h | Critical - Balance integrity |
| 🟠 P1 | Provider field cleanup | 1h | High - Code clarity |
| 🟠 P1 | Credit pre-check | 1h | High - Prevent negative balance |
| 🟠 P1 | API key error message | 30m | High - User experience |
| 🟡 P2 | Token estimation | 2h | Medium - Reliability |

**Total Effort:** ~9.5 hours

---

## NEXT STEPS

1. Fix LLM token charging (P0)
2. Fix reservation flow (P0)
3. Add credit pre-check (P1)
4. Improve error messages (P1)
5. Remove unused provider field (P1)

---

*Review complete. Awaiting approval to implement fixes.*