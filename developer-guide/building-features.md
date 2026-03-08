# Development Guide

This guide covers developing features on the Furma Core Template.

## Project Structure

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

## Creating a New Feature

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

## Code Standards

- Use TypeScript with strict mode
- Use Zod for all validation
- Use the API handler for all routes
- Always include userId in queries
- Use the provided error classes
- Write tests for critical paths

## Testing

Run tests:
```bash
bun run test
```

Run with coverage:
```bash
bun run test:coverage
```

## Linting

Run lint:
```bash
bun run lint
```
