// Beast Companion - OpenClaw Tool Plugin
import { Type as T } from '@sinclair/typebox';

const pluginDef = {
  slot: 'tool' as const,
  id: 'beast-companion',

  schema: T.Object({
    dataSource: T.Optional(T.String({ default: 'remote' })),
    dataApiUrl: T.Optional(T.String({ default: 'http://129.158.41.81:3100' })),
    walletAddresses: T.Optional(T.Array(T.String(), { default: [] })),
  }),

  metadata: {
    name: 'Beast Companion',
    description: 'Personal AI assistant for A Kid Called Beast collectors',
    icon: 'tool',
  },

  async init(config: any, deps: any) {
    deps.logger.info('Initializing Beast Companion');

    const apiUrl = config.dataApiUrl || 'http://129.158.41.81:3100';

    return {
      tools: [
        {
          name: 'akcb_evaluate_beast',
          description: 'Get a comprehensive evaluation of a specific AKCB beast by token ID. Returns composite score, vibe score, trait breakdown, and buy/hold/pass recommendation.',
          inputSchema: T.Object({
            tokenId: T.Number({ description: 'The beast token ID (1-10000)' }),
          }),
          execute: async (params: { tokenId: number }) => {
            try {
              const res = await fetch(`${apiUrl}/v1/token/${params.tokenId}`);
              if (!res.ok) return { error: `Beast #${params.tokenId} not found` };
              const data = await res.json();
              return data;
            } catch (e) {
              return { error: 'Failed to fetch beast data' };
            }
          },
        },
        {
          name: 'akcb_find_listings',
          description: 'Search for AKCB listings. Can filter by trait, price range, composite score, and archetype.',
          inputSchema: T.Object({
            traitValue: T.Optional(T.String({ description: 'Filter by trait (e.g., "Wolf", "Robot Suit")' })),
            maxPrice: T.Optional(T.Number({ description: 'Maximum price in ETH' })),
            minComposite: T.Optional(T.Number({ description: 'Minimum composite score (0-100)' })),
            limit: T.Optional(T.Number({ description: 'Max results', default: 10 })),
          }),
          execute: async (params: any) => {
            try {
              const query = new URLSearchParams();
              if (params.traitValue) query.set('trait', params.traitValue);
              if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));
              if (params.minComposite) query.set('minComposite', String(params.minComposite));
              if (params.limit) query.set('limit', String(params.limit));

              const res = await fetch(`${apiUrl}/v1/listings?${query}`);
              if (!res.ok) return { error: 'Failed to fetch listings' };
              return await res.json();
            } catch (e) {
              return { error: 'Failed to fetch listings' };
            }
          },
        },
        {
          name: 'akcb_market_brief',
          description: 'Get current AKCB market overview: floor price, volume, trending traits.',
          inputSchema: T.Object({}),
          execute: async () => {
            try {
              const res = await fetch(`${apiUrl}/v1/stats`);
              if (!res.ok) return { error: 'Failed to fetch market data' };
              return await res.json();
            } catch (e) {
              return { error: 'Failed to fetch market data' };
            }
          },
        },
        {
          name: 'akcb_portfolio_analyze',
          description: 'Analyze an AKCB wallet portfolio. Shows beasts owned, average scores, and suggestions.',
          inputSchema: T.Object({
            wallet: T.String({ description: 'Ethereum wallet address (0x...)' }),
          }),
          execute: async (params: { wallet: string }) => {
            try {
              const res = await fetch(`${apiUrl}/v1/wallet/${params.wallet}`);
              if (!res.ok) return { error: 'Wallet not found or no beasts' };
              return await res.json();
            } catch (e) {
              return { error: 'Failed to analyze wallet' };
            }
          },
        },
      ],
    };
  },
};

export default pluginDef;
