# Phase 6 — Agencies, Trust, Safety & Verification

**Source:** Product Specification V1.0, implementation Phase 6; P-11, F-07, F-08; RULE-025, 031–036; Workflow V4.

## Implemented
- **User reports:** authenticated verified users report published/previously published properties with category, explanation and unique retry ID. The server prevents own-listing and own-agency reports; rate-limited creation opens a case. Reporting is not proof of misconduct; no automatic unpublishing.
- **Staff case management:** separate web route /admin/safety with case statuses open, triaged, investigating, resolved, rejected, appealed and closed. Case details and reporter descriptions require staff session, with different moderator, support and verification scopes. Human case decisions use version checks and mandatory auditable reasons. Support views case queues, but cannot moderate them.
- **Moderator safety hold:** a moderator can pause a currently published listing, creating an audit event and in-app notice. Seller cannot undo safety holds by normal resume, close or revision-approval routes. A separately authorized version-checked release is required. Pending viewing requests are reconciled; confirmed viewings are preserved while temporarily held.
- **Advertiser appeals:** seller/authorized agency owner or manager can inspect sanitized cases (without reporter's identity or allegations) and submit one appeal after a staff decision. Staff resolve it with reason. Acceptance does not automatically restore the property.
- **Duplicate candidates:** review staff can scan a bounded set of 2–120 recently active listings, comparing normalized title, category, transaction, locality and similar area between different advertisers. Candidate records require manual review, explanation and an audited distinct/duplicate decision. No automatic property removal.
- **Human review records:** verification staff can register limited-scope identity, professional, agency or listing-authorization checks with a method, result, reason, reviewer, expiry and audit. Revoked/expired records are not shown as current; approved listing authorization badge never implies legal ownership, property inspection or title verification.
- **Localized UI:** Dari, Pashto and English property-report screen, advertiser safety/appeal center; standalone staff web admin with authorized decisions.

## Database
New migration: packages/database/migrations/0005_safety.sql. Adds safety_reports, safety_cases, safety_appeals, verification_records, duplicate_candidates and listings.safety_hold. Migration is additive and re-runnable with IF NOT EXISTS. Public listing status is immediately paused on an authorized hold.

## Key API
- POST /v1/properties/:id/reports, GET /v1/reports/mine
- GET /v1/properties/:id/safety-cases, POST /v1/safety-cases/:id/appeal
- GET /v1/admin/safety/cases and /:id; POST /v1/admin/safety/cases/:id/transition and /appeal-decision
- POST /v1/admin/safety/listings/:id/hold (hold/release)
- POST /v1/admin/safety/verification, GET /v1/admin/safety/verification/:kind/:id
- GET /v1/properties/:id/verified-checks (public non-sensitive scope)
- POST /v1/admin/safety/duplicates/scan, GET /v1/admin/safety/duplicates, POST /v1/admin/safety/duplicates/:id/decision

## Local setup (PowerShell)
    cd C:\projects\amlak
    git pull origin main
    pnpm install
    pnpm db:diagnose
    pnpm db:migrate
    pnpm dev:api

In another terminal run pnpm dev:mobile. API is port 4000; ngrok port 4040 is only the tunnel inspector. Staff web uses the existing admin startup command. If Neon raw PostgreSQL 5432 remains unreachable, use DATABASE_TRANSPORT=websocket in the root .env, as explained in docs/DATABASE-CONNECTIVITY.md. Keep DATABASE_URL private.

## Quality and limitations
GitHub CI runs PostgreSQL migrations, workspace typechecks/integration tests, admin build and Android Expo export. CI is NOT proof of local Neon connectivity, real-device operation or staffed moderation. The in-app report is a factual allegation, not guilt. The current system does NOT upload/store private ID scans or property title papers; future secure evidence handling requires an encrypted staff-only vault, restricted access, retention policies and legal review. Phase 7 should cover this operational design, backup/restore, security testing, mobile low-bandwidth QA, legal notices, pilot staffing, durable notifications and real-provider smoke tests. Do not describe AmlakLink as certifying legal ownership.
