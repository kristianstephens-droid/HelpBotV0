import { useCallback, useEffect, useMemo, useReducer } from "react";
import BrandHeader from "./BrandHeader.jsx";
import Chat from "./Chat.jsx";
import TeamStep from "./steps/TeamStep.jsx";
import ToolStep from "./steps/ToolStep.jsx";
import FlexIssueStep from "./steps/FlexIssueStep.jsx";
import FreeTextStep from "./steps/FreeTextStep.jsx";
import { TEAMS, TOOLS, FLEX_ISSUES } from "../lib/wizardConfig.js";

/**
 * Wizard container.
 *
 * Owns all wizard state and decides which step is on screen. When the user
 * reaches the `chat` step, we render the existing <Chat /> component with
 * the gathered context (team / tool / issue / freeText) so the backend can
 * inject it into Claude's system prompt.
 *
 * Adding a new step:
 *   1. Create a *.jsx file under ./steps/
 *   2. Add a `case` to the reducer for the choice that leads INTO it.
 *   3. Add a `case` to renderStep() below.
 *   4. Add it to STEP_ORDER so the Back button works.
 *
 * State shape:
 *   {
 *     step: "team" | "tool" | "flexIssue" | "freeText" | "nerdyAssistant" | "chat",
 *     team: "new_sales" | "member_services" | null,
 *     tool: "nerdyassistant" | "flex" | null,
 *     issueId: string | null,
 *     issueLabel: string | null,
 *     freeText: string | null,
 *   }
 */

const STORAGE_KEY = "vt-helpbot-wizard:v1";

const initialState = {
  step: "team",
  team: null,
  tool: null,
  issueId: null,
  issueLabel: null,
  freeText: null,
};

const STEP_ORDER = [
  "team",
  "tool",
  "flexIssue",
  "nerdyAssistant",
  "freeText",
  "chat",
];

function reducer(state, action) {
  switch (action.type) {
    case "SELECT_TEAM":
      return { ...state, team: action.value, step: "tool" };

    case "SELECT_TOOL":
      if (action.value === "flex") {
        return { ...state, tool: "flex", step: "flexIssue" };
      }
      if (action.value === "nerdyassistant") {
        return { ...state, tool: "nerdyassistant", step: "nerdyAssistant" };
      }
      return state;

    case "SELECT_ISSUE": {
      // action.value is a FLEX_ISSUES item: { id, label, kind }
      const { id, label, kind } = action.value;
      if (kind === "other") {
        return { ...state, issueId: id, issueLabel: label, step: "freeText" };
      }
      return { ...state, issueId: id, issueLabel: label, step: "chat" };
    }

    case "SUBMIT_FREE_TEXT":
      return { ...state, freeText: action.value, step: "chat" };

    case "BACK": {
      const idx = STEP_ORDER.indexOf(state.step);
      if (idx <= 0) return state;
      // Special-case: from chat or freeText, back goes to flexIssue (the
      // most recent choice screen on the Flex path).
      if (state.step === "chat" || state.step === "freeText") {
        const back = state.tool === "flex" ? "flexIssue" : "tool";
        const cleared = { ...state, step: back };
        cleared.issueId = null;
        cleared.issueLabel = null;
        cleared.freeText = null;
        return cleared;
      }
      const prev = STEP_ORDER[idx - 1];
      const cleared = { ...state, step: prev };
      if (state.step === "tool") cleared.tool = null;
      if (state.step === "flexIssue" || state.step === "nerdyAssistant") {
        cleared.issueId = null;
        cleared.issueLabel = null;
      }
      return cleared;
    }

    case "RESET":
      return initialState;

    case "HYDRATE":
      return action.value ?? state;

    default:
      return state;
  }
}

export default function Wizard() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Restore from sessionStorage on first render.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", value: JSON.parse(raw) });
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Persist on every change.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / privacy errors
    }
  }, [state]);

  const handleBack = useCallback(() => dispatch({ type: "BACK" }), []);
  const handleReset = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "RESET" });
  }, []);

  return (
    <div className="min-h-screen bg-white text-vt-ink font-sans">
      <BrandHeader />

      {state.step !== "team" && (
        <div className="mx-auto w-full max-w-xl px-6 mt-2 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleBack}
            className="text-vt-accent hover:underline focus:outline-none focus-visible:underline"
          >
            &larr; Back
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-vt-muted hover:text-vt-ink hover:underline focus:outline-none focus-visible:underline"
          >
            Start over
          </button>
        </div>
      )}

      <main>{renderStep(state, dispatch)}</main>
    </div>
  );
}

function renderStep(state, dispatch) {
  switch (state.step) {
    case "team":
      return (
        <TeamStep
          onSelect={(value) => dispatch({ type: "SELECT_TEAM", value })}
        />
      );

    case "tool":
      return (
        <ToolStep
          onSelect={(value) => dispatch({ type: "SELECT_TOOL", value })}
        />
      );

    case "flexIssue":
      return (
        <FlexIssueStep
          onSelect={(value) => dispatch({ type: "SELECT_ISSUE", value })}
        />
      );

    case "freeText":
      return (
        <FreeTextStep
          onSubmit={(value) => dispatch({ type: "SUBMIT_FREE_TEXT", value })}
        />
      );

    case "nerdyAssistant":
      return <PendingScreen title="NerdyAssistant next step — coming next" state={state} />;

    case "chat":
      return <ChatHandoff state={state} />;

    default:
      return null;
  }
}

/**
 * Renders the existing <Chat /> with the wizard context attached.
 * The first user message is auto-sent so Claude opens the conversation
 * already knowing what's going on.
 */
function ChatHandoff({ state }) {
  const { context, initialMessage, stripLabel } = useMemo(
    () => deriveChatHandoff(state),
    [state],
  );

  return (
    <div className="mx-auto w-full max-w-xl px-6 pt-6 pb-10">
      <Chat
        wizardContext={context}
        initialUserMessage={initialMessage}
        contextStripLabel={stripLabel}
      />
    </div>
  );
}

function deriveChatHandoff(state) {
  const teamLabel = TEAMS.find((t) => t.id === state.team)?.label ?? state.team;
  const toolLabel = TOOLS.find((t) => t.id === state.tool)?.label ?? state.tool;
  const issueLabel =
    state.issueLabel ??
    FLEX_ISSUES.find((i) => i.id === state.issueId)?.label ??
    null;

  // What we send to the backend (the source of truth for the system prompt).
  const context = {
    team: state.team ?? undefined,
    tool: state.tool ?? undefined,
    issueId: state.issueId ?? undefined,
    issueLabel: issueLabel ?? undefined,
    freeText: state.freeText ?? undefined,
  };

  // The first user message that auto-sends.
  //
  // Always an object so <Chat /> has a single invariant:
  //   - `display` is what the bubble shows the rep.
  //   - `send`    is what gets POSTed to /api/chat and stored in the
  //               conversation history. Claude sees this.
  //
  // For the freeText path the rep wrote it themselves, so display === send.
  // For the common-issue path we keep the short, natural-sounding line in
  // the bubble but append a one-step-at-a-time directive to `send` so the
  // first reply is shaped correctly without making the rep read their own
  // bot-prompting language back at themselves.
  let initialMessage = null;
  if (state.freeText) {
    initialMessage = { display: state.freeText, send: state.freeText };
  } else if (issueLabel && toolLabel) {
    const shortLine = `I'm having an issue with ${toolLabel}: ${issueLabel}.`;
    initialMessage = {
      display: shortLine,
      send: `${shortLine} Walk me through it ONE step at a time — give me Step 1 only, then wait for my reply before sending Step 2.`,
    };
  }

  // Small badge above the chat so the rep knows what the bot already knows.
  const parts = [teamLabel, toolLabel, issueLabel || (state.freeText ? "Other" : null)]
    .filter(Boolean);
  const stripLabel = parts.length > 0 ? parts.join(" \u00b7 ") : null;

  return { context, initialMessage, stripLabel };
}

function PendingScreen({ title, state }) {
  // Placeholder shown for steps whose designs have not been provided yet.
  return (
    <section className="mx-auto w-full max-w-xl px-6 pt-10 text-center">
      <h1 className="text-2xl font-medium text-vt-ink">{title}</h1>
      <p className="mt-3 text-sm text-vt-muted">
        This screen is intentionally blank until its design is provided.
        Current wizard state:
      </p>
      <pre className="mx-auto mt-4 max-w-md overflow-auto rounded-lg bg-vt-tint p-3 text-left text-xs text-vt-ink">
{JSON.stringify(state, null, 2)}
      </pre>
    </section>
  );
}
