# SHIPPING.md — release checklist

> **Hard rule:** nothing on this project ships to production without the
> owner (`kristianstephens-droid`) typing **"ship it"** (or equivalent) in
> the PR or chat. See [`AGENTS.md`](../AGENTS.md).

Run through every box before any merge into `main` or click of
**Publish deploy** in Netlify.

## Before the PR

- [ ] Worked on a `dev` (or feature) branch, never directly on `main`.
- [ ] Ran the app locally with `npx netlify dev` and the chat round-trip
      works end-to-end (send message → reply comes back).
- [ ] Updated `.env.example` if any new env vars were introduced.
- [ ] Updated `supabase/schema.sql` and applied it to the **dev/staging**
      Supabase project (if there is one).
- [ ] No real secrets are visible in the diff (search for `sk-`, `eyJ`,
      `service_role`, etc.).
- [ ] Guardrail caps reviewed: `MAX_OUTPUT_TOKENS`, `RATE_LIMIT_*`.
- [ ] Updated docs (`README.md`, `docs/SAFETY.md`) if behavior changed.

## In the PR (`dev` → `main`)

- [ ] PR description quotes this checklist with boxes checked.
- [ ] Netlify Deploy Preview built successfully and was opened/tested.
- [ ] Owner has explicitly typed **"ship it"** (or equivalent) in the PR.

## Production deploy (after merge)

- [ ] Any new env vars added to Netlify **production** environment.
- [ ] `supabase/schema.sql` applied to the **production** Supabase project.
- [ ] Click **Publish deploy** in Netlify (auto-publish stays off).
- [ ] Smoke test the live URL: send one message, confirm reply + that
      a row appeared in `messages` and (if applicable) `safety_events`.

## If something looks off after deploy

- Click **Lock publishing** / roll back to the previous published deploy
  in the Netlify UI.
- Open an issue. Don't push a hotfix to `main` without owner approval —
  even hotfixes go through this checklist.
