# Pi Integration — AI Agent Toolkit

**Status:** 🟡 Research  
**Reference:** [pi-mono](https://github.com/badlogic/pi-mono) (21K stars, MIT)  
**Author:** badlogic (Mario Zechner)

---

## Overview

**Pi** is a comprehensive AI agent toolkit by badlogic (Mario Zechner). It's a monorepo with packages for coding agents, LLM APIs, UI components, and deployment tools.

**Critical:** Pi is already integrated with **OpenClaw** (see: `See [openclaw/openclaw](https://github.com/openclaw/openclaw) for a real-world SDK integration`).

---

## Why Pi Matters for Aitlas

Pi provides a **complete agent framework** that could power multiple parts of Aitlas:

| Pi Package | Aitlas Equivalent | Potential Use |
|------------|------------------|---------------|
| `pi-coding-agent` | Nexus Core | Terminal-based coding agent |
| `pi-ai` | Nexus LLM Layer | Unified multi-provider LLM API |
| `pi-agent-core` | f.loop | Agent runtime with tool calling |
| `pi-tui` | Nexus UI (TUI) | Terminal UI components |
| `pi-web-ui` | Nexus UI (Web) | Web chat components |
| `pi-mom` | Future: Slack Bot | Slack integration |
| `pi-pods` | f.decloy | vLLM deployment |

---

## Pi Packages Deep Dive

### pi-ai — Unified LLM API

```typescript
import { createAI } from "@mariozechner/pi-ai";

// Multi-provider support
const ai = createAI({
  provider: "anthropic", // openai, google, etc.
  model: "claude-3-5-sonnet-20241022",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Tool calling
const response = await ai.messages.create({
  model: "claude-3-5-sonnet-20241022",
  messages: [{ role: "user", content: "Hello" }],
  tools: [
    {
      name: "bash",
      description: "Run a shell command",
      input_schema: { type: "object", properties: { command: { type: "string" } } }
    }
  ]
});
```

**Providers supported:**
- Anthropic (Claude)
- OpenAI
- Google (Gemini)
- Groq
- More coming

---

### pi-agent-core — Agent Runtime

```typescript
import { createAgent } from "@mariozechner/pi-agent-core";

const agent = createAgent({
  model: "claude-3-5-sonnet-20241022",
  tools: [readTool, writeTool, editTool, bashTool],
  maxSteps: 100,
});

const result = await agent.run({
  prompt: "Fix the bug in src/index.ts",
  context: { files: await getFileTree() }
});
```

**Features:**
- Tool calling
- State management
- Session support
- Extensible

---

### pi-coding-agent — CLI

```bash
npm install -g @mariozechner/pi-coding-agent

pi                    # Interactive mode
pi --json             # JSON output
pi --help             # CLI options
```

**Modes:**
- Interactive (terminal)
- Print (one-shot)
- JSON (machine-readable)
- RPC (process integration)
- SDK (embed in apps)

---

### pi-mom — Slack Bot

```typescript
import { createMoM } from "@mariozechner/pi-mom";

const mom = createMoM({
  slackToken: process.env.SLACK_TOKEN,
  ai: createAI({ provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY }),
});

mom.onMessage(async (message) => {
  if (message.mentionsPi) {
    const response = await mom.delegateToAgent(message.text);
    await message.reply(response);
  }
});
```

---

### pi-pods — vLLM Deployment

```bash
pi-pods deploy --model meta-llama/Llama-3.1-70B-Instruct
pi-pods list
pi-pods logs <pod-id>
pi-pods destroy <pod-id>
```

---

## Integration Options for Aitlas

### Option 1: Use Pi as Nexus Core

Build Nexus on top of Pi's agent framework:

```
Nexus = Pi Agent + Aitlas UI + MCP + Credits
```

**Pros:**
- Battle-tested (21K stars, OpenClaw uses it)
- Well-maintained
- Multi-provider LLM support
- Tool calling built-in

**Cons:**
- We'd depend on external project
- May need significant customization

---

### Option 2: Reference Implementation

Use Pi as a reference for building our own:

```
Aitlas = Study Pi + Build Custom (with Aitlas DNA)
```

**Pros:**
- Full control
- Aitlas-specific features (credits, BYOK)
- Custom integrations

**Cons:**
- More development time

---

### Option 3: Integration Only

Connect Pi as an external action:

```
Pi → MCP → Nexus/Agents
```

**Pros:**
- Quick to implement
- No dependency

**Cons:**
- Less integrated

---

## Recommended Approach

### Phase 1: Reference + Integration
- Study Pi's architecture
- Use pi-ai as reference for our LLM layer
- Connect Pi via MCP as external agent

### Phase 2: Deep Integration
- Evaluate using pi-agent-core for f.loop
- Consider pi-tui for terminal Nexus
- Explore pi-mom for Slack bot

### Phase 3: Potential Acquisition/Partnership
- Contact badlogic (Mario Zechner)
- Discuss deeper integration or partnership
- Potential to power entire Aitlas agent layer

---

## Pi vs Alternatives

| Feature | Pi | LangChain | LlamaIndex | OpenAI SDK |
|---------|-----|-----------|------------|------------|
| Stars | 21K | 97K | 37K | 12K |
| License | MIT | MIT | MIT | MIT |
| Agent runtime | ✅ | ✅ | ✅ | ❌ |
| Multi-provider | ✅ | ✅ | ✅ | ❌ |
| TUI | ✅ | ❌ | ❌ | ❌ |
| Slack bot | ✅ | ❌ | ❌ | ❌ |
| vLLM pods | ✅ | ❌ | ❌ | ❌ |

---

## Next Steps

1. **Deep dive** into pi-agent-core architecture
2. **Test** pi-coding-agent locally
3. **Evaluate** f.loop vs pi-agent-core
4. **Prototype** Pi integration via MCP
5. **Contact** badlogic for potential partnership

---

## References

- [Pi GitHub](https://github.com/badlogic/pi-mono)
- [Pi Website](https://pi.dev)
- [Pi Coding Agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent)
- [OpenClaw Integration](https://github.com/openclaw/openclaw)
- [Mario Zechner](https://github.com/badlogic)

---

*Status: 🟡 Research — Evaluating integration potential*
