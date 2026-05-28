-- =============================================================================
-- HelpBotV0 initial schema
-- =============================================================================
-- Apply this once to a fresh Supabase project:
--   1. Open your project in https://supabase.com
--   2. Go to SQL Editor -> New query
--   3. Paste this whole file and click "Run"
--
-- Re-running is safe (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- IMPORTANT: Row Level Security (RLS) is enabled on every table. The
-- service-role key (used only by Netlify Functions) bypasses RLS. The
-- browser uses the anon key which, by default, can do NOTHING with these
-- tables. That's intentional for v0 — we'll open up read access for
-- logged-in users once Supabase Auth is added.
-- =============================================================================

-- Ensure the uuid extension is present (it is, by default, in Supabase).
create extension if not exists "pgcrypto";


-- =============================================================================
-- conversations
-- =============================================================================
create table if not exists public.conversations (
    id          uuid primary key default gen_random_uuid(),
    created_at  timestamptz not null default now(),
    title       text,
    user_id     uuid -- nullable for now; will link to auth.users later
);

alter table public.conversations enable row level security;

drop policy if exists "conversations: deny all to anon" on public.conversations;
create policy "conversations: deny all to anon"
    on public.conversations
    for all
    to anon
    using (false)
    with check (false);


-- =============================================================================
-- messages
-- =============================================================================
create table if not exists public.messages (
    id               uuid primary key default gen_random_uuid(),
    conversation_id  uuid not null references public.conversations(id) on delete cascade,
    role             text not null check (role in ('user', 'assistant', 'system')),
    content          text not null,
    model            text,
    tokens_in        integer,
    tokens_out       integer,
    created_at       timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx
    on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages: deny all to anon" on public.messages;
create policy "messages: deny all to anon"
    on public.messages
    for all
    to anon
    using (false)
    with check (false);


-- =============================================================================
-- safety_events
-- Anything a guardrail flags lands here for review.
-- =============================================================================
create table if not exists public.safety_events (
    id               uuid primary key default gen_random_uuid(),
    conversation_id  uuid references public.conversations(id) on delete set null,
    type             text not null,         -- e.g. 'rate_limited', 'input_blocked', 'output_redacted', 'provider_error'
    details          jsonb not null default '{}'::jsonb,
    created_at       timestamptz not null default now()
);

create index if not exists safety_events_type_idx
    on public.safety_events (type, created_at);

alter table public.safety_events enable row level security;

drop policy if exists "safety_events: deny all to anon" on public.safety_events;
create policy "safety_events: deny all to anon"
    on public.safety_events
    for all
    to anon
    using (false)
    with check (false);


-- =============================================================================
-- rate_limits
-- Fixed-window per-key counters used by rateLimit.js.
-- =============================================================================
create table if not exists public.rate_limits (
    key           text primary key,         -- usually an IP
    window_start  timestamptz not null,
    count         integer not null default 0
);

alter table public.rate_limits enable row level security;

drop policy if exists "rate_limits: deny all to anon" on public.rate_limits;
create policy "rate_limits: deny all to anon"
    on public.rate_limits
    for all
    to anon
    using (false)
    with check (false);
