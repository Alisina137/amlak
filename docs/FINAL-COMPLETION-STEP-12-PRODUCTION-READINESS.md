# AmlakLink — Step 12: Production Readiness and Go/No-Go

## Purpose and status

This step establishes a fail-closed production release process. It adds a repeatable repository-level contract test and an operator checklist; it does **not** deploy the service, validate live infrastructure, or authorize launch.

**Current release status: NOT APPROVED.** Do not describe AmlakLink as production-ready until every mandatory gate has current, reviewable evidence and the accountable release owner signs the decision. Passing automated tests or merging this document is not production acceptance.

## Mandatory prerequisite gates

Before a production decision, record the outcome of each prerequisite:

- [ ] Step 10 automated Android E2E source-contract checks pass on the candidate commit.
- [ ] Step 10 physical Android acceptance matrix is completed on real device(s), including Dari, Pashto, English, RTL/LTR, account isolation, offline/reconnect, TalkBack, and applicable core journeys.
- [ ] Step 11 Kabul pilot was actually executed with consent and sanitized evidence, or the accountable owner documents a formally approved alternative; no unreviewed P0/P1 issues remain.
- [ ] Pilot exit/go-no-go decision and issue retest results are recorded.
- [ ] All release-blocking findings have named owners and evidence of remediation.

If Step 10 physical acceptance or Step 11 field evidence is missing, stop here: keep the release in internal/staging use. The existence of the Step 10/11 runbooks or their QA commands does not satisfy these gates.

## Production infrastructure and configuration

### Environment and networking

- [ ] Production and staging are separate; production secrets and data are never copied into GitHub, local .env files, logs, or screenshots.
- [ ] Production API is reachable only through the approved HTTPS endpoint; mobile EXPO_PUBLIC_API_URL uses HTTPS.
- [ ] API readiness and database connectivity are verified. For local development, the API uses port **4000**; ngrok inspector port **4040** is not the API.
- [ ] CORS/origin policy, TLS, DNS, domain ownership, rate limits, request-size limits, and reverse-proxy forwarding are reviewed for the actual deployment provider.
- [ ] Production environment variables are set through the hosting provider's secret manager; no secret values are printed during diagnostics.
- [ ] Authentication verification codes are never printed in production (AUTH_DEV_PRINT_CODES=false).
- [ ] Staff MFA encryption key, authentication pepper, SMTP, private media storage, and encrypted backup key are provisioned and verified without exposing values.
- [ ] Billing remains disabled (AMLAK_BILLING_ENABLED=false) unless a separate written approval validates provider, merchant, legal, reconciliation, refund, and customer-support readiness.
- [ ] Push remains disabled unless production provider configuration and real-device delivery/privacy behavior have been accepted.

### Database and media

- [ ] Migration status is reviewed against the exact release commit and production schema.
- [ ] An encrypted backup is created using the approved process; backup encryption and access restrictions are verified.
- [ ] A restore drill into an isolated staging environment succeeds, including database integrity checks.
- [ ] Media/object-storage recovery is tested, not just database restoration.
- [ ] Retention, deletion, access control, least privilege, and disaster-recovery ownership are documented.
- [ ] Restore time and recovery point objectives are explicitly agreed and realistically tested.
- [ ] No destructive migration or cleanup is run against production without a reviewed recovery plan.

### Security and privacy

- [ ] Review account/agency isolation, authorization boundaries, staff permissions, session revocation, account recovery, upload validation, and public/private media access.
- [ ] Review rate limiting and abuse protections for authentication, inquiries, uploads, and other public endpoints.
- [ ] Check dependency/build findings and resolve release-blocking vulnerabilities; document accepted residual risk with an owner and expiry.
- [ ] Verify logs exclude passwords, OTPs, tokens, identity documents, private contact details, and message bodies.
- [ ] Confirm privacy notice, terms, moderation rules, user reporting/contact path, retention/deletion policy, and local legal review are approved for the actual operating jurisdiction.
- [ ] Do not claim a listing, agency, identity, or property has been independently verified unless the applicable real verification procedure was completed.

## Observability and incident response

- [ ] Monitoring covers API availability/readiness, error rate, latency, database health/connections, media failures, background jobs, and push delivery where enabled.
- [ ] Alerts have a named on-call recipient, a tested delivery path, and escalation instructions.
- [ ] Logs and operational dashboards are access-controlled and have documented retention.
- [ ] Operators have runbooks for outage, suspected account compromise, data exposure, data corruption, failed migration, backup restore, media outage, and rollback.
- [ ] The pause/rollback owner, technical responder, moderation owner, and customer/agency communication owner are named.
- [ ] An incident exercise is completed; record date, participants/roles, gaps, and follow-up owners.
- [ ] The service can be paused without enabling billing or performing unsafe/destructive data changes.

## Release candidate verification

Run in Windows PowerShell from C:\\projects\\amlak against the candidate commit:

```powershell
git status --short
git pull origin main
pnpm install
pnpm db:diagnose
pnpm db:migrate
pnpm qa:production-readiness
pnpm qa:phase8
pnpm qa:android-e2e
pnpm qa:kabul-pilot
pnpm qa:ui
pnpm qa:network
pnpm qa:billing
pnpm check
pnpm --filter @amlaklink/mobile exec expo export --platform android
```

Run commands in the intended environment where appropriate; db:migrate must only target the explicitly selected database. Do not point staging commands at production accidentally. These checks are necessary but are not proof of live-device, live-provider, legal, monitoring, restore, or pilot acceptance.

The existing pnpm qa:release / Phase 8 release gate can evaluate a private evidence manifest and configured environment. Follow its current instructions and keep the manifest outside the repository with restrictive file permissions. Never put evidence secrets or customer information into the repository.

## Evidence handling

Keep detailed evidence in an access-controlled private location. Commit only sanitized aggregate status and non-sensitive internal record references. For every gate, record:

- Gate identifier and pass/fail/blocked status.
- Candidate commit SHA, environment, date/time and timezone.
- Reviewer/operator role and internal evidence reference.
- Command or procedure executed and outcome.
- Open issue references, severity, owner, remediation commit, and retest.
- Exceptions, risk owner, expiration/review date, and explicit approval where permitted.

Evidence must be recent enough to describe the candidate being released. Re-run affected checks after any code, dependency, infrastructure, secret-rotation, or configuration change. Never commit credentials, tokens, raw production dumps, private customer records, unredacted screenshots, or the private evidence manifest.

## Go/no-go decision

**GO** only if all mandatory prerequisite, infrastructure, backup/restore, security/privacy, observability, operational, and release-candidate gates are evidenced; no unresolved P0/P1 issue remains; the accountable owner and required reviewers approve; and the rollback/pause plan is ready.

**NO-GO** if any required evidence is missing, a restore drill fails, a security/privacy/data-integrity blocker remains, a core journey has not been retested, monitoring/escalation is unverified, or any required legal/provider approval is absent. Keep the app in staging/internal testing, disable non-approved billing/push functionality, assign owners, and re-review after remediation.

### Production decision record

Complete only after real review; leave unfilled until then.

- Candidate commit SHA:
- Production environment/provider:
- Step 10 physical-device evidence reference:
- Step 11 Kabul pilot evidence and decision reference:
- Security/privacy reviewer and evidence reference:
- Backup + database restore result/reference:
- Media recovery result/reference:
- Monitoring/alert test reference:
- Incident exercise reference:
- Migration/release rollback plan reference:
- Legal/policy approval reference:
- Billing status and approval reference (billing must remain OFF unless separately approved):
- Push status and real-device evidence reference:
- Open P0/P1 issues:
- Accepted residual risks, owner, expiry:
- Decision: **NO-GO / GO**
- Accountable release owner:
- Required reviewers:
- Decision date/time and timezone:

A GO is an explicit human operational decision, not a result produced by CI.
