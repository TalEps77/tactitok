# Presentation Index — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Date:** 2026-03-07
> **Source:** Cross-doc review pass (`product/reviews/01_cross-doc-review.md`)

This is the registry of all planned and generated presentation artifacts for the TactiTok project.
For detail on each deck (sections, sources, blockers), see `product/presentations/presentation-plan.md`.

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

## Required Presentations

| ID | Name | Audience | Slides | Status | Blockers | File |
|----|------|----------|--------|--------|----------|------|
| DK-01 | Stakeholder / Evaluator Overview | Military evaluators, sponsors | 15–20 | 🟡 Partial | Needs DG-01, DG-05, DG-08 | — |
| DK-02 | Demo Walkthrough | Demo facilitator, evaluators | 18–22 | 🟡 Partial | Needs prototype screenshots | — |
| DK-03 | Architecture Deep-Dive | Technical evaluators, supervisors | 20–25 | 🟠 Blocked | B1 (doc 06), DG-02–04 needed | — |

---

## Recommended Presentations

| ID | Name | Audience | Slides | Status | Blockers | File |
|----|------|----------|--------|--------|----------|------|
| DK-04 | Developer Onboarding | Student developers, follow-on team | 20–30 | 🟠 Blocked | B1 (doc 06), B2 (doc 07) | — |
| DK-05 | MVP Execution Overview | Supervisors, sponsors, team leads | 15–18 | 🔴 Blocked | B2 (doc 07) | — |

---

## Optional Presentations

| ID | Name | Audience | Slides | Status | Blockers | File |
|----|------|----------|--------|--------|----------|------|
| DK-06 | Data Model Reference | Developers | 12–18 | 🟢 Unblocked | — | — |
| DK-07 | Security & Deployment Posture | Security reviewers, military evaluators | 8–12 | 🟢 Unblocked | — | — |

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

Each deck relies on diagrams being generated first. The minimum set of diagrams required per deck:

| Deck | Required diagrams | Recommended diagrams |
|------|------------------|---------------------|
| DK-01 | DG-01 | DG-05 (simplified), DG-08 (simplified) |
| DK-02 | None (demo steps are text/screenshot-based) | DG-01 (one reference slide) |
| DK-03 | DG-02, DG-03, DG-04 | DG-08, DG-09 |
| DK-04 | DG-02, DG-03, DG-04, DG-13 | DG-12, DG-05, DG-06 |
| DK-05 | None | DG-01 (one reference slide) |
| DK-06 | DG-04 | DG-14, DG-15 |
| DK-07 | DG-16 | DG-03 (deployment section) |

---

## File Location Convention

```
product/presentations/
├── presentation-plan.md       ← planning detail (deck-by-deck specs)
├── presentation-index.md      ← this file (registry)
├── DK-01_stakeholder-overview.pptx     (or .gslides link)
├── DK-02_demo-walkthrough.pptx
├── DK-03_architecture-deep-dive.pptx
├── DK-04_developer-onboarding.pptx
├── DK-05_mvp-execution-overview.pptx
├── DK-06_data-model-reference.pptx
└── DK-07_security-deployment.pptx
```

---

*Update this index when presentations are generated. Set status to ✅ and fill in the file path. Set to 📌 when the deck is reviewed and approved.*
