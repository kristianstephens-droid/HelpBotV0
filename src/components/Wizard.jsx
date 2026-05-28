import { useCallback, useEffect, useReducer } from "react";
import BrandHeader from "./BrandHeader.jsx";
import TeamStep from "./steps/TeamStep.jsx";
import ToolStep from "./steps/ToolStep.jsx";

/**
 * Wizard container.
 *
 * Owns all wizard state and decides which step is on screen. Each step is a
 * dumb child that just calls `onSelect(value)`. Adding a new step is:
 *   1. Create a *.jsx file under ./steps/
 *   2. Add a `case` to the reducer for the choice that leads INTO it.
 *   3. Add a `case` to the renderer below.
 *
 * State shape:
 *   {
 *     step: "team" | "tool" | "flexIssue" | "nerdyAssistant" | "chat",
 *     team: "new_sales" | "member_services" | null,
 *     tool: "nerdyassistant" | "flex" | null,
 *     issue: string | null,
 *   }
 */

const STORAGE_KEY = "vt-helpbot-wizard:v1";

const initialState = {
  step: "team",
  team: null,
  tool: null,
  issue: null,
};

const STEP_ORDER = ["team", "tool", "flexIssue", "nerdyAssistant", "chat"];

function reducer(state, action) {
  switch (action.type) {
    case "SELECT_TEAM":
      return { ...state, team: action.value, step: "tool" };

    case "SELECT_TOOL":
      // Branch based on which tool the user picked.
      // The follow-up screens (flexIssue / nerdyAssistant) are not built yet —
      // selecting a tool sets the step but those screens will render a TODO
      // placeholder until you provide their designs.
      if (action.value === "flex") {
        return { ...state, tool: "flex", step: "flexIssue" };
      }
      if (action.value === "nerdyassistant") {
        return { ...state, tool: "nerdyassistant", step: "nerdyAssistant" };
      }
      return state;

    case "SELECT_ISSUE":
      return { ...state, issue: action.value, step: "chat" };

    case "BACK": {
      const idx = STEP_ORDER.indexOf(state.step);
      if (idx <= 0) return state;
      const prev = STEP_ORDER[idx - 1];
      // Clear the value gathered at the step we are leaving.
      const cleared = { ...state, step: prev };
      if (state.step === "tool") cleared.tool = null;
      if (state.step === "flexIssue" || state.step === "nerdyAssistant") cleared.issue = null;
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

      {/* Back / reset row — hidden on the first step */}
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
      return <PendingScreen title="Flex common issues — coming next" state={state} />;

    case "nerdyAssistant":
      return <PendingScreen title="NerdyAssistant next step — coming next" state={state} />;

    case "chat":
      return <PendingScreen title="Chat hand-off — coming next" state={state} />;

    default:
      return null;
  }
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
