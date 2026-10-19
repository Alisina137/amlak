# AmlakLink — Step 13: Final Integration Verification

## Purpose and status

This step adds a repeatable repository-level integration contract suite and a safe operator runbook for verifying the whole monorepo before device acceptance and pilot work.

**This is not production approval.** Static contract tests cannot prove that a live database, Android device, hosting provider, email/SMS service, push provider, or field pilot works. The release remains **NOT APPROVED** until the Step 12 human evidence gates are satisfied.

## Scope

- Verify root scripts and pnpm workspace package manifests remain coherent.
- Verify API, database, admin, and Android/mobile projects have their expected quality/build commands.
- Verify CI still exercises migrations against its isolated PostgreSQL service, workspace checks, core QA guards, API readiness/smoke test, admin build, and Android export.
- Verify API default port remains 4000 and keep ngrok inspector port 4040 distinct.
- Verify release checks are fail-closed and never autonomously approve production.
- Provide an ordered local verification sequence and report how to treat failures.

## Run from Windows PowerShell

Start with a clean review of local changes. Do not overwrite uncommitted work:

```powershell
cd C:\projects\amlak
git status --short
git pull origin main
pnpm install
pnpm qa:integration-verification
pnpm check
pnpm qa:phase8
pnpm qa:android-e2e
pnpm qa:kabul-pilot
pnpm qa:production-readiness
pnpm qa:ui
pnpm qa:network
pnpm qa:renewals
pnpm qa:billing
pnpm --filter @amlaklink/admin build
pnpm --filter @amlaklink/mobile exec expo export --platform android
```

Run `pnpm db:diagnose` only when you intend to inspect the database configured by your local environment. Before any migration, verify the selected database hostname/name and confirm it is the intended disposable CI database or isolated staging database. Never run migrations against production as part of a generic local verification sequence. The CI workflow runs migrations against its own ephemeral PostgreSQL service.

The CI workflow also performs an API startup/readiness smoke test against port 4000. For local API testing, use the project's documented environment and verify `http://127.0.0.1:4000/ready`; port 4040 is the ngrok inspector, not the API. Do not expose a local database or admin UI publicly.

## How to interpret results

- `qa:integration-verification` passing means the repository's expected integration contracts and scripts are present; it is a static guard, not a runtime end-to-end result.
- `pnpm check` must pass type checks and package tests.
- The admin build and Android export must finish successfully for the candidate commit.
- Database diagnostics, CI migrations/integrity tests, and live readiness should be recorded separately with environment and commit SHA.
- Physical Android acceptance, real Kabul pilot evidence, provider configuration, backup/restore, media recovery, monitoring, security/privacy review, and legal/operational signoff remain separate mandatory gates.

## Failure handling

1. Stop at the first failing command and preserve the full sanitized error output.
2. Record the command, candidate commit SHA, environment (never secret values), timestamp/timezone, failure, and responsible owner.
3. Fix the root cause in a focused change, rerun the failing check, then rerun relevant regression checks.
4. Do not mark a gate passed because its test was skipped, its dependency was unavailable, or its runbook merely exists.
5. Do not print or commit credentials, OTPs, tokens, private customer data, production dumps, or private evidence manifests.

## Result record

Fill this record after executing the checks. Do not pre-fill results from the existence of scripts.

- Candidate commit SHA:
- Date/time and timezone:
- Local Node.js version:
- pnpm version:
- Git working tree clean before test (yes/no):
- `pnpm install` result:
- `pnpm qa:integration-verification` result:
- `pnpm check` result:
- Phase 8 / Android E2E / Kabul pilot / production-readiness QA results:
- Admin build result:
- Android export result:
- Database environment identifier (non-secret; never paste connection string):
- Database diagnostics / isolated migration and integrity result:
- API readiness/smoke result (port 4000):
- Failures and sanitized log references:
- Fix commits and retest results:
- Remaining blockers:
- Operator:
- Status: PASS / FAIL / BLOCKED

A PASS here is not a GO decision. Follow the Step 12 production decision record and obtain the required human approval before any production release.
