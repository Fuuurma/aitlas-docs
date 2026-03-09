# Multi-Provider Integration for Nova

**Full Implementation:** OpenCode + Claude Code + Codex  
**For:** Nova (T3Code clone)

---

## Overview

Nova connects to multiple AI coding providers through a unified abstraction layer.

```
┌─────────────────────────────────────────────────────────────┐
│                        NOVA                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Provider Manager                             │   │
│  │   • Switch provider                                    │   │
│  │   • Fallback logic                                    │   │
│  │   • Health checks                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│       ┌───────────────────┼───────────────────┐             │
│       ▼                   ▼                   ▼             │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐  │
│  │OpenCode │       │Claude    │       │ Codex   │  │
│  │Provider │       │Code      │       │Provider │  │
│  │         │       │Provider  │       │         │  │
│  └──────────┘       └──────────┘       └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Provider Comparison

| Feature | OpenCode | Claude Code | Codex |
|--------|----------|-------------|-------|
| **Install** | `curl... \| bash` | `brew install` | `npm install` |
| **Language** | Go | TypeScript | TypeScript |
| **Tools** | Bash, Read, Edit, Glob, Grep | MCP-based | MCP-based |
| **API Keys** | ENV | API key | API key |
| **JSON output** | ✅ Native | ❌ | ❌ |
| **Speed** | ⚡⚡⚡ | ⚡⚡ | ⚡⚡ |
| **Auto-compact** | ✅ | ❌ | ❌ |

---

## Unified Provider Interface

```typescript
interface AIProvider {
  name: string;
  
  // Core
  initialize(): Promise<void>;
  sendMessage(messages: Message[]): Promise<string>;
  
  // Tools
  listTools(): Promise<Tool[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<string>;
  
  // Info
  getModel(): string;
  healthCheck(): Promise<boolean>;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Tool {
  name: string;
  description: string;
  input_schema: object;
}
```

---

## Implementation

### 1. Base Provider

```typescript
// nova/src/lib/providers/base.ts
import { spawn, SpawnOptions } from 'child_process';

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  protected binaryPath: string;
  
  abstract initialize(): Promise<void>;
  abstract sendMessage(messages: Message[]): Promise<string>;
  abstract listTools(): Promise<Tool[]>;
  abstract callTool(name: string, args: Record<string, unknown>): Promise<string>;
  
  protected async exec(args: string[], options?: SpawnOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.binaryPath, args, {
        ...options,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      
      proc.on('close', code => {
        if (code === 0) resolve(stdout.trim());
        else reject(new Error(`${this.name} exited ${code}: ${stderr}`));
      });
    });
  }
  
  abstract getModel(): string;
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.exec(['--version']);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 2. OpenCode Provider

```typescript
// nova/src/lib/providers/opencode.ts
import { BaseProvider } from './base';

export class OpenCodeProvider extends BaseProvider {
  name = 'opencode';
  private config: OpenCodeConfig;
  private model = 'claude-sonnet-4-20250514';
  
  constructor(config: OpenCodeConfig) {
    super();
    this.config = config;
    this.binaryPath = 'opencode';
    if (config.model) this.model = config.model;
  }
  
  async initialize(): Promise<void> {
    // Auto-install if needed
    try {
      await this.exec(['--version']);
    } catch {
      await this.install();
    }
  }
  
  async sendMessage(messages: Message[]): Promise<string> {
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const result = await this.exec([
      '-p', prompt,
      '--output-format', 'json',
      '--quiet',
      '--model', this.model,
    ], {
      env: { ...process.env, ...this.config.env },
      cwd: this.config.cwd,
    });
    
    try {
      const parsed = JSON.parse(result);
      return parsed.content || result;
    } catch {
      return result;
    }
  }
  
  async listTools(): Promise<Tool[]> {
    return [
      { name: 'Bash', description: 'Execute shell commands', input_schema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } },
      { name: 'Read', description: 'Read file contents', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
      { name: 'Edit', description: 'Edit a file', input_schema: { type: 'object', properties: { path: { type: 'string' }, search: { type: 'string' }, replace: { type: 'string' } }, required: ['path', 'search'] } },
      { name: 'Glob', description: 'Find files by pattern', input_schema: { type: 'object', properties: { pattern: { type: 'string' } }, required: ['pattern'] } },
      { name: 'Grep', description: 'Search file contents', input_schema: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string' } }, required: ['pattern'] } },
    ];
  }
  
  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const prompt = `Execute tool: ${name} with ${JSON.stringify(args)}`;
    return this.sendMessage([{ role: 'user', content: prompt }]);
  }
  
  getModel(): string { return this.model; }
  
  private async install(): Promise<void> {
    await this.exec(['bash', '-c', 'curl -fsSL https://raw.githubusercontent.com/opencode-ai/opencode/refs/heads/main/install | bash']);
  }
}
```

### 3. Claude Code Provider

```typescript
// nova/src/lib/providers/claudecode.ts
import { BaseProvider } from './base';

export class ClaudeCodeProvider extends BaseProvider {
  name = 'claude-code';
  private config: ClaudeCodeConfig;
  private model = 'sonnet-4-20250514';
  
  constructor(config: ClaudeCodeConfig) {
    super();
    this.config = config;
    this.binaryPath = 'claude';
    if (config.model) this.model = config.model;
  }
  
  async initialize(): Promise<void> {
    // Claude Code uses npm/npx
    try {
      await this.exec(['--version']);
    } catch {
      // Claude Code typically pre-installed
    }
  }
  
  async sendMessage(messages: Message[]): Promise<string> {
    // Claude Code works differently - it's interactive
    // Use --print mode for non-interactive
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const result = await this.exec([
      'code', '--print',
      '--model', this.model,
    ], {
      env: { ...process.env, ...this.config.env },
      cwd: this.config.cwd,
    });
    
    return result;
  }
  
  async listTools(): Promise<Tool[]> {
    // Claude Code uses MCP tools
    // These are typically defined in claude.json
    return [
      { name: 'Bash', description: 'Execute shell commands', input_schema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } },
      { name: 'Read', description: 'Read file', input_schema: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] } },
      { name: 'Edit', description: 'Edit file', input_schema: { type: 'object', properties: { file_path: { type: 'string' }, string_to_insert: { type: 'string' }, offset: { type: 'number' } }, required: ['file_path', 'string_to_insert'] } },
      { name: 'Glob', description: 'Find files', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
    ];
  }
  
  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    // Claude Code tool calling via --print
    const prompt = `Use tool ${name} with args: ${JSON.stringify(args)}`;
    return this.sendMessage([{ role: 'user', content: prompt }]);
  }
  
  getModel(): string { return this.model; }
}
```

### 4. Codex Provider

```typescript
// nova/src/lib/providers/codex.ts
import { BaseProvider } from './base';

export class CodexProvider extends BaseProvider {
  name = 'codex';
  private config: CodexConfig;
  private model = 'claude-sonnet-4-20250514';
  
  constructor(config: CodexConfig) {
    super();
    this.config = config;
    this.binaryPath = 'codex';
    if (config.model) this.model = config.model;
  }
  
  async initialize(): Promise<void> {
    try {
      await this.exec(['--version']);
    } catch {
      // Install via npm
      await this.exec(['npm', 'install', '-g', '@openai/codex']);
    }
  }
  
  async sendMessage(messages: Message[]): Promise<string> {
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const result = await this.exec([
      'run',
      '--model', this.model,
      '--non-interactive',
      prompt,
    ], {
      env: { ...process.env, ...this.config.env },
      cwd: this.config.cwd,
    });
    
    return result;
  }
  
  async listTools(): Promise<Tool[]> {
    return [
      { name: 'bash', description: 'Execute shell commands', input_schema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } },
      { name: 'read', description: 'Read file', input_schema: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] } },
      { name: 'edit', description: 'Edit file', input_schema: { type: 'object', properties: { file_path: { type: 'string' }, string_to_insert: { type: 'string' }, offset: { type: 'number' } }, required: ['file_path', 'string_to_insert'] } },
    ];
  }
  
  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const prompt = `Execute tool ${name} with args: ${JSON.stringify(args)}`;
    return this.sendMessage([{ role: 'user', content: prompt }]);
  }
  
  getModel(): string { return this.model; }
}
```

### 5. Provider Factory

```typescript
// nova/src/lib/providers/index.ts
import { AIProvider } from './types';
import { OpenCodeProvider, OpenCodeConfig } from './opencode';
import { ClaudeCodeProvider, ClaudeCodeConfig } from './claudecode';
import { CodexProvider, CodexConfig } from './codex';

export type ProviderConfig = 
  | { type: 'opencode'; config: OpenCodeConfig }
  | { type: 'claude-code'; config: ClaudeCodeConfig }
  | { type: 'codex'; config: CodexConfig };

export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.type) {
    case 'opencode':
      return new OpenCodeProvider(config.config);
    case 'claude-code':
      return new ClaudeCodeProvider(config.config);
    case 'codex':
      return new CodexProvider(config.config);
    default:
      throw new Error(`Unknown provider: ${config.type}`);
  }
}
```

### 6. Provider Manager

```typescript
// nova/src/lib/provider-manager.ts
import { AIProvider } from './providers/types';
import { createProvider, ProviderConfig } from './providers';

export class ProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: string;
  
  constructor(
    private configs: ProviderConfig[],
    private fallbackOrder: string[] = []
  ) {
    this.activeProvider = configs[0]?.type || 'opencode';
  }
  
  async initialize(): Promise<void> {
    for (const config of this.configs) {
      const provider = createProvider(config);
      await provider.initialize();
      this.providers.set(config.type, provider);
    }
  }
  
  async sendMessage(messages: Message[]): Promise<string> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) throw new Error(`Provider ${this.activeProvider} not initialized`);
    
    try {
      return await provider.sendMessage(messages);
    } catch (error) {
      // Try fallbacks
      for (const fallback of this.fallbackOrder) {
        if (fallback === this.activeProvider) continue;
        try {
          const fallbackProvider = this.providers.get(fallback);
          if (fallbackProvider) {
            console.log(`Falling back to ${fallback}`);
            this.activeProvider = fallback;
            return await fallbackProvider.sendMessage(messages);
          }
        } catch (e) {
          continue;
        }
      }
      throw error;
    }
  }
  
  switchProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not found`);
    }
    this.activeProvider = name;
  }
  
  getActiveProvider(): AIProvider {
    return this.providers.get(this.activeProvider)!;
  }
  
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
```

---

## Usage Example

```typescript
// nova/src/app/api/chat/route.ts
import { ProviderManager } from '@/lib/provider-manager';

const manager = new ProviderManager(
  [
    { type: 'opencode', config: { env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY! } } },
    { type: 'claude-code', config: { env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY! } } },
    { type: 'codex', config: { env: { OPENAI_API_KEY: process.env.OPENAI_API_KEY! } } },
  ],
  ['opencode', 'claude-code', 'codex']
);

await manager.initialize();

export async function POST(request: Request) {
  const { message, provider } = await request.json();
  
  if (provider) manager.switchProvider(provider);
  
  const response = await manager.sendMessage([
    { role: 'user', content: message }
  ]);
  
  return Response.json({ response, provider: manager.getActiveProvider().name });
}
```

---

## Environment Setup

```bash
# All providers need at least one API key
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=...

# Install providers
# OpenCode
curl -fsSL https://raw.githubusercontent.com/opencode-ai/opencode/refs/heads/main/install | bash

# Claude Code  
brew install --cask claude-code

# Codex
npm install -g @openai/codex
```

---

## Summary

| Provider | Install | Best For |
|----------|---------|----------|
| **OpenCode** | `curl... \| bash` | Speed, JSON, auto-compact |
| **Claude Code** | `brew install` | MCP tools, Anthropic native |
| **Codex** | `npm install -g` | OpenAI native |

**Provider Manager handles:** switching, fallback, health checks

---

*Full multi-provider implementation for Nova*
