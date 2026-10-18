# Phase 7 — Pilot Hardening & MVP Readiness

**Product authority:** `docs/PRODUCT-SPECIFICATION.md` phase 7, sections 43–50 and 57–58; `docs/SOFTWARE-WORKFLOW-V4.md`. Afghanistan-only / Kabul supply-first. **This delivery is tooling and engineering hardening; it is not a completed release approval or proof of a 10-agency pilot.**

## Implemented engineering controls

**1. Freshness enforcement.** A bounded sweep checks up to 100 eligible published listings. At 14 days since the last advertiser confirmation, it creates an in-app reminder once per confirmation cycle; at 30 days it conditionally pauses the published listing, writes a system audit event and owner notification, and cancels unconfirmed pending viewing requests. Confirmed visits survive a temporary pause. Concurrent advertiser confirmations cannot be overwritten by the conditional pause. The public search already hides records older than 30 days, even before the sweep runs.

**2. Pilot scorecard.** The separate staff web panel at `/admin/pilot` shows active agencies, published Kabul inventory, confirmations within 14 days, freshness percentage, pending listing reviews, active/high-risk safety cases, inquiries and viewings from the past 30 days. Staff roles can view the scorecard and dry-run preview; only admin/super_admin can execute the sweep. Execution is audited. Proposed numerical thresholds (10 Kabul agencies, 150 Kabul listings, 80% freshness) are explicitly hypotheses, not an automatic launch permit. A staff member must review security, backup, legal, fraud coverage and devices before declaring ready.

**3. Database backup & restore tools.** The backup command streams `pg_dump -Fc` into an AES-256-GCM encrypted file with a random 12-byte IV, without producing a plaintext dump on disk. The restore command authenticates the full encrypted file before staging restore, uses `pg_restore --single-transaction`, requires a separately named staging/test database and explicit confirmation, and removes transient decrypted files. Crypto round-trip/corruption tests run in CI. **Backups are not scheduled yet.** Database backup does not include uploaded S3 media; the image bucket needs its own backup/retention.

**4. Weak-network hardening.** The Expo request client retries at most once for read-only GET requests after transient network/502/503/504 errors, keeping POST/PUT/DELETE non-retried. The API returns a response request ID, redacts sensitive headers from logs, and caps the database readiness wait. A read-only smoke command checks liveness, readiness, province catalog and Kabul rent discovery over the actual target connection.

**5. Regression checks.** Database integration tests exercise reminders, pause idempotency, confirmation-cycle changes, staff authorization and scorecard security. CI continues to validate TypeScript, API tests, Next.js admin build and Android Expo export. No test suite can substitute for low-end physical Android or actual provider credentials.

## Local setup (Windows PowerShell)

1. `cd C:\projects\amlak`
2. `git pull origin main`
3. `pnpm install`
4. Verify your own Neon configuration: `pnpm db:diagnose`. If raw port 5432 is blocked, see `docs/DATABASE-CONNECTIVITY.md` for the optional Neon WebSocket port-443 setting.
5. Apply all existing migrations: `pnpm db:migrate` (no new Phase 7 SQL migration).
6. Terminal 1: `pnpm dev:api` (API **4000**, ngrok inspector **4040**); Terminal 2: `pnpm dev:mobile`; Terminal 3: `pnpm dev:admin`.
7. Run `pnpm pilot:smoke` against your local API. For an HTTPS tunnel, set `AMLAK_SMOKE_URL` to the HTTPS tunnel URL (no credentials). This command performs only public GET operations.

### Freshness dry-run and controlled execution

```powershell
pnpm ops:freshness
pnpm ops:freshness --execute
```

The first command **never writes**. The second applies eligible changes to **the database in your root .env**, up to 100 per run. Check the dry-run and the exact database target first. The same actions are available in the private web operations panel to admin/super_admin only. For production, arrange a single trusted daily scheduler/server job. Running only an occasional interactive admin click does not constitute 24/7 monitoring. Review execution results, retry failed jobs and page the operator on failures.

### Encrypted database backup

First generate a random 32-byte key in a private PowerShell session:

```powershell
$key = [byte[]]::new(32)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($key)
[Convert]::ToHexString($key).ToLowerInvariant()
```

Store the printed hex value **privately** as `BACKUP_ENCRYPTION_KEY_HEX=` in root `.env`. Do not paste the key into chats or Git. Also install PostgreSQL client utilities `pg_dump` and `pg_restore` (available on PATH) on the backup machine. `pg_dump` uses **native PostgreSQL TCP**; the Neon WebSocket API transport setting does not redirect these CLI programs. If your Windows network blocks 5432, run backups from a trusted network/runner with native access or use your provider's properly protected backup facilities.

```powershell
pnpm db:backup
```

Encrypted outputs are under `.amlak-backups/`, which is gitignored. Store encrypted copies off-device using an access-controlled backup destination, retain the key separately, and test restore regularly. Losing the encryption key makes the backups unrecoverable.

### Destructive staging restore rehearsal

Create a **disposable** database whose name contains `staging`, `test`, `sandbox` or `restore`. Set `STAGING_DATABASE_URL` privately (different from `DATABASE_URL`) and set `RESTORE_CONFIRM=RESTORE_TO_STAGING_ONLY`. Then:

```powershell
pnpm db:restore:staging path\to\your-backup.pg.enc
```

Restore intentionally uses a staging-only destination and can overwrite existing tables in that destination. It rejects exact production target matches and validates the backup before touching the staging database. **Never point STAGING_DATABASE_URL at real user data.** Rehearse full restore, query record counts, authenticate a dummy account, and verify media objects from a separately restored bucket. CI tests only the encryption roundtrip, not real `pg_restore` recovery.

## Human pilot acceptance checklist (must be completed outside CI)

- [ ] At least ten active **Kabul** agencies actually onboarded; each independently reviewed by designated staff.
- [ ] At least 150 Kabul listings independently checked for accuracy, with >=80% availability confirmed in the prior 14 days (hypothesis; revise only with documented approval).
- [ ] Two real Android devices including a low-memory model tested on weak 3G/4G, intermittent/offline, long photo upload and reconnect.
- [ ] Dari/Pashto RTL: font sizing, TalkBack focus, every form error and navigation back, no clipped controls at 320–360dp.
- [ ] Anonymous browse → rent/gharawi → detail → safe call and authenticated inquiry/viewing → advertiser confirm/cancel.
- [ ] Real SMTP and login MFA delivery; valid role and cross-agency denial, member revocation, unsafe/duplicate report and staff appeal.
- [ ] Actual map provider licensing and Android keys documented, with a functional search/list fallback.
- [ ] Verified HTTPS/ngrok or production API access; signed S3 media and data retention; no development OTP printing on public tunnel.
- [ ] Backup runs on a real system; encrypted file copied offsite; a full restore to isolated staging, database checks, and separately backed up image objects verified.
- [ ] Case investigation rota, moderation response goals, incident escalation, recovery contacts, appeal handling, breach notifications and contact procedure staffed.
- [ ] Legal review of Afghanistan-specific privacy, listing representations, notices, data retention and consumer claims; no unverified title guarantee.
- [ ] Observe >=7 days of genuine usage with no critical data leaks, authorization bypass or lost inquiries. Record latency p50/p95, upload timeouts, error rates and safety queue processing.
- [ ] Release decision explicitly recorded and signed off; **code passing CI is not automatic permission to launch**.

## Operational boundaries

This repository does **not** schedule a production worker, guarantee disaster recovery, verify local Neon access, prove an actual offsite backup, install a production map key, provision real agencies, or perform legal review on your behalf. It provides the tools and manual workflows to do those things. The app's existing in-app notifications still depend on clients loading or polling; durable push/out-of-app delivery belongs to the later release work.

## Following phase

Phase 8 — professional growth V1.1: subscriptions and entitlements, manual Afghan payment verification, advanced agency tools, alerts, comparisons and optional production push in a development build, gated by a proven stable Phase 7 MVP.
