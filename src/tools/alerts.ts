// =============================================================================
// Personal Alerts Tool
// =============================================================================

import type { OpenClawPluginApi, ToolContext, Alert, AlertCriteria } from '../types.js';
import { createAlert, getAlerts, deleteAlert, updateAlert } from '../state/alerts.js';

export function registerAlertsTool(api: OpenClawPluginApi): void {
  api.registerTool({
    name: 'akcb_track_alert',
    description: `Create, view, or manage personal alerts for AKCB listings and sales.
Set custom criteria like trait, price range, score thresholds, and archetype.
Get notified when matching listings appear.`,

    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'list', 'delete', 'pause', 'resume'],
          description: 'Action to perform',
          default: 'list',
        },
        alertId: {
          type: 'string',
          description: 'Alert ID (required for delete/pause/resume)',
        },
        // Create parameters
        alertType: {
          type: 'string',
          enum: ['listing', 'sale', 'price', 'trait'],
          description: 'Type of alert to create',
        },
        traitType: {
          type: 'string',
          description: 'Filter by trait category (e.g., "Balaclava", "Top")',
        },
        traitValue: {
          type: 'string',
          description: 'Filter by specific trait value (e.g., "Wolf", "Robot Suit")',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price in ETH',
        },
        minComposite: {
          type: 'number',
          description: 'Minimum composite score',
        },
        minVibe: {
          type: 'number',
          description: 'Minimum vibe score',
        },
        archetype: {
          type: 'string',
          description: 'Filter by archetype',
        },
      },
    },

    execute: async (params, context: ToolContext) => {
      const action = (params.action as string) ?? 'list';
      const userId = context.userId ?? 'default';

      switch (action) {
        case 'list': {
          const alerts = await getAlerts(userId);
          if (alerts.length === 0) {
            return {
              message: 'No active alerts. Create one with action: "create"',
              alerts: [],
            };
          }
          return {
            count: alerts.length,
            alerts: alerts.map(formatAlert),
          };
        }

        case 'create': {
          const alertType = params.alertType as Alert['type'] | undefined;
          if (!alertType) {
            return { error: 'alertType is required for create action' };
          }

          const criteria: AlertCriteria = {};
          if (params.traitType) criteria.traitType = params.traitType as string;
          if (params.traitValue) criteria.traitValue = params.traitValue as string;
          if (params.maxPrice) criteria.maxPrice = params.maxPrice as number;
          if (params.minComposite) criteria.minComposite = params.minComposite as number;
          if (params.minVibe) criteria.minVibe = params.minVibe as number;
          if (params.archetype) criteria.archetype = params.archetype as string;

          // Validate criteria
          if (Object.keys(criteria).length === 0) {
            return { error: 'At least one filter criteria is required' };
          }

          const alert = await createAlert(userId, alertType, criteria);
          return {
            message: 'Alert created successfully',
            alert: formatAlert(alert),
          };
        }

        case 'delete': {
          const alertId = params.alertId as string | undefined;
          if (!alertId) {
            return { error: 'alertId is required for delete action' };
          }

          const success = await deleteAlert(userId, alertId);
          if (!success) {
            return { error: 'Alert not found' };
          }
          return { message: `Alert ${alertId} deleted` };
        }

        case 'pause': {
          const alertId = params.alertId as string | undefined;
          if (!alertId) {
            return { error: 'alertId is required for pause action' };
          }

          const updated = await updateAlert(userId, alertId, { active: false });
          if (!updated) {
            return { error: 'Alert not found' };
          }
          return { message: `Alert ${alertId} paused`, alert: formatAlert(updated) };
        }

        case 'resume': {
          const alertId = params.alertId as string | undefined;
          if (!alertId) {
            return { error: 'alertId is required for resume action' };
          }

          const updated = await updateAlert(userId, alertId, { active: true });
          if (!updated) {
            return { error: 'Alert not found' };
          }
          return { message: `Alert ${alertId} resumed`, alert: formatAlert(updated) };
        }

        default:
          return { error: `Unknown action: ${action}` };
      }
    },
  });
}

function formatAlert(alert: Alert) {
  const criteriaDesc: string[] = [];

  if (alert.criteria.traitType && alert.criteria.traitValue) {
    criteriaDesc.push(`${alert.criteria.traitType}: ${alert.criteria.traitValue}`);
  } else if (alert.criteria.traitType) {
    criteriaDesc.push(`Any ${alert.criteria.traitType}`);
  } else if (alert.criteria.traitValue) {
    criteriaDesc.push(`Trait: ${alert.criteria.traitValue}`);
  }

  if (alert.criteria.maxPrice) {
    criteriaDesc.push(`Max ${alert.criteria.maxPrice} ETH`);
  }
  if (alert.criteria.minComposite) {
    criteriaDesc.push(`Composite ${alert.criteria.minComposite}+`);
  }
  if (alert.criteria.minVibe) {
    criteriaDesc.push(`Vibe ${alert.criteria.minVibe}+`);
  }
  if (alert.criteria.archetype) {
    criteriaDesc.push(`Archetype: ${alert.criteria.archetype}`);
  }

  return {
    id: alert.id,
    type: alert.type,
    criteria: criteriaDesc.join(', ') || 'Any',
    active: alert.active,
    createdAt: alert.createdAt.toISOString().split('T')[0],
    lastTriggered: alert.lastTriggered?.toISOString().split('T')[0],
  };
}
