import ChoiceButton from "../ChoiceButton.jsx";
import { FLEX_ISSUES } from "../../lib/wizardConfig.js";

/**
 * Screen 3b (Flex path): "What's the issue?"
 *
 * Props:
 *   - onSelect(issue): called with the FLEX_ISSUES item the user picked.
 *     The Wizard reads `issue.kind` to decide whether to go to chat
 *     (kind === "common") or to the free-text screen (kind === "other").
 */
export default function FlexIssueStep({ onSelect }) {
  return (
    <section className="mx-auto w-full max-w-xl px-6 pt-10 text-center">
      <h1 className="text-4xl font-normal tracking-tight text-vt-ink">
        What's the issue?
      </h1>
      <p className="mt-2 text-base text-vt-muted">Please make a selection below</p>

      <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3">
        {FLEX_ISSUES.map((issue) => (
          <ChoiceButton
            key={issue.id}
            label={issue.label}
            onClick={() => onSelect(issue)}
          />
        ))}
      </div>
    </section>
  );
}
