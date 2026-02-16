// =============================================================================
// Beast Companion - Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Plugin SDK Types (simplified - would come from @openclaw/plugin-sdk)
// -----------------------------------------------------------------------------

export interface OpenClawPluginApi {
  runtime: PluginRuntime;
  registerTool(config: ToolConfig): void;
  registerPluginHttpRoute(path: string, handler: HttpHandler): void;
  registerWebhookTarget(config: WebhookConfig): void;
  registerHook(type: string, handler: HookHandler): void;
}

export interface PluginRuntime {
  log: (level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => void;
  getConfig: <T>() => T;
  getDataPath: () => string;
}

export interface ToolConfig {
  name: string;
  description: string;
  parameters: ToolParameters;
  execute: (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolParameters {
  type: 'object';
  properties: Record<string, ParameterSchema>;
  required?: string[];
}

export interface ParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ParameterSchema;
  default?: unknown;
}

export interface ToolContext {
  userId?: string;
  channelId?: string;
  sessionId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolResult = string | Record<string, any> | Array<unknown>;

export type HttpHandler = (req: HttpRequest) => Promise<HttpResponse>;
export type HookHandler = (event: HookEvent) => Promise<void>;

export interface HttpRequest {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
}

export interface HttpResponse {
  status: number;
  body: unknown;
}

export interface WebhookConfig {
  id: string;
  name: string;
  description: string;
}

export interface HookEvent {
  type: string;
  data: unknown;
}

// -----------------------------------------------------------------------------
// AKCB Domain Types
// -----------------------------------------------------------------------------

export interface Beast {
  tokenId: number;
  traits: BeastTrait[];
  compositeScore?: number;
  vibeScore?: number;
  archetype?: string;
  synergy?: string;
  imageUrl?: string;
}

export interface BeastTrait {
  traitType: string;
  value: string;
  grailScore?: number;
  supply?: number;
  medianPremium?: number;
}

export interface GrailScore {
  trait: string;
  value: string;
  grailScore: number;
  scarcity: number;
  premium: number;
  velocity: number;
  conviction: number;
  momentum: number;
  cult: number;
  supply: number;
  recentSales: number;
  avgPrice?: number;
  recentAvg?: number;
}

export interface TokenScore {
  tokenId: number;
  compositeScore: number;
  traitStackScore: number;
  vibeScore: number;
  reputationScore: number;
  archetype: string;
  synergy?: string;
  fullSuit?: string;
  cohesion?: boolean;
  identityCombo?: boolean;
}

export interface Listing {
  tokenId: number;
  price: number;
  marketplace: string;
  seller: string;
  listedAt: Date;
  expiresAt?: Date;
  beast?: Beast;
  tokenScore?: TokenScore;
  grailScore?: number;
  valueScore?: number;
  discount?: number;
}

export interface PortfolioAnalysis {
  wallet: string;
  totalBeasts: number;
  estimatedValue: number;
  averageComposite: number;
  averageVibe: number;
  archetypeDistribution: Record<string, number>;
  traitGaps: TraitGap[];
  strengths: string[];
  suggestions: string[];
  topBeasts: Beast[];
}

export interface TraitGap {
  traitType: string;
  currentCoverage: number;
  suggestion: string;
  exampleListings?: Listing[];
}

export interface Alert {
  id: string;
  userId: string;
  type: 'listing' | 'sale' | 'price' | 'trait';
  criteria: AlertCriteria;
  createdAt: Date;
  lastTriggered?: Date;
  active: boolean;
}

export interface AlertCriteria {
  traitType?: string;
  traitValue?: string;
  maxPrice?: number;
  minComposite?: number;
  minVibe?: number;
  archetype?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  tokenId?: number;
  content: string;
  type: 'note' | 'thesis' | 'reminder';
  createdAt: Date;
  tags?: string[];
}

export interface MarketBrief {
  generatedAt: Date;
  floorPrice: number;
  floorChange24h: number;
  floorChange7d: number;
  volume24h: number;
  sales24h: number;
  avgSalePrice: number;
  holders: number;
  holdersChange7d: number;
  heatingTraits: TraitMomentum[];
  coolingTraits: TraitMomentum[];
  notableListings: Listing[];
  portfolioRelevant?: PortfolioInsight[];
}

export interface TraitMomentum {
  trait: string;
  value: string;
  direction: 'heating' | 'cooling' | 'steady';
  velocityChange: string;
  recentSales: number;
}

export interface PortfolioInsight {
  type: 'opportunity' | 'alert' | 'milestone';
  message: string;
  tokenId?: number;
  listing?: Listing;
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export interface BeastCompanionConfig {
  dataSource: 'local' | 'remote';
  dataApiUrl: string;
  localDataPath?: string;
  openSeaApiKey?: string;
  alchemyApiKey?: string;
  walletAddresses: string[];
}
