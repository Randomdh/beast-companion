// =============================================================================
// Journal Tool
// =============================================================================

import type { OpenClawPluginApi, ToolContext, JournalEntry } from '../types.js';
import { createJournalEntry, getJournalEntries, searchJournal, deleteJournalEntry } from '../state/journal.js';

export function registerJournalTool(api: OpenClawPluginApi): void {
  api.registerTool({
    name: 'akcb_journal',
    description: `Personal collecting journal for AKCB. Add notes about why you bought a beast,
your collecting thesis, reminders, or any thoughts. Can be attached to specific tokens or be general.
Search your past entries to recall your reasoning.`,

    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'list', 'search', 'delete'],
          description: 'Action to perform',
          default: 'list',
        },
        // Add parameters
        content: {
          type: 'string',
          description: 'Journal entry content (required for add)',
        },
        tokenId: {
          type: 'number',
          description: 'Attach entry to a specific beast token ID',
        },
        type: {
          type: 'string',
          enum: ['note', 'thesis', 'reminder'],
          description: 'Type of journal entry',
          default: 'note',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
        // List/search parameters
        searchQuery: {
          type: 'string',
          description: 'Search query for finding entries',
        },
        filterTokenId: {
          type: 'number',
          description: 'Filter entries for a specific beast',
        },
        filterType: {
          type: 'string',
          enum: ['note', 'thesis', 'reminder'],
          description: 'Filter by entry type',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 10,
        },
        // Delete parameter
        entryId: {
          type: 'string',
          description: 'Entry ID to delete',
        },
      },
    },

    execute: async (params, context: ToolContext) => {
      const action = (params.action as string) ?? 'list';
      const userId = context.userId ?? 'default';

      switch (action) {
        case 'add': {
          const content = params.content as string | undefined;
          if (!content) {
            return { error: 'content is required for add action' };
          }

          const entry = await createJournalEntry(userId, {
            content,
            tokenId: params.tokenId as number | undefined,
            type: (params.type as JournalEntry['type']) ?? 'note',
            tags: params.tags as string[] | undefined,
          });

          return {
            message: 'Journal entry added',
            entry: formatEntry(entry),
          };
        }

        case 'list': {
          const entries = await getJournalEntries(userId, {
            tokenId: params.filterTokenId as number | undefined,
            type: params.filterType as JournalEntry['type'] | undefined,
            limit: (params.limit as number) ?? 10,
          });

          if (entries.length === 0) {
            return {
              message: 'No journal entries yet. Add one with action: "add"',
              entries: [],
            };
          }

          return {
            count: entries.length,
            entries: entries.map(formatEntry),
          };
        }

        case 'search': {
          const query = params.searchQuery as string | undefined;
          if (!query) {
            return { error: 'searchQuery is required for search action' };
          }

          const entries = await searchJournal(userId, query, (params.limit as number) ?? 10);

          if (entries.length === 0) {
            return {
              message: `No entries found matching "${query}"`,
              entries: [],
            };
          }

          return {
            query,
            count: entries.length,
            entries: entries.map(formatEntry),
          };
        }

        case 'delete': {
          const entryId = params.entryId as string | undefined;
          if (!entryId) {
            return { error: 'entryId is required for delete action' };
          }

          const success = await deleteJournalEntry(userId, entryId);
          if (!success) {
            return { error: 'Entry not found' };
          }
          return { message: `Entry ${entryId} deleted` };
        }

        default:
          return { error: `Unknown action: ${action}` };
      }
    },
  });
}

function formatEntry(entry: JournalEntry) {
  return {
    id: entry.id,
    type: entry.type,
    content: entry.content,
    tokenId: entry.tokenId,
    tags: entry.tags,
    createdAt: entry.createdAt.toISOString().split('T')[0],
  };
}
