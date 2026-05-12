# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.15.1 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:none" sveltekit-adapter="adapter:vercel" mcp="ide:claude-code,cursor,vscode+setup:remote" --install npm .
```

## Claude API (local)

The API key lives **only** on the server in `.env.local` (ignored by Git). Use `.env.example` in the repo as a template.

1. Copy the template: `cp .env.example .env.local` (Windows PowerShell: `Copy-Item .env.example .env.local`)
2. In `.env.local`, replace the placeholder `<<< PASTE YOUR REAL KEY HERE >>>` with your key from [console.anthropic.com](https://console.anthropic.com/).
3. Optional: set `ANTHROPIC_DEFAULT_MODEL` to `claude-sonnet-4-5` or `claude-sonnet-4-6` (only these models are allowed).
4. Restart the dev server: `npm run dev`

**Endpoint:** `POST /api/generate` with JSON body `{ "prompt": string, "model"?: string }`. On success: `{ "chunks": [...] }`. Errors use HTTP status codes (e.g. 400, 401, 429, 502); the response body never includes the API key.

## Vercel (deployments)

Set the same variables on your Vercel project so serverless functions can access the key:

**Dashboard:** Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY` for Production, Preview, and optionally Development. Optionally add `ANTHROPIC_DEFAULT_MODEL` (`claude-sonnet-4-5` or `claude-sonnet-4-6`).

**CLI** (after `npm i -g vercel` and `vercel link` in the repo):

```sh
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel env add ANTHROPIC_DEFAULT_MODEL production
```

`vercel env pull .env.local` downloads linked variables into `.env.local` and **overwrites** that file—use it only when you intentionally want to sync values.

## Claude API (local)

The API key lives **only** on the server in `.env.local` (ignored by Git). Use `.env.example` in the repo as a template.

1. Copy the template: `cp .env.example .env.local` (Windows PowerShell: `Copy-Item .env.example .env.local`)
2. In `.env.local`, replace the placeholder `<<< PASTE YOUR REAL KEY HERE >>>` with your key from [console.anthropic.com](https://console.anthropic.com/).
3. Optional: set `ANTHROPIC_DEFAULT_MODEL` to `claude-sonnet-4-5` or `claude-sonnet-4-6` (only these models are allowed).
4. Restart the dev server: `npm run dev`

**Endpoint:** `POST /api/generate` with JSON body `{ "prompt": string, "model"?: string }`. On success: `{ "chunks": [...] }`. Errors use HTTP status codes (e.g. 400, 401, 429, 502); the response body never includes the API key.

## Vercel (deployments)

Set the same variables on your Vercel project so serverless functions can access the key:

**Dashboard:** Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY` for Production, Preview, and optionally Development. Optionally add `ANTHROPIC_DEFAULT_MODEL` (`claude-sonnet-4-5` or `claude-sonnet-4-6`).

**CLI** (after `npm i -g vercel` and `vercel link` in the repo):

```sh
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel env add ANTHROPIC_DEFAULT_MODEL production
```

`vercel env pull .env.local` downloads linked variables into `.env.local` and **overwrites** that file—use it only when you intentionally want to sync values.

## Agentic Coding

This project is configured for AI agent-assisted development with three tools:

| Tool                                                  | Config                               |
| ----------------------------------------------------- | ------------------------------------ |
| [Claude Code](https://claude.ai/code)                 | `CLAUDE.md`, `.cursor/mcp.json`      |
| [Cursor](https://cursor.com)                          | `.cursor/rules/`, `.cursor/mcp.json` |
| [GitHub Copilot](https://github.com/features/copilot) | `.github/copilot-instructions.md`    |

All three agents share the same design decisions and coding conventions defined in `CLAUDE.md`.

## Claude API (local)

The API key lives **only** on the server in `.env.local` (ignored by Git). Use `.env.example` in the repo as a template.

1. Copy the template: `cp .env.example .env.local` (Windows PowerShell: `Copy-Item .env.example .env.local`)
2. In `.env.local`, replace the placeholder `<<< PASTE YOUR REAL KEY HERE >>>` with your key from [console.anthropic.com](https://console.anthropic.com/).
3. Optional: set `ANTHROPIC_DEFAULT_MODEL` to `claude-sonnet-4-5` or `claude-sonnet-4-6` (only these models are allowed).
4. Restart the dev server: `npm run dev`

**Endpoint:** `POST /api/generate` with JSON body `{ "prompt": string, "model"?: string }`. On success: `{ "chunks": [...] }`. Errors use HTTP status codes (e.g. 400, 401, 429, 502); the response body never includes the API key.

## Vercel (deployments)

Set the same variables on your Vercel project so serverless functions can access the key:

**Dashboard:** Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY` for Production, Preview, and optionally Development. Optionally add `ANTHROPIC_DEFAULT_MODEL` (`claude-sonnet-4-5` or `claude-sonnet-4-6`).

**CLI** (after `npm i -g vercel` and `vercel link` in the repo):

```sh
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel env add ANTHROPIC_DEFAULT_MODEL production
```

`vercel env pull .env.local` downloads linked variables into `.env.local` and **overwrites** that file—use it only when you intentionally want to sync values.
## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
