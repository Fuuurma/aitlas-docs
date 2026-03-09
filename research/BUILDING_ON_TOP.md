# Building on Top of UI Template

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
This guide explains how to build your own Aitlas UI project using this template.

## Quick Start

```bash
# Create new project
aitlas new ui my-project
cd my-project

# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run dev server
bun dev
```

## Project Structure

```
my-project/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities
│   ├── auth.ts           # Better Auth config
│   ├── db.ts             # Prisma client
│   └── credit-middleware.ts
├── prisma/               # Database schema
├── __tests__/            # Test files
└── docs/                 # Documentation
```

## Core Features

### 1. Authentication (Better Auth)

Already configured with:
- Email/password login
- Session management
- Protected routes

**Add OAuth providers:**
```typescript
// lib/auth.ts
export const auth = betterAuth({
  // ... existing config
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

### 2. Database (Prisma)

Schema already includes:
- User model
- Session model
- Credit ledger

**Add your models:**
```prisma
// prisma/schema.prisma
model Project {
  id        String   @id @default(cuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

**Run migration:**
```bash
bun run db:migrate
```

### 3. Credit System

Automatically tracks credit usage:

```typescript
// Deduct credits for an action
import { deductCredits } from '@/lib/credit-middleware';

await deductCredits({
  userId: 'user_123',
  amount: 10,
  reason: 'api_call',
  referenceId: 'call_456',
});
```

### 4. Rate Limiting

Protects API routes:

```typescript
// app/api/my-route/route.ts
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const { success } = await rateLimit({
    type: 'api',
    identifier: 'user_123',
  });
  
  if (!success) {
    return Response.json({ error: 'Rate limited' }, { status: 429 });
  }
  
  // ... handle request
}
```

### 5. Testing

Run all tests:
```bash
bun test
```

**Write tests for your features:**
```typescript
// __tests__/my-feature.test.ts
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work correctly', () => {
    const result = myFunction();
    expect(result).toBe(true);
  });
});
```

## Adding Pages

### Protected Page

```typescript
// app/my-page/page.tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function MyPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Protected content</div>;
}
```

### API Route

```typescript
// app/api/my-api/route.ts
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return Response.json({ data: 'success' });
}
```

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Required:
- `DATABASE_URL` - Neon PostgreSQL
- `BETTER_AUTH_SECRET` - Shared across all services
- `ENCRYPTION_KEY` - For BYOK API keys

## Testing Checklist

Before deploying:
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes
- [ ] `bun run build` succeeds
- [ ] Auth flows work (signup, login, logout)
- [ ] Database migrations run
- [ ] Health endpoint returns 200

## Next Steps

1. Customize the landing page
2. Add your features
3. Set up CI/CD (GitHub Actions included)
4. Deploy to production

## Support

- See `AGENTS.md` for AI coding guidelines
- Check `docs/architecture/` for deep dives