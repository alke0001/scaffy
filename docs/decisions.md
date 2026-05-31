# Scaffy — Architecture & Design Decisions

This document records **why** Scaffy is built the way it is. It complements [`CLAUDE.md`](../CLAUDE.md), which holds short, agent-facing invariants synced to Cursor and GitHub Copilot.

| Audience  | Use                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Humans    | Full context, alternatives, and status                                                                      |
| AI agents | Read relevant sections when changing chat, API, or state; keep `CLAUDE.md` in sync only for top-level rules |

**How to maintain:** When a decision changes, update the entry here (status, consequences). If agents must always obey it, add or adjust a short bullet in `CLAUDE.md` and sync `.cursor/rules/design-decisions.mdc` + `.github/copilot-instructions.md` in the same edit batch.

---

## Index

| ID                                                              | Title                                          | Status                     |
| --------------------------------------------------------------- | ---------------------------------------------- | -------------------------- |
| [ADR-001](#adr-001-product-vision-scaffolding--friction)        | Product vision: scaffolding + friction         | Accepted                   |
| [ADR-002](#adr-002-spa-sveltekit-5-no-ssr-for-app-shell)        | SPA: SvelteKit 5, no SSR for app shell         | Accepted                   |
| [ADR-003](#adr-003-claude-only-via-server-api-routes)           | Claude only via server API routes              | Accepted                   |
| [ADR-004](#adr-004-separate-api-endpoints-for-learn-and-ask)    | Separate API endpoints for Learn and Ask       | Accepted                   |
| [ADR-005](#adr-005-learn-scaffold-rest--structured-json)        | Learn: REST + structured JSON                  | Accepted                   |
| [ADR-006](#adr-006-ask-chat-sse-streaming)                      | Ask: chat SSE streaming                        | Accepted                   |
| [ADR-007](#adr-007-chatpanel-dual-mode-and-state-ownership)     | ChatPanel dual mode and state ownership        | Accepted                   |
| [ADR-008](#adr-008-chat-message-lifecycle-statuses)             | Chat message lifecycle statuses                | Accepted                   |
| [ADR-009](#adr-009-session-store-for-scaffolds-monaco-later)    | Session store for scaffolds (Monaco later)     | Accepted                   |
| [ADR-010](#adr-010-repository-layout-and-typescript)            | Repository layout and TypeScript               | Accepted                   |
| [ADR-011](#adr-011-monaco-typewriter-and-viewzones-planned)     | Monaco typewriter and viewZones (planned)      | Accepted (not implemented) |
| [ADR-012](#adr-012-ask-markdown-rendering-during-stream)        | Ask markdown rendering during stream           | Proposed                   |
| [ADR-013](#adr-013-documentation-split-claudemd-vs-decisionsmd) | Documentation split: CLAUDE.md vs decisions.md | Accepted                   |

---

## ADR-001: Product vision — scaffolding + friction

**Status:** Accepted

### Context

Generic AI coding tools optimize for speed and full-file output. Scaffy targets **learning**: users should understand what they ship.

### Decision

- **Scaffolding:** Code is delivered in ordered steps (`scaffolds`), not one opaque blob.
- **Friction:** A knowledge check gates the next step until the user answers correctly (or acknowledges an explainer).
- **Punchline:** _"AI that teaches you to build good code, not just builds for you."_

### Consequences

- API and UI must support step index, questions, and progress (partially built; see ADR-009, ADR-011).
- Ask mode is a separate, low-friction tutor path (ADR-004), not a replacement for Learn.

---

## ADR-002: SPA — SvelteKit 5, no SSR for app shell

**Status:** Accepted

### Context

The session UI is highly interactive (Monaco, chat, resizable panes). SEO for the learning shell is not a priority.

### Decision

- SvelteKit 5 in **SPA mode** (no SSR/SSG for app pages).
- **Exception:** `src/routes/api/**` server routes run on the server for Claude proxying.
- Do not add `+page.server.ts` load functions for app routes outside `/api/`.

### Alternatives considered

- SSR for first paint — rejected; added complexity without clear benefit for v1.

### Consequences

- All learning UI state is client-side or via `fetch` to `/api/...`.
- Deployment fits Vercel adapter patterns already in the repo.

---

## ADR-003: Claude only via server API routes

**Status:** Accepted

### Context

`ANTHROPIC_API_KEY` in the browser bundle or network tab would expose the key to anyone.

### Decision

```
Browser → POST /api/<endpoint> (SvelteKit) → api.anthropic.com
```

- Key via `import { ANTHROPIC_API_KEY } from '$env/static/private'`.
- `.env.local` for local dev; `.env.example` committed as template.
- Client never calls `api.anthropic.com`.

### Consequences

- Every new Claude capability gets its own thin `+server.ts` (or shared server helper), not client SDK usage.

---

## ADR-004: Separate API endpoints for Learn and Ask

**Status:** Accepted

### Context

Learn and Ask need different system prompts, output shapes, temperatures, and transport.

### Decision

| Mode           | Route                | Transport | Output                                 |
| -------------- | -------------------- | --------- | -------------------------------------- |
| **Learn Code** | `POST /api/scaffold` | REST      | Structured JSON `{ scaffolds: [...] }` |
| **Ask**        | `POST /api/chat`     | SSE       | Plain text stream                      |

- Server assets: `src/lib/server/scaffold/` vs `src/lib/server/chat/`.
- Shared: `src/lib/server/anthropic-client.ts` (`@anthropic-ai/sdk`).

### Alternatives considered

- Single `/api/claude` with a `mode` flag — rejected; mixes unrelated config and is harder to test and tune.

### Consequences

- Two handlers to maintain; each can evolve independently (caching TTL, token limits, prompts).

---

## ADR-005: Learn — scaffold REST + structured JSON

**Status:** Accepted

### Context

Scaffy needs a fixed shape: `codeSnippet` + `knowledgeCheck` per step, validated server-side.

### Decision

- `client.messages.create` with `output_config.format.type: 'json_schema'` and schema from `output.schema.json` / `output-schema.ts`.
- **No API streaming** for scaffold: partial JSON is not reliably parseable.
- **Temperature ~0.3**, high `max_tokens` (8192) — tuned in `src/routes/api/scaffold/+server.ts`.
- Post-parse validation in `validateStructuredOutput()` (1–5 scaffolds, option ids, etc.).
- **Prompt rules:** min 10 characters; heuristic reject `<`, `{`, `;` to discourage pasting code snippets into Learn prompts.

### Consequences

- Perceived “streaming” for code is **client-side** only: Monaco typewriter (~15 ms/char) after the full response arrives (ADR-011).
- Learn chat UI does not show the raw JSON; scaffolds go to the session store (ADR-009).

---

## ADR-006: Ask — chat SSE streaming

**Status:** Accepted

### Context

Ask is free-form Q&A; users expect token-by-token replies like other chat products.

### Decision

- `client.messages.stream()` in `src/routes/api/chat/+server.ts`.
- Proxy emits **SSE** (`text/event-stream`): events `ready`, `text` (delta), `done`, `error`.
- **Temperature ~0.7**, `max_tokens` 2048.
- **No** structured output schema; plain text tutor system prompt in `src/lib/server/chat/system-prompt.md`.
- **Prompt rules:** min 10 characters; **no** `<`/`{`/`;` heuristic (code questions allowed).
- Client: `src/lib/api/chat-stream.ts` appends deltas; `request.signal` / `AbortController` for cancel.

### Alternatives considered

- **Vercel AI SDK** — rejected for v1; extra dependency, React-centric; `@anthropic-ai/sdk` already present.
- REST `json({ reply })` — rejected; worse UX for long answers.

### Consequences

- ChatPanel must handle `loading` → `streaming` → `complete` (ADR-008).
- Markdown from Claude is currently shown as plain text (ADR-012).

---

## ADR-007: ChatPanel dual mode and state ownership

**Status:** Accepted

### Context

The session view needs a prompt/response loop beside Monaco without tight coupling.

### Decision

- **`ChatPanel.svelte`** owns **local** chat UI state: `learnMessages`, `askMessages`, mode toggle (`learn` | `ask`), prompt input.
- **Learn** calls `/api/scaffold`; on success writes scaffolds via **`session.svelte.ts`**, not into chat bubbles.
- **Ask** calls `/api/chat` stream; assistant text stays in `askMessages`.
- **Separate histories** per mode when switching toggle.
- **Learn success UX:** user message + loading placeholder; on success **remove** assistant placeholder (no success assistant bubble).
- **Learn error UX:** assistant placeholder becomes `error` with message.
- Communication with Monaco is **only** through the session store (and future `editor` / `questions` stores), not props between panes.

### Consequences

- `+page.svelte` only lays out Monaco + `ChatPanel`; no shared props between them yet.
- Replacing the old API smoke-test panel (`claude-chat-panel.svelte`) was intentional.

---

## ADR-008: Chat message lifecycle statuses

**Status:** Accepted

### Context

Chat UIs need visible pending/loading/streaming/error states; the same model should extend to retries/cancel later.

### Decision

Types in `src/lib/types/chat-message.ts`:

| Status      | Meaning                                |
| ----------- | -------------------------------------- |
| `pending`   | Optimistic / sending (optional, short) |
| `loading`   | Request started, no content yet        |
| `streaming` | Ask: tokens arriving                   |
| `complete`  | Success, settled                       |
| `error`     | Failed; optional partial `content`     |

- `isThreadBusy()` disables send while any message is `pending` | `loading` | `streaming`.
- Ask history for the API: only `complete` user/assistant messages (`toChatHistory()`).
- UI: `chat-message.svelte` + `chat-message-list.svelte` (auto-scroll, `aria-live="polite"`).

### Consequences

- New features (retry, cancelled) should extend `ChatMessageStatus`, not ad-hoc booleans.

---

## ADR-009: Session store for scaffolds (Monaco later)

**Status:** Accepted (partial implementation)

### Context

Learn responses are not chat content; Monaco and question UI need a shared scaffold list.

### Decision

- `src/lib/session.svelte.ts`: `status` (`idle` | `loading` | `ready` | `error`), `scaffolds`, `errorMessage`.
- `startScaffoldRequest()` clears scaffolds and sets `loading`.
- Client-safe types in `src/lib/types/scaffold.ts`; server `output-schema.ts` imports them.

### Not yet implemented (planned)

- `editor.svelte.ts`, `questions.svelte.ts`, step index, localStorage progress, `/session/:id` routes.

### Consequences

- Do not import `$lib/server/*` from client components; share types via `$lib/types/`.

---

## ADR-010: Repository layout and TypeScript

**Status:** Accepted

### Context

The codebase will grow (Monaco, questions, more API surfaces). Conventions reduce navigation cost.

### Decision

- **UI:** `src/lib/components/<area>/` (`chat`, `editor`, …); promote to `src/lib/features/<name>` if an area grows large.
- **API routes:** `src/routes/api/<endpoint>/+server.ts` — one folder per HTTP surface.
- **Server-only:** `src/lib/server/<endpoint>/` + shared `anthropic-client.ts`.
- **All application code:** TypeScript; Svelte `<script lang="ts">`; no new `.js` under `src/`.
- **README / code comments:** American English; chat with users may be German.

### Models (implementation note)

Code uses logical IDs `claude-sonnet-4-5` | `claude-sonnet-4-6` mapped in `anthropic-client.ts`. Older docs mentioning `claude-sonnet-4-20250514` are stale relative to the repo.

---

## ADR-011: Monaco typewriter and viewZones (planned)

**Status:** Accepted — **not implemented**

### Context

Learn mode should feel like live typing without API streaming of JSON.

### Decision (target)

- Integrate `monaco-editor` in place of the placeholder.
- Reveal each `codeSnippet` with `editor.executeEdits()` ~15 ms per character.
- Show `knowledgeCheck` in a **viewZone** (or overlay widget) between code lines.
- Unlock next scaffold only after a correct answer ( `questions` store).

### Current state

- `monaco-editor-placeholder.svelte` only; package not wired in the learning loop.

---

## ADR-012: Ask markdown rendering during stream

**Status:** Proposed

### Context

Claude Ask replies are often Markdown (`**bold**`, fenced code). `chat-message.svelte` renders plain `whitespace-pre-wrap` text.

### Decision (recommended when implemented)

Align with common NLIs (ChatGPT, Claude.ai): **stream plain text with cursor**, parse Markdown on a **throttled** schedule (e.g. `requestAnimationFrame` or 50–100 ms), not on every token.

| Approach             | Streaming feel        | Performance | Markdown during stream        |
| -------------------- | --------------------- | ----------- | ----------------------------- |
| Complete-only        | Yes (plain until end) | Best        | No — jump at end              |
| Throttled live parse | Yes                   | Good        | Yes, with minor fence flicker |
| Parse every token    | Yes                   | Poor        | Yes, unstable                 |

- Render Markdown only for **assistant** messages in **Ask** mode.
- Sanitize HTML (`marked` + DOMPurify or AST-to-components); never unsanitized `{@html}`.
- Style with Tailwind Typography (`prose prose-sm dark:prose-invert`).
- Optional: syntax highlight code blocks on `complete` (Shiki).

### Alternatives considered

- Complete-only — acceptable MVP, less like mainstream chat UIs.

### Consequences

- Requires new dependency(s) and `ChatMarkdown.svelte` (or equivalent).
- Document supersession here when status moves to Accepted.

---

## ADR-013: Documentation split — CLAUDE.md vs decisions.md

**Status:** Accepted

### Context

Agent config files must stay small and synced across three tools; detailed rationale does not belong triple-copied.

### Decision

| Layer            | Location                                                                             | Content                                     |
| ---------------- | ------------------------------------------------------------------------------------ | ------------------------------------------- |
| Agent invariants | `CLAUDE.md`, `.cursor/rules/design-decisions.mdc`, `.github/copilot-instructions.md` | Stable rules agents must follow             |
| Decision log     | **`docs/decisions.md`** (this file)                                                  | Context, alternatives, status, consequences |
| Product brief    | `Projektsteckbrief_Scaffy.md`                                                        | German stakeholder view                     |
| Operational      | `docs/*.md` (e.g. test prompts)                                                      | Runbooks, fixtures                          |

- New architectural choices: add or update a section here; add a **one-line pointer** in `CLAUDE.md` only when agents need to know the rule exists.

### Consequences

- Reduces drift between “essay in three agent files” vs “undocumented code comment.”

---

## Planned / nice-to-have (not ADRs yet)

- Authentication
- A/B test: scaffolding + friction vs classic agentic coding
- Analytics (e.g. Tinybird)
- Routes: `/` prompt home, `/session/:id`, `/history` with localStorage

---

## Changelog

| Date       | Change                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-31 | Initial `docs/decisions.md` — documents decisions through ChatPanel, dual API, SSE Ask, session store, and proposed markdown rendering. |
