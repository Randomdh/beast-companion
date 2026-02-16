// =============================================================================
// State Management - Main Export
// =============================================================================

import type { PluginRuntime, Beast } from '../types.js';
import { initWalletState, getTrackedWallets as getWallets, addTrackedWallet, removeTrackedWallet } from './wallet.js';
import { initAlertsState } from './alerts.js';
import { initJournalState } from './journal.js';
import { getWalletBeasts as fetchWalletBeasts } from '../data/index.js';

let runtime: PluginRuntime | null = null;
let dataPath: string | null = null;

/**
 * Initialize state management
 */
export async function initStateManager(path: string, rt: PluginRuntime): Promise<void> {
  runtime = rt;
  dataPath = path;

  runtime.log('info', 'Initializing state manager', { dataPath: path });

  await initWalletState(path, runtime);
  await initAlertsState(path, runtime);
  await initJournalState(path, runtime);

  runtime.log('info', 'State manager initialized');
}

// Re-export wallet functions
export { getWallets as getTrackedWallets, addTrackedWallet, removeTrackedWallet };

// Re-export for tools that need wallet beasts
export async function getWalletBeasts(wallet: string): Promise<Beast[]> {
  return fetchWalletBeasts(wallet);
}
