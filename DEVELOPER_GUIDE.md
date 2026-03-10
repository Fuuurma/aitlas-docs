# Developer Guide

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

**Version:** 1.0 | **Updated:** March 2026

---

## Overview

This guide covers developing with Aitlas templates. Detailed documentation lives in each template repository.

---

## The Two Templates

| Template | Purpose | Tech Stack | Repo |
|----------|---------|------------|------|
| **Frontend** | Web UI apps | Next.js 16, Bun, Drizzle, Better Auth | [aitlas-frontend-template](https://github.com/Fuuurma/aitlas-frontend-template) |
| **Backend** | API services | Elixir, Phoenix, Oban, PostgreSQL | [aitlas-backend-template](https://github.com/Fuuurma/aitlas-backend-template) |

---

## Quick Start

### Frontend Template

```bash
# Clone
git clone https://github.com/Fuuurma/aitlas-frontend-template.git my-app
cd my-app

# Setup
bun install
cp .env.example .env.local
# Edit .env.local with your config

# Database
bun run db:push  # Drizzle: push schema

# Run
bun run dev
```

### Backend Template

```bash
# Clone
git clone https://github.com/Fuuurma/aitlas-backend-template.git my-api
cd my-api

# Setup
mix deps.get
cp .env.example .env.local
# Edit .env.local with your config

# Database
mix ecto.setup

# Run
mix phx.server
```

---

## Project Structure

### Frontend (`aitlas-frontend-template`)

```
my-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Protected pages
│   └── api/               # API routes
├── components/            # React components (shadcn/ui)
├── lib/                   # Utilities (auth, db, utils)
├── db/                    # Drizzle schema & migrations
└── ...
```

### Backend (`aitlas-backend-template`)

```
my-api/
├── lib/
│   ├── my_api/           # Business logic
│   │   ├── agents/       # Agent modules
│   │   ├── actions/     # Action modules
│   │   └── ...
│   └── my_api_web/      # Phoenix endpoints
├── priv/
│   └── repo/            # Ecto migrations
└── ...
```

---

## Core Concepts

### BYOK (Bring Your Own Key)

Users provide their own API keys. Keys are encrypted with AES-256-GCM and never logged.

### MCP (Model Context Protocol)

Tools communicate via MCP. Both frontend and backend expose MCP endpoints.

### Credit System

Actions burn credits. See `credit-system.md` in architecture folder.

---

## Common Tasks

### Adding a New Action (Frontend)

1. Create tool in `lib/actions/`
2. Add MCP tool definition
3. Register in Tool Registry

### Adding a New Agent (Backend)

1. Define agent in `lib/agents/`
2. Add system prompt
3. Register skills and tools

### Database Changes

**Frontend (Drizzle):**
```bash
# Edit db/schema.ts
bun run db:push
```

**Backend (Ecto):**
```bash
# Create migration
mix ecto.gen.migration add_users_table

# Run migration
mix ecto.migrate
```

---

## Testing

```bash
# Frontend
bun run test

# Backend
mix test
```

---

## Getting Help

- Architecture docs: `/architecture/`
- Product specs: `/products/`
- Template docs: See respective repos

---

**Maintained by:** Furma.tech
