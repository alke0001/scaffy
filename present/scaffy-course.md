---
marp: true
theme: default
paginate: true
header: 'Scaffy — FUI SoSe 2026'
footer: 'Do not merge this branch into main'
style: |
  section {
    background-color: #0b0d0e;
    color: #e6e8e6;
  }
  a { color: #6fc3df; }
  strong { color: #4ade80; }
---

<!-- _class: lead -->

# Scaffy

**AI that teaches you to build good code, not just builds for you.**

FUI · SoSe 2026

---

## Agenda

1. Vision — scaffolding + friction
2. Architecture (ABB / SSB) → [`docs/architecture.md`](../docs/architecture.md)
3. Key decisions (ADRs) → [`docs/decisions.md`](../docs/decisions.md)
4. Live demo — Home → Session → Learning Card
5. Course checklist → [`Projektsteckbrief_Scaffy.md`](../Projektsteckbrief_Scaffy.md)

---

## Vision

- **Scaffolding:** code in ordered steps, not one opaque blob
- **Friction:** knowledge check gates the next scaffold
- **Ask mode:** Socratic tutor beside Learn — does not replace the gate

---

## Architecture — where to read more

Open in the editor during the talk (Mermaid renders in preview):

| View           | Doc                                                                              |
| -------------- | -------------------------------------------------------------------------------- |
| Logical (ABB)  | [`docs/architecture.md` §1](../docs/architecture.md#1-logical-architecture-abb)  |
| Physical (SSB) | [`docs/architecture.md` §2](../docs/architecture.md#2-physical-architecture-ssb) |
| Tech stack     | [`docs/architecture.md`](../docs/architecture.md)                                |

<!-- sync: copy Mermaid from architecture.md only when a slide needs an embedded diagram -->

---

## Key ADRs (teaser)

Full log: [`docs/decisions.md`](../docs/decisions.md)

| ADR                                                                                                      | Topic                                        |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [ADR-003](../docs/decisions.md#adr-003-claude-only-via-server-api-routes)                                | Claude only via `/api/*` — no key in browser |
| [ADR-005](../docs/decisions.md#adr-005-learn-scaffold-rest--structured-json)                             | Learn: REST + structured JSON                |
| [ADR-011](../docs/decisions.md#adr-011-monaco-typewriter-and-viewzones-planned)                          | Learning Card in Monaco viewZone             |
| [ADR-020](../docs/decisions.md#adr-020-client-side-i18n-english--german-via-flat-translation-dictionary) | Client i18n EN/DE                            |

---

## Live demo — code jumps

| What                          | Path                                             |
| ----------------------------- | ------------------------------------------------ |
| Title bar + language dropdown | `src/lib/components/shell/app-title-bar.svelte`  |
| Scaffold API                  | `src/routes/api/scaffold/+server.ts`             |
| Learning Card                 | `src/lib/components/editor/learning-card.svelte` |
| Session intro (SSE)           | `src/routes/api/session-intro/+server.ts`        |

---

## Course checklist

Mapped in [`Projektsteckbrief_Scaffy.md`](../Projektsteckbrief_Scaffy.md) — reactivity, routing, API, persistence, deploy.

---

<!-- _class: lead -->

# Questions?

**Repo:** same branch · slides under `present/`
