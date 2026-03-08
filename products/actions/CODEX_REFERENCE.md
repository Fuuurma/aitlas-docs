# Codex — Reference Only

**Status:** 🔵 Reference  
**Reference:** [openai/codex](https://github.com/openai/codex) (64K stars, Apache 2.0)  
**Note:** Competitor product — code is open, but not for integration.

---

## Overview

**Codex CLI** is OpenAI's coding agent (63K+ stars). It's a competitor to Claude Code, Pi, and similar tools.

---

## Why Reference Only

| Factor | Analysis |
|--------|----------|
| **Product** | Competitor (we build infrastructure, they build CLI) |
| **Tech stack** | Rust (we use TypeScript/Bun) |
| **License** | Apache 2.0 (can use, but complex) |
| **Integration** | Not practical — users already have Codex |

---

## What We Can Learn

Study Codex code for architectural insights:

- Agent loop patterns
- Tool execution design
- Terminal I/O handling
- LLM integration

---

## Strategic Decision

**Use Pi over Codex** for Aitlas:

| Factor | Pi | Codex |
|--------|-----|-------|
| Stars | 21K | 64K |
| Stack | TypeScript/Bun | Rust |
| License | MIT | Apache 2.0 |
| OpenClaw | Integrated | Not integrated |
| Extensibility | Designed for it | Standalone |

**Pi is our stack** — it's already integrated with OpenClaw and matches our TypeScript/Bun architecture.

---

## Reference Links

- [Codex GitHub](https://github.com/openai/codex)
- [Codex Docs](https://developers.openai.com/codex)
- [Pi Integration](./PI_INTEGRATION.md)

---

*Status: 🔵 Reference — Not for integration, study only*
