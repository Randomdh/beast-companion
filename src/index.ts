// =============================================================================
// Beast Companion - OpenClaw Plugin Entry Point
// =============================================================================

import type { OpenClawPluginApi, BeastCompanionConfig } from './types.js';
import { registerPortfolioTool } from './tools/portfolio.js';
import { registerListingsTool } from './tools/listings.js';
import { registerEvaluateTool } from './tools/evaluate.js';
import { registerAlertsTool } from './tools/alerts.js';
import { registerMarketTool } from './tools/market.js';
import { registerJournalTool } from './tools/journal.js';
import { initDataLayer } from './data/index.js';
import { initStateManager } from './state/index.js';

// Plugin metadata
export const id = 'beast-companion';
export const name = 'Beast Companion';
export const version = '0.1.0';

// Plugin state
let runtime: OpenClawPluginApi['runtime'] | null = null;

/**
 * Plugin registration - called by OpenClaw on startup
 */
export async function activate(api: OpenClawPluginApi): Promise<void> {
  runtime = api.runtime;
  const config = api.runtime.getConfig<BeastCompanionConfig>();

  runtime.log('info', `Initializing Beast Companion v${version}`, { config });

  // Initialize data layer (scoring data, listings, chain data)
  await initDataLayer(config, runtime);

  // Initialize personal state manager (wallet, alerts, journal)
  await initStateManager(api.runtime.getDataPath(), runtime);

  // Register agent tools
  registerPortfolioTool(api);
  registerListingsTool(api);
  registerEvaluateTool(api);
  registerAlertsTool(api);
  registerMarketTool(api);
  registerJournalTool(api);

  // Register webhook for real-time sale notifications (optional)
  api.registerWebhookTarget({
    id: 'akcb-sales',
    name: 'AKCB Sales',
    description: 'Receive notifications for AKCB sales events',
  });

  // Register HTTP endpoint for health check
  api.registerPluginHttpRoute('/health', async () => ({
    status: 200,
    body: {
      plugin: id,
      version,
      status: 'ok',
      dataSource: config.dataSource,
    },
  }));

  runtime.log('info', 'Beast Companion initialized successfully');
}

/**
 * Get the plugin runtime (for use by tools)
 */
export function getRuntime() {
  if (!runtime) {
    throw new Error('Beast Companion not initialized');
  }
  return runtime;
}

// Default export for OpenClaw plugin loader
export default {
  id,
  name,
  version,
  activate,
};
