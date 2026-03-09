# ADR-001: Use RESTful API with Standard Handler

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
## Status
Accepted

## Context
We need a consistent approach to building API routes across all Furma products.

## Decision
Use RESTful API routes with a standard handler wrapper (`lib/api-handler.ts`) that provides:
- Authentication middleware
- Rate limiting
- Request validation (Zod)
- Error handling
- Response formatting

## Rationale

### Pros
- **Familiar**: REST is well-understood by all developers
- **Universal**: Works with any HTTP client (curl, fetch, axios)
- **Standard**: Easy to generate OpenAPI specs
- **Flexible**: Can use any HTTP method
- **Cachable**: GET requests can be cached at CDN level

### Cons
- **Manual types**: Need to maintain types separately
- **More boilerplate**: More code than tRPC
- **No streaming**: Need WebSockets for real-time

## Consequences

### Implementation
- All API routes must use `apiHandler` wrapper
- All inputs must be validated with Zod
- All responses must use `createSuccessResponse`
- Errors must use custom error classes

### Migration Path
Products using tRPC can continue. This is a recommendation, not a requirement.

## Related
- ADR-002: BYOK Encryption Strategy
- ADR-003: Multi-Tenancy Implementation