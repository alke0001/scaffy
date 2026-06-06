# Scaffy

> AI that teaches you to build good code, not just builds for you.

Scaffy generates code step by step and uses targeted questions to block the next chunk until the user answers correctly — combining scaffolding with deliberate friction to build real understanding.

**Stack:** SvelteKit 5 · TypeScript · Monaco Editor · shadcn-svelte · Anthropic API · Vercel

---

## Getting Started

**Prerequisites:** Node.js 20+ and [pnpm](https://pnpm.io/) 9.x

Install pnpm if it is not already on your PATH:

```sh
# Option A — Corepack (bundled with Node 20+)
corepack enable
corepack prepare pnpm@9.15.9 --activate

# Option B — global install (e.g. when Corepack is unavailable)
npm install -g pnpm@9.15.9
```

Then clone and install dependencies:

```sh
git clone https://github.com/alke/scaffy.git
cd scaffy
pnpm install
```

Copy the environment template and add your API key (see [Environment Setup](#environment-setup)):

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

### Recommended editor extensions

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

## Repository Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── chat/          # Chat panel UI (ask mode + learn mode)
│   │   └── editor/        # Monaco editor wrapper
│   ├── server/
│   │   ├── scaffold/      # Structured-output schema and system prompt (Learn)
│   │   ├── chat/          # Ask-mode tutor system prompt
│   │   └── anthropic-client.ts
│   ├── session.svelte.ts  # Scaffold list + request status (Monaco consumes later)
│   └── types/             # Client-safe shared types (scaffold, chat-message)
│   └── mocks/             # Local fixture data for UI development
└── routes/
    ├── api/
    │   ├── scaffold/      # POST /api/scaffold — structured JSON (Learn)
    │   └── chat/          # POST /api/chat — SSE plain-text tutor (Ask)
    └── +page.svelte       # Main app shell
```

Server routes under `src/routes/api/` are thin proxies: parse request → call Anthropic → return response. Reusable logic lives in `src/lib/server/`. UI components live in `src/lib/components/<area>/`.

**Architecture decisions** (context, alternatives, status): [`docs/decisions.md`](docs/decisions.md). Agent-facing invariants remain in [`CLAUDE.md`](CLAUDE.md). Cursor agents update the decision log after implementation (`.cursor/rules/decisions-log.mdc`).

---

## Environment Setup

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

## Building

```sh
pnpm run build
```

Preview the production build locally:

```sh
pnpm run preview
```

---

## Continuous Integration

Every push and pull request targeting `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

```sh
pnpm run ci
pnpm run lint
pnpm run check
```

`pnpm run ci` installs dependencies from `pnpm-lock.yaml` with a frozen lockfile (fails if the lockfile is out of sync with `package.json`).

Run the same checks locally before opening a PR:

```sh
pnpm run ci && pnpm run lint && pnpm run check
```

**Branch protection (repo admin):** After CI has run at least once on `main`, open **GitHub → Settings → Branches → Add branch protection rule** for `main`, enable **Require status checks to pass before merging**, and select the **`ci`** check.

---

## Deployment

Scaffy is deployed on [Vercel](https://vercel.com). The same environment variables from [Environment Setup](#environment-setup) must be set on the Vercel project so serverless functions can reach the API.

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

## Agentic Coding

This project is configured for AI-assisted development with three tools. All agents share the same design decisions and coding conventions defined in `CLAUDE.md`.

| Tool                                                  | Config                               |
| ----------------------------------------------------- | ------------------------------------ |
| [Claude Code](https://claude.ai/code)                 | `CLAUDE.md`, `.cursor/mcp.json`      |
| [Cursor](https://cursor.com)                          | `.cursor/rules/`, `.cursor/mcp.json` |
| [GitHub Copilot](https://github.com/features/copilot) | `.github/copilot-instructions.md`    |

When making changes to project configuration or design decisions, update all three config files in the same edit batch to keep them in sync.
