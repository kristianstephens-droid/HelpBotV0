import { useState } from "react";

/**
 * Free-text step for the "Not Sure / Other" path.
 *
 * Props:
 *   - onSubmit(text): the typed description; Wizard advances to chat with
 *     this as the first user message.
 */
export default function FreeTextStep({ onSubmit }) {
  const [text, setText] = useState("");

  const canSubmit = text.trim().length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(text.trim());
  }

  return (
    <section className="mx-auto w-full max-w-xl px-6 pt-10 text-center">
      <h1 className="text-4xl font-normal tracking-tight text-vt-ink">
        Tell us what's going on
      </h1>
      <p className="mt-2 text-base text-vt-muted">
        Describe the issue in your own words.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-8 flex max-w-sm flex-col gap-3 text-left"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. The dial pad disappeared after I logged in this morning."
          rows={5}
          maxLength={1000}
          className="
            w-full rounded-2xl border-2 border-vt-border bg-white
            px-4 py-3 text-base text-vt-ink placeholder:text-vt-muted
            focus:outline-none focus:border-vt-accent
          "
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="
            w-full rounded-2xl bg-vt-accent px-4 py-3
            text-base font-medium text-white
            transition
            hover:brightness-110
            disabled:cursor-not-allowed disabled:opacity-50
            focus:outline-none focus-visible:ring-2 focus-visible:ring-vt-accent focus-visible:ring-offset-2
          "
        >
          Continue
        </button>
      </form>
    </section>
  );
}
