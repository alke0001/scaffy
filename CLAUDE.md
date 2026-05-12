## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
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
- A SvelteKit **server route** (`src/routes/api/generate/+server.ts`) acts as a proxy
- Key is stored as an environment variable in Vercel (`ANTHROPIC_API_KEY`)
- Client calls only `/api/generate` — never `api.anthropic.com` directly

```
Browser → /api/generate (SvelteKit server route) → api.anthropic.com
```

#### No streaming — typewriter effect instead

- Claude API is called via **REST** (no streaming)
- Streaming and structured JSON are incompatible: a partial JSON string cannot be parsed
- The full JSON is returned at once; each scaffold’s `codeSnippet` is typed into Monaco with a typewriter effect
- Visually identical to real token streaming (like Claude Code CLI), but simpler to implement

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

- `claude-sonnet-4-20250514` — same model as Claude Code CLI

### State & Architecture

- Global state as singletons in `src/lib/*.svelte.ts` (split by concern: editor / session / questions)
- State is handled at three levels: **URL** (routing), **global/component state** (SPA), **localStorage**
- Learning progress persisted in localStorage

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
