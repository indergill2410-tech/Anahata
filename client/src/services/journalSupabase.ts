/**
 * Anahata — Journal service (Supabase)
 *
 * Drop-in replacement for createJournalApi() that talks to Supabase directly
 * instead of the Express /api/journal routes. Row Level Security (see
 * supabase/journal_entries.sql) scopes every query to the signed-in user, so
 * no server middleware is needed — the anon key + the user's session is enough.
 *
 * Usage:
 *   import { createClient } from '@supabase/supabase-js';
 *   import { createJournalSupabase } from './services/journalSupabase';
 *
 *   const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
 *   const journal = createJournalSupabase(supabase);
 *   await journal.list({ type: 'dream' });
 *
 * The returned object matches the shape of createJournalApi() (list/save/update/
 * remove/importEntries/exportEntries/deleteAll) so page components can swap in
 * with minimal changes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { JournalEntry, JournalEntryPayload, JournalEntryType } from './journalApi';

const TABLE = 'journal_entries';

// Supabase stores created_at/updated_at; the app's JournalEntry type expects
// created/updated. Expose both so existing components keep working.
function fromRow(row: Record<string, unknown>): JournalEntry {
  return {
    ...(row as JournalEntry),
    created: (row.created_at as string) ?? undefined,
    updated: (row.updated_at as string) ?? undefined,
  };
}

function normalizePayload(entry: JournalEntryPayload) {
  return {
    entry_type: entry.entry_type,
    entry_date: entry.entry_date,
    mood: entry.mood ?? null,
    lucidity: entry.lucidity ?? null,
    title: entry.title ?? '',
    text: entry.text ?? '',
    follow_up: entry.follow_up ?? '',
    prompt: entry.prompt ?? '',
    cta: entry.cta ?? '',
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
  };
}

async function currentUserId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('You need to be signed in to use your journal.');
  return data.user.id;
}

export function createJournalSupabase(supabase: SupabaseClient) {
  return {
    async list(params: { type?: JournalEntryType; from?: string; to?: string; page?: number; limit?: number } = {}) {
      const page = Math.max(params.page ?? 1, 1);
      const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
      const rangeFrom = (page - 1) * limit;

      let query = supabase
        .from(TABLE)
        .select('*', { count: 'exact' })
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (params.type) query = query.eq('entry_type', params.type);
      if (params.from) query = query.gte('entry_date', params.from);
      if (params.to) query = query.lte('entry_date', params.to);

      const { data, error, count } = await query.range(rangeFrom, rangeFrom + limit - 1);
      if (error) throw new Error(error.message);

      const totalItems = count ?? data?.length ?? 0;
      return {
        entries: (data ?? []).map(fromRow),
        pagination: {
          page,
          perPage: limit,
          totalItems,
          totalPages: Math.max(Math.ceil(totalItems / limit), 1),
        },
      };
    },

    async save(entry: JournalEntryPayload) {
      const user_id = await currentUserId(supabase);
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...normalizePayload(entry), user_id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { entry: fromRow(data) };
    },

    async update(id: string, entry: Partial<JournalEntryPayload>) {
      // Only send provided fields; RLS ensures the row belongs to the user.
      const patch: Record<string, unknown> = {};
      const full = normalizePayload(entry as JournalEntryPayload);
      (Object.keys(entry) as (keyof JournalEntryPayload)[]).forEach((key) => {
        patch[key] = full[key as keyof typeof full];
      });

      const { data, error } = await supabase
        .from(TABLE)
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { entry: fromRow(data) };
    },

    async remove(id: string) {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw new Error('This journal entry needs another try before it can be removed.');
    },

    async importEntries(entries: JournalEntryPayload[]) {
      const user_id = await currentUserId(supabase);
      const rows = entries.slice(0, 200).map((e) => ({ ...normalizePayload(e), user_id }));
      const { data, error } = await supabase.from(TABLE).insert(rows).select();
      if (error) throw new Error(error.message);
      const imported = (data ?? []).map(fromRow);
      return { imported, skipped: [] as unknown[], count: imported.length };
    },

    async exportEntries() {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const entries = (data ?? []).map(fromRow);
      return { exported_at: new Date().toISOString(), count: entries.length, entries };
    },

    async deleteAll() {
      const user_id = await currentUserId(supabase);
      const { data, error } = await supabase
        .from(TABLE)
        .delete()
        .eq('user_id', user_id)
        .select('id');
      if (error) throw new Error(error.message);
      return { deleted: (data ?? []).length };
    },
  };
}
