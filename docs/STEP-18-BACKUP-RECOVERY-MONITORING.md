# Step 18 — Backup, Disaster Recovery and Monitoring

**Status: Prepared, not operationally verified.** This runbook does not configure cloud schedules, prove that backups exist, or demonstrate a successful restore.

## Preconditions

- [ ] Step 17 production infrastructure/security controls reviewed with evidence.
- [ ] Approved non-production restore target and isolated credentials available.
- [ ] Named database, media, deployment and incident-response owners.
- [ ] Recovery objectives approved: RPO (maximum tolerable data loss) and RTO (maximum acceptable restoration time). Record actual values; do not assume them.
- [ ] Encrypted storage, retention policy, and offsite/independent backup copy agreed.
- [ ] No production secrets or personal information included in logs or test evidence.

## 1. Database backup

Existing repository scripts include `pnpm db:backup`, `pnpm db:backup:verify`, `pnpm db:restore:staging`, and `pnpm db:integrity`. Review their behavior and environment variables before use. **Never run restore against production.**

- [ ] Inventory all databases, schemas, extensions, and encryption keys needed to restore.
- [ ] Establish an external scheduler and alerting for backups, with run logs and ownership.
- [ ] Encrypt backups in transit and at rest; restrict access; keep at least one independent copy.
- [ ] Record retention, expiry, failure handling, checksum verification, and key rotation.
- [ ] Confirm backup failures alert a human and do not silently pass.

## 2. Recovery rehearsal

1. Select a non-production backup or approved anonymized clone.
2. Provision a new **isolated staging** database with no route to production write operations.
3. Record backup ID, timestamp, size, checksum and key reference (not key material).
4. Restore with `pnpm db:restore:staging` only after confirming its target is staging.
5. Run `pnpm db:integrity` against the restored staging database.
6. Check core entity counts, referential integrity, and representative application read flows.
7. Measure elapsed time and data age to assess actual RTO/RPO.
8. Destroy temporary copies according to retention and privacy policy.

**Never infer recovery success from a backup file existing.**

## 3. Media recovery

- [ ] Inventory listing images and other object-storage assets, lifecycle rules, and deletion behavior.
- [ ] Verify media backup/export and independent recovery path.
- [ ] Restore a representative sample into isolated staging.
- [ ] Verify content hashes or equivalent integrity, file access rules, and listing-media references.
- [ ] Record orphaned/missing assets and remediation.

## 4. Monitoring and alerting

- [ ] Monitor API health/readiness, uptime, 5xx rate, p95 latency, DB connectivity, queue/job failures, backup freshness and media errors.
- [ ] Use structured logs with correlation IDs and redaction; do not log credentials or full personal data.
- [ ] Define thresholds, notification routes, quiet hours, escalation and on-call ownership.
- [ ] Rehearse a controlled alert in staging and record time to detect/acknowledge.
- [ ] Test a simulated API outage, backup failure and database unavailable scenario.
- [ ] Verify alerts can be acknowledged, escalated, and closed with an incident record.

## 5. Incident response and rollback

- [ ] Define severity levels and incident commander.
- [ ] Document containment, communications, rollback, restoration, verification and postmortem.
- [ ] Record emergency access procedure and audit trail.
- [ ] Exercise a staging deployment rollback and validate data compatibility.
- [ ] Record who can approve restoration and when user notifications are required.

## Exit criteria

- Database and media backup coverage demonstrated with evidence.
- A **real isolated restore** succeeds and application integrity is verified.
- Measured recovery results satisfy approved RPO/RTO or have signed exceptions.
- Monitoring/alert drills reach the intended owner.
- Rollback and incident procedures rehearsed.
- No unresolved critical risks without formal approval.
- Technical and business reviewers sign the Step 18 evidence template.

See `docs/templates/STEP-18-RECOVERY-MONITORING-EVIDENCE.md`.

**Step 18 is not complete until real operational tests are performed.** Do not run production migrations or restore commands as part of this documentation step.
