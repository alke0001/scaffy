## Project Configuration

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Add-ons**: prettier, eslint, tailwindcss, sveltekit-adapter, mcp
- **MCP Servers (.cursor/mcp.json)**: svelte, vercel

## Agent Config Synchronization

These three files must stay semantically identical in their shared project assumptions (stack, conventions, design decisions):

| Agent          | Config file                           |
| -------------- | ------------------------------------- |
| Claude Code    | `CLAUDE.md`                           |
| Cursor         | `.cursor/rules/` + `.cursor/mcp.json` |
| GitHub Copilot | `.github/copilot-instructions.md`     |

- Changes to project configuration or design decisions must be applied to all three in the same edit batch.
- **Detailed decision log** (context, alternatives, status): [`docs/decisions.md`](docs/decisions.md). Prefer updating that file for new architectural choices; add only short invariants here when agents must enforce them.
- **After Agent-mode implementation** (including work that executed a Plan or answered design questions in Ask): update `docs/decisions.md` in the same batch (see `.cursor/rules/decisions-log.mdc`). Move ADRs from Proposed → Accepted when shipped; add a changelog line.

---

## App Vision

- **Name:** Scaffy
- **Punchline:** _"AI that teaches you to build good code, not just builds for you."_
- **Core concept:** Scaffolding + Friction — AI generates code step by step; targeted questions block the next chunk until the user answers correctly.

## Scaffy — Software Design Decisions

### Tech Stack

- SvelteKit 5, SPA mode (no SSR/SSG)
- Monaco Editor (VS Code engine)
- shadcn-svelte + dark theme
- Claude API (structured JSON + code)
- GitHub + Vercel

### Claude API — Core Flow

- User submits a prompt (e.g. _"Generate a Svelte 5 login dialog component with password validation"_)
- Claude returns the full response as **structured JSON** — ordered **scaffolds** (`codeSnippet` + `knowledgeCheck` per step) in one shot (no streaming)
- Each scaffold’s code is revealed via a **typewriter effect** in Monaco (`editor.executeEdits()`, ~15 ms per character)
- A framework-specific question appears as a Monaco `viewZone` between code lines before the next scaffold’s code renders
- The next scaffold is only revealed after the user answers correctly (or acknowledges the explainer)

### Claude API — Architecture

#### No direct browser API calls

- The API key is **never in the client bundle** — it would be visible in the browser network tab
- Claude is used only through SvelteKit **`src/routes/api/<endpoint>/+server.ts`** proxies: `scaffold` → `POST /api/scaffold`; `chat` → `POST /api/chat` (SSE streaming for Ask mode)
- Key is stored as an environment variable in Vercel (`ANTHROPIC_API_KEY`)
- Client calls only same-origin **`/api/...`** — never `api.anthropic.com` directly

```
Browser → /api/<endpoint> (SvelteKit server route) → api.anthropic.com
```

#### Streaming vs REST

- **`/api/scaffold` (Learn):** REST only — structured JSON cannot be parsed incrementally. The full JSON is returned at once; each scaffold’s `codeSnippet` is typed into Monaco with a client-side typewriter effect (~15 ms per character).
- **`/api/chat` (Ask):** SSE streaming; scaffolded Socratic tutor (concept ladder, explain Runes before `$…` syntax); temperature 0.55; max_tokens 2048; history cap 30 messages server-side. ChatPanel statuses: `loading`, `streaming`, `complete`, `error`.

```ts
// Typewriter principle in Monaco
for (const char of scaffold.codeSnippet) {
	editor.executeEdits('', [{ range: cursorPosition, text: char }]);
	await new Promise((r) => setTimeout(r, 15));
}
```

#### Environment variables

- `.env.local` — real key, never committed
- `.env.example` — committed, documents required variables for teammates
- SvelteKit import: `import { ANTHROPIC_API_KEY } from '$env/static/private'`

#### Model

- Logical IDs: `claude-sonnet-4-5`, `claude-sonnet-4-6` (see `src/lib/server/anthropic-client.ts` and `ANTHROPIC_DEFAULT_MODEL`)

### State & Architecture

- Global state as singletons in `src/lib/*.svelte.ts` (split by concern: editor / session / questions)
- State is handled at three levels: **URL** (routing), **global/component state** (SPA), **localStorage**
- Learning progress persisted in localStorage

### Repository layout (source conventions)

These conventions keep the codebase navigable as we add endpoints (for example **`/api/chat`**) and more UI. Prefer them for new files; refactor opportunistically when touching old paths.

- **Svelte UI components:** `src/lib/components/<area>/` — one subdirectory per product area (`chat`, `editor`, future `questions`, …). Do not add new loose `*.svelte` files at `src/lib/` root unless they are tiny one-offs. When an area grows large (many components plus `*.svelte.ts` and helpers), consider promoting it to `src/lib/features/<name>/` instead of deepening `components/` indefinitely.
- **Routes vs views vs ui/ (ADR-016, ADR-017):** `src/routes/**/+page.svelte` stays thin (import view only). Screen copy, example data, and wiring live in `components/<area>/`. Domain-agnostic primitives in `components/ui/` built on **shadcn-svelte** — install via `shadcn-svelte add` before hand-rolling (ScrollArea, Dialog, …); custom `ui/` only when composing shadcn or documented in `docs/decisions.md`. Static logos/images in `src/lib/assets/`. If placement is unclear when adding a component, ask before creating files.
- **HTTP API (SvelteKit routes):** `src/routes/api/<endpoint>/+server.ts` — **one folder per HTTP surface**. `scaffold` (`POST /api/scaffold`, REST JSON), `chat` (`POST /api/chat`, SSE). Keep handlers thin (parse body → call Anthropic → return).
- **Server-only library code:** `src/lib/server/` — must never be imported from client components. Use **subfolders per endpoint or concern** alongside shared files at the `server/` root:
  - **`src/lib/server/scaffold/`** — structured-output JSON schema, `output-schema.ts` validation, `system-prompt.md` for the scaffold API.
  - **`src/lib/server/chat/`** — Ask-mode tutor system prompt (plain text, separate from scaffold pedagogy).
  - **Shared:** `anthropic-client.ts` and similar cross-route modules stay at `src/lib/server/` until multiple shared modules justify a `src/lib/server/shared/` folder.
- **Routes vs `lib`:** `src/routes/` defines URLs, layouts, and thin `+server.ts` handlers. Reusable UI and domain logic live under `src/lib/`.

### Monaco + Svelte Integration

- `viewZones` for inline question components between code lines
- `overlayWidgets` as an alternative
- Typewriter effect via `editor.executeEdits()` — character by character with ~15 ms delay

### Nice to Have

- Authentication
- A/B testing: scaffolding with friction vs. classic agentic coding
- Event logging via Tinybird for analytics

## TypeScript

- All new application code uses **TypeScript** (`src/`, SvelteKit `+*.ts` server/load files, `hooks.server.ts`, etc.).
- Svelte: `<script lang="ts">` only.
- Do not add new plain `.js` files under `src/`; when editing legacy `.js`, migrate to `.ts` when practical.
- Prefer `.ts` for project config/tooling (e.g. Vite) unless a tool forces another format.

## Language Conventions

- **README.md**: American English only.
- **Code comments**: American English only (inline, block, JSDoc/TSDoc).
- **Chat**: Reply in German when the user writes in German.

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
