# Actions Implementation Summary

**Product:** Actions (f.xyz) - MCP Tools for Aitlas  
**Foundation:** MCP Protocol + Official MCP Servers  
**Stack:** TypeScript + Bun + Hono

---

## Key Patterns Extracted

### 1. MCP Protocol Compliance

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Architecture                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐      ┌──────────────┐                   │
│   │    Client    │◄────►│   Protocol   │                   │
│   │   (Nova)     │      │   (JSON)     │                   │
│   └──────────────┘      └──────────────┘                   │
│          │                     │                             │
│          │              ┌──────────────┐                   │
│          └─────────────►│   Server     │                   │
│                         │  (Action)    │                   │
│                         └──────────────┘                   │
│                                                              │
│   Three Core Capabilities:                                   │
│   1. TOOLS      - Functions LLM can call                    │
│   2. RESOURCES  - Data LLM can read                         │
│   3. PROMPTS    - Pre-defined templates                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Tool Definition Format (MCP Spec)

```typescript
// MCP-compliant tool definition
interface MCPTool {
  name: string;                    // Tool identifier
  description: string;             // What the tool does
  inputSchema: {                   // JSON Schema for params
    type: 'object';
    properties: {
      [key: string]: {
        type: string;
        description: string;
      };
    };
    required: string[];
  };
}

// Example: f.research tool
const researchTool: MCPTool = {
  name: 'research',
  description: 'Deep research on any topic with citations',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Research query',
      },
      depth: {
        type: 'string',
        enum: ['quick', 'standard', 'deep'],
        description: 'Research depth',
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'Sources to search (web, academic, news)',
      },
    },
    required: ['query'],
  },
};
```

### 3. Tool Response Format

```typescript
// MCP-compliant tool response
interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError: boolean;
}

// Example response
const response: MCPToolResponse = {
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        answer: 'The research shows...',
        citations: [
          { url: 'https://...', title: 'Source 1' },
        ],
      }),
    },
  ],
  isError: false,
};
```

---

## Recommended Architecture

### Action Server Template

```typescript
// src/index.ts - Action server entry point
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create MCP server
const server = new Server(
  { name: 'f.research', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    researchTool,
    quickSearchTool,
    deepResearchTool,
  ],
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'research':
      return handleResearch(args);
    case 'quick_search':
      return handleQuickSearch(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### HTTP Transport (for production)

```typescript
// src/http.ts - HTTP transport for actions
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// MCP over HTTP
app.post('/mcp', async (c) => {
  const request = await c.req.json();
  
  // Validate auth
  const apiKey = c.req.header('X-API-Key');
  const user = await validateApiKey(apiKey);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  
  // Check credits
  const action = getActionFromRequest(request);
  if (!await hasCredits(user, action.cost)) {
    return c.json({ error: 'Insufficient credits' }, 402);
  }
  
  // Execute
  const response = await handleMCPRequest(request);
  
  // Deduct credits
  await deductCredits(user.id, action.cost);
  
  return c.json(response);
});

// Tool execution endpoint
app.post('/tools/:name/execute', async (c) => {
  const toolName = c.req.param('name');
  const args = await c.req.json();
  
  const result = await executeTool(toolName, args);
  
  return c.json(result);
});

export default app;
```

---

## Action Registry

```typescript
// src/registry.ts - Central action registry
interface Action {
  id: string;
  name: string;
  description: string;
  tools: MCPTool[];
  cost: number;
  category: string;
}

const ACTIONS: Action[] = [
  {
    id: 'f.research',
    name: 'Research',
    description: 'Deep research with citations',
    tools: [researchTool, quickSearchTool],
    cost: 5,
    category: 'knowledge',
  },
  {
    id: 'f.twyt',
    name: 'Twitter',
    description: 'Twitter/X operations',
    tools: [postTweetTool, searchTweetsTool, getUserTool],
    cost: 3,
    category: 'social',
  },
  {
    id: 'f.pay',
    name: 'Payments',
    description: 'Payment operations',
    tools: [createPaymentTool, getBalanceTool],
    cost: 10,
    category: 'finance',
  },
  {
    id: 'f.health',
    name: 'Health Check',
    description: 'System health monitoring',
    tools: [healthCheckTool, diagnoseTool],
    cost: 1,
    category: 'system',
  },
  {
    id: 'f.mcp',
    name: 'MCP Generator',
    description: 'Generate MCP servers',
    tools: [generateServerTool, validateSchemaTool],
    cost: 15,
    category: 'development',
  },
];

// Get action by ID
export function getAction(id: string): Action | undefined {
  return ACTIONS.find(a => a.id === id);
}

// List all actions
export function listActions(category?: string): Action[] {
  if (category) {
    return ACTIONS.filter(a => a.category === category);
  }
  return ACTIONS;
}
```

---

## Action Implementation Examples

### f.research (Based on Perplexica)

```typescript
// actions/f.research/src/tools/research.ts
import { PerplexicaClient } from '@aitlas/perplexica';

const perplexica = new PerplexicaClient(process.env.PERPLEXICA_URL);

export const researchTool: MCPTool = {
  name: 'research',
  description: 'Deep research with citations',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Research query' },
      mode: { 
        type: 'string', 
        enum: ['quick', 'deep', 'academic'],
        description: 'Research mode',
      },
    },
    required: ['query'],
  },
};

export async function handleResearch(args: { query: string; mode?: string }) {
  const result = await perplexica.search({
    query: args.query,
    mode: args.mode || 'standard',
  });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        answer: result.answer,
        citations: result.sources,
        related: result.relatedQuestions,
      }),
    }],
    isError: false,
  };
}
```

### f.twyt (Twitter/X)

```typescript
// actions/f.twyt/src/tools/post-tweet.ts
import { TwitterApi } from 'twitter-api-v2';

export const postTweetTool: MCPTool = {
  name: 'post_tweet',
  description: 'Post a tweet to Twitter/X',
  inputSchema: {
    type: 'object',
    properties: {
      text: { 
        type: 'string', 
        maxLength: 280,
        description: 'Tweet text (max 280 chars)',
      },
      media: {
        type: 'array',
        items: { type: 'string' },
        description: 'Media URLs to attach',
      },
    },
    required: ['text'],
  },
};

export async function handlePostTweet(args: { text: string; media?: string[] }) {
  const client = new TwitterApi(process.env.TWITTER_TOKEN);
  
  const tweet = await client.v2.tweet({
    text: args.text,
    media: args.media ? { media_ids: await uploadMedia(args.media) } : undefined,
  });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        id: tweet.data.id,
        url: `https://twitter.com/user/status/${tweet.data.id}`,
      }),
    }],
    isError: false,
  };
}
```

### f.scrape (Based on Scrapling)

```typescript
// actions/f.scrape/src/tools/scrape.ts
import { Scrapling } from 'scrapling';

export const scrapeTool: MCPTool = {
  name: 'scrape',
  description: 'Scrape web content with stealth mode',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to scrape' },
      selector: { type: 'string', description: 'CSS selector' },
      stealth: { type: 'boolean', description: 'Use stealth mode' },
    },
    required: ['url'],
  },
};

export async function handleScrape(args: { url: string; selector?: string; stealth?: boolean }) {
  const scraper = new Scrapling({
    stealth_mode: args.stealth,
  });
  
  const page = await scraper.fetch(args.url);
  
  if (args.selector) {
    const elements = page.css(args.selector);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(elements.map(e => e.text)),
      }],
      isError: false,
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: page.html,
    }],
    isError: false,
  };
}
```

---

## Credit Integration

```typescript
// src/credits.ts - Credit deduction for actions
export async function executeWithCredits(
  toolName: string,
  args: any,
  user: User
): Promise<MCPToolResponse> {
  // 1. Get tool cost
  const action = getActionForTool(toolName);
  const cost = calculateCost(action, args);
  
  // 2. Check balance
  const balance = await getCreditBalance(user.id);
  if (balance < cost) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Insufficient credits',
          required: cost,
          balance,
        }),
      }],
      isError: true,
    };
  }
  
  // 3. Execute
  const result = await executeTool(toolName, args);
  
  // 4. Deduct credits
  await deductCredits(user.id, cost, {
    action: action.id,
    tool: toolName,
    args,
  });
  
  return result;
}
```

---

## Action Discovery

```typescript
// API: List all available actions
app.get('/actions', async (c) => {
  const actions = listActions();
  
  return c.json({
    actions: actions.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      tools: a.tools.map(t => t.name),
      cost: a.cost,
      category: a.category,
    })),
  });
});

// API: Get action details
app.get('/actions/:id', async (c) => {
  const action = getAction(c.req.param('id'));
  if (!action) return c.json({ error: 'Not found' }, 404);
  
  return c.json({
    ...action,
    tools: action.tools,
  });
});
```

---

## Official MCP Integrations

### Using Official MCP Servers

| Server | Use Case | Integration |
|--------|----------|-------------|
| **Filesystem** | File operations | f.guard |
| **Git** | Repository tools | f.guard |
| **Memory** | Knowledge graph | f.library |
| **Fetch** | Web content | f.research |
| **Sequential Thinking** | Problem solving | Agents |

### Integration Pattern

```typescript
// Bridge official MCP servers to our actions
import { FilesystemServer } from '@modelcontextprotocol/server-filesystem';

const filesystem = new FilesystemServer('/allowed/path');

// Expose as f.guard tools
export const fileReadTool: MCPTool = {
  name: 'file_read',
  description: 'Read file contents',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' },
    },
    required: ['path'],
  },
};

export async function handleFileRead(args: { path: string }) {
  const content = await filesystem.readFile(args.path);
  
  return {
    content: [{ type: 'text', text: content }],
    isError: false,
  };
}
```

---

## Testing Actions

```typescript
// Test action via MCP Inspector or CLI
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({ name: 'test-client', version: '1.0.0' });
await client.connect(new StdioServerTransport());

// List tools
const tools = await client.request(
  { method: 'tools/list' },
  ListToolsResultSchema
);

// Execute tool
const result = await client.request(
  {
    method: 'tools/call',
    params: {
      name: 'research',
      arguments: { query: 'AI trends 2024' },
    },
  },
  CallToolResultSchema
);
```

---

## Action Template (New Action)

```typescript
// Template for creating new actions
// actions/f.new-action/src/index.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'f.new-action', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Define tools
const myTool: MCPTool = {
  name: 'my_tool',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'Parameter' },
    },
    required: ['param'],
  },
};

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [myTool],
}));

// Handle execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'my_tool') {
    // Implement tool logic
    const result = await doSomething(args.param);
    
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      isError: false,
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| MCP Protocol | Standard, future-proof |
| TypeScript SDK | Official, well-maintained |
| HTTP transport | Production-ready |
| Credit system | Monetization |
| Tool schema | JSON Schema validation |

---

## Next Steps

1. **Migrate existing actions** to full MCP compliance
2. **Use official TypeScript SDK** for all actions
3. **Add credit deduction** to each action
4. **Create action template** for rapid development
5. **Build testing framework** for actions
6. **Document all tools** with OpenAPI
7. **Add resource support** (f.library)

---

*Implementation Status: 🔵 Ready for development*