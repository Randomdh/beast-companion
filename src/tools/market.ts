// =============================================================================
// Market Brief Tool
// =============================================================================

import type { OpenClawPluginApi, ToolContext, MarketBrief } from '../types.js';
import { getMarketStats, getHeatingTraits, getCoolingTraits, getNotableListings } from '../data/index.js';
import { getTrackedWallets, getWalletBeasts } from '../state/index.js';

export function registerMarketTool(api: OpenClawPluginApi): void {
  api.registerTool({
    name: 'akcb_market_brief',
    description: `Get a market brief for AKCB. Includes floor price, volume, holder count,
trending traits (heating up / cooling off), notable listings, and personalized insights
based on the user's portfolio.`,

    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['24h', '7d', '30d'],
          description: 'Timeframe for stats comparison',
          default: '24h',
        },
        includePortfolioInsights: {
          type: 'boolean',
          description: 'Include insights relevant to user\'s portfolio',
          default: true,
        },
        focusArea: {
          type: 'string',
          enum: ['overview', 'traits', 'listings', 'holders'],
          description: 'Focus on a specific area of the market',
          default: 'overview',
        },
      },
    },

    execute: async (params, context: ToolContext) => {
      const timeframe = (params.timeframe as string) ?? '24h';
      const includePortfolioInsights = (params.includePortfolioInsights as boolean) ?? true;
      const focusArea = (params.focusArea as string) ?? 'overview';
      const userId = context.userId ?? 'default';

      // Fetch market stats
      const stats = await getMarketStats(timeframe);

      // Build response based on focus area
      const brief: Partial<MarketBrief> = {
        generatedAt: new Date(),
        floorPrice: stats.floorPrice,
        floorChange24h: stats.floorChange24h,
        floorChange7d: stats.floorChange7d,
      };

      if (focusArea === 'overview' || focusArea === 'traits') {
        brief.heatingTraits = await getHeatingTraits(5);
        brief.coolingTraits = await getCoolingTraits(5);
      }

      if (focusArea === 'overview' || focusArea === 'listings') {
        brief.notableListings = await getNotableListings(5);
      }

      if (focusArea === 'overview') {
        brief.volume24h = stats.volume24h;
        brief.sales24h = stats.sales24h;
        brief.avgSalePrice = stats.avgSalePrice;
        brief.holders = stats.holders;
        brief.holdersChange7d = stats.holdersChange7d;
      }

      // Add portfolio-relevant insights if requested
      if (includePortfolioInsights) {
        const insights = await generatePortfolioInsights(userId, stats, brief);
        brief.portfolioRelevant = insights;
      }

      return formatMarketBrief(brief, focusArea);
    },
  });
}

async function generatePortfolioInsights(
  userId: string,
  stats: { floorPrice: number; floorChange24h: number },
  brief: Partial<MarketBrief>
): Promise<MarketBrief['portfolioRelevant']> {
  const insights: MarketBrief['portfolioRelevant'] = [];

  // Get user's portfolio
  const wallets = await getTrackedWallets(userId);
  if (wallets.length === 0) {
    return undefined;
  }

  const userBeasts = await getWalletBeasts(wallets[0]);
  if (userBeasts.length === 0) {
    return undefined;
  }

  // Check if any user traits are heating up
  if (brief.heatingTraits) {
    for (const heating of brief.heatingTraits) {
      const hasMatch = userBeasts.some(b =>
        b.traits.some(t => t.traitType === heating.trait && t.value === heating.value)
      );
      if (hasMatch) {
        insights.push({
          type: 'alert',
          message: `Your ${heating.value} trait is heating up (${heating.velocityChange})`,
        });
      }
    }
  }

  // Check for opportunities in notable listings
  if (brief.notableListings) {
    for (const listing of brief.notableListings) {
      // Check if listing complements portfolio
      if (listing.beast && listing.discount && listing.discount > 0.15) {
        insights.push({
          type: 'opportunity',
          message: `Beast #${listing.tokenId} listed ${Math.round(listing.discount * 100)}% below avg`,
          tokenId: listing.tokenId,
          listing,
        });
        break; // Only show one opportunity
      }
    }
  }

  // Portfolio milestone check
  if (userBeasts.length === 9) {
    insights.push({
      type: 'milestone',
      message: 'One more beast and you hit 10 - whale room access!',
    });
  }

  return insights.length > 0 ? insights : undefined;
}

function formatMarketBrief(brief: Partial<MarketBrief>, focusArea: string) {
  const response: Record<string, unknown> = {
    generatedAt: brief.generatedAt?.toISOString(),
  };

  // Floor and price info
  response.floor = {
    price: `${brief.floorPrice} ETH`,
    change24h: formatChange(brief.floorChange24h),
    change7d: formatChange(brief.floorChange7d),
  };

  if (focusArea === 'overview') {
    response.activity = {
      volume24h: brief.volume24h ? `${brief.volume24h.toFixed(2)} ETH` : undefined,
      sales24h: brief.sales24h,
      avgSalePrice: brief.avgSalePrice ? `${brief.avgSalePrice.toFixed(3)} ETH` : undefined,
    };

    response.holders = {
      total: brief.holders,
      change7d: formatChange(brief.holdersChange7d, true),
    };
  }

  if (brief.heatingTraits && brief.heatingTraits.length > 0) {
    response.heatingUp = brief.heatingTraits.map(t => ({
      trait: `${t.trait}: ${t.value}`,
      momentum: t.velocityChange,
      recentSales: t.recentSales,
    }));
  }

  if (brief.coolingTraits && brief.coolingTraits.length > 0) {
    response.coolingOff = brief.coolingTraits.map(t => ({
      trait: `${t.trait}: ${t.value}`,
      momentum: t.velocityChange,
    }));
  }

  if (brief.notableListings && brief.notableListings.length > 0) {
    response.notableListings = brief.notableListings.map(l => ({
      tokenId: l.tokenId,
      price: `${l.price} ETH`,
      reason: l.discount ? `${Math.round(l.discount * 100)}% below avg` : 'Notable build',
    }));
  }

  if (brief.portfolioRelevant && brief.portfolioRelevant.length > 0) {
    response.forYou = brief.portfolioRelevant.map(i => ({
      type: i.type,
      message: i.message,
      tokenId: i.tokenId,
    }));
  }

  return response;
}

function formatChange(value: number | undefined, isCount = false): string | undefined {
  if (value === undefined) return undefined;
  const sign = value >= 0 ? '+' : '';
  if (isCount) {
    return `${sign}${value}`;
  }
  return `${sign}${value.toFixed(1)}%`;
}
