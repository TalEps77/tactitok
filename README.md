# TactiTok

Repository for planning and specifying the TactiTok prototype.

## Purpose
This repo is used to:
- store the project North Star
- store Claude prompt files
- generate the core product and engineering documents
- keep assumptions, decisions, and open questions visible and versioned

## Working Model
The workflow is repo-first and document-driven.

ChatGPT prepares prompt files for Claude.
Claude then:
1. reviews the current repo state
2. asks focused discovery questions
3. creates or updates the target document
4. runs a quality gate against feasibility and scope discipline

## Source of Truth
The project North Star is the binding source of truth:
- `product/north-star.md`

Claude must treat the North Star as authoritative.
If Claude believes a North Star item should change, it must:
1. explain why
2. propose a minimal edit
3. ask for explicit approval
4. only then apply the change

## Prompt Location
Claude prompt files are stored in:
- `prompts/claude/`

Recommended naming:
- `01_product-brief_prompt.md`
- `02_system-boundaries_prompt.md`
- `03_mvp-spec_prompt.md`
- `04_system-architecture_prompt.md`
- `05_data-model_prompt.md`
- `06_api-contract_prompt.md`
- `07_delivery-plan_prompt.md`

## Core Output Documents
Claude is expected to create these documents under `product/`:
- `01_product-brief.md`
- `02_system-boundaries.md`
- `03_mvp-spec.md`
- `04_system-architecture.md`
- `05_data-model.md`
- `06_api-contract.md`
- `07_delivery-plan.md`

## Supporting Notes
Working notes are stored under:
- `notes/assumptions.md`
- `notes/decisions.md`
- `notes/open-questions.md`

## Default Document Order
1. Product Brief
2. System Boundaries
3. MVP Spec
4. System Architecture
5. Data Model
6. API Contract
7. Delivery Plan

## Project Constraints
- continuation-ready prototype
- realistic for 3 student developers
- 8–10 week MVP target inside a ~12 week project
- browser-based experience on Chrome / Windows
- tablet-oriented runtime
- unstable / low-bandwidth connectivity
- hybrid offline support is required

## Notes
Do not add extra product documents unless explicitly needed.
Prefer concise, engineering-ready outputs over broad strategy text.
