// =============================================================================
// Scores Provider - Grail scores, token scores, trait momentum
// =============================================================================

import type { BeastCompanionConfig, PluginRuntime, TokenScore, GrailScore, TraitMomentum } from '../types.js';

export interface ScoresProvider {
  getAllGrailScores(): Promise<Map<string, number>>;
  getGrailScore(traitType: string, traitValue: string): Promise<number | undefined>;
  getGrailScoresForToken(tokenId: number): Promise<Map<string, GrailScore>>;
  getTokenScore(tokenId: number): Promise<TokenScore | undefined>;
  getTokenScores(tokenIds: number[]): Promise<Map<number, TokenScore>>;
  getHeatingTraits(limit: number): Promise<TraitMomentum[]>;
  getCoolingTraits(limit: number): Promise<TraitMomentum[]>;
}

/**
 * Create scores provider based on configuration
 */
export async function createScoresProvider(
  config: BeastCompanionConfig,
  runtime: PluginRuntime
): Promise<ScoresProvider> {
  if (config.dataSource === 'local') {
    return new LocalScoresProvider(config.localDataPath!, runtime);
  }
  return new RemoteScoresProvider(config.dataApiUrl, runtime);
}

// -----------------------------------------------------------------------------
// Local Provider (reads from local JSON files)
// -----------------------------------------------------------------------------

class LocalScoresProvider implements ScoresProvider {
  private grailScores: Map<string, GrailScore> = new Map();
  private tokenScores: Map<number, TokenScore> = new Map();
  private traitCache: Map<number, Array<{ traitType: string; value: string }>> = new Map();

  constructor(
    private dataPath: string,
    private runtime: PluginRuntime
  ) {}

  private async ensureLoaded(): Promise<void> {
    if (this.grailScores.size > 0) return;

    const fs = await import('fs/promises');
    const path = await import('path');

    // Load grail scores
    try {
      const grailData = await fs.readFile(path.join(this.dataPath, 'grail-scores.json'), 'utf-8');
      const grails = JSON.parse(grailData) as GrailScore[];
      for (const g of grails) {
        this.grailScores.set(`${g.trait}:${g.value}`, g);
      }
      this.runtime.log('info', `Loaded ${this.grailScores.size} grail scores`);
    } catch (e) {
      this.runtime.log('error', 'Failed to load grail scores', { error: String(e) });
    }

    // Load token scores
    try {
      const tokenData = await fs.readFile(path.join(this.dataPath, 'token-scores.json'), 'utf-8');
      const tokens = JSON.parse(tokenData) as TokenScore[];
      for (const t of tokens) {
        this.tokenScores.set(t.tokenId, t);
      }
      this.runtime.log('info', `Loaded ${this.tokenScores.size} token scores`);
    } catch (e) {
      this.runtime.log('error', 'Failed to load token scores', { error: String(e) });
    }

    // Load trait cache
    try {
      const cacheData = await fs.readFile(path.join(this.dataPath, 'trait-cache.json'), 'utf-8');
      const cache = JSON.parse(cacheData) as Record<string, Array<{ trait_type: string; value: string }>>;
      for (const [tokenId, traits] of Object.entries(cache)) {
        this.traitCache.set(Number(tokenId), traits.map(t => ({ traitType: t.trait_type, value: t.value })));
      }
      this.runtime.log('info', `Loaded trait cache for ${this.traitCache.size} tokens`);
    } catch (e) {
      this.runtime.log('error', 'Failed to load trait cache', { error: String(e) });
    }
  }

  async getAllGrailScores(): Promise<Map<string, number>> {
    await this.ensureLoaded();
    const result = new Map<string, number>();
    for (const [key, score] of this.grailScores) {
      result.set(key, score.grailScore);
    }
    return result;
  }

  async getGrailScore(traitType: string, traitValue: string): Promise<number | undefined> {
    await this.ensureLoaded();
    return this.grailScores.get(`${traitType}:${traitValue}`)?.grailScore;
  }

  async getGrailScoresForToken(tokenId: number): Promise<Map<string, GrailScore>> {
    await this.ensureLoaded();
    const result = new Map<string, GrailScore>();
    const traits = this.traitCache.get(tokenId) ?? [];

    for (const trait of traits) {
      const key = `${trait.traitType}:${trait.value}`;
      const score = this.grailScores.get(key);
      if (score) {
        result.set(key, score);
      }
    }

    return result;
  }

  async getTokenScore(tokenId: number): Promise<TokenScore | undefined> {
    await this.ensureLoaded();
    return this.tokenScores.get(tokenId);
  }

  async getTokenScores(tokenIds: number[]): Promise<Map<number, TokenScore>> {
    await this.ensureLoaded();
    const result = new Map<number, TokenScore>();
    for (const id of tokenIds) {
      const score = this.tokenScores.get(id);
      if (score) result.set(id, score);
    }
    return result;
  }

  async getHeatingTraits(limit: number): Promise<TraitMomentum[]> {
    await this.ensureLoaded();
    // TODO: Implement momentum tracking from trait-demand.json
    return [];
  }

  async getCoolingTraits(limit: number): Promise<TraitMomentum[]> {
    await this.ensureLoaded();
    // TODO: Implement momentum tracking
    return [];
  }
}

// -----------------------------------------------------------------------------
// Remote Provider (fetches from API)
// -----------------------------------------------------------------------------

class RemoteScoresProvider implements ScoresProvider {
  private cache: {
    grailScores?: { data: Map<string, GrailScore>; expires: number };
    tokenScores?: { data: Map<number, TokenScore>; expires: number };
  } = {};

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private apiUrl: string,
    private runtime: PluginRuntime
  ) {}

  private async fetchJson<T>(endpoint: string): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async getAllGrailScores(): Promise<Map<string, number>> {
    const now = Date.now();
    if (this.cache.grailScores && this.cache.grailScores.expires > now) {
      const result = new Map<string, number>();
      for (const [key, score] of this.cache.grailScores.data) {
        result.set(key, score.grailScore);
      }
      return result;
    }

    const grails = await this.fetchJson<GrailScore[]>('/v1/grail-scores');
    const data = new Map<string, GrailScore>();
    for (const g of grails) {
      data.set(`${g.trait}:${g.value}`, g);
    }
    this.cache.grailScores = { data, expires: now + this.CACHE_TTL };

    const result = new Map<string, number>();
    for (const [key, score] of data) {
      result.set(key, score.grailScore);
    }
    return result;
  }

  async getGrailScore(traitType: string, traitValue: string): Promise<number | undefined> {
    const all = await this.getAllGrailScores();
    return all.get(`${traitType}:${traitValue}`);
  }

  async getGrailScoresForToken(tokenId: number): Promise<Map<string, GrailScore>> {
    const scores = await this.fetchJson<GrailScore[]>(`/v1/tokens/${tokenId}/grail-scores`);
    const result = new Map<string, GrailScore>();
    for (const s of scores) {
      result.set(`${s.trait}:${s.value}`, s);
    }
    return result;
  }

  async getTokenScore(tokenId: number): Promise<TokenScore | undefined> {
    try {
      return await this.fetchJson<TokenScore>(`/v1/tokens/${tokenId}/score`);
    } catch {
      return undefined;
    }
  }

  async getTokenScores(tokenIds: number[]): Promise<Map<number, TokenScore>> {
    const scores = await this.fetchJson<TokenScore[]>(`/v1/tokens/scores?ids=${tokenIds.join(',')}`);
    const result = new Map<number, TokenScore>();
    for (const s of scores) {
      result.set(s.tokenId, s);
    }
    return result;
  }

  async getHeatingTraits(limit: number): Promise<TraitMomentum[]> {
    return this.fetchJson<TraitMomentum[]>(`/v1/traits/heating?limit=${limit}`);
  }

  async getCoolingTraits(limit: number): Promise<TraitMomentum[]> {
    return this.fetchJson<TraitMomentum[]>(`/v1/traits/cooling?limit=${limit}`);
  }
}
