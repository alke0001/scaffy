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
- Claude returns the full response as **structured JSON** — ordered **scaffolds** (`codeSnippet` + `knowledgeCheck` per step) in one shot (no streaming)
- Each scaffold’s code is revealed via a **typewriter effect** in Monaco (`editor.executeEdits()`, ~15 ms per character)
- A framework-specific question appears as a Monaco `viewZone` between code lines before the next scaffold’s code renders
- The next scaffold is only revealed after the user answers correctly (or acknowledges the explainer)

### Claude API — Architecture

#### No direct browser API calls

- The API key must **never** appear in the client bundle — it would be visible in the browser network tab.
- Claude is used only through SvelteKit **`src/routes/api/<endpoint>/+server.ts`** handlers (`scaffold`, `chat` with SSE streaming for Ask mode).
- `ANTHROPIC_API_KEY` is injected server-side via `import { ANTHROPIC_API_KEY } from '$env/static/private'`.
- Client code calls only same-origin **`/api/...`** — never `api.anthropic.com` directly.

```
Browser → /api/<endpoint> (SvelteKit server route) → api.anthropic.com
```

#### Streaming vs REST

- **`/api/scaffold` (Learn):** REST only — structured JSON cannot be parsed incrementally. Typewriter effect is client-side in Monaco (`executeEdits()`, ~15 ms per character).
- **`/api/chat` (Ask):** SSE streaming; scaffolded Socratic tutor (concept ladder, Runes before syntax); temperature 0.55; max_tokens 2048; history cap 30 messages server-side. ChatPanel statuses: `loading`, `streaming`, `complete`, `error`.

#### Model

- Logical IDs: `claude-sonnet-4-5`, `claude-sonnet-4-6` (`anthropic-client.ts`, `ANTHROPIC_DEFAULT_MODEL`).

#### Environment variables

- `.env.local` — real key, never committed.
- `.env.example` — committed, documents required variables for teammates.

### State & Architecture

- Global state as singletons in `src/lib/*.svelte.ts`, split by concern: `editor`, `session`, `questions`.
- State is handled at three levels: **URL** (routing), **global/component state** (SPA), **localStorage**.
- Learning progress persisted in localStorage.

### Repository layout (source conventions)

- **Routes:** `src/routes/**/+page.svelte` thin — import view from `lib/`; URL = folder (no `-page` suffix on route files).
- **Feature views:** `src/lib/components/<area>/` (`home`, `sessions`, `chat`, `editor`, `shell`, …) — domain copy, data, wiring.
- **Generic UI:** `src/lib/components/ui/` — domain-agnostic primitives on **shadcn-svelte**; install via `shadcn-svelte add` before hand-rolling (ADR-017); custom `ui/` only when composing shadcn or documented in `docs/decisions.md`.
- **Scrollbars:** hover-fade app-wide — default `ScrollArea` `type="hover"` (incl. modals); `--scaffy-scrollbar-*` in `scroll-area.css` + Monaco. No `type="always"` in product UI. See `.cursor/rules/scrollbars.mdc`.
- **Assets:** `src/lib/assets/` — static SVG/images; avoid Svelte wrappers unless dynamic/themed.
- **Unclear placement?** Ask before creating components (ADR-016, `component-layout.mdc`).
- **HTTP API:** `src/routes/api/<endpoint>/+server.ts` — one folder per surface (`scaffold` REST JSON, `chat` SSE).
- **Server-only library:** `src/lib/server/` — never imported from the client. Subfolders: `scaffold/`, `chat/`. Shared modules (e.g. `anthropic-client.ts`) at `server/` root until a `shared/` subfolder is warranted.

### Monaco + Svelte Integration

- Use `viewZones` for inline question components rendered between code lines.
- Use `overlayWidgets` as a fallback.
- Typewriter effect: `editor.executeEdits()` character by character with ~15 ms delay.

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
