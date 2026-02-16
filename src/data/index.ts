// =============================================================================
// Data Layer - Main Export
// =============================================================================

import type { BeastCompanionConfig, PluginRuntime, Beast, TokenScore, GrailScore, Listing, TraitMomentum } from '../types.js';
import { ScoresProvider, createScoresProvider } from './scores.js';
import { ListingsProvider, createListingsProvider } from './listings.js';
import { ChainProvider, createChainProvider } from './chain.js';

// Singleton providers
let scoresProvider: ScoresProvider | null = null;
let listingsProvider: ListingsProvider | null = null;
let chainProvider: ChainProvider | null = null;
let runtime: PluginRuntime | null = null;

/**
 * Initialize the data layer with configuration
 */
export async function initDataLayer(config: BeastCompanionConfig, rt: PluginRuntime): Promise<void> {
  runtime = rt;

  runtime.log('info', 'Initializing data layer', { dataSource: config.dataSource });

  // Initialize scores provider (grail scores, token scores, trait demand)
  scoresProvider = await createScoresProvider(config, runtime);

  // Initialize listings provider (OpenSea, Blur)
  listingsProvider = await createListingsProvider(config, runtime);

  // Initialize chain provider (on-chain data, wallet holdings)
  chainProvider = await createChainProvider(config, runtime);

  runtime.log('info', 'Data layer initialized');
}

// -----------------------------------------------------------------------------
// Scores Data
// -----------------------------------------------------------------------------

export async function getGrailScores(): Promise<Map<string, number>> {
  if (!scoresProvider) throw new Error('Data layer not initialized');
  return scoresProvider.getAllGrailScores();
}

export async function getGrailScore(traitType: string, traitValue: string): Promise<number | undefined> {
  if (!scoresProvider) throw new Error('Data layer not initialized');
  return scoresProvider.getGrailScore(traitType, traitValue);
}

export async function getGrailScoresForToken(tokenId: number): Promise<Map<string, GrailScore>> {
  if (!scoresProvider) throw new Error('Data layer not initialized');
  return scoresProvider.getGrailScoresForToken(tokenId);
}

export async function getTokenScore(tokenId: number): Promise<TokenScore | undefined> {
  if (!scoresProvider) throw new Error('Data layer not initialized');
  return scoresProvider.getTokenScore(tokenId);
}

export async function getTokenScores(tokenIds: number[]): Promise<Map<number, TokenScore>> {
  if (!scoresProvider) throw new Error('Data layer not initialized');
  return scoresProvider.getTokenScores(tokenIds);
}

export async function getHeatingTraits(limit: number): Promise<TraitMomentum[]> {
  if (!scoresProvider) throw new Error('Data layer not initialized');
  return scoresProvider.getHeatingTraits(limit);
}

export async function getCoolingTraits(limit: number): Promise<TraitMomentum[]> {
  if (!scoresProvider) throw new Error('Data layer not initialized');
  return scoresProvider.getCoolingTraits(limit);
}

// -----------------------------------------------------------------------------
// Listings Data
// -----------------------------------------------------------------------------

export async function searchListings(criteria: {
  traitType?: string;
  traitValue?: string;
  maxPrice?: number;
  minPrice?: number;
  minComposite?: number;
  minVibe?: number;
  archetype?: string;
}): Promise<Listing[]> {
  if (!listingsProvider) throw new Error('Data layer not initialized');
  return listingsProvider.search(criteria);
}

export async function getCurrentListing(tokenId: number): Promise<Listing | undefined> {
  if (!listingsProvider) throw new Error('Data layer not initialized');
  return listingsProvider.getByTokenId(tokenId);
}

export async function getNotableListings(limit: number): Promise<Listing[]> {
  if (!listingsProvider) throw new Error('Data layer not initialized');
  return listingsProvider.getNotable(limit);
}

// -----------------------------------------------------------------------------
// Chain Data
// -----------------------------------------------------------------------------

export async function getBeast(tokenId: number): Promise<Beast | undefined> {
  if (!chainProvider) throw new Error('Data layer not initialized');
  return chainProvider.getBeast(tokenId);
}

export async function getWalletBeasts(wallet: string): Promise<Beast[]> {
  if (!chainProvider) throw new Error('Data layer not initialized');
  return chainProvider.getWalletBeasts(wallet);
}

export async function getRecentSales(tokenId: number, limit: number): Promise<Array<{ price: number; date: Date; marketplace: string }>> {
  if (!chainProvider) throw new Error('Data layer not initialized');
  return chainProvider.getRecentSales(tokenId, limit);
}

export async function getMarketStats(timeframe: string): Promise<{
  floorPrice: number;
  floorChange24h: number;
  floorChange7d: number;
  volume24h: number;
  sales24h: number;
  avgSalePrice: number;
  holders: number;
  holdersChange7d: number;
}> {
  if (!chainProvider) throw new Error('Data layer not initialized');
  return chainProvider.getMarketStats(timeframe);
}
