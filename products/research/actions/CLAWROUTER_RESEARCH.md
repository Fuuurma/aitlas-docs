# ClawRouter — Research

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Status:** 🔵 Research  
**Reference:** [BlockRunAI/ClawRouter](https://github.com/BlockRunAI/ClawRouter) (5.2K stars, MIT)  
**Use:** Model routing for BYOK users

---

## Overview

**ClawRouter** = Agent-native LLM router for OpenClaw.

> "The agent-native LLM router for OpenClaw. 41+ models, <1ms routing, USDC payments on Base & Solana via x402."

---

## Key Features

| Feature | Description |
|---------|-------------|
| **41+ models** | Multiple LLM providers |
| **<1ms routing** | Ultra-fast model selection |
| **USDC payments** | Micropayments via x402 |
| **OpenClaw integration** | Built for agent systems |

---

## For Aitlas: Model Routing

### The Use Case

With BYOK, users can provide **multiple API keys**:
- OpenAI key
- Anthropic key
- DeepSeek key
- Gemini key
- Groq key

**ClawRouter** lets us **route between models** based on:
- Task type (reasoning vs fast vs cheap)
- User preference
- Cost optimization
- Performance needs

### How It Works

```
User (BYOK): has 3 API keys
         │
         ▼
┌─────────────────────┐
│   ClawRouter        │
│  (Model Selection)  │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
 Claude       GPT-4
 (reasoning)  (fast)
```

### Aitlas Integration

| Feature | Use |
|---------|-----|
| **Multi-key routing** | Switch between user's keys |
| **Task-based routing** | Complex → Opus, Fast → 4o-mini |
| **Cost optimization** | Route to cheaper model when appropriate |
| **Fallback** | If one key fails, try another |

---

## MCP Tools (Potential)

```typescript
// Route to best model for task
route_model(task_type: string, preferences?: RoutingPreferences) → selected_model: ModelRoute

// Get user's available models
list_available_models() → models: UserModel[]

// Set routing rules
set_routing_rules(rules: RoutingRule[]) → success: boolean

// Fallback configuration
configure_fallback(primary: string, fallback: string) → success: boolean
```

---

## Comparison

| Feature | ClawRouter | Manual |
|---------|-----------|--------|
| Multi-key | ✅ | Manual |
| Auto-routing | ✅ | Manual |
| <1ms | ✅ | N/A |
| Micropayments | ✅ | N/A |

---

## Next Steps

1. **Evaluate** ClawRouter for Aitlas
2. **Consider** building similar routing layer
3. **Implement** multi-key management in Nexus

---

## References

- [ClawRouter GitHub](https://github.com/BlockRunAI/ClawRouter)
- [x402 Protocol](https://x402.org)

---

*Status: 🔵 Research - Lower priority (nice to have)*