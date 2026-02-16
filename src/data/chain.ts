// =============================================================================
// Chain Provider - On-chain data, wallet holdings
// =============================================================================

import type { BeastCompanionConfig, PluginRuntime, Beast, BeastTrait } from '../types.js';

const AKCB_CONTRACT = '0x77372a4cc66063575b05b44481f059be356964a4';

export interface ChainProvider {
  getBeast(tokenId: number): Promise<Beast | undefined>;
  getWalletBeasts(wallet: string): Promise<Beast[]>;
  getRecentSales(tokenId: number, limit: number): Promise<Array<{ price: number; date: Date; marketplace: string }>>;
  getMarketStats(timeframe: string): Promise<{
    floorPrice: number;
    floorChange24h: number;
    floorChange7d: number;
    volume24h: number;
    sales24h: number;
    avgSalePrice: number;
    holders: number;
    holdersChange7d: number;
  }>;
}

export async function createChainProvider(
  config: BeastCompanionConfig,
  runtime: PluginRuntime
): Promise<ChainProvider> {
  return new AlchemyChainProvider(config.alchemyApiKey, runtime);
}

// -----------------------------------------------------------------------------
// Alchemy Provider
// -----------------------------------------------------------------------------

class AlchemyChainProvider implements ChainProvider {
  private readonly baseUrl: string;

  constructor(
    private apiKey: string | undefined,
    private runtime: PluginRuntime
  ) {
    this.baseUrl = apiKey
      ? `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`
      : 'https://eth-mainnet.g.alchemy.com/v2/demo';
  }

  async getBeast(tokenId: number): Promise<Beast | undefined> {
    try {
      // Fetch NFT metadata from Alchemy
      const url = `${this.baseUrl}/nft/v3/getNFTMetadata?contractAddress=${AKCB_CONTRACT}&tokenId=${tokenId}`;
      const response = await fetch(url);

      if (!response.ok) {
        this.runtime.log('error', 'Alchemy metadata fetch failed', { tokenId, status: response.status });
        return undefined;
      }

      const data = await response.json() as {
        tokenId: string;
        image?: { cachedUrl?: string; originalUrl?: string };
        raw?: {
          metadata?: {
            attributes?: Array<{ trait_type: string; value: string }>;
          };
        };
      };

      const traits: BeastTrait[] = (data.raw?.metadata?.attributes ?? []).map(attr => ({
        traitType: attr.trait_type,
        value: attr.value,
      }));

      return {
        tokenId,
        traits,
        imageUrl: data.image?.cachedUrl ?? data.image?.originalUrl,
      };
    } catch (error) {
      this.runtime.log('error', 'Failed to fetch beast', { tokenId, error: String(error) });
      return undefined;
    }
  }

  async getWalletBeasts(wallet: string): Promise<Beast[]> {
    try {
      // Fetch NFTs owned by wallet
      const url = `${this.baseUrl}/nft/v3/getNFTsForOwner?owner=${wallet}&contractAddresses[]=${AKCB_CONTRACT}&withMetadata=true`;
      const response = await fetch(url);

      if (!response.ok) {
        this.runtime.log('error', 'Alchemy wallet fetch failed', { wallet, status: response.status });
        return [];
      }

      const data = await response.json() as {
        ownedNfts: Array<{
          tokenId: string;
          image?: { cachedUrl?: string; originalUrl?: string };
          raw?: {
            metadata?: {
              attributes?: Array<{ trait_type: string; value: string }>;
            };
          };
        }>;
      };

      return data.ownedNfts.map(nft => {
        const traits: BeastTrait[] = (nft.raw?.metadata?.attributes ?? []).map(attr => ({
          traitType: attr.trait_type,
          value: attr.value,
        }));

        return {
          tokenId: Number(nft.tokenId),
          traits,
          imageUrl: nft.image?.cachedUrl ?? nft.image?.originalUrl,
        };
      });
    } catch (error) {
      this.runtime.log('error', 'Failed to fetch wallet beasts', { wallet, error: String(error) });
      return [];
    }
  }

  async getRecentSales(tokenId: number, limit: number): Promise<Array<{ price: number; date: Date; marketplace: string }>> {
    // Would query from sales cache or OpenSea activity API
    // Simplified stub for now
    return [];
  }

  async getMarketStats(timeframe: string): Promise<{
    floorPrice: number;
    floorChange24h: number;
    floorChange7d: number;
    volume24h: number;
    sales24h: number;
    avgSalePrice: number;
    holders: number;
    holdersChange7d: number;
  }> {
    try {
      // Fetch from OpenSea collection stats
      const url = 'https://api.opensea.io/api/v2/collections/akidcalledbeast/stats';
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`OpenSea stats failed: ${response.status}`);
      }

      const data = await response.json() as {
        total: {
          floor_price: number;
          volume: number;
          sales: number;
          average_price: number;
          num_owners: number;
        };
        intervals?: Array<{
          interval: string;
          floor_price: number;
          volume: number;
          sales: number;
        }>;
      };

      // Calculate changes (simplified - would need historical data)
      const floor = data.total.floor_price ?? 0;

      return {
        floorPrice: floor,
        floorChange24h: 0, // Would calculate from intervals
        floorChange7d: 0,
        volume24h: data.intervals?.[0]?.volume ?? 0,
        sales24h: data.intervals?.[0]?.sales ?? 0,
        avgSalePrice: data.total.average_price ?? 0,
        holders: data.total.num_owners ?? 0,
        holdersChange7d: 0,
      };
    } catch (error) {
      this.runtime.log('error', 'Failed to fetch market stats', { error: String(error) });
      return {
        floorPrice: 0,
        floorChange24h: 0,
        floorChange7d: 0,
        volume24h: 0,
        sales24h: 0,
        avgSalePrice: 0,
        holders: 0,
        holdersChange7d: 0,
      };
    }
  }
}
