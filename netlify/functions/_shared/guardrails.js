/**
 * Guardrails: input + output safety checks that run on EVERY chat request.
 *
 * These are deliberately simple and conservative. They are NOT a substitute
 * for a thoughtful system prompt and a real content moderation pipeline, but
 * they catch the most common foot-guns:
 *
 *   - empty / oversized inputs
 *   - control characters & weird unicode
 *   - obvious prompt-injection phrases in user input
 *   - runaway history (cap how much we send to Claude => cost control)
 *   - leaked-secret echoes in output (very basic check)
 */

const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY_MESSAGES = 20;

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all|any|previous|prior) (instructions|prompts|rules)/i,
  /disregard (the|all|any|previous) (instructions|prompts|rules)/i,
  /you are now (a|an) [a-z]+/i,
  /system prompt[:\s]/i,
  /reveal (the|your) (system )?(prompt|instructions)/i,
];

// Loose patterns for known secret formats. If any of these show up in OUTPUT,
// we redact them before returning. Better safe than sorry.
const SECRET_PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]{20,}/g, // Anthropic
  /sk-[A-Za-z0-9]{20,}/g,        // OpenAI-ish
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, // JWT
];

function stripControlChars(s) {
  // Remove most control chars but keep \n and \t.
  return s.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
}

/**
 * Validate and clean a single incoming user message string.
 * Returns { ok, value, reason }
 */
export function validateUserMessage(raw) {
  if (typeof raw !== "string") {
    return { ok: false, reason: "Message must be a string." };
  }
  const cleaned = stripControlChars(raw).trim();
  if (cleaned.length === 0) {
    return { ok: false, reason: "Message is empty." };
  }
  if (cleaned.length > MAX_MESSAGE_CHARS) {
    return {
      ok: false,
      reason: `Message is too long (${cleaned.length} chars). Max is ${MAX_MESSAGE_CHARS}.`,
    };
  }
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        ok: false,
        reason:
          "Message looks like a prompt-injection attempt and was blocked. " +
          "If this was a false positive, rephrase and try again.",
      };
    }
  }
  return { ok: true, value: cleaned };
}

/**
 * Validate the whole conversation array sent from the browser, cap history
 * length, and return the cleaned list ready to send to Claude.
 * Returns { ok, messages, reason }
 */
export function validateConversation(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, reason: "messages array is required." };
  }
  if (messages.length > 200) {
    return { ok: false, reason: "Conversation too long." };
  }

  const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
  const cleaned = [];

  for (const m of trimmed) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) {
      return { ok: false, reason: "Each message needs role user|assistant." };
    }
    // Only validate USER messages for prompt injection; assistant messages
    // are our own past replies and don't need that check.
    if (m.role === "user") {
      const r = validateUserMessage(m.content);
      if (!r.ok) return { ok: false, reason: r.reason };
      cleaned.push({ role: "user", content: r.value });
    } else {
      const content = typeof m.content === "string" ? m.content : "";
      cleaned.push({ role: "assistant", content });
    }
  }

  // Conversation must end with a user message (the new turn).
  if (cleaned[cleaned.length - 1].role !== "user") {
    return { ok: false, reason: "Last message must be from the user." };
  }

  return { ok: true, messages: cleaned };
}

/**
 * Run an output through a very basic redaction pass. Any string matching a
 * known secret format is replaced with [REDACTED]. We log redactions to the
 * helpbot_safety_events table from the caller.
 */
export function redactSecrets(output) {
  if (typeof output !== "string") return { value: output, redacted: false };
  let redacted = false;
  let value = output;
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(value)) {
      redacted = true;
      value = value.replace(pattern, "[REDACTED]");
    }
  }
  return { value, redacted };
}

/**
 * Cost guardrail: clamp max output tokens.
 */
export function clampMaxTokens(envValue, fallback = 1024, hardCap = 4096) {
  const n = Number.parseInt(envValue ?? "", 10);
  if (Number.isFinite(n) && n > 0) return Math.min(n, hardCap);
  return Math.min(fallback, hardCap);
}
