# Step 16 — Kabul Pilot Testing and Validation

**Status: Prepared, not executed.** This runbook establishes a controlled real-user pilot for Amlak in Kabul. It does not claim that users have tested the app, that production is approved, or that physical Android acceptance has passed.

## 1. Entry gates

- [ ] Step 15 physical-device acceptance evidence is complete and reviewed. A merged checklist alone does not satisfy this gate.
- [ ] A named pilot owner, technical lead, and support contact are assigned.
- [ ] A dedicated **non-production** API, database, and media storage are configured with HTTPS and least-privilege access.
- [ ] Test users understand that the environment is a pilot; obtain consent for feedback and any necessary diagnostics.
- [ ] Secrets are stored outside source control. No production credentials or real personal data are copied into the pilot.
- [ ] Database migrations are tested against an isolated backup/clone before applying to the pilot database.
- [ ] A documented rollback, incident contact, and stop criteria exist.
- [ ] Backups and a restore rehearsal for pilot data are completed.

## 2. Pilot cohort and coverage

Recruit a small, explicitly approved cohort across roles: property seeker, owner/seller, real-estate agent, and administrator/moderator. Record counts and onboarding status in the evidence template. Do not invent a completed participant count.

Test on Android devices with different screen sizes and versions, and include both reliable Wi-Fi and constrained mobile-data connections. Test supported languages, especially Dari/Persian RTL, and English where supported.

## 3. Critical pilot journeys

| ID | Role | Journey | Expected outcome |
|---|---|---|---|
| KBL-01 | Seeker | Open app, browse properties, view details | Correct listings and details; no crashes |
| KBL-02 | Seeker | Search, filter, clear filters, empty results | Predictable results and clear empty state |
| KBL-03 | Seeker | Contact listing owner through supported channel | Intentional, correct destination; no accidental disclosure |
| KBL-04 | Owner | Sign in and submit a listing | Clear validation and durable submission |
| KBL-05 | Owner | Edit and manage own listing | Changes persist; ownership enforced |
| KBL-06 | Agent | Manage permitted listings | Role boundaries respected |
| KBL-07 | Admin | Review/moderate submitted content | Only authorized actions available; auditability |
| KBL-08 | All | Switch supported language and navigate | Readable copy, correct RTL/LTR layout |
| KBL-09 | All | Lose network during load or submission | Safe retry and no unintended duplicates |
| KBL-10 | All | Sign out and sign in again | Correct session behavior and data isolation |
| KBL-11 | All | Slow network and image loading | Visible progress and usable fallback |
| KBL-12 | All | Report a problem or seek help | Feedback reaches named pilot owner |

If a feature is not supported, mark it **Not Applicable** with rationale rather than pretending it passed.

## 4. Daily operation

1. Confirm pilot API health, database access, media availability, and incident contact before testing.
2. Record device, build SHA, API environment, tester alias, and consent status.
3. Run critical journeys and capture pass/fail/blocked with redacted evidence.
4. Record feedback separately from defects. Prioritize severity, assign owner, and track retests.
5. Review incidents, performance, and support response daily.
6. Stop the pilot if a critical security/privacy defect, data loss, widespread outage, or unsafe workflow is discovered.

## 5. Acceptance criteria

- All critical journeys executed on real devices by intended user roles, or explicitly blocked with reasons.
- No open critical or high-severity issue without authorized written risk acceptance.
- Role isolation, privacy, and data integrity verified with documented evidence.
- Each defect has an owner, issue reference, fix/retest result, and disposition.
- Pilot feedback summarized with actionable UX and feature priorities.
- Pilot owner and reviewer sign the evidence record with **Go / No-Go** and rationale.

**Step 16 completion requires actual pilot evidence and human review.** A green CI workflow or merged documentation PR is not sufficient.

## 6. Production boundaries

Do not use production data, run production migrations, or announce public launch based on pilot results. Production HTTPS/configuration verification, security/privacy review, backup/media recovery, monitoring, incident response, and final human sign-off remain separate launch gates.

Record outcomes in `docs/templates/STEP-16-KABUL-PILOT-EVIDENCE.md`.
