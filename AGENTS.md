# AGENTS.md — rules for any collaborator (AI or human)

This file is read automatically by Cursor and other AI coding tools. Human
contributors must also follow it. Anything below this line is a hard rule.

---

## Golden rule: nothing ships without the owner's OK

**Owner:** `kristianstephens-droid` (GitHub).

You must **never** do any of the following without an explicit, in-conversation
"ship it" (or equivalent direct approval) from the owner:

1. `git push` to the `main` branch (whether direct push or merging a PR).
2. `netlify deploy --prod` or clicking **Publish deploy** in the Netlify UI.
3. Editing environment variables in the Netlify or Supabase dashboards.
4. Applying schema changes (`supabase/schema.sql` or otherwise) to the
   **production** Supabase project.
5. Rotating, revoking, or creating API keys.
6. Force-pushing, rebasing, or rewriting history on `main`.
7. Deleting the repo, branches on the remote, or Supabase tables.

If you are unsure whether something counts as "shipping," assume it does and
ask first.

## Default working branch

- Work happens on the `dev` branch (or a feature branch off of `dev`).
- `main` represents what is live or could go live next.
- Promotion to `main` is always via Pull Request, never direct push.

## Secrets

- Never paste real API keys, service-role keys, JWTs, or DB passwords into
  source files, comments, commit messages, issues, or PR bodies.
- The only legitimate places for real secrets are:
  - the local `.env` file (gitignored), and
  - the Netlify dashboard (Site settings → Environment variables).
- If you encounter a leaked secret, stop and tell the owner immediately.

## Code style + structure

- Keep the secure backend in `netlify/functions/`. The browser must never call
  Anthropic / OpenAI / Supabase service-role directly.
- Anything starting with `VITE_` is public. Everything else is server-only.
- Guardrails live in `netlify/functions/_shared/guardrails.js` and run on
  every request. Don't bypass them.
- New tables need RLS turned on with explicit policies.

## Cost guardrails

- Don't raise `MAX_OUTPUT_TOKENS`, the rate-limit caps, or the history cap
  without owner approval.
- Don't switch to a more expensive default model without owner approval.

## Before opening a PR into `main`

Run through [`docs/SHIPPING.md`](./docs/SHIPPING.md). All boxes must be
ticked. Quote the checklist in the PR description so the owner can sign off.
