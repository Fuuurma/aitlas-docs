# Nexus Development Notes

> ⚠️ **Proprietary** — All Aitlas products are closed source. No open source license.

---

## Core Architecture (v6)

### Products
- **Nova** - Next.js 16 - aitlas.nova
- **Nexus** - Elixir/OTP - aitlas.nexus
- **Agents Store** - Next.js + Elixir - aitlas.agents
- **Actions** - f.xyz MCP - aitlas.actions

### Core Bets
- BYOK always (Furma never pays for tokens)
- Elixir/OTP for agent loops
- Clone + extend (T3 Code, Symphony, Mission Control)
- MCP standard
- Deterministic replay (core moat)

### 8 Engines
`
Provider Router → Context Builder → Agent Loop → Tool Executor
     ↑                                              ↓
Tool Registry ← Memory Engine ← File Processor ← Observability
                    + Replay Engine
`

### Hard Limits
| Limit | Default |
|-------|---------|
| max_iterations | 20 |
| max_tool_calls | 50 |
| max_tokens | 200k |
| max_context_tokens | 60k |
| credit_budget | User-set |
| max_runtime_ms | 30 min |

### Memory Types
- **Active** - GenServer state (hot)
- **Short-term** - Redis
- **Vector** - pgvector HNSW
- **Episodic** - Postgres

### OSS Components
| Project | Use |
|---------|-----|
| Oban | Job queue |
| Trigger.dev | DX inspiration |
| Jido | Agent patterns |
| DeerFlow | Multi-agent flows |
| pi-mono | Tool orchestration |

---

## Slogan
*Build fast. Stay sovereign. Zero token liability.*

## Nexus Mantra
*Every agent run is a commit. Nexus is the git.*
