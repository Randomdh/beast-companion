# Beast Companion

Your personal AI assistant for [A Kid Called Beast](https://akidcalledbeast.com) collecting.

Beast Companion runs on [OpenClaw](https://github.com/openclaw/openclaw) — a self-hosted AI agent platform. Unlike broadcast bots, this runs on YOUR device with YOUR data. It learns your preferences, tracks your wallet, and helps you find opportunities.

---

## What Can It Do?

| Feature | Description |
|---------|-------------|
| **Portfolio Analysis** | Score your collection, identify gaps, get suggestions |
| **Smart Search** | "Find me a Robot under 0.15 ETH with vibe 60+" |
| **Beast Evaluation** | Full breakdown with buy/hold/pass recommendations |
| **Personal Alerts** | Watch for specific traits, prices, or opportunities |
| **Market Briefs** | Daily summaries tailored to your portfolio |
| **Collecting Journal** | Track your thesis and notes on each beast |

---

## Before You Start

**Beast Companion requires OpenClaw.** There are two paths:

### Option A: Kimi Claw (Zero Setup)

[Kimi Claw](https://kimi.com/bot) runs OpenClaw in your browser — no server, no terminal, no 30-minute setup.

1. Sign up for [Kimi.ai](https://kimi.ai) (Allegretto plan or higher)
2. Access Kimi Claw at kimi.com/bot
3. Install Beast Companion via "Bring Your Own Claw" (instructions coming)

**Pros**: Zero setup, 40GB storage, 5000+ skills included
**Cons**: Beta access only, Chinese data jurisdiction

### Option B: Self-Hosted OpenClaw

Full control, fully private. Requires some technical comfort.

1. Install [OpenClaw](https://github.com/openclaw/openclaw) (Node.js 22+ required)
2. Configure your AI provider (see below)
3. Install Beast Companion plugin

---

## Critical: Cost & Performance Setup

OpenClaw can be expensive without optimization. **Complete these steps before heavy use.**

### 1. Install a Memory Plugin (Required)

Without a memory plugin, OpenClaw burns tokens exponentially. Users report $800+/month without optimization.

**Recommended: QMD** (60-97% token reduction, fully local, zero API cost)

```bash
# Install QMD
cd ~/.openclaw/extensions
git clone https://github.com/levineam/qmd-skill
```

Alternatives: [MemOS](https://github.com/memos-ai/openclaw-plugin) (72% reduction), [Mem0](https://github.com/mem0ai/openclaw-mem0)

### 2. Configure Your Model (Required)

Your AI provider choice dramatically affects cost. **We recommend Kimi K2.5** — it's 8x cheaper than Claude and handles 90% of tasks equally well.

| Model | Cost per 1M tokens | Quality | Recommendation |
|-------|-------------------|---------|----------------|
| Kimi K2.5 | ~$0.60 | Excellent | **Default choice** |
| Claude Haiku | ~$0.25 | Good | Simple queries |
| Claude Sonnet | ~$3.00 | Great | Complex analysis |
| Claude Opus | ~$15.00 | Best | Deep reasoning only |
| Local (LMStudio) | $0 | Varies | Privacy-focused |

Configure in `~/.openclaw/openclaw.json`:
```json
{
  "providers": {
    "kimi": {
      "apiKey": "YOUR_KIMI_API_KEY"
    }
  },
  "defaults": {
    "model": "kimi-k2.5"
  }
}
```

### 3. Run Security Audit (Required)

OpenClaw has deep system access. Before first use:

```bash
openclaw security audit --deep
```

Review and address any findings. See [SECURITY.md](docs/SECURITY.md) for details.

### Expected Monthly Costs

| Usage | With Optimization | Without |
|-------|-------------------|---------|
| Casual (few queries/day) | $5-15 | $30-50 |
| Active (hourly use) | $30-80 | $150-300 |
| Power user (always on) | $100-200 | $800-1500 |

---

## Installation

### Step 1: Clone the Plugin

```bash
cd ~/.openclaw/extensions
git clone https://github.com/akcb/beast-companion.git
cd beast-companion
npm install
npm run build
```

### Step 2: Configure

Add to `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "beast-companion": {
      "enabled": true,
      "dataSource": "remote",
      "dataApiUrl": "http://129.158.41.81:3100",
      "walletAddresses": [
        "0xYourWalletAddress"
      ]
    }
  }
}
```

### Step 3: Restart OpenClaw

```bash
openclaw restart
```

### Step 4: Verify

```
You: What's in my wallet?
AI: [Analyzes your AKCB holdings...]
```

---

## Usage Examples

```
You: What's in my wallet?
AI: You have 7 beasts with an average composite of 62. Your strongest
    is #4521 (composite 78, Cowboy archetype). You're light on Robot
    traits — consider adding one for archetype diversity.

You: Find me a Wolf under 0.15 ETH
AI: Found 3 Wolf listings under 0.15 ETH:
    - #2341: 0.12 ETH, composite 58, clean suit
    - #5672: 0.14 ETH, composite 64, vibe 71
    - #1893: 0.098 ETH, composite 45, project piece

You: Evaluate beast 4521
AI: Beast #4521 Analysis:
    Composite: 78 (top 15%)
    Vibe: 64 | Reputation: 72
    Archetype: Cowboy (cohesive)
    Top traits: Shaykhah (heating), Gold Chain
    Recommendation: HOLD — strong fundamentals, Shaykhah demand rising

You: Alert me when any Robot Suit under 0.2 lists
AI: Alert created! I'll notify you when a Robot Suit lists under 0.2 ETH.

You: What's the market doing?
AI: Market Brief (Feb 16):
    Floor: 0.058 ETH (+3% 24h)
    Volume: 12.4 ETH (above average)
    Heating: Wolf (+8%), Shaykhah (+12%)
    Cooling: Basic backgrounds (-4%)
    For your portfolio: Your Wolf is up 15% from entry.

You: I bought #1234 because I think Robots are undervalued
AI: Noted in your journal. I'll track your Robot thesis and alert you
    to relevant developments.
```

---

## Tools Reference

| Tool | What It Does |
|------|--------------|
| `akcb_portfolio_analyze` | Analyze wallet holdings, scores, gaps, suggestions |
| `akcb_find_listings` | Search listings with trait, price, score filters |
| `akcb_evaluate_beast` | Full evaluation of a specific beast |
| `akcb_track_alert` | Create and manage personal alerts |
| `akcb_market_brief` | Market overview with portfolio-relevant insights |
| `akcb_journal` | Add and search collecting notes |

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dataSource` | `"local"` \| `"remote"` | `"remote"` | Where to fetch scoring data |
| `dataApiUrl` | string | `http://129.158.41.81:3100` | Remote API endpoint |
| `localDataPath` | string | — | Path to local data files |
| `walletAddresses` | string[] | `[]` | Wallets to track |
| `openSeaApiKey` | string | — | For live listing data |
| `alchemyApiKey` | string | — | For on-chain data |

---

## Data & Privacy

- **Your data stays local**: Wallet, alerts, and journal stored on your device only
- **Your API key is yours**: We never see your queries or responses
- **Scoring data is public**: Derived from on-chain activity, no personal info
- **No tracking**: No telemetry, no accounts, no analytics

---

## Troubleshooting

### "Context overflow" or high token usage
Install a memory plugin (QMD recommended). See [Cost & Performance Setup](#critical-cost--performance-setup).

### Plugin not loading
1. Check `openclaw doctor`
2. Verify plugin is built: `cd beast-companion && npm run build`
3. Check config syntax in `openclaw.json`

### Data API not responding
```bash
curl http://129.158.41.81:3100/health
```
Should return `{"status":"ok"}`. If not, the API may be down.

### Config changes not taking effect
Run `openclaw doctor --fix` after any upgrade or config change. OpenClaw stores config in 4 places — this syncs them.

### Costs higher than expected
1. Verify memory plugin is active
2. Switch to Kimi K2.5 (8x cheaper than Claude)
3. Enable prompt caching in your provider settings
4. Use `/new` to clear context when starting fresh tasks

---

## Token Gating (Coming Soon)

Beast Companion will be free for all AKCB holders. Verify your holdings to unlock features:

| Tier | Requirement | Features |
|------|-------------|----------|
| Basic | 1+ Beast | Portfolio view, basic queries |
| Collector | 5+ Beasts | Full scoring, alerts, journal |
| Whale | 10+ Beasts | Priority data, advanced analytics |

---

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## Support

- **Issues**: [GitHub Issues](https://github.com/akcb/beast-companion/issues)
- **Community**: AKCB Discord
- **Research**: See [docs/OPENCLAW_RESEARCH.md](docs/OPENCLAW_RESEARCH.md) for deep-dive on OpenClaw ecosystem

---

## License

MIT

---

## Credits

Built for the AKCB community. Scoring algorithms from [akc-sales-bot](https://github.com/akcb/akc-sales-bot).

*Beast Companion is not affiliated with or endorsed by the official AKCB team.*
