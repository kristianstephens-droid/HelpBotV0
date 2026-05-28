/**
 * POST /api/chat   (rewritten to /.netlify/functions/chat by netlify.toml)
 *
 * Request body:
 *   {
 *     messages: [{ role: "user"|"assistant", content: string }, ...],
 *     conversationId?: string,
 *     provider?: "claude" | "openai",   // optional, defaults to "claude"
 *     context?: {                        // optional; sent by the wizard
 *       team?: string,                   //   "new_sales" | "member_services"
 *       tool?: string,                   //   "flex" | "nerdyassistant"
 *       issueId?: string,                //   e.g. "no_audio"
 *       issueLabel?: string,             //   e.g. "No Audio"
 *       freeText?: string                //   from the Other path
 *     }
 *   }
 *
 * Response body:
 *   { reply: string, conversationId: string|null, model: string }
 *
 * This function is the ONE place where:
 *   - guardrails run
 *   - rate limiting runs
 *   - AI providers are called
 *   - chats are logged to Supabase
 *
 * Never call provider SDKs from the browser. Always go through here.
 */

import { validateConversation, redactSecrets, clampMaxTokens } from "./_shared/guardrails.js";
import { checkRateLimit } from "./_shared/rateLimit.js";
import { saveTurn, logSafetyEvent } from "./_shared/supabaseAdmin.js";
import { callClaude, isClaudeConfigured } from "./_shared/claude.js";
import { callOpenAI } from "./_shared/openai.js";
import { buildSystemPrompt, PLACEHOLDER_REPLY } from "./_shared/prompts.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req, context) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed. Use POST." });
  }

  // --- Identify caller for rate limiting ---
  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    context?.ip ||
    "anonymous";

  // --- Rate limit ---
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    await logSafetyEvent({ type: "rate_limited", details: { ip } });
    return new Response(
      JSON.stringify({
        error: `Rate limit hit. Try again in ${rl.retryAfter ?? 60}s.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfter ?? 60),
        },
      },
    );
  }

  // --- Parse body ---
  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Body must be valid JSON." });
  }

  // --- Guardrails on input ---
  const validation = validateConversation(body?.messages);
  if (!validation.ok) {
    await logSafetyEvent({
      type: "input_blocked",
      details: { reason: validation.reason, ip },
    });
    return json(400, { error: validation.reason });
  }
  const cleanMessages = validation.messages;
  const userLast = cleanMessages[cleanMessages.length - 1].content;

  // --- Pick provider ---
  const provider = body?.provider === "openai" ? "openai" : "claude";
  const maxTokens = clampMaxTokens(process.env.MAX_OUTPUT_TOKENS, 1024);

  // --- Build system prompt with wizard intake context (team / tool / issue) ---
  const systemPrompt = buildSystemPrompt(body?.context ?? {});

  // --- Call the model ---
  let result;
  try {
    if (provider === "claude") {
      if (!isClaudeConfigured()) {
        // Skeleton-mode reply so the UI still works before keys are set.
        result = {
          text: PLACEHOLDER_REPLY,
          model: "placeholder",
          usage: { input_tokens: null, output_tokens: null },
        };
      } else {
        result = await callClaude({
          systemPrompt,
          messages: cleanMessages,
          maxTokens,
        });
      }
    } else {
      result = await callOpenAI({
        systemPrompt,
        messages: cleanMessages,
        maxTokens,
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[chat] provider call failed:", err);
    await logSafetyEvent({
      type: "provider_error",
      details: { provider, message: String(err?.message ?? err) },
    });
    return json(502, {
      error: "The AI provider returned an error. Check server logs.",
    });
  }

  // --- Guardrails on output ---
  const { value: safeText, redacted } = redactSecrets(result.text);
  if (redacted) {
    await logSafetyEvent({
      type: "output_redacted",
      details: { provider, model: result.model },
    });
  }

  // --- Persist the turn ---
  const { conversationId } = await saveTurn({
    conversationId: body?.conversationId ?? null,
    userContent: userLast,
    assistantContent: safeText,
    model: result.model,
    tokensIn: result.usage.input_tokens,
    tokensOut: result.usage.output_tokens,
  });

  return json(200, {
    reply: safeText,
    conversationId,
    model: result.model,
  });
};

export const config = {
  path: "/api/chat",
};
