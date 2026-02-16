// Beast Companion - OpenClaw Plugin
// Simple inline version for compatibility

import type { OpenClawPluginApi, BeastCompanionConfig } from './src/types.js';
import { registerPortfolioTool } from './dist/tools/portfolio.js';
import { registerListingsTool } from './dist/tools/listings.js';
import { registerEvaluateTool } from './dist/tools/evaluate.js';
import { registerAlertsTool } from './dist/tools/alerts.js';
import { registerMarketTool } from './dist/tools/market.js';
import { registerJournalTool } from './dist/tools/journal.js';
import { initDataLayer } from './dist/data/index.js';
import { initStateManager } from './dist/state/index.js';

let runtime: any = null;

const plugin = {
  id: 'beast-companion',
  name: 'Beast Companion',
  description: 'Personal AI assistant for A Kid Called Beast collectors',
  configSchema: {
    type: 'object' as const,
    properties: {
      dataSource: { type: 'string', default: 'remote' },
      dataApiUrl: { type: 'string', default: 'http://129.158.41.81:3100' },
      walletAddresses: { type: 'array', default: [] },
    },
  },

  async register(api: OpenClawPluginApi) {
    runtime = api.runtime;
    const config = api.runtime.getConfig<BeastCompanionConfig>();

    runtime.log('info', 'Initializing Beast Companion', { config });

    await initDataLayer(config, runtime);
    await initStateManager(api.runtime.getDataPath(), runtime);

    registerPortfolioTool(api);
    registerListingsTool(api);
    registerEvaluateTool(api);
    registerAlertsTool(api);
    registerMarketTool(api);
    registerJournalTool(api);

    runtime.log('info', 'Beast Companion initialized');
  },
};

export default plugin;
