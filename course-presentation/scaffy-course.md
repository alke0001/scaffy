---
marp: true
theme: scaffy
paginate: true
header: 'Scaffy · FUI SoSe 2026'
footer: 'Alexander Keller | Dennis Kallmayer'
---

<!-- _class: lead -->

# Scaffy

**AI that teaches you to build good code, not just builds for you.**

Fachhochschule · Frontend-UI · SoSe 2026

---

## Agenda

1. Der Scaffy Use Case
2. **Live-Demo**
3. Architektur (ABB / SSB) — [`docs/architecture.md`](../docs/architecture.md)
4. API, Monaco, Chat
5. State & Persistierung
6. Entscheidungen (ADRs) — [`docs/decisions.md`](../docs/decisions.md)
7. Pflicht-Checkliste — [`Projektsteckbrief_Scaffy.md`](../Projektsteckbrief_Scaffy.md)
8. Lessons Learned

---

## Hypothese: Desirable Friction _verringert_ Cognitive Debt beim Coding

> Erklärung _nach_ dem fertigen Code wird übersprungen —
> wie das bekannte HCI-Beispiel der vergessenen Bankkarte im Automaten, _wenn_ Geld zuerst ausgegeben würde.

**Scaffy:** erst Verständnisfrage, dann nächster Code-Chunk.

Details: [`Projektsteckbrief_Scaffy.md`](../Projektsteckbrief_Scaffy.md)

---

## Was tut Scaffy?

Der User gibt einen Prompt ein → KI liefert **geordnete Scaffolds** (Code + Knowledge Check pro Schritt).

- Code erscheint in einem **Code Editor**
- **Learning Cards** unterbrechen bewusst eine komplette Codegenerierung in einem Schritt im Editor.
- **Scaffy Tutor** KI Chatbot erklärt nebenan und kann bei der Beantwortung der Learning Card helfen — ersetzt die Lernfrage nicht

---

<!-- _class: live-demo -->

## Live Demo

**Jetzt Starten 👇🚀**

[scaffy.vercel.app](https://scaffy.vercel.app/)

---

## Logische Architektur (ABB)

<!-- sync: course-presentation/diagrams/abb-logical.mmd · docs/architecture.md §1 -->

![Logical architecture (ABB)](assets/diagrams/abb-logical.svg)
Details: [`docs/architecture.md`](docs/architecture.md)

---

## Physische Architektur (SSB)

<!-- sync: course-presentation/diagrams/ssb-physical.mmd · docs/architecture.md §2 -->

![Physical architecture (SSB)](assets/diagrams/ssb-physical.svg)
Details: [`docs/architecture.md`](docs/architecture.md)

---

## Sicherheit: kein API-Key im Browser

[`ADR-003`](../docs/decisions.md#adr-003-claude-only-via-server-api-routes)

```
Browser  →  /api/*  (SvelteKit)  →  api.anthropic.com
```

- `ANTHROPIC_API_KEY` nur serverseitig (`$env/static/private`)
- Learn: **REST** + JSON-Schema · Ask & Intro: **SSE**

---

## Learn — Structured JSON

<!-- sync: course-presentation/diagrams/learn-sequence.mmd · docs/architecture.md §4 Learn -->

![Learn scaffold sequence](assets/diagrams/learn-sequence.svg)

`src/routes/api/scaffold/+server.ts` · `src/lib/server/scaffold/`

---

## Monaco + Learning Card

[`ADR-011`](../docs/decisions.md#adr-011-monaco-typewriter-and-viewzones-planned)

- **`changeViewZones`** — Card scrollt mit dem Code
- Editor **read-only** bis Lektion fertig
- Copy auf Code erlaubt · Card-Inhalt nicht kopierbar (Friction)

`src/lib/components/editor/learning-card.svelte`

---

## State — drei Ebenen

<!-- sync: course-presentation/diagrams/state-flow.mmd · docs/architecture.md §6 -->

![State layers](assets/diagrams/state-flow.svg)

Ask-Verlauf: Navigation ✅ · Full Reload ❌ (bewusst, ADR-014)

---

## Tech-Stack (Kurz)

| Bereich   | Wahl                         |
| --------- | ---------------------------- |
| Framework | SvelteKit 5 · SPA            |
| UI        | shadcn-svelte · Tailwind 4   |
| Editor    | Monaco (viewZones)           |
| KI        | Claude · `@anthropic-ai/sdk` |
| Deploy    | Vercel · GitHub Actions      |

Vollständig: [`docs/architecture.md` §5](../docs/architecture.md#5-technologies-meta)

---

<!-- _class: compact -->

## Pflicht-Checkliste (Auszug)

Quelle: [`Projektsteckbrief_Scaffy.md`](../Projektsteckbrief_Scaffy.md)

| Status | Anforderung                                 |
| ------ | ------------------------------------------- |
| ✅     | ≥5 Komponenten, ≥2 mehrfach genutzt         |
| ✅     | Globaler State von ≥2 Routen                |
| ✅     | 3 Routen (`/`, `/session/:id`, `/sessions`) |
| ✅     | Externe API mit User-Input                  |
| ✅     | Formular mit ≥2 Validierungsregeln          |
| ✅     | Loading + Error States                      |
| ⚠️     | Reactivity ohne dedizierte ProgressBar      |
| ⚠️     | `currentIndex` nicht in localStorage        |

---

## Key ADRs

Vollständiger Log: [`docs/decisions.md`](../docs/decisions.md)

| ADR                                                                                                  | Thema                                   |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [002](../docs/decisions.md#adr-002-spa-sveltekit-5-no-ssr-for-app-shell)                             | SPA, kein SSR für App-Shell             |
| [004](../docs/decisions.md#adr-004-separate-api-endpoints-for-learn-and-ask)                         | Getrennte Endpoints Learn / Ask / Intro |
| [018](../docs/decisions.md#adr-018-scaffy-modal-product-dialogs)                                     | ScaffyModal statt Dialog-Chaos          |
| [020](../docs/decisions.md#adr-020-client-side-i18n-english--german-via-flat-translation-dictionary) | i18n EN/DE                              |
| [021](../docs/decisions.md#adr-021-session-intro-stream-and-lesson-start-gate)                       | Intro-Stream + Lesson-Start-Gate        |
| [022](../docs/decisions.md#adr-022-shadcn-vs-custom-ui-controls)                                     | shadcn vs. leichtes Custom-UI           |

---

## Lessons Learned

- **A/B-Studie** (geplant): Scaffolding + Friction vs. klassisches Agentic Coding
- **Persistierung Phase 2:** Schritt-Index, ggf. Supabase ([ADR-014](../docs/decisions.md#adr-014-learning-session-persistence-port--localstorage-first))
- **Typewriter** pro Scaffold ([ADR-011](../docs/decisions.md#adr-011-monaco-typewriter-and-viewzones-planned))

---

<!-- _class: lead -->

# Fragen?

Slides: `course-presentation/scaffy-course.md`

Doku: `docs/` · Checkliste: `Projektsteckbrief_Scaffy.md`
