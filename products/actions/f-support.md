# f.support — AI Helpdesk Automation

**Domain:** f.xyz/support  
**Status:** 🟡 Roadmap  
**Category:** Business Automation Tool  
**Credits:** 1-3 per action (see pricing)

---

## Strategic Value

**f.support is NOT just ticket CRUD.** It's an **AI support operator** that can autonomously handle customer support.

The real value is: **Ticket triage + Resolution**

```
Incoming message
    ↓
Categorize
    ↓
Search knowledge base
    ↓
Generate response
    ↓
Resolve or escalate
```

### Positioning Decision

**f.support is for autonomous support agents**, not just support infrastructure.

```
Support Agent (in Nexus)
    ↓
uses f.support tools
    ↓
uses f.library for knowledge
    ↓
resolves tickets autonomously
```

This fits the Aitlas ecosystem better.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    f.support Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CHANNEL CONNECTORS (MCP)                │    │
│  │  email  │  chat  │  twitter  │  discord  │  web     │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TICKET PROCESSOR                        │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │ Classify    │  │ Sentiment   │  │ Priority    │  │    │
│  │  │ (category)  │  │ (analysis)  │  │ (scoring)   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              RESOLVER                                │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │ Knowledge   │  │ Response    │  │ Quality     │  │    │
│  │  │ Lookup      │  │ Generation  │  │ Check       │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ESCALATION ENGINE                       │    │
│  │                                                      │    │
│  │  Human handoff │ Slack alert │ Email notify         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage & Knowledge                       │
│  Postgres (tickets) + f.library (knowledge base)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Tools API

### `ingest_support_message` ⭐ NEW

**This is critical.** Automatically ingest incoming messages and create tickets.

**Parameters:**
```typescript
{
  // Channel information
  channel: "email" | "chat" | "twitter" | "discord" | "web";
  
  // User identification
  user_id: string;           // Your platform's user ID
  user_email?: string;
  user_name?: string;
  
  // Message content
  message: string;
  subject?: string;          // For email
  
  // Metadata
  timestamp?: string;        // ISO timestamp
  thread_id?: string;        // For chat/discord threads
  
  // Auto-process
  auto_reply?: boolean;      // Default: false
  auto_resolve?: boolean;    // Default: false
}
```

**Returns:**
```typescript
{
  ticket_id: string;
  status: "open" | "processing" | "resolved";
  
  // If auto-processed
  classification?: {
    category: string;
    sentiment: "positive" | "neutral" | "negative";
    priority: "low" | "medium" | "high" | "urgent";
    confidence: number;
  };
  
  // If auto-replied
  reply_sent?: boolean;
  reply_preview?: string;
  
  // If auto-resolved
  resolved?: boolean;
  resolution?: string;
}
```

---

### `suggest_reply` ⭐ NEW

Generate a suggested reply for a ticket.

**Parameters:**
```typescript
{
  ticket_id: string;
  
  // Options
  tone?: "professional" | "friendly" | "technical";
  length?: "brief" | "standard" | "detailed";
  include_knowledge_sources?: boolean;
}
```

**Returns:**
```typescript
{
  suggested_reply: string;
  confidence_score: number;    // 0-100
  
  // Knowledge sources used
  knowledge_sources?: Array<{
    title: string;
    relevance: number;
  }>;
  
  // Alternative suggestions
  alternatives?: string[];
  
  // Warning flags
  warnings?: string[];         // e.g., "Sentiment is very negative"
}
```

---

### `list_open_tickets` ⭐ NEW

Get all open tickets for dashboards and agent review.

**Parameters:**
```typescript
{
  // Filters
  status?: Array<"open" | "pending" | "escalated">;
  priority?: Array<"low" | "medium" | "high" | "urgent">;
  category?: string;
  
  // Pagination
  limit?: number;             // Default: 20
  offset?: number;
  
  // Sorting
  sort_by?: "created_at" | "priority" | "last_updated";
  sort_order?: "asc" | "desc";
}
```

**Returns:**
```typescript
{
  tickets: Array<{
    ticket_id: string;
    subject: string;
    message: string;
    
    // Classification
    category: string;
    sentiment: string;
    priority: string;
    
    // Status
    status: string;
    created_at: string;
    last_updated: string;
    
    // User info
    user_id: string;
    user_name?: string;
    
    // Metrics
    message_count: number;
    time_since_created_minutes: number;
  }>;
  
  total: number;
  filters_applied: object;
}
```

---

### `update_ticket_status` ⭐ NEW

Update ticket status with optional resolution.

**Parameters:**
```typescript
{
  ticket_id: string;
  
  // New status
  status: "open" | "pending" | "resolved" | "escalated" | "closed";
  
  // Optional resolution
  resolution?: string;        // Required if status = "resolved"
  
  // Escalation details
  escalation_reason?: string; // Required if status = "escalated"
  escalate_to?: string;       // Team or user ID
  
  // Internal notes
  internal_note?: string;     // Not visible to user
}
```

**Returns:**
```typescript
{
  ticket_id: string;
  status: string;
  updated_at: string;
  
  // If resolved
  resolution?: string;
  
  // If escalated
  escalation?: {
    reason: string;
    escalated_to: string;
    notified: boolean;
  };
}
```

---

### `create_ticket`

Manually create a support ticket (alternative to ingest).

**Parameters:**
```typescript
{
  subject: string;
  message: string;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  
  // User info
  user_id: string;
  user_email?: string;
  
  // Metadata
  tags?: string[];
  assign_to?: string;         // Agent/team ID
}
```

**Returns:**
```typescript
{
  ticket_id: string;
  status: "open";
  created_at: string;
  
  // Auto-classification
  classification: {
    category: string;
    sentiment: string;
    priority: string;
  };
}
```

---

### `resolve_ticket`

Attempt to resolve a ticket automatically.

**Parameters:**
```typescript
{
  ticket_id: string;
  
  // Context for resolution
  context?: string;           // Additional context
  
  // Knowledge base to search
  knowledge_collection?: string;  // f.library collection
  
  // Auto-send
  auto_send?: boolean;        // Auto-send resolution to user
}
```

**Returns:**
```typescript
{
  ticket_id: string;
  status: "resolved" | "escalated";
  
  // If resolved
  resolution?: string;
  confidence: number;
  
  // If escalated
  escalation_reason?: string;
  
  // Knowledge used
  knowledge_used?: Array<{
    source: string;
    relevance: number;
  }>;
}
```

---

### `get_ticket`

Get full ticket details.

**Parameters:**
```typescript
{
  ticket_id: string;
  include_messages?: boolean; // Include full conversation
}
```

**Returns:**
```typescript
{
  ticket_id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  sentiment: string;
  
  // User info
  user_id: string;
  user_email?: string;
  user_name?: string;
  
  // Conversation
  messages?: Array<{
    id: string;
    sender: "user" | "agent" | "system";
    content: string;
    timestamp: string;
  }>;
  
  // Metadata
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  
  // Resolution
  resolution?: string;
  resolved_by?: string;
}
```

---

## Knowledge Base Integration (f.library)

**Critical:** f.support must integrate with f.library for knowledge lookup.

### Flow

```
Ticket arrives
    ↓
Search f.library collection
    ↓
Find relevant articles/docs
    ↓
Generate answer from knowledge
    ↓
Respond to user
```

### Setup

```typescript
// Create a knowledge collection for support
await f.library.create_collection({
  name: "support_knowledge",
  description: "Product docs, FAQs, troubleshooting guides"
});

// Ingest documentation
await f.library.ingest_document({
  collection: "support_knowledge",
  content: "How to reset your password...",
  metadata: { category: "account", article_id: "pwd-reset" }
});

// When resolving tickets
const resolution = await f.support.resolve_ticket({
  ticket_id: "t_123",
  knowledge_collection: "support_knowledge"
});
```

---

## Multi-Channel Support

Channels are handled via **MCP connectors**:

| Channel | MCP Connector | Features |
|---------|---------------|----------|
| **Email** | `email-mcp` | Send/receive, threading |
| **Chat** | `chat-mcp` | Real-time, typing indicators |
| **Twitter** | `twitter-mcp` | DMs, mentions |
| **Discord** | `discord-mcp` | Threads, reactions |
| **Web** | Built-in | Chat widget, forms |

### Channel Configuration

```typescript
// Configure channels in f.support settings
{
  channels: {
    email: {
      enabled: true,
      provider: "resend",
      from_address: "support@example.com"
    },
    chat: {
      enabled: true,
      widget_position: "bottom-right"
    },
    twitter: {
      enabled: true,
      handle: "@example_support"
    },
    discord: {
      enabled: true,
      server_id: "123456789",
      channel_id: "987654321"
    }
  }
}
```

---

## Credits Model

| Action | Credits | Use Case |
|--------|---------|----------|
| `ingest_support_message` | 1 | Message ingestion + triage |
| `suggest_reply` | 1 | Generate suggested response |
| `list_open_tickets` | 0 | Dashboard view (free) |
| `get_ticket` | 0 | Read operation (free) |
| `update_ticket_status` | 0 | Status update (free) |
| `create_ticket` | 1 | Manual ticket creation |
| `resolve_ticket` (auto) | 3 | Auto-resolution with knowledge lookup |

**Example monthly cost:**
- 1,000 tickets ingested: 1,000 credits
- 800 auto-resolved: 2,400 credits
- 200 escalated (no resolution cost): 0 credits
- **Total: 3,400 credits = $34/month** (at $0.01/credit)

---

## Autonomous Support Agent Example

```typescript
// In Nexus, create an autonomous support agent
{
  name: "Support Agent",
  goal: "Handle incoming support tickets automatically",
  tools: ["f.support", "f.library"],
  skills: [
    "ingest_support_message",
    "suggest_reply",
    "resolve_ticket"
  ]
}

// The agent can:
// 1. Poll for new tickets (or use webhooks)
// 2. Auto-categorize and prioritize
// 3. Search knowledge base
// 4. Generate and send responses
// 5. Escalate when needed
```

---

## Implementation Roadmap

### Phase 1 — Core Ticket System
- [ ] Ticket model (Postgres)
- [ ] `create_ticket`, `get_ticket`, `update_ticket_status`
- [ ] `list_open_tickets`
- [ ] Basic classification (category, priority)
- [ ] Web widget

### Phase 2 — AI Features
- [ ] `ingest_support_message` with auto-triage
- [ ] `suggest_reply` with knowledge lookup
- [ ] Sentiment analysis
- [ ] f.library integration

### Phase 3 — Channels
- [ ] Email connector (Resend)
- [ ] Chat widget (real-time)
- [ ] Twitter DM connector
- [ ] Discord connector

### Phase 4 — Autonomous Resolution
- [ ] `resolve_ticket` with confidence scoring
- [ ] Auto-send resolution
- [ ] Escalation engine
- [ ] Human handoff workflow

---

**Repo:** https://github.com/Fuuurma/f-support