# f.twyt — Twitter Search & Ingestion

**Domain:** f.xyz/twyt  
**Status:** ✅ Production  
**Category:** Intelligence / Social Signal Tool  
**Credits:** 1 per query

---

## Strategic Value

**f.twyt is the cleanest Action in Aitlas.** It exemplifies what Actions should be:

- **Simple** — Single purpose, easy to understand
- **Focused** — Does one thing well
- **Cheap** — 1 credit per query
- **Composable** — Agents combine it with other Actions

Think of Actions like **Unix tools**:

```
grep  |  curl  |  sed
```

Small, composable, powerful. `f.twyt` fits that model perfectly.

### What f.twyt Enables

It's not just Twitter search. It enables **real-time social intelligence**.

```
Research Agent
    ↓
f.twyt search
    ↓
Collect tweets
    ↓
Cluster opinions
    ↓
Generate report (f.rsrx)
```

Or:

```
Crypto Agent
    ↓
Monitor influencers
    ↓
Detect narratives
    ↓
Alert user
```

---

## Tools API

### `search_twitter`

Semantic search across Twitter/X.

**Parameters:**
```typescript
{
  query: string;              // Search query
  limit?: number;             // Max results (default: 10, max: 100)
  sort_by?: "relevance" | "recent" | "engagement";  // Sort order
  
  // Filters
  from?: string;              // Tweets from specific user (without @)
  to?: string;                // Tweets to specific user
  mentions?: string;          // Tweets mentioning user
  
  // Time filtering
  since?: string;             // ISO date or "1d", "7d", "30d"
  until?: string;             // ISO date
  
  // Content filters
  has_media?: boolean;        // Only tweets with media
  has_links?: boolean;        // Only tweets with links
  min_likes?: number;         // Minimum likes
  min_retweets?: number;      // Minimum retweets
}
```

**Returns:**
```typescript
{
  tweets: Array<{
    // Core data
    id: string;
    text: string;
    author: {
      username: string;       // Without @
      display_name: string;
      verified: boolean;
      followers_count?: number;
    };
    created_at: string;       // ISO timestamp
    
    // Engagement metrics
    likes: number;
    retweets: number;
    replies: number;          // ⭐ NEW
    views?: number;           // If available
    
    // Computed engagement score ⭐ NEW
    engagement_score: number; // likes + retweets * 2 + replies
    
    // URLs ⭐ NEW
    url: string;              // https://twitter.com/user/status/id
    media?: Array<{
      type: "image" | "video" | "gif";
      url: string;
    }>;
    
    // Links in tweet
    links?: string[];
    
    // Quoted/Reply info
    is_reply?: boolean;
    is_quote?: boolean;
    quoted_tweet_id?: string;
    reply_to_tweet_id?: string;
  }>;
  
  // Metadata
  query: string;
  total_found: number;
  credits_used: number;
}
```

---

### `get_user_timeline`

Get tweets from a specific user.

**Parameters:**
```typescript
{
  username: string;           // Without @
  limit?: number;             // Default: 20, max: 100
  
  // Filters
  exclude_replies?: boolean;  // Exclude reply tweets
  exclude_retweets?: boolean; // Exclude retweets
  
  // Pagination
  since_id?: string;          // Get tweets after this ID
  max_id?: string;            // Get tweets before this ID
}
```

**Returns:**
```typescript
{
  user: {
    username: string;
    display_name: string;
    bio?: string;
    verified: boolean;
    followers_count: number;
    following_count: number;
    tweets_count: number;
    profile_image_url?: string;
  };
  
  tweets: Array<Tweet>;       // Same structure as search_twitter
  
  credits_used: number;
}
```

---

### `search_user_mentions` ⭐ NEW

Get tweets mentioning a specific user.

**Why this exists:** Essential for monitoring brand mentions, support requests, and reputation management.

**Parameters:**
```typescript
{
  username: string;           // User being mentioned (without @)
  limit?: number;             // Default: 20
  sort_by?: "recent" | "engagement";
  
  // Filters
  exclude_replies?: boolean;  // Exclude replies (only standalone mentions)
}
```

**Returns:**
```typescript
{
  mentions: Array<{
    tweet: Tweet;             // Tweet mentioning the user
    context: string;          // "praise" | "complaint" | "question" | "neutral"
  }>;
  
  user: {
    username: string;
    mentions_count_24h: number;
  };
  
  credits_used: number;
}
```

---

### `ingest_tweets` ⭐ NEW

Ingest tweets into f.library for knowledge base building.

**Why this exists:** Agents need to build knowledge bases from Twitter data. This integrates f.twyt with f.library.

**Parameters:**
```typescript
{
  query: string;              // Search query
  limit?: number;             // Default: 50, max: 500
  
  // f.library target
  collection: string;         // Collection name to store in
  
  // Content options
  include_metadata?: boolean; // Include author, engagement, etc.
  include_media?: boolean;    // Include media URLs
  
  // Deduplication
  skip_existing?: boolean;    // Skip tweets already in collection
}
```

**Returns:**
```typescript
{
  ingested: number;           // Tweets successfully ingested
  skipped: number;            // Duplicates skipped
  collection: string;
  
  // Preview
  sample_tweets: Array<{
    id: string;
    text: string;
    author: string;
  }>;
  
  credits_used: number;
}
```

---

### `get_trending`

Get trending topics for a location.

**Parameters:**
```typescript
{
  woeid?: number;             // Where On Earth ID (default: 1 = worldwide)
  // Common: 1=Worldwide, 23424977=US, 44418=London
}
```

**Returns:**
```typescript
{
  trends: Array<{
    name: string;
    url: string;
    tweet_count?: number;
  }>;
  
  location: string;
  as_of: string;
  
  credits_used: number;
}
```

---

## Engagement Scoring

The `engagement_score` helps agents quickly identify viral/high-impact tweets.

**Formula:**
```
engagement_score = likes + (retweets * 2) + replies
```

**Why this weighting:**
- Retweets indicate amplification (worth 2x)
- Replies indicate conversation
- Likes indicate passive agreement

**Usage example:**
```typescript
const result = await f.twyt.search_twitter({ query: "AI agents" });

// Filter for high-engagement tweets only
const viralTweets = result.tweets.filter(t => t.engagement_score > 100);
```

---

## f.twyt + f.library Integration

Build knowledge bases from Twitter:

```typescript
// 1. Create a collection
await f.library.create_collection({
  name: "ai_trends",
  description: "AI agent trends from Twitter"
});

// 2. Ingest tweets
await f.twyt.ingest_tweets({
  query: "AI agents autonomous",
  limit: 100,
  collection: "ai_trends"
});

// 3. Search the knowledge base
await f.library.search_knowledge_base({
  collection: "ai_trends",
  query: "agent frameworks"
});
```

---

## Agent Workflow Example

```typescript
// Social Intelligence Agent in Nexus
const agent = {
  name: "Trend Monitor",
  goal: "Track AI agent trends on Twitter and report weekly",
  tools: ["f.twyt", "f.library", "f.rsrx"],
  
  // Weekly schedule
  schedule: { type: "cron", expression: "0 9 * * 1" },
  
  // Memory
  memoryCollection: "ai_trends_memory"
};

// The agent will:
// 1. Search Twitter for "AI agents"
// 2. Ingest new tweets into f.library
// 3. Analyze trends with f.rsrx
// 4. Generate report and notify user
```

---

## Credits Model

| Action | Credits | Use Case |
|--------|---------|----------|
| `search_twitter` | 1 | Basic search |
| `get_user_timeline` | 1 | User tweets |
| `search_user_mentions` | 1 | Brand monitoring |
| `ingest_tweets` | 1 + 0.1 per tweet | Knowledge building |
| `get_trending` | 0.5 | Trend discovery |

**Example monthly cost:**
- 1,000 searches: 1,000 credits
- 500 user timelines: 500 credits
- 10,000 tweets ingested: 1,000 + 1,000 = 2,000 credits
- **Total: 3,500 credits = $35/month**

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      f.twyt Server                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Twitter API  │  │ Cache Layer  │  │ Rate Limiter │       │
│  │ Client       │  │ (Redis)      │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Engagement   │  │ Sentiment    │  │ f.library    │       │
│  │ Scorer       │  │ Analyzer     │  │ Connector    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Status

- [x] `search_twitter` - Basic search
- [x] `get_user_timeline` - User tweets
- [ ] Engagement scoring
- [ ] Reply count
- [ ] URL + media fields
- [ ] `search_user_mentions`
- [ ] `ingest_tweets` (f.library integration)
- [ ] `get_trending`
- [ ] Advanced filters (since, until, min_likes)

---

**Repo:** https://github.com/Fuuurma/f-twyt