// Beast Companion - OpenClaw Plugin
// Provides AKCB NFT analysis tools (9 tools)
// RULE: Never expose numeric scores to the AI model — tier labels only.
// The model will parrot any number it sees, so we strip them here.

const API_URL = 'http://129.158.41.81:3100';

function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

// Strip numeric score fields — the model should only see tier labels
const SCORE_FIELDS = new Set([
  'grailScore', 'compositeScore', 'traitStackScore', 'vibeScore',
  'reputationScore', 'premium', 'velocity', 'conviction', 'momentum',
  'cult', 'scarcity', 'avgPrice', 'recentSales', 'currentScore',
  'previousScore', 'change', 'averageComposite', 'averageVibe',
]);

function stripScores(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripScores);
  if (obj === null || typeof obj !== 'object') return obj;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SCORE_FIELDS.has(k)) continue;
    out[k] = stripScores(v);
  }
  return out;
}

export default function register(api: any) {
  console.log('[Beast Companion] Registering tools...');

  // Tool 1: Evaluate a specific beast
  api.registerTool({
    name: 'akcb_evaluate_beast',
    description: 'Get a comprehensive evaluation of a specific AKCB beast by token ID. Returns build tier (top-tier build, strong build, solid build, decent build, floor build), archetype, and trait breakdown with tier classifications (grail-tier, premium, solid, common, floor). Always describe beasts using tier names, never numeric scores.',
    parameters: {
      type: 'object',
      properties: {
        tokenId: { type: 'number', description: 'The beast token ID (0-9999)' },
      },
      required: ['tokenId'],
    },
    async execute(_id: string, params: { tokenId: number }) {
      try {
        const [scoreRes, traitsRes, grailRes] = await Promise.all([
          fetch(`${API_URL}/v1/tokens/${params.tokenId}/score`),
          fetch(`${API_URL}/v1/tokens/${params.tokenId}/traits`),
          fetch(`${API_URL}/v1/tokens/${params.tokenId}/grail-scores`),
        ]);
        if (!scoreRes.ok) return textResult({ error: `Beast #${params.tokenId} not found` });
        const score = await scoreRes.json();
        const traits = traitsRes.ok ? await traitsRes.json() : [];
        const grailScores = grailRes.ok ? await grailRes.json() : [];
        return textResult(stripScores({ ...score, traits, grailScores }));
      } catch (e) {
        return textResult({ error: 'Failed to fetch beast data' });
      }
    },
  });

  // Tool 2: Search tokens by criteria
  api.registerTool({
    name: 'akcb_search_tokens',
    description: 'Search AKCB beasts by build quality or archetype. Returns beasts sorted by quality with tier labels. Use tier names (top-tier build, strong build, etc.) when describing results — never show numeric scores.',
    parameters: {
      type: 'object',
      properties: {
        minComposite: { type: 'number', description: 'Minimum quality threshold (0-100). 90+ = top-tier, 80+ = strong, 70+ = solid' },
        archetype: { type: 'string', description: 'Filter by archetype (Rare, Angel, Zombie, Bones, Astronaut, Ape Suit, Robot Suit)' },
        limit: { type: 'number', description: 'Max results to return (default 10)' },
      },
    },
    async execute(_id: string, params: { minComposite?: number; archetype?: string; limit?: number }) {
      try {
        const query = new URLSearchParams();
        if (params.minComposite) query.set('minComposite', String(params.minComposite));
        if (params.archetype) query.set('archetype', params.archetype);
        if (params.limit) query.set('limit', String(params.limit));
        const res = await fetch(`${API_URL}/v1/search/tokens?${query}`);
        if (!res.ok) return textResult({ error: 'Failed to search tokens' });
        return textResult(stripScores(await res.json()));
      } catch (e) {
        return textResult({ error: 'Failed to search tokens' });
      }
    },
  });

  // Tool 3: Collection stats
  api.registerTool({
    name: 'akcb_collection_stats',
    description: 'Get AKCB collection overview: floor price (ETH + USD), daily/weekly volume and sales count. Use this for general market questions.',
    parameters: {
      type: 'object',
      properties: {},
    },
    async execute(_id: string) {
      try {
        const res = await fetch(`${API_URL}/v1/market/floor`);
        if (!res.ok) return textResult({ error: 'Failed to fetch collection stats' });
        return textResult(await res.json());
      } catch (e) {
        return textResult({ error: 'Failed to fetch collection stats' });
      }
    },
  });

  // Tool 4: Trending traits
  api.registerTool({
    name: 'akcb_trending_traits',
    description: 'Get traits that are heating up — rising demand from collectors. Returns trait name, direction (heating/cooling), and tier. Use tier names when describing results.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
    async execute(_id: string, params: { limit?: number }) {
      try {
        const query = params.limit ? `?limit=${params.limit}` : '';
        const res = await fetch(`${API_URL}/v1/traits/heating${query}`);
        if (!res.ok) return textResult({ error: 'Failed to fetch trending traits' });
        return textResult(stripScores(await res.json()));
      } catch (e) {
        return textResult({ error: 'Failed to fetch trending traits' });
      }
    },
  });

  // Tool 5: Search traits by name
  api.registerTool({
    name: 'akcb_search_traits',
    description: 'Search AKCB traits by name. Returns tier (grail-tier, premium, solid, common, floor), supply count, and scarcity info. Use tier names and supply/scarcity framing — never numeric scores.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Trait name to search for (e.g. "Wolf", "Robot", "Gold Chain")' },
      },
      required: ['query'],
    },
    async execute(_id: string, params: { query: string }) {
      try {
        const res = await fetch(`${API_URL}/v1/search/traits?q=${encodeURIComponent(params.query)}`);
        if (!res.ok) return textResult({ error: 'Failed to search traits' });
        return textResult(stripScores(await res.json()));
      } catch (e) {
        return textResult({ error: 'Failed to search traits' });
      }
    },
  });

  // Tool 6: Wallet portfolio analysis
  api.registerTool({
    name: 'akcb_portfolio_analyze',
    description: 'Analyze an Ethereum wallet\'s AKCB collection. Returns beast count, build tier distribution, archetype breakdown, best beast, and per-token breakdown with trait tiers. Use tier names — never expose numeric scores to the user.',
    parameters: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Ethereum wallet address (0x...)' },
      },
      required: ['address'],
    },
    async execute(_id: string, params: { address: string }) {
      try {
        const res = await fetch(`${API_URL}/v1/wallet/${params.address}/portfolio`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          return textResult(err);
        }
        return textResult(stripScores(await res.json()));
      } catch (e) {
        return textResult({ error: 'Failed to fetch portfolio data' });
      }
    },
  });

  // Tool 7: Quick floor check
  api.registerTool({
    name: 'akcb_floor_check',
    description: 'Quick floor price check — returns current floor in ETH and USD, plus daily volume.',
    parameters: {
      type: 'object',
      properties: {},
    },
    async execute(_id: string) {
      try {
        const res = await fetch(`${API_URL}/v1/market/floor`);
        if (!res.ok) return textResult({ error: 'Failed to fetch floor price' });
        return textResult(await res.json());
      } catch (e) {
        return textResult({ error: 'Failed to fetch floor price' });
      }
    },
  });

  // Tool 8: Recent sales
  api.registerTool({
    name: 'akcb_recent_sales',
    description: 'Get recent AKCB sales with prices in ETH and USD. Shows what beasts sold recently and at what price.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of sales to return (default 10, max 50)' },
      },
    },
    async execute(_id: string, params: { limit?: number }) {
      try {
        const query = params.limit ? `?limit=${params.limit}` : '';
        const res = await fetch(`${API_URL}/v1/market/sales${query}`);
        if (!res.ok) return textResult({ error: 'Failed to fetch recent sales' });
        return textResult(await res.json());
      } catch (e) {
        return textResult({ error: 'Failed to fetch recent sales' });
      }
    },
  });

  // Tool 9: Active listings
  api.registerTool({
    name: 'akcb_listings',
    description: 'Get active AKCB listings on OpenSea, enriched with build tier, archetype, and top trait tier. Filter by max price. Use tier names when describing listings.',
    parameters: {
      type: 'object',
      properties: {
        maxPrice: { type: 'number', description: 'Maximum price in ETH to filter listings' },
        limit: { type: 'number', description: 'Max listings to return (default 20, max 100)' },
      },
    },
    async execute(_id: string, params: { maxPrice?: number; limit?: number }) {
      try {
        const query = new URLSearchParams();
        if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));
        if (params.limit) query.set('limit', String(params.limit));
        const res = await fetch(`${API_URL}/v1/market/listings?${query}`);
        if (!res.ok) return textResult({ error: 'Failed to fetch listings' });
        return textResult(stripScores(await res.json()));
      } catch (e) {
        return textResult({ error: 'Failed to fetch listings' });
      }
    },
  });

  console.log('[Beast Companion] Registered 9 tools');
}
