# RTK Integration — Token Compression for Nexus runtime

**Version:** 1.0 | **Date:** March 2026 | **Status:** Draft  
**Parent:** nexus.md | **Type:** Internal Library Integration

---

## Overview

**RTK (Rust Token Killer)** is integrated as an **internal compression library** within Nexus runtime, acting as a universal token optimization layer for the entire Aitlas backbone.

This document specifies how RTK compresses all inputs/outputs flowing through Nexus runtime, reducing token consumption by 60-80% across Nexus, Agents, and Actions.

---

## Why RTK?

| Metric | Without RTK | With RTK | Improvement |
|--------|-------------|----------|-------------|
| Token cost per task | 100% | 20-40% | -60-80% |
| LLM latency | baseline | -30% | Faster |
| Context window usage | 100% | 20-40% | More headroom |

RTK is battle-tested (4,700+ stars), open-source (MIT), and extremely fast (<10ms overhead).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Aitlas Backbone                          │
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Nexus  │    │ Agents  │    │ Actions  │    │  Nexus runtime  │  │
│  │   UI    │    │  Store  │    │  (f.xyz) │    │  Worker  │  │
│  └────┬────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
│       │              │              │              │          │
│       └──────────────┼──────────────┼──────────────┘          │
│                      ↓                                            │
│             ┌────────────────┐                                   │
│             │  Input Layer  │                                   │
│             │ ┌──────────┐  │                                   │
│             │ │ RTK      │  │ ← COMPRESSION HAPPENS HERE       │
│             │ │ Compress │  │                                   │
│             │ └──────────┘  │                                   │
│             └───────┬────────┘                                   │
│                     ↓                                            │
│             ┌────────────────┐                                   │
│             │  LLM Provider │                                   │
│             └───────┬────────┘                                   │
│                     ↓                                            │
│             ┌────────────────┐                                   │
│             │ Output Layer   │                                   │
│             │ ┌──────────┐  │                                   │
│             │ │ RTK      │  │ ← OPTIONAL: COMPRESS OUTPUT       │
│             │ │ Compress │  │                                   │
│             │ └──────────┘  │                                   │
│             └───────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Compression Points

### 1. Task Input Compression

Before any task reaches the LLM, the input is compressed:

| Input Type | Compression Strategy |
|------------|---------------------|
| User message | Remove whitespace, truncate long context |
| Command output | RTK filters (see RTK patterns) |
| Agent prompt | Summarize system prompt |
| Tool output | Extract key data only |

### 2. Command Output Compression (Primary Use Case)

Nexus runtime executes commands — RTK compresses the output:

| Command | Without RTK | With RTK | Savings |
|---------|-------------|----------|---------|
| `git status` | ~2,000 tokens | ~400 tokens | -80% |
| `git diff` | ~10,000 tokens | ~2,500 tokens | -75% |
| `npm test` | ~25,000 tokens | ~2,500 tokens | -90% |
| `cargo test` | ~25,000 tokens | ~2,500 tokens | -90% |
| `cat file` | ~40,000 tokens | ~12,000 tokens | -70% |
| `grep` | ~16,000 tokens | ~3,200 tokens | -80% |

### 3. LLM Output Compression (Optional)

For cost-sensitive tasks, compress LLM output before storage:

| Output Type | Strategy |
|-------------|----------|
| Task result | Summarize if >2,000 tokens |
| Error messages | Keep last 5 lines |
| Logs | Extract key events only |

---

## Implementation

### Integration Point: Tool Gateway

```
┌────────────────────────────────────────┐
│         Tool Gateway                   │
│                                        │
│  1. Task received                     │
│         ↓                              │
│  2. Parse command                     │
│         ↓                              │
│  3. RTK.compress(command_args)         │
│         ↓                              │
│  4. Execute (shell)                   │
│         ↓                              │
│  5. RTK.compress(output)               │
│         ↓                              │
│  6. Return to LLM                     │
└────────────────────────────────────────┘
```

### Code Structure

```typescript
// src/lib/rtk.ts
import { compress } from '@rtk-ai/rtk';

export async function compressCommandOutput(
  command: string,
  output: string
): Promise<string> {
  // Detect command type
  const commandType = detectCommandType(command);
  
  // Apply appropriate compression
  return compress(output, {
    type: commandType,
    maxTokens: getMaxTokens(commandType),
    preserveErrors: true,
  });
}

export async function compressTaskInput(
  input: TaskInput
): Promise<CompressedInput> {
  return {
    message: compress(input.message, { type: 'text' }),
    context: input.context?.map(c => compress(c, { type: 'text' })),
    history: compressHistory(input.history), // Keep last N messages
  };
}
```

---

## Credit Model

RTK compression is **free** — it's a infrastructure optimization, not a billable feature.

| Component | Cost |
|-----------|------|
| RTK compression | Free (infrastructure) |
| Nexus runtime execution | Normal credits |
| Action calls | Normal credits |

**Rationale:** RTK reduces our LLM costs, so we don't charge for it. It's a competitive advantage.

---

## Future Enhancements

### 1. Adaptive Compression
- Low-priority tasks: aggressive compression
- High-priority tasks: minimal compression

### 2. Per-User Settings
```typescript
interface UserCompressionSettings {
  enabled: boolean;
  level: 'minimal' | 'balanced' | 'aggressive';
  excludedCommands: string[]; // e.g., ['git diff'] for code review
}
```

### 3. Custom Filters
Allow users to define regex patterns for their specific output formats.

---

## Comparison: RTK vs Alternatives

| Tool | Type | Tokens Saved | Speed | License |
|------|------|--------------|-------|---------|
| **RTK** | Library | 60-80% | <10ms | MIT |
| **LiteLLM** | Proxy | 20-40% | ~50ms | ISC |
| **Custom regex** | Ad-hoc | Varies | varies | - |

**RTK wins** because it's:
- Fastest (<10ms)
- Best compression (60-80%)
- Open source (no lock-in)

---

## Open Questions

1. **Depedency:** Should we use the Rust binary via FFI, or reimplement the compression logic in TypeScript?
2. **Caching:** Should we cache compressed outputs for repeated commands?
3. **Fallback:** What happens if RTK fails? Fallback to raw output?

---

## References

- [RTK GitHub](https://github.com/rtk-ai/rtk)
- [Nexus runtime Spec](../nexus/nexus.md)
- [Aitlas MCP Spec](../../architecture/AITLAS_MCP_SPEC.md)

---

*Draft — pending implementation decision on RTK integration approach.*
