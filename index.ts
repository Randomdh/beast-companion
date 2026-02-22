// Beast Companion - OpenClaw Plugin
// Provides AKCB NFT analysis tools

const API_URL = 'http://129.158.41.81:3100';

function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export default function register(api: any) {
  console.log('[Beast Companion] Registering tools...');

  // Tool 1: Evaluate a specific beast (combines score + traits + grail scores)
  api.registerTool({
    name: 'akcb_evaluate_beast',
    description: 'Get a comprehensive evaluation of a specific AKCB beast by token ID. Returns composite score, vibe score, archetype, traits with grail scores, and trait breakdown.',
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
        return textResult({ ...score, traits, grailScores });
      } catch (e) {
        return textResult({ error: 'Failed to fetch beast data' });
      }
    },
  });

  // Tool 2: Search tokens by score
  api.registerTool({
    name: 'akcb_search_tokens',
    description: 'Search AKCB tokens. Can filter by minimum composite score and limit results. Returns scored tokens sorted by composite score descending.',
    parameters: {
      type: 'object',
      properties: {
        minScore: { type: 'number', description: 'Minimum composite score (0-100)' },
        limit: { type: 'number', description: 'Max results to return (default 10)' },
      },
    },
    async execute(_id: string, params: { minScore?: number; limit?: number }) {
      try {
        const query = new URLSearchParams();
        if (params.minScore) query.set('minScore', String(params.minScore));
        if (params.limit) query.set('limit', String(params.limit));
        const res = await fetch(`${API_URL}/v1/search/tokens?${query}`);
        if (!res.ok) return textResult({ error: 'Failed to search tokens' });
        return textResult(await res.json());
      } catch (e) {
        return textResult({ error: 'Failed to search tokens' });
      }
    },
  });

  // Tool 3: Market stats
  api.registerTool({
    name: 'akcb_market_brief',
    description: 'Get current AKCB data overview: grail scores count, token scores count, trait counts, last refresh time.',
    parameters: {
      type: 'object',
      properties: {},
    },
    async execute(_id: string) {
      try {
        const res = await fetch(`${API_URL}/v1/stats`);
        if (!res.ok) return textResult({ error: 'Failed to fetch market data' });
        return textResult(await res.json());
      } catch (e) {
        return textResult({ error: 'Failed to fetch market data' });
      }
    },
  });

  // Tool 4: Trending traits (heating up)
  api.registerTool({
    name: 'akcb_trending_traits',
    description: 'Get traits that are heating up — high velocity, rising demand.',
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
        return textResult(await res.json());
      } catch (e) {
        return textResult({ error: 'Failed to fetch trending traits' });
      }
    },
  });

  // Tool 5: Search traits by name
  api.registerTool({
    name: 'akcb_search_traits',
    description: 'Search for AKCB trait grail scores by name. Returns grail score, supply, premium, velocity, and other metrics.',
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
        return textResult(await res.json());
      } catch (e) {
        return textResult({ error: 'Failed to search traits' });
      }
    },
  });

  // Tool 6: Wallet portfolio analysis
  api.registerTool({
    name: 'akcb_portfolio_analyze',
    description: 'Analyze an Ethereum wallet\'s AKCB collection. Returns token count, average scores, archetype distribution, top beast, and per-token breakdown with traits and grail scores.',
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
        return textResult(await res.json());
      } catch (e) {
        return textResult({ error: 'Failed to fetch portfolio data' });
      }
    },
  });

  console.log('[Beast Companion] Registered 6 tools');
}
