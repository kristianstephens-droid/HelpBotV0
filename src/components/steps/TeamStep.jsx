import ChoiceButton from "../ChoiceButton.jsx";
import { TEAMS } from "../../lib/wizardConfig.js";

/**
 * Screen 1: "Welcome / What team are you on?"
 *
 * Props:
 *   - onSelect(teamId): called with "new_sales" | "member_services"
 */
export default function TeamStep({ onSelect }) {
  return (
    <section className="mx-auto w-full max-w-xl px-6 pt-10 text-center">
      <p className="text-lg text-vt-ink">Welcome</p>
      <h1 className="mt-1 text-4xl font-normal tracking-tight text-vt-ink">
        What team are you on?
      </h1>
      <p className="mt-2 text-base text-vt-muted">Please make a selection below</p>

      <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3">
        {TEAMS.map((team) => (
          <ChoiceButton
            key={team.id}
            icon={team.icon}
            label={team.label}
            onClick={() => onSelect(team.id)}
          />
        ))}
      </div>
    </section>
  );
}
