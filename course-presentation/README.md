# Scaffy — FUI SoSe 2026 course presentation

**Branch:** `fui-sose26-course/scaffy-presentation` — do **not** merge into `main`.

Everything for the Marp slide deck lives in this folder. Canonical architecture and decisions stay in `docs/`; slides are teasers with deep links.

## Quick start (VS Code / Cursor)

### 1. Install the extension

- **Extension:** [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) (`marp-team.marp-vscode`)
- **In Cursor or VS Code:** Extensions panel (`Ctrl+Shift+X`) → search **Marp** → Install
- **Or:** open this repo as the workspace root — Cursor/VS Code may prompt to install recommended extensions from `.vscode/extensions.json`

### 2. Open the deck

Open **`course-presentation/scaffy-course.md`**. The file must start with `marp: true` in the YAML front matter (already set).

Open the **`scaffy`** folder as the workspace root so `.vscode/settings.json` loads (required for the custom theme and link behavior below).

### 3. Start slide preview

1. Focus `scaffy-course.md`
2. If slides do not render: `Ctrl+Shift+P` → **`Marp: Toggle Marp feature for current Markdown`**
3. `Ctrl+Shift+P` → **`Marp: Open Preview to the Side`**

Use the **Marp** preview, not **Markdown: Open Preview** — the built-in Markdown preview does not render slides.

**Presenter tip:** click a slide in the preview to sync with the editor cursor; use `---` in the Markdown file to separate slides.

### 4. Links from slides → docs in the editor

Workspace settings (`.vscode/settings.json`) are tuned for presenting:

| Setting                              | Value      | Effect                                                                                              |
| ------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `markdown.preview.openMarkdownLinks` | `inEditor` | Click a repo link in **Marp preview** → opens the file in the editor (not inside the slide preview) |
| `markdown.links.openLocation`        | `beside`   | Opens beside the current editor column (slides stay visible)                                        |
| `workbench.editor.enablePreview`     | `false`    | Opened docs stay as real tabs (not ephemeral preview tabs)                                          |

**Tips during the talk:**

- **Normal click** on `architecture.md`, `decisions.md`, etc. in Marp preview → doc opens in the editor beside the deck.
- **Ctrl+Click** (Windows) / **Cmd+Click** (macOS) or **middle-click** → force a new editor column (VS Code built-in).
- **https://** links (e.g. scaffy.vercel.app) still open in the browser.

Reload the window once after cloning if links behave like a browser (`Ctrl+Shift+P` → **Developer: Reload Window**).

### 5. Export (optional)

`Ctrl+Shift+P` → **`Marp: Export slide deck...`** → PDF / HTML / PPTX (PDF/PPTX need Chrome, Edge, or Firefox installed).

## Slide theming

| Piece                           | Role                                                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `theme/scaffy.css`              | Marp theme **`scaffy`** — colors from `src/routes/layout.css` (`#0b0d0e` background, `#4ade80` primary, `#6fc3df` ring, …) |
| `scaffy-course.md` front matter | `theme: scaffy` selects that theme                                                                                         |
| `.vscode/settings.json`         | `markdown.marp.themes` registers `./course-presentation/theme/scaffy.css` for the workspace                                |

To adjust look: edit `course-presentation/theme/scaffy.css` (Marp preview reloads on save). Keep token hex values aligned with `src/routes/layout.css` when the app palette changes.

Per-slide layout: HTML comments in the deck, e.g. `<!-- _class: lead -->` for title slides (styled in `scaffy.css`).

## Mermaid diagrams (not native in Marp)

**Marp does not render ` ```mermaid ` fences** — they appear as code blocks in preview and export.

Diagrams are **pre-rendered SVGs**:

| Path                    | Role                                              |
| ----------------------- | ------------------------------------------------- |
| `diagrams/*.mmd`        | Source (keep in sync with `docs/architecture.md`) |
| `assets/diagrams/*.svg` | Rendered images used in `scaffy-course.md`        |

After editing `.mmd` files (from repo root):

```bash
pnpm run course-presentation:diagrams
```

Requires devDependency `@mermaid-js/mermaid-cli` (uses headless Chrome). During the talk you can still open `docs/architecture.md` for live Mermaid in VS Code’s Markdown preview.

## Layout

| Path                          | Purpose                                |
| ----------------------------- | -------------------------------------- |
| `scaffy-course.md`            | Main slide deck                        |
| `theme/scaffy.css`            | Marp theme (Scaffy design tokens)      |
| `diagrams/`                   | Mermaid source for architecture slides |
| `assets/diagrams/`            | Generated SVGs for the deck            |
| `scripts/render-diagrams.mjs` | Renders `.mmd` → `.svg`                |

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
