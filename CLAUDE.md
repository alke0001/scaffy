## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, tailwindcss, sveltekit-adapter, mcp
- **MCP Servers (.cursor/mcp.json)**: svelte, vercel

## Agent Config Synchronization

- `CLAUDE.md` and `AGENTS.md` must stay semantically identical for project assumptions.
- Changes to one file require the same change in the other file in the same batch.

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
