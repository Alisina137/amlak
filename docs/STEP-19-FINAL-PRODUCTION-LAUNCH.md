# Step 19 — Final Production Readiness and Launch Decision

**Default decision: NO-GO.** This step provides a final evidence-based release gate, not a declaration that Amlak is live or production-ready.

## 1. Mandatory evidence before launch

| Gate | Evidence required | Owner |
|---|---|---|
| Build and CI | Successful checks for exact release commit, immutable artifact/build IDs, dependency and security review | Engineering |
| Step 15 Android acceptance | Signed real-device test results, critical flows and regressions, device/build evidence | Mobile QA |
| Step 16 Kabul pilot | Real-user pilot outcomes, defects, consent/privacy controls, signed decision | Pilot owner |
| Step 17 Infrastructure/security | Live HTTPS/DNS/ingress and access review, secret management, authorization testing | Security / infrastructure |
| Step 18 Recovery/monitoring | Successful isolated database and media restore, measured RPO/RTO, alert and rollback drills | Operations |
| Privacy and support | Data retention, incident contact, support routing and applicable legal/privacy review | Product / legal |
| Final approval | Named engineering, security, operations, and business sign-offs | Release manager |

A merged checklist, static contract test or green CI cannot replace physical-device, real-user or live-environment evidence.

## 2. Release candidate freeze

1. Record the exact Git SHA, Android package/build identifier, admin artifact, API image digest, schema migration version, and configuration change ID.
2. Review open issues, especially security, authorization, privacy, billing, data integrity, and crash defects.
3. Freeze the release candidate and document changes made after the freeze.
4. Confirm production secrets are managed outside source control; do not paste them into release evidence.
5. Verify all required acceptance evidence links point to the *same* release candidate or to explicitly documented compatible builds.

## 3. Pre-deployment checks

- [ ] DNS and valid HTTPS certificate verified against the intended public hostname.
- [ ] Production API and mobile/admin clients use correct approved endpoints; no localhost/ngrok/pilot fallback.
- [ ] DB role access, TLS, encrypted backups and restore readiness verified.
- [ ] Database migration plan rehearsed on isolated clone; rollback and compatibility reviewed.
- [ ] Media backup, object storage permissions and recovery confirmed.
- [ ] Health, error, latency, backup freshness and security alerts verified.
- [ ] Support/on-call owner, incident escalation, and rollback decision authority confirmed.
- [ ] Critical/high issues resolved or formally accepted by authorized signatories.
- [ ] Pilot, physical-device, security and recovery gates signed.

## 4. Controlled release procedure (only after GO)

1. Schedule a maintenance/release window and communicate internally.
2. Record pre-release service health, backups and rollback artifact.
3. Apply only reviewed, explicitly approved production changes. Never auto-run production migrations as a documentation step.
4. Deploy API/admin/mobile release through the approved environment-specific pipeline.
5. Perform non-destructive smoke tests and observe errors, latency, authentication and listing flows.
6. Start with a limited rollout where technically feasible, then expand only after agreed observation thresholds pass.
7. Capture release timestamp, version, monitors, incident contact and acceptance sign-off.

## 5. Stop and rollback criteria

Immediate NO-GO or halt for: exposed credentials; broken authorization; data loss/corruption; invalid TLS; failing critical user journey; unverified database/media recovery; severe outage; missing incident owner; unapproved high/critical security issue.

For a failed release, follow the reviewed rollback procedure and migration compatibility plan. Avoid unsafe automatic schema rollback; document data recovery decisions and post-incident review.

## 6. Post-launch operations

- [ ] Observe dashboards and error budgets during the release window.
- [ ] Confirm backups and scheduled jobs are functioning.
- [ ] Review crash reports, performance, user support and security events.
- [ ] Record any incident, rollback and customer communications.
- [ ] Hold post-release review and assign owners to remaining improvements.

## 7. Formal decision

Complete `docs/templates/STEP-19-LAUNCH-DECISION-RECORD.md` with verifiable evidence and signatures. **No release should occur until the record says GO and all required gates have been genuinely satisfied.**

This PR does not provision infrastructure, deploy code, run real-user testing, execute recovery drills, or grant launch authorization.
