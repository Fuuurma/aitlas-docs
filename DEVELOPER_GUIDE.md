# Developer Guide

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

**Complete guide for developing with the Furma Core Template.**

---

## Part 1: Setup

### Prerequisites

- Bun 1.0+
- Node.js 18+
- PostgreSQL database (Neon, Supabase, or local)
- Git

### Step 1: Clone the Template

```bash
git clone git@github.com:Fuuurma/furma-core-template.git my-product
cd my-product
rm -rf .git
git init
```

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Configure Environment

```bash
cp .env.example .env.local
bun run setup
```

The setup script will:
- Create `.env.local` from `.env.example`
- Generate a BYOK encryption key
- Generate a NextAuth secret

### Step 4: Configure Environment Variables

Edit `.env.local` with your values:

```env
# Database (required)
DATABASE_URL="postgresql://..."

# OAuth (at least one required)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Upstash Redis (optional, for rate limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Stripe (optional, for payments)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_CREDITS=""
```

### Step 5: Set Up Database

```bash
bun run db:generate
bun run db:migrate
```

### Step 6: Start Development Server

```bash
bun run dev
```

Visit http://localhost:3000 to see your application.

---

## Part 2: Project Structure

```
furma-core-template/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Auth components
│   └── layout/            # Layout components
├── lib/                   # Core libraries
│   ├── api-handler.ts     # Standard API wrapper
│   ├── auth.ts            # NextAuth config
│   ├── errors/            # Error classes
│   ├── schemas/           # Zod validation schemas
│   └── ...
├── prisma/               # Database schema
└── docs/                 # Documentation
```

---

## Part 3: Creating a New Feature

### 1. Create the Database Schema

Add models to `prisma/schema.prisma`:

```prisma
model YourModel {
  id        String   @id @default(cuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

Run migration:
```bash
bun run db:migrate
```

### 2. Create Validation Schemas

Add schemas to `lib/schemas/`:

```typescript
// lib/schemas/your-model.ts
import { z } from 'zod';

export const yourModelSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  userId: z.string(),
});

export const yourModelCreateSchema = z.object({
  name: z.string().min(1),
});
```

### 3. Create API Routes

Use the standard API handler:

```typescript
// app/api/your-model/route.ts
import { apiHandler, createSuccessResponse } from '@/lib/api-handler';
import { yourModelCreateSchema } from '@/lib/schemas/your-model';

export const GET = apiHandler(
  { requireAuth: true },
  async (request, { session }) => {
    const models = await prisma.yourModel.findMany({
      where: { userId: session.user.id },
    });
    return createSuccessResponse(models);
  }
);

export const POST = apiHandler(
  { requireAuth: true, validate: yourModelCreateSchema },
  async (request, { session, validatedBody }) => {
    const model = await prisma.yourModel.create({
      data: {
        ...validatedBody,
        userId: session.user.id,
      },
    });
    return createSuccessResponse(model);
  }
);
```

### 4. Create UI Components

Use existing components from `components/ui/`:

```typescript
// components/your-feature.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function YourFeature() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

### 5. Create Pages

```typescript
// app/(dashboard)/your-feature/page.tsx
import { YourFeature } from '@/components/your-feature';

export default function YourFeaturePage() {
  return (
    <div>
      <h1>Your Feature</h1>
      <YourFeature />
    </div>
  );
}
```

---

## Part 4: API Routes Guide

### Standard API Handler

All API routes should use the `apiHandler` wrapper from `lib/api-handler.ts`.

### Basic Usage

```typescript
import { apiHandler, createSuccessResponse } from '@/lib/api-handler';

export const GET = apiHandler(
  { requireAuth: true },
  async (request, { session }) => {
    const data = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    return createSuccessResponse(data);
  }
);
```

### Options

#### `requireAuth`
Require authentication for the route:

```typescript
{ requireAuth: true }
```

#### `validate`
Validate request body, query, or params:

```typescript
// Validate body only
{ validate: mySchema }

// Validate body, query, and params
{ validate: { 
  body: bodySchema, 
  query: querySchema, 
  params: paramsSchema 
}}
```

#### `rateLimit`
Enable rate limiting:

```typescript
{ rateLimit: true }           // Default 'api' limiter
{ rateLimitType: 'search' }   // Use 'search' limiter
{ rateLimit: false }           // Disable rate limiting
```

Available rate limit types:
- `api` - 100 requests/minute
- `auth` - 5 requests/minute
- `search` - 30 requests/minute
- `ingest` - 10 requests/minute
- `mcp` - 50 requests/minute

### Request Context

The second parameter provides access to:

```typescript
async (request, { 
  session,           // NextAuth session (if requireAuth: true)
  validatedBody,     // Parsed and validated body
  validatedQuery,    // Parsed and validated query params
  validatedParams,   // Parsed and validated path params
}) => {
  // Your handler logic
}
```

### Response Helpers

#### Success Response
```typescript
return createSuccessResponse(data);
```

#### Success with Meta
```typescript
return createSuccessResponse(data, { 
  pagination: { page: 1, limit: 20, total: 100 } 
});
```

### Error Handling

The API handler automatically catches errors and returns formatted responses.

#### Custom Errors
Throw custom errors from `lib/errors`:

```typescript
import { NotFoundError, ValidationError } from '@/lib/errors';

throw new NotFoundError('User');
throw new ValidationError('Invalid input');
```

#### Error Response Format

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

### Example: Complete CRUD

```typescript
// app/api/items/route.ts
import { NextRequest } from 'next/server';
import { apiHandler, createSuccessResponse } from '@/lib/api-handler';
import { itemSchema, itemCreateSchema } from '@/lib/schemas/item';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';

export const GET = apiHandler(
  { requireAuth: true },
  async (request, { session }) => {
    const items = await prisma.item.findMany({
      where: { userId: session.user.id },
    });
    return createSuccessResponse(items);
  }
);

export const POST = apiHandler(
  { requireAuth: true, validate: itemCreateSchema },
  async (request, { session, validatedBody }) => {
    const item = await prisma.item.create({
      data: {
        ...validatedBody,
        userId: session.user.id,
      },
    });
    return createSuccessResponse(item, { message: 'Item created' });
  }
);
```

---

## Part 5: Code Standards

- Use TypeScript with strict mode
- Use Zod for all validation
- Use the API handler for all routes
- Always include userId in queries
- Use the provided error classes
- Write tests for critical paths

---

## Part 6: Testing

Run tests:
```bash
bun run test
```

Run with coverage:
```bash
bun run test:coverage
```

---

## Part 7: Linting

Run lint:
```bash
bun run lint
```

---

## Troubleshooting

### Database Connection Issues

Make sure your `DATABASE_URL` is correct and the database is accessible.

### OAuth Not Working

Verify your OAuth credentials are correct:
- Google: Get credentials from Google Cloud Console
- GitHub: Get credentials from GitHub Developer Settings

### Missing Dependencies

Run `bun install` to ensure all dependencies are installed.

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering