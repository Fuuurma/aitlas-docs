# f.library - Vector Knowledge Base

**Domain:** f.xyz/library  
**Status:** ✅ Production  
**Credits:** 2/ingest, 1/search

---

## Strategic Value

**f.library = LLM-ready knowledge retrieval**

Most production-ready Action, but needs agent-focused features.

---

## Core Concept

Actions should be **stateless, predictable, composable, MCP-compatible** - like serverless AI primitives.

---

## Tools

### `ingest_document`

Add a document to the knowledge base.

**Parameters:**
```typescript
{
  content: string;          // Document content
  collection?: string;      // Collection name (NEW)
  metadata?: {
    title?: string;
    source?: string;
    tags?: string[];
    url?: string;
  };
}
```

**Returns:**
```typescript
{
  document_id: string;
  chunks_created: number;
  collection: string;
}
```

---

### `search_knowledge_base`

Semantic search across stored documents.

**Parameters:**
```typescript
{
  query: string;
  collection?: string;      // Search specific collection (NEW)
  limit?: number;           // Max results (default: 5)
  max_tokens?: number;      // Token budget for results (NEW)
  filter?: {
    tags?: string[];
    source?: string;
  };
}
```

**Returns:**
```typescript
{
  results: Array<{
    document_id: string;
    chunk_id: string;
    content: string;
    score: number;
    metadata: object;
  }>;
}
```

---

### `retrieve_context` ⭐ NEW

**LLM-ready context assembly** - agents don't need to manually join chunks.

**Parameters:**
```typescript
{
  query: string;
  collection?: string;
  max_tokens?: number;      // Token budget (default: 4000)
  format?: "text" | "json"; // Output format
}
```

**Returns:**
```typescript
{
  context: string;          // Assembled, ready for LLM
  sources: Array<{
    document_id: string;
    title: string;
    relevance: number;
  }>;
  tokens_used: number;
}
```

---

### `delete_document` ⭐ NEW

Remove document and its chunks.

**Parameters:**
```typescript
{
  document_id: string;
}
```

**Returns:**
```typescript
{
  deleted: boolean;
  chunks_removed: number;
}
```

---

### `update_document` ⭐ NEW

Re-ingest with new content.

**Parameters:**
```typescript
{
  document_id: string;
  content: string;
  metadata?: {...};
}
```

---

### `list_collections` ⭐ NEW

List all collections.

**Returns:**
```typescript
{
  collections: Array<{
    name: string;
    document_count: number;
    total_chunks: number;
  }>;
}
```

---

## Collections

**Document isolation by purpose:**

| Collection | Purpose |
|------------|---------|
| `company_docs` | Internal documentation |
| `research` | Research papers, articles |
| `personal` | Personal notes |
| `project_docs` | Project-specific docs |

Example:
```typescript
// Ingest to collection
await ingest_document({
  content: "...",
  collection: "project_docs"
});

// Search specific collection
await search_knowledge_base({
  query: "API authentication",
  collection: "project_docs"
});
```

---

## Technical Details

| Component | Technology |
|-----------|------------|
| Vector Store | pgvector (PostgreSQL) |
| Embeddings | OpenAI text-embedding-3-small |
| Chunking | 500 tokens, 50 token overlap |
| Search | Vector similarity |

---

## Roadmap

- [x] Basic ingest/search
- [ ] Collections support
- [ ] `retrieve_context` tool
- [ ] Delete/update documents
- [ ] Hybrid search (vector + keyword)
- [ ] Multi-tenant isolation

---

## Credits

| Action | Credits |
|--------|---------|
| ingest_document | 2 |
| search_knowledge_base | 1 |
| retrieve_context | 1 |
| delete_document | 0 |
| update_document | 2 |

---

## Product Score

| Metric | Score |
|--------|-------|
| Product Potential | 9/10 |
| Current Spec | 8/10 → 9/10 (updated) |

---

**Repo:** https://github.com/Fuuurma/f-library