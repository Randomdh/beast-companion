// =============================================================================
// Journal State - Personal journal entries per user
// =============================================================================

import type { PluginRuntime, JournalEntry } from '../types.js';

interface JournalState {
  entries: Record<string, JournalEntry[]>; // userId -> entries
  nextId: number;
}

let state: JournalState = { entries: {}, nextId: 1 };
let statePath: string | null = null;
let runtime: PluginRuntime | null = null;

export async function initJournalState(dataPath: string, rt: PluginRuntime): Promise<void> {
  runtime = rt;
  const path = await import('path');
  statePath = path.join(dataPath, 'journal-state.json');

  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile(statePath, 'utf-8');
    const parsed = JSON.parse(data);

    // Restore dates
    state = {
      entries: {},
      nextId: parsed.nextId ?? 1,
    };

    for (const [userId, entries] of Object.entries(parsed.entries ?? {})) {
      state.entries[userId] = (entries as JournalEntry[]).map(e => ({
        ...e,
        createdAt: new Date(e.createdAt),
      }));
    }

    const totalEntries = Object.values(state.entries).reduce((sum, arr) => sum + arr.length, 0);
    runtime.log('info', 'Loaded journal state', { totalEntries });
  } catch {
    state = { entries: {}, nextId: 1 };
  }
}

async function saveState(): Promise<void> {
  if (!statePath) return;

  const fs = await import('fs/promises');
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

export async function createJournalEntry(
  userId: string,
  data: {
    content: string;
    tokenId?: number;
    type?: JournalEntry['type'];
    tags?: string[];
  }
): Promise<JournalEntry> {
  if (!state.entries[userId]) {
    state.entries[userId] = [];
  }

  const entry: JournalEntry = {
    id: `journal-${state.nextId++}`,
    userId,
    content: data.content,
    tokenId: data.tokenId,
    type: data.type ?? 'note',
    tags: data.tags,
    createdAt: new Date(),
  };

  state.entries[userId].push(entry);
  await saveState();

  runtime?.log('info', 'Created journal entry', { userId, entryId: entry.id, type: entry.type });
  return entry;
}

export async function getJournalEntries(
  userId: string,
  filters?: {
    tokenId?: number;
    type?: JournalEntry['type'];
    limit?: number;
  }
): Promise<JournalEntry[]> {
  let entries = state.entries[userId] ?? [];

  if (filters?.tokenId !== undefined) {
    entries = entries.filter(e => e.tokenId === filters.tokenId);
  }

  if (filters?.type) {
    entries = entries.filter(e => e.type === filters.type);
  }

  // Sort by newest first
  entries = [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (filters?.limit) {
    entries = entries.slice(0, filters.limit);
  }

  return entries;
}

export async function searchJournal(
  userId: string,
  query: string,
  limit: number
): Promise<JournalEntry[]> {
  const entries = state.entries[userId] ?? [];
  const lowerQuery = query.toLowerCase();

  const matches = entries.filter(e => {
    // Search in content
    if (e.content.toLowerCase().includes(lowerQuery)) return true;

    // Search in tags
    if (e.tags?.some(t => t.toLowerCase().includes(lowerQuery))) return true;

    // Search by token ID
    if (e.tokenId && String(e.tokenId).includes(query)) return true;

    return false;
  });

  // Sort by relevance (exact matches first, then by date)
  matches.sort((a, b) => {
    const aExact = a.content.toLowerCase().includes(lowerQuery);
    const bExact = b.content.toLowerCase().includes(lowerQuery);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return matches.slice(0, limit);
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<boolean> {
  const entries = state.entries[userId];
  if (!entries) return false;

  const index = entries.findIndex(e => e.id === entryId);
  if (index < 0) return false;

  entries.splice(index, 1);
  await saveState();

  runtime?.log('info', 'Deleted journal entry', { userId, entryId });
  return true;
}

/**
 * Get all entries for a specific token across all users (for community insights)
 */
export async function getEntriesForToken(tokenId: number): Promise<JournalEntry[]> {
  const all: JournalEntry[] = [];
  for (const entries of Object.values(state.entries)) {
    all.push(...entries.filter(e => e.tokenId === tokenId));
  }
  return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
