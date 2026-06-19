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
| KI-API        | Claude API (Anthropic)         | Structured JSON (Learn) + SSE-Stream (Ask)                  |
| State         | Svelte 5 Runes + Singleton     | Global: `session.svelte.ts`; lokal: Monaco/Chat-Komponenten |
| Persistierung | localStorage                   | Session-Liste, Scaffold-Payloads, Metadaten                 |
| Hosting       | Vercel + GitHub                | Live-Deploy, CI via GitHub Actions                          |

---

## Pflicht-Checkliste

| Status       | Anforderung                                                   | Ist-Umsetzung in Scaffy                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ umgesetzt | **≥5 eigene Komponenten** (davon ≥2 mehrfach verwendet)       | u. a. `ChatPanel`, `MonacoEditor`, `LearningCard`, `ChatMessage`, `SessionTabs`, `SessionsPage`, `SessionWorkspace`, `StartLearningSession`, `DeleteConfirmationDialog` — **mehrfach:** `ChatPanel` (Home + Session), `ChatMessage` (Chat-Liste), `LearningCard` (pro Scaffold) |
| ⚠️ teilweise | **Reactivity** — 1 User-Aktion → ≥2 UI-Bereiche aktualisieren | Korrekte Antwort → Monaco zeigt nächsten Chunk **und** Learning Card verschwindet; Session-Tab/`completed` bei Lektionsende. **Offen:** dedizierte `ProgressBar` (nur „chunk X of Y“ in der Card)                                                                               |
| ✅ umgesetzt | **Lokaler + globaler State** von ≥2 Routen gelesen            | Global: `session.svelte.ts` auf `/`, `/session/:id`, `/sessions`. Lokal: `currentIndex`/Card-UI in `monaco-editor.svelte`, Ask-Messages in `chat-panel.svelte`                                                                                                                  |
| ✅ umgesetzt | **3 Routen** (≥2 substantiell unterschiedlich + 1× `:id`)     | `/` Home · `/session/:id` Workspace (Monaco + Ask + Learning Cards) · `/sessions` Übersicht (`/history` → 308 Redirect)                                                                                                                                                         |
| ✅ umgesetzt | **Externe API** — ≥1 Call mit User-Input                      | Learn: `POST /api/scaffold` (Structured JSON, `temperature: 0.3`, JSON-Schema). Ask: `POST /api/chat` (SSE, User-Prompt + History). Beide mit User-Input                                                                                                                        |
| ✅ umgesetzt | **Formular** — ≥2 Validierungsregeln, davon ≥1 nicht-trivial  | Learn-Prompt: (1) nicht leer (`trim`), (2) Mindestlänge 10 Zeichen, (3) Submit blockiert während `isStarting` (Doppel-Submit-Schutz). Server spiegelt Mindestlänge auf `/api/scaffold`                                                                                          |
| ✅ umgesetzt | **Loading- + Error-States** für API-Calls                     | Learn: In-Editor-Loading (Spinner + Typewriter-Text) + Error mit Retry + Fallback-JSON. Ask: `loading` / `streaming` / `complete` / `error` in `ChatMessage`                                                                                                                    |
| ⚠️ teilweise | **Persistierung** (überlebt Reload)                           | **Ja:** Session-Liste, Prompt, Scaffold-JSON von Claude, `completed`, aktive Tab-ID (`crypto.randomUUID()`). **Nein:** Schritt-Index in der Lektion (`currentIndex`) und Ask-Chat-Verlauf — nach Reload startet die Lektion wieder bei Scaffold 1                               |

---

## Persistierung

localStorage + Svelte State Management + Routing/URL (Details: `docs/architecture.md` §6)

| Was wird gespeichert                                        | Wo             | Status                 |
| ----------------------------------------------------------- | -------------- | ---------------------- |
| Session-Liste inkl. Scaffold-Payloads (Claude-Antwort)      | `localStorage` | ✅ umgesetzt           |
| Session-ID (anonym, `crypto.randomUUID()`)                  | `localStorage` | ✅ umgesetzt           |
| Aktive Tab-ID                                               | `localStorage` | ✅ umgesetzt           |
| `completed`-Flag pro Session                                | `localStorage` | ✅ umgesetzt           |
| In-Lektion-Fortschritt (welcher Chunk / beantwortete Cards) | —              | ❌ nicht (noch)        |
| Ask-Chat-Verlauf                                            | —              | ❌ bewusst weggelassen |

---

## Add-ons (optional)

| Add-on                                                 | Status             | Umsetzung                                                                                                   |
| ------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Live-Deploy**                                        | ✅ umgesetzt       | [scaffy.vercel.app](https://scaffy.vercel.app/), GitHub → Vercel, CI via `.github/workflows/ci.yml`         |
| **Lazy Loading** mind. einer Route                     | ✅ umgesetzt       | `/sessions`: leerer Zustand inline in `+page.svelte`; Listen-UI per `import()` nur wenn Sessions existieren |
| **Feature Flag: ScaffyCoding vs. NormalAgenticCoding** | ❌ nicht umgesetzt | Geplant (`SCAFFY_MODE`); nur Scaffy-Modus shipped — siehe „Wissenschaftlicher Ausblick“                     |
| **Dark Mode / Theme-Wahl**                             | ⚠️ teilweise       | Dark Theme als Standard (shadcn); kein Light-Mode-Toggle                                                    |
| **Offline-Fähigkeit** (Service Worker / PWA-Light)     | ❌ nicht geplant   | Ohne Claude API nicht sinnvoll nutzbar                                                                      |

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
- **Nicht** in localStorage persistiert (bewusst); unterstützt die laufende Lektion, ersetzt nicht den Learn-Gate.

---

## Wissenschaftlicher Ausblick

Das Feature-Flag-Design (Friction vs. Agentic Mode) ist **geplant, nicht implementiert** — legt aber die Grundlage für eine mögliche HCAI-Studie:

> A/B — Scaffolding mit Friction vs. klassisches Agentic Coding — zur empirischen Auswertung der Lerneffektivität (_Friction & Scaffolding als UX-Patterns in KI-gestützter Lernsoftware_).
