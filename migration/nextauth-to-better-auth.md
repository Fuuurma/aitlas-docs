# NextAuth to Better Auth Migration Guide

**Date:** March 6, 2026  
**Version:** 1.0.0  
**Status:** Complete

---

## Overview

This guide documents the migration from NextAuth to Better Auth in the Aitlas Core Template.

## Why Better Auth?

| Feature | Better Auth | NextAuth |
|---------|-------------|----------|
| Self-hosted | ✅ Yes | ✅ Yes |
| TypeScript | ✅ First-class | ⚠️ Okay |
| 2FA/Passkeys | ✅ Built-in | ❌ Requires setup |
| Sovereign | ✅ Perfect for BYOK | ✅ Good |
| Bundle size | ✅ Smaller | ⚠️ Larger |
| API design | ✅ Modern | ⚠️ Older |
| Email verification | ✅ Built-in | ❌ Manual |

## Changes Made

### 1. Package Updates

**Removed:**
- `next-auth`
- `@auth/prisma-adapter`

**Added:**
- `better-auth@1.5.4`

### 2. Schema Changes

**Updated User model:**
- Changed `emailVerified` from `Boolean` to `DateTime?`
- Added `image` field
- Relations: `accounts`, `sessions`, `apiKeys`, `tasks`, `userAgents`, `toolRegistry`, `creditLedger`, `creditReservations`, `memories`, `events`

**New models:**
- `Account` - OAuth provider accounts
- `Session` - User sessions (updated)
- `Verification` - Email verification tokens

**New utility models:**
- `CreditReservation` - For async task credit management
- `Memory` - Agent memory and context
- `Event` - Observability and audit logging

### 3. Auth Configuration

**Old:** `lib/auth.ts` (NextAuth)
**New:** `lib/auth.ts` (Better Auth)

```typescript
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  baseURL: config.auth.url,
  database: {
    provider: 'postgres',
    url: config.database.url,
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: { /* ... */ },
});
```

### 4. Client-Side Auth

**Old:** `import { useSession } from 'next-auth/react'`
**New:** `import { useSession } from '@/lib/auth-client'`

```typescript
import { authClient, useSession, signIn, signOut } from '@/lib/auth-client';

const { data: session } = useSession();
```

### 5. API Routes

**Old:** `app/api/auth/[...nextauth]/route.ts`
**New:** `app/api/auth/[...all]/route.ts`

```typescript
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

### 6. Middleware

**Old:** Used `withAuth` from NextAuth
**New:** Direct session check with Better Auth API

```typescript
const session = await auth.api.getSession({
  headers: request.headers,
});
```

### 7. API Handler

**Updated:** Session retrieval now uses Better Auth API

```typescript
const session = await auth.api.getSession({
  headers: request.headers,
});
```

## Breaking Changes

### Client-Side

**Before:**
```typescript
import { signIn, signOut, useSession } from 'next-auth/react';
```

**After:**
```typescript
import { signIn, signOut, useSession } from '@/lib/auth-client';
```

### Server-Side

**Before:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
```

**After:**
```typescript
import { auth } from '@/lib/auth';

const session = await auth.api.getSession({
  headers: request.headers,
});
```

### Session Structure

**Before:**
```typescript
session.user.id
session.user.email
session.user.name
```

**After:**
```typescript
session.user.id
session.user.email
session.user.name
session.user.image
session.user.computeCredits
session.user.planTier
```

## Database Migration

Run these migrations:

```bash
bun run db:generate
bun run db:migrate
```

## Environment Variables

No changes required. Same variables:
- `NEXTAUTH_URL` → Still used as `baseURL`
- `NEXTAUTH_SECRET` → Used as `secret`
- `DATABASE_URL` → Used for database connection
- OAuth credentials → Unchanged

## Testing

All existing auth tests have been updated for Better Auth:
- User creation and authentication
- Session management
- OAuth account management
- Email verification
- Credit system integration

## Rollback

To rollback to NextAuth:

1. Restore old schema:
   ```bash
   git checkout HEAD~1 prisma/schema.prisma
   bun run db:generate
   bun run db:migrate
   ```

2. Restore old files:
   ```bash
   git checkout HEAD~1 lib/auth.ts middleware.ts
   ```

3. Reinstall NextAuth:
   ```bash
   bun remove better-auth
   bun add next-auth @auth/prisma-adapter
   ```

## References

- [Better Auth Documentation](https://better-auth.com)
- [NextAuth Documentation](https://next-auth.js.org)
- [AITLAS_ARCHITECTURE.md](../AITLAS_ARCHITECTURE.md)

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering