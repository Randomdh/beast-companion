# Beast Companion

Personal AI assistant for A Kid Called Beast (AKCB) collectors. An [OpenClaw](https://github.com/openclaw/openclaw) plugin.

## What Is This?

Beast Companion is your personal collecting advisor. It knows your wallet, learns your preferences, and helps you find opportunities. Unlike broadcast bots, this runs on YOUR device with YOUR data.

**Features:**
- **Portfolio Analysis** — Score and gap-analyze your collection
- **Smart Listings Search** — Complex queries like "Robot under 0.2 ETH with vibe 60+"
- **Beast Evaluation** — Full breakdown with buy/hold/pass recommendations
- **Personal Alerts** — Custom watchlists that only fire for you
- **Market Briefs** — Daily summaries with portfolio-relevant insights
- **Collecting Journal** — Notes and thesis tracking attached to your beasts

## Requirements

- [OpenClaw](https://github.com/openclaw/openclaw) gateway running locally
- Your own AI API key (Claude, OpenAI, etc.) — BYOK model
- Node.js 20+
- Optional: OpenSea API key, Alchemy API key

## Installation

```bash
# Clone into your OpenClaw extensions directory
cd ~/.openclaw/extensions
git clone https://github.com/akcb/beast-companion.git
cd beast-companion

# Install dependencies
npm install

# Build
npm run build
```

## Configuration

Add to your OpenClaw config (`~/.openclaw/openclaw.json`):

```json5
{
  plugins: {
    "beast-companion": {
      enabled: true,
      dataSource: "remote",  // or "local" if you have data files
      dataApiUrl: "https://api.beast-companion.xyz",
      openSeaApiKey: "YOUR_KEY",  // optional
      alchemyApiKey: "YOUR_KEY",  // optional
      walletAddresses: [
        "0xYourWallet..."
      ]
    }
  }
}
```

### Data Source Options

**Remote (default):** Fetches scoring data from the Beast Companion API. Recommended for most users.

**Local:** Point to your own copy of the scoring data files:
```json5
{
  dataSource: "local",
  localDataPath: "/path/to/data",  // contains grail-scores.json, token-scores.json, trait-cache.json
}
```

## Usage

Once configured, Beast Companion tools are available in any OpenClaw conversation:

```
You: What's in my wallet?
AI: [calls akcb_portfolio_analyze] You have 7 beasts with an average composite of 62...

You: Find me a Wolf under 0.15 ETH
AI: [calls akcb_find_listings] Found 3 Wolf listings under 0.15 ETH...

You: Evaluate beast 4521
AI: [calls akcb_evaluate_beast] Beast #4521 - Composite 78, Vibe 64, Cowboy archetype...

You: Alert me when any Robot Suit under 0.2 lists
AI: [calls akcb_track_alert] Alert created! I'll notify you when matching listings appear.

You: What's the market doing?
AI: [calls akcb_market_brief] Floor at 0.058 ETH (+3% 24h), Wolf heating up, 2 notable listings...

You: I bought #1234 because I think Robots are undervalued
AI: [calls akcb_journal] Noted! I'll remember your thesis on #1234.
```

## Tools Reference

| Tool | Description |
|------|-------------|
| `akcb_portfolio_analyze` | Analyze wallet holdings, scores, gaps, suggestions |
| `akcb_find_listings` | Search listings with trait, price, score filters |
| `akcb_evaluate_beast` | Full evaluation of a specific beast |
| `akcb_track_alert` | Create/manage personal alerts |
| `akcb_market_brief` | Market overview with personal insights |
| `akcb_journal` | Add/search collecting notes and thesis |

## Data Privacy

- All personal state (wallet, alerts, journal) is stored locally on your device
- Your AI API key is yours — we never see your queries
- Scoring data comes from public on-chain activity
- No tracking, no telemetry, no accounts

## Architecture

```
beast-companion/
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── types.ts          # Type definitions
│   ├── tools/            # Agent tools (portfolio, listings, etc.)
│   ├── data/             # Data providers (scores, listings, chain)
│   └── state/            # Personal state (wallet, alerts, journal)
├── openclaw.plugin.json  # Plugin manifest
└── package.json
```

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Token Gating (Future)

Beast Companion is free for all AKCB holders. Verify your holdings to unlock:

| Tier | Requirement | Features |
|------|-------------|----------|
| Basic | 1+ Beast | Portfolio view, basic queries |
| Collector | 5+ Beasts | Full scoring, alerts, journal |
| Whale | 10+ Beasts | Priority data, advanced analytics |

## License

MIT

## Credits

Built for the AKCB community. Scoring algorithms derived from [akc-sales-bot](https://github.com/akcb/akc-sales-bot).
