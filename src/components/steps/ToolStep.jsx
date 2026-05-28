import ChoiceButton from "../ChoiceButton.jsx";
import { TOOLS } from "../../lib/wizardConfig.js";

/**
 * Screen 2: "What tool is experiencing issues?"
 *
 * Props:
 *   - onSelect(toolId): called with "nerdyassistant" | "flex"
 */
export default function ToolStep({ onSelect }) {
  return (
    <section className="mx-auto w-full max-w-xl px-6 pt-10 text-center">
      <h1 className="text-4xl font-normal tracking-tight text-vt-ink">
        What tool is experiencing issues?
      </h1>
      <p className="mt-2 text-base text-vt-muted">Please make a selection below</p>

      <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3">
        {TOOLS.map((tool) => (
          <ChoiceButton
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            onClick={() => onSelect(tool.id)}
          />
        ))}
      </div>
    </section>
  );
}
