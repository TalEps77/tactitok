# Presentation Plan — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Date:** 2026-03-07
> **Source:** Cross-doc review pass (`product/reviews/01_cross-doc-review.md`)
> **Binding source of truth:** `product/north-star.md`

This file defines the planning layer for all presentation / deck artifacts for the TactiTok project. It specifies what decks should be created, for whom, and what each must cover. No slide content is generated here — only the planning layer.

---

## Blocker Summary

The following must be resolved before specific presentations can be finalized.

| Blocker | Affects decks | Resolution |
|---------|--------------|-----------|
| **B1** — Doc 06 (API Contract) not generated | DK-03 (architecture deep-dive), DK-04 (dev onboarding) | Generate doc 06 first |
| **B2** — Doc 07 (Delivery Plan) not generated | DK-04 (developer onboarding), DK-05 (execution overview) | Generate doc 07 first |
| **B3** — Diagrams not yet generated | All decks benefit from diagrams as visuals | Generate Pass 1 diagrams first (DG-01 to DG-04, DG-12, DG-13) |

---

## Required Presentations

These decks are mandatory — without them the project cannot be properly evaluated or understood by its target audiences.

---

### DK-01 — Stakeholder / Evaluator Overview Deck

| Field | Value |
|-------|-------|
| **Purpose** | Introduce TactiTok to non-technical evaluators and military stakeholders — what it is, why it exists, and what the MVP demonstrates |
| **Primary audience** | Military evaluators, project sponsors, non-technical stakeholders |
| **Secondary audience** | Academic supervisors |
| **Core message** | TactiTok is a viable, demoable approach to modern at-the-edge training delivery — and the MVP is ready for hands-on evaluation |
| **Format** | Presentation slides (PowerPoint / Google Slides); ~15–20 slides |
| **Source basis** | `north-star.md` §1–5, `01_product-brief.md` §2–8, `03_mvp-spec.md` §4, diagrams DG-01, DG-05, DG-08 |
| **Priority** | Required |
| **Status** | 🟡 Partially blocked (benefits from DG-01, DG-05, DG-08) |
| **Slide count range** | 15–20 |

**Suggested section outline:**

1. Cover: TactiTok — Training at the Edge
2. The Problem (3–4 bullets from North Star §2)
3. The Vision (one-liner + "TikTok for training" framing)
4. Who uses it (Fighter profile, HQ Staff profile)
5. Where it runs (field context: tablet, kiosk, constrained network)
6. Three core flows (Flow A: Reels, Flow B: Library, Flow C: Admin upload)
7. How it works — system overview (DG-01 System Context diagram)
8. The offline challenge and how it's solved (DG-08 simplified)
9. The MVP in action — demo walkthrough overview (15 demo steps summary)
10. What you can do in the demo (hands-on call-to-action)
11. What success looks like (success metrics from North Star §7)
12. What's next (continuation roadmap bullet summary)
13. Questions

---

### DK-02 — Demo Walkthrough Deck

| Field | Value |
|-------|-------|
| **Purpose** | Guide evaluators through the hands-on demo session — step-by-step what to do and what to expect |
| **Primary audience** | Demo facilitator (presenting to evaluators during live demo) |
| **Secondary audience** | Evaluators watching the demo |
| **Core message** | Here is exactly what you'll see and do in the next N minutes |
| **Format** | Slides; concise, large font, action-oriented; ~20 slides |
| **Source basis** | `03_mvp-spec.md` §4 (15-step demo script), `01_product-brief.md` §8 |
| **Priority** | Required |
| **Status** | 🟡 Partially blocked (needs screenshots/prototype for completeness; outline can start now) |
| **Slide count range** | 18–22 |

**Suggested section outline:**

1. Cover: TactiTok — Live Demo
2. What you'll experience today (3 flows: Reels, Library, Offline)
3. The demo setup (lab environment note; tablet shown; simulated conditions)
4–18. One slide per demo step (15 steps from MVP Spec §4 demo script):
   - Each slide: step number, action, what you'll see
19. Success criteria summary (D1–D7)
20. Q&A / hands-on time

---

### DK-03 — Architecture Deep-Dive Deck

| Field | Value |
|-------|-------|
| **Purpose** | Explain the technical architecture to technical evaluators, academic supervisors, and follow-on development teams |
| **Primary audience** | Technical evaluators, academic supervisors, future developers |
| **Secondary audience** | The 3 student developers (as a reference) |
| **Core message** | The MVP uses a clean, minimal architecture that solves hard offline constraints without overcomplicating the codebase |
| **Format** | Presentation slides; diagram-heavy; ~20–25 slides |
| **Source basis** | `02_system-boundaries.md`, `04_system-architecture.md`, `05_data-model.md`, diagrams DG-02, DG-03, DG-04, DG-08, DG-09 |
| **Priority** | Required |
| **Status** | 🟠 Partially blocked (needs diagrams DG-02 to DG-04 first; needs doc 06 for API section) |
| **Slide count range** | 20–25 |

**Suggested section outline:**

1. Cover: TactiTok — Architecture Deep-Dive
2. Architecture goals (AG1–AG6: simplicity, offline, single stack, demo-optimized)
3. System overview — what's in scope, what's out
4. The edge device challenge (why not just a browser? → Linux VM + Docker topology)
5. Three-tier architecture diagram (DG-02 Container view)
6. Deployment view (DG-03 — cloud VM processes, edge processes, ports)
7. The edge proxy — why nginx caching instead of Service Worker
8. How content reaches the edge (DG-05 simplified flow)
9. How offline works (DG-08 or DG-09 — cache states)
10. The data model — 9 entities, 2 storage locations (DG-04 ERD)
11. API surface overview (from doc 06 when available)
12. Technology stack choices (TypeScript monorepo, React, Node, PostgreSQL — AD1–AD12)
13. What was explicitly deferred and why (from §14 of Architecture)
14. Continuation architecture: how to extend without rewrites
15. Key risks and mitigations
16. Q&A

---

## Recommended Presentations

These decks add significant value but are not critical for the MVP evaluation milestone.

---

### DK-04 — Developer Onboarding Deck

| Field | Value |
|-------|-------|
| **Purpose** | Help new developers (or the 3 students) quickly understand the full system and how to set it up, build it, and navigate the codebase |
| **Primary audience** | The 3 student developers; follow-on development team |
| **Secondary audience** | Academic supervisors evaluating technical execution |
| **Core message** | Here's the system, how it fits together, what you build in what order, and where to find everything |
| **Format** | Slides; practical, reference-oriented; ~20–30 slides |
| **Source basis** | `04_system-architecture.md` §6 (monorepo), `05_data-model.md`, `07_delivery-plan.md` (when available), diagrams DG-02, DG-03, DG-04, DG-13 |
| **Priority** | Recommended |
| **Status** | 🟠 Blocked (B2 — needs doc 07 for sprint structure; B1 — needs doc 06 for API section) |
| **Slide count range** | 20–30 |

**Suggested section outline:**

1. Cover: TactiTok — Developer Onboarding
2. The product in 2 minutes (problem → solution → 3 flows)
3. The architecture in 2 minutes (DG-01 system context)
4. What you're building: 5 packages (DG-13 monorepo structure)
5. How to set up the dev environment (from delivery plan)
6. The edge device topology — why it's different (DG-03)
7. The data model (DG-04 ERD — server entities)
8. The data model (DG-04 ERD — edge local entities)
9. The API surface (from doc 06)
10. Key architectural decisions to internalize (AD1–AD12 summary)
11. What is explicitly out of scope (de-scope lever list)
12. Sprint plan overview (from doc 07)
13. What to build first and why (from doc 07 sprint 1)
14. How to run the system locally
15. How to deploy to the cloud VM
16. How to deploy the edge proxy Docker image
17. The demo script — know it by heart (15 steps)
18. Key risks to watch for (top 5 from architecture + MVP spec)
19. Continuation notes — what comes after you
20. Q&A / Where to find everything

---

### DK-05 — MVP Execution Overview Deck

| Field | Value |
|-------|-------|
| **Purpose** | Communicate the delivery plan, sprint structure, milestones, and risk management to project stakeholders and supervisors |
| **Primary audience** | Academic supervisors, project sponsors, team leads |
| **Secondary audience** | The 3 student developers |
| **Core message** | The team has a realistic, milestone-driven plan to deliver a demoable MVP in 10 weeks with defined de-scope levers |
| **Format** | Slides; milestone-focused; ~15–18 slides |
| **Source basis** | `07_delivery-plan.md` (when available), `03_mvp-spec.md` §13 (de-scope levers), `01_product-brief.md` §12–13 (assumptions and risks) |
| **Priority** | Recommended |
| **Status** | 🔴 Blocked (B2 — entirely depends on doc 07) |
| **Slide count range** | 15–18 |

**Suggested section outline:**

1. Cover: TactiTok MVP — Execution Plan
2. MVP objective and demo target (from MVP Spec §2–3)
3. Team and timeline (3 developers, 10 weeks MVP + 12 weeks total)
4. Sprint overview (from doc 07 — sprint count, names, goals)
5–N. One slide per sprint (sprint N: goal, deliverables, risks)
N+1. De-scope levers (ordered priority list — what to cut if behind)
N+2. Key risks and mitigations (top 5)
N+3. Acceptance criteria summary (AC-1 to AC-12)
N+4. Demo milestone (what hands-on success looks like)
N+5. What happens after MVP (continuation roadmap)
N+6. Q&A

---

## Optional Presentations

These decks serve specific audiences or purposes but are not needed for the MVP evaluation.

---

### DK-06 — Data Model Reference Deck

| Field | Value |
|-------|-------|
| **Purpose** | Detailed walkthrough of all 9 entities, their fields, constraints, and relationships — for developers during implementation |
| **Primary audience** | The 3 student developers |
| **Format** | Reference slides; ~15 slides |
| **Source basis** | `05_data-model.md` §5–12, diagram DG-04 |
| **Priority** | Optional |
| **Status** | 🟢 Unblocked |
| **Slide count range** | 12–18 |

---

### DK-07 — Security & Deployment Posture Deck

| Field | Value |
|-------|-------|
| **Purpose** | Communicate the security posture, trust zones, and demo environment security setup to evaluators who care about content sensitivity |
| **Primary audience** | Security reviewers, military evaluators |
| **Format** | Reference slides; ~10 slides |
| **Source basis** | `02_system-boundaries.md` §10, `04_system-architecture.md` §11, diagram DG-16 |
| **Priority** | Optional |
| **Status** | 🟢 Unblocked |
| **Slide count range** | 8–12 |

---

## Presentation Generation Order

When generating presentations, follow this order:

**Step 1 — Generate Pass 1 diagrams first** (DG-01, DG-02, DG-03, DG-04, DG-12, DG-13)

**Step 2 — Generate required decks:**
1. DK-01 Stakeholder / Evaluator Overview (depends on diagrams)
2. DK-02 Demo Walkthrough (depends on screenshots/prototype)
3. DK-03 Architecture Deep-Dive (depends on diagrams + doc 06)

**Step 3 — Generate remaining diagrams** (DG-05–DG-11)

**Step 4 — Generate recommended decks:**
4. DK-04 Developer Onboarding (depends on doc 06 + doc 07)
5. DK-05 MVP Execution Overview (depends on doc 07)

**Step 5 — Generate optional decks as needed:**
6. DK-06 Data Model Reference
7. DK-07 Security & Deployment Posture

---

## Output Conventions

- **Format:** PowerPoint (`.pptx`) or Google Slides — team to decide
- **Template:** No template defined yet; apply project color scheme / branding when decided
- **File location:** `product/presentations/{ID}_{slug}.pptx` or link to shared Slides
- **Naming:** ID is DK-NN (two digits), slug is lowercase with hyphens
- **Slide master:** Create one shared slide master for DK-01, DK-02, DK-03 (evaluator-facing); separate simpler master for DK-04, DK-05, DK-06 (internal)

---

## Assumptions for This Planning Layer

| # | Assumption | Impact if wrong |
|---|-----------|----------------|
| PA1 | Diagram format = Mermaid; exports = PNG/SVG | If a different tool is chosen, file references in presentations will differ |
| PA2 | Presentation format = PowerPoint or Google Slides | If a different format is required, slide count estimates may shift |
| PA3 | Primary evaluator audience is non-technical (military stakeholders) | If evaluators are technical, DK-01 and DK-03 merge or DK-03 is elevated to Required |
| PA4 | Demo deck (DK-02) requires prototype screenshots | If screenshots are not available at generation time, use placeholder slide frames |
| PA5 | Language of all presentations = English | Matches D18 (English UI); consistent with single-language decision |

---

*Update this plan when docs 06 and 07 are generated. Re-check status of DK-03, DK-04, and DK-05 after those documents are available.*
