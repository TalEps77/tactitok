# TactiTok

A browser-based learning platform that delivers short training videos and PDF documents to edge devices (10" tablets) in environments with unstable connectivity.

## What Is TactiTok?

TactiTok turns "doom-scrolling" into short, accessible operational learning. It provides a **TikTok-style reels feed** of training videos and an **organized content library** — all running in Chrome on a kiosk tablet, with offline support for disconnected environments.

### Two Surfaces

- **Edge App** — A tablet-optimized SPA (React/TypeScript) running in Chrome kiosk mode. Features a vertical-scroll video feed with auto-play, a searchable content library with category tree, and a downloads manager for offline access.
- **Admin Portal** — A web-based SPA for HQ training staff to upload, organize, and publish video (MP4) and PDF content.

### Key Capabilities

- TikTok-style reels feed with auto-play, swipe navigation, and interest-based filtering
- Searchable content library with 2-level category tree
- In-browser video player (HTML5/MP4) and PDF viewer (PDF.js)
- User-initiated download for offline access via edge proxy caching
- Hybrid connectivity: metadata syncs when online; content fetched on demand; full offline for cached/downloaded items
- Admin portal: upload, organize, manage content with category and interest tagging

## Architecture Overview

```
Cloud VM (Linux)                    Edge Device (Windows PC, 10" tablet)
┌──────────────────────┐           ┌────────────────────────────────┐
│ nginx (TLS, port 443)│           │ Windows: Chrome kiosk          │
│ Node.js + Express    │◄─HTTPS──►│   ↔ localhost:8080             │
│ PostgreSQL           │           │ Linux VM (Docker):             │
│ Content files (disk) │           │   nginx caching proxy + SPA   │
└──────────────────────┘           └────────────────────────────────┘
```

- **Cloud server**: Node.js/Express API, PostgreSQL metadata, filesystem content storage
- **Edge device**: Docker container (nginx caching reverse proxy + bundled SPA); Chrome on Windows connects via localhost
- **Tech stack**: TypeScript monorepo — React (both SPAs) + Node.js/Express (server) + PostgreSQL + nginx

## Project Status

**Phase: Specification complete, pre-implementation.**

All 7 product/engineering documents have been written and aligned. The project is ready for implementation by a team of 3 student developers over a 12-week timeline (10 weeks build + 2 weeks stabilization).

## Repository Structure

```
tactitok/
├── product/                    # Core specification documents
│   ├── north-star.md           # Binding source of truth (vision, problem, scope)
│   ├── 01_product-brief.md     # Problem, users, flows, scope, success metrics
│   ├── 02_system-boundaries.md # System boundary, actors, trust zones, topology
│   ├── 03_mvp-spec.md          # Buildable MVP scope, journeys, acceptance criteria
│   ├── 04_system-architecture.md # Components, tech stack, data flows, deployment
│   ├── 05_data-model.md        # Entities, schema, IndexedDB stores, relationships
│   ├── 06_api-contract.md      # 21 REST endpoints, auth, caching, TypeScript DTOs
│   └── 07_delivery-plan.md     # 6 sprints, milestones, dependencies, de-scope levers
├── notes/                      # Cross-cutting project notes
│   ├── assumptions.md          # Tracked assumptions (A1–A43)
│   ├── decisions.md            # Locked decisions (D1–D63)
│   └── open-questions.md       # Open and resolved questions (Q1–Q37)
├── prompts/                    # AI prompt files used during document generation
├── assets/                     # Project assets
└── CLAUDE.md                   # AI assistant instructions for this repo
```

## Document Reading Order

Read the documents in this order for full context:

1. **North Star** — Vision, problem, target users, MVP boundary, constraints
2. **Product Brief** — Detailed problem, flows, scope, success metrics, de-scope levers
3. **System Boundaries** — What's in/out of the system, deployment topology, trust zones
4. **MVP Spec** — Concrete capabilities, user journeys, acceptance criteria
5. **System Architecture** — Components, tech decisions, data flows, offline/sync approach
6. **Data Model** — PostgreSQL schema, IndexedDB stores, entity relationships
7. **API Contract** — All 21 endpoints, request/response shapes, caching strategy
8. **Delivery Plan** — Sprint-by-sprint breakdown, milestones, risk response

## Project Constraints

- Continuation-ready prototype (clean architecture for a follow-on team)
- Realistic scope for 3 student developers
- 8–10 week MVP build inside a 12-week project
- Chrome kiosk on Windows (10" tablet); Linux VM with Docker on same device
- Unstable / limited bandwidth; hybrid offline support required
- ~20 concurrent edge devices for demo
- Demo corpus: 15 items (10 PDFs + 5 videos)
- Single language (English) for MVP; architecture supports i18n later

## Key Decisions

| Decision | Choice |
|----------|--------|
| Frontend framework | React + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Content storage | Local filesystem behind abstraction |
| Video delivery | MP4 + HTTP range requests |
| Edge offline | nginx caching proxy in Docker (no Service Worker / Cache API) |
| Auth (admin) | Simple shared password + JWT |
| Auth (edge) | None (anonymous kiosk; device profile only) |
| Monorepo | pnpm workspaces with shared types package |

For all 63 decisions, see `notes/decisions.md`.
