# Run test prompts — ProfileCard robustness

Use these three **user prompts** (not system prompt edits) for your first **run test** against `/api/generate`. Goal: check whether Scaffy produces similarly solid `scaffolds` across **novice → semi-structured → task-style** wording — that is the real robustness test for [`src/lib/server/scaffy-system-prompt.md`](../src/lib/server/scaffy-system-prompt.md).

Copy each block verbatim into the Claude Chat smoke test (or your client). Each prompt must still pass server-side heuristics (length, no `<` / `{` / `;` in the prompt string if those rules stay in place).

---

## Stage 1 — True novice (messy, realistic)

```
mach mir bitte eine profilcard mit name, bild und ne beschreibung. man soll auch noch social links unten reinpacken können
```

---

## Stage 2 — Engaged beginner (half vocabulary)

```
Ich brauche eine ProfileCard Komponente in Svelte. Sie soll name, image und description als props bekommen. Unten drunter soll noch Platz für Social Links sein (instagram, github etc.) die der Nutzer der Komponente selber reinpacken kann.
```

---

## Stage 3 — Structured (task vocabulary)

```
ProfileCard Komponente bauen: Props sind name, image, description. Bonus: Slot/Children-Bereich für zusätzlichen Inhalt wie Social-Links. Framework: Svelte 5.
```

---

## How to compare results

- Same schema shape: `{ "scaffolds": [...] }` with `codeSnippet`, `knowledgeCheck`, etc.
- Comparable teaching arc: props → markup → styling / slots as appropriate.
- Last scaffold still carries any remaining code per system prompt (max five scaffolds).

Optional mock reference: [`src/lib/mocks/scaffolds-profile-card.json`](../src/lib/mocks/scaffolds-profile-card.json).
