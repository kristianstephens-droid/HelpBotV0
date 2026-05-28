/**
 * Standard Operating Procedures (SOPs) / troubleshooting guides.
 *
 * Each entry is keyed by "<tool>:<issueId>" so the prompt builder can grab
 * exactly the SOP that matches what the user picked in the wizard.
 *
 * These are PLACEHOLDERS. Paste your real internal SOPs here. Keep each one
 * concise (a numbered list works well) — Claude will read it and walk the
 * rep through the steps one at a time, adapting wording to context.
 *
 * The wizard's issue ids (see src/lib/wizardConfig.js -> FLEX_ISSUES):
 *   - flex:no_audio
 *   - flex:quotes_greyed_out
 *   - flex:call_dropped
 *   - flex:other         (free-text; no specific SOP, fall back to general)
 *
 * Future tools (e.g. nerdyassistant:*) can be added the same way.
 */

const SOPS = {
  "flex:no_audio": `
SOP — Twilio Flex: No Audio

1. Confirm the agent's headset is plugged in and selected as the OS default
   input AND output device.
2. In Flex, click the gear / settings icon and verify the correct microphone
   and speaker are selected.
3. Ask the agent to refresh Flex (Cmd/Ctrl + R) once and try a test call.
4. If still no audio, have them log out of Flex completely, close the tab,
   then log back in.
5. If still no audio after that, escalate with: timestamp of issue, call
   SID (if any), browser + OS version.
`.trim(),

  "flex:quotes_greyed_out": `
SOP — Twilio Flex: Quotes are Greyed Out

1. Confirm the agent is on an active, connected call (quotes are disabled
   when no call is connected).
2. Confirm the agent's role/permissions include quote generation.
3. Have the agent refresh the quote panel (small refresh icon in the
   quote sidebar).
4. If still greyed out, ask the agent to log out and back in; this usually
   refreshes their session permissions.
5. If still greyed out after re-login, escalate with: agent email, time
   of attempt, and the customer's account number.
`.trim(),

  "flex:call_dropped": `
SOP — Twilio Flex: Call Dropped

1. Ask the agent whether the call dropped during connect, mid-call, or at
   wrap-up.
2. Confirm the agent's internet is stable (no recent Wi-Fi reconnects).
3. Have the agent check if their status is still "Available" in Flex; if
   "Offline" or "Unavailable," reset to "Available."
4. If multiple dropped calls in a row, ask them to restart Flex (full tab
   close + reopen) and run a quick speed test (need >5 Mbps stable).
5. Escalate with: call SID(s), agent email, approximate timestamps, and
   their reported internet speed.
`.trim(),
};

/**
 * Look up the SOP for a given tool+issue. Returns null if none matches —
 * the prompt builder will then just send the general system prompt.
 */
export function getSop(tool, issueId) {
  if (!tool || !issueId) return null;
  return SOPS[`${tool}:${issueId}`] ?? null;
}
