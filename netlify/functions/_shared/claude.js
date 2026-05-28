/**
 * Thin wrapper around the Anthropic SDK so the rest of the codebase doesn't
 * have to know about Anthropic's exact request shape.
 *
 * Returns a stable shape: { text, model, usage }.
 */

import Anthropic from "@anthropic-ai/sdk";

let cached = null;

function getClient() {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  cached = new Anthropic({ apiKey });
  return cached;
}

export function isClaudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * @param {Object} args
 * @param {string} args.systemPrompt
 * @param {Array<{role: "user"|"assistant", content: string}>} args.messages
 * @param {number} args.maxTokens
 * @param {string} [args.model]
 */
export async function callClaude({ systemPrompt, messages, maxTokens, model }) {
  const client = getClient();
  if (!client) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env (local) or Netlify env vars (production).",
    );
  }

  const usedModel = model || process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";

  const response = await client.messages.create({
    model: usedModel,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  const text =
    response?.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim() ?? "";

  return {
    text,
    model: usedModel,
    usage: {
      input_tokens: response?.usage?.input_tokens ?? null,
      output_tokens: response?.usage?.output_tokens ?? null,
    },
  };
}
