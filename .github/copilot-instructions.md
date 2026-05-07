# Scaffy — GitHub Copilot Instructions

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Framework**: SvelteKit 5, SPA mode (no SSR/SSG)
- **Add-ons**: prettier, eslint, tailwindcss, shadcn-svelte
- **Deployment**: Vercel

## Agent Config Synchronization

These three files must stay semantically identical in their shared project assumptions (stack, conventions, design decisions):

| Agent | Config file |
|---|---|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursor/rules/` + `.cursor/mcp.json` |
| GitHub Copilot | `.github/copilot-instructions.md` |

- Changes to project configuration or design decisions must be applied to all three in the same edit batch.

---

## App Vision
- **Name:** Scaffy — *"AI that teaches you to build good code, not just builds for you."*
- **Core concept:** Scaffolding + Friction — AI generates code step by step; targeted questions block the next chunk until the user answers correctly.

## Scaffy — Software Design Decisions

### Tech Stack
- SvelteKit 5, SPA mode (no SSR/SSG)
- Monaco Editor (VS Code engine)
- shadcn-svelte + dark theme
- Claude API (structured JSON + code)
- GitHub + Vercel

### Claude API — Core Flow
- User submits a prompt (e.g. *"Generate a Svelte 5 login dialog component with password validation"*)
- Claude returns the full response as **structured JSON** — all code chunks and learning questions in one shot (no streaming)
- Each chunk is revealed via a **typewriter effect** in Monaco (`editor.executeEdits()`, ~15 ms per character)
- A framework-specific question appears as a Monaco `viewZone` between code lines before the next chunk renders
- The next chunk is only revealed after the user answers correctly

### Claude API — Architecture

#### No direct browser API calls
- The API key must **never** appear in the client bundle — it would be visible in the browser network tab.
- All Claude API calls go through the SvelteKit server route `src/routes/api/generate/+server.ts`.
- `ANTHROPIC_API_KEY` is injected server-side via `import { ANTHROPIC_API_KEY } from '$env/static/private'`.
- Client code calls only `/api/generate` — never `api.anthropic.com` directly.

```
Browser → /api/generate (SvelteKit server route) → api.anthropic.com
```

#### No streaming — typewriter effect instead
- Claude API is called via **REST** (no streaming, no SSE).
- Streaming and structured JSON are incompatible; a partial JSON string cannot be parsed.
- The full JSON is returned at once; chunks are typed into Monaco via `editor.executeEdits()` at ~15 ms per character.

#### Model
- Always use `claude-sonnet-4-20250514`.

#### Environment variables
- `.env.local` — real key, never committed.
- `.env.example` — committed, documents required variables for teammates.

### State & Architecture
- Global state as singletons in `src/lib/*.svelte.ts`, split by concern: `editor`, `session`, `questions`.
- State is handled at three levels: **URL** (routing), **global/component state** (SPA), **localStorage**.
- Learning progress persisted in localStorage.

### Monaco + Svelte Integration
- Use `viewZones` for inline question components rendered between code lines.
- Use `overlayWidgets` as a fallback.
- Typewriter effect: `editor.executeEdits()` character by character with ~15 ms delay.

### SPA Mode
- This is a pure SPA — do not add SSR data loading (`+page.server.ts` load functions) outside of the `/api/` route directory.
- The only server-side code lives in `src/routes/api/`.

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
