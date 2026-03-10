# Aitlas Product Roadmap

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

**Version:** 1.0 | **Updated:** March 2026

---

## The Four Products

| Product | Description | Status |
|---------|-------------|--------|
| **Nova** | Web UI (chat, dashboard, tasks) | 🟡 Development |
| **Nexus** | Agent orchestration runtime (Elixir) | 🟡 Development |
| **Agents Store** | Marketplace of pre-configured agents | 🔴 Planned |
| **Actions (f.xyz)** | MCP tools and utilities | 🟡 Development |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, Bun, shadcn/ui |
| **Backend** | Elixir, Phoenix, Oban |
| **Database** | Neon Postgres, Drizzle ORM |
| **Auth** | Better Auth |
| **Protocol** | MCP (Model Context Protocol) |

---

## Templates

| Template | Purpose |
|----------|---------|
| `aitlas-frontend-template` | Next.js 16 UI apps |
| `aitlas-backend-template` | Elixir/Phoenix backends |

---

## Current Priorities

### Phase 1: Foundation (Complete)

- [x] Project structure defined
- [x] Tech stack finalized (Elixir + Next.js 16)
- [x] Templates created

### Phase 2: Core Development (In Progress)

| Priority | Item | Status |
|----------|------|--------|
| 1 | Nova UI - Chat interface | 🟡 Dev |
| 2 | Nexus runtime - Agent loop | 🟡 Dev |
| 3 | Actions - Core tools (f.twyt, f.library, f.rsrx) | 🟡 Dev |
| 4 | MCP protocol integration | 🟡 Dev |

### Phase 3: Ecosystem (Planned)

| Priority | Item | Status |
|----------|------|--------|
| 5 | Agents Store | 🔴 Planned |
| 6 | Additional Actions | 🔴 Planned |
| 7 | Agent replay/deterministic execution | 🔴 Planned |

---

## Key Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| Nova beta | Q2 2026 | 🟡 On track |
| Nexus runtime functional | Q2 2026 | 🟡 On track |
| Actions (3+ core) | Q2 2026 | 🟡 On track |
| Public beta | Q3 2026 | 🔴 Planned |

---

## Competition

| Competitor | What They Do | Our Advantage |
|------------|--------------|---------------|
| Dify | No-code AI workflows | BYOK, open source |
| Coze | Bot platform | Self-hostable |
| Cursor | AI code editor | Broader agent ecosystem |

**Our moat:** Full stack (UI + Runtime + Tools) + BYOK + Deterministic replay

---

**Maintained by:** Furma.tech
