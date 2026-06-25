# Scaffy — FUI SoSe 2026 presentation

**Branch:** `fui-sose26-course/scaffy-presentation` — do **not** merge into `main`.

Marp slide deck for the course presentation. Canonical architecture and decisions stay in `docs/`; slides are teasers with deep links.

## VS Code

1. Install the [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) extension.
2. Open `present/scaffy-course.md`.
3. Use **Marp: Open Preview** (or side-by-side) for presenter mode.

## Layout

| Path               | Purpose                                               |
| ------------------ | ----------------------------------------------------- |
| `scaffy-course.md` | Main slide deck                                       |
| `theme/`           | Optional custom Marp theme (match Scaffy dark tokens) |

Add `assets/` only when you have screenshots or figures to embed.

## Docs to link from slides

- [`docs/architecture.md`](../docs/architecture.md) — ABB/SSB diagrams (Mermaid)
- [`docs/decisions.md`](../docs/decisions.md) — ADR index and detail
- [`Projektsteckbrief_Scaffy.md`](../Projektsteckbrief_Scaffy.md) — course checklist (German)

## Maintenance

Rebase this branch on `main` before the presentation so live code jumps and links stay accurate:

```bash
git fetch origin
git rebase origin/main
```
