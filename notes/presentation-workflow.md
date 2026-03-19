# Presentation Generation Workflow

> **Version:** 1.1
> **Date:** 2026-03-12
> **Scope:** Standard workflow for every TactiTok deck (DK-NN)
> **Change from v1.0:** Expanded to 4 phases — EN HTML, HE HTML, EN PPTX, HE PPTX. File naming convention updated to distinguish EN and HE PPTX. Index update rules updated accordingly.

Each presentation produces **4 artifacts** in this order. Do not begin a phase until the previous one is complete and reviewed.

```
Phase 1 → Phase 2 → Phase 3 → Phase 4
EN HTML    HE HTML    EN PPTX    HE PPTX
```

---

## Phase 1 — English HTML

**Deliverable:** `product/presentations/DK-NN_<slug>.html`

- Single self-contained HTML file
- Interactive slide deck: keyboard navigation (←/→), progress bar, slide counter, speaker notes (N key), fullscreen (F)
- Design system from DK-01 (dark navy theme, Inter font, design tokens — copy verbatim)
- Speaker notes on every slide (facilitator guidance)
- After generation: open in Chrome, navigate all slides, verify notes, check progress bar = 1/total slides

**After completion:** Update `presentation-index.md` — set `DK-NN (EN)` row to ✅, fill in file path.

---

## Phase 2 — Hebrew HTML

**Deliverable:** `product/presentations/DK-NN_<slug>_he.html`

- Based on the completed and reviewed English HTML (Phase 1)
- Translate all visible slide text and speaker notes to Hebrew
- Apply RTL layout: `<html lang="he" dir="rtl">`, flip horizontal padding/margins, reverse nav button order (next on left, prev on right)
- Fonts: Inter still renders Hebrew adequately; no font change needed
- Verify right-to-left text flow, slide transitions, and progress bar in Chrome

**After completion:** Update `presentation-index.md` — set `DK-NN-HE (HE)` row to ✅, fill in file path.

---

## Phase 3 — English PowerPoint (PPTX)

**Deliverable:** `product/presentations/DK-NN_<slug>_en.pptx`

- Source: the completed English HTML (Phase 1)
- Generated with `python-pptx` — **native shapes only** (no SVG imports, no image embeds)
- Dark navy theme matching HTML design system (`#0a0f1e` background, accent colors)
- Speaker notes on every slide (copy from HTML `data-notes` attributes)
- Tables rendered as native `python-pptx` tables (not images)
- Verify opens cleanly in PowerPoint, Keynote, and Google Slides

**After completion:** Update `presentation-index.md` — set `DK-NN-EN-PPTX` row to ✅, fill in file path.

---

## Phase 4 — Hebrew PowerPoint (PPTX)

**Deliverable:** `product/presentations/DK-NN_<slug>_he.pptx`

- Source: the completed Hebrew HTML (Phase 2)
- Same python-pptx approach as Phase 3
- Set slide RTL direction: `slide.shapes.title` text frame `rtl = True`; all text frames `rtl = True`
- Hebrew speaker notes on every slide
- Verify RTL rendering and text direction in PowerPoint

**After completion:** Update `presentation-index.md` — set `DK-NN-HE-PPTX` row to ✅, fill in file path.

---

## File Naming Convention

Each deck produces 4 files:

| Phase | Format | File path |
|-------|--------|-----------|
| 1 | English HTML | `product/presentations/DK-NN_<slug>.html` |
| 2 | Hebrew HTML | `product/presentations/DK-NN_<slug>_he.html` |
| 3 | English PPTX | `product/presentations/DK-NN_<slug>_en.pptx` |
| 4 | Hebrew PPTX | `product/presentations/DK-NN_<slug>_he.pptx` |

`<slug>` = lowercase, hyphen-separated description (e.g., `stakeholder-overview`, `demo-walkthrough`).

> **Note on DK-01 PPTX:** The existing `DK-01_stakeholder-overview.pptx` is the English version. It should be renamed `DK-01_stakeholder-overview_en.pptx` when the HE PPTX is generated, to avoid ambiguity.

---

## Index Update Rules

After each phase, update `product/presentations/presentation-index.md`:
1. Set the artifact row's status to ✅
2. Fill in the `File` column with the relative path
3. Bump the version number (v0.X → v0.X+1)
4. Add a changelog note at the top (`> **Change from vX.Y:** ...`)

**Per-deck row structure in the index** (4 rows per deck once all phases started):

| ID | Name | Audience | Slides | Status | File |
|----|------|----------|--------|--------|------|
| DK-NN | Title (EN) | … | N | ✅/🔴 | path or — |
| DK-NN-HE | Title (HE) | … — Hebrew | N | ✅/🔴 | path or — |
| DK-NN-EN-PPTX | Title (EN PPTX) | … — editable EN | N | ✅/🔴 | path or — |
| DK-NN-HE-PPTX | Title (HE PPTX) | … — editable HE | N | ✅/🔴 | path or — |

---

## Design System Reference (DK-01)

The canonical design system lives in `product/presentations/DK-01_stakeholder-overview.html`.
Copy the following sections verbatim for every new deck:

- `:root` CSS custom properties (all design tokens)
- `#progress-bar`, `#slide-counter`, `#nav-controls`, `#kb-hint` styles and HTML
- `#notes-overlay` styles, HTML structure, and close button
- `.slide`, `.slide.active`, `.slide.exit-left` transition rules
- `.slide-inner`, `.label`, `.label-block`, `.accent-bar` utility classes
- All JavaScript (navigation state machine, keyboard handler, notes toggle, fullscreen, swipe)

Per-deck changes only:
- `<html lang="…">` attribute (and `dir="rtl"` for HE)
- `<title>` tag
- `#progress-bar` initial `width` CSS = `(100 / total_slides).toFixed(2)%`
- `<span id="tot">` value in slide counter HTML
- Slide content (all `<section>` elements)
