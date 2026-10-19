# Step 17 — Infrastructure and Security Evidence

**Status: Not verified.** Fill in this form only from actual environment inspection and testing. Do not paste credentials, private keys, access tokens, or personal data.

## Deployment identity

- Reviewer / date / timezone:
- Environment: staging / production
- Service owner and hosting provider:
- Region / deployment target:
- Release ID and commit SHA:
- API hostname (public, non-sensitive):
- Admin hostname (public, non-sensitive):
- Mobile build ID:
- Rollback release ID:
- Change ticket:

## Control results

Use **Pass / Fail / Blocked / Not Applicable**; provide an evidence reference and reviewer for each result.

| ID | Control | Result | Evidence reference | Owner / issue |
|---|---|---|---|---|
| INF-01 | Environment isolation and least privilege | | | |
| INF-02 | HTTPS certificate, renewal, redirect | | | |
| INF-03 | Firewall, ingress, and private database | | | |
| INF-04 | Trusted proxy and security headers | | | |
| INF-05 | Correct production API endpoints | | | |
| SEC-01 | Secrets stored outside repository and rotated | | | |
| SEC-02 | Auth, session, and recovery review | | | |
| SEC-03 | Role and resource authorization tests | | | |
| SEC-04 | Rate limiting and abuse protections | | | |
| SEC-05 | CORS, upload restrictions, error redaction | | | |
| DB-01 | Encrypted DB connections and scoped access | | | |
| DB-02 | Migration rehearsal and rollback plan | | | |
| DR-01 | Encrypted backup and isolated restore | | | |
| DR-02 | Media/object storage recovery | | | |
| OPS-01 | Health, metrics, logging and alert drill | | | |
| OPS-02 | Incident escalation and deployment rollback | | | |

## Defects, mitigations, and exceptions

| ID | Severity | Risk and impact | Owner | Mitigation / fix | Retest evidence |
|---|---|---|---|---|---|
| | | | | | |

## Related gates

- Step 15 real-device acceptance evidence:
- Step 16 Kabul pilot evidence:
- Backup/restore exercise reference:
- Security/privacy review reference:
- Monitoring/incident response drill reference:

## Decision

- Critical/high defects open:
- Unverified/blocked controls:
- Risk acceptance approver and rationale:
- Technical reviewer/date:
- Security reviewer/date:
- Business owner/date:
- Decision: **No-Go / Advance to next readiness gate**
- Reason:

> This form is not itself a production launch authorization. Production remains blocked until actual controls are verified and a separate final launch sign-off is recorded.
