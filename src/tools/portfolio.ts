// =============================================================================
// Portfolio Analysis Tool
// =============================================================================

import type { OpenClawPluginApi, ToolContext, PortfolioAnalysis, Beast } from '../types.js';
import { getWalletBeasts, getTokenScores, getGrailScores } from '../data/index.js';
import { getTrackedWallets } from '../state/index.js';

export function registerPortfolioTool(api: OpenClawPluginApi): void {
  api.registerTool({
    name: 'akcb_portfolio_analyze',
    description: `Analyze an AKCB wallet portfolio. Shows total beasts, estimated value,
average scores, archetype distribution, trait gaps, and personalized suggestions.
If no wallet specified, analyzes the user's tracked wallets.`,

    parameters: {
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          description: 'Ethereum wallet address (0x...) or ENS name. Optional if user has tracked wallets.',
        },
        detailed: {
          type: 'boolean',
          description: 'Include detailed breakdown of each beast',
          default: false,
        },
      },
    },

    execute: async (params, context: ToolContext) => {
      const wallet = params.wallet as string | undefined;
      const detailed = params.detailed as boolean ?? false;

      // Get wallet to analyze
      let targetWallet = wallet;
      if (!targetWallet) {
        const tracked = await getTrackedWallets(context.userId);
        if (tracked.length === 0) {
          return {
            error: 'No wallet specified and no tracked wallets found. Please provide a wallet address or add one with the track_wallet tool.',
          };
        }
        targetWallet = tracked[0];
      }

      // Fetch beasts owned by wallet
      const beasts = await getWalletBeasts(targetWallet);
      if (beasts.length === 0) {
        return {
          wallet: targetWallet,
          totalBeasts: 0,
          message: 'This wallet does not hold any AKCB beasts.',
        };
      }

      // Get scores for analysis
      const tokenScores = await getTokenScores(beasts.map(b => b.tokenId));
      const grailScores = await getGrailScores();

      // Compute analysis
      const analysis = computePortfolioAnalysis(targetWallet, beasts, tokenScores, grailScores, detailed);

      return analysis;
    },
  });
}

function computePortfolioAnalysis(
  wallet: string,
  beasts: Beast[],
  tokenScores: Map<number, { compositeScore: number; vibeScore: number; archetype: string }>,
  grailScores: Map<string, number>,
  detailed: boolean
): PortfolioAnalysis {
  // Aggregate scores
  let totalComposite = 0;
  let totalVibe = 0;
  const archetypes: Record<string, number> = {};
  const traitCounts: Record<string, Set<string>> = {};

  for (const beast of beasts) {
    const score = tokenScores.get(beast.tokenId);
    if (score) {
      totalComposite += score.compositeScore;
      totalVibe += score.vibeScore;
      archetypes[score.archetype] = (archetypes[score.archetype] || 0) + 1;
    }

    // Track trait coverage
    for (const trait of beast.traits) {
      if (!traitCounts[trait.traitType]) {
        traitCounts[trait.traitType] = new Set();
      }
      traitCounts[trait.traitType].add(trait.value);
    }
  }

  const avgComposite = Math.round(totalComposite / beasts.length);
  const avgVibe = Math.round(totalVibe / beasts.length);

  // Identify strengths
  const strengths: string[] = [];
  if (avgComposite >= 70) strengths.push(`Strong average composite score (${avgComposite})`);
  if (avgVibe >= 60) strengths.push(`Premium trait lean (avg vibe ${avgVibe})`);
  if (Object.keys(archetypes).length >= 4) strengths.push('Good archetype diversity');

  // Identify suggestions
  const suggestions: string[] = [];
  if (avgComposite < 50) suggestions.push('Consider adding beasts with higher composite scores to improve portfolio quality');
  if (Object.keys(archetypes).length < 3) suggestions.push('Portfolio concentrated in few archetypes - consider diversifying');

  // Find trait gaps (simplified - would analyze against optimal distribution)
  const traitGaps = identifyTraitGaps(traitCounts, beasts.length);

  // Top beasts by composite
  const sortedBeasts = [...beasts].sort((a, b) => {
    const scoreA = tokenScores.get(a.tokenId)?.compositeScore ?? 0;
    const scoreB = tokenScores.get(b.tokenId)?.compositeScore ?? 0;
    return scoreB - scoreA;
  });

  return {
    wallet,
    totalBeasts: beasts.length,
    estimatedValue: 0, // Would calculate from floor + premiums
    averageComposite: avgComposite,
    averageVibe: avgVibe,
    archetypeDistribution: archetypes,
    traitGaps,
    strengths,
    suggestions,
    topBeasts: detailed ? sortedBeasts : sortedBeasts.slice(0, 3),
  };
}

function identifyTraitGaps(
  traitCounts: Record<string, Set<string>>,
  totalBeasts: number
): PortfolioAnalysis['traitGaps'] {
  const gaps: PortfolioAnalysis['traitGaps'] = [];

  // Check for valuable trait categories with low coverage
  const valuableCategories = ['Balaclava', 'Rare', 'Top', 'Chain'];

  for (const category of valuableCategories) {
    const coverage = traitCounts[category]?.size ?? 0;
    const coverageRatio = coverage / totalBeasts;

    if (coverageRatio < 0.3 && category === 'Balaclava') {
      gaps.push({
        traitType: 'Balaclava',
        currentCoverage: coverageRatio,
        suggestion: 'Balaclavas are identity-defining traits. Consider adding beasts with premium balaclavas.',
      });
    }
  }

  return gaps;
}
