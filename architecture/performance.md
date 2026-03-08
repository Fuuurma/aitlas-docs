# Performance Optimizations

**Version:** 1.0.0  
**Date:** March 6, 2026  
**Status:** Production Ready

---

## Database Indexes

### Essential Indexes (Already in Schema)

```sql
-- Credit ledger queries
CREATE INDEX idx_credit_ledger_user_time ON "CreditLedgerEntry"("userId", "createdAt");

-- Task queue processing
CREATE INDEX idx_task_status_created ON "Task"("status", "createdAt");

-- Credit reservations
CREATE INDEX idx_credit_reservation_user_status ON "CreditReservation"("userId", "status");

-- Memory/Vector search
CREATE INDEX idx_memory_user_type ON "Memory"("userId", "type");
CREATE INDEX idx_memory_user_agent ON "Memory"("userId", "agentId");

-- Event/audit logs
CREATE INDEX idx_event_type_created ON "Event"("type", "createdAt");
CREATE INDEX idx_event_user_type ON "Event"("userId", "type");
```

### Additional Recommended Indexes

For high-traffic production deployments:

```sql
-- User lookups by plan
CREATE INDEX idx_user_plan ON "User"("planTier");

-- Session token validation
CREATE INDEX idx_session_token ON "Session"("sessionToken");

-- Account provider lookups
CREATE INDEX idx_account_provider ON "Account"("providerId", "accountId");

-- Task queries by user
CREATE INDEX idx_task_user ON "Task"("userId");

-- ApiKey lookups
CREATE INDEX idx_apikey_user_provider ON "ApiKey"("userId", "provider");

-- Tool registry
CREATE INDEX idx_tool_user ON "ToolRegistry"("userId");
```

---

## Caching Strategies

### User Credit Balance (Short TTL)

```typescript
import { cache } from '@/lib/cache';

export async function getCachedUserBalance(userId: string): Promise<number> {
  const cacheKey = `user:credits:${userId}`;
  
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return cached as number;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { computeCredits: true },
  });
  
  const balance = user?.computeCredits || 0;
  
  // Cache for 5 minutes
  cache.set(cacheKey, balance, 300);
  
  return balance;
}

export function invalidateUserCreditCache(userId: string): void {
  cache.delete(`user:credits:${userId}`);
}
```

### Agent Manifests (Medium TTL)

```typescript
export async function getCachedAgentManifest(agentId: string): Promise<Agent | null> {
  const cacheKey = `agent:manifest:${agentId}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached as Agent;
  }
  
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });
  
  if (agent) {
    // Cache for 1 hour
    cache.set(cacheKey, agent, 3600);
  }
  
  return agent;
}
```

### MCP Tool Registry (Long TTL)

```typescript
export async function getCachedMCPTools(): Promise<MCPTool[]> {
  const cacheKey = 'mcp:tools:all';
  
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached as MCPTool[];
  }
  
  const tools = await prisma.mCPRegistry.findMany({
    where: { isActive: true },
  });
  
  // Cache for 24 hours
  cache.set(cacheKey, tools, 86400);
  
  return tools;
}
```

### Public Agent Store Listings

```typescript
export async function getCachedPublicAgents(): Promise<Agent[]> {
  const cacheKey = 'agents:public:list';
  
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached as Agent[];
  }
  
  const agents = await prisma.agent.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      name: true,
      description: true,
      avatarUrl: true,
      category: true,
      isPremium: true,
      creditCostEstimate: true,
    },
  });
  
  // Cache for 1 hour
  cache.set(cacheKey, agents, 3600);
  
  return agents;
}
```

---

## Query Optimization Patterns

### Use Select for Specific Fields

```typescript
// ❌ Bad - fetches all fields
const user = await prisma.user.findUnique({ where: { id } });

// ✅ Good - only needed fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    computeCredits: true,
  },
});
```

### Batch Queries

```typescript
// ❌ Bad - N+1 query problem
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  const user = await prisma.user.findUnique({ where: { id: task.userId } });
}

// ✅ Good - Single query with include
const tasks = await prisma.task.findMany({
  include: { user: { select: { id: true, email: true } } },
});
```

### Use Transactions for Atomic Operations

```typescript
await prisma.$transaction([
  prisma.user.update({
    where: { id: userId },
    data: { computeCredits: { decrement: amount } },
  }),
  prisma.creditLedgerEntry.create({
    data: { userId, delta: -amount, balance: newBalance, reason },
  }),
]);
```

---

## Connection Pooling

Prisma handles connection pooling automatically, but for optimal performance:

```env
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30"
```

---

## Monitoring

### Key Metrics

- Query latency (p50, p95, p99)
- Connection pool utilization
- Cache hit rate
- Slow query count

### Slow Query Detection

```typescript
import { logger } from '@/lib/logger';

const SLOW_QUERY_THRESHOLD = 1000; // 1 second

prisma.$on('query', (e) => {
  if (e.duration > SLOW_QUERY_THRESHOLD) {
    logger.warn({
      query: e.query,
      duration: e.duration,
      params: e.params,
    }, 'Slow query detected');
  }
});
```

---

## Best Practices

1. **Always use indexes** for frequently queried fields
2. **Cache aggressively** but with appropriate TTLs
3. **Use select** to limit returned fields
4. **Batch queries** to avoid N+1 problems
5. **Monitor slow queries** and optimize
6. **Use transactions** for atomic operations
7. **Invalidate cache** on mutations

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering