# Step 17 — Production Infrastructure and Security Readiness

**Status: Planning and audit checklist only — production NOT approved.** This step documents the required infrastructure/security controls and evidence. It does not provision cloud infrastructure, validate a live deployment, or claim a penetration test.

## A. Environment and deployment boundary

- [ ] Select and document the hosting provider, region, owner, and approved deployment method.
- [ ] Separate development, pilot/staging, and production projects/accounts, databases, buckets, and credentials.
- [ ] Set `NODE_ENV=production`; ensure development tunnels and debug endpoints are not used as public production entry points.
- [ ] Set `API_PORT` explicitly (4000 is the current API default), with `API_HOST` appropriate for the runtime; do not expose the backend directly if a secure ingress/proxy is required.
- [ ] Deploy immutable, identifiable artifacts with commit SHA, release ID, and rollback target.
- [ ] Restrict administrative access and use least privilege for CI/deployment accounts.

## B. TLS, DNS, ingress and network

- [ ] Use a valid trusted HTTPS certificate and automatic renewal for public domains.
- [ ] Enforce HTTPS end to end at the trusted ingress and verify HTTP redirects.
- [ ] Configure reverse proxy, upstream timeout, body-size limits, and request-id forwarding.
- [ ] Allow only required inbound ports; database and internal admin services are not publicly exposed.
- [ ] Document trusted proxy boundaries and review any forwarded-IP/header logic before enabling it.
- [ ] Verify health/readiness endpoints do not expose secrets or internal configuration.
- [ ] Confirm production mobile and admin clients use the intended HTTPS API endpoint (not localhost, ngrok, or a pilot URL).

## C. Secrets, auth, and access

- [ ] Store database credentials, auth peppers, TOTP encryption keys, email provider keys, and other tokens in an approved secret manager; never commit them.
- [ ] Use unique secrets per environment, enforce access review and documented rotation/revocation.
- [ ] Review authentication/session cookie/token settings, expiry, logout and recovery flows.
- [ ] Enforce authorization and ownership checks server-side for listings, agents, admin, and staff.
- [ ] Apply rate limits and abuse controls to sign-in, verification, uploads, and contact workflows.
- [ ] Confirm CORS and security headers match the production origin allowlist.
- [ ] Confirm logs, errors, analytics, and support tickets redact secrets and personal data.

## D. Database, media, migration and recovery

- [ ] Use encrypted database connections and least-privilege database roles.
- [ ] Test migration and rollback plans on a non-production database clone before production change approval.
- [ ] Create encrypted backups with retention/access policies and verify restore to isolated staging.
- [ ] Include uploaded media and object-storage recovery; document orphaned media cleanup.
- [ ] Confirm data retention/deletion policy and permission controls for personal data.

## E. Operations, observability, and incident response

- [ ] Collect redacted structured logs, request correlation IDs, uptime, latency, errors, and database health.
- [ ] Set alert owners, notification paths, on-call hours, escalation thresholds, and incident playbooks.
- [ ] Establish deployment/rollback rehearsals, release windows, and change approval.
- [ ] Document support contacts and procedures for privacy incidents and account compromise.
- [ ] Verify monitoring and alerting using a controlled non-production failure drill.

## F. Verification and go/no-go

1. Record environment inventory and configuration evidence using the Step 17 template.
2. Perform a reviewed HTTPS/ingress check against the intended production hostname, without exposing secrets.
3. Conduct server-side authorization tests and security review, recording defects and remediation.
4. Verify migration, database restore, and media recovery in isolated environments.
5. Review Step 15 physical-device results and Step 16 real-user Kabul pilot results; documentation alone does not satisfy either.
6. Obtain independent technical/security and business go/no-go sign-off.

**Stop conditions:** leaked secrets, public database exposure, bypassable authorization, critical data-loss risk, or missing rollback/recovery capability. Do not run production migrations as part of this documentation step.

## Exit decision

- [ ] All critical controls verified with evidence.
- [ ] Critical/high issues fixed or formally risk-accepted by an authorized reviewer.
- [ ] Recovery and incident procedures rehearsed.
- [ ] Named owners and sign-offs recorded.
- [ ] Separate launch approval completed.

See `docs/templates/STEP-17-INFRA-SECURITY-EVIDENCE.md`. **A merged PR or green CI does not prove live production security.**
