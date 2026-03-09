# sanyuan-skills — Research

**Status:** 🔵 Research  
**Reference:** [sanyuan0704/sanyuan-skills](https://github.com/sanyuan0704/sanyuan-skills) (2.5K stars, MIT)  
**Use:** Agents Store / Skills

---

## Overview

**sanyuan-skills** = Production-grade agent skills for Claude Code.

> "A collection of production-grade agent skills for Claude Code and other AI agent terminals."

---

## Skills

| Skill | Description |
|-------|-------------|
| **Code Review Expert** | Senior engineer code review (SOLID, security, performance, error handling) |
| **Sigma** | 1-on-1 AI tutor (Bloom's 2-Sigma mastery learning) |
| **Skill Forge** | Meta-skill for creating high-quality skills |

---

## For Aitlas: Agents Store / Skills

### This is for Skills!

Similar to Agency Agents but focused on **individual skills** that agents can use.

```
┌─────────────────────────────────────────┐
│           Agents Store                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         Agents                     │   │
│  │   (Personas + workflows)         │   │
│  └─────────────────────────────────┘   │
│                  │                        │
│  ┌─────────────────────────────────┐   │
│  │         Skills                     │   │
│  │   (sanyuan-skills style)        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Skills Format

```bash
npx skills add sanyuan0704/sanyuan-skills --path skills/code-review-expert
```

Then invoke:
```bash
/code-review-expert    # Review current git changes
/sigma <topic>         # Start a tutoring session
/skill-forge           # Create a new skill
```

---

## Comparison

| Feature | sanyuan-skills | Agency Agents |
|---------|---------------|---------------|
| Stars | 2.5K | 12.7K |
| Focus | Individual skills | Complete agents |
| Format | Claude Code skills | Multi-tool agents |
| MIT | ✅ | ✅ |

---

## Use for Aitlas

1. **Import** skills to Agents Store
2. **Convert** to Aitlas format
3. **Combine** with Agency Agents

---

## References

- [sanyuan-skills GitHub](https://github.com/sanyuan0704/sanyuan-skills)

---

*Status: 🔵 Research - Good for Agents Store Skills*
