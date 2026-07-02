# Scaffy — GitHub Copilot Instructions

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Framework**: SvelteKit 5, SPA mode (no SSR/SSG)
- **Add-ons**: prettier, eslint, tailwindcss, shadcn-svelte
- **Deployment**: Vercel

## Agent Config Synchronization

These three files must stay semantically identical in their shared project assumptions (stack, conventions, design decisions):

| Agent          | Config file                           |
| -------------- | ------------------------------------- |
| Claude Code    | `CLAUDE.md`                           |
| Cursor         | `.cursor/rules/` + `.cursor/mcp.json` |
| GitHub Copilot | `.github/copilot-instructions.md`     |

- Changes to project configuration or design decisions must be applied to all three in the same edit batch.
- **Detailed decision log:** [`docs/decisions.md`](../docs/decisions.md) — context, alternatives, ADR status.
- **After implementing features or architecture:** update `docs/decisions.md` in the same edit batch (ADR status, index, changelog). Sync `CLAUDE.md` only for short new invariants.

---

## App Vision

- **Name:** Scaffy — _"AI that teaches you to build good code, not just builds for you."_
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
- Claude returns the full response as **structured JSON** — ordered **scaffolds** in one shot (no streaming)
- Parallel **session intro** (SSE) streams a concept preview in Ask while scaffolds generate
- Unlocked scaffold code via **`editor.setValue()`** (typewriter via `executeEdits` planned, ADR-011)
- **Learning Card** in a Monaco **`viewZone`** after the last code line; gate before next scaffold
- **Lesson start gate** — first scaffold after **Got it — start lesson** (ADR-021)

### Claude API — Architecture

#### No direct browser API calls

- The API key must **never** appear in the client bundle.
- Claude is used only through SvelteKit **`src/routes/api/<endpoint>/+server.ts`** handlers (`scaffold` REST, `chat` SSE, `chat-session-intro` SSE).
- `ANTHROPIC_API_KEY` is injected server-side via `import { ANTHROPIC_API_KEY } from '$env/static/private'`.
- Client code calls only same-origin **`/api/...`** — never `api.anthropic.com` directly.

```
Browser → /api/<endpoint> (SvelteKit server route) → api.anthropic.com
```

#### Streaming vs REST

- **`/api/scaffold` (Learn):** REST — structured JSON (`json_schema`); full response before Monaco updates
- **`/api/chat-session-intro`:** SSE — concept preview; parallel to scaffold on session load
- **`/api/chat` (Ask):** SSE — Socratic tutor; temperature 0.55; max_tokens 2048; history cap 30

#### Model

- Logical IDs: `claude-sonnet-4-5`, `claude-sonnet-4-6` (`anthropic-client.ts`, `ANTHROPIC_DEFAULT_MODEL`).

#### Environment variables

- `.env.local` — real key, never committed.
- `.env.example` — committed, documents required variables for teammates.

### State & Architecture

- Global **rune singletons** in `src/lib/global-state/` (`.svelte.ts`: `session`, `translation`, `onboarding`). See each file header for what persists to `localStorage` vs memory-only.
- State is handled at three levels: **URL** (routing), **global/component state** (SPA), **localStorage**.
- Learning progress persisted in localStorage.

### Repository layout (source conventions)

- **Global rune singletons:** `src/lib/global-state/` — session, translation (locale), onboarding. **`src/lib/i18n/`** — static `translations.ts` + store adapters in `index.ts` (`$language` / `$messages`).
- **Routes:** `src/routes/**/+page.svelte` thin — import view from `lib/`; URL = folder (no `-page` suffix on route files).
- **Feature views:** `src/lib/components/<area>/` (`home`, `sessions`, `chat`, `editor`, `shell`, …) — domain copy, data, wiring.
- **Generic UI:** `src/lib/components/ui/` — domain-agnostic primitives on **shadcn-svelte**; install via `shadcn-svelte add` before hand-rolling (ADR-017); custom `ui/` only when composing shadcn or documented in `docs/decisions.md`.
- **Scrollbars:** hover-fade app-wide — default `ScrollArea` `type="hover"` (incl. modals); `--scaffy-scrollbar-*` in `scroll-area.css` + Monaco. No `type="always"` in product UI. See `.cursor/rules/scrollbars.mdc`.
- **Assets:** `src/lib/assets/` — static SVG/images; avoid Svelte wrappers unless dynamic/themed.
- **Unclear placement?** Ask before creating components (ADR-016, `component-layout.mdc`).
- **HTTP API:** `src/routes/api/<endpoint>/+server.ts` — `scaffold` (REST), `chat` (SSE), `chat-session-intro` (SSE)
- **Server-only library:** `src/lib/server/` — subfolders: `scaffold/`, `chat/` (`ask-system-prompt.md`, `session-intro-system-prompt.md`); shared `anthropic-client.ts`

### Monaco + Svelte Integration

- **`changeViewZones`** — Learning Card (Svelte) and loading spinner (plain DOM)
- **`setValue`** — scaffolds; loading/wait HTML comments
- **`overlayWidgets`** — fallback when viewZones are insufficient
- Scaffold typewriter (`executeEdits`) — planned (ADR-011)

### SPA Mode

- This is a pure SPA — do not add SSR data loading (`+page.server.ts` load functions) outside of the `/api/` route directory.
- **Route handlers** for HTTP APIs live in `src/routes/api/`. **Shared server-only** code (Anthropic client, prompts, schemas) lives in `src/lib/server/` — see Repository layout above.

### Nice to Have

- Authentication
- A/B testing: scaffolding with friction vs. classic agentic coding
- Event logging via Tinybird for analytics

---

## TypeScript

- Use **TypeScript** for all application code under `src/` and for SvelteKit route files.
- Svelte components: `<script lang="ts">` only — never plain `<script>`.
- Do not add new `.js` files under `src/`. Migrate existing `.js` to `.ts` when practical.
- Config files use `.ts` unless the tool requires another format.

## Language Conventions

- **README.md**: American English only.
- **Code comments**: American English only (inline, block, JSDoc/TSDoc).
