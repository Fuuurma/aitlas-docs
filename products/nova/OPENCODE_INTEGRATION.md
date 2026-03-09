# OpenCode Integration for Nova

**Provider:** OpenCode  
**For:** Nova (T3Code clone)  
**Type:** CLI Wrapper + HTTP API

---

## Why OpenCode?

| Feature | Benefit |
|---------|---------|
| **Go-based** | Fast, low memory |
| **Auto-compact** | Handles long convos |
| **Tool execution** | Built-in bash, read, edit |
| **JSON output** | Easy to parse |
| **Any model** | Claude, GPT, Gemini, etc. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        NOVA                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            OpenCodeProvider                            │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  • sendMessage()                            │   │   │
│  │  │  • callTool()                              │   │   │
│  │  │  • listTools()                             │   │   │
│  │  │  • healthCheck()                           │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              OpenCode Bridge                          │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  • spawn()  - CLI execution                │   │   │
│  │  │  • parse()   - JSON parsing                │   │   │
│  │  │  • config()  - Config management            │   │   │
│  │  │  • install() - Auto-install                │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              opencode CLI                             │   │
│  │              (installed on server)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### 1. OpenCode Bridge

```typescript
// nova/src/lib/opencode/bridge.ts
import { spawn, SpawnOptions } from 'child_process';
import { join } from 'path';

export interface OpenCodeOptions {
  prompt?: string;
  model?: string;
  cwd?: string;
  env?: Record<string, string>;
  quiet?: boolean;
  outputFormat?: 'text' | 'json';
}

export interface OpenCodeResponse {
  content: string;
  tools?: OpenCodeTool[];
  usage?: {
    input: number;
    output: number;
    total: number;
  };
}

export interface OpenCodeTool {
  name: string;
  description: string;
  input_schema: object;
}

export class OpenCodeBridge {
  private binaryPath: string;
  
  constructor(binaryPath: string = 'opencode') {
    this.binaryPath = binaryPath;
  }
  
  /**
   * Send a message to OpenCode
   */
  async sendMessage(options: OpenCodeOptions): Promise<OpenCodeResponse> {
    const args = this.buildArgs(options);
    
    const result = await this.exec(args, {
      cwd: options.cwd,
      env: this.buildEnv(options.env),
    });
    
    if (options.outputFormat === 'json') {
      return JSON.parse(result) as OpenCodeResponse;
    }
    
    return { content: result };
  }
  
  /**
   * Install OpenCode on the system
   */
  async install(): Promise<void> {
    // Check if already installed
    try {
      await this.exec(['--version']);
      return;
    } catch {
      // Not installed - install it
      await this.execInstall();
    }
  }
  
  /**
   * Check if OpenCode is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.exec(['--version']);
      return true;
    } catch {
      return false;
    }
  }
  
  private buildArgs(options: OpenCodeOptions): string[] {
    const args: string[] = [];
    
    if (options.prompt) {
      args.push('-p', options.prompt);
    }
    
    if (options.quiet || options.outputFormat) {
      args.push('--quiet');
    }
    
    if (options.outputFormat === 'json') {
      args.push('--output-format', 'json');
    }
    
    if (options.cwd) {
      args.push('--cwd', options.cwd);
    }
    
    if (options.model) {
      args.push('--model', options.model);
    }
    
    return args;
  }
  
  private buildEnv(customEnv?: Record<string, string>): Record<string, string> {
    return {
      ...process.env,
      ...customEnv,
    };
  }
  
  private async exec(args: string[], options?: SpawnOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.binaryPath, args, {
        ...options,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', (data) => { stdout += data; });
      proc.stderr.on('data', (data) => { stderr += data; });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`opencode exited with ${code}: ${stderr}`));
        }
      });
      
      proc.on('error', reject);
    });
  }
  
  private async execInstall(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('bash', ['-c', 
        'curl -fsSL https://raw.githubusercontent.com/opencode-ai/opencode/refs/heads/main/install | bash'
      ], { stdio: 'pipe' });
      
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Install failed: ${code}`));
      });
    });
  }
}
```

---

### 2. OpenCode Provider

```typescript
// nova/src/lib/providers/opencode.ts
import { OpenCodeBridge, OpenCodeOptions, OpenCodeResponse } from '../opencode/bridge';
import { AIProvider, Message, Tool, ToolCall } from './types';

export interface OpenCodeConfig {
  model?: string;
  apiKey?: string;
  env?: Record<string, string>;
  cwd?: string;
}

export class OpenCodeProvider implements AIProvider {
  name = 'opencode';
  private bridge: OpenCodeBridge;
  private config: OpenCodeConfig;
  
  constructor(config: OpenCodeConfig) {
    this.config = config;
    this.bridge = new OpenCodeBridge();
  }
  
  async initialize(): Promise<void> {
    // Ensure OpenCode is installed
    await this.bridge.install();
    
    // Verify it works
    const healthy = await this.bridge.healthCheck();
    if (!healthy) {
      throw new Error('OpenCode health check failed');
    }
  }
  
  async sendMessage(messages: Message[]): Promise<string> {
    // Convert messages to prompt
    const prompt = this.messagesToPrompt(messages);
    
    const response = await this.bridge.sendMessage({
      prompt,
      model: this.config.model,
      cwd: this.config.cwd,
      env: this.config.env,
      outputFormat: 'json',
    });
    
    return response.content;
  }
  
  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    // OpenCode tools are called via prompt
    const prompt = `Execute tool: ${name} with args: ${JSON.stringify(args)}`;
    
    const response = await this.bridge.sendMessage({
      prompt,
      model: this.config.model,
      cwd: this.config.cwd,
      env: this.config.env,
    });
    
    return response.content;
  }
  
  async listTools(): Promise<Tool[]> {
    // OpenCode has built-in tools: Bash, Read, Edit, Glob, Grep, etc.
    return [
      {
        name: 'Bash',
        description: 'Execute shell commands',
        input_schema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
          },
          required: ['command'],
        },
      },
      {
        name: 'Read',
        description: 'Read file contents',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' },
          },
          required: ['path'],
        },
      },
      {
        name: 'Edit',
        description: 'Edit a file',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            search: { type: 'string' },
            replace: { type: 'string' },
          },
          required: ['path', 'search', 'replace'],
        },
      },
      {
        name: 'Glob',
        description: 'Find files by pattern',
        input_schema: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'Grep',
        description: 'Search file contents',
        input_schema: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            path: { type: 'string' },
          },
          required: ['pattern'],
        },
      },
    ];
  }
  
  private messagesToPrompt(messages: Message[]): string {
    return messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');
  }
  
  getModel(): string {
    return this.config.model || 'claude-sonnet-4';
  }
}
```

---

### 3. Provider Registry

```typescript
// nova/src/lib/providers/index.ts
import { OpenCodeProvider, OpenCodeConfig } from './opencode';

export const providers = {
  opencode: OpenCodeProvider,
  // Add more providers here
  // claude: ClaudeCodeProvider,
  // codex: CodexProvider,
};

export type ProviderName = keyof typeof providers;

export interface ProviderFactory {
  create(config: unknown): AIProvider;
}

export function createProvider(name: ProviderName, config: unknown): AIProvider {
  const Provider = providers[name];
  if (!Provider) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return new Provider(config as OpenCodeConfig);
}
```

---

### 4. Usage in Nova

```typescript
// nova/src/app/api/chat/route.ts
import { createProvider } from '@/lib/providers';

export async function POST(request: Request) {
  const { message, provider = 'opencode' } = await request.json();
  
  const ai = createProvider(provider as any, {
    model: 'claude-sonnet-4',
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    },
    cwd: '/workspace/project',
  });
  
  await ai.initialize();
  
  const response = await ai.sendMessage([
    { role: 'user', content: message }
  ]);
  
  return Response.json({ response });
}
```

---

## Environment Setup

```bash
# Install OpenCode on server
curl -fsSL https://raw.githubusercontent.com/opencode-ai/opencode/refs/heads/main/install | bash

# Or via Homebrew
brew install opencode-ai/tap/opencode
```

### Required ENV

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | For Claude models |
| `OPENAI_API_KEY` | For GPT models |
| `GEMINI_API_KEY` | For Gemini models |

---

## Comparison

| Feature | OpenCode | Claude Code | Codex |
|---------|-----------|-------------|-------|
| Install | `curl... | bash` | npm | npm |
| Speed | ⚡ Fast (Go) | Medium (Node) | Medium |
| Tools | Built-in | Built-in | Built-in |
| JSON output | ✅ Native | ❌ | ❌ |
| Auto-compact | ✅ | ❌ | ❌ |
| Integration | Easy | Medium | Medium |

---

## Next Steps

1. **Install OpenCode** on server/environment
2. **Add OpenCodeProvider** to Nova
3. **Test** with sample prompts
4. **Add** to provider selector UI

---

*Elegant integration for OpenCode in Nova*
