# f.finance — AI Stock Analysis

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Domain:** f.finance.aitlas.xyz  
**Status:** 🟡 Research (AI Hedge Fund Integration)  
**Credits:** 2/analyze, 5/deep-dive, 1/signal, 3/portfolio  
**Engine:** [AI Hedge Fund](https://github.com/virattt/ai-hedge-fund) (47K stars)  
**License:** Custom (educational/research)

---

## Strategic Value

**f.finance = Multi-agent stock analysis** — powered by AI Hedge Fund, enhanced with real data APIs.

Ait differentiation:
- **Multi-agent analysis** — 18 investor personas (Buffett, Burry, Cathie Wood, etc.)
- **Graceful degradation** — Works without API keys (just worse results)
- **BYOK** — Users bring their own data API keys
- **Real-time data** — Optional premium APIs

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      f.finance                              │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │AI HedgeFund │───▶│   Next.js   │───▶│    Nexus    │   │
│  │   Engine    │    │      UI     │    │  Integration│   │
│  └─────────────┘    └─────────────┘    └─────────────┘   │
│         │                   │                  │            │
│    • Analysis           • Dashboard            MCP           │
│    • Signals            • Watchlist          • Agents      │
│    • Portfolio          • Alerts                            │
│                                              • BYOK        │
└─────────────────────────────────────────────────────────────┘
```

---

## Graceful Degradation

**Critical design:** f.finance works even without any API keys.

| Data Available | Results Quality | Features |
|---------------|-----------------|----------|
| No API keys | Basic | Limited analysis, generic signals |
| LLM only | Good | Multi-agent analysis, no real data |
| + Financial API | Better | Real-time prices, fundamentals |
| + News API | Best | Sentiment, breaking news |

### User Experience

```
┌─────────────────────────────────────────────┐
│  f.finance Setup                            │
│                                             │
│  [Optional] Connect financial data API     │
│  → Alpha Vantage / Yahoo Finance / IEX     │
│                                             │
│  [Optional] Connect news API                │
│  → NewsAPI / GDELT                         │
│                                             │
│  [Optional] Connect LLM                     │
│  → OpenAI / Claude / Gemini                │
│                                             │
│  Results improve with each connection!      │
└─────────────────────────────────────────────┘
```

---

## Architecture

### Components

| Component | Tech | Description |
|-----------|------|-------------|
| **UI** | Next.js (ui-template) | Full dashboard |
| **API** | Hono (action-template) | MCP endpoint + REST |
| **Engine** | AI Hedge Fund | Multi-agent analysis |
| **Data** | User's API (BYOK) | Optional real data |
| **LLM** | User's key (BYOK) | Optional premium |
| **DB** | PostgreSQL + pgvector | Watchlist, history |

### Data Sources (User Provides)

| Source | Type | Required | Cost |
|--------|------|----------|------|
| **Yahoo Finance** | Prices | Optional | Free |
| **Alpha Vantage** | Fundamentals | Optional | Freemium |
| **IEX Cloud** | Market data | Optional | Freemium |
| **NewsAPI** | Sentiment | Optional | Freemium |
| **OpenAI** | LLM | Optional | Pay per use |
| **Anthropic** | LLM | Optional | Pay per use |

---

## MCP Tools

### `analyze_stock`

Multi-agent stock analysis.

```typescript
{
  ticker: string;              // e.g., "AAPL"
  focus?: ("value" | "growth" | "contrarian" | "income")[];
  include_agents?: string[];  // Specific agents to use
}
```

**Returns:**
```typescript
{
  analysis_id: string;
  ticker: string;
  price: number;               // Current price (if API available)
  signals: {
    overall: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
    by_agent: Record<string, {
      signal: string;
      conviction: number;
      reasoning: string;
    }>;
  };
  recommendations: string[];
  risk_metrics: {
    volatility: number;
    beta?: number;
    recommendation: string;
  };
  analysis_summary: string;
}
```

---

### `get_trading_signal`

Quick trading signal.

```typescript
{
  ticker: string;
}
```

**Returns:**
```typescript
{
  signal_id: string;
  ticker: string;
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  conviction: number;         // 1-10
  key_reasons: string[];
  timeframe: "short" | "medium" | "long";
}
```

---

### `compare_stocks`

Compare multiple stocks.

```typescript
{
  tickers: string[];          // e.g., ["AAPL", "GOOGL", "MSFT"]
  metrics?: ("value" | "growth" | "dividend" | "momentum")[];
}
```

---

### `analyze_portfolio`

Portfolio analysis and recommendations.

```typescript
{
  holdings: Array<{
    ticker: string;
    shares: number;
    avg_cost: number;
  }>;
  target_allocation?: Record<string, number>;
  risk_tolerance?: "conservative" | "moderate" | "aggressive";
}
```

**Returns:**
```typescript
{
  analysis_id: string;
  current_value: number;
  allocation: Allocation[];
  recommendations: Array<{
    action: "buy" | "sell" | "hold";
    ticker: string;
    shares?: number;
    reason: string;
  }>;
  risk_score: number;
  diversification_score: number;
}
```

---

### `get_market_sentiment`

Market sentiment analysis.

```typescript
{
  ticker?: string;            // Optional specific ticker
  market?: "us" | "crypto" | "forex";
}
```

---

### `add_to_watchlist`

Add stock to watchlist.

```typescript
{
  ticker: string;
  notes?: string;
  alert_price?: number;
}
```

---

### `get_watchlist`

Get user's watchlist.

```typescript
{
  include_alerts?: boolean;
}
```

---

## Agent Personas

The AI Hedge Fund uses 18 investor agents:

| Agent | Style | Focus |
|-------|-------|-------|
| Warren Buffett | Value | Wonderful businesses at fair price |
| Charlie Munger | Value | Wide moat, fair price |
| Michael Burry | Contrarian | Deep value, short candidates |
| Cathie Wood | Growth | Innovation, disruption |
| Bill Ackman | Activist | Bold positions |
| Peter Lynch | Growth | Ten-baggers |
| Ben Graham | Value | Margin of safety |
| Phil Fisher | Growth | Scuttlebutt research |
| Aswath Damodaran | Value | Valuation specialist |
| + 8 more | Various | Specialized |

---

## Credit Model

| Action | Credits | Notes |
|--------|---------|-------|
| Quick signal | 1 | 30 seconds |
| Stock analysis | 2 | ~2 minutes |
| Deep dive | 5 | ~5 minutes, all agents |
| Portfolio analysis | 3 | Full allocation |
| Watchlist (per item) | 0.1 | Per month |

**Data costs:** User pays via their own API keys (BYOK)

---

## UI Screens

### 1. Dashboard
- Portfolio overview
- Active signals
- Top opportunities
- Market sentiment

### 2. Stock Analysis
- Multi-agent analysis results
- Individual agent views
- Price chart
- Key metrics

### 3. Watchlist
- Tracked stocks
- Price alerts
- Signal changes

### 4. Portfolio
- Holdings view
- Allocation chart
- Rebalancing suggestions

### 5. Settings
- Connect APIs
- Default agents
- Risk preferences

---

## Future Enhancements

### v2.0
- **Crypto support** — BTC, ETH analysis
- **Options analysis** — Options strategies
- **Real trading** — Paper trading (maybe)

### v3.0
- **Auto-screening** — Screeners for criteria
- **Alerts** — Push notifications
- **Social** - Share insights

---

## References

- [AI Hedge Fund GitHub](https://github.com/virattt/ai-hedge-fund)
- [Alpha Vantage](https://www.alphavantage.co/)
- [Yahoo Finance API](https://financeapi.net/)
- [IEX Cloud](https://iexcloud.io/)

---

*Status: 🟡 Research — Evaluating AI Hedge Fund integration*