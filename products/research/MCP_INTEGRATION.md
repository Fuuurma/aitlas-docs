# MCP — Official Protocol Integration

**Status:** ✅ CRITICAL - Official Protocol  
**Reference:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) (80K stars)  
**Spec:** [modelcontextprotocol.io](https://modelcontextprotocol.io)

---

## Overview

**MCP (Model Context Protocol)** is the official open standard for connecting AI assistants to tools and data sources. It's what Aitlas uses for **Actions (f.xyz)**.

> MCP is like USB-C for AI apps — a standardized interface for connecting AI models to different tools and data sources.

---

## Official Resources

### MCP Servers (Reference Implementations)

| Server | Description | Aitlas Use |
|--------|-------------|-------------|
| [Everything](https://github.com/modelcontextprotocol/servers/tree/main/src/everything) | Reference/test server with prompts, resources, tools | Reference |
| [Fetch](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch) | Web content fetching | f.twyt, f.research |
| [Filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) | Secure file operations | f.guard |
| [Git](https://github.com/modelcontextprotocol/servers/tree/main/src/git) | Git repository tools | f.guard |
| [Memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) | Knowledge graph-based memory | f.library |
| [Sequential Thinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking) | Dynamic problem-solving | Agents |
| [Time](https://github.com/modelcontextprotocol/servers/tree/main/src/time) | Time/timezone | Utilities |

### Official SDKs

| Language | SDK | Status |
|----------|-----|--------|
| **TypeScript** | `@modelcontextprotocol/sdk` | ✅ PRIMARY (our stack) |
| Python | `mcp` | Reference |
| Go | `mcp` | Reference |
| C# | `McpSdk` | Reference |
| Java | `mcp` | Reference |
| Rust | `mcp` | Reference |
| Swift | `mcp` | Reference |

---

## MCP Architecture

### Core Concepts

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │  Client  │◄────►│ Protocol │◄────►│  Server  │        │
│  │  (LLM)   │      │  (JSON)  │      │  (Tools) │        │
│  └──────────┘      └──────────┘      └──────────┘        │
│       │                                       │             │
│       │        ┌──────────────┐               │             │
│       └───────►│  Resources  │◄──────────────┘             │
│                │  (Data)     │                              │
│                └──────────────┘                              │
│                                                              │
│                ┌──────────────┐                              │
│                │   Prompts    │                              │
│                │  (Templates) │                              │
│                └──────────────┘                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Three Core Capabilities

1. **Tools** — Functions the LLM can call
2. **Resources** — Data the LLM can read
3. **Prompts** — Pre-defined prompt templates

---

## Official Integrations (Ecosystem)

The MCP registry has **100s of official integrations**:

### Cloud & Infrastructure
- AWS (official)
- Azure (Microsoft)
- Google Cloud
- Alibaba Cloud
- Aiven

### Databases
- PostgreSQL
- SQLite
- Redis
- Chroma (vector DB)
- Astra DB
- Apache Doris
- Apache IoTDB
- Pinecone

### Developer Tools
- GitHub
- GitLab
- Jira
- Confluence
- Slack
- Linear
- Notion

### Financial
- AlphaVantage
- Alpaca (trading)
- Stripe

### AI & ML
- OpenAI
- Anthropic
- Chroma
- Phoenix (observability)

---

## Aitlas MCP Implementation

### Our Stack

| Component | Technology |
|-----------|------------|
| **SDK** | TypeScript (official) |
| **Runtime** | Bun |
| **Framework** | Hono (action-template) |
| **Transport** | HTTP + SSE |

### Current Implementation

Our Actions (f.xyz) are MCP servers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Aitlas MCP Layer                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ f.mcp   │  │ f.twyt  │  │ f.pay   │  │f.health │      │
│  │(server) │  │(server) │  │(server) │  │(server) │      │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘      │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                         │                                   │
│              ┌──────────┴──────────┐                        │
│              │    Tool Gateway     │ ← MCP Router           │
│              │  (Credit + Auth)   │                        │
│              └──────────┬──────────┘                        │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │      Nexus         │ ← MCP Client            │
│              │   (User Interface) │                        │
│              └─────────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### MCP Specification Compliance

| Feature | Status | Notes |
|---------|--------|-------|
| Tools | ✅ | All actions expose MCP tools |
| Resources | 🔵 | Planned for f.library |
| Prompts | 🔵 | Planned for agents |
| Sampling | ❌ | Not needed |
| Roots | ❌ | Not needed |

---

## Best Practices from Official Spec

### 1. Tool Schema

```typescript
// Follow official tool definition format
const tool = {
  name: "tool_name",
  description: "What the tool does",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string", description: "Param description" }
    },
    required: ["param"]
  }
};
```

### 2. Error Handling

```typescript
// MCP-compliant errors
{
  error: {
    code: "TOOL_ERROR",
    message: "Human-readable error",
    data: { ... }
  }
}
```

### 3. Transport

- **HTTP + SSE** for production (recommended)
- **StdIO** for local development

---

## Research: Potential Integrations

### High Priority

| Integration | Use Case | Priority |
|-------------|----------|----------|
| **GitHub** | f.guard code review | 🔴 High |
| **PostgreSQL** | Database tools | 🔴 High |
| **Linear** | Task integration (Symphony) | 🔴 High |
| **Slack** | Notifications | 🟡 Medium |

### Future

| Integration | Use Case | Priority |
|-------------|----------|----------|
| **Notion** | Knowledge base | 🟡 Medium |
| **Stripe** | Already in f.pay | ✅ Done |
| **AlphaVantage** | f.finance data | 🟢 Low |

---

## Migration: Our MCP vs Official

### Current (AITLAS_MCP_SPEC)

- Custom tool definitions
- Custom auth layer
- Custom credit system

### Official

- Standard MCP tool schema
- Standard error handling
- Full protocol compliance

### Action Item

**Migrate all actions to full MCP spec compliance:**
1. Use official TypeScript SDK
2. Follow official tool schema
3. Implement standard error codes
4. Add resource support (f.library)

---

## References

- [MCP Official Docs](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [MCP Registry](https://registry.modelcontextprotocol.io)
- [Official Servers](https://github.com/modelcontextprotocol/servers)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

*Status: ✅ CRITICAL - MCP is the backbone of Aitlas Actions*
