# AmlakLink — Step 11: Kabul Pilot Testing

## Status and intent

This step prepares a **small, controlled Kabul pilot** with real participating agencies while using synthetic property records and test accounts wherever practical. This repository change is a runbook and readiness gate; it does not mean a real agency has participated or that field testing has passed.

**Entry gate:** Step 10 physical Android acceptance must be recorded before real participants are invited. If it has not been completed, use this runbook for internal rehearsal only. Do not expose an unverified build to agencies.

## Pilot scope

Run a time-boxed pilot with a small number of consenting agencies and named staff. Begin with one agency and a small set of listings; expand only after the daily review shows no unresolved blocker. The pilot validates:

1. Agency onboarding, role assignment, and access boundaries.
2. Listing creation, edit, media upload, moderation/review state, publication, and removal.
3. Search/discovery, details, save/unsave, and inquiry delivery between two separate accounts.
4. Viewing/appointment request creation, status updates, and duplicate-submit behavior.
5. Notification preferences, actual push delivery only on a configured development build, and safe deep-link/account scoping.
6. Dari, Pashto, and English copy/layout, RTL behavior, low-end Android performance, and unreliable mobile connectivity.
7. Agency/staff feedback, issue triage, resolution, and retesting.

Do not use the platform to collect property purchase money, rental deposits, escrow, or other customer funds. **Billing must remain disabled** unless a separate written approval gate has been completed. Never promise that a listing, agency, or property claim has been independently verified unless the real verification process was completed.

## Participant and data safeguards

- Obtain informed consent from each agency and staff participant; explain the pilot purpose, limitations, support contact, and how to stop participating.
- Use only the minimum real participant data needed to test. Use synthetic listings, photos, phone numbers, and conversations for rehearsals; obtain permission for any real listing/media before publishing it.
- Never put passwords, OTPs, access tokens, identity documents, private phone numbers, or unredacted customer conversations in GitHub issues, screenshots, logs, or shared reports.
- Keep evidence in an access-controlled private location. Commit only sanitized aggregate findings and non-sensitive issue references.
- Give each staff member their own account and least-privilege role. Never share logins. Test agency separation explicitly.
- Establish a named pilot operator, moderation owner, technical responder, and escalation route before inviting participants.
- Provide a simple stop/pause process. Immediately pause affected journeys for cross-account exposure, unauthorized actions, duplicate or lost submissions, privacy/security concerns, unsafe moderation outcomes, or repeated crashes.
- Do not run destructive tests on real listings or contact real users without explicit permission.

## Before inviting agencies

Run from Windows PowerShell:

```powershell
cd C:\projects\amlak
git pull origin main
pnpm install
pnpm db:diagnose
pnpm db:migrate
pnpm qa:kabul-pilot
pnpm qa:android-e2e
pnpm qa:ui
pnpm qa:network
pnpm qa:billing
pnpm check
pnpm --filter @amlaklink/mobile exec expo export --platform android
```

Use a staging environment with a verified backup/restore path and monitoring. Confirm API readiness and database connectivity on **port 4000**. The ngrok inspector on 4040 is not the API. A physical phone's `EXPO_PUBLIC_API_URL` must point to the HTTPS tunnel forwarding to port 4000. Do not expose a local development database or admin interface publicly. Verify secrets are set in the deployment environment and never commit them.

The automated `qa:kabul-pilot` test checks that the pilot protocol and guardrails remain present; it is not a live service test and cannot prove agency participation, actual push delivery, monitoring, or operational readiness.

## Pilot execution plan

### Day 0 — rehearsal (internal only)

- [ ] Confirm Step 10 device acceptance record is complete and blockers are closed.
- [ ] Create separate staging accounts for buyer, advertiser/agency owner, manager/agent, and moderation staff as applicable.
- [ ] Verify account/agency isolation and least privilege.
- [ ] Prepare a small approved listing set, localized test content, and image assets with permission.
- [ ] Exercise inquiry, viewing request, moderation, notification preference, and support/escalation flows.
- [ ] Confirm monitoring, backups, restore instructions, and pause/rollback owner.
- [ ] Verify billing remains disabled and no real payment flow is enabled.
- [ ] Record build commit, app build, API target, device models, Android versions, and locale.

### Days 1–3 — limited agency pilot

- [ ] Onboard one agency first; add another only after the first review gate passes.
- [ ] Walk through a listing from draft to review/publication and removal.
- [ ] Run a buyer-to-agency inquiry and viewing request with explicit consent.
- [ ] Test duplicate taps, uncertain network outcomes, upload interruption, offline/reconnect, and account switching.
- [ ] Ask participants to complete core journeys in Dari/Pashto/English as appropriate.
- [ ] Hold a short daily review with the agency contact and pilot team.
- [ ] Log issues using sanitized references, severity, reproducible steps, owner, status, and retest result.

### Daily monitoring and measures

Record counts only; avoid personal information in the summary:

- Agencies invited / consented / actively participating.
- Listings created, reviewed, published, rejected, and removed.
- Inquiry and viewing requests submitted, delivered, and acknowledged.
- Duplicate, failed, or delayed submissions; media upload failures.
- Crashes, API errors, latency observations, and connectivity-related failures.
- Issues by severity, time to acknowledge, time to resolve, and retest outcome.
- Completion rate for core journeys and participant feedback themes.
- Locale/layout/accessibility problems by language and device class.

Capture baseline and end-of-day totals with timestamps and build commit. Do not interpret a small pilot sample as proof of market-wide reliability or demand.

## Severity and response

- **P0 — Stop immediately:** cross-account data exposure, account takeover, unauthorized role access, sensitive data leak, unsafe or unauthorized financial action, or widespread data corruption. Pause the affected service/journey, preserve sanitized diagnostics, notify the designated security/operator contact, and do not resume until reviewed and retested.
- **P1 — Pause affected journey:** listing/inquiry/viewing data loss, repeated crashes, moderation bypass, duplicate actions with material impact, or core flow unavailable for participants. Assign an owner and require a reproducible fix plus retest before resuming that journey.
- **P2 — Workaround:** limited non-sensitive defect with a documented workaround and no security/data integrity impact. Track and retest before expanding the pilot.
- **P3 — Polish:** copy, spacing, or minor usability issue that does not block task completion or safety. Prioritize from participant impact.

Do not place sensitive incident details in a public issue. Follow the project's private incident route and local legal/privacy obligations.

## Daily issue record template

Use this structure in a private tracker:

- Reference:
- Date/time and timezone:
- Build commit / app build:
- Device / Android version / locale:
- Role and synthetic account label (never credentials):
- Journey and expected result:
- Actual result:
- Reproduction steps:
- Severity (P0–P3):
- Privacy/security/data-integrity impact:
- Owner and next action:
- Fix commit:
- Retest result and tester:
- Status: open / in progress / blocked / verified / closed

## Exit / go-no-go gate

The pilot can be recommended for a wider pilot only when all are true:

- [ ] Step 10 physical-device acceptance is signed and referenced.
- [ ] No open P0 or P1 issue; affected flows have been retested on the target device(s).
- [ ] Agency roles, agency isolation, moderation, listing lifecycle, inquiry, and viewing requests pass with recorded evidence.
- [ ] No unexplained lost or duplicate writes remain; network recovery has been exercised.
- [ ] Dari/Pashto RTL and English LTR are reviewed on real devices; accessibility issues blocking completion are fixed.
- [ ] Push claims are supported by actual device receipt evidence, or push is clearly marked not accepted/not enabled.
- [ ] Backup/restore, monitoring, pause/rollback, and escalation ownership are confirmed.
- [ ] Billing is still disabled unless separately authorized in writing.
- [ ] Participants' feedback and issue disposition are summarized without personal data.
- [ ] Pilot operator signs the go/no-go decision and names remaining risks.

If any gate fails, keep the pilot limited or pause it. Do not infer Step 12 production readiness from pilot completion alone.

## Result record

Complete after actual field testing; leave blank until evidenced:

- Pilot dates:
- Participating agencies (consent confirmed; use internal references):
- Build commit:
- Devices/locales tested:
- Core journey completion:
- Open P0/P1 issues:
- Backup/restore drill result:
- Push delivery evidence:
- Billing flag/status:
- Participant feedback summary:
- Go/no-go:
- Operator and review date:
