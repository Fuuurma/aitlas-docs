# Scrapling — Research

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Status:** 🔵 Research  
**Reference:** [D4Vinci/Scrapling](https://github.com/D4Vinci/Scrapling) (26K stars, BSD-3-Clause)  
**Use:** Web scraping for f.scrape or f.research

---

## Overview

**Scrapling** is an adaptive web scraping framework in Python.

> "An adaptive Web Scraping framework that handles everything from a single request to a full-scale crawl!"

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Adaptive Parsing** | Parser learns from website changes, auto-relocates elements |
| **Stealth Mode** | Bypasses Cloudflare Turnstile, anti-bot systems |
| **Spider Framework** | Scale to concurrent crawls with pause/resume |
| **Proxy Rotation** | Built-in automatic proxy rotation |
| **MCP Server** | ✅ Already has MCP integration! |
| **CLI** | Command-line interface |

---

## For Aitlas

### Option 1: f.scrape (New Action)

Create a dedicated scraping action:

```
f.scrape(url, selector, options) → HTML/JSON
```

**MCP tools:**
- `scrape_page(url, selector)`
- `scrape_stealth(url)` — bypass anti-bot
- `crawl_site(url, options)` — full crawl
- `extract_data(selector)`

### Option 2: Integrate into f.research

Use Scrapling as the web scraping engine for f.research:
- Better than current web scraping
- Stealth mode for protected sites
- Adaptive parsing survives site changes

---

## Comparison

| Feature | Scraping | BeautifulSoup | Playwright |
|---------|----------|---------------|------------|
| Stars | 26K | 11K | - |
| Adaptive | ✅ | ❌ | ❌ |
| Stealth | ✅ | ❌ | Partial |
| MCP | ✅ | ❌ | ❌ |
| Proxy | ✅ | ❌ | ❌ |

---

## Implementation

Since it's Python-based, we'd need:
1. Python runtime (or use as external service)
2. MCP wrapper in TypeScript
3. Or: call via subprocess from our Bun runtime

**Easier path:** Use their MCP server directly!

---

## Next Steps

1. Test Scrapling MCP server
2. Evaluate for f.research upgrade
3. Consider f.scrape action

---

## References

- [Scrapling GitHub](https://github.com/D4Vinci/Scrapling)
- [Scrapling Docs](https://scrapling.readthedocs.io/)
- [MCP Server](https://scrapling.readthedocs.io/en/latest/ai/mcp-server/)

---

*Status: 🔵 Research - Strong candidate for f.scrape or f.research*