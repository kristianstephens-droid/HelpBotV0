-- =============================================================================
-- HelpBotV0 initial schema
-- =============================================================================
-- This schema is applied to your EXISTING Supabase project. To avoid colliding
-- with anything else in that project, every HelpBot table is prefixed with
-- `helpbot_`.
--
-- Apply this once:
--   1. Open your project in https://supabase.com
--   2. SQL Editor -> New query
--   3. Paste this whole file and click "Run"
--
-- Re-running is safe (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- IMPORTANT: Row Level Security (RLS) is enabled on every helpbot_* table.
-- The service-role key (used only by Netlify Functions) bypasses RLS. The
-- browser uses the anon key which, by default, can do NOTHING with these
-- tables. That's intentional for v0 — we'll open up read access for
-- logged-in users once Supabase Auth is added.
-- =============================================================================

-- Ensure the uuid extension is present (it is, by default, in Supabase).
create extension if not exists "pgcrypto";


-- =============================================================================
-- helpbot_conversations
-- =============================================================================
create table if not exists public.helpbot_conversations (
    id          uuid primary key default gen_random_uuid(),
    created_at  timestamptz not null default now(),
    title       text,
    user_id     uuid -- nullable for now; will link to auth.users later
);

alter table public.helpbot_conversations enable row level security;

drop policy if exists "helpbot_conversations: deny all to anon"
    on public.helpbot_conversations;
create policy "helpbot_conversations: deny all to anon"
    on public.helpbot_conversations
    for all
    to anon
    using (false)
    with check (false);


-- =============================================================================
-- helpbot_messages
-- =============================================================================
create table if not exists public.helpbot_messages (
    id               uuid primary key default gen_random_uuid(),
    conversation_id  uuid not null references public.helpbot_conversations(id) on delete cascade,
    role             text not null check (role in ('user', 'assistant', 'system')),
    content          text not null,
    model            text,
    tokens_in        integer,
    tokens_out       integer,
    created_at       timestamptz not null default now()
);

create index if not exists helpbot_messages_conversation_id_idx
    on public.helpbot_messages (conversation_id, created_at);

alter table public.helpbot_messages enable row level security;

drop policy if exists "helpbot_messages: deny all to anon"
    on public.helpbot_messages;
create policy "helpbot_messages: deny all to anon"
    on public.helpbot_messages
    for all
    to anon
    using (false)
    with check (false);


-- =============================================================================
-- helpbot_safety_events
-- Anything a guardrail flags lands here for review.
-- =============================================================================
create table if not exists public.helpbot_safety_events (
    id               uuid primary key default gen_random_uuid(),
    conversation_id  uuid references public.helpbot_conversations(id) on delete set null,
    type             text not null,         -- e.g. 'rate_limited', 'input_blocked', 'output_redacted', 'provider_error'
    details          jsonb not null default '{}'::jsonb,
    created_at       timestamptz not null default now()
);

create index if not exists helpbot_safety_events_type_idx
    on public.helpbot_safety_events (type, created_at);

alter table public.helpbot_safety_events enable row level security;

drop policy if exists "helpbot_safety_events: deny all to anon"
    on public.helpbot_safety_events;
create policy "helpbot_safety_events: deny all to anon"
    on public.helpbot_safety_events
    for all
    to anon
    using (false)
    with check (false);


-- =============================================================================
-- helpbot_rate_limits
-- Fixed-window per-key counters used by rateLimit.js.
-- =============================================================================
create table if not exists public.helpbot_rate_limits (
    key           text primary key,         -- usually an IP
    window_start  timestamptz not null,
    count         integer not null default 0
);

alter table public.helpbot_rate_limits enable row level security;

drop policy if exists "helpbot_rate_limits: deny all to anon"
    on public.helpbot_rate_limits;
create policy "helpbot_rate_limits: deny all to anon"
    on public.helpbot_rate_limits
    for all
    to anon
    using (false)
    with check (false);
