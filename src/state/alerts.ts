// =============================================================================
// Alerts State - Personal alerts per user
// =============================================================================

import type { PluginRuntime, Alert, AlertCriteria } from '../types.js';

interface AlertsState {
  alerts: Record<string, Alert[]>; // userId -> alerts
  nextId: number;
}

let state: AlertsState = { alerts: {}, nextId: 1 };
let statePath: string | null = null;
let runtime: PluginRuntime | null = null;

export async function initAlertsState(dataPath: string, rt: PluginRuntime): Promise<void> {
  runtime = rt;
  const path = await import('path');
  statePath = path.join(dataPath, 'alerts-state.json');

  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile(statePath, 'utf-8');
    const parsed = JSON.parse(data);

    // Restore dates
    state = {
      alerts: {},
      nextId: parsed.nextId ?? 1,
    };

    for (const [userId, alerts] of Object.entries(parsed.alerts ?? {})) {
      state.alerts[userId] = (alerts as Alert[]).map(a => ({
        ...a,
        createdAt: new Date(a.createdAt),
        lastTriggered: a.lastTriggered ? new Date(a.lastTriggered) : undefined,
      }));
    }

    const totalAlerts = Object.values(state.alerts).reduce((sum, arr) => sum + arr.length, 0);
    runtime.log('info', 'Loaded alerts state', { totalAlerts });
  } catch {
    state = { alerts: {}, nextId: 1 };
  }
}

async function saveState(): Promise<void> {
  if (!statePath) return;

  const fs = await import('fs/promises');
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

export async function getAlerts(userId: string): Promise<Alert[]> {
  return state.alerts[userId] ?? [];
}

export async function createAlert(
  userId: string,
  type: Alert['type'],
  criteria: AlertCriteria
): Promise<Alert> {
  if (!state.alerts[userId]) {
    state.alerts[userId] = [];
  }

  const alert: Alert = {
    id: `alert-${state.nextId++}`,
    userId,
    type,
    criteria,
    createdAt: new Date(),
    active: true,
  };

  state.alerts[userId].push(alert);
  await saveState();

  runtime?.log('info', 'Created alert', { userId, alertId: alert.id, type });
  return alert;
}

export async function updateAlert(
  userId: string,
  alertId: string,
  updates: Partial<Pick<Alert, 'active' | 'criteria'>>
): Promise<Alert | null> {
  const alerts = state.alerts[userId];
  if (!alerts) return null;

  const index = alerts.findIndex(a => a.id === alertId);
  if (index < 0) return null;

  alerts[index] = { ...alerts[index], ...updates };
  await saveState();

  runtime?.log('info', 'Updated alert', { userId, alertId, updates });
  return alerts[index];
}

export async function deleteAlert(userId: string, alertId: string): Promise<boolean> {
  const alerts = state.alerts[userId];
  if (!alerts) return false;

  const index = alerts.findIndex(a => a.id === alertId);
  if (index < 0) return false;

  alerts.splice(index, 1);
  await saveState();

  runtime?.log('info', 'Deleted alert', { userId, alertId });
  return true;
}

export async function markAlertTriggered(userId: string, alertId: string): Promise<void> {
  const alerts = state.alerts[userId];
  if (!alerts) return;

  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.lastTriggered = new Date();
    await saveState();
  }
}

/**
 * Get all active alerts across all users (for background checking)
 */
export async function getAllActiveAlerts(): Promise<Alert[]> {
  const all: Alert[] = [];
  for (const alerts of Object.values(state.alerts)) {
    all.push(...alerts.filter(a => a.active));
  }
  return all;
}
