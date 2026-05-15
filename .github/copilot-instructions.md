# Scaffy — GitHub Copilot Instructions

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
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
- Claude is used only through SvelteKit **`src/routes/api/<endpoint>/+server.ts`** handlers (today `scaffold`; **`chat` planned** with its own handler and `src/lib/server/chat/` assets such as system prompt).
- `ANTHROPIC_API_KEY` is injected server-side via `import { ANTHROPIC_API_KEY } from '$env/static/private'`.
- Client code calls only same-origin **`/api/...`** — never `api.anthropic.com` directly.

```
Browser → /api/<endpoint> (SvelteKit server route) → api.anthropic.com
```

#### No streaming — typewriter effect instead

- Claude API is called via **REST** (no streaming, no SSE).
- Streaming and structured JSON are incompatible; a partial JSON string cannot be parsed.
- The full JSON is returned at once; each scaffold’s `codeSnippet` is typed into Monaco via `editor.executeEdits()` at ~15 ms per character.

#### Model

- Always use `claude-sonnet-4-20250514`.

#### Environment variables

- `.env.local` — real key, never committed.
- `.env.example` — committed, documents required variables for teammates.

### State & Architecture

- Global state as singletons in `src/lib/*.svelte.ts`, split by concern: `editor`, `session`, `questions`.
- State is handled at three levels: **URL** (routing), **global/component state** (SPA), **localStorage**.
- Learning progress persisted in localStorage.

### Repository layout (source conventions)

- **Svelte UI:** `src/lib/components/<area>/` (`chat`, `editor`, …). Avoid new loose `*.svelte` at `src/lib/` root. When an area grows large, consider `src/lib/features/<name>/` instead of ever-deeper `components/`.
- **HTTP API:** `src/routes/api/<endpoint>/+server.ts` — one folder per surface (`scaffold` today; **`chat` planned** with its own handler and system prompt).
- **Server-only library:** `src/lib/server/` — never imported from the client. Subfolders per concern: `scaffold/` (schema, validation, system prompt); **planned `chat/`** for chat-specific prompts/schemas. Shared modules (e.g. `anthropic-client.ts`) at `server/` root until a `shared/` subfolder is warranted.

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
