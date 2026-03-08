# Credit System Architecture

**Version:** 1.0.0  
**Date:** March 6, 2026  
**Status:** Production Ready

---

## Overview

The Aitlas credit system is the monetization layer that powers all compute-intensive Actions (f.xyz). It follows an append-only ledger pattern with atomic transactions to ensure consistency and prevent double-spending.

---

## Design Principles

1. **Append-Only Ledger** - Never UPDATE credits directly. Always INSERT ledger entries.
2. **Atomic Operations** - Credit check and task creation in same transaction.
3. **Reserve-Settle Pattern** - Reserve credits on dispatch, settle on completion.
4. **Zero Failed Charges** - Only deduct on successful execution.

---

## Credit Pricing

| Action | Credits | USD Value (at $0.01/credit) |
|--------|---------|------------------------------|
| Pro subscription/mo | +500 | $25/mo includes $5 credit value |
| Credit pack (100) | $1 | $0.01/credit |
| Credit pack (1,000) | $8 | $0.008/credit |
| f.twyt search | 1 | $0.01 |
| f.library ingest | 2 | $0.02 |
| f.library search | 1 | $0.01 |
| f.rsrx deep research | 5 | $0.05 |
| f.guard code review | 2 | $0.02 |
| f.support ticket | 3 | $0.03 |
| f.loop compute (per hour) | 10 | $0.10/hr |
| f.decloy deployment | 75 | $0.75 |

---

## Core Functions

### getUserBalance(userId)

Returns current credit balance for a user.

```typescript
import { getUserBalance } from '@/lib/credit-middleware';

const balance = await getUserBalance('user_abc123');
// Returns: 150
```

### checkCredits(userId, required)

Validates if user has sufficient credits.

```typescript
import { checkCredits } from '@/lib/credit-middleware';

const hasCredits = await checkCredits('user_abc123', 5);
// Returns: true or false
```

### deductCredits(params)

Atomically deducts credits with ledger entry.

```typescript
import { deductCredits } from '@/lib/credit-middleware';

const result = await deductCredits({
  userId: 'user_abc123',
  amount: 5,
  reason: 'f.rsrx:deep_research',
  referenceId: 'task_xyz789',
});

if (result.success) {
  console.log(`New balance: ${result.newBalance}`);
} else {
  console.log(`Error: ${result.error}`);
}
```

### reserveCredits(params)

Reserves credits for async tasks. Prevents double-spending on parallel executions.

```typescript
import { reserveCredits } from '@/lib/credit-middleware';

const reservation = await reserveCredits({
  userId: 'user_abc123',
  amount: 20,
  reason: 'f.loop:background_task',
  taskId: 'task_456',
});

if (reservation.success) {
  // Proceed with async task
  const reservationId = reservation.reservationId;
}
```

### settleCredits(reservationId, actualAmount)

Uses reserved credits, returns unused portion.

```typescript
import { settleCredits } from '@/lib/credit-middleware';

// Reserved 20 credits, but only used 15
const result = await settleCredits(reservationId, 15);
// User gets 5 credits back
```

### releaseCredits(reservationId)

Cancels reservation and returns all credits.

```typescript
import { releaseCredits } from '@/lib/credit-middleware';

const result = await releaseCredits(reservationId);
// All reserved credits returned to user
```

### addCredits(params)

Adds credits to user (purchase or grant).

```typescript
import { addCredits } from '@/lib/credit-middleware';

const result = await addCredits({
  userId: 'user_abc123',
  amount: 100,
  reason: 'purchase',
  referenceId: 'stripe_payment_123',
});
```

---

## Database Schema

### CreditLedgerEntry (Immutable)

```prisma
model CreditLedgerEntry {
  id          String   @id @default(cuid())
  userId      String
  delta       Int      // Positive = credit, Negative = debit
  balance     Int      // Snapshot after this entry
  reason      String   // "purchase", "f.twyt:search_twitter"
  referenceId String?  // taskId, paymentId
  createdAt   DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}
```

### CreditReservation (For Async Tasks)

```prisma
model CreditReservation {
  id          String    @id @default(cuid())
  userId      String
  taskId      String?
  amount      Int
  status      String    // "RESERVED" | "SETTLED" | "RELEASED"
  reason      String
  createdAt   DateTime  @default(now())
  settledAt   DateTime?
  releasedAt  DateTime?
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId, status])
}
```

---

## Usage Patterns

### Pattern 1: Synchronous Tool Call

For short tasks (< 30 seconds) that execute immediately.

```typescript
// API route handler
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session.user.id;
  
  // Check and deduct
  const result = await deductCredits({
    userId,
    amount: 1,
    reason: 'f.twyt:search_twitter',
    referenceId: taskId,
  });
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Insufficient credits' },
      { status: 402 }
    );
  }
  
  // Execute tool
  const results = await searchTwitter(query);
  
  return NextResponse.json({ results });
}
```

### Pattern 2: Asynchronous Task with Reservation

For long tasks (> 30 seconds) that run in f.loop.

```typescript
// API route - dispatch task
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session.user.id;
  
  // Reserve credits
  const reservation = await reserveCredits({
    userId,
    amount: 20,
    reason: 'f.loop:long_task',
    taskId,
  });
  
  if (!reservation.success) {
    return NextResponse.json(
      { error: 'Insufficient credits' },
      { status: 402 }
    );
  }
  
  // Create task
  await prisma.task.create({
    data: {
      userId,
      goal: 'Long running task',
      creditsReserved: 20,
      status: 'PENDING',
    },
  });
  
  return NextResponse.json({ taskId });
}

// Worker - execute task
async function executeTask(task: Task) {
  try {
    const result = await performLongTask(task);
    
    // Settle with actual credits used
    await settleCredits(task.reservationId, result.creditsUsed);
  } catch (error) {
    // Release all reserved credits on failure
    await releaseCredits(task.reservationId);
    throw error;
  }
}
```

---

## Credit Flow Diagrams

### Successful Execution

```
User (100 credits)
  │
  ├─ deductCredits(5)
  │   └─ Ledger: delta=-5, balance=95
  │   └─ User: computeCredits=95
  │
  └─ Execute tool → Success
      └─ Return result to user
```

### Async Task with Settlement

```
User (100 credits)
  │
  ├─ reserveCredits(20)
  │   └─ Ledger: (none yet)
  │   └─ Reservation: amount=20, status=RESERVED
  │   └─ User: computeCredits=80
  │
  ├─ Execute async task
  │   └─ Uses 15 credits
  │
  └─ settleCredits(15)
      └─ Ledger: delta=-15, balance=85
      └─ Reservation: status=SETTLED
      └─ User: computeCredits=85 (80 + 5 returned)
```

### Failed Task

```
User (100 credits)
  │
  ├─ reserveCredits(20)
  │   └─ User: computeCredits=80
  │
  ├─ Execute async task → FAILS
  │
  └─ releaseCredits()
      └─ Reservation: status=RELEASED
      └─ User: computeCredits=100 (all returned)
```

---

## Security Considerations

### 1. Never Expose Balance in Errors

```typescript
// ❌ Bad
throw new Error(`You have ${balance} credits, need ${required}`);

// ✅ Good
throw new InsufficientCreditsError(required, balance, action);
// User message: "You need more credits to perform this action"
```

### 2. Validate User Ownership

```typescript
// Always include userId in queries
await prisma.creditLedgerEntry.findMany({
  where: { userId: session.user.id }, // REQUIRED
});
```

### 3. Use Transactions

```typescript
await prisma.$transaction(async (tx) => {
  // Check balance
  const user = await tx.user.findUnique({ where: { id: userId } });
  
  if (user.computeCredits < amount) {
    throw new InsufficientCreditsError();
  }
  
  // Deduct
  await tx.user.update({
    where: { id: userId },
    data: { computeCredits: { decrement: amount } },
  });
  
  // Create ledger entry
  await tx.creditLedgerEntry.create({
    data: {
      userId,
      delta: -amount,
      balance: user.computeCredits - amount,
      reason,
    },
  });
});
```

---

## Testing

All credit functions have 100% test coverage:

```bash
bun test __tests__/credit-middleware.test.ts
```

---

## Monitoring

Key metrics to track:

- Credit balance distribution
- Purchase conversion rate
- Reservation settlement rate
- Failed task credit release rate
- Average credits per action

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering