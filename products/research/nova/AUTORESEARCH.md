# AutoResearch — Autonomous LLM Training Optimization

**Project:** [karpathy/autoresearch](https://github.com/karpathy/autoresearch)  
**Stars:** 21.5k ⭐ | **Language:** Python | **Created:** Mar 2026

---

## TL;DR

Andrej Karpathy's experiment: **AI agents running autonomous research on single-GPU LLM training**. Agent gets 5 minutes per experiment, modifies `train.py`, evaluates on `val_bpb`, and iterates autonomously until stopped.

---

## What It Does

The agent receives:
- A fixed 5-minute time budget per experiment
- Read-only access to `prepare.py` (data, tokenizer, eval harness)
- Full write access to `train.py` (model architecture, optimizer, hyperparameters)

The agent loop:
1. Modify `train.py` with an experimental idea
2. Run training → evaluate `val_bpb` (validation bits per byte)
3. If improved → keep the change
4. If worse → revert and try something else
5. **Repeat indefinitely** until manually stopped

Example output:
```
val_bpb:          0.997900
training_seconds: 300.1
peak_vram_mb:     45060.2
mfu_percent:      39.80
```

---

## Architecture

| File | Access | Purpose |
|------|--------|---------|
| `prepare.py` | Read-only | Data prep, tokenizer, evaluation harness |
| `train.py` | Write | Model architecture, optimizer, training loop |
| `program.md` | Read | Agent instructions (fixed prompt) |
| `results.tsv` | Append | Experiment log (untracked) |

**Key constraints:**
- No new dependencies allowed (only `pyproject.toml`)
- Fixed 5-minute budget per run
- Must finish within budget
- Simplicity matters: small gains with high complexity are rejected

---

## For Aitlas — Where It Fits

### Nova (Auto-Tune Feature)

Nova could integrate AutoResearch as an **"auto-improvement"** layer:

```
User uploads dataset → describes goal → Nova agent autonomously experiments with:
- Model architecture tweaks
- Hyperparameter tuning
- Training loop modifications
- Continues until user stops or improvement plateaus
```

**Use cases:**
- Fine-tune a code completion model for a specific stack
- Optimize a summarization model for latency vs quality tradeoff
- Auto-tune hyperparameters for a given dataset size

### Nexus (Orchestration Pattern)

Nexus could adopt the **autonomous loop pattern** for:
- Automated API optimization workflows
- Self-healing pipeline architectures
- Continuous improvement agents for other actions

---

## Competitive Advantage

| Platform | Auto-Tuning Approach |
|----------|---------------------|
| **Nova + AutoResearch** | Agent modifies actual training code, not just hyperparameters |
| **GPT-4o fine-tuning** | Black-box, no autonomous experimentation |
| **OpenAI Fine-tuning API** | Static, no auto-improvement |
| **AutoML tools** | Grid/random search, not LLM-driven |

This is **real AutoML** — the agent reasons about architecture changes, not just parameter sweeps.

---

## Implementation Path

### Phase 1: Research (Nova)
- [ ] Clone and run AutoResearch locally
- [ ] Understand the eval harness (`prepare.py`)
- [ ] Test with different model sizes

### Phase 2: Integration Prototype
- [ ] Wrap AutoResearch as a Nova feature
- [ ] Add UI for goal description + dataset upload
- [ ] Display progress (val_bpb over time)

### Phase 3: Production
- [ ] Multi-GPU support (current is single-GPU)
- [ ] Cloud execution (currently runs locally)
- [ ] Result persistence and comparison

---

## Related Research

- **Mastra** (22k ⭐) — TypeScript-first agent framework, could integrate the loop pattern
- **trigger.dev** (13.9k ⭐) — Background execution for long-running experiments
- **Agent frameworks** — AutoGen, crewAI for multi-agent orchestration

---

## References

- Repo: https://github.com/karpathy/autoresearch
- Program: https://github.com/karpathy/autoresearch/blob/master/program.md
- Karpathy's tweet: https://x.com/karpathy/status/1906437137155989504
