/**
 * OpenAI wrapper — wired up but intentionally stubbed for now.
 *
 * When you're ready to add OpenAI:
 *   1. Put your key in OPENAI_API_KEY (.env or Netlify env vars).
 *   2. Uncomment the real call below and remove the stub return.
 *   3. (Optional) Have chat.js pick between Claude and OpenAI based on a
 *      `provider` field in the request body or a routing rule.
 */

import OpenAI from "openai";

let cached = null;

function getClient() {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  cached = new OpenAI({ apiKey });
  return cached;
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function callOpenAI({ systemPrompt, messages, maxTokens, model }) {
  const client = getClient();
  if (!client) {
    return {
      text:
        "OpenAI is not configured yet. Add OPENAI_API_KEY and uncomment the " +
        "real call in netlify/functions/_shared/openai.js.",
      model: "stub",
      usage: { input_tokens: null, output_tokens: null },
    };
  }

  const usedModel = model || "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model: usedModel,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  const text = response?.choices?.[0]?.message?.content?.trim() ?? "";

  return {
    text,
    model: usedModel,
    usage: {
      input_tokens: response?.usage?.prompt_tokens ?? null,
      output_tokens: response?.usage?.completion_tokens ?? null,
    },
  };
}
