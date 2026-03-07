# Cross-Document Review — TactiTok

> **Version:** 0.3
> **Status:** Draft
> **Date:** 2026-03-07
> **Author:** Automated planning pass (prompt: `08_cross-doc-visuals-planning`)
> **Change from v0.2:** Round 3 fixes applied. N1 and N2 resolved in `product/06_api-contract.md` v0.2 (`GET /api/health` added; content URL changed to `?v={version}` for proxy cache-busting). Q23 closed as D60 (downloads-only badge). Q17 closed as D61 (indicators-only, no recall surface). D62 and D63 added to decisions.md. All priority fixes P1–P4 resolved. DG-07, DG-08, DG-09, DG-10 now unblocked.
> **Binding source of truth:** `product/north-star.md`

---

## 1. Purpose of This Review

This review reads the full TactiTok document set (all 7 core documents + North Star + notes) as one coherent source base and answers:

- Are all 7 documents internally consistent and consistent with the North Star?
- What must be resolved before diagrams or presentations are generated?
- What terminology needs standardization?
- What is still missing or ambiguous at a level that will cause problems downstream?

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
| 06 | `product/06_api-contract.md` | v0.2 | Draft | ✅ Yes |
| 07 | `product/07_delivery-plan.md` | v0.1 | Draft | ✅ Yes |
| N | `notes/assumptions.md` | — | Active | ✅ Yes |
| N | `notes/decisions.md` | — | Active | ✅ Yes |
| N | `notes/open-questions.md` | — | Active | ✅ Yes |

**All 7 core documents are now substantive.** The document set is complete.

---

## 3. High-Confidence Alignments

The following areas are **consistently specified** across all documents and align with the North Star:

- **Two-surface architecture** (edge SPA + admin portal) — consistent in NS, 01, 02, 03, 04, 05, 06, 07.
- **Edge device topology v0.2** (Windows + Linux VM + Docker + nginx proxy) — correctly propagated into 02, 04, 05, 07; notes decisions D41–D46 match.
- **No user authentication on edge** — kiosk/device-profile model consistent across all documents. Public edge API endpoints explicit in doc 06 §4.2.
- **Content types: MP4 video (≤3 min) and PDF only** — consistent in NS, 01, 02, 03, 04, 05, 06, 07.
- **Video delivery: MP4 + HTTP range requests** — explicit in 04, 06; decision D28; confirmed in 07 Sprint 2.
- **Offline model: edge proxy cache (nginx) for files + IndexedDB for device state** — consistent across 02, 04, 05, 06 §10, 07 Sprint 4; decisions D41–D45.
- **Catalog sync: pull-only, full snapshot, on app open + manual refresh** — consistent in 02, 03, 04, 05, 06 §10.1–10.2, 07 Sprint 3 Week 3; decision D47 (`?since` accepted but returns full catalog in MVP, D50).
- **Admin portal: JWT auth, shared password, no RBAC** — consistent in 01, 02, 03, 04, 06 §4.1, 07 Sprint 1; decision D48.
- **File upload: multipart/form-data, 100 MB limit, MIME + magic-byte validation** — consistent in 03, 04, 06 §11, 07 Sprint 5; decisions D49, D52.
- **Interest model: admin-managed flat list, independent of categories** — consistent in 01, 03, 05, 06 §7.4, 07; decision D35.
- **Category model: 2-level hierarchy, parent-id, cascade-delete children** — consistent in 01, 03, 05, 06 §7.3, 07; decisions D23, D51.
- **Orphan cleanup on sync** — explicit in 06 §10.4, confirmed in 07 Sprint 4 Week 8; consistent with data model.
- **Technology stack** — TypeScript monorepo, React, Node/Express, PostgreSQL, nginx, Docker — consistent in 04, 07; decisions D24–D34, D41–D59.
- **Demo corpus: 10 PDFs + 5 videos** — consistent in 01, 03, 07 Sprint 6; decision D9.
- **De-scope order** — lever priority consistent across 01, 02, 03, 04, 07 §8 and §13; decision D57.
- **Thumbnail endpoint** — defined in 06 §6.3; consistent with data model `thumbnailPath` field.
- **ETag format** `"{version}-{id}"` — defined in 06 §6.2; consistent with data model version field and the "updated" badge mechanism (version comparison).
- **Delivery timeline** — 6 × 2-week sprints, 12 weeks total — consistent with North Star §8.
- **Role split** — Dev A (backend), Dev B (edge SPA), Dev C (admin SPA) — internally consistent in 07; decision D54.
- **Continuation notes** — all 7 documents include consistent forward-compatibility guidance: delta sync, user auth, adaptive streaming, S3, CDN, push sync.

---

## 4. Contradictions / Inconsistencies

### C1 — "Updated" badge scope *(RESOLVED — D60)*

**Severity:** ~~High~~ → Resolved.
**Resolution:** Closed as D60 — **downloads-only**. Compare `DownloadRecord.version` to `CatalogResponse.items[].version` on catalog sync. Badge appears only on items in the Downloads tab where a version mismatch is detected. MVP Spec Step 8 language ("badge is visible") is interpreted as applying only to downloaded items in context. No action needed.

| Document | What it says |
|----------|-------------|
| MVP Spec Journey 3 Step 8 | "If content has been updated since last metadata sync, badge is visible" — interpreted as downloaded items in context |
| Data Model §9.3 | "badge shows only on downloaded items where version mismatch is clear" ✅ |
| API Contract §10.3 | "compares `DownloadRecord.version` with catalog version for each downloaded item" ✅ |
| Open Question Q23 | ✅ **RESOLVED → D60** (2026-03-07) |

No diagram action required beyond using downloads-only logic in DG-07 and DG-08.

---

### C2 — Stale assumption A23 *(RESOLVED in v0.1 pass)*

Assumption A23 in `notes/assumptions.md` was updated to reflect that Cache API is no longer used. No further action needed.

---

### C3 — Prefetch mechanism description gap *(LOW SEVERITY — no action required)*

- Delivery plan Sprint 3 Week 6 now provides implementation detail: "when current video reaches 30% playback, issue a `Range: bytes=0-{N}` request for the next video in the feed. Store the partial response in memory."
- This is consistent with Architecture §9.7. The language difference (MVP Spec says "buffer N seconds"; Architecture says "range request triggers proxy to cache full file") is a level-of-abstraction difference, not a contradiction.
- **No action needed.** Note the distinction in the prefetch flow diagram (DG-06) when generated.

---

### C4 — Cache invalidation for updated content files *(RESOLVED — D62)*

**Severity:** ~~Medium (residual)~~ → Resolved.
**Resolution:** Content file URL now includes `?v={version}` query param (D62). Server ignores it; nginx uses it as a distinct cache key. A version bump = new URL = cache miss = fresh fetch from cloud. Doc 06 updated to v0.2: content file endpoint is `GET /api/content/{id}/file?v={version}`. ETag rationale in D53 corrected to clarify ETag handles browser-level caching only; proxy cache-busting is via `?v`. Demo Step 15 now works correctly end-to-end.

---

### C5 — "Saved" items — no confirmed UI surface *(RESOLVED — D61)*

**Severity:** ~~Low-Medium~~ → Resolved.
**Resolution:** Closed as D61 — **indicators only in MVP, no recall surface**. Save and Like buttons store a `LocalAction` record in IndexedDB; no "Saved" filter or sub-view is implemented in MVP. This is consistent with MVP Spec OOS-18. Continuation item. Q17 marked resolved in `notes/open-questions.md`.

No diagram action required beyond omitting the "Saved" filter path from DG-07.

---

### C6 — Like button — no recall surface *(LOW SEVERITY — accepted pattern)*

- Delivery plan Sprint 3 Week 5 confirms Like button: "toggle `LocalAction` in IndexedDB; update icon state."
- Like has no recall surface (no "liked content" view). This is consistent with MVP Spec Out-of-Scope and data model.
- **Accepted pattern:** Like is a "vanity interaction" (tap → heart fills → state persists locally). Document this explicitly once rather than reopening the issue.
- No action needed for diagrams; note it in the edge SPA interaction diagram if generated.

---

### C7 — Video duration validation *(SUBSTANTIALLY RESOLVED)*

- Delivery plan Sprint 5 Week 9: "Video duration validation: parse MP4 duration using `ffprobe` or a JS library (`mp4-box` / `mp4-parser`); reject if > 180s."
- API Contract §6.1 (POST /api/admin/content): "Duration > 180 seconds → `400` (if duration parsing is implemented; treat as soft constraint if not ready in sprint)."
- **Resolved as:** Should-priority with a concrete implementation path. Treat as soft constraint if Sprint 5 runs behind — consistent with API contract language.
- **No further action needed.**

---

### C8 — Edge-proxy package ownership inconsistency *(LOW SEVERITY — new finding)*

| Document | What it says |
|----------|-------------|
| Delivery Plan §2 (package ownership table) | `packages/edge-proxy`: **Dev B** |
| Delivery Plan Sprint 1 Week 1 (Dev C section) | Dev C sets up Dockerfile + nginx.conf for edge proxy |

- **Minor inconsistency:** Week 1 assigns the initial edge-proxy scaffold to Dev C; the ownership table assigns it to Dev B.
- **Likely intent:** Dev C scaffolds in Week 1 (as part of the admin SPA sprint 1 task); Dev B takes ownership for deeper edge-proxy work in Sprints 3–4.
- **Recommendation:** Clarify in delivery plan — e.g., note "Dev C bootstraps in Week 1; Dev B owns from Sprint 2 onward." Not a blocker for any diagram.

---

## 5. Missing or Weakly Specified Areas

### N1 — `GET /api/health` endpoint missing from API contract *(RESOLVED — D63)*

**Severity:** ~~Medium~~ → Resolved.
**Resolution:** `GET /api/health` added to `product/06_api-contract.md` v0.2 as section 6.0 (before catalog). Public endpoint, no auth, `proxy_cache off` at edge proxy. Returns `{ status: 'ok', timestamp: string }`. Total endpoint count updated to 21. D63 added to decisions.md.

---

### N2 — nginx proxy_cache not invalidated by ETag for same URL *(RESOLVED — D62)*

**Severity:** ~~Medium-High~~ → Resolved.
**Resolution:** Implemented Option A — version in content URL. `product/06_api-contract.md` v0.2 updated: content file endpoint is now `GET /api/content/{id}/file?v={version}`. Server ignores `?v`; nginx `proxy_cache` uses full `$request_uri` (including query string) as cache key. Version bump = new URL = cache miss = fresh fetch. D62 added to decisions.md. D53 rationale corrected. Old `?v=` entries expire after 30-day TTL (negligible disk impact for ≤15 items).

This was the highest-priority issue (demo risk at Step 15). Now resolved.

---

### M5 — Admin portal URL path not specified *(LOW SEVERITY — unchanged)*

- Not blocking any core diagrams; admin portal is accessible at `https://{CLOUD_DOMAIN}` from the API contract base URLs table. Admin SPA URL structure (e.g., `/admin` path vs. root) is still not specified.
- **Acceptable gap for MVP diagrams.** Resolve before deployment.

---

### M6 — "Last synced" timestamp display location *(LOW SEVERITY — unchanged)*

- CAP-1.9 and CAP-7.6 specify the feature; Sprint 4 Week 8 (Dev B) implements it. No doc specifies the exact UI location.
- Not a blocker for product-level diagrams.

---

## 6. Terminology / Glossary Normalization Issues

*(Unchanged from v0.1 — standardization has not been applied to existing docs.)*

| Area | Non-canonical usages found | Canonical term | Status |
|------|--------------------------|----------------|--------|
| Training tag | "tag," "interest tag," "tags/interests" | **interest** | Apply in new artifacts only |
| Content identifier | "item," "content," "content item," "piece" | **content item** | Apply in new artifacts only |
| Edge application | "edge client," "edge SPA," "edge app" | **Edge SPA** (technical), **edge app** (user-facing) | Apply in new artifacts only |
| Catalog fetch | "metadata sync," "catalog sync," "metadata pull" | **catalog sync** | Apply in new artifacts only |
| Backend | "server," "cloud server," "API server," "cloud VM" | **cloud server** (infra level), **API server** (component level) | Apply in new artifacts only |
| Local save | "Download," "local download," "save for offline" | **download** (action), **downloaded item** (result) | Apply in new artifacts only |

Do not retroactively edit existing documents for terminology only. Apply canonical terms in all newly generated artifacts (diagrams, presentations).

---

## 7. Implications for Diagrams

**Status changes from v0.1 and v0.2:**

| Diagram | Previous status | Updated status | Why |
|---------|----------------|---------------|-----|
| DG-05 Content Publishing Flow | 🟡 Partial (B1) | 🟢 **Unblocked** | API endpoints fully defined in doc 06 |
| DG-06 Reels Feed / Video Playback | 🟡 Partial (B1) | 🟢 **Unblocked** | API endpoints defined; prefetch detail in doc 07 |
| DG-07 Library Browse & Search | 🟠 Blocked (B3, B5) | 🟢 **Unblocked** | C1 (Q23 → D60) and C5 (Q17 → D61) resolved |
| DG-08 Offline Download + Sync | 🟠 Blocked (B3, N2) | 🟢 **Unblocked** | N2 resolved (D62: `?v={version}` URL); Q23 resolved (D60) |
| DG-09 Edge Proxy Cache States | 🟠 Blocked (N2) | 🟢 **Unblocked** | N2 resolved (D62) |
| DG-10 Network Connectivity States | 🟡 Partial (N1) | 🟢 **Unblocked** | N1 resolved (D63: `GET /api/health` added to doc 06) |
| DG-11 Admin Content Management | 🟠 Blocked (B1) | 🟢 **Unblocked** | Full admin API defined in doc 06 |
| DG-17 Sprint / Milestone Overview | (new) | 🟢 **Unblocked** | Doc 07 available |

**All 17 diagrams are now unblocked.** Full generation pass can proceed.

**Unchanged unblocked diagrams:** DG-01, DG-02, DG-03, DG-04, DG-12, DG-13, DG-14, DG-15, DG-16.

---

## 8. Implications for Presentations

**Status changes from v0.1** — decks unblocked by docs 06 and 07:

| Deck | Previous status | Updated status | Why |
|------|----------------|---------------|-----|
| DK-03 Architecture Deep-Dive | 🟠 Blocked (B1) | 🟡 **Partially unblocked** | Doc 06 available; needs diagrams DG-02–04 first |
| DK-04 Developer Onboarding | 🟠 Blocked (B1, B2) | 🟡 **Partially unblocked** | Docs 06 + 07 available; needs some diagrams first |
| DK-05 MVP Execution Overview | 🔴 Blocked (B2) | 🟢 **Unblocked** | Doc 07 fully available |

---

## 9. Priority Fixes Before Downstream Artifact Generation

| Priority | Issue | What it blocks | Action | Status |
|----------|-------|---------------|--------|--------|
| ~~**P1**~~ | ~~N2 — nginx proxy_cache not invalidated by ETag~~ | ~~DG-08, DG-09, offline UX, demo step 15~~ | ~~Version in URL `?v={version}`; update doc 06~~ | ✅ **Resolved → D62** |
| ~~**P2**~~ | ~~N1 — `GET /api/health` missing from API contract~~ | ~~DG-10, network status implementation~~ | ~~Add to doc 06 as public endpoint; proxy_cache off~~ | ✅ **Resolved → D63** |
| ~~**P3**~~ | ~~C1 — "Updated" badge scope Q23~~ | ~~DG-07, DG-08~~ | ~~Close Q23: downloads-only~~ | ✅ **Resolved → D60** |
| ~~**P4**~~ | ~~C5 — "Saved" items no recall surface Q17~~ | ~~DG-07~~ | ~~Close Q17: indicators only, no recall surface~~ | ✅ **Resolved → D61** |
| **P5** | C8 — edge-proxy ownership inconsistency | Developer confusion | Clarify delivery plan: Dev C bootstraps Week 1; Dev B owns from Sprint 2 | 🟡 Low urgency |

**All P1–P4 priority fixes resolved.** No blockers remain for diagram or presentation generation.

**Previously resolved (from v0.2):**
- ~~Doc 06 and 07 missing~~ — ✅ Resolved: both docs now generated
- ~~Thumbnail endpoint undefined~~ — ✅ Resolved: `GET /api/content/:id/thumbnail` defined in doc 06
- ~~Orphan cleanup undefined~~ — ✅ Resolved: explicit in doc 06 §10.4

---

## 10. Open Questions / Pending Decisions

| # | Question | Source | Blocks | Status | Recommended default |
|---|---------|--------|--------|--------|-------------------|
| Q23 | ~~Updated badge — all library items or downloaded items only?~~ | C1 | DG-07, DG-08 | ✅ **Resolved → D60** | Downloads-only |
| Q17 | ~~Saved items — filter toggle in Library or no recall surface?~~ | C5 | DG-07 | ✅ **Resolved → D61** | Indicators only; no recall surface |
| **N2** | ~~Cache-busting strategy for updated content files~~ | N2 | DG-08, DG-09 | ✅ **Resolved → D62** | `?v={version}` in content URL |
| **N1** | ~~Should `GET /api/health` be in the API contract?~~ | N1 | DG-10 | ✅ **Resolved → D63** | Added to doc 06 v0.2 |
| Q24 | Thumbnails — same directory as content or separate? | Doc 05 | Implementation | 🟡 Low urgency | Separate `./data/thumbnails/` |
| Q25 | Admin assigns content to zero categories — allowed? | Doc 05 | Implementation | 🟡 Low urgency | Allow; show under "Uncategorized" |
| Q30 | Content file served by Node.js streaming or nginx X-Accel-Redirect? | Doc 06 | Performance | 🟡 Sprint 2+ | Node.js in MVP; switch if load is a problem |
| Q33 | Server sets `Cache-Control: no-store` or `public, max-age=0` on `/api/catalog`? | Doc 06 | nginx config | 🟡 Sprint 1 | `no-store` + `proxy_ignore_headers`; test and adjust |
| Q27 | Cloud server URL hardcoded in nginx.conf or env var? | Architecture | Deployment | 🟡 Before implementation | Environment variable |

**All diagram-blocking questions resolved.** Remaining open questions are low-urgency implementation choices.

**Resolved since v0.1:**
- Q2 → D47 (catalog sync = pull on app open + manual refresh)
- Q5 → D13, Architecture §11 (TLS + admin password + network isolation)
- Q15 → D49, doc 06 §11 (100 MB upload limit, multipart/form-data)
- Q16 → D50, doc 06 §2 (full pull; `?since` accepted, ignored)
- Q17 → D61 (indicators only; no recall surface)
- Q18 → D48 (JWT stateless auth)
- Q23 → D60 (downloads-only badge)
- Q26 → D59 (WSL2 preferred)
- Q29 → D48 (JWT vs opaque)
- Q31 → D51 (cascade-delete children)
- Q32 → D49 (multipart/form-data)
- N1 → D63 (`GET /api/health` added to doc 06)
- N2 → D62 (`?v={version}` URL param for proxy cache-busting)

---

## 11. Continuation Notes

- **All P1–P4 issues resolved.** The document set is now fully consistent. Diagram generation can proceed across all 17 diagrams in a single pass.
- **Generation order (recommended):** DG-01 → DG-02 → DG-03 → DG-04 → DG-05 → DG-06 → DG-11 → DG-12 → DG-13 → DG-17 (Pass 1), then DG-07 → DG-08 → DG-09 → DG-10 (Pass 2, flows with resolved questions), then DG-14 → DG-15 → DG-16 (optional).
- **Low-urgency remaining items:** Q24, Q25, Q27, Q30, Q33, and C8 (edge-proxy ownership) — none block diagrams or presentations. Resolve before implementation starts.
- **Terminology standardization** should be applied in all diagram and presentation artifacts. Do not retroactively edit existing docs.
- **Doc 06 v0.2** is the current source of truth for the API contract. All prior references to v0.1 content are superseded.

---

*This review supersedes v0.1. It feeds into: `product/visuals/diagram-todo.md`, `product/visuals/diagram-index.md`, `product/presentations/presentation-plan.md`, `product/presentations/presentation-index.md`.*
