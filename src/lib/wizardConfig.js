/**
 * Single source of truth for what shows up in the wizard's option screens.
 * Add / rename / reorder items here — the screen components read from this
 * file so no JSX needs to be edited.
 */

import dollarSign from "../assets/dollar-sign.png";
import headset from "../assets/headset.png";
import nerdyAssistant from "../assets/nerdyassistant.png";
import twilioFlex from "../assets/twilio-flex.png";

export const TEAMS = [
  { id: "new_sales", label: "New Sales", icon: dollarSign },
  { id: "member_services", label: "Member Services", icon: headset },
];

export const TOOLS = [
  { id: "nerdyassistant", label: "NerdyAssistant", icon: nerdyAssistant },
  { id: "flex", label: "Twilio Flex", icon: twilioFlex },
];

/**
 * Common Twilio Flex issues. The first three lead straight to chat with the
 * issue pre-loaded as context for Claude. "other" leads to a free-text
 * screen first.
 *
 * `kind: "common"` => SELECT_ISSUE
 * `kind: "other"`  => GO_TO_FREE_TEXT
 */
export const FLEX_ISSUES = [
  { id: "no_audio", label: "No Audio", kind: "common" },
  { id: "quotes_greyed_out", label: "Quotes are Greyed Out", kind: "common" },
  { id: "call_dropped", label: "Call Dropped", kind: "common" },
  { id: "other", label: "Not Sure / Other", kind: "other" },
];
