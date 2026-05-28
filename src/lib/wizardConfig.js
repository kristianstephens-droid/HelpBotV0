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
