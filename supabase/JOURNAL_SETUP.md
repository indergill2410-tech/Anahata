# Supabase Journalling — Setup

For the rebuilt app, journalling moves from PocketBase to Supabase. Audio stays
on the existing Cloudflare R2 bucket (URLs unchanged in `client/src/data/libraryData.ts`).

## 1. Create the table

In the Supabase dashboard → SQL Editor, run:

- `supabase/journal_entries.sql`

This creates `public.journal_entries` with Row Level Security so each user only
ever reads/writes their own entries, plus an `updated_at` trigger and indexes.
It mirrors the old PocketBase `journal_entries` fields (entry_type, entry_date,
mood, lucidity, title, text, follow_up, prompt, cta, tags, metadata).

## 2. Add the client dependency

```bash
cd client
npm install @supabase/supabase-js
```

## 3. Environment variables

Add to `client/.env` (Vite exposes `VITE_`-prefixed vars to the browser):

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Find these in Supabase → Project Settings → API. The **anon** key is safe in the
browser precisely because RLS enforces per-user access.

## 4. Use it

`client/src/services/journalSupabase.ts` is a drop-in replacement for
`createJournalApi()` — same methods (`list`, `save`, `update`, `remove`,
`importEntries`, `exportEntries`, `deleteAll`):

```ts
import { createClient } from '@supabase/supabase-js';
import { createJournalSupabase } from './services/journalSupabase';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
const journal = createJournalSupabase(supabase);

await journal.save({ entry_type: 'dream', entry_date: '2026-07-22', text: '…' });
const { entries } = await journal.list({ type: 'dream' });
```

Swap the `createJournalApi(authFetch)` call in the journal pages/hooks for
`createJournalSupabase(supabase)`. Because RLS handles auth, you no longer need
the Express `/api/journal` routes for journalling.

## Migrating existing journal entries (optional)

If you have journal data in the old PocketBase instance you want to keep, export
it (PocketBase admin UI, or `GET /api/journal/export` while signed in) and feed
the entries to `journal.importEntries([...])` after the user signs into the new
app. The payload fields line up one-to-one.
