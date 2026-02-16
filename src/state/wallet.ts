// =============================================================================
// Wallet State - Tracked wallets per user
// =============================================================================

import type { PluginRuntime } from '../types.js';

interface WalletState {
  wallets: Record<string, string[]>; // userId -> wallet addresses
}

let state: WalletState = { wallets: {} };
let statePath: string | null = null;
let runtime: PluginRuntime | null = null;

export async function initWalletState(dataPath: string, rt: PluginRuntime): Promise<void> {
  runtime = rt;
  const path = await import('path');
  statePath = path.join(dataPath, 'wallet-state.json');

  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile(statePath, 'utf-8');
    state = JSON.parse(data);
    runtime.log('info', 'Loaded wallet state', { users: Object.keys(state.wallets).length });
  } catch {
    // File doesn't exist yet, start fresh
    state = { wallets: {} };
  }
}

async function saveState(): Promise<void> {
  if (!statePath) return;

  const fs = await import('fs/promises');
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

export async function getTrackedWallets(userId?: string): Promise<string[]> {
  const id = userId ?? 'default';
  return state.wallets[id] ?? [];
}

export async function addTrackedWallet(userId: string, wallet: string): Promise<void> {
  const id = userId ?? 'default';
  if (!state.wallets[id]) {
    state.wallets[id] = [];
  }

  // Normalize address
  const normalized = wallet.toLowerCase();

  if (!state.wallets[id].includes(normalized)) {
    state.wallets[id].push(normalized);
    await saveState();
    runtime?.log('info', 'Added tracked wallet', { userId: id, wallet: normalized });
  }
}

export async function removeTrackedWallet(userId: string, wallet: string): Promise<boolean> {
  const id = userId ?? 'default';
  if (!state.wallets[id]) return false;

  const normalized = wallet.toLowerCase();
  const index = state.wallets[id].indexOf(normalized);

  if (index >= 0) {
    state.wallets[id].splice(index, 1);
    await saveState();
    runtime?.log('info', 'Removed tracked wallet', { userId: id, wallet: normalized });
    return true;
  }

  return false;
}
