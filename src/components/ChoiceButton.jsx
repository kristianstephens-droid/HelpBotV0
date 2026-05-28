/**
 * The pill-shaped option button used on every wizard step.
 *   - White background, soft navy/blue border
 *   - Leading icon (image), label, trailing chevron
 *   - Hover: subtle blue tint background
 *
 * Props:
 *   - icon:  imported PNG/SVG source URL
 *   - label: button text
 *   - onClick: callback
 */
export default function ChoiceButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group flex w-full items-center justify-between
        rounded-2xl border-2 border-vt-border bg-white
        px-4 py-3
        text-vt-ink
        shadow-sm
        transition
        hover:bg-vt-tint hover:border-vt-accent
        focus:outline-none focus-visible:ring-2 focus-visible:ring-vt-accent focus-visible:ring-offset-2
      "
    >
      <span className="flex items-center gap-3 text-lg">
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          className="h-8 w-8 shrink-0 select-none"
          draggable={false}
        />
        <span className="font-medium">{label}</span>
      </span>

      <ChevronRight />
    </button>
  );
}

function ChevronRight() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-vt-accent transition-transform group-hover:translate-x-0.5"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
