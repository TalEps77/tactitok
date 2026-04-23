# Presentation Index — TactiTok

> **Version:** 1.9
> **Status:** DK-01 (EN ✅ HE ✅ EN-PPTX ✅ HE-PPTX 🔴) · DK-02 (EN ✅ HE ✅ EN-PPTX 🔴 HE-PPTX 🔴) · DK-03 (EN ✅ HE ✅ EN-PPTX 🔴 HE-PPTX 🔴) · DK-04 (EN ✅ HE ✅ EN-PPTX 🟠 HE-PPTX 🟠) · DK-05 (EN ✅ HE ✅ EN-PPTX 🟠 HE-PPTX 🟠) · DK-06 (EN ✅ HE ✅ EN-PPTX 🟠 HE-PPTX 🟠) · DK-07 (EN ✅ HE ✅ EN-PPTX 🟠 HE-PPTX 🟠) · DK-08 (EN ✅ HE ✅ EN-PPTX 🔴 HE-PPTX 🔴) · DK-08b (EN ✅ HE ✅ EN-PPTX 🔴 HE-PPTX 🔴)
> **Date:** 2026-04-23
> **Source:** File system review 2026-03-19; RTL bug fix 2026-03-20; DK-03–DK-07 HE HTML generated 2026-03-21; DK-08 / DK-08b EN+HE HTML refreshed 2026-04-23
> **Change from v1.8:** Added and aligned DK-08 DB Implementation PRD and DK-08b DB Schema Tables with the 3-table server model. EN and HE HTML now both exist. Source: 08_db-implementation-prd.md. Audience: student developers (Sprint 1).

This is the registry of all planned and generated presentation artifacts for the TactiTok project.
For detail on each deck (sections, sources, blockers), see `product/presentations/meta/presentation-plan.md`.
For the generation workflow (phases 1–4), see `notes/presentation-workflow.md`.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 | Not started |
| 🟠 | Blocked |
| 🟡 | Partially blocked (outline ready; cannot finalize) |
| 🟢 | Unblocked — ready to generate |
| ✅ | Draft generated |
| 📌 | Finalized (reviewed + approved) |

---

## Artifact Workflow Per Deck

Every deck produces 4 artifacts in order:
`EN HTML → HE HTML → EN PPTX → HE PPTX`

Do not begin a phase until the previous one is reviewed. See `notes/presentation-workflow.md` for full instructions.

---

## Required Presentations

### DK-01 — Stakeholder / Evaluator Overview

| ID | Format | Audience | Slides | Status | File |
|----|--------|----------|--------|--------|------|
| DK-01 | EN HTML | Military evaluators, sponsors | 13 | ✅ Generated | `product/presentations/slides-en/DK-01_stakeholder-overview.html` |
| DK-01-HE | HE HTML | Military evaluators, sponsors — Hebrew | 13 | ✅ Generated | `product/presentations/slides-he/DK-01_stakeholder-overview_he.html` |
| DK-01-EN-PPTX | EN PPTX | Military evaluators, sponsors — editable EN | 13 | ✅ Generated | `product/presentations/slides-en/DK-01_stakeholder-overview.pptx` |
| DK-01-HE-PPTX | HE PPTX | Military evaluators, sponsors — editable HE | 13 | 🔴 Not started | — |

> **Note:** `DK-01_stakeholder-overview.pptx` is the English version. Rename to `_en.pptx` when the HE PPTX is generated.

---

### DK-02 — Demo Walkthrough

| ID | Format | Audience | Slides | Status | File |
|----|--------|----------|--------|--------|------|
| DK-02 | EN HTML | Demo facilitator, evaluators | 20 | ✅ Generated | `product/presentations/slides-en/DK-02_demo-walkthrough.html` |
| DK-02-HE | HE HTML | Demo facilitator, evaluators — Hebrew | 20 | ✅ Generated | `product/presentations/slides-he/DK-02_demo-walkthrough_he.html` |
| DK-02-EN-PPTX | EN PPTX | Demo facilitator, evaluators — editable EN | 20 | 🔴 Not started | — |
| DK-02-HE-PPTX | HE PPTX | Demo facilitator, evaluators — editable HE | 20 | 🔴 Not started | — |

---

### DK-03 — Architecture Deep-Dive

| ID | Format | Audience | Slides | Status | Blockers |
|----|--------|----------|--------|--------|----------|
| DK-03 | EN HTML | Technical evaluators, supervisors | 20 | ✅ Generated | `product/presentations/slides-en/DK-03_architecture-deep-dive.html` |
| DK-03-HE | HE HTML | — Hebrew | 20 | ✅ Generated | `product/presentations/slides-he/DK-03_architecture-deep-dive_he.html` |
| DK-03-EN-PPTX | EN PPTX | — editable EN | 20 | 🟠 Blocked | Awaiting HE HTML |
| DK-03-HE-PPTX | HE PPTX | — editable HE | 20 | 🟠 Blocked | Awaiting HE HTML |

---

## Recommended Presentations

### DK-04 — Developer Onboarding

| ID | Format | Audience | Slides | Status | Blockers |
|----|--------|----------|--------|--------|----------|
| DK-04 | EN HTML | Student developers, follow-on team | 20–30 | ✅ Generated | `product/presentations/slides-en/DK-04_developer-onboarding.html` |
| DK-04-HE | HE HTML | — Hebrew | 20 | ✅ Generated | `product/presentations/slides-he/DK-04_developer-onboarding_he.html` |
| DK-04-EN-PPTX | EN PPTX | — editable EN | 20–30 | 🟠 Blocked | Awaiting HE HTML |
| DK-04-HE-PPTX | HE PPTX | — editable HE | 20–30 | 🟠 Blocked | Awaiting HE HTML |

---

### DK-05 — MVP Execution Overview

| ID | Format | Audience | Slides | Status | Blockers |
|----|--------|----------|--------|--------|----------|
| DK-05 | EN HTML | Supervisors, sponsors, team leads | 17 | ✅ Generated | `product/presentations/slides-en/DK-05_mvp-execution-overview.html` |
| DK-05-HE | HE HTML | — Hebrew | 17 | ✅ Generated | `product/presentations/slides-he/DK-05_mvp-execution-overview_he.html` |
| DK-05-EN-PPTX | EN PPTX | — editable EN | 17 | 🟠 Blocked | Awaiting HE HTML |
| DK-05-HE-PPTX | HE PPTX | — editable HE | 17 | 🟠 Blocked | Awaiting HE HTML |

---

## Optional Presentations

### DK-06 — Data Model Reference

| ID | Format | Audience | Slides | Status | Blockers |
|----|--------|----------|--------|--------|----------|
| DK-06 | EN HTML | Developers | 16 | ✅ Generated | `product/presentations/slides-en/DK-06_data-model-reference.html` |
| DK-06-HE | HE HTML | — Hebrew | 16 | ✅ Generated | `product/presentations/slides-he/DK-06_data-model-reference_he.html` |
| DK-06-EN-PPTX | EN PPTX | — editable EN | 16 | 🟠 Blocked | Awaiting HE HTML |
| DK-06-HE-PPTX | HE PPTX | — editable HE | 16 | 🟠 Blocked | Awaiting HE HTML |

---

### DK-07 — Security & Deployment Posture

| ID | Format | Audience | Slides | Status | File |
|----|--------|----------|--------|--------|------|
| DK-07 | EN HTML | Security reviewers, military evaluators | 10 | ✅ Generated | `product/presentations/slides-en/DK-07_security-deployment-posture.html` |
| DK-07-HE | HE HTML | — Hebrew | 10 | ✅ Generated | `product/presentations/slides-he/DK-07_security-deployment-posture_he.html` |
| DK-07-EN-PPTX | EN PPTX | — editable EN | 10 | 🟠 Blocked | Awaiting HE HTML |
| DK-07-HE-PPTX | HE PPTX | — editable HE | 10 | 🟠 Blocked | Awaiting HE HTML |

---

### DK-08 — DB Implementation PRD

| ID | Format | Audience | Slides | Status | File |
|----|--------|----------|--------|--------|------|
| DK-08 | EN HTML | Student developers, mentor/reviewer | 7 | ✅ Generated | `product/presentations/slides-en/DK-08_db-implementation-prd.html` |
| DK-08-HE | HE HTML | — Hebrew | 7 | ✅ Generated | `product/presentations/slides-he/DK-08_db-implementation-prd_he.html` |
| DK-08-EN-PPTX | EN PPTX | — editable EN | 7 | 🔴 Not started | — |
| DK-08-HE-PPTX | HE PPTX | — editable HE | 7 | 🔴 Not started | — |

---

### DK-08b — DB Schema Tables

| ID | Format | Audience | Slides | Status | File |
|----|--------|----------|--------|--------|------|
| DK-08b | EN HTML | Student developers (Dev A — DB builder) | 6 | ✅ Generated | `product/presentations/slides-en/DK-08b_db-schema-tables.html` |
| DK-08b-HE | HE HTML | — Hebrew | 6 | ✅ Generated | `product/presentations/slides-he/DK-08b_db-schema-tables_he.html` |
| DK-08b-EN-PPTX | EN PPTX | — editable EN | 6 | 🔴 Not started | — |
| DK-08b-HE-PPTX | HE PPTX | — editable HE | 6 | 🔴 Not started | — |

---

## Deck Descriptions (Quick Reference)

| ID | What it covers |
|----|---------------|
| DK-01 | Problem, vision, target users, 3 core flows, system overview, offline challenge, demo invitation, success metrics, next steps |
| DK-02 | 15-step demo script (one slide per step), setup context, success criteria, Q&A |
| DK-03 | Architecture goals, three-tier topology, edge proxy rationale, data model, API surface, tech stack decisions, continuation architecture |
| DK-04 | Product overview, 5 packages, dev setup, data model, API, sprint plan, build order, deployment, demo script, risks, continuation |
| DK-05 | Sprint overview, per-sprint goals/deliverables, de-scope levers, risks, acceptance criteria, demo milestone, post-MVP roadmap |
| DK-06 | All 7 modeled entities/stores (fields, types, constraints), relationships, server vs. edge storage, lifecycle rules |
| DK-07 | Three trust zones, transport security, admin auth, content sensitivity, what team does not secure |
| DK-08 | Stack decisions, repo layout, connection config, SQLAlchemy models (3 tables), Pydantic schemas, Alembic workflow, 3-migration plan, seed data, constraint split, query patterns, test fixtures, DoD checklist, OOS + open questions |
| DK-08b | The 3 PostgreSQL tables — columns, types, constraints, indexes — quick reference for the dev creating the DB (companion to DK-08) |

---

## Audience Map

| Audience | Must see | Should see | Could see |
|----------|----------|-----------|-----------|
| **Military evaluators / stakeholders** | DK-01, DK-02 | DK-07 | DK-03 |
| **Academic supervisors** | DK-01, DK-03 | DK-05 | DK-02 |
| **Project sponsors** | DK-01, DK-05 | DK-02 | — |
| **Student developers** | DK-04, DK-08b | DK-03, DK-06, DK-08 | DK-05 |
| **Security reviewers** | DK-07 | DK-03 | DK-01 |
| **Follow-on development team** | DK-04, DK-03 | DK-06, DK-08, DK-08b | DK-05 |

---

## Dependency on Diagrams

Each deck's EN HTML phase requires diagrams to be generated first:

| Deck | Required diagrams | Recommended diagrams |
|------|------------------|---------------------|
| DK-01 | DG-01 | DG-05 (simplified), DG-08 (simplified) |
| DK-02 | None (demo steps are text-based) | DG-01 (one reference slide) |
| DK-03 | DG-02, DG-03, DG-04 | DG-08, DG-09 |
| DK-04 | DG-02, DG-03, DG-04, DG-13 | DG-12, DG-05, DG-06 |
| DK-05 | None | DG-01 (one reference slide) |
| DK-06 | DG-04 | DG-14, DG-15 |
| DK-07 | DG-16 | DG-03 (deployment section) |
| DK-08 | None (source: `08_db-implementation-prd.md`, `05_data-model.md §5.1`) | — |
| DK-08b | None (source: `08_db-implementation-prd.md`, `05_data-model.md §5.1`) | — |

---

## File Location Convention

```
product/presentations/
├── meta/
│   ├── presentation-plan.md                        ← planning detail (deck-by-deck specs)
│   └── presentation-index.md                       ← this file (registry)
│
├── slides-en/
│   ├── DK-01_stakeholder-overview.html             ✅ EN HTML
│   ├── DK-01_stakeholder-overview.pptx             ✅ EN PPTX  ← rename to _en.pptx when HE PPTX is generated
│   ├── DK-02_demo-walkthrough.html                 ✅ EN HTML
│   ├── DK-02_demo-walkthrough_en.pptx              🔴 EN PPTX
│   ├── DK-03_architecture-deep-dive.html           ✅ EN HTML
│   ├── DK-03_architecture-deep-dive_en.pptx        🔴 EN PPTX
│   ├── DK-04_developer-onboarding.html             ✅ EN HTML
│   ├── DK-04_developer-onboarding_en.pptx          🔴 EN PPTX
│   ├── DK-05_mvp-execution-overview.html           ✅ EN HTML
│   ├── DK-05_mvp-execution-overview_en.pptx        🟠 Blocked
│   ├── DK-06_data-model-reference.html             ✅ EN HTML
│   ├── DK-06_data-model-reference_en.pptx          🟠 Blocked
│   ├── DK-07_security-deployment-posture.html      ✅ EN HTML
│   ├── DK-08_db-implementation-prd.html            ✅ EN HTML
│   └── DK-08b_db-schema-tables.html                ✅ EN HTML
│
└── slides-he/
    ├── DK-01_stakeholder-overview_he.html          ✅ HE HTML
    ├── DK-01_stakeholder-overview_he.pptx          🔴 HE PPTX
    ├── DK-02_demo-walkthrough_he.html              ✅ HE HTML
    ├── DK-02_demo-walkthrough_he.pptx              🔴 HE PPTX
    ├── DK-03_architecture-deep-dive_he.html        ✅ HE HTML
    ├── DK-03_architecture-deep-dive_he.pptx        🔴 HE PPTX
    ├── DK-04_developer-onboarding_he.html          ✅ HE HTML
    ├── DK-04_developer-onboarding_he.pptx          🟠 Blocked
    ├── DK-05_mvp-execution-overview_he.html        ✅ HE HTML
    ├── DK-05_mvp-execution-overview_he.pptx        🟠 Blocked
    ├── DK-06_data-model-reference_he.html          ✅ HE HTML
    ├── DK-06_data-model-reference_he.pptx          🟠 Blocked
    ├── DK-07_security-deployment-posture_he.html   ✅ HE HTML
    ├── DK-08_db-implementation-prd_he.html         ✅ HE HTML
    └── DK-08b_db-schema-tables_he.html             ✅ HE HTML
```

---

*Update this index when presentations are generated. Set status to ✅ and fill in the file path. Set to 📌 when the deck is reviewed and approved.*

---

## Phase 2 (HE HTML) QA Checklist — RTL Requirements

Apply this checklist to every Hebrew HTML before marking it ✅. These checks exist because DK-01 HE was shipped with the slide transition direction bug (2026-03-20).

### Slide transitions (most common bug)
`translateX` is in **physical pixel space** — it is NOT flipped by `dir="rtl"` automatically.
All six values must be inverted from the EN version:

| Location in code | EN value | Required HE value |
|---|---|---|
| CSS `.slide` initial `transform` | `translateX(+60px)` | `translateX(-60px)` |
| `goTo()` — next initial, forward | `translateX(+60px)` | `translateX(-60px)` |
| `goTo()` — next initial, backward | `translateX(-60px)` | `translateX(+60px)` |
| `goTo()` — prev exit, forward | `translateX(-60px)` | `translateX(+60px)` |
| `goTo()` — prev exit, backward | `translateX(+60px)` | `translateX(-60px)` |
| `setTimeout` reset for prev | `translateX(+60px)` | `translateX(-60px)` |
| Init loop default position | `translateX(+60px)` | `translateX(-60px)` |

Effect: forward navigation slides old content **out to the right** and brings new content **in from the left**, matching RTL reading direction.

### Other RTL checks
- `<html lang="he" dir="rtl">` present
- `#nav-controls` at `left: 1.5rem` (not right)
- `#notes-close` at `left: 1rem` (not right)
- `#notes-overlay` padding flipped: `1.1rem 1.5rem 1.1rem 2rem`
- `.bullets li::before` uses `◂` (left-pointing) not `▸`
- `.card-gl` uses `border-right` not `border-left`
- `.pull-quote` uses `border-right`, no `border-left`
- `.divider` gradient is `270deg` (right to left) not `90deg`
- `.data-table th` has `text-align: right`
- Font is `Heebo` (not Inter — Heebo is optimized for Hebrew)
- All visible text and `data-notes` attributes translated to Hebrew
