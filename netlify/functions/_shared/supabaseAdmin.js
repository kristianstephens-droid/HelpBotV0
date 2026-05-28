/**
 * Server-only Supabase client. Uses the SERVICE-ROLE key, which bypasses
 * Row Level Security. NEVER import this file from anywhere under /src/ — it
 * only belongs in netlify/functions/**.
 *
 * If env vars are missing, this returns null and callers should gracefully
 * skip the DB work (e.g. logging) rather than crash. That makes local dev
 * easier before Supabase is wired up.
 */

import { createClient } from "@supabase/supabase-js";

let cached = null;

export function getSupabaseAdmin() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * Save a chat turn. Creates a conversation if needed. Returns the
 * conversationId so the client can keep using it on follow-up turns.
 */
export async function saveTurn({
  conversationId,
  userContent,
  assistantContent,
  model,
  tokensIn = null,
  tokensOut = null,
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { conversationId: conversationId ?? null };

  let convoId = conversationId;
  if (!convoId) {
    const { data, error } = await supabase
      .from("helpbot_conversations")
      .insert({ title: userContent.slice(0, 60) })
      .select("id")
      .single();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[supabaseAdmin] could not create conversation:", error.message);
      return { conversationId: null };
    }
    convoId = data.id;
  }

  const { error: msgErr } = await supabase.from("helpbot_messages").insert([
    {
      conversation_id: convoId,
      role: "user",
      content: userContent,
      model,
    },
    {
      conversation_id: convoId,
      role: "assistant",
      content: assistantContent,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
    },
  ]);

  if (msgErr) {
    // eslint-disable-next-line no-console
    console.warn("[supabaseAdmin] could not save messages:", msgErr.message);
  }

  return { conversationId: convoId };
}

/**
 * Log a guardrail / safety event (rate limit hit, input blocked, secret
 * redacted, etc.) so we can review them later.
 */
export async function logSafetyEvent({ conversationId = null, type, details = {} }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase.from("helpbot_safety_events").insert({
    conversation_id: conversationId,
    type,
    details,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[supabaseAdmin] could not log safety event:", error.message);
  }
}
