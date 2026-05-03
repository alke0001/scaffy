# Projekt-Steckbrief — Scaffy

> *"Scaffy, the AI that teaches you to build code, not just builds for you."*

------

## Beteiligte Personen

| Name                                    |
| --------------------------------------- |
| *Alexander Keller – Matrkl.Nr.: 858114* |
| *Dennis Kallmayer - Matrkl.Nr.: 886110* |

------

## Was tut die Anwendung?

**Scaffy** ist ein interaktiver KI-Coding-Lernassistent. Der User gibt einen natürlichsprachlichen Prompt ein (z. B. *„Generiere eine Svelte 5 Login-Komponente mit Passwort-Validierung (mindestens 8 Zeichen lang)"*), woraufhin Claude den vollständigen Code sowie framework-spezifische Lernfragen in einem strukturierten JSON-Response generiert. Scaffy präsentiert diesen Code dann im Monaco Editor bewusst durch **Scaffolding & Desirable Friction**: Der Code wird schrittweise freigeschaltet — blockiert durch eingebettete Frage-Antwort-Komponenten, die der User korrekt beantworten muss, bevor der nächste Chunk sichtbar wird.

**Hypothese:** Eine Erklärung im Nachgang zum bereits komplett generierten Code (Diff) — wie es klassisches Agentic Coding heute tut — wird von Novizen typischerweise übersprungen. Gleicher Effekt wie bei Geldautomaten. Wenn der User sein Ziel erreicht hat, also Geld erhalten hat, vergisst er die Karte zu entnehmen, wenn diese nach dem Geld aus dem Automaten kommt. Daher wurde die Reihenfolge dort umgedreht, zuerst Karte, dann Geld (User Ziel). Gleiches planen wir mit Scaffy. Durch die erzwungene Auseinandersetzung *während* des Code-Aufbaus internalisieren Lernende die relevanten Konzepte nachhaltiger.

------

## Technologiewahl

| Bereich       | Technologie                     | Begründung                                                   |
| ------------- | ------------------------------- | ------------------------------------------------------------ |
| Framework     | SvelteKit 5, SPA-Modus          | Kursinhalt; kein SSR/SSG nötig                               |
| Editor        | Monaco Editor (VS Code Basis)   | Code-Highlighting, viewZones für Inline-Fragen               |
| UI            | shadcn-svelte                   | Konsistentes Design-System für Custom Svelte Components      |
| KI-API        | Claude API (Anthropic)          | Strukturiertes JSON: Code-Chunks + Fragen                    |
| State         | Svelte Runes + Singleton-Stores | Aufgeteilt: `editor` / `session` / `questions`               |
| Persistierung | localStorage                    | Lernfortschritt, anonyme UID                                 |
| Hosting       | Vercel + GitHub                 | Branch-Preview-URLs für Team-Workflow; Feature-Flag via Env-Variable |

------

## Pflicht-Checkliste

| Anforderung                                                  | Plan in Scaffy                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| **≥5 eigene Komponenten** (davon ≥2 mehrfach verwendet)      | `PromptInput`, `CodeEditor` (Monaco-Wrapper), `QuestionCard` (mehrfach — 1× pro Chunk), `AnswerOption` (mehrfach — 4× pro Frage), `ProgressBar`, `ChatMessage` (mehrfach — je Prompt/Antwort-Paar) — QuestionCard, AnswerOption und ChatMessage werden wiederholt verwendet |
| **Reactivity** — 1 User-Aktion → ≥2 UI-Bereiche aktualisieren | Korrekte Antwort → gleichzeitig: Monaco Editor zeigt neuen Chunk + ProgressBar aktualisiert sich + QuestionCard verschwindet |
| **Lokaler + globaler State** von ≥2 Routen gelesen           | Globaler Singleton-State (`session.svelte.js`) wird auf Editor-Route und History-Route gelesen |
| **3 Routen** (≥2 substantiell unterschiedlich + 1× `:id`)    | `/` Home/Prompt-Eingabe · `/session/:id` aktive Lern-Session mit Monaco + Chat + Fragen · `/history` vergangene Sessions |
| **Externe API** — ≥1 Call mit User-Input                     | Claude API wird mit dem User-Prompt aufgerufen; antwortet mit strukturiertem JSON (Code-Chunks + Fragen); niedrige Temperature + festes JSON-Schema erzwungen via System Prompt |
| **Formular** — ≥2 Validierungsregeln, davon ≥1 nicht-trivial | Prompt-Eingabefeld: (1) nicht leer, (2) Mindestlänge 10 Zeichen, (3) nicht-trivial: Prompt darf keine reinen Code-Snippets enthalten (Regex-Check auf `<`, `{`, `;` als Heuristik) |
| **Loading- + Error-States** für API-Calls                    | Skeleton-Loader im Monaco-Bereich während Claude antwortet; Error-Banner bei API-Fehler mit Retry-Option |
| **Persistierung** (überlebt Reload)                          | Lernfortschritt (welche Chunks freigeschaltet, welche Fragen beantwortet) in `localStorage`; anonyme Session-ID via `crypto.randomUUID()` |

------

## Persistierung

localStorage + Svelte State Manegement + Routing/URL

| Was wird gespeichert                           | Wo             |
| ---------------------------------------------- | -------------- |
| Aktiver Lernfortschritt (Chunks + Antworten)   | `localStorage` |
| Session-ID (anonym, via `crypto.randomUUID()`) | `localStorage` |
| Vergangene Sessions (History)                  | `localStorage` |

Externe Daten (Claude API Response) werden **nicht** persistiert — sie werden bei Bedarf neu generiert.

------

## Add-ons (optional)

| Add-on                                                      | Status          | Umsetzungsplan                                               |
| ----------------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| **Live-Deploy**                                             | ✅ eingeplant    | Vercel, automatisch via GitHub-Integration (main + dev branch) |
| **Lazy Loading** mind. einer Route                          | ✅ eingeplant    | `/history`-Route wird lazy geladen (SvelteKit dynamic import) |
| NEU: **Feature Flag: ScaffyCoding vs. NormalAgenticCoding** | ✅ eingeplant    | Env-Variable (`SCAFFY_MODE=scaffy|agentic`) steuert Verhalten: im *ScaffyCoding*-Modus läuft Scaffy mit Desirable Friction und Scaffolding wie beschrieben; im *NormalAgenticCoding*-Modus liefert Claude den gesamten Code auf einmal mit einer kurzen Erklärung danach — so wie es in heutigen Agentic-Coding-Tools üblich ist. Beide Modi laufen auf demselben Vercel-Deployment über verschiedene Branch-URLs, sodass ein direkter Vergleich möglich ist. |
| **Dark Mode / Theme-Wahl**                                  | 🔄 optional      | shadcn-svelte Dark Theme als Standard; Light-Mode-Toggle bei Zeit |
| **Offline-Fähigkeit** (Service Worker / PWA-Light)          | ❌ nicht geplant | Ohne Claude API nicht sinnvoll nutzbar                       |

------

## Technische Komplexität & Challenges im Projekt

Scaffy geht in drei Bereichen deutlich über eine einfache Svelte SPA mit REST Anbindung hinaus:

### 1. Claude API — System Prompt, Temperature & Structured Outputs

Die Claude API wird nicht wie eine einfache Film- oder Wetter-REST-API konsumiert. Die Herausforderung liegt in der **kontrollierten, konsistenten Ausgabequalität** über drei Stellschrauben:

- **System Prompt:** Muss Claude präzise instruieren, Code zuverlässig in didaktisch sinnvolle Chunks aufzuteilen *und* passende Lernfragen pro Chunk zu generieren — beides in einem einzigen API-Call. Die Qualität des Outputs hängt direkt von der Qualität des System Prompts ab und erfordert iteratives Prompt Engineering.
- **Temperature:** Niedrige Temperature-Einstellung notwendig, um deterministisches, strukturiertes Output zu bekommen — zu hohe Kreativität produziert unvorhersehbare Chunk-Grenzen und Fragequalität.
- **Structured Outputs** (`output_format: { type: "json_schema" }`): Die Claude API bietet einen dedizierten Parameter, der das JSON-Ausgabeschema (z. B. `{ chunks: [{ code, question, options, correct }] }`) via *Constrained Decoding* hart erzwingt — die Grammatik des Schemas wird direkt in die Token-Generierung eingebettet. Das eliminiert fehlerhafte JSON-Ausgaben und die Notwendigkeit von Retry-Logik bei Parse-Fehlern. Dennoch muss bei inhaltlich unvollständigen oder inhaltlich fehlerhaften Responses (falsches Chunk-Splitting, sinnlose Fragen) ein Output-Check und ggf. ein erneuter API-Call implementiert werden.

### 2. Monaco Editor — JavaScript-Integration & State-Verdrahtung

Monaco ist keine Svelte-Komponenten-Bibliothek, sondern eine eigenständige, mächtige **JavaScript-Bibliothek** (VS Code Basis). Die Integration erfordert:

- Manuelles Lifecycle-Management (Monaco instanziieren, destroyen, resizen) außerhalb des Svelte-Reaktivitätssystems
- **viewZones** oder **overlayWidgets** als Monaco-eigene APIs, um Svelte-Komponenten (QuestionCard) *zwischen Codezeilen* einzubetten — hier treffen zwei völlig unterschiedliche Rendering-Systeme aufeinander
- Dynamisches State-Management der Zeilennummern: Wenn ein neuer Code-Chunk appended wird, verschieben sich alle viewZone-Positionen und müssen neu berechnet werden
- Der Monaco-Inhalt und der globale Svelte-State müssen jederzeit synchron gehalten werden

Diese Anforderung ist in der Praxis häufiger der Fall wenn konkrete Frontend Frameworks auf mächtige Javascript Komponenten treffen. Weiteres Beispiele: [Leaflet - a JavaScript library for interactive maps](https://leafletjs.com/), [Three.js – JavaScript 3D Library](https://threejs.org/), ...

### 3. Chat-Fenster — eigener interaktiver Bereich

Neben Monaco und den Inline-Fragen gibt es einen **Chat-Bereich** (Prompt → Antwort → Prompt → Antwort), der:

- Eigene Komponenten benötigt (`ChatMessage`, scroll-to-bottom, Message-Typen: user vs. assistant)
- Mit dem Session-State verknüpft ist (History überlebt Reload via localStorage)
- Gleichzeitig mit Monaco und dem Fragen-State synchronisiert werden muss

------

## Wissenschaftlicher Ausblick

Das Feature-Flag-Design (Friction vs. Agentic Mode) legt die Grundlage für eine mögliche empirische Studie im Bereich **Human-Centered AI (HCAI)**:

> Das A/B-Setting — Scaffolding mit Friction vs. klassisches Agentic Coding — ermöglicht eine empirische Auswertung der Lerneffektivität. Das Projektergebnis kann als Basis für eine HCAI-Studie zum Thema *Friction & Scaffolding als UX-Patterns in KI-gestützter Lernsoftware* dienen.