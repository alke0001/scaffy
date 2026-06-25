# HealthCheck

## Svelte

### Release-Kadenz

Ractive.js, which Rich Harris created in 2013

Version 1 = 2016 Name englisches Wort und heißt "schlank" => coworkers at _[The Guardian](https://en.wikipedia.org/wiki/The_Guardian)_.[[14\]](https://en.wikipedia.org/wiki/Svelte#cite_note-:1-14)

Svelte 5 wurde im Oktober 2024 veröffentlicht [Wikipedia](<https://de.wikipedia.org/wiki/Svelte_(Framework)>) – das ist die letzte Major-Version.

Das Svelte-Team veröffentlicht monatlich einen „What's new in Svelte"-Blogpost [Svelte](https://svelte.dev/blog), was die Kontinuität der Patch- und Minor-Releases belegt.

Zwischen Oktober 2024 und April 2025 wurden allein für das Kern-Paket dutzende Minor/Patch-Releases veröffentlicht, z. B. Svelte 5.20.0, 5.24.0, 5.25.0 innerhalb weniger Wochen. Auch SvelteKit wird parallel dazu sehr regelmäßig gepflegt, mit zahlreichen Bugfixes und Minor-Features. [GitHub](https://github.com/sveltejs/kit/releases)

**Bewertung: 5/5** – sehr hohe, regelmäßige Release-Kadenz mit aktiver Minor/Patch-Pflege.

_Quellen: [svelte.dev/blog](https://svelte.dev/blog), [github.com/sveltejs/svelte/releases](https://github.com/sveltejs/svelte/releases), [github.com/sveltejs/kit/releases](https://github.com/sveltejs/kit/releases)_

---

### GitHub-Aktivität

Das Repository `sveltejs/svelte` hat über 86.000 Stars und 4.800 Forks. [GitHub](https://github.com/sveltejs/svelte/graphs/contributors) Die Commit-Aktivität auf dem `main`-Branch ist sehr hoch; laut GitHub wird sie nicht mehr einzeln gezählt, weil die Gesamtanzahl 10.000 Commits übersteigt. Svelte ist ein MIT-lizenziertes Open-Source-Projekt, das vollständig von freiwilligen Mitwirkenden getragen wird. [GitHub](https://github.com/sveltejs/svelte) Der Bus-Faktor ist historisch niedrig gewesen (Rich Harris als primärer Treiber), hat sich aber durch mehrere aktive Core-Maintainer verbessert. Das npm-Paket hat aktuell ca. 4–4,4 Millionen wöchentliche Downloads. [npm Trends](https://npmtrends.com/react-vs-svelte)

**Bewertung: 4/5** – sehr aktiv, hohe Sternanzahl; Bus-Faktor bleibt ein relatives Risiko.

_Quellen: [github.com/sveltejs/svelte](https://github.com/sveltejs/svelte)_

---

### npm-Trends

Svelte hat aktuell ca. 4,1 Millionen wöchentliche Downloads – verglichen mit React (ca. 122 Mio.) und Vue (ca. 7,4 Mio.) [npm Trends](https://npmtrends.com/angular-vs-react-vs-svelte-vs-vue), was Svelte klar auf Platz 3 in der Reichweite einordnet. Der Trend ist jedoch positiv: Svelte hat sich von unter 1 Million Downloads (2022) auf über 4 Millionen (2025) gesteigert.

**Bewertung: 3/5** – starkes Wachstum, aber deutlich hinter React und Vue in absoluten Zahlen.

_Quellen: [npmtrends.com/react-vs-svelte-vs-vue](https://npmtrends.com/react-vs-svelte-vs-vue)_

---

### Backing

Rich Harris, der Schöpfer von Svelte, wechselte zu Vercel, um Vollzeit an Svelte zu arbeiten. Vercel betont dabei ausdrücklich, dass die Governance des Projekts unverändert bleibt – Svelte ist und bleibt ein unabhängiges Open-Source-Projekt. [Vercel](https://vercel.com/blog/vercel-welcomes-rich-harris-creator-of-svelte) Zusätzlich gibt es Community-Unterstützung via OpenCollective; bis Ende 2021 wurden bereits über 60.000 USD gespendet, darunter 10.000 USD von Cohere allein. [Svelte](https://svelte.dev/blog/accelerating-sveltes-development)

Die Abhängigkeit von einem einzigen kommerziellen Sponsor (Vercel) bringt Stabilität, birgt aber ein strategisches Risiko: Sollte Vercel seine Prioritäten ändern, fehlen dedizierte Alternativen.

**Bewertung: 3/5** – solide kommerzielle Unterstützung durch Vercel, aber keine Multi-Sponsor-Struktur wie bei React (Meta) oder Angular (Google).

_Quellen: [vercel.com/blog/vercel-welcomes-rich-harris-creator-of-svelte](https://vercel.com/blog/vercel-welcomes-rich-harris-creator-of-svelte), [svelte.dev/blog/accelerating-sveltes-development](https://svelte.dev/blog/accelerating-sveltes-development)_

---

### Migrationshistorie

Svelte 5 bringt erhebliche Breaking Changes gegenüber Svelte 4: Das gesamte Reaktivitätsmodell wurde auf „Runes" (`$state`, `$derived`, `$effect`, `$props`) umgestellt. Die alte Svelte-4-Syntax wird jedoch weiterhin unterstützt, sodass eine schrittweise Migration möglich ist. Es gibt ein offizielles Migrationsskript (`npx sv migrate svelte-5`), das viele Schritte automatisiert. [GitHub](https://github.com/sveltejs/svelte/blob/main/documentation/docs/07-misc/07-v5-migration-guide.md) Allerdings werden `createEventDispatcher` und `beforeUpdate`/`afterUpdate` nicht automatisch migriert und müssen manuell angepasst werden. [Svelte](https://svelte.dev/docs/svelte/v5-migration-guide)

Historisch gesehen war der Sprung von Svelte 2 auf 3 ebenfalls ein vollständiges Rewrite. Die Community zeigt eine gewisse Ermüdung gegenüber Breaking Changes (vgl. Kommentare in GitHub-Issues).

**Bewertung: 3/5** – wichtige Breaking Changes, aber gute Rückwärtskompatibilität und Migrationstool vorhanden.

_Quellen: [svelte.dev/docs/svelte/v5-migration-guide](https://svelte.dev/docs/svelte/v5-migration-guide), [github.com/sveltejs/svelte](https://github.com/sveltejs/svelte)_

---

### Ökosystem

Das Svelte-Ökosystem basiert auf einem klaren „offiziellen Stack":

- **Router & Meta-Framework:** SvelteKit (die offizielle Routing-Bibliothek ist SvelteKit, das Filesystem-Router, SSR und HMR in einem Paket vereint [Svelte](https://svelte.dev/docs/svelte/faq)).
- **State:** Seit Svelte 5 integriert via Runes; kein separates State-Management-Library nötig.
- **Testing:** Das Svelte-Team empfiehlt Vitest für Unit- und Integrationstests sowie Playwright für End-to-End-Tests. [Svelte](https://svelte.dev/docs/svelte/testing)
- **UI-Kit:** Kein offizielles UI-Kit – shadcn-svelte und Skeleton UI sind die populärsten Community-Lösungen. Die Community-Aktivität ist hoch: monatliche Blogposts listen dutzende neue Bibliotheken und Komponenten auf. [Svelte](https://svelte.dev/blog/whats-new-in-svelte-december-2025)

**Bewertung: 4/5** – SvelteKit und Vitest sind exzellent gepflegt; UI-Kits sind Community-getrieben ohne offizielles Pendant.

_Quellen: [svelte.dev/docs/svelte/faq](https://svelte.dev/docs/svelte/faq), [svelte.dev/docs/svelte/testing](https://svelte.dev/docs/svelte/testing), [svelte.dev/blog](https://svelte.dev/blog)_

---

### Lernkurve & Docs

Svelte bietet ein offizielles interaktives Tutorial, das direkt im Browser läuft – inklusive eingebettetem Code-Editor und „Lösung anzeigen"-Funktion. [Svelte](https://svelte.dev/docs) Das Tutorial behandelt sowohl Svelte als auch SvelteKit und setzt nur Grundkenntnisse in HTML, CSS und JavaScript voraus. [Svelte](https://learn.svelte.dev/) Zusätzlich existiert ein REPL (Online-Playground), eine vollständige API-Referenz sowie ein aktiver Discord-Server. Die Dokumentation ist ausschließlich auf Englisch verfügbar; es gibt keine offizielle deutsche Version. Die Community-Abdeckung durch Drittanbieter (YouTube, Blogs) auf Deutsch ist vorhanden, aber begrenzt.

Laut State of JS 2024 führt Svelte das Ranking der „overall positive opinions" unter den Frontend-Frameworks an. [Stateofjs](https://2024.stateofjs.com/en-US/libraries/front-end-frameworks/)

**Bewertung: 5/5** – herausragendes interaktives Tutorial, klare Docs; Einschränkung: keine offizielle deutsche Version.

_Quellen: [learn.svelte.dev](https://learn.svelte.dev), [svelte.dev/docs](https://svelte.dev/docs), [2024.stateofjs.com](https://2024.stateofjs.com/en-US/libraries/front-end-frameworks/)_

### Fazit

![image-20260423133405797](C:\Users\AlexK\OneDrive\Desktop\Master_Computer-Science\2-Semester\04_UI\Übungen\HealthCheck\image-20260423132835931.png)

#### Bewertungsmaßstäbe (absoluter Standard)

| Kategorie              | 1                                             | 3                                                     | 5                                                                                           |
| ---------------------- | --------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Release-Kadenz**     | Keine aktive Pflege, >1 Jahr kein Release     | Unregelmäßige Releases, mehrmals im Jahr              | Monatliche Releases, aktive Patch-Pflege, öffentlicher Changelog                            |
| **GitHub-Aktivität**   | <1k Stars, kaum Commits, 1 Contributor        | Moderate Aktivität, kleine Community                  | >50k Stars, wöchentliche Commits, viele Contributors, niedriger Bus-Faktor                  |
| **npm-Trends**         | Sinkende Downloads, Nischen-Tool              | Stabiles Wachstum, relevante Nutzerbasis              | Millionen wöchentliche Downloads, anhaltend steigender Trend                                |
| **Backing**            | Kein Sponsor, rein ehrenamtlich               | Ein kommerzieller Sponsor oder aktive Stiftung        | Mehrere unabhängige Sponsoren oder ein Großkonzern mit nachgewiesener Langzeitstrategie     |
| **Migrationshistorie** | Häufige Breaking Changes, kein Migrationspfad | Breaking Changes vorhanden, Migrationshilfe teilweise | Keine Breaking Changes oder vollständige Abwärtskompatibilität + offizielles Migrationstool |
| **Ökosystem**          | Kein Router, kein Testing, keine UI-Kits      | Einige Community-Lösungen, lückenhaft                 | Offizieller Router, Testing-Empfehlung, gepflegte UI-Kits, stabile Metaframeworks           |
| **Lernkurve & Docs**   | Keine offizielle Doku, kein Tutorial          | Textdoku vorhanden, kein interaktives Tutorial        | Interaktives Tutorial, vollständige API-Referenz, aktiv gepflegte Docs, REPL                |

# Projekt

_Scaffy – AI that grows your skills, not just your codebase._

**Friction** & **Scaffolding** als zentrales Konzept.
Scaffolding ist die Idee, vibe coder genau so viel Unterstützung zu geben wie nötig — und sie schrittweise wegzunehmen, sobald das Können wächst.
Friction ist der bewusste Widerstand, der vibe coder zwingt innezuhalten und nachzudenken.

MVP Scope => Nur Svelte wegen single file components. Wir konzentrieren uns nur auf Agentic Single Component Development. Komme später zu warum.

## Tech Stack

**Frontend**

- SvelteKit 5 als Metaframework (SPA-Modus, kein SSR/SSG)
- Svelte Runes für Reactivity (`$state`, `$derived`, `$effect`)
- File-based Routing (2–3 Pages minimum)
- Shadcn-svelte — UI Components + Dark Theme (IDE-Designsprache)

---

**Core Feature: Editor**

- Monaco Editor (Open Source, VS Code Basis)
- Mehrere Challenges hier:
  - Custom Svelte Components inline zwischen Codezeilen via **Monaco API:**
    - **`viewZones`** — fügt DOM-Bereich physisch zwischen Codezeilen ein
    - **`overlayWidgets`** — Component schwebt über dem Editor als positioniertes Widget
  - Nach Beantwortung (State): Component ausblendet, Code-Generierung läuft weiter
    - Svelte 5 **Global State Management** — **geteilter State** zwischen **Monaco** und **Svelte** **Komponenten** via Runes (`.svelte.js` Store-Pattern)
- Persistierung über localstorage oder json lokal speichern?
- LazyLoading der Editor Component?

---

**KI-Integration**

- Claude API (Backend-for-Frontend)
- Async/Await — UI bleibt reaktiv während API antwortet
- Schrittweise Code-Generierung mit Friction-Gates (Fragen blockieren nächsten Schritt).
  - **Daher B4F notwendig.** Wir erhalten den gesamten Code (Single File Component) von Claude, aber stückeln im backend und hängen fragen rein. Dynamisch. Fragen kommen auch von KI. "markiere stellen wo Fragen sinnvoll sind im Code. Generiere 4 spezifsche Fragen". Dynamische Array Übergabe in 1 Frage 4 Antworten Component.
- **Challenge**:
  - Claude muss zuverlässig strukturiertes JSON liefern — braucht gutes Prompting
  - Zeilennummern dynamisch berechnen wenn Code wächst (global state management)

---

**DevOps**

- GitHub + Vercel (Preview Deployments per Branch)

---

**Nice to Have**

- Authentication & Autorization (Login Form) ggf. mit GitHub Account koppeln
