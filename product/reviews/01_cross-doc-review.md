# Cross-Document Review — TactiTok

> **Version:** 0.1
> **Status:** Draft
> **Date:** 2026-03-07
> **Author:** Automated planning pass (prompt: `08_cross-doc-visuals-planning`)
> **Binding source of truth:** `product/north-star.md`
> **Purpose:** Normalize the 5 substantive documents, surface actionable issues, and establish the planning baseline for diagram and presentation artifact generation.

---

## 1. Purpose of This Review

This review reads the full available TactiTok document set as one coherent source base and answers:

- Are the 5 substantive documents (docs 01–05) internally consistent?
- Do they consistently reflect the North Star?
- What must be resolved before diagrams or presentations are generated?
- What terminology needs standardization?
- What is missing or ambiguous at a level that will cause problems downstream?

This is a **product-side normalization pass** — not a design or code review.

---

## 2. Documents Reviewed

| # | File | Version | Status | Substantive? |
|---|------|---------|--------|-------------|
| NS | `product/north-star.md` | v0.1 | Binding | ✅ Yes |
| 01 | `product/01_product-brief.md` | v0.1 | Draft | ✅ Yes |
| 02 | `product/02_system-boundaries.md` | v0.2 | Draft | ✅ Yes |
| 03 | `product/03_mvp-spec.md` | v0.1 | Draft | ✅ Yes |
| 04 | `product/04_system-architecture.md` | v0.2 | Draft | ✅ Yes |
| 05 | `product/05_data-model.md` | v0.2 | Draft | ✅ Yes |
| 06 | `product/06_api-contract.md` | — | **Placeholder** | ❌ Not generated |
| 07 | `product/07_delivery-plan.md` | — | **Placeholder** | ❌ Not generated |
| N | `notes/assumptions.md` | — | Active | ✅ Yes |
| N | `notes/decisions.md` | — | Active | ✅ Yes |
| N | `notes/open-questions.md` | — | Active | ✅ Yes |

**Critical state:** The 7-document set is **not complete**. Docs 06 and 07 are stubs. All findings below are based on docs 01–05 and the North Star.

---

## 3. High-Confidence Alignments

The following areas are **consistently specified** across all reviewed documents and align with the North Star:

- **Two-surface architecture** — edge SPA + admin portal — is described consistently in NS, 01, 02, 03, 04, and 05.
- **Edge device topology (v0.2)** — Windows + Linux VM + Docker + nginx proxy — is correctly propagated into 02, 04, 05, and notes. No residual v0.1 references remain in substantive docs.
- **No user authentication on edge** — kiosk/anonymous model with device profile is consistent across all 5 docs.
- **Content types: video (MP4, ≤3 min) and PDF only** — consistent in NS, 01, 02, 03, 04, 05.
- **Content delivery: MP4 + HTTP range requests (no HLS/DASH)** — consistent in 01 (Q1 resolved), 04, 05; decision D28 is final.
- **Offline model: edge proxy cache (nginx) for files + IndexedDB for device state** — consistent across 02, 04, 05 after v0.2 update; no Service Worker, no Cache API.
- **Catalog sync: pull-only, full snapshot, on app open + manual refresh** — consistent in 02, 03, 04, 05; decision D17/D34 are final.
- **Admin portal: simple shared password, no RBAC** — consistent in 01, 02, 03, 04.
- **Interest model: admin-managed flat list, independent of categories** — consistent in 01, 03, 05; decision D35 is final.
- **Category model: 2-level hierarchy, parent-id pattern** — consistent in 01, 03, 04, 05.
- **Technology stack: TypeScript monorepo, React (SPAs), Node.js + Express, PostgreSQL, nginx, Docker** — consistent in 04; tech decisions D24–D34, D41–D46 are all reflected in 04 and 05.
- **Demo corpus: 10 PDFs + 5 videos** — consistent in 01, 03; decision D9 is final.
- **De-scope order** — consistent priority ordering in 01, 02, 03, 04, 05 (updated badge → like/save → interest filtering → category admin → search → PDF → offline).
- **Continuation notes** — all 5 docs include explicit continuation guidance pointing to the same post-MVP features: user identity, push sync, S3, CDN, recommendation engine, analytics.

---

## 4. Contradictions / Inconsistencies

### C1 — "Updated" badge scope (UNRESOLVED — BLOCKER)

**Severity:** High — affects UI design, data model logic, and sequence diagrams.

| Document | What it says |
|----------|-------------|
| MVP Spec Journey 3 Step 8 | "If content has been updated since last metadata sync, badge is visible" — implies all library items |
| MVP Spec Out-of-Scope item 17 | No mention of limiting to downloads |
| Data Model §9.3 | "for MVP simplicity, badge shows only on downloaded items where the version mismatch is clear" |
| Open Question Q23 | Formally open: "all items in library, or only on downloaded items?" |

- **Conflict:** Spec implies all items; data model implies downloads-only.
- **Impact:** Different logic complexity. All-items requires tracking "last seen version" per item (adds a `seenVersions` map to IndexedDB). Downloads-only is simpler (compare `DownloadRecord.version` to `CachedCatalog` version).
- **Recommendation:** Close Q23. Proposed default: **downloads-only for MVP** (simpler; less IndexedDB data; spec language was ambiguous, not a design decision).
- **Must resolve before:** Library view diagram, edge client sequence diagrams, UI implementation.

---

### C2 — Stale assumption A23 in notes/assumptions.md

**Severity:** Medium — creates confusion for developers reading notes.

- **A23 text:** "IndexedDB + Cache API provide enough storage for 15 downloaded items in kiosk Chrome"
- **Superseded by:** Decisions D43, D44, D45 (Cache API eliminated; edge proxy cache handles all content storage)
- **Fix:** Update A23 to reflect that Cache API is no longer used; the constraint is now about edge proxy cache disk space (10 GB) and IndexedDB storage for metadata records only.
- **Must fix before:** Developer handoff; notes should be accurate.

---

### C3 — Prefetch mechanism description gap

**Severity:** Low — not a true contradiction, but language is inconsistent.

| Document | What it says |
|----------|-------------|
| MVP Spec CAP-2.4 | "Video prefetch (buffer first N seconds of next video)" |
| Architecture §9.7 | Fetch with `Range: bytes=0-{N}` triggers proxy to cache **full file** |

- **Gap:** The MVP Spec describes prefetch as "first N seconds buffer." The architecture describes a range request that causes the proxy to cache the entire file. The result is that "prefetch" is actually "trigger full file caching + provide first N bytes to Chrome." This is not a contradiction — the outcome is better than described — but the two documents use different mental models.
- **Impact:** Diagram for prefetch flow must be precise about what happens at the proxy vs. in the browser.
- **Recommendation:** Clarify in a note; add a comment in the diagram when generated.

---

### C4 — Cache invalidation gap on content update

**Severity:** Medium — architectural gap with user-visible impact.

- **Current state:** When HQ admin updates a content file (version++), the edge proxy cache holds the old file for up to 30 days (cache validity setting). The "updated" badge will appear (version mismatch), but clicking "view" may serve the stale cached file.
- **No document addresses** how the edge proxy is told to invalidate cached content files on update.
- **Options not yet decided:** (a) include a version string in the content URL so new version → new cache key; (b) short-lived content cache validity; (c) cache-busting query param on update; (d) proxy-side cache purge API.
- **Impact:** If unresolved, the offline flow diagram will be inaccurate (it shows correct behavior, but the actual behavior may differ for updated content).
- **Recommendation:** Decide cache-busting strategy before architecture is finalized. Simplest MVP approach: include version in content URL (`/api/content/{id}/file?v={version}`) so updates always produce a cache miss.
- **Must resolve before:** Offline/sync flow diagram, content delivery sequence diagram.

---

### C5 — "Saved" items — no UI surface for recall

**Severity:** Low-Medium — feature exists in data model with no UX home.

| Document | What it says |
|----------|-------------|
| MVP Spec CAP-2.8 | Save/bookmark button | Should priority |
| MVP Spec Out-of-Scope 18 | "Saved items view (separate from Downloads) — Like/Save are indicators only in MVP" |
| Open Question Q17 / MQ5 | "Marked in Library with a filter toggle; no separate view" — **recommended default, not a decision** |

- **Gap:** The Save button exists (Should priority), LocalAction stores save state, but Q17 is not formally closed as a decision. If Save is implemented with no recall UI, it's a "write-only" feature with no user value.
- **Recommendation:** Either (a) close Q17 as decision D47: "Saved filter toggle in Library — Should priority"; or (b) drop Save button to Could/de-scope. The data model already supports it.
- **Must resolve before:** Library view diagram, UI navigation diagram.

---

### C6 — Like button — no recall or display surface

**Severity:** Low — same structural issue as C5 for Like.

- Like is a Should-priority capability (CAP-2.7) with no display surface in any diagram or journey (what does the user see that reflects their likes?).
- The data model stores `LocalAction` with `action='like'` but no query path surfaces "liked content" to the user.
- **Recommendation:** For MVP, Like is a vanity interaction (heart animates, state persists locally, no recall). This is acceptable if clearly documented. Should be stated explicitly in MVP Spec and reflected in diagrams.

---

### C7 — Video duration validation mechanism unspecified

**Severity:** Low — implementation detail gap.

- MVP Spec CAP-6.12: "Video duration validation (reject >3 min) | Should"
- Architecture upload flow makes no mention of how duration is checked.
- Without transcoding, duration must be read from the uploaded file (e.g., ffprobe or a Node.js library like `fluent-ffmpeg`). This is a non-trivial dependency.
- **Recommendation:** Either (a) accept it as a Should and implement with a lightweight library; or (b) de-scope to validation by trust (admin is responsible for uploading ≤3 min clips). The upload flow diagram should reflect whichever is chosen.

---

## 5. Missing or Weakly Specified Areas

### M1 — API Contract (doc 06) is missing — CRITICAL

- All sequence diagrams, content delivery flows, and admin workflow diagrams depend on specific endpoint shapes.
- The architecture implies these endpoints: `GET /api/catalog`, `GET /api/content/{id}/file`, `GET /api/content/{id}/thumbnail`, `POST /api/admin/content`, `PUT /api/admin/content/{id}`, `DELETE /api/admin/content/{id}`, `GET/POST/PUT/DELETE /api/admin/categories`, `GET/POST/PUT/DELETE /api/admin/interests`, `POST /api/admin/login`.
- **Cannot finalize sequence diagrams without doc 06.**

### M2 — Delivery Plan (doc 07) is missing

- Sprint structure, milestones, and task breakdown are needed for:
  - Developer onboarding deck (what to build in what order)
  - Execution overview deck (timeline for stakeholders)
  - Dependency diagram (what blocks what in implementation)
- **Cannot generate delivery/execution diagrams or dev onboarding deck until doc 07 exists.**

### M3 — Thumbnail serving endpoint not explicit

- Data Model and Architecture both reference `thumbnailPath` and `/api/content/{id}/thumbnail` in cache tables.
- No document explicitly defines this as an API endpoint or whether thumbnails are optional in the response payload.
- **Recommendation:** Explicit in API Contract (doc 06).

### M4 — Orphaned record cleanup not in MVP Spec

- Data Model §7 states edge client should clean up orphaned `DownloadRecords` and `LocalActions` on sync when content is deleted server-side.
- This behavior is **not captured as a capability in MVP Spec** (no CAP entry, no acceptance criterion).
- **Recommendation:** Add as CAP-7.7 or note as an implicit behavior of the metadata sync flow.

### M5 — Admin portal URL structure not specified

- The admin portal is on the cloud server, but the URL path (e.g., `/admin`, separate subdomain, or root) is not specified in any document.
- Minor for most diagrams but needed for deployment diagrams and presentation demos.

### M6 — "Last synced" timestamp display not specified

- CAP-1.9 (Should) and CAP-7.6 (Should) both specify showing "last synced" timestamp.
- No document specifies where in the UI this is shown (header? settings screen? subtle indicator?).
- Not a blocker for product diagrams, but affects UI flow diagrams.

---

## 6. Terminology / Glossary Normalization Issues

The following terms are used inconsistently across documents. A canonical term is proposed for each.

| Area | Non-canonical usages found | Canonical term | Action |
|------|--------------------------|----------------|--------|
| Training tag | "tag," "interest tag," "tags/interests" | **interest** | Standardize to "interest" everywhere; "tag" is informal only |
| Content identifier | "item," "content," "content item," "piece" | **content item** | Use "content item" in product docs; "item" acceptable in lists |
| Edge application | "edge client," "edge SPA," "edge app," "Edge SPA" | **Edge SPA** (technical), **edge app** (user-facing) | Use Edge SPA in technical docs (04, 05, 06); "edge app" in user-facing docs (01, 03) |
| Catalog fetch | "metadata sync," "catalog sync," "metadata pull" | **catalog sync** | Standardize to "catalog sync" — more precise than "metadata sync" (metadata could mean anything) |
| Backend | "server," "cloud server," "API server," "cloud VM" | **cloud server** (system boundary level), **API server** (component level) | Maintain distinction: "cloud server" for infrastructure, "API server" or "API" for the Node.js component |
| Local save | "Download," "local download," "save for offline" | **download** (the action), **downloaded item** (the result) | "Download" is correct; avoid "local download" redundancy |

---

## 7. Implications for Diagrams

- **System context diagram** — fully supportable from docs 01–02. Actors, surfaces, network boundaries are all clear.
- **Container/component architecture diagram** — fully supportable from docs 02 and 04. The three-tier topology (cloud VM, edge Docker, Chrome on Windows) is precise.
- **Deployment/runtime view** — fully supportable from doc 04 §8. Process model, port model, Docker structure are all specified.
- **Content upload flow (sequence)** — partially blocked: architecture §9.1 gives the outline; needs API endpoint details from doc 06 for full accuracy.
- **Catalog sync flow (sequence)** — largely supportable from docs 02, 03, 04. Minor detail needed from doc 06.
- **Video playback / prefetch flow (sequence)** — supportable from doc 04 §9.3 and §9.7. C3 (prefetch language gap) should be noted in diagram.
- **Download + offline flow (sequence)** — supportable from docs 04 §9.4–9.6. C4 (cache invalidation gap) must be resolved first for accuracy on "updated content" sub-flow.
- **Data model / ERD** — fully supportable from doc 05. Well-specified.
- **Library browse & search flow** — partially blocked by C1 ("updated" badge scope must be resolved first).
- **Admin CRUD flow** — blocked by doc 06 (API endpoint shapes needed).
- **First-time setup / interest selection flow** — fully supportable from docs 01, 03.
- **Offline capability matrix diagram** — fully supportable from doc 04 §10.2.
- **Network state diagram** — fully supportable from docs 02 and 04.

---

## 8. Implications for Presentations

- **Stakeholder / evaluator overview deck** — fully supportable from docs 01–04. North Star, problem statement, flows, architecture overview.
- **Architecture deep-dive deck** — fully supportable from docs 02, 04. Needs diagrams to be complete first.
- **Developer onboarding deck** — **blocked by doc 07** (delivery plan / sprint structure needed). Can draft sections on architecture and data model but not the "what to build first" section.
- **Demo walkthrough deck** — supportable from doc 03 §4 (15-step demo script). Needs screenshots/prototype to be complete.
- **MVP execution overview** — **blocked by doc 07** (sprint timeline, milestones).

---

## 9. Priority Fixes Before Downstream Artifact Generation

Ordered by urgency:

| Priority | Issue | What it blocks | Action |
|----------|-------|---------------|--------|
| **P1** | Doc 06 (API Contract) not generated | All sequence diagrams; admin flow diagrams; presentation API sections | Generate doc 06 using `prompts/claude/06_api-contract_prompt.md` |
| **P2** | Doc 07 (Delivery Plan) not generated | Developer onboarding deck; execution overview deck; sprint/milestone diagrams | Generate doc 07 using `prompts/claude/07_delivery-plan_prompt.md` |
| **P3** | C1 — "Updated" badge scope (Q23) unresolved | Library view diagram; edge client sequence diagrams | Close Q23: proposed default = downloads-only for MVP |
| **P4** | C4 — Cache invalidation on content update unspecified | Offline/sync flow diagram; content delivery sequence diagram | Decide cache-busting strategy; simplest: version in URL |
| **P5** | C5 — "Saved" items has no UI surface decision | Library view diagram; navigation diagram | Close Q17 as a formal decision |
| **P6** | C2 — Stale assumption A23 in notes | Developer reference accuracy | Update A23 in `notes/assumptions.md` |
| **P7** | M4 — Orphaned record cleanup not in MVP Spec | Sync flow diagram accuracy | Add as capability or implicit behavior note in doc 03 |
| **P8** | C7 — Video duration validation mechanism | Upload flow diagram | Decide: implement with library or defer to admin trust |

---

## 10. Open Questions / Pending Decisions

| # | Question | Source | Blocks | Recommended default |
|---|---------|--------|--------|-------------------|
| Q23 | Updated badge — all library items or downloaded items only? | Data Model §9.3 vs MVP Spec J3S8 | Library diagram, sequence diagrams | Downloads-only (simpler) |
| Q17 | Saved items — filter toggle in Library or no recall surface? | MQ5 / C5 | Navigation diagram | Filter toggle in Library (Should priority) |
| Q5 | Minimum demo security posture — network isolation only, or admin password too? | Notes OQ Q5 | Deployment diagram, demo prep | Both |
| Q11 | TLS: Let's Encrypt, self-signed, or organizational cert? | Notes OQ Q11 | Deployment diagram | Let's Encrypt if domain; self-signed fallback |
| Q18 | ORM: Prisma vs. Knex vs. raw SQL? | Notes OQ Q18 | Architecture finalization | Prisma |
| Q21 | Reels scroll: CSS scroll-snap vs. Swiper.js? | Notes OQ Q21 | Reels UX diagram | CSS scroll-snap first |
| Q26 | Linux VM type: WSL2 vs. VirtualBox? | Notes OQ Q26 | Deployment diagram | WSL2 |
| NEW | Cache-busting strategy for updated content files | C4 | Offline/sync flow diagram | Version in content URL |
| NEW | Video duration validation mechanism (ffprobe or admin trust)? | C7 | Upload flow diagram | Admin trust for MVP (Should → de-scoped) |

---

## 11. Continuation Notes

- Once docs 06 and 07 are generated, re-run this cross-doc review to verify consistency before diagram generation begins.
- The v0.2 topology change (edge proxy in Docker) was correctly propagated into all substantive documents. This is the canonical architecture — do not regress to the v0.1 direct-browser model in any diagram.
- The 9 entities in the data model (5 server, 4 edge) are well-specified and should be the primary source for ERD generation.
- The 15-step demo script in MVP Spec §4 is the primary source for demo walkthrough presentation content.
- Terminology standardization (section 6) should be applied when generating diagrams and presentations — not retroactively to existing docs.

---

*This review is the first artifact in the TactiTok visuals planning pass. It feeds into: `product/visuals/diagram-todo.md`, `product/visuals/diagram-index.md`, `product/presentations/presentation-plan.md`, `product/presentations/presentation-index.md`.*
