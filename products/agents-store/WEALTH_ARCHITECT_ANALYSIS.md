# Professional System Prompt Analysis: Wealth Architect

**Source:** X/Twitter ( leaked system prompt )  
**Analysis Date:** 2026-03-08  
**Quality Level:** ⭐⭐⭐⭐⭐ Professional Grade

---

## Overview

This is a **Personal Wealth Architect** agent system prompt - one of the most sophisticated and well-structured examples we ' ve seen. It demonstrates professional -grade prompt engineering for specialized agents.

---

## Structure Analysis

### 1. System Identity Block

```json
{
  "system_identity": {
    "role": "Personal Wealth Architect",
    "persona": {
      "model": "...",
      "tone": "...",
      "core_belief": "...",
      "what_this_is_not": "..."
    },
    "core_mission": "...",
    "forbidden_behaviors": [...]
  }
}
```

**Key Insights:**
- **Persona definition** includes backstory (" built wealth from nothing, lost it, rebuilt it ")
- **Tone** is explicitly defined ( "Direct, precise, zero tolerance for magical thinking" )
- **Core belief** states the fundamental methodology
- **What this is NOT** sets clear boundaries
- **Forbidden behaviors** list 8 specific things to avoid

---

### 2. Activation Protocol

```json
{
  "activation_protocol": {
    "on_context_load": "Output exactly this and nothing else:\n\n'wealth architect loaded...'"
  }
}
```

**Key Insights:**
- **Exact output** specified for first interaction
- **Immediate value** - starts diagnostic right away
- **Sets expectations** - "answer honestly"
- **Structured blocks** - 5 questions per block

---

### 3. Diagnostic Protocol

```json
{
  "diagnostic_protocol": {
    "method": "Six sequential blocks...",
    "challenge_rule": "If an answer reveals a contradiction... name the contradiction directly",
    "pattern_tracking": "Track across all blocks: income, savings, debt, skills, time, risk",
    "block_transition": "After each block, deliver one observation — one sentence, factual, no advice yet"
  }
}
```

**Key Insights:**
- **6 blocks, 30 total questions** - comprehensive diagnostic
- **Challenge rule** - confront contradictions, don't smooth over
- **Pattern tracking** - 6 variables tracked across all blocks
- **No partial advice** - wait for complete picture

---

### 4. Wealth Phases ( Framework )

| Phase | Criteria | Priority |
|-------|----------|----------|
| **0 - Survival** | Expenses ≥ Income, debt growing | Stop the bleed, build 3-month buffer |
| **1 - Foundation** | Income > Expenses, some savings | 20%+ savings rate, 6-month emergency fund |
| **2 - Income Acceleration** | Foundation stable, income ceiling visible | Build second income stream |
| **3 - Wealth Compounding** | Significant surplus, debt controlled | Deploy into compounding vehicles |
| **4 - Protection & Leverage** | Meaningful net worth, multiple streams | Optimize tax, leverage assets |

---

### 5. Wealth Blockers ( Root Causes )

| ID | Blocker | Description |
|----|---------|-------------|
| **WB1** | Income Floor Too Low | Not enough surplus to build wealth |
| **WB2** | Spending Expansion | Lifestyle expands with income |
| **WB3** | Debt Drain | High-interest debt consuming surplus |
| **WB4** | No Compounding Vehicle | Money sitting idle |
| **WB5** | Wrong Vehicle for Profile | Strategy doesn't match skills/resources |
| **WB6** | Behavioral Override | Psychology undoes progress |

---

### 6. Output Structure

**10 Sections:**
1. **YOUR FINANCIAL REALITY** - Factual snapshot
2. **YOUR WEALTH PHASE** - Which phase applies
3. **PRIMARY WEALTH BLOCKER** - Root cause
4. **SECONDARY BLOCKERS** - Additional constraints
5. **THE WEALTH PATH** - Specific sequence
6. **THE NUMBER SYSTEM** - 3 concrete targets
7. **THE 12-MONTH EXECUTION PLAN** - Quarterly breakdown
8. **THE FINANCIAL SYSTEM** - Money management structure
9. **THE HARD TRUTH** - What they're avoiding
10. **FIRST ACTION** - Single action in 72 hours

---

## Key Patterns to Adopt

### Pattern 1: Exact Activation Output
```
"Output exactly this and nothing else:\n\n'wealth architect loaded...'"
```
**Why:** Prevents AI from adding fluff, ensures consistent first impression.

### Pattern 2: Forbidden Behaviors List
```json
"forbidden_behaviors": [
  "Generic advice that applies to everyone",
  "Recommending investments without understanding baseline",
  "Skipping the diagnostic phase",
  ...
]
```
**Why:** Constrains AI behavior, prevents common failure modes.

### Pattern 3: Challenge Rule
```
"If an answer reveals a contradiction... name the contradiction directly"
```
**Why:** Prevents AI from being a "yes man", forces honest assessment.

### Pattern 4: Structured Diagnostic
```
6 blocks × 5 questions = 30 questions total
Each block has specific purpose
No advice until all blocks complete
```
**Why:** Ensures comprehensive data collection before recommendations.

### Pattern 5: Numbered Frameworks
```
5 Wealth Phases
6 Wealth Blockers
10 Output Sections
```
**Why:** Creates mental model, easy to reference, structured output.

### Pattern 6: Accountability Loop
```json
"ongoing_rules": {
  "accountability": "If the user returns without having taken the first action, address this before anything else"
}
```
**Why:** Forces action, not just planning.

---

## Comparison with Other Professional Agents

| Feature | Wealth Architect | Manus | Claude Code |
|---------|-----------------|-------|-------------|
| **Activation Protocol** | ✅ Exact output | ❌ | ❌ |
| **Forbidden Behaviors** | ✅ 8 specific | ❌ | ❌ |
| **Diagnostic Protocol** | ✅ 6 blocks, 30 Qs | ❌ | ❌ |
| **Challenge Rule** | ✅ Explicit | ❌ | ❌ |
| **Numbered Frameworks** | ✅ 5 phases, 6 blockers | ✅ Capabilities list | ✅ Tools list |
| **Output Structure** | ✅ 10 sections | ❌ | ❌ |
| **Accountability Loop** | ✅ Explicit | ❌ | ❌ |

**Verdict:** Wealth Architect is the most sophisticated example we've seen.

---

## Recommendations for Aitlas Agents

### 1. Adopt Activation Protocol
Every Aitlas agent should have:
```json
{
  "activation_protocol": {
    "on_context_load": "Output exactly: '{agent_name} loaded. {brief purpose}. Let's start with...'"
  }
}
```

### 2. Add Forbidden Behaviors
Every agent should have 5-10 forbidden behaviors specific to their domain.

### 3. Use Diagnostic Protocol for Complex Agents
For agents dealing with complex domains (finance, health, legal):
- Use multi-block diagnostic
- Track key variables across blocks
- Don't give advice until diagnostic complete

### 4. Use Challenge Rule for Advisory Agents
For agents in advisory roles:
```
"If user claims X but demonstrates Y, name the contradiction directly"
```

### 5. Structure Output with Numbered Sections
For comprehensive outputs, use 8-12 numbered sections:
1. Current Reality
2. Phase/Stage
3. Primary Blocker
4. Secondary Blockers
5. Recommended Path
6. Numbered Targets
7. Execution Plan
8. Hard Truth
9. First Action

---

## Implementation for Aitlas

### Template Structure
```yaml
agent:
  identity:
    role: "..."
    persona: { model, tone, core_belief, what_this_is_not }
    mission: "..."
    forbidden_behaviors: [...]
  
  activation:
    on_load: "exact output string"
  
  diagnostic:
    enabled: true/false
    blocks: [...]
    pattern_tracking: [...]
  
  framework:
    phases: [...]
    blockers: [...]
  
  output:
    sections: [...]
  
  ongoing:
    rules: [...]
    accountability: "..."
```

---

## Example: f.investor Agent with This Pattern

```json
{
  "system_identity": {
    "role": "Investment Research Analyst",
    "persona": {
      "model": "Thinks like a institutional analyst who has seen every market cycle. Understands that most retail investors lose money by buying high and selling low. Knows that risk management beats return chasing.",
      "tone": "Analytical, data-driven, transparent about uncertainty. Never guarantees returns. Always cites sources. Presents bull and bear cases.",
      "core_belief": "Successful investing is not about picking winners — it's about managing risk and position sizing. The sequence matters more than the individual picks.",
      "what_this_is_not": "This is not financial advice. This is not a get-rich-quick scheme. This is research and analysis to inform your own decisions."
    },
    "forbidden_behaviors": [
      "Making personalized investment recommendations",
      "Guaranteeing any returns",
      "Recommending positions without understanding user's risk tolerance",
      "Ignoring risk factors",
      "Cherry-picking data to support a thesis",
      "Recommending leverage without explicit risk discussion"
    ]
  }
}
```

---

**Conclusion:** The Wealth Architect prompt represents the state-of-the-art in professional agent system prompts. Aitlas should adopt its patterns for all advisory and complex-domain agents.

---

**Last Updated:** 2026-03-08