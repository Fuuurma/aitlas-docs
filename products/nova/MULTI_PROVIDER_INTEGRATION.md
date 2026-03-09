# Nova Multi-Provider Integration

**Based on:** cc-switch architecture  
**For:** Nova (T3Code clone)  
**Goal:** Connect Codex, Claude Code, OpenCode, Gemini CLI + Aitlas Nexus

---

## The Problem

Each AI provider has different:
- Config formats (JSON, TOML, .env)
- API interfaces
- Authentication methods
- Tool definitions

**Solution:** Unified provider layer with format conversion and hot-switching.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        NOVA                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Provider Abstraction Layer              │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │           Unified Interface                   │   │   │
│  │  │  • sendMessage()                             │   │   │
│  │  │  • listTools()                               │   │   │
│  │  │  • callTool()                               │   │   │
│  │  │  • getModel()                               │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                                │
│       ┌────────────────────┼────────────────────┐         │
│       ▼                    ▼                    ▼         │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐   │
│  │ Codex   │        │Claude    │        │ OpenCode │   │
│  │Adapter │        │ Adapter  │        │ Adapter  │   │
│  └────┬────┘        └────┬─────┘        └────┬────┘   │
│       │                  │                   │            │
│       ▼                  ▼                   ▼            │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐   │
│  │  Claude  │        │ Anthropic│        │  OpenAI  │   │
│  │  Code   │        │   API    │        │   API    │   │
│  │  CLI    │        └──────────┘        └──────────┘   │
│  └──────────┘                                             │
│       │                                                    │
│       ▼                                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Provider Config Store                  │   │
│  │  • SQLite (local)                                  │   │
│  │  • Encrypted API keys                              │   │
│  │  • Provider presets                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Provider Interface

```typescript
interface AIProvider {
  // Core
  sendMessage(prompt: string, options?: MessageOptions): Promise<MessageResponse>;
  
  // Tools
  listTools(): Promise<Tool[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
  
  // Info
  getModel(): string;
  getProviderName(): string;
  
  // Lifecycle
  initialize(config: ProviderConfig): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

---

## Provider Adapters

### Codex Adapter

```typescript
class CodexAdapter implements AIProvider {
  private config: CodexConfig;
  
  async sendMessage(prompt: string, options?: MessageOptions): Promise<MessageResponse> {
    // Use Codex CLI or API
    const response = await this.executeCodex(['--prompt', prompt, ...options.args]);
    return this.parseResponse(response);
  }
  
  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    return this.executeCodex(['--tool', name, JSON.stringify(args)]);
  }
  
  async listTools(): Promise<Tool[]> {
    // Get from MCP manifest
    return this.getMCPTools();
  }
}
```

### Claude Code Adapter

```typescript
class ClaudeCodeAdapter implements AIProvider {
  async sendMessage(prompt: string, options?: MessageOptions): Promise<MessageResponse> {
    // Use Claude Code CLI
    return this.executeClaude(['--print', prompt]);
  }
  
  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    // Use Claude Code tool calling
    return this.executeClaude(['--tool', name, args]);
  }
}
```

### OpenCode Adapter

```typescript
class OpenCodeAdapter implements AIProvider {
  async sendMessage(prompt: string, options?: MessageOptions): Promise<MessageResponse> {
    // Use OpenCode CLI
    return this.executeOpenCode(['chat', prompt]);
  }
}
```

### Gemini CLI Adapter

```typescript
class GeminiCLIAdapter implements AIProvider {
  async sendMessage(prompt: string, options?: MessageOptions): Promise<MessageResponse> {
    // Use Gemini CLI
    return this.executeGemini(['--prompt', prompt]);
  }
}
```

### Nexus Adapter (Aitlas)

```typescript
class NexusAdapter implements AIProvider {
  private apiKey: string;
  
  async sendMessage(prompt: string, options?: MessageOptions): Promise<MessageResponse> {
    // Call Nexus orchestration API
    return this.post('/api/chat', { prompt, ...options });
  }
  
  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    return this.post('/api/tools/call', { tool: name, args });
  }
}
```

---

## Config Format Conversion

cc-switch shows this works - each CLI has different config:

| Provider | Config Format |
|----------|---------------|
| Claude Code | `settings.json` |
| Codex | `coderox.json` |
| OpenCode | `.env` |
| Gemini CLI | `gemini.json` |

### The Solution: Universal Config

```typescript
// nova-config.json - unified format
{
  "providers": {
    "claude-code": {
      "type": "claude-code",
      "enabled": true,
      "config": {
        "model": "sonnet-4-20250514",
        "apiKey": "env:ANTHROPIC_API_KEY"
      }
    },
    "codex": {
      "type": "codex",
      "enabled": true,
      "config": {
        "model": "claude-sonnet-4",
        "apiKey": "env:OPENAI_API_KEY"
      }
    },
    "nexus": {
      "type": "nexus",
      "enabled": true,
      "config": {
        "endpoint": "https://nexus.aitlas.xyz",
        "apiKey": "env:AITLAS_API_KEY"
      }
    }
  },
  "activeProvider": "nexus",
  "fallbackProviders": ["claude-code", "codex"]
}
```

---

## Provider Manager

```typescript
class ProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: string;
  private fallbackProviders: string[] = [];
  
  async initialize() {
    const config = await this.loadConfig();
    
    for (const [name, providerConfig] of Object.entries(config.providers)) {
      const adapter = this.createAdapter(providerConfig.type);
      await adapter.initialize(providerConfig.config);
      this.providers.set(name, adapter);
    }
    
    this.activeProvider = config.activeProvider;
    this.fallbackProviders = config.fallbackProviders;
  }
  
  async sendMessage(prompt: string, options?: MessageOptions): Promise<MessageResponse> {
    // Try active provider
    const provider = this.providers.get(this.activeProvider);
    try {
      return await provider.sendMessage(prompt, options);
    } catch (error) {
      // Fallback to next provider
      for (const fallback of this.fallbackProviders) {
        try {
          const fallbackProvider = this.providers.get(fallback);
          return await fallbackProvider.sendMessage(prompt, options);
        } catch (e) {
          continue;
        }
      }
      throw new Error('All providers failed');
    }
  }
  
  switchProvider(name: string) {
    this.activeProvider = name;
    this.saveConfig();
  }
}
```

---

## Skills Integration

From cc-switch: Skills are one-click install from GitHub.

```typescript
interface Skill {
  name: string;
  description: string;
  provider: string;
  prompts: string[];
  tools: string[];
}

class SkillManager {
  async installSkill(repoUrl: string): Promise<Skill> {
    // Clone repo
    // Parse skill.yaml
    // Install to provider
    // Register tools
  }
  
  async listInstalledSkills(): Promise<Skill[]> {
    return this.db.skills.findMany();
  }
}
```

---

## MCP Integration

Each provider exposes MCP tools:

```typescript
// Unified MCP manifest
{
  "providers": {
    "nexus": {
      "tools": [
        { "name": "twyt.post", "description": "Post to Twitter" },
        { "name": "library.search", "description": "Search knowledge" }
      ]
    },
    "claude-code": {
      "tools": [
        { "name": "Bash", "description": "Run shell command" },
        { "name": "Read", "description": "Read file" }
      ]
    }
  }
}
```

---

## UI Components

### Provider Selector
- Dropdown to switch between providers
- Visual indicator of active provider
- One-click enable/disable

### Provider Settings
- API key input (with env: prefix support)
- Model selection
- Custom endpoint (for self-hosted)

### Skills Browser
- Search from GitHub repos
- One-click install
- Enable/disable per provider

---

## Security

| Aspect | Implementation |
|--------|----------------|
| API Keys | Encrypted in SQLite (AES-256-GCM) |
| Config | Never commit to git |
| Environment | Support `env:VAR_NAME` syntax |
| Local Only | SQLite stored locally |

---

## Implementation Steps

1. **Provider Interface** - Define unified AIProvider interface
2. **Adapters** - Implement Codex, Claude Code, OpenCode, Gemini, Nexus
3. **Config Store** - SQLite with encryption
4. **Provider Manager** - Switch/fallback logic
5. **UI** - Provider selector, settings
6. **Skills** - GitHub install system
7. **MCP** - Unified tool registry

---

## References

- [cc-switch](https://github.com/farion1231/cc-switch)
- [T3Code](https://github.com/pingdotgg/t3code)

---

*Implementation guide for Nova multi-provider support*
