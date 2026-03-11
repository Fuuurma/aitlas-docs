> ⚠️ **DEPRECATED** — See [nexus-technical-doc.md](./nexus-technical-doc.md) (canonical)

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

# NEXUS — Database Architecture (Deprecated)

**See:** [nexus-technical-doc.md](./nexus-technical-doc.md) (canonical)

Version: v1
Database: PostgreSQL

---

# 1. Core Principles

The schema follows several design principles.

### 1. Append-only execution logs

Agent runs are **never mutated**, only appended.

This guarantees:

* reproducibility
* auditability
* replay capability

---

### 2. Separation of hot and cold data

Hot tables:

```
agent_runs
agent_steps
tool_calls
```

Cold / archive tables:

```
run_events_archive
old_steps
```

Prevents massive tables from slowing the runtime.

---

### 3. Deterministic replay support

Every run stores hashes:

```
execution_hash
prompt_hash
output_hash
provider_version
seed
```

These guarantee reproducibility.

---

# 2. Multi-Tenant Layer

All runtime entities belong to a tenant.

### tenants

```sql
tenants
-------
id (uuid)
name
plan
credit_balance
created_at
```

Indexes:

```
PRIMARY KEY(id)
```

---

### users

```sql
users
-----
id (uuid)
tenant_id (uuid)
email
role
created_at
```

Indexes:

```
tenant_id
email unique
```

---

# 3. Agents

Agents define runtime configuration.

### agents

```sql
agents
------
id (uuid)
tenant_id
name
description
system_prompt
model_provider
model_name

max_iterations
max_tool_calls
max_tokens
max_context_tokens
max_runtime_ms

tool_allowlist jsonb

created_at
updated_at
```

Indexes:

```
tenant_id
```

---

# 4. Agent Runs

Each execution instance.

### agent_runs

```sql
agent_runs
----------
id (uuid)
agent_id
tenant_id
user_id

status
started_at
completed_at

total_tokens
total_cost
total_steps

execution_hash
provider_version
seed
```

Indexes:

```
agent_id
tenant_id
status
started_at desc
```

Partitioning recommended by **month**.

---

# 5. Agent Steps

Each reasoning iteration.

### agent_steps

```sql
agent_steps
-----------
id (uuid)
run_id
step_number

prompt_hash
output_hash

model_name
input_tokens
output_tokens
latency_ms

created_at
```

Indexes:

```
run_id
run_id + step_number
```

---

# 6. Tool Calls

Every tool execution is recorded.

### tool_calls

```sql
tool_calls
----------
id (uuid)
run_id
step_id

tool_name
arguments jsonb
result jsonb

duration_ms
success boolean

created_at
```

Indexes:

```
run_id
tool_name
```

---

# 7. Memory System

Nexus memory has two layers:

* vector memory
* structured memory

---

# 8. Memory Entries

### memory_entries

```sql
memory_entries
--------------
id (uuid)
tenant_id
agent_id

type
content
metadata jsonb

created_at
updated_at
```

Indexes:

```
tenant_id
agent_id
```

---

# 9. Memory Vectors

Stores embeddings.

### memory_vectors

```sql
memory_vectors
--------------
id (uuid)
memory_id
embedding vector(1536)

created_at
```

Index:

```
HNSW(embedding)
```

Vector indexing is implemented via pgvector.

This enables semantic retrieval.

---

# 10. Filesystem

Agents can access files.

### files

```sql
files
-----
id (uuid)
tenant_id
owner_id

path
name
mime_type
size

storage_url

created_at
updated_at
```

Indexes:

```
tenant_id
path
```

---

# 11. File Chunks

Large files are chunked for retrieval.

### file_chunks

```sql
file_chunks
-----------
id (uuid)
file_id

chunk_index
content
embedding vector(1536)

created_at
```

Indexes:

```
file_id
HNSW(embedding)
```

This enables **RAG over files**.

---

# 12. Tools

Registry of tools available to Nexus.

### tools

```sql
tools
-----
id (uuid)
name
category
description

input_schema jsonb
output_schema jsonb

permission_scope
runtime

created_at
```

Indexes:

```
name unique
category
```

---

# 13. Tool Permissions

Which agents can use which tools.

### agent_tools

```sql
agent_tools
-----------
agent_id
tool_id
permission_level
```

Indexes:

```
agent_id
tool_id
```

---

# 14. Observability Events

Every action generates telemetry.

### run_events

```sql
run_events
----------
id (uuid)
run_id

event_type
payload jsonb

created_at
```

Indexes:

```
run_id
event_type
created_at
```

Events include:

```
agent.started
agent.step.completed
tool.executed
memory.retrieved
run.completed
```

---

# 15. Provider Keys (BYOK)

Users store their model provider keys.

Example providers:

* OpenAI
* Anthropic
* Google

### provider_keys

```sql
provider_keys
-------------
id (uuid)
tenant_id
provider_name

encrypted_key
created_at
```

Indexes:

```
tenant_id
provider_name
```

Keys must be encrypted at rest.

---

# 16. Replay Records

Replay metadata.

### replay_records

```sql
replay_records
--------------
id (uuid)
run_id

execution_hash
prompt_hash
output_hash

provider_version
seed

created_at
```

Indexes:

```
execution_hash
run_id
```

---

# 17. Credits and Billing

Nexus charges execution credits.

### credit_transactions

```sql
credit_transactions
-------------------
id (uuid)
tenant_id

amount
type
reference_id

created_at
```

Types:

```
agent_run
subscription
manual_adjustment
```

Indexes:

```
tenant_id
created_at
```

---

# 18. Index Strategy

Critical indexes:

```
agent_runs(agent_id)
agent_runs(status)
agent_steps(run_id)
tool_calls(run_id)

memory_vectors HNSW
file_chunks HNSW
```

These guarantee fast runtime queries.

---

# 19. Partition Strategy

Large tables must be partitioned.

Recommended partitions:

```
agent_runs by month
agent_steps by month
run_events by month
```

Benefits:

```
faster queries
easier archival
better index performance
```

---

# 20. Worker Interaction

Workers interact with the database in this pattern.

### Agent Runner

```
fetch run
create step
store step
```

### Tool Executor

```
store tool_call
store result
emit event
```

### Memory Worker

```
store memory
generate embedding
update vector index
```

---

# 21. Data Growth Expectations

Typical scaling assumptions:

```
1 agent run
≈ 5–20 steps
≈ 2–10 tool calls
```

If platform runs:

```
100k runs/day
```

Expected rows:

```
agent_steps → ~1.5M/day
tool_calls → ~500k/day
```

Partitioning becomes essential.

---

# 22. Archival Strategy

Old data can move to archive tables.

Example policy:

```
runs older than 90 days
```

Move to:

```
agent_runs_archive
agent_steps_archive
```

This keeps hot tables small.

---

# 23. Observability Pipeline

Telemetry from run_events feeds:

```
analytics
monitoring dashboards
debugging tools
billing
```

Possible streaming integration:

```
Kafka
ClickHouse
```

But Postgres alone is sufficient initially.

---

# 24. Full Database Map

Complete Nexus data layer:

```
tenants
users

agents
agent_tools

agent_runs
agent_steps
tool_calls

memory_entries
memory_vectors

files
file_chunks

tools

provider_keys

run_events
replay_records

credit_transactions
```

---

# 25. The Strategic Advantage

The most valuable asset Nexus creates over time is **execution data**.

Because every run records:

```
prompt
reasoning steps
tool usage
results
cost
```

This dataset enables:

```
agent improvement
model evaluation
training datasets
debugging tools
```

This is the **data moat** of the system.

---

✅ At this point Nexus now has **complete architecture defined**:

1. Runtime architecture
2. Agent execution loop
3. Context planning
4. Tool system
5. Memory system
6. Filesystem system
7. Provider abstraction
8. Deterministic replay
9. Observability
10. Full database schema

---

