# Projekt-Steckbrief — Scaffy

> _"Scaffy, the AI that teaches you to build code, not just builds for you."_

---

## Was tut die Anwendung?

**Scaffy** ist ein interaktiver KI-Coding-Lernassistent. Der User gibt einen natürlichsprachlichen Prompt ein (z. B. _„Generiere eine Svelte 5 Login-Komponente mit Passwort-Validierung (mindestens 8 Zeichen lang)"_), woraufhin Claude den vollständigen Code sowie framework-spezifische Lernfragen in einem strukturierten JSON-Response generiert. Scaffy präsentiert diesen Code dann im Monaco Editor bewusst durch **Scaffolding & Desirable Friction**: Der Code wird schrittweise freigeschaltet — blockiert durch eingebettete **Learning Cards**, die der User korrekt beantworten muss, bevor der nächste Chunk sichtbar wird.

**Hypothese:** Eine Erklärung im Nachgang zum bereits komplett generierten Code (Diff) — wie es klassisches Agentic Coding heute tut — wird von Novizen typischerweise übersprungen. Gleicher Effekt wie bei Geldautomaten. Wenn der User sein Ziel erreicht hat, vergisst er die Karte zu entnehmen, wenn diese nach dem Geld kommt. Daher wurde die Reihenfolge dort umgedreht: zuerst Karte, dann Geld. Gleiches Prinzip bei Scaffy — erzwungene Auseinandersetzung _während_ des Code-Aufbaus statt Erklärung danach.

---

## Technologiewahl

| Bereich       | Technologie                    | Begründung                                                  |
| ------------- | ------------------------------ | ----------------------------------------------------------- |
| Framework     | SvelteKit 5, SPA-Modus         | Kursinhalt; kein SSR/SSG nötig                              |
| Editor        | Monaco Editor (VS Code Basis)  | Code-Highlighting, viewZones für Learning Cards             |
| UI            | shadcn-svelte + Tailwind CSS 4 | Konsistentes Design-System                                  |
| KI-API        | Claude API (Anthropic)         | Structured JSON (Learn) + SSE-Stream (Ask + Intro)          |
| State         | Svelte 5 Runes + Singleton     | Global: `session.svelte.ts`; lokal: Monaco/Chat-Komponenten |
| Persistierung | localStorage                   | Session-Liste, Scaffold-Payloads, Metadaten                 |
| Hosting       | Vercel + GitHub                | Live-Deploy, CI via GitHub Actions                          |

---

## Pflicht-Checkliste

| Status       | Anforderung                                                   | Ist-Umsetzung in Scaffy                                                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ✅ umgesetzt | **≥5 eigene Komponenten** (davon ≥2 mehrfach verwendet)       | u. a. `ChatPanel`, `MonacoEditor`, `LearningCard`, `ChatMessage`, `SessionWorkspace`, `SessionsPage`, `StartLearningSession`, `SessionTabs`, `DeleteConfirmationDialog` — **mehrfach:** `ChatPanel` (Home + Session), `ChatMessage` (Chat-Liste), `LearningCard` (pro Scaffold)                                                      |
| ✅ umgesetzt | **Reactivity** — 1 User-Aktion → ≥2 UI-Bereiche aktualisieren | Svelte 5 **`$state` / `$derived`** + globaler Runes-Store `session.svelte.ts`. Beispiele: korrekte Antwort → Monaco nächster Chunk **und** Learning Card weg; `markSessionCompleted()` → Session-Tab + Editor read-only; Intro-SSE → Ask-Panel live. Fortschritt in der Card („Schritt X von Y“), keine separate `ProgressBar` nötig |
| ✅ umgesetzt | **Lokaler + globaler State** von ≥2 Routen gelesen            | Global: `session.svelte.ts` auf `/`, `/session/:id`, `/sessions`. Lokal: `currentIndex`/Card-UI in `monaco-editor.svelte`, Composer-Draft in `chat-panel.svelte`                                                                                                                                                                     |
| ✅ umgesetzt | **3 Routen** (≥2 substantiell unterschiedlich + 1× `:id`)     | `/` Home (Prompt starten) · `/session/:id` Workspace (Monaco + Ask + Learning Cards) · `/sessions` Übersicht (`/history` → 308 Redirect)                                                                                                                                                                                             |
| ✅ umgesetzt | **Externe API** — ≥1 Call mit User-Input                      | **3 Server-Routen:** `POST /api/scaffold` (REST + JSON-Schema), `POST /api/session-intro` (SSE), `POST /api/chat` (SSE) — alle mit User-Input. Details: `docs/architecture.md` §4                                                                                                                                                    |
| ⚠️ teilweise | **Formular** — ≥2 Validierungsregeln, davon ≥1 nicht-trivial  | Kein klassisches `<form>` (Use Case: Prompt-Chips + Chat). Validierung: Learn-Prompt `trim` + min. 10 Zeichen + Doppel-Submit-Guard; Ask-Composer analog; Server spiegelt Mindestlänge auf `/api/scaffold`                                                                                                                           |
| ✅ umgesetzt | **Loading- + Error-States** für API-Calls                     | Learn: In-Editor-Loading (Spinner + Typewriter-Kommentare) + Error mit Retry + Fallback-JSON. Ask/Intro: `loading` / `streaming` / `complete` / `error` in `ChatMessage`                                                                                                                                                             |
| ✅ umgesetzt | **Persistierung** (überlebt Reload)                           | **localStorage:** Session-Liste, Prompt, Scaffold-JSON, `completed`, active Tab-ID. **Singleton (SPA-Navigation):** Ask-Chat pro Session (`askMessages`). Offen für Phase 2: Schritt-Index nach Full Reload; Ask-Chat nach Full Reload (ADR-014)                                                                                     |

---

## Persistierung

localStorage + Svelte State Management + Routing/URL (Details: `docs/architecture.md` §6)

| Was wird gespeichert                                        | Wo                        | Status                    |
| ----------------------------------------------------------- | ------------------------- | ------------------------- |
| Session-Liste inkl. Scaffold-Payloads (Claude-Antwort)      | `localStorage`            | ✅ umgesetzt              |
| Session-ID (anonym, `crypto.randomUUID()`)                  | `localStorage`            | ✅ umgesetzt              |
| Aktive Tab-ID                                               | `localStorage`            | ✅ umgesetzt              |
| `completed`-Flag pro Session                                | `localStorage`            | ✅ umgesetzt              |
| In-Lektion-Fortschritt (welcher Chunk / beantwortete Cards) | —                         | ❌ nicht (noch)           |
| Ask-Chat-Verlauf (pro Session)                              | Singleton (`askMessages`) | ✅ Navigation · ❌ Reload |

---

## Add-ons (optional)

| Add-on                                                 | Status       | Umsetzung                                                                                                                                                                                                                                                            |
| ------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API-Unit-Tests (Vitest)**                            | ✅ umgesetzt | Vitest für `/api/scaffold`, `/api/chat`, `/api/session-intro` + `chat/utils.ts`; Anthropic gemockt. Quality Gates: `pnpm run verify` lokal, CI (Option B), Husky lint-staged bei staged API/Server-Dateien — ADR-010, README, `docs/architecture.md` §5              |
| **E2E-/Komponenten-Tests**                             | ❌           | Nicht im v1-Scope                                                                                                                                                                                                                                                    |
| **Lighthouse** Accessibility + Performance             | ✅ umgesetzt | [scaffy.vercel.app](https://scaffy.vercel.app/): `/` und `/sessions` Performance **100**; `/session/[id]` während Generierung **~83** (Monaco + parallele Loads — FCP 0,5 s, LCP 0,7 s, TBT 350 ms, CLS 0, SI 1,4 s). A11y Session ~96 (viewZone-Trade-off, ADR-011) |
| **Lazy Loading** mind. einer Route                     | ✅ umgesetzt | `/sessions`: leerer Zustand eager in `+page.svelte`; Listen-UI per `import()` nur wenn Sessions in `localStorage` existieren                                                                                                                                         |
| **Live-Deploy**                                        | ✅ umgesetzt | [scaffy.vercel.app](https://scaffy.vercel.app/) — Vercel Serverless für `/api/*`, GitHub Actions CI                                                                                                                                                                  |
| **Feature Flag: ScaffyCoding vs. NormalAgenticCoding** | ❌           | Nicht umgesetzt — siehe „Wissenschaftlicher Ausblick“                                                                                                                                                                                                                |
| **Dark Mode / Theme-Wahl**                             | ❌           | Dark Theme als Standard (shadcn); kein Light-Mode-Toggle                                                                                                                                                                                                             |
| **Offline-Fähigkeit** (Service Worker / PWA-Light)     | ❌           | Ohne Claude API nicht sinnvoll nutzbar                                                                                                                                                                                                                               |

---

## Scaffy-spezifische Stärken (über Pflicht hinaus)

_Über die Pflichtanforderungen hinaus — alles umgesetzt:_

| Status | Stärke                         | Umsetzung                                                                                                                                                                                                                                                                              |
| ------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | **i18n DE/EN**                 | `src/lib/i18n`, `check:i18n` in CI (ADR-020)                                                                                                                                                                                                                                           |
| ✅     | **Monaco-Integration**         | viewZones mit Svelte-Mount (`KnowledgeViewZoneController`); Third-Party-JS in Learn-Loop                                                                                                                                                                                               |
| ✅     | **Motion / UX / Chat-Feeling** | Custom-Frontend (kein simples B2C): ScrollArea hover-fade, Modals, Session-Pills, Learning Card (ADR-017); **Ask-Chat** Markdown während SSE (`ChatMarkdown`, `marked` + DOMPurify); Loading-Spinner + Typewriter-Kommentare; rotierende Loading-Verbs (CSS + TS in `translations.ts`) |
| ✅     | **Architektur-Dokumentation**  | ABB/SSB, API-Sequenzdiagramme, Key + Further decisions in `docs/decisions.md`                                                                                                                                                                                                          |
| ✅     | **Drei Transport-Modelle**     | REST structured JSON (Learn) + zwei SSE-Streams (Ask + Intro) hinter einem Server-Proxy                                                                                                                                                                                                |
| ✅     | **Serverseitige Sicherheit**   | API-Key nur in `$env/static/private`; DOMPurify für KI-Markdown                                                                                                                                                                                                                        |
| ✅     | **Parallele Lade-UX**          | Scaffold REST + Intro-SSE parallel; Lesson-Start-Gate (ADR-021)                                                                                                                                                                                                                        |
| ✅     | **Developer Experience**       | TypeScript, `svelte-check`, **ESLint**, **Prettier**, Vitest (`pnpm run verify`), Husky/lint-staged, GitHub Actions CI, Agent-Config-Sync (`CLAUDE.md`, Cursor, Copilot)                                                                                                               |
| ✅     | **Resizable Workspace**        | paneforge Editor/Chat-Split                                                                                                                                                                                                                                                            |
| ✅     | **WCAG-Kontrast-Pass**         | Design-Tokens, dokumentiert in ADR/Changelog                                                                                                                                                                                                                                           |
| ✅     | **Lighthouse unter Last**      | Home/Sessions 100; Session ~83 bei Monaco + Generierung erklärbar (siehe Add-ons)                                                                                                                                                                                                      |

---

## Technische Komplexität & Challenges im Projekt

Scaffy geht in drei Bereichen deutlich über eine einfache Svelte SPA mit REST-Anbindung hinaus:

### 1. Claude API — System Prompt, Temperature & Structured Outputs

Die Claude API wird nicht wie eine einfache Film- oder Wetter-REST-API konsumiert. Die Herausforderung liegt in der **kontrollierten, konsistenten Ausgabequalität**:

- **System Prompt:** Code in didaktische Chunks _und_ passende Learning Cards in einem API-Call (`system-prompt.md`).
- **Temperature:** Learn ~0.3, Ask ~0.55.
- **Structured Outputs** (`output_config.format: json_schema`) für Learn; serverseitige Validierung + ein Retry bei Fehlern.

### 2. Monaco Editor — JavaScript-Integration & State-Verdrahtung

- Lifecycle außerhalb Svelte (create/destroy/resize).
- **viewZones** für Svelte-Learning-Cards zwischen Codezeilen.
- Globaler Session-Store + lokaler Schritt-Index in der Editor-Komponente.

### 3. Chat-Fenster — Ask-Modus (Socratic Tutor)

- Eigene Komponenten (`ChatPanel`, `ChatMessage`, SSE-Stream).
- Ask-Verlauf pro Session im **Singleton** (`askMessages`) — bleibt bei Navigation, nicht in `localStorage`.

---

## Wissenschaftlicher Ausblick

Das Feature-Flag-Design (Friction vs. Agentic Mode) ist **geplant, nicht implementiert** — legt aber die Grundlage für eine mögliche HCAI-Studie:

> A/B — Scaffolding mit Friction vs. klassisches Agentic Coding — zur empirischen Auswertung der Lerneffektivität (_Friction & Scaffolding als UX-Patterns in KI-gestützter Lernsoftware_).

---

## Abgabe-Stand

**API-Unit-Tests:** ✅ umgesetzt — Vitest für die drei API-Routen plus `chat/utils.ts`; Details unter Add-ons und `docs/architecture.md` §5 Testing.
