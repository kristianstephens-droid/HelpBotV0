# SETUP.md — first-time setup (very, very new coder edition)

Goal: get the app running on your Mac so you can chat with it locally.
You'll need about 20 minutes the first time.

> Throughout this guide, lines that start with `$` are commands you type
> into the **Terminal** app. Don't type the `$` itself.

## 1. Install the tools you need (one-time)

You need three things on your computer:

- **Node.js 20+** — runs JavaScript. Check by running `$ node -v`.
  If you don't have it, install [nvm](https://github.com/nvm-sh/nvm) and then:
  ```
  $ nvm install 20
  $ nvm use 20
  ```
- **Git** — already on macOS. Check with `$ git --version`.
- **GitHub CLI** (optional, but handy) — `$ brew install gh` then
  `$ gh auth login`.

## 2. Get the code

If you already cloned the repo, skip to step 3.

```
$ git clone https://github.com/kristianstephens-droid/HelpBotV0.git
$ cd HelpBotV0
$ git checkout dev
```

## 3. Install the project's libraries

From inside the project folder:

```
$ npm install
```

This downloads everything listed in `package.json` into `node_modules/`
(which is gitignored).

## 4. Make a Supabase project

1. Go to https://supabase.com and create a free project. Pick a region near you.
2. In the project sidebar: **SQL Editor → New query**.
3. Open [`supabase/schema.sql`](../supabase/schema.sql) from this repo,
   copy the whole file, paste, click **Run**. You should see four new
   tables in **Table Editor**.
4. Go to **Project Settings → API** and copy down:
   - **Project URL**
   - **anon public** key
   - **service_role** key (treat like a password)

## 5. Get your Anthropic API key

1. Go to https://console.anthropic.com/settings/keys.
2. Click **Create Key**, copy it (starts with `sk-ant-`). Treat it like a password.

OpenAI is optional — leave its env var blank for now.

## 6. Create your `.env` file

```
$ cp .env.example .env
```

Open `.env` in any editor and fill in the four values:

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Save and close. **Never commit this file.** It is in `.gitignore` already.

## 7. Run the app locally

```
$ npx netlify dev
```

This starts the Vite frontend AND the Netlify Functions backend together,
on http://localhost:8888 (the port may vary — check the terminal output).

Open the URL. Type a message. You should see a reply. If you haven't
edited `prompts.js` yet, the reply will be the placeholder text — that's
expected.

## 8. Connect to Netlify (for previews + eventual deploy)

> Reminder: nothing actually goes live without your explicit OK. See
> [`SHIPPING.md`](./SHIPPING.md) and [`AGENTS.md`](../AGENTS.md).

1. Sign in at https://app.netlify.com.
2. **Add new site → Import an existing project → GitHub → HelpBotV0**.
3. Set the production branch to `main`. Netlify will read `netlify.toml`.
4. **Site settings → Build & deploy → Continuous deployment →
   "Stop auto publishing"**. From now on, pushes build a Deploy Preview but
   do NOT change the live site until you click **Publish deploy**.
5. **Site settings → Environment variables** — paste in every value from
   your `.env` for the production context.

## 9. Turn on branch protection on GitHub

1. https://github.com/kristianstephens-droid/HelpBotV0/settings/branches
2. **Add branch ruleset** for `main`:
   - Require a pull request before merging.
   - Block force pushes.
   - Block branch deletion.

That makes the ship-gate technically enforced, not just an honor system.

## 10. Day-to-day workflow from here

```
$ git checkout dev
# make changes
$ npx netlify dev          # try them locally
$ git add . && git commit -m "feat: my change"
$ git push origin dev
# Open a PR from dev -> main, fill out the SHIPPING.md checklist,
# wait for owner approval, merge, then click Publish deploy in Netlify.
```
