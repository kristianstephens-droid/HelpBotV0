/**
 * Simple per-IP rate limiter backed by the `rate_limits` table in Supabase.
 *
 * Algorithm: fixed window. For a given key (e.g. an IP), we look up the
 * current window row, increment if it's still in the window, otherwise
 * start a new window. If the count exceeds the limit, we deny.
 *
 * This is intentionally simple. For more accurate limiting, swap in a
 * token-bucket library or a hosted service later.
 */

import { getSupabaseAdmin } from "./supabaseAdmin.js";

const WINDOW_SECONDS = Number.parseInt(
  process.env.RATE_LIMIT_WINDOW_SECONDS ?? "60",
  10,
);
const MAX_REQUESTS = Number.parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS ?? "20",
  10,
);

/**
 * @param {string} key  Usually the requester IP. Use "anonymous" if unknown.
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfter?: number }>}
 */
export async function checkRateLimit(key) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // If Supabase isn't configured we fail OPEN (allow) but log a warning.
    // We never want misconfiguration to break the app silently in dev.
    // eslint-disable-next-line no-console
    console.warn("[rateLimit] Supabase admin not configured — skipping limit.");
    return { allowed: true, remaining: MAX_REQUESTS };
  }

  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (WINDOW_SECONDS * 1000)) *
      (WINDOW_SECONDS * 1000),
  );

  // Try to read the current window row.
  const { data: existing, error: readErr } = await supabase
    .from("rate_limits")
    .select("count, window_start")
    .eq("key", key)
    .maybeSingle();

  if (readErr) {
    // eslint-disable-next-line no-console
    console.warn("[rateLimit] read error, failing open:", readErr.message);
    return { allowed: true, remaining: MAX_REQUESTS };
  }

  if (existing && new Date(existing.window_start).getTime() === windowStart.getTime()) {
    const newCount = existing.count + 1;
    if (newCount > MAX_REQUESTS) {
      const retryAfter =
        Math.ceil((windowStart.getTime() + WINDOW_SECONDS * 1000 - now.getTime()) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }
    await supabase
      .from("rate_limits")
      .update({ count: newCount })
      .eq("key", key);
    return { allowed: true, remaining: MAX_REQUESTS - newCount };
  }

  // Start a fresh window (upsert).
  await supabase.from("rate_limits").upsert({
    key,
    window_start: windowStart.toISOString(),
    count: 1,
  });

  return { allowed: true, remaining: MAX_REQUESTS - 1 };
}
