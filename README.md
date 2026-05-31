# Scaffy

> AI that teaches you to build good code, not just builds for you.

Scaffy generates code step by step and uses targeted questions to block the next chunk until the user answers correctly — combining scaffolding with deliberate friction to build real understanding.

**Stack:** SvelteKit 5 · TypeScript · Monaco Editor · shadcn-svelte · Anthropic API · Vercel

---

## Getting Started

**Prerequisites:** Node.js 20+, npm

```sh
git clone https://github.com/alke/scaffy.git
cd scaffy
npm install
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
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

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

**Architecture decisions** (context, alternatives, status): [`docs/decisions.md`](docs/decisions.md). Agent-facing invariants remain in [`CLAUDE.md`](CLAUDE.md).

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
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

---

## Deployment

Scaffy is deployed on [Vercel](https://vercel.com). The same environment variables from [Environment Setup](#environment-setup) must be set on the Vercel project so serverless functions can reach the API.

**Via Vercel Dashboard:**
Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY` (Production + Preview). Optionally add `ANTHROPIC_DEFAULT_MODEL`.

**Via Vercel CLI:**

```sh
npm i -g vercel
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
