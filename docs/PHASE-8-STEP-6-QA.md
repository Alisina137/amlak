# AmlakLink — Phase 8 Step 6: Quality assurance and release evidence

**Status:** Engineering preflight implementation, **not** a production release. All Phase 7 staffed pilot and Phase 8 external provider/device acceptance remains unverified unless actually performed and recorded by humans. An automated green check or a manually entered JSON file is NOT proof of payment, legal compliance, accessible UI, delivery to a handset, or a real business pilot.

## Engineering checks provided

From the repository root:

```powershell
pnpm install
pnpm db:diagnose
pnpm db:migrate
pnpm check
pnpm qa:phase8
# start API on port 4000, then:
pnpm pilot:smoke
```

`pnpm qa:phase8` runs the fail-closed static preflight and unit tests for the release gate. The CI PostgreSQL job also applies all migrations **twice** to verify repeatability, executes the existing API integration suite (role isolation, private shortlists, billing, push consent, media moderation, invitations, agency reports), builds the separate Next.js staff panel, exports Expo Android and checks public `/health`, `/ready`, province and discovery read paths. CI never has real EAS/FCM, production SMTP, actual bank evidence, installed device access, or human signoff.

Run `pnpm qa:release` only on a **trusted operator workstation** after all prerequisites are configured. It checks conservative local configuration and a private review-evidence document; failures exit non-zero. This is a human **preflight**, not a deployment command. It never deploys or flips merchant/billing/push switches and always returns `releaseApproved:false`. The release decision is a separate explicit human approval.

## Safety and confidentiality

Root `.env` secrets, database URLs, Expo provider tokens, MFA encryption keys, customer documents and payment evidence must stay outside Git and the report. Only check presence/shape. The preflight may write a structured `AMLAK_QA_REPORT_FILE`; store it privately, never commit it, and restrict access. Do not screenshot/show other customers' phone numbers, addresses, private chats or payment references.

**Production billing is intentionally off** (`AMLAK_BILLING_ENABLED=false`). Current proposed AFN prices do not constitute payment-provider acceptance. Step 1 push remains off unless FCM/EAS project, physical development-build push, permissions and preferences are validated. Credit memos are not money. Property sales, deposits, land title and escrow remain outside AmlakLink payments.

## Manual acceptance: use real evidence, not assumptions

For each item below, a responsible reviewer should keep a private reference to the actual test report, incident and mitigation log, and release decision. Use independent observers where practicable.

| Area | Required actual pilot observation | Blocking examples |
| --- | --- | --- |
| Phase 7 Kabul supply | 10 onboarded active Kabul agencies, 150 verified listings, freshness target >=80%, reviewed staff decisions | Unverified owner, stale/wrong-location listings, inadequate moderation |
| Android/RTL/offline | At least two physical Android phones incl. low-memory, 320–360dp, Dari/Pashto RTL and English LTR, Android TalkBack, 3G/4G loss/reconnect and image upload retries | Clipped forms, inaccessible controls, duplicate sends or unsafely exposed private data |
| Push | Real Expo development build, actual EAS/FCM V1 credentials, grant/deny/opt-out/token revoke, notification to correct user, safe cold-start deep links | Messages before consent, cross-account token leakage, missed/duplicate-noted messages |
| Cross-role access | Guest/seeker/agent/manager/owner/staff RBAC and revoked membership, multi-agency separation, offline stale cache on logout | Private reports/leads visible to wrong user, staff routes available to users |
| Finance | Statement date/reference/amount matched **externally**, duplicate/failed claim rejection, two-person refund evidence, credit policy review | Approval from only a checkbox, unreconciled money, refund automatically promised |
| Legal, fees, privacy | Written policy for billing, chargebacks, credits, consent, personal information and Afghanistan-specific regulations | Pricing/refunds unapproved, unlicensed mapping provider |
| MFA and staff rota | Real email deliverability, staff MFA, human safety/misrepresentation appeal coverage and incident handling | Missing person on call, MFA delivery failure |
| Backup + media | Encrypted DB backup copied offsite and actually restored to disposable staging, independently backed up media recovered | Untested restore or lost encryption key |
| Maps | Verified provider terms, keys, billing limits, and reliable search/list fallback | Unlicensed map tiles or broken offline fallback |
| Seven-day pilot | >=7 days genuine traffic, security and safety observations, clear response-time and availability statistics | Unresolved critical defects, lost leads, undetected abuse |

This pilot matrix includes use cases implemented during earlier phases. Step 6 tests can detect many failures, but **cannot perform human steps from the GitHub repository**.

## Example private evidence file format

Create your own **private file outside the repository** with the metadata below. Do not copy placeholders and claim they were performed. One object per required evidence item: the keys are exported from `scripts/phase8-release-gate.mjs` as `SIGNOFF_ITEMS`. Each `recordId` must point to a real internally accessible acceptance report, never public customer details:

```json
{
  "product": "AmlakLink",
  "environment": "production",
  "phase7PilotAccepted": false,
  "humanReleaseAuthorized": false,
  "owner": "Real accountable release manager",
  "reviewedAt": "2026-10-18T00:00:00Z",
  "evidence": {
    "kabul_agencies_and_inventory": {
      "passed": false,
      "reviewer": "Actual reviewer",
      "recordId": "internal QA case reference"
    }
  }
}
```

This incomplete example is designed to **FAIL**. Once evidence is genuinely reviewed, supply private path via `AMLAK_RELEASE_EVIDENCE_FILE`. Evidence self-attestation is not cryptographic verification and does not substitute for governance. The tool never marks release approved.

## Actionable verification commands

```powershell
# API on port 4000, never 4040
pnpm dev:api
# separate terminal: Expo Go UI/RTL/offline/manual scenarios
pnpm dev:mobile
# separately: Android development build after real EAS provisioning for push
pnpm dev:mobile:push
# review proposed operations before executing any writes:
pnpm ops:freshness
pnpm ops:alerts --dry-run
pnpm ops:push --dry-run
pnpm ops:renewals --dry-run
```

**Do not use `--execute` until the database target and external effects are understood.** Production pilot approval, live payout/merchant integrations and physical-device QA are still separate milestones.
