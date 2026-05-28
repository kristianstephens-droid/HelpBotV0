# Supabase setup

This folder holds the database schema for HelpBot. There is no migration
tooling yet — keep it simple: copy/paste `schema.sql` into the Supabase SQL
editor.

## First-time setup

1. Create a free Supabase project at https://supabase.com.
2. From the project sidebar, open **SQL Editor → New query**.
3. Open [`schema.sql`](./schema.sql), copy the entire file, paste it into the
   editor, and click **Run**.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → use as both `SUPABASE_URL` and `VITE_SUPABASE_URL`.
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` (safe to put in the browser).
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, NEVER
     in the browser).
5. Paste those into `.env` locally and into the Netlify dashboard for
   production.

## What's inside

| Table           | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `conversations` | One row per chat thread.                             |
| `messages`      | Every user + assistant message, with model + tokens. |
| `safety_events` | Anything a guardrail flagged (review periodically).  |
| `rate_limits`   | Counters used by the per-IP rate limiter.            |

Row Level Security is **on** for all four tables, and the policy is **deny all
to anon**. Only the service-role key (used by Netlify Functions) can read or
write. We'll open up read access for logged-in users once Supabase Auth is
added.

## Re-running the schema

`schema.sql` is idempotent (uses `if not exists` / `drop policy if exists`),
so you can safely run it again after small changes.
