// =============================================================================
// Beast Evaluation Tool
// =============================================================================

import type { OpenClawPluginApi, ToolContext, Beast, TokenScore, GrailScore } from '../types.js';
import { getBeast, getTokenScore, getGrailScoresForToken, getRecentSales, getCurrentListing } from '../data/index.js';

export function registerEvaluateTool(api: OpenClawPluginApi): void {
  api.registerTool({
    name: 'akcb_evaluate_beast',
    description: `Get a comprehensive evaluation of a specific beast by token ID.
Includes composite score, vibe score, archetype, trait breakdown with grail scores,
recent sale history, current listing status, and buy/hold/pass recommendation.`,

    parameters: {
      type: 'object',
      properties: {
        tokenId: {
          type: 'number',
          description: 'The beast token ID (1-10000)',
        },
        includeHistory: {
          type: 'boolean',
          description: 'Include sale history for this token',
          default: true,
        },
      },
      required: ['tokenId'],
    },

    execute: async (params, context: ToolContext) => {
      const tokenId = params.tokenId as number;
      const includeHistory = params.includeHistory as boolean ?? true;

      // Validate token ID
      if (tokenId < 1 || tokenId > 10000) {
        return { error: 'Token ID must be between 1 and 10000' };
      }

      // Fetch beast data
      const beast = await getBeast(tokenId);
      if (!beast) {
        return { error: `Beast #${tokenId} not found` };
      }

      // Fetch scores
      const tokenScore = await getTokenScore(tokenId);
      const traitScores = await getGrailScoresForToken(tokenId);

      // Fetch current listing if any
      const listing = await getCurrentListing(tokenId);

      // Fetch sale history if requested
      let saleHistory: Array<{ price: number; date: Date; marketplace: string }> | undefined;
      if (includeHistory) {
        saleHistory = await getRecentSales(tokenId, 5);
      }

      // Generate recommendation
      const recommendation = generateRecommendation(beast, tokenScore, traitScores, listing);

      return {
        tokenId,
        imageUrl: beast.imageUrl,

        // Scores
        compositeScore: tokenScore?.compositeScore,
        vibeScore: tokenScore?.vibeScore,
        traitStackScore: tokenScore?.traitStackScore,
        reputationScore: tokenScore?.reputationScore,

        // Classification
        archetype: tokenScore?.archetype,
        synergy: tokenScore?.synergy,
        fullSuit: tokenScore?.fullSuit,
        cohesion: tokenScore?.cohesion,
        identityCombo: tokenScore?.identityCombo,

        // Trait breakdown
        traits: formatTraitBreakdown(beast.traits, traitScores),

        // Market status
        currentListing: listing ? {
          price: `${listing.price} ETH`,
          marketplace: listing.marketplace,
          discount: listing.discount ? `${Math.round(listing.discount * 100)}% below avg` : undefined,
        } : null,

        // History
        saleHistory: saleHistory?.map(s => ({
          price: `${s.price} ETH`,
          date: s.date.toISOString().split('T')[0],
          marketplace: s.marketplace,
        })),

        // Recommendation
        recommendation,

        // Links
        links: {
          opensea: `https://opensea.io/assets/ethereum/0x77372a4cc66063575b05b44481f059be356964a4/${tokenId}`,
          blur: `https://blur.io/asset/0x77372a4cc66063575b05b44481f059be356964a4/${tokenId}`,
        },
      };
    },
  });
}

function formatTraitBreakdown(
  traits: Beast['traits'],
  grailScores: Map<string, GrailScore>
): Array<{
  traitType: string;
  value: string;
  grailScore?: number;
  supply?: number;
  scarcityTier?: string;
}> {
  return traits.map(trait => {
    const key = `${trait.traitType}:${trait.value}`;
    const score = grailScores.get(key);

    let scarcityTier: string | undefined;
    if (score?.supply) {
      if (score.supply === 1) scarcityTier = '1/1';
      else if (score.supply <= 5) scarcityTier = 'Ultra Rare';
      else if (score.supply <= 15) scarcityTier = 'Very Rare';
      else if (score.supply <= 50) scarcityTier = 'Rare';
      else if (score.supply <= 150) scarcityTier = 'Uncommon';
      else scarcityTier = 'Common';
    }

    return {
      traitType: trait.traitType,
      value: trait.value,
      grailScore: score?.grailScore,
      supply: score?.supply,
      scarcityTier,
    };
  }).sort((a, b) => (b.grailScore ?? 0) - (a.grailScore ?? 0));
}

function generateRecommendation(
  beast: Beast,
  tokenScore: TokenScore | undefined,
  traitScores: Map<string, GrailScore>,
  listing: { price: number; discount?: number } | undefined
): {
  action: 'strong_buy' | 'buy' | 'hold' | 'pass';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
} {
  const reasoning: string[] = [];
  let score = 0;

  // Score based on composite
  if (tokenScore?.compositeScore) {
    if (tokenScore.compositeScore >= 85) {
      score += 3;
      reasoning.push(`Top-tier build (composite ${tokenScore.compositeScore})`);
    } else if (tokenScore.compositeScore >= 70) {
      score += 2;
      reasoning.push(`Strong build (composite ${tokenScore.compositeScore})`);
    } else if (tokenScore.compositeScore >= 50) {
      score += 1;
      reasoning.push(`Solid build (composite ${tokenScore.compositeScore})`);
    } else {
      reasoning.push(`Below average build (composite ${tokenScore.compositeScore})`);
    }
  }

  // Score based on vibe
  if (tokenScore?.vibeScore) {
    if (tokenScore.vibeScore >= 65) {
      score += 2;
      reasoning.push(`Premium trait lean (vibe ${tokenScore.vibeScore})`);
    } else if (tokenScore.vibeScore <= 40) {
      score -= 1;
      reasoning.push(`Discount trait heavy (vibe ${tokenScore.vibeScore})`);
    }
  }

  // Score based on special attributes
  if (tokenScore?.fullSuit) {
    score += 2;
    reasoning.push(`Full ${tokenScore.fullSuit} suit`);
  }
  if (tokenScore?.synergy) {
    score += 1;
    reasoning.push(`${tokenScore.synergy} synergy bonus`);
  }
  if (tokenScore?.cohesion) {
    score += 1;
    reasoning.push('Color cohesion bonus');
  }

  // Check for standout traits
  for (const [key, grail] of traitScores) {
    if (grail.grailScore >= 70) {
      score += 2;
      reasoning.push(`Grail trait: ${grail.value} (score ${grail.grailScore})`);
      break; // Only count one grail trait
    } else if (grail.grailScore >= 55) {
      score += 1;
      reasoning.push(`Notable trait: ${grail.value} (score ${grail.grailScore})`);
      break;
    }
  }

  // Adjust for listing price if available
  if (listing) {
    if (listing.discount && listing.discount >= 0.2) {
      score += 2;
      reasoning.push(`Listed ${Math.round(listing.discount * 100)}% below average`);
    } else if (listing.discount && listing.discount >= 0.1) {
      score += 1;
      reasoning.push(`Listed ${Math.round(listing.discount * 100)}% below average`);
    }
  }

  // Determine action
  let action: 'strong_buy' | 'buy' | 'hold' | 'pass';
  let confidence: 'high' | 'medium' | 'low';

  if (score >= 6) {
    action = 'strong_buy';
    confidence = 'high';
  } else if (score >= 4) {
    action = 'buy';
    confidence = 'medium';
  } else if (score >= 2) {
    action = 'hold';
    confidence = 'medium';
  } else {
    action = 'pass';
    confidence = score < 0 ? 'high' : 'low';
  }

  return { action, confidence, reasoning };
}
