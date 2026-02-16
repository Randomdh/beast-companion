// Beast Companion - OpenClaw Plugin
// Provides AKCB NFT analysis tools

const API_URL = 'http://129.158.41.81:3100';

export async function register(api: any) {
  console.log('[Beast Companion] Registering tools...');

  // Tool 1: Evaluate a specific beast
  api.registerTool({
    name: 'akcb_evaluate_beast',
    description: 'Get a comprehensive evaluation of a specific AKCB beast by token ID. Returns composite score, vibe score, trait breakdown, and buy/hold/pass recommendation.',
    execute: async (params: { tokenId: number }) => {
      try {
        const res = await fetch(`${API_URL}/v1/token/${params.tokenId}`);
        if (!res.ok) return { error: `Beast #${params.tokenId} not found` };
        return await res.json();
      } catch (e) {
        return { error: 'Failed to fetch beast data' };
      }
    },
  });

  // Tool 2: Find listings
  api.registerTool({
    name: 'akcb_find_listings',
    description: 'Search for AKCB listings. Can filter by trait, price range, composite score.',
    execute: async (params: { traitValue?: string; maxPrice?: number; minComposite?: number; limit?: number }) => {
      try {
        const query = new URLSearchParams();
        if (params.traitValue) query.set('trait', params.traitValue);
        if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));
        if (params.minComposite) query.set('minComposite', String(params.minComposite));
        if (params.limit) query.set('limit', String(params.limit));

        const res = await fetch(`${API_URL}/v1/listings?${query}`);
        if (!res.ok) return { error: 'Failed to fetch listings' };
        return await res.json();
      } catch (e) {
        return { error: 'Failed to fetch listings' };
      }
    },
  });

  // Tool 3: Market brief
  api.registerTool({
    name: 'akcb_market_brief',
    description: 'Get current AKCB market overview: floor price, volume, trending traits.',
    execute: async () => {
      try {
        const res = await fetch(`${API_URL}/v1/stats`);
        if (!res.ok) return { error: 'Failed to fetch market data' };
        return await res.json();
      } catch (e) {
        return { error: 'Failed to fetch market data' };
      }
    },
  });

  // Tool 4: Portfolio analysis
  api.registerTool({
    name: 'akcb_portfolio_analyze',
    description: 'Analyze an AKCB wallet portfolio. Shows beasts owned, average scores, and suggestions.',
    execute: async (params: { wallet: string }) => {
      try {
        const res = await fetch(`${API_URL}/v1/wallet/${params.wallet}`);
        if (!res.ok) return { error: 'Wallet not found or no beasts' };
        return await res.json();
      } catch (e) {
        return { error: 'Failed to analyze wallet' };
      }
    },
  });

  console.log('[Beast Companion] Registered 4 tools');
}
