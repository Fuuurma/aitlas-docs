# Developer Guide

**Everything developers need to build on Aitlas.**

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Template System](#2-template-system)
3. [Building Features](#3-building-features)
4. [API Reference](#4-api-reference)
5. [Migration Guides](#5-migration-guides)

---

## 1. Getting Started

### Prerequisites

- Node.js 20+
- pnpm (package manager)
- Git
- API keys (OpenAI, Anthropic, etc. for BYOK)

### Quick Start

```bash
# Clone a template
git clone --recurse-submodules https://github.com/Fuuurma/aitlas-ui-template.git my-project

# Install dependencies
cd my-project
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your keys

# Start development
pnpm dev
```

### Project Structure

```
my-project/
├── aitlas-docs/          # Documentation (submodule)
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── styles/           # CSS/Tailwind
├── prisma/               # Database schema
├── public/               # Static assets
└── package.json
```

---

## 2. Template System

### Available Templates

| Template | Purpose | Stack |
|----------|---------|-------|
| **aitlas-ui-template** | Web applications | Next.js 16, React, shadcn |
| **aitlas-action-template** | MCP tools | Hono, TypeScript |
| **aitlas-worker-template** | Background jobs | Bun, Postgres |
| **aitlas-cli** | Command-line tools | Node.js, Commander |

### Using Templates

```bash
# Clone with submodules (IMPORTANT)
git clone --recurse-submodules https://github.com/Fuuurma/aitlas-ui-template.git

# If you forgot --recurse-submodules
git clone https://github.com/Fuuurma/aitlas-ui-template.git
cd aitlas-ui-template
git submodule init
git submodule update
```

### Updating Docs

```bash
# Update docs from aitlas-docs
cd my-project
git submodule update --remote aitlas-docs
git add aitlas-docs
git commit -m "docs: update from aitlas-docs"
git push
```

---

## 3. Building Features

### Adding a New Page

```typescript
// src/app/my-page/page.tsx
import { DashboardLayout } from '@/components/layout';

export default function MyPage() {
  return (
    <DashboardLayout>
      <h1>My Page</h1>
    </DashboardLayout>
  );
}
```

### Adding a New API Route

```typescript
// src/app/api/my-route/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Your logic here
  return NextResponse.json({ data: 'success' });
}
```

### Adding a New Action

```typescript
// actions/my-action.ts
export const myAction = {
  name: 'my_action',
  description: 'Does something useful',
  input: {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'Parameter description' }
    },
    required: ['param']
  },
  execute: async ({ param }: { param: string }) => {
    // Your logic here
    return { result: `Processed: ${param}` };
  }
};
```

### Best Practices

**1. Use the CLI**
```bash
# Always use aitlas CLI for new projects
aitlas new action my-action
aitlas new agent my-agent
```

**2. Follow naming conventions**
- Actions: `f.{name}`
- Agents: `f.{role}`
- Components: PascalCase
- Files: kebab-case

**3. Keep it simple**
- Don't over-engineer
- Start with the minimum viable feature
- Add complexity only when needed

---

## 4. API Reference

### Authentication

All API routes use Better Auth:

```typescript
import { auth } from '@/lib/auth';

const session = await auth();
const userId = session?.user?.id;
```

### REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET/POST | Task management |
| `/api/memory` | GET/POST | Memory CRUD |
| `/api/actions` | GET/POST | Action registry |
| `/api/agents` | GET/POST | Agent configs |

### MCP Tools

Tools are registered via MCP:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'f.my-tool',
  version: '1.0.0',
  tools: [myAction]
});
```

---

## 5. Migration Guides

### NextAuth → Better Auth

**Before (NextAuth):**
```typescript
import { getServerSession } from 'next-auth';
const session = await getServerSession(authOptions);
```

**After (Better Auth):**
```typescript
import { auth } from '@/lib/auth';
const session = await auth();
```

**Database adapter:**
```typescript
// Before
import { PrismaAdapter } from '@auth/prisma-adapter';

// After
import { prismaAdapter } from 'better-auth/adapters/prisma';
database: prismaAdapter(prisma, { provider: 'postgresql' })
```

### Common Pitfalls

1. **Forgetting submodules** - Always use `--recurse-submodules`
2. **Wrong Next.js version** - Must use Next.js 16, not 15
3. **Manual file copying** - Use `aitlas new` CLI instead
4. **Missing env vars** - Check `.env.example` for required vars

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection
- `BETTER_AUTH_SECRET` - Auth encryption key
- `ENCRYPTION_KEY` - API key encryption

Optional:
- `OPENAI_API_KEY` - For AI features
- `ANTHROPIC_API_KEY` - For AI features

---

## Troubleshooting

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Database Issues

```bash
# Reset database
pnpm prisma migrate reset

# Generate client
pnpm prisma generate
```

### Submodule Issues

```bash
# Reinitialize submodules
git submodule deinit -f --all
git submodule init
git submodule update
```

---

**Last Updated:** 2026-03-08