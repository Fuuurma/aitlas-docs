# F.Library - AI-Powered File Storage

> AI-Powered File Storage & Semantic Search for Agents

## Overview

**F.Library** is Google Drive/Dropbox for AI agents. Store files, search semantically, and power your agentic workflows with intelligent file retrieval.

## Vision

The file system for the AI age — where every file is searchable, understandable, and accessible to agents.

## Core Features

### File Storage
- Upload any file type (PDF, images, docs, text, audio, video)
- Folder hierarchy organization
- Tags and metadata
- Version history

### Semantic Search
- Natural language queries: "find the doc about Q1 meeting"
- Vector embeddings via pgvector
- Similar file discovery
- Cross-file relationships

### AI Features
- Auto-tagging on upload
- Text extraction from PDFs/images
- Summarization
- Content analysis

### MCP Integration
- Direct agent access to storage
- Tool-based file operations
- Semantic search via MCP

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      F.Library                               │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                          │
│    └── User UI: Upload, browse, search, manage              │
├─────────────────────────────────────────────────────────────┤
│  Backend (Elixir/Phoenix)                                   │
│    └── REST API + MCP Server                                │
│    └── Auth: Better Auth + API keys                         │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (Neon PostgreSQL)                               │
│    └── Users, Files, Folders, Tags, Embeddings             │
│    └── pgvector for semantic search                        │
├─────────────────────────────────────────────────────────────┤
│  Storage (BYOK)                                             │
│    └── Users provide S3 credentials                         │
│    └── Or use Aitlas default storage                       │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

```sql
-- Users (shared from auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- pdf, image, text, etc.
  size INTEGER NOT NULL,
  storage_key TEXT NOT NULL, -- S3 key
  folder_id UUID REFERENCES folders(id),
  embedding vector(1536), -- for semantic search
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Folders
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6'
);

-- File Tags (many-to-many)
CREATE TABLE file_tags (
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (file_id, tag_id)
);

-- Storage Credentials (BYOK)
CREATE TABLE storage_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- s3, r2, gcs
  access_key TEXT NOT NULL,
  secret_key TEXT NOT NULL, -- encrypted
  bucket TEXT NOT NULL,
  region TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## MCP Tools

### Core Storage

| Tool | Description | Credits |
|------|-------------|---------|
| `upload_file` | Upload a file to storage | 1 |
| `get_file` | Get file by ID | 0 |
| `download_file` | Get file download URL | 0 |
| `delete_file` | Delete a file | 1 |
| `list_files` | List files with filters | 0 |

### Organization

| Tool | Description | Credits |
|------|-------------|---------|
| `create_folder` | Create a folder | 0 |
| `list_folders` | List folders | 0 |
| `move_file` | Move file to folder | 0 |
| `add_tag` | Tag a file | 0 |
| `list_tags` | List all tags | 0 |

### Search (Premium)

| Tool | Description | Credits |
|------|-------------|---------|
| `search_files` | Full-text search | 1 |
| `search_similar` | Semantic similarity search | 2 |
| `embed_file` | Generate embedding for file | 3 |

## MCP Tool Definitions

```elixir
# Example: upload_file tool definition
%{
  name: "upload_file",
  description: "Upload a file to storage. Supports PDF, images, text, and more.",
  inputSchema: %{
    type: "object",
    properties: %{
      data: %{type: "string", description: "Base64 encoded file data"},
      name: %{type: "string", description: "File name including extension"},
      type: %{type: "string", description: "MIME type (e.g., application/pdf)"},
      folder_id: %{type: "string", description: "Optional folder ID"},
      tags: %{type: "array", items: %{type: "string"}, description: "Optional tags"}
    },
    required: ["data", "name", "type"]
  },
  creditCost: 1
}

# Example: search_similar tool definition
%{
  name: "search_similar",
  description: "Find files similar to a query using semantic search",
  inputSchema: %{
    type: "object",
    properties: %{
      query: %{type: "string", description: "Natural language query"},
      limit: %{type: "integer", description: "Max results", default: 10},
      file_type: %{type: "string", description: "Filter by file type"}
    },
    required: ["query"]
  },
  creditCost: 2
}
```

## Pricing

| Tier | Storage | Semantic Queries | AI Features | Price |
|------|---------|------------------|-------------|-------|
| **Basic** | 100MB | 10/day | ❌ | Free |
| **Pro** | 10GB | 100/day | 50/day | €9/mo |
| **Team** | 100GB | 1000/day | 500/day | €29/mo |
| **Enterprise** | Unlimited | Unlimited | Unlimited | Custom |

## BYOK Model

Users can provide their own storage:

- **AWS S3**
- **Cloudflare R2** (no egress fees)
- **Google Cloud Storage**

Or use Aitlas default storage (paid from credits).

## Ecosystem Integration

### With f.research
```typescript
// Research → Store
const findings = await f.research.search("AI trends 2026");
await f.library.upload(findings, "research/q1-2026.pdf");
```

### With f.memory
```typescript
// Remember context from files
const context = await f.library.search_similar("project notes");
await f.memory.save(context);
```

### With Nexus
```typescript
// Agent uses library as knowledge base
nexus.runAgent({
  knowledge: await f.library.search_similar(task)
});
```

## Security

- All files encrypted at rest (AES-256)
- User isolation on all queries
- BYOK: user's keys encrypted with their password
- API key authentication for MCP
- Rate limiting per user

## Development Status

- [ ] Database schema
- [ ] File upload/download
- [ ] Folder management
- [ ] Basic MCP tools
- [ ] Semantic search (pgvector)
- [ ] Auto-tagging AI
- [ ] Text extraction
- [ ] BYOK storage
- [ ] Credit system
- [ ] Usage analytics

---

**Aitlas** — Build fast. Stay sovereign. Zero token liability.
