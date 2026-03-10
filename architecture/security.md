# Security Practices

> ⚠️ **OUTDATED** — Stack changed from Prisma to Drizzle. TODO: Update code examples.

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

This document outlines security requirements for all Furma products.

## Critical Security Rules


 — All Aitlas products are **closed source**. No open source license.

---


### 1. BYOK Encryption (CRITICAL)


 — All Aitlas products are **closed source**. No open source license.

---


**Never store API keys in plain text.**

```typescript
import { encryptApiKey, decryptApiKey } from '@/lib/encryption';

// Store (encrypt before DB)
const { encrypted, iv, authTag } = encryptApiKey(apiKey);
await prisma.apiKey.create({
  data: { keyData: encrypted, iv, authTag }
});

// Retrieve (decrypt in-memory only)
const apiKey = decryptApiKey(encrypted, iv, authTag);
// Use immediately, let garbage collector clean up
```

### 2. Multi-Tenancy (CRITICAL)


 — All Aitlas products are **closed source**. No open source license.

---


**Every query MUST include userId.**

```typescript
// ✅ Correct
const data = await prisma.yourModel.findMany({
  where: { userId: session.user.id }
});

// ❌ Incorrect - Security vulnerability!
const data = await prisma.yourModel.findMany();
```

### 3. Environment Variables


 — All Aitlas products are **closed source**. No open source license.

---


**Validate all environment variables at startup.**

```typescript
// lib/env.ts does this automatically
import { env } from '@/lib/env';

// Use validated env vars
const dbUrl = env.DATABASE_URL;
```

### 4. Authentication


 — All Aitlas products are **closed source**. No open source license.

---


**Use NextAuth for all auth.**

```typescript
import { getSession } from '@/lib/session';

const session = await getSession();
if (!session) {
  throw new AuthenticationError();
}
```

### 5. Rate Limiting


 — All Aitlas products are **closed source**. No open source license.

---


**Enable rate limiting on all API routes.**

```typescript
import { apiHandler } from '@/lib/api-handler';

export const GET = apiHandler(
  { requireAuth: true, rateLimit: true },
  async (request, { session }) => { /* ... */ }
);
```

### 6. Input Validation


 — All Aitlas products are **closed source**. No open source license.

---


**Validate all inputs with Zod.**

```typescript
import { apiHandler } from '@/lib/api-handler';
import { mySchema } from '@/lib/schemas/my-schema';

export const POST = apiHandler(
  { validate: mySchema },
  async (request, { validatedBody }) => { /* ... */ }
);
```

### 7. Error Handling


 — All Aitlas products are **closed source**. No open source license.

---


**Never expose raw errors to clients.**

```typescript
// ❌ Incorrect
return Response.json({ error: error.message }, { status: 500 });

// ✅ Correct - Uses custom error classes
throw new APIError('INTERNAL_ERROR', 'An error occurred');
```

## Security Checklist


 — All Aitlas products are **closed source**. No open source license.

---


Before deploying:

- [ ] All API keys encrypted with AES-256-GCM
- [ ] Every query includes userId
- [ ] Environment validated at startup
- [ ] Rate limiting enabled
- [ ] Inputs validated with Zod
- [ ] Errors sanitized
- [ ] No secrets in logs
- [ ] HTTPS enforced
- [ ] CORS configured

## Environment Variables


 — All Aitlas products are **closed source**. No open source license.

---


Never commit these to git:
- `.env.local`
- `.env.production`

Always use `.env.example` to document required variables.
