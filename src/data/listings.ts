// =============================================================================
// Listings Provider - OpenSea / Blur listings
// =============================================================================

import type { BeastCompanionConfig, PluginRuntime, Listing, Beast } from '../types.js';

const AKCB_CONTRACT = '0x77372a4cc66063575b05b44481f059be356964a4';

export interface ListingsProvider {
  search(criteria: {
    traitType?: string;
    traitValue?: string;
    maxPrice?: number;
    minPrice?: number;
    minComposite?: number;
    minVibe?: number;
    archetype?: string;
  }): Promise<Listing[]>;
  getByTokenId(tokenId: number): Promise<Listing | undefined>;
  getNotable(limit: number): Promise<Listing[]>;
}

export async function createListingsProvider(
  config: BeastCompanionConfig,
  runtime: PluginRuntime
): Promise<ListingsProvider> {
  return new OpenSeaListingsProvider(config.openSeaApiKey, runtime);
}

// -----------------------------------------------------------------------------
// OpenSea Provider
// -----------------------------------------------------------------------------

class OpenSeaListingsProvider implements ListingsProvider {
  private listingsCache: { data: Listing[]; expires: number } | null = null;
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  constructor(
    private apiKey: string | undefined,
    private runtime: PluginRuntime
  ) {}

  private async fetchListings(): Promise<Listing[]> {
    const now = Date.now();
    if (this.listingsCache && this.listingsCache.expires > now) {
      return this.listingsCache.data;
    }

    try {
      // OpenSea API v2 listings endpoint
      const url = `https://api.opensea.io/api/v2/listings/collection/akidcalledbeast/all?limit=100`;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (this.apiKey) {
        headers['X-API-KEY'] = this.apiKey;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        this.runtime.log('error', 'OpenSea API error', {
          status: response.status,
          statusText: response.statusText,
        });
        return this.listingsCache?.data ?? [];
      }

      const data = await response.json() as {
        listings: Array<{
          protocol_data: {
            parameters: {
              offer: Array<{ identifierOrCriteria: string }>;
            };
          };
          price: {
            current: {
              value: string;
              decimals: number;
            };
          };
          protocol_address: string;
        }>;
      };

      const listings: Listing[] = data.listings.map((l) => {
        const tokenId = Number(l.protocol_data.parameters.offer[0]?.identifierOrCriteria ?? 0);
        const priceWei = BigInt(l.price.current.value);
        const price = Number(priceWei) / 1e18;

        return {
          tokenId,
          price,
          marketplace: 'opensea',
          seller: '', // Would need additional lookup
          listedAt: new Date(),
        };
      });

      this.listingsCache = { data: listings, expires: now + this.CACHE_TTL };
      this.runtime.log('info', `Fetched ${listings.length} listings from OpenSea`);

      return listings;
    } catch (error) {
      this.runtime.log('error', 'Failed to fetch listings', { error: String(error) });
      return this.listingsCache?.data ?? [];
    }
  }

  async search(criteria: {
    traitType?: string;
    traitValue?: string;
    maxPrice?: number;
    minPrice?: number;
    minComposite?: number;
    minVibe?: number;
    archetype?: string;
  }): Promise<Listing[]> {
    let listings = await this.fetchListings();

    // Apply price filters
    if (criteria.maxPrice !== undefined) {
      listings = listings.filter(l => l.price <= criteria.maxPrice!);
    }
    if (criteria.minPrice !== undefined) {
      listings = listings.filter(l => l.price >= criteria.minPrice!);
    }

    // Trait and score filtering would require enrichment from scores provider
    // This is a simplified implementation - full version would cross-reference

    // Sort by price
    listings.sort((a, b) => a.price - b.price);

    return listings;
  }

  async getByTokenId(tokenId: number): Promise<Listing | undefined> {
    const listings = await this.fetchListings();
    return listings.find(l => l.tokenId === tokenId);
  }

  async getNotable(limit: number): Promise<Listing[]> {
    const listings = await this.fetchListings();

    // Notable = lowest price listings (simplified)
    // Full implementation would factor in grail scores, discounts, etc.
    return listings
      .sort((a, b) => a.price - b.price)
      .slice(0, limit);
  }
}
