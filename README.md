# Scaffy

> AI that teaches you to build good code, not just builds for you.

Scaffy generates code step by step and uses targeted questions to block the next chunk until you answer correctly — scaffolding with deliberate friction so concepts stick.

**Try it:** [scaffy.vercel.app](https://scaffy.vercel.app/) — access currently requires a [Vercel](https://vercel.com) account.  
**More detail in the app:** open the **About** dialog (help icon in the top bar).

---

## What Scaffy does

1. **Home** — describe what you want to build in plain language; start a session.
2. **Session** — code appears in Monaco step by step; a **Learning Card** blocks each next step until you answer correctly. **Ask** chat on the right explains concepts without replacing the gate.
3. **My Sessions** — resume or delete saved sessions (`localStorage`).

---

## For developers

### Getting started

**Prerequisites:** Node.js 20+ and [pnpm](https://pnpm.io/) 9.x

Install pnpm if it is not already on your PATH:

```sh
# Option A — Corepack (bundled with Node 20+)
corepack enable
corepack prepare pnpm@9.15.9 --activate

# Option B — global install (e.g. when Corepack is unavailable)
npm install -g pnpm@9.15.9
```

Clone and install dependencies (this also installs Git hooks via Husky):

```sh
git clone https://github.com/alke/scaffy.git
cd scaffy
pnpm install
```

Copy the environment template and add your API key (see [Environment setup](#environment-setup)):

```sh
# macOS / Linux
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

Start the dev server:

```sh
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Recommended editor extensions

Use [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.com/). When you open the repo, the editor should prompt you to install the workspace recommendations from [`.vscode/extensions.json`](.vscode/extensions.json):

| Extension                                                                                                  | ID                          | Purpose                                                   |
| ---------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------- |
| [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)             | `svelte.svelte-vscode`      | Svelte 5 syntax, runes, and TypeScript in `.svelte` files |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)                     | `esbenp.prettier-vscode`    | Format on save (configured in `.vscode/settings.json`)    |
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)                       | `dbaeumer.vscode-eslint`    | Lint feedback for TypeScript and Svelte                   |
| [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) | `bradlc.vscode-tailwindcss` | Autocomplete and previews for Tailwind classes            |

Install all at once from the repo root:

```sh
code --install-extension svelte.svelte-vscode
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
```

On Cursor, replace `code` with `cursor`.

---

### Repository structure

```
src/
├── lib/
│   ├── components/
│   │   ├── chat/          # Ask tutor UI (SSE, markdown, composer)
│   │   ├── editor/        # Monaco, Learning Card, viewZone bridge
│   │   ├── sessions/      # Sessions overview page view
│   │   ├── home/          # Home prompt + start session
│   │   ├── session/       # Session workspace, session tabs
│   │   ├── shell/         # App title bar (persistent top nav)
│   │   └── ui/            # shadcn-svelte primitives (Button, Dialog, …)
│   ├── server/
│   │   ├── scaffold/      # Structured JSON schema + system prompt (Learn)
│   │   ├── chat/          # Ask-mode tutor system prompt
│   │   ├── session-intro/ # Concept preview system prompt (SSE)
│   │   └── anthropic-client.ts
│   ├── i18n/              # EN/DE copy, MessageKey, language store
│   ├── learn/             # Client scaffold + session-intro helpers
│   ├── session.svelte.ts  # Session list, active session, localStorage
│   ├── types/             # Shared types (scaffold, chat-message)
│   ├── actions/           # Svelte actions (e.g. portal for overlays)
│   └── mocks/             # Fixture scaffolds for UI development
└── routes/
    ├── +page.svelte       # Home (thin → start-learning-session)
    ├── sessions/          # Sessions overview (lazy-loaded view)
    ├── session/[id]/      # Session workspace
    └── api/
        ├── scaffold/      # POST /api/scaffold — REST structured JSON (Learn)
        ├── chat/          # POST /api/chat — SSE tutor (Ask)
        └── session-intro/ # POST /api/session-intro — SSE concept preview
```

- **Routes** stay thin; feature views live under `src/lib/components/<area>/`. `/sessions` shows an **eager** empty state when there are no sessions; the list UI is **lazy-loaded** only when `localStorage` has sessions (conditional code split).
- **API routes** are thin proxies: parse request → call Anthropic → return response.
- **Server-only** logic lives in `src/lib/server/` (never imported from the client).

### Architecture & stack

| Area        | Choice                                         |
| ----------- | ---------------------------------------------- |
| Framework   | SvelteKit 5 — **SPA** (`ssr = false`)          |
| Editor      | Monaco (viewZones for Learning Cards)          |
| UI          | shadcn-svelte, Tailwind CSS 4                  |
| AI          | Claude via server-only `/api/*` proxies        |
| State       | Svelte 5 runes + `session.svelte.ts` singleton |
| Persistence | `localStorage` (sessions, scaffolds, metadata) |
| i18n        | EN (default) + DE — `src/lib/i18n/`            |
| Deploy      | Vercel + GitHub Actions CI                     |

Logical and physical building blocks (ABB/SSB), API flows, and state: [`docs/architecture.md`](docs/architecture.md) · [`docs/decisions.md`](docs/decisions.md)

---

### Environment setup

The AI API key is server-only and never exposed to the browser. Scaffold your local config from the committed template:

```sh
cp .env.example .env.local   # then edit .env.local
```

| Variable                  | Required | Description                                                                                    |
| ------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`       | Yes      | Your API key from [console.anthropic.com](https://console.anthropic.com/)                      |
| `ANTHROPIC_DEFAULT_MODEL` | No       | Model Scaffy uses when the client omits one. Allowed: `claude-sonnet-4-5`, `claude-sonnet-4-6` |

`.env.local` is listed in `.gitignore` and is never committed.

---

### Development scripts

| Script           | Command               | Purpose                                   |
| ---------------- | --------------------- | ----------------------------------------- |
| Dev server       | `pnpm run dev`        | Vite dev server                           |
| Production build | `pnpm run build`      | Build for Vercel                          |
| Preview build    | `pnpm run preview`    | Serve production build locally            |
| Format all       | `pnpm run format`     | Prettier write on the whole repo          |
| Lint             | `pnpm run lint`       | Prettier check + ESLint                   |
| Typecheck        | `pnpm run check`      | `svelte-check`                            |
| i18n key parity  | `pnpm run check:i18n` | en/de keys in `translations.ts` match     |
| CI install       | `pnpm run ci`         | Frozen lockfile install (same as Actions) |

Preview the production build locally:

```sh
pnpm run build
pnpm run preview
```

---

### Code quality and Git hooks

**Pre-commit (Husky + lint-staged):** On `git commit`, staged files are auto-formatted with Prettier and ESLint-fixed (see `lint-staged` in `package.json`). Staging `src/lib/i18n/translations.ts` also runs `pnpm run check:i18n`. Hooks are installed when you run `pnpm install` (`prepare` script).

Run the same checks CI uses before opening a PR:

```sh
pnpm run ci && pnpm run lint && pnpm run check && pnpm run check:i18n
```

Format specific files after editing:

```sh
pnpm exec prettier --write path/to/file
pnpm exec eslint path/to/file
```

---

### Continuous integration

Every push and pull request targeting `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

```sh
pnpm run ci
pnpm run lint
pnpm run check
pnpm run check:i18n
pnpm run test:run
```

`pnpm run ci` installs dependencies from `pnpm-lock.yaml` with a frozen lockfile (fails if the lockfile is out of sync with `package.json`). CI copies [`.env.test`](.env.test) to `.env` before install so `svelte-kit sync` can generate `$env/static/private` types (no real API key in Actions).

Unit tests are executed with **Vitest** and are part of the CI pipeline. A push or pull request only passes CI if all linting, type checks, i18n checks, and unit tests succeed.

**Branch protection (repo admin):** After CI has run at least once on `main`, open **GitHub → Settings → Branches → Add branch protection rule** for `main`, enable **Require status checks to pass before merging**, and select the **`ci`** check.

No extra GitHub configuration is required for Husky — hooks run locally only; CI remains the safety net if someone commits with `--no-verify`.

---

### Running tests locally

Run Vitest in watch mode during development:

```sh
pnpm run test
```

Run the complete test suite once (recommended before opening a pull request):

```sh
pnpm run test:run
```

### Before opening a Pull Request

Before opening a pull request, ensure the following commands complete successfully:

```sh
pnpm run lint
pnpm run check
pnpm run check:i18n
pnpm run test:run
```


### Continuous deployment

Scaffy is deployed on [Vercel](https://vercel.com). The same environment variables from [Environment setup](#environment-setup) must be set on the Vercel project so serverless functions can reach the API.

**Via Vercel Dashboard:**  
Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY` (Production + Preview). Optionally add `ANTHROPIC_DEFAULT_MODEL`.

**Via Vercel CLI:**

```sh
pnpm add -g vercel
vercel link

vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel env add ANTHROPIC_DEFAULT_MODEL production   # optional
```

To sync remote variables into your local `.env.local` (overwrites the file):

```sh
vercel env pull .env.local
```

---

### Agentic coding

This project is configured for AI-assisted development with three tools. All agents share the same design decisions and coding conventions defined in `CLAUDE.md`.

| Tool                                                  | Config                               |
| ----------------------------------------------------- | ------------------------------------ |
| [Claude Code](https://claude.ai/code)                 | `CLAUDE.md`, `.cursor/mcp.json`      |
| [Cursor](https://cursor.com)                          | `.cursor/rules/`, `.cursor/mcp.json` |
| [GitHub Copilot](https://github.com/features/copilot) | `.github/copilot-instructions.md`    |

When making changes to project configuration or design decisions, update all three config files in the same edit batch to keep them in sync.

---

## Further Documentation

| Document                                                     | Description                                                                 |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)               | Logical and physical architecture (ABB/SSB), API flows, state               |
| [`docs/decisions.md`](docs/decisions.md)                     | Architecture decision log                                                   |
| [`Projektsteckbrief_Scaffy.md`](Projektsteckbrief_Scaffy.md) | Course project brief (German) — _Frameworkbasierte UI-Entwicklung_, SS 2026 |
| [`CLAUDE.md`](CLAUDE.md)                                     | Short agent invariants (Claude Code, Cursor, Copilot)                       |
