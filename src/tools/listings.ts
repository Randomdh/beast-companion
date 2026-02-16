// =============================================================================
// Listings Search Tool
// =============================================================================

import type { OpenClawPluginApi, ToolContext, Listing } from '../types.js';
import { searchListings, getTokenScore, getGrailScore } from '../data/index.js';
import { getTrackedWallets } from '../state/index.js';

export function registerListingsTool(api: OpenClawPluginApi): void {
  api.registerTool({
    name: 'akcb_find_listings',
    description: `Search for AKCB listings matching specific criteria. Can filter by trait,
price range, composite score, vibe score, archetype, and more. Returns ranked listings
with value analysis.`,

    parameters: {
      type: 'object',
      properties: {
        traitType: {
          type: 'string',
          description: 'Filter by trait category (e.g., "Balaclava", "Top", "Rare", "Chain")',
        },
        traitValue: {
          type: 'string',
          description: 'Filter by specific trait value (e.g., "Wolf", "Robot Suit", "Gold Chain")',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price in ETH',
        },
        minPrice: {
          type: 'number',
          description: 'Minimum price in ETH',
        },
        minComposite: {
          type: 'number',
          description: 'Minimum composite score (0-100)',
        },
        minVibe: {
          type: 'number',
          description: 'Minimum vibe score (0-100)',
        },
        archetype: {
          type: 'string',
          description: 'Filter by archetype (e.g., "Cowboy", "Robot Suit", "Astronaut")',
        },
        undervaluedOnly: {
          type: 'boolean',
          description: 'Only show listings priced below average for their traits',
          default: false,
        },
        portfolioRelevant: {
          type: 'boolean',
          description: 'Prioritize listings that complement the user\'s existing portfolio',
          default: false,
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default 10)',
          default: 10,
        },
      },
    },

    execute: async (params, context: ToolContext) => {
      const {
        traitType,
        traitValue,
        maxPrice,
        minPrice,
        minComposite,
        minVibe,
        archetype,
        undervaluedOnly = false,
        portfolioRelevant = false,
        limit = 10,
      } = params as {
        traitType?: string;
        traitValue?: string;
        maxPrice?: number;
        minPrice?: number;
        minComposite?: number;
        minVibe?: number;
        archetype?: string;
        undervaluedOnly?: boolean;
        portfolioRelevant?: boolean;
        limit?: number;
      };

      // Build search criteria
      const criteria = {
        traitType,
        traitValue,
        maxPrice,
        minPrice,
        minComposite,
        minVibe,
        archetype,
      };

      // Fetch listings
      let listings = await searchListings(criteria);

      // Filter for undervalued if requested
      if (undervaluedOnly) {
        listings = listings.filter(l => (l.discount ?? 0) > 0);
      }

      // Enrich with scores
      const enriched = await Promise.all(
        listings.map(async (listing) => {
          const tokenScore = await getTokenScore(listing.tokenId);
          const bestTraitScore = await getBestTraitScore(listing);

          return {
            ...listing,
            compositeScore: tokenScore?.compositeScore,
            vibeScore: tokenScore?.vibeScore,
            archetype: tokenScore?.archetype,
            bestTraitGrail: bestTraitScore,
          };
        })
      );

      // Sort by value (composite/price ratio) or by portfolio relevance
      let sorted: typeof enriched;
      if (portfolioRelevant && context.userId) {
        sorted = await sortByPortfolioRelevance(enriched, context.userId);
      } else {
        sorted = enriched.sort((a, b) => {
          // Default: sort by value ratio (composite score per ETH)
          const valueA = (a.compositeScore ?? 0) / a.price;
          const valueB = (b.compositeScore ?? 0) / b.price;
          return valueB - valueA;
        });
      }

      // Limit results
      const results = sorted.slice(0, limit);

      // Format response
      return {
        count: results.length,
        totalMatching: listings.length,
        criteria: Object.fromEntries(
          Object.entries(criteria).filter(([_, v]) => v !== undefined)
        ),
        listings: results.map(formatListingResult),
      };
    },
  });
}

async function getBestTraitScore(listing: Listing): Promise<number | undefined> {
  if (!listing.beast?.traits) return undefined;

  let bestScore = 0;
  for (const trait of listing.beast.traits) {
    const score = await getGrailScore(trait.traitType, trait.value);
    if (score && score > bestScore) {
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestScore : undefined;
}

async function sortByPortfolioRelevance<T extends Listing>(
  listings: T[],
  userId: string
): Promise<T[]> {
  // Get user's tracked wallets and their beasts
  const wallets = await getTrackedWallets(userId);
  if (wallets.length === 0) {
    // Fall back to default sorting
    return listings.sort((a, b) => (b.tokenScore?.compositeScore ?? 0) - (a.tokenScore?.compositeScore ?? 0));
  }

  // TODO: Analyze portfolio gaps and prioritize listings that fill them
  // For now, just return sorted by composite
  return listings.sort((a, b) => (b.tokenScore?.compositeScore ?? 0) - (a.tokenScore?.compositeScore ?? 0));
}

function formatListingResult(listing: Listing & { compositeScore?: number; vibeScore?: number; archetype?: string; bestTraitGrail?: number }) {
  return {
    tokenId: listing.tokenId,
    price: `${listing.price} ETH`,
    marketplace: listing.marketplace,
    compositeScore: listing.compositeScore,
    vibeScore: listing.vibeScore,
    archetype: listing.archetype,
    bestTraitGrail: listing.bestTraitGrail,
    discount: listing.discount ? `${Math.round(listing.discount * 100)}% below avg` : undefined,
    url: `https://opensea.io/assets/ethereum/0x77372a4cc66063575b05b44481f059be356964a4/${listing.tokenId}`,
  };
}
