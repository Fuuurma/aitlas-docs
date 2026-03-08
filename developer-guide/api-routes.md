# API Routes Guide

This guide explains how to create API routes using the standard API handler.

## Standard API Handler

All API routes should use the `apiHandler` wrapper from `lib/api-handler.ts`.

## Basic Usage

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

## Options

### `requireAuth`
Require authentication for the route:

```typescript
{ requireAuth: true }
```

### `validate`
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

### `rateLimit`
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

## Request Context

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

## Response Helpers

### Success Response
```typescript
return createSuccessResponse(data);
```

### Success with Meta
```typescript
return createSuccessResponse(data, { 
  pagination: { page: 1, limit: 20, total: 100 } 
});
```

## Error Handling

The API handler automatically catches errors and returns formatted responses.

### Custom Errors
Throw custom errors from `lib/errors`:

```typescript
import { NotFoundError, ValidationError } from '@/lib/errors';

throw new NotFoundError('User');
throw new ValidationError('Invalid input');
```

### Error Response Format

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

## Example: Complete CRUD

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

## Best Practices

1. **Always use the API handler** - Don't write raw route handlers
2. **Validate all inputs** - Use Zod schemas
3. **Include userId in queries** - Never query without user scoping
4. **Use proper HTTP methods** - GET for reading, POST for creating, etc.
5. **Return consistent responses** - Use `createSuccessResponse`
