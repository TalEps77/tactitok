# Cross-Document Review — TactiTok

> **Version:** 0.2
> **Status:** Draft
> **Date:** 2026-03-07
> **Author:** Automated planning pass (prompt: `08_cross-doc-visuals-planning`)
> **Change from v0.1:** All 7 documents now reviewed (docs 06 and 07 were placeholders in v0.1). Issues C4, M1–M4 are updated. Two new issues added: N1 and N2. Blockers and diagram/presentation statuses updated throughout.
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
| 06 | `product/06_api-contract.md` | v0.1 | Draft | ✅ Yes |
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

### C1 — "Updated" badge scope (STILL OPEN — BLOCKER for library diagram)

**Severity:** High — affects UI design and sequence diagram.
**Status change from v0.1:** Delivery plan partially clarifies but does not close.

| Document | What it says |
|----------|-------------|
| MVP Spec Journey 3 Step 8 | "If content has been updated since last metadata sync, badge is visible" — implies all library items |
| Data Model §9.3 | "badge shows only on downloaded items where version mismatch is clear" |
| API Contract §10.3 | "compares `DownloadRecord.version` with catalog version for each downloaded item" — downloads-only logic |
| Delivery Plan Sprint 4, Week 7 (Dev C) | Presents two options: downloaded items (version comparison) OR approximate heuristic on all library items — does not close the question |
| Open Question Q23 | Still open |

- **Remaining conflict:** API Contract §10.3 implements downloads-only logic (comparing DownloadRecord to catalog version). MVP Spec Step 8 says all items. Delivery plan leaves both options open.
- **Recommended resolution:** Close Q23 as **downloads-only** — API contract already implements this, delivery plan suggests it as the simpler alternative, and it is the less risky path.
- **Must resolve before:** Library view diagram (DG-07), offline/sync flow diagram (DG-08).

---

### C2 — Stale assumption A23 *(RESOLVED in v0.1 pass)*

Assumption A23 in `notes/assumptions.md` was updated to reflect that Cache API is no longer used. No further action needed.

---

### C3 — Prefetch mechanism description gap *(LOW SEVERITY — no action required)*

- Delivery plan Sprint 3 Week 6 now provides implementation detail: "when current video reaches 30% playback, issue a `Range: bytes=0-{N}` request for the next video in the feed. Store the partial response in memory."
- This is consistent with Architecture §9.7. The language difference (MVP Spec says "buffer N seconds"; Architecture says "range request triggers proxy to cache full file") is a level-of-abstraction difference, not a contradiction.
- **No action needed.** Note the distinction in the prefetch flow diagram (DG-06) when generated.

---

### C4 — Cache invalidation for updated content files (PARTIALLY RESOLVED — residual issue N2)

**Severity of residual:** Medium.

- **What doc 06 resolves:** ETag format `"{version}-{id}"` is defined. When content is updated (version++), the ETag changes. This correctly invalidates **browser-level cache** (Chrome's own `<video>` and `fetch()` cache) if the browser is re-requesting a previously-cached response.
- **What doc 06 does NOT resolve:** nginx `proxy_cache` caches by URL key by default (`$scheme$proxy_host$request_uri`). If the URL stays the same (`/api/content/{id}/file`), a changed ETag on the upstream server does **not** cause the proxy to evict the cached entry — the proxy serves the old file for the full 30-day TTL. This means: the "Updated" badge appears correctly (version mismatch via IndexedDB), but clicking to view the updated file may still serve the old version from proxy cache for up to 30 days.
- **Impact on demo:** Demo Step 15 ("HQ uploads updated video → edge shows 'updated' badge after sync") — the badge appears correctly. But if the evaluator then plays the updated video, they may see the old version. This is a demo-risk issue.
- **See N2 below** for the full analysis and recommended resolution.

---

### C5 — "Saved" items — no confirmed UI surface *(STILL OPEN — lower severity)*

**Severity:** Low-Medium.

- MVP Spec CAP-2.8 (Save button | Should), delivery plan Sprint 3 Week 5 (Save button implemented, stored in IndexedDB). Confirmed the button exists.
- No document confirms what happens when the user wants to recall saved items. Q17 ("marked in Library with a filter toggle") remains a recommended default, not a decision.
- **Impact:** If Save is implemented with no recall surface, it is a write-only interaction with no user value. The delivery plan does not add a "Saved" filter to the library view.
- **Recommendation:** Close Q17 as a decision: "Save button stores in IndexedDB; no recall surface in MVP (indicators only). Callable explicitly in continuation." This is consistent with MVP Spec Out-of-Scope item 18.
- **Must resolve before:** Library view diagram (DG-07).

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

### N1 — `GET /api/health` endpoint missing from API contract (NEW — BLOCKER)

**Severity:** Medium.

- **Delivery Plan Sprint 1 Week 1 (Dev A):** "Health check endpoint: `GET /api/health → 200 { status: 'ok' }`"
- **Delivery Plan Sprint 4 Week 8 (Dev B):** "poll `GET /api/health` via edge proxy; if fails or returns stale-served response, show 'Offline' indicator"
- **API Contract §12 (endpoint summary table):** `GET /api/health` is **not listed**. It does not appear anywhere in doc 06.
- **Impact:** The network status detection mechanism in the edge SPA depends on this endpoint. It is used in Sprint 4 Week 8 implementation and is part of the offline UX (AC-12). Without it in the contract, developers may not implement it consistently.
- **Recommended action:** Add `GET /api/health` to the API contract as a public endpoint (no auth; no caching; returns `{ status: 'ok', version: string, timestamp: string }`). Should also specify edge proxy behavior: health check is NOT cached (so a stale response from the proxy correctly indicates offline state).
- **Must add before:** Implementation Sprint 1 (Dev A builds it in Week 1).

---

### N2 — nginx proxy_cache not invalidated by ETag for same URL (NEW — BLOCKER for offline flow diagram)

**Severity:** Medium-High.

- **Root cause:** nginx `proxy_cache` uses the request URL as the cache key by default (`$scheme$proxy_host$request_uri`). A changed `ETag` or `Cache-Control` response header from the upstream does NOT evict the cached entry while it is still within its TTL (30 days). The proxy serves the old file for the full 30-day window regardless of server-side changes.
- **Claimed behavior (doc 06 §6.2):** "When content is updated (version++), the ETag changes, invalidating the edge proxy cache entry for that item." — **This claim is incorrect** for nginx proxy_cache default behavior. ETag-based invalidation applies to browser-level conditional requests, not to nginx proxy_cache entries.
- **Consequence:** After an admin updates a content file, the "Updated" badge appears correctly (version comparison in IndexedDB). But viewing the content via the edge SPA serves the old file from proxy cache for up to 30 days.
- **Demo risk:** Demo Step 15 is specifically "HQ uploads updated video → edge device shows 'updated' badge after sync." If the evaluator then plays the updated video, they see the old version. This is a visible demo failure.

**Resolution options (in order of preference for MVP):**

| Option | Mechanism | Complexity | Recommended? |
|--------|-----------|-----------|-------------|
| **A: Version in content URL** | `/api/content/{id}/file?v={version}` — new version = new cache key = automatic cache miss | Low | ✅ **Yes — recommended** |
| B: Short content cache TTL | Reduce from 30 days to, say, 4–8 hours | Very low | Acceptable if Option A is not implemented; degrades offline reliability |
| C: nginx cache_purge module | `ngx_cache_purge` module + purge request from server after content update | Medium | Not recommended for MVP (adds module dependency) |

**Recommended resolution:** Implement Option A — include version as a query parameter in the content URL. The catalog already carries the `version` field; the edge SPA constructs `/api/content/{id}/file?v={version}` from the cached catalog. The proxy cache key is now URL+query, so a version bump = cache miss = fresh fetch. This requires:
1. Update API contract: content file URL spec to include optional `?v={version}` param (ignored by server, used as cache key).
2. Update edge proxy nginx config: ensure `proxy_cache_key` includes query string (default nginx behavior includes it if `$request_uri` is used).
3. Edge SPA constructs content URL with version from catalog.

**Must resolve before:** Offline/sync flow diagram (DG-08), edge proxy cache state diagram (DG-09), and Sprint 3 implementation.

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

**Status changes from v0.1** — diagrams unblocked by docs 06 and 07:

| Diagram | Previous status | Updated status | Why |
|---------|----------------|---------------|-----|
| DG-05 Content Publishing Flow | 🟡 Partial (B1) | 🟢 **Unblocked** | API endpoints fully defined in doc 06 |
| DG-06 Reels Feed / Video Playback | 🟡 Partial (B1) | 🟢 **Unblocked** | API endpoints defined; prefetch detail in doc 07 |
| DG-07 Library Browse & Search | 🟠 Blocked (B3, B5) | 🟠 **Still blocked** | C1 (Q23) and C5 (Q17) still open |
| DG-08 Offline Download + Sync | 🟠 Blocked (B3, B4) | 🟠 **Still blocked** | N2 (proxy cache invalidation) must resolve first |
| DG-09 Edge Proxy Cache States | 🟠 Blocked (B4) | 🟠 **Still blocked** | N2 must resolve first |
| DG-10 Network Connectivity States | 🟡 Partial (B4) | 🟡 **Partial** | N1 (health endpoint) needed for accuracy |
| DG-11 Admin Content Management | 🟠 Blocked (B1) | 🟢 **Unblocked** | Full admin API defined in doc 06 |

**Unchanged unblocked diagrams:** DG-01, DG-02, DG-03, DG-04, DG-12, DG-13, DG-14, DG-15, DG-16.

**New diagram now supported:** Delivery plan structure justifies adding a sprint/milestone overview diagram (recommended, depends on doc 07 — now available).

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
| **P1** | N2 — nginx proxy_cache not invalidated by ETag | DG-08, DG-09, offline UX, demo step 15 | Decide cache-busting strategy (recommend: version in URL `?v={version}`); update doc 06 and nginx config | 🔴 Open |
| **P2** | N1 — `GET /api/health` missing from API contract | DG-10, DG-11, network status implementation | Add to doc 06 as public endpoint; specify no-cache behavior at proxy | 🔴 Open |
| **P3** | C1 — "Updated" badge scope Q23 | DG-07, DG-08 | Close Q23: recommend "downloads-only"; API contract already implements this | 🔴 Open |
| **P4** | C5 — "Saved" items no recall surface Q17 | DG-07 | Close Q17: accept "indicators only in MVP, no recall surface" | 🔴 Open |
| **P5** | C8 — edge-proxy ownership inconsistency | Developer confusion | Clarify delivery plan: Dev C bootstraps Week 1; Dev B owns from Sprint 2 | 🟡 Low urgency |

**Previously P1–P2 (now resolved):**
- ~~Doc 06 and 07 missing~~ — ✅ Resolved: both docs now generated
- ~~Thumbnail endpoint undefined~~ — ✅ Resolved: `GET /api/content/:id/thumbnail` defined in doc 06
- ~~Orphan cleanup undefined~~ — ✅ Resolved: explicit in doc 06 §10.4

---

## 10. Open Questions / Pending Decisions

| # | Question | Source | Blocks | Status | Recommended default |
|---|---------|--------|--------|--------|-------------------|
| Q23 | Updated badge — all library items or downloaded items only? | C1 | DG-07, DG-08 | 🔴 Open | **Downloads-only** (API contract already implements this) |
| Q17 | Saved items — filter toggle in Library or no recall surface? | C5 | DG-07 | 🔴 Open | **Indicators only in MVP; no recall surface** (consistent with OOS item 18) |
| Q24 | Thumbnails — same directory as content or separate? | Doc 05 | Implementation | 🟡 Low urgency | Separate `./data/thumbnails/` |
| Q25 | Admin assigns content to zero categories — allowed? | Doc 05 | Implementation | 🟡 Low urgency | Allow; show under "Uncategorized" |
| Q30 | Content file served by Node.js streaming or nginx X-Accel-Redirect? | Doc 06 | Performance | 🟡 Sprint 2+ | Node.js in MVP; switch if load is a problem |
| Q33 | Server sets `Cache-Control: no-store` or `public, max-age=0` on `/api/catalog`? | Doc 06 | nginx config | 🟡 Sprint 1 | `no-store` + `proxy_ignore_headers`; test and adjust |
| Q27 | Cloud server URL hardcoded in nginx.conf or env var? | Architecture | Deployment | 🟡 Before implementation | Environment variable |
| **NEW** | Cache-busting strategy for updated content files | N2 | DG-08, DG-09 | 🔴 **Open** | Version in URL `?v={version}` |
| **NEW** | Should `GET /api/health` be explicitly defined in the API contract? | N1 | DG-10, DG-11 | 🔴 **Open** | Yes — add to doc 06 |

**Resolved since v0.1:**
- Q2 → D47 (catalog sync = pull on app open + manual refresh)
- Q5 → D13, Architecture §11 (TLS + admin password + network isolation)
- Q15 → D49, doc 06 §11 (100 MB upload limit, multipart/form-data)
- Q16 → D50, doc 06 §2 (full pull; `?since` accepted, ignored)
- Q18 → D48 (JWT stateless auth)
- Q26 → D59 (WSL2 preferred)
- Q29 → D48 (JWT vs opaque)
- Q31 → D51 (cascade-delete children)
- Q32 → D49 (multipart/form-data)

---

## 11. Continuation Notes

- **N2 (proxy cache invalidation)** is the highest-priority remaining issue. It must be resolved before Sprint 3 starts (when the reels prefetch and content delivery paths are built). Recommend resolving in the API contract as a minor update (add `?v={version}` to the content file URL spec) and testing the cache-busting behavior in Sprint 2 alongside the range request caching test.
- **N1 (health endpoint)** should be added to the API contract before Sprint 1 implementation begins. It is a trivial endpoint but architecturally important for offline detection.
- Once Q23 and Q17 are closed, diagram generation can begin in earnest. The highest-value first-pass diagrams (DG-01 to DG-06, DG-11, DG-12, DG-13) are all either fully unblocked or close to it.
- The delivery plan (doc 07) is well-structured. Its dependency map and milestone checkpoints should be visualized as DG-12 (sprint/milestone diagram) for the developer onboarding and execution overview decks.
- Terminology standardization should be applied in all diagram and presentation artifacts. Do not retroactively edit existing docs.

---

*This review supersedes v0.1. It feeds into: `product/visuals/diagram-todo.md`, `product/visuals/diagram-index.md`, `product/presentations/presentation-plan.md`, `product/presentations/presentation-index.md`.*
