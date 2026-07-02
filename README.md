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

This project was built with **agentic coding** (AI-assisted development). Shared agent config, Cursor rules, and MCP setup are documented under [Agentic coding](#agentic-coding).

### Getting started

**Prerequisites:** Node.js 20+ and [pnpm](https://pnpm.io/) **9.15.9** (pinned in `package.json` → `packageManager`)

Install pnpm if it is not already on your PATH:

```sh
# Option A — Corepack (bundled with Node 20+; matches packageManager)
corepack enable
corepack prepare pnpm@9.15.9 --activate

# Option B — global install (e.g. when Corepack is unavailable)
npm install -g pnpm@9.15.9
```

After `corepack enable`, `pnpm install` in this repo also picks up **9.15.9** from `packageManager` without the explicit `prepare` step.

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

SvelteKit maps **URL paths to `src/routes/` folders**. Feature views live in `src/lib/components/<area>/`; route `+page.svelte` files stay thin.

```
src/
├── lib/
│   ├── actions/                    # Svelte actions (e.g. portal)
│   ├── api/                        # Shared API helpers (SSE, kit errors)
│   ├── assets/                     # Logos and static images
│   ├── chat/                       # Ask client helpers (session-intro stream)
│   ├── components/
│   │   ├── about/                  # About dialog content
│   │   ├── chat/                   # scaffy ask tutor chatpanel
│   │   ├── editor/                 # Monaco, Learning Card
│   │   ├── home/                   # Home prompt, start session
│   │   ├── session/                # Session workspace, tabs, onboarding
│   │   ├── sessions/               # Sessions overview page
│   │   ├── shell/                  # App title bar
│   │   └── ui/                     # shadcn-svelte primitives (Button, Dialog, …) & scaffy custom UI components
│   ├── dev/                        # Dev-only helpers
│   ├── global-state/               # $state singletons only — session, onboarding, translation (locale)
│   ├── i18n/                       # EN/DE strings + Svelte stores ($language, $messages) for locale UI
│   ├── scaffold/                   # Scaffold fetch client, dev fixtures
│   ├── server/                     # Server-only — never import from the client
│   │   ├── chat/                   # Ask + session-intro system prompts
│   │   ├── scaffold/               # Learn schema, prompts, validation
│   │   └── anthropic-client.ts     # Shared Anthropic client
│   └── types/                      # Shared TypeScript types
└── routes/
    ├── api/
    (REST)
    │   ├── chat/                   # POST /api/chat — Ask tutor (SSE)
    │   ├── chat-session-intro/     # POST /api/chat-session-intro — concept preview (SSE)
    │   └── scaffold/               # POST /api/scaffold — Learn (REST JSON)
    ├── history/                    # /history — legacy redirect → /sessions
    ├── session/[id]/               # /session/:id — learning workspace
    ├── sessions/                   # /sessions — saved sessions overview
    ├── +layout.svelte              # App shell
    └── +page.svelte                # / — home
```

### Architecture & stack

| Area        | Choice                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------- |
| Framework   | SvelteKit 5 — **SPA** (`ssr = false`)                                                        |
| Editor      | Monaco (viewZones for Learning Cards)                                                        |
| UI          | shadcn-svelte, Tailwind CSS 4                                                                |
| AI          | Claude via server-only `/api/*` proxies                                                      |
| State       | `$state` singletons in `global-state/*`; locale UI via Svelte stores in `i18n/index.ts` only |
| Persistence | `localStorage` (sessions, scaffolds, metadata)                                               |
| i18n        | EN (default) + DE — `src/lib/i18n/`                                                          |
| Testing     | Vitest — API routes under `src/routes/api/` (mocked Anthropic)                               |
| Deploy      | Vercel + GitHub Actions CI                                                                   |

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

**No API key yet?** Copy [`.env.test`](.env.test) to `.env` (same as CI) so `svelte-kit sync` can generate types and Vitest can run without a real key:

```sh
cp .env.test .env
```

---

### Development scripts

All commands run from the repo root. `pnpm run build` wraps SvelteKit’s production build (`vite build` under the hood — same command Vercel uses).

| Script           | Command                   | Purpose                                          |
| ---------------- | ------------------------- | ------------------------------------------------ |
| Dev server       | `pnpm run dev`            | Vite dev server                                  |
| Production build | `pnpm run build`          | SvelteKit production build (`vite build`)        |
| Preview build    | `pnpm run preview`        | Serve the production build locally               |
| Typecheck        | `pnpm run check`          | `svelte-check`                                   |
| Typecheck watch  | `pnpm run check:watch`    | `svelte-check` in watch mode                     |
| i18n key parity  | `pnpm run check:i18n`     | en/de keys in `translations.ts` match            |
| Format all       | `pnpm run format`         | Prettier write on the whole repo                 |
| Lint             | `pnpm run lint`           | Prettier check + ESLint                          |
| Tests (watch)    | `pnpm run test`           | Vitest watch mode                                |
| Tests (once)     | `pnpm run test:run`       | Full unit test suite                             |
| Coverage         | `pnpm run coverage`       | Vitest with coverage report                      |
| PR checks        | `pnpm run verify`         | lint + check + check:i18n + test:run             |
| CI install       | `pnpm run ci`             | Frozen lockfile install (same as GitHub Actions) |
| License audit    | `pnpm run licenses:check` | Validate production dependency licenses          |
| License CI       | `pnpm run licenses:ci`    | SBOM + license allowlist (CI step)               |
| SBOM             | `pnpm run sbom`           | Write CycloneDX `sbom.json` only                 |

Preview the production build locally:

```sh
pnpm run build
pnpm run preview
```

Format and lint specific files after editing:

```sh
pnpm exec prettier --write path/to/file
pnpm exec eslint path/to/file
```

---

### Quality gates

**Before opening a pull request**, run the same checks CI uses (except install):

```sh
pnpm run verify
```

Use `pnpm run test` for watch mode while editing API routes.

#### Pre-commit (Husky + lint-staged)

On `git commit`, staged files are auto-formatted with Prettier and ESLint-fixed (see `lint-staged` in `package.json`). Hooks install when you run `pnpm install` (`prepare` script).

| When you stage…                 | lint-staged runs…                            |
| ------------------------------- | -------------------------------------------- |
| Any matching source/config file | Prettier write + ESLint fix                  |
| `src/lib/i18n/translations.ts`  | `pnpm run check:i18n`                        |
| `src/routes/api/**/*.{ts}`      | `vitest related --run` (affected tests only) |
| `src/lib/server/**/*.{ts}`      | `pnpm run test:run` (full API test suite)    |

UI-only or session-store commits skip Vitest — hooks stay fast. CI remains the safety net if someone commits with `--no-verify`.

---

### CI/CD

#### Continuous integration (GitHub Actions)

Every push and pull request targeting `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml). CI copies [`.env.test`](.env.test) to `.env` before install (no real API key in Actions), then runs:

```sh
pnpm run ci           # frozen lockfile install
pnpm run lint
pnpm run check
pnpm run check:i18n
pnpm run licenses:ci  # SBOM + license allowlist
pnpm run test:run
```

These match `pnpm run verify` plus the license audit. Steps are **separate** in GitHub Actions so failed jobs show which gate broke.

**Branch protection (repo admin):** After CI has run at least once on `main`, open **GitHub → Settings → Branches → Add branch protection rule** for `main`, enable **Require status checks to pass before merging**, and select the **`ci`** check.

#### Continuous deployment (Vercel)

Scaffy deploys on [Vercel](https://vercel.com). The same environment variables from [Environment setup](#environment-setup) must be set on the Vercel project so serverless functions can reach the API.

**Vercel (project admin) — via Dashboard:**  
Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY` (Production + Preview). Optionally add `ANTHROPIC_DEFAULT_MODEL`.

**Vercel (project admin) — via CLI:**

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

This project is configured for AI-assisted development with three tools. All agents share the same design decisions and coding conventions defined in [`CLAUDE.md`](CLAUDE.md).

| Tool                                                  | Config                               |
| ----------------------------------------------------- | ------------------------------------ |
| [Claude Code](https://claude.ai/code)                 | `CLAUDE.md`, `.cursor/mcp.json`      |
| [Cursor](https://cursor.com)                          | `.cursor/rules/`, `.cursor/mcp.json` |
| [GitHub Copilot](https://github.com/features/copilot) | `.github/copilot-instructions.md`    |

**Cursor** loads workspace rules from [`.cursor/rules/`](.cursor/rules/) (formatting, layout, scrollbars, TypeScript, decision-log workflow). [Cursor Skills](https://cursor.com/docs/context/skills) are optional user- or team-level prompt packs — this repo does not ship skill files, but you can add your own.

When making changes to project configuration or design decisions, update all three agent config files in the same edit batch to keep them in sync.

---

## Further Documentation

| Document                                                               | Description                                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)                         | Logical and physical architecture (ABB/SSB), API flows, state               |
| [`docs/decisions.md`](docs/decisions.md)                               | Architecture decision log                                                   |
| [`docs/svelte-health-check.md`](docs/svelte-health-check.md)           | Svelte framework health check (German, course evaluation)                   |
| [`docs/projektsteckbrief-scaffy.md`](docs/projektsteckbrief-scaffy.md) | Course project brief (German) — _Frameworkbasierte UI-Entwicklung_, SS 2026 |
| [`CLAUDE.md`](CLAUDE.md)                                               | Short agent invariants (Claude Code, Cursor, Copilot)                       |
