# Assumptions

Use this file to track cross-document assumptions that affect product, architecture, delivery, or scope.

## From Product Brief (01)

| # | Assumption | Source | Impact if wrong |
|---|-----------|--------|----------------|
| A1 | Chrome kiosk mode supports IndexedDB for storing device state (profile, download records, local actions) | North Star §8 + discovery | Core local state feature breaks; would need native wrapper |
| A2 | MP4/H.264 with HTTP range requests provides adequate prefetch + streaming for ≤3 min clips | North Star §9 | Reels UX degrades; may need HLS/DASH (adds complexity) |
| A3 | PDFs render reliably in-browser via PDF.js without external plugins | North Star §8 | PDF viewing fails in kiosk; alternative viewer needed |
| A4 | Demo lab provides a server reachable by edge devices on same network | North Star §9 | Metadata sync and content fetch fail |
| A5 | A flat or one-level interest list is sufficient for meaningful feed filtering | Discovery Q4-5 | Feed feels random; deeper taxonomy needed |
| A6 | 20 concurrent edge devices won't strain a single-server deployment in demo | Discovery Q2 | Needs load testing or caching layer |
| A7 | HQ staff can prepare 15 demo items (10 PDFs + 5 videos ≤3 min) | Discovery Q11 | Thin demo corpus |
| A8 | Simple admin password is acceptable security for MVP demo | North Star §8 | Security review blocks demo |
| A9 | Training/content staff is a centralized HQ team, not field personnel | Discovery Q1 | Admin UX needs to work in field conditions |
| A10 | Single language is acceptable for MVP; architecture must not block RTL/LTR later | Discovery Q8 | UI rework needed for i18n |
| A11 | Like is local-only in MVP; server reporting is post-MVP | Discovery Q5 | Analytics expectations unmet |

## From System Boundaries (02)

| # | Assumption | Source | Impact if wrong |
|---|-----------|--------|----------------|
| A12 | Server runs on a cloud VM (Linux) with sufficient resources for ~20 concurrent devices | Discovery (boundaries) | Need to scale or optimize; not MVP-feasible on undersized VM |
| A13 | Network between edge and server supports HTTPS (port 443 open) | Discovery (boundaries) | System unreachable; must fall back to HTTP or VPN tunneling |
| A14 | Edge tablet kiosk mode is pre-configured; team does not manage OS or kiosk setup | Discovery (boundaries) | Team scope expands to device provisioning |
| A15 | Content files are uploaded in final format (MP4 H.264 for video; standard PDF) — no transcoding | Discovery (boundaries) | Need to build transcoding pipeline; major scope addition |
| A16 | Admin portal and Content API are co-hosted on the same cloud VM | Discovery (boundaries) | Need separate deployment; adds infrastructure complexity |
| A17 | Content store decision (local filesystem vs. object store) can be deferred to architecture phase | Discovery (boundaries) | Architecture must define storage abstraction from the start |
| A18 | A self-signed or Let's Encrypt TLS cert is acceptable for demo | Discovery (boundaries) | TLS setup becomes complex; may need organizational cert process |

## From MVP Spec (03)

| # | Assumption | Source | Impact if wrong |
|---|-----------|--------|----------------|
| A19 | English UI is acceptable for MVP; Hebrew developers can build English UI without friction | Discovery (MVP) | UI text rework; low risk |
| A20 | TikTok-style auto-play works in Chrome kiosk without user gesture requirement | MVP Spec | Chrome may block; need tap-to-play fallback for first video |
| A21 | HTML5 video + MP4 + HTTP range requests sufficient for prefetch + streaming ≤3 min | MVP Spec | May need HLS/DASH; significant complexity increase |
| A22 | PDF.js renders all demo PDFs correctly | MVP Spec | Need fallback viewer or constrain PDF complexity |
| A23 | IndexedDB + Cache API provide enough storage for 15 downloaded items in kiosk Chrome | MVP Spec | Storage limits hit; limit download count or sizes |
| A24 | Swipe gestures work reliably in Chrome on target 10″ tablet | MVP Spec | Touch events may need polyfill or tuning |
| A25 | 2-level category tree sufficient for organizing 15 demo items | MVP Spec | May need flat list (de-scope) or deeper tree |
| A26 | Video prefetch (buffer next video) achievable with standard browser APIs | MVP Spec | May need Service Worker or custom buffering |

## From System Architecture (04)

| # | Assumption | Source | Impact if wrong |
|---|-----------|--------|----------------|
| A27 | React + TypeScript is accessible to the 3 student developers | Architecture | Need alternative framework; delays start |
| A28 | Node.js + Express handles ~20 concurrent video streams without bottleneck | Architecture | May need nginx direct file serving or worker threads |
| A29 | PostgreSQL runs comfortably alongside Node + nginx on single VM (4+ GB RAM) | Architecture | Need larger VM or resource optimization |
| A30 | Monorepo with pnpm workspaces is manageable for 3 students | Architecture | May need separate repos; adds type-sharing friction |
| A31 | ~~Service Worker + Workbox sufficient for SPA shell caching~~ **SUPERSEDED** — SPA is bundled in Docker; SW no longer used | Architecture | N/A |
| A32 | Express can serve content files with range requests (206 Partial Content) adequately | Architecture | May need nginx to serve files directly from disk |

## From Data Model (05)

| # | Assumption | Source | Impact if wrong |
|---|-----------|--------|----------------|
| A33 | UUIDs are acceptable as primary keys (no need for sequential IDs) | Data Model | Minor: some query patterns are slower with UUIDs; but dataset is tiny |
| A34 | A single CachedCatalog JSON blob is efficient for ~15 items | Data Model | Need IndexedDB indexes or pagination if catalog grows to 100+ |
| A35 | Hard delete is acceptable for MVP (no recoverability needed) | Data Model | Data loss on accidental delete; admin must re-upload |
| A36 | Interests and categories are independent (no mapping between them) | Data Model + discovery | If users expect interests to match categories, UX may be confusing |
| A37 | Thumbnail upload is optional; placeholder is acceptable | Data Model + discovery | Demo may look less polished without thumbnails |
| A38 | No need for a `status` field on content items (all are published immediately) | Data Model | If approval workflow is needed, must add status ENUM |

## From Architecture v0.2 Update (Edge Proxy)

| # | Assumption | Source | Impact if wrong |
|---|-----------|--------|----------------|
| A39 | Students can write a Dockerfile + nginx.conf for the edge proxy with reasonable guidance | Architecture v0.2 | May need a pre-built template; adds ~1–2 days if unfamiliar |
| A40 | nginx proxy_cache handles range requests correctly for cached content | Architecture v0.2 | Need testing; may need full-file fetch for caching then separate range serving |
| A41 | Linux VM networking allows Docker container to bind port 8080 accessible from Windows localhost | Architecture v0.2 | May need port forwarding or bridge networking configuration |
| A42 | 10 GB proxy cache is sufficient for all demo content (~15 items) | Architecture v0.2 | Increase cache size or add eviction monitoring |
| A43 | Edge device has Docker daemon pre-installed on its Linux VM | Architecture v0.2 | Team scope expands to Docker installation; adds setup time |
