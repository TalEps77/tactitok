# Presentation Index — TactiTok

> **Version:** 1.2
> **Status:** DK-01 (EN ✅ HE ✅ EN-PPTX ✅ HE-PPTX 🔴) · DK-02 (EN ✅ HE 🔴 EN-PPTX 🔴 HE-PPTX 🔴) · DK-03 (EN ✅ HE 🔴 EN-PPTX 🔴 HE-PPTX 🔴) · DK-04 (EN ✅ HE 🟢 EN-PPTX 🟠 HE-PPTX 🟠) · DK-05 (EN ✅ HE 🟠 EN-PPTX 🟠 HE-PPTX 🟠) · DK-06 (EN ✅ HE 🟠 EN-PPTX 🟠 HE-PPTX 🟠) · DK-07 (EN ✅ HE 🟠 EN-PPTX 🟠 HE-PPTX 🟠)
> **Date:** 2026-03-19
> **Source:** File system review 2026-03-19
> **Change from v1.1:** DK-07 EN HTML generated (10 slides, security reviewers / military evaluators audience). DK-07 HE HTML and PPTX variants blocked pending EN HTML review.

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
| DK-02-HE | HE HTML | Demo facilitator, evaluators — Hebrew | 20 | 🔴 Not started | — |
| DK-02-EN-PPTX | EN PPTX | Demo facilitator, evaluators — editable EN | 20 | 🔴 Not started | — |
| DK-02-HE-PPTX | HE PPTX | Demo facilitator, evaluators — editable HE | 20 | 🔴 Not started | — |

---

### DK-03 — Architecture Deep-Dive

| ID | Format | Audience | Slides | Status | Blockers |
|----|--------|----------|--------|--------|----------|
| DK-03 | EN HTML | Technical evaluators, supervisors | 20 | ✅ Generated | `product/presentations/slides-en/DK-03_architecture-deep-dive.html` |
| DK-03-HE | HE HTML | — Hebrew | 20 | 🟢 Unblocked | Awaiting review of EN HTML |
| DK-03-EN-PPTX | EN PPTX | — editable EN | 20 | 🟠 Blocked | Awaiting HE HTML |
| DK-03-HE-PPTX | HE PPTX | — editable HE | 20 | 🟠 Blocked | Awaiting HE HTML |

---

## Recommended Presentations

### DK-04 — Developer Onboarding

| ID | Format | Audience | Slides | Status | Blockers |
|----|--------|----------|--------|--------|----------|
| DK-04 | EN HTML | Student developers, follow-on team | 20–30 | ✅ Generated | `product/presentations/slides-en/DK-04_developer-onboarding.html` |
| DK-04-HE | HE HTML | — Hebrew | 20–30 | 🟢 Unblocked | Awaiting review of EN HTML |
| DK-04-EN-PPTX | EN PPTX | — editable EN | 20–30 | 🟠 Blocked | Awaiting HE HTML |
| DK-04-HE-PPTX | HE PPTX | — editable HE | 20–30 | 🟠 Blocked | Awaiting HE HTML |

---

### DK-05 — MVP Execution Overview

| ID | Format | Audience | Slides | Status | Blockers |
|----|--------|----------|--------|--------|----------|
| DK-05 | EN HTML | Supervisors, sponsors, team leads | 17 | ✅ Generated | `product/presentations/slides-en/DK-05_mvp-execution-overview.html` |
| DK-05-HE | HE HTML | — Hebrew | 17 | 🟠 Blocked | Awaiting review of EN HTML |
| DK-05-EN-PPTX | EN PPTX | — editable EN | 17 | 🟠 Blocked | Awaiting HE HTML |
| DK-05-HE-PPTX | HE PPTX | — editable HE | 17 | 🟠 Blocked | Awaiting HE HTML |

---

## Optional Presentations

### DK-06 — Data Model Reference

| ID | Format | Audience | Slides | Status | Blockers |
|----|--------|----------|--------|--------|----------|
| DK-06 | EN HTML | Developers | 16 | ✅ Generated | `product/presentations/slides-en/DK-06_data-model-reference.html` |
| DK-06-HE | HE HTML | — Hebrew | 16 | 🟠 Blocked | Awaiting review of EN HTML |
| DK-06-EN-PPTX | EN PPTX | — editable EN | 16 | 🟠 Blocked | Awaiting HE HTML |
| DK-06-HE-PPTX | HE PPTX | — editable HE | 16 | 🟠 Blocked | Awaiting HE HTML |

---

### DK-07 — Security & Deployment Posture

| ID | Format | Audience | Slides | Status | File |
|----|--------|----------|--------|--------|------|
| DK-07 | EN HTML | Security reviewers, military evaluators | 10 | ✅ Generated | `product/presentations/slides-en/DK-07_security-deployment-posture.html` |
| DK-07-HE | HE HTML | — Hebrew | 10 | 🟠 Blocked | Awaiting review of EN HTML |
| DK-07-EN-PPTX | EN PPTX | — editable EN | 10 | 🟠 Blocked | Awaiting HE HTML |
| DK-07-HE-PPTX | HE PPTX | — editable HE | 10 | 🟠 Blocked | Awaiting HE HTML |

---

## Deck Descriptions (Quick Reference)

| ID | What it covers |
|----|---------------|
| DK-01 | Problem, vision, target users, 3 core flows, system overview, offline challenge, demo invitation, success metrics, next steps |
| DK-02 | 15-step demo script (one slide per step), setup context, success criteria, Q&A |
| DK-03 | Architecture goals, three-tier topology, edge proxy rationale, data model, API surface, tech stack decisions, continuation architecture |
| DK-04 | Product overview, 5 packages, dev setup, data model, API, sprint plan, build order, deployment, demo script, risks, continuation |
| DK-05 | Sprint overview, per-sprint goals/deliverables, de-scope levers, risks, acceptance criteria, demo milestone, post-MVP roadmap |
| DK-06 | All 9 entities (fields, types, constraints), relationships, server vs. edge storage, lifecycle rules |
| DK-07 | Three trust zones, transport security, admin auth, content sensitivity, what team does not secure |

---

## Audience Map

| Audience | Must see | Should see | Could see |
|----------|----------|-----------|-----------|
| **Military evaluators / stakeholders** | DK-01, DK-02 | DK-07 | DK-03 |
| **Academic supervisors** | DK-01, DK-03 | DK-05 | DK-02 |
| **Project sponsors** | DK-01, DK-05 | DK-02 | — |
| **Student developers** | DK-04 | DK-03, DK-06 | DK-05 |
| **Security reviewers** | DK-07 | DK-03 | DK-01 |
| **Follow-on development team** | DK-04, DK-03 | DK-06 | DK-05 |

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
│   └── DK-07_security-deployment-posture.html      ✅ EN HTML
│
└── slides-he/
    ├── DK-01_stakeholder-overview_he.html          ✅ HE HTML
    ├── DK-01_stakeholder-overview_he.pptx          🔴 HE PPTX
    ├── DK-02_demo-walkthrough_he.html              🔴 HE HTML
    ├── DK-02_demo-walkthrough_he.pptx              🔴 HE PPTX
    ├── DK-03_architecture-deep-dive_he.html        🔴 HE HTML
    ├── DK-03_architecture-deep-dive_he.pptx        🔴 HE PPTX
    ├── DK-04_developer-onboarding_he.html          🟢 Unblocked
    ├── DK-04_developer-onboarding_he.pptx          🟠 Blocked
    ├── DK-05_mvp-execution-overview_he.html        🟠 Blocked
    ├── DK-05_mvp-execution-overview_he.pptx        🟠 Blocked
    ├── DK-06_data-model-reference_he.html          🟠 Blocked
    ├── DK-06_data-model-reference_he.pptx          🟠 Blocked
    └── DK-07_security-deployment-posture_he.html   🟠 Blocked
```

---

*Update this index when presentations are generated. Set status to ✅ and fill in the file path. Set to 📌 when the deck is reviewed and approved.*
