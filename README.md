# HelpBotV0

A safe, minimal agent help-bot skeleton.

- **Frontend:** Vite + React, hosted on Netlify.
- **Backend:** Netlify Functions (the only place that holds secret keys).
- **Database:** Supabase (Postgres + Row Level Security).
- **AI:** Anthropic Claude today; OpenAI wired in (stubbed) for later.

## Two golden rules

1. **Secret keys only live in Netlify Functions, never in the browser.**
2. **Nothing ships to production without the owner's explicit OK.** See
   [`AGENTS.md`](./AGENTS.md) and [`docs/SHIPPING.md`](./docs/SHIPPING.md).

## Quick start (for a brand-new coder)

The full step-by-step is in [`docs/SETUP.md`](./docs/SETUP.md). Short version:

```bash
nvm use 20              # or otherwise have Node 20+
npm install
cp .env.example .env    # then paste your real keys
npx netlify dev         # http://localhost:8888
```

## Project layout

```
.
├── AGENTS.md                  rules ANY collaborator (AI or human) must follow
├── README.md                  you are here
├── .env.example               template for required env vars
├── .gitignore                 protects .env, node_modules, etc.
├── netlify.toml               Netlify build config (auto-publish OFF)
├── package.json
├── vite.config.js
├── index.html
│
├── src/                       FRONTEND (Vite + React)
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── Chat.jsx
│   │   └── MessageBubble.jsx
│   ├── lib/
│   │   └── supabaseClient.js  uses ONLY the public anon key
│   └── styles.css
│
├── netlify/functions/         SERVER (the only place with secret keys)
│   ├── chat.js                POST /api/chat
│   └── _shared/
│       ├── claude.js          Anthropic SDK wrapper
│       ├── openai.js          stub for now
│       ├── guardrails.js      input + output safety
│       ├── rateLimit.js       per-IP fixed-window limiter
│       ├── supabaseAdmin.js   service-role client (server only)
│       └── prompts.js         <-- paste your Claude prompt here
│
├── supabase/
│   ├── schema.sql             tables + RLS policies
│   └── README.md
│
└── docs/
    ├── SETUP.md               first-time setup
    ├── SAFETY.md              every guardrail explained
    └── SHIPPING.md            release checklist (the ship gate)
```

## How a chat works

```
browser  --fetch POST /api/chat-->  Netlify Function  --Claude-->  reply
                                          |
                                          +--saves messages--> Supabase
                                          +--guardrail trips--> safety_events
```

The function:

1. Identifies the caller (IP) and checks the rate limit.
2. Validates and sanitizes the conversation (length, injection patterns).
3. Calls Claude (or OpenAI, when enabled) with a clamped `max_tokens`.
4. Runs output through a secret-redactor.
5. Saves the turn to `messages` (creating a `conversations` row if needed).
6. Returns `{ reply, conversationId, model }`.

## Branches

- `main` — what is (or could be) live. Protected. No direct pushes.
- `dev` — daily work happens here. PR into `main` requires explicit
  owner approval per [`AGENTS.md`](./AGENTS.md).

## Next steps (suggested)

1. Open [`netlify/functions/_shared/prompts.js`](./netlify/functions/_shared/prompts.js)
   and paste your real Claude prompt over the placeholder.
2. Set up the Supabase project per [`docs/SETUP.md`](./docs/SETUP.md).
3. Connect the repo to Netlify (auto-publish OFF) and add env vars.
4. Add Supabase Auth → enable per-user RLS read policies.
5. Add streaming responses when you're ready for a UX upgrade.
