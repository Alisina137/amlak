# AmlakLink — Step 14: Integration Regression Fix

## Finding

Step 13's full GitHub Actions quality workflow passed: workspace type checks/tests, isolated database migrations and rerun safety, integrity smoke, Phase 8/UI/network/subscription/billing guards, API readiness/pilot smoke on port 4000, admin production build, and Android export.

Reviewing the workflow against the new Step 13 QA command exposed one integration omission: `pnpm qa:integration-verification` was registered and documented but was not itself invoked by CI. That meant its new assertions were not automatically enforced on every pull request.

## Fix applied

- Add a dedicated `Final integration verification contracts` step to `.github/workflows/verify.yml`, immediately after `pnpm check`.
- Strengthen `scripts/test-final-integration-verification.mjs` to assert that CI contains the command, preventing this omission from recurring.

## Validation

The pull request's GitHub Actions workflow must pass with the new step included. Do not treat the earlier successful Step 13 workflow as validation of this new change; it ran before this CI integration fix.

## Safety

This fix does not deploy, run local/production migrations, change runtime behavior, enable billing, or authorize release. Database migrations in CI remain scoped to its ephemeral PostgreSQL service. Physical Android acceptance, actual Kabul pilot evidence, backup/restore and media recovery, monitoring/security review, and human go/no-go approval remain mandatory.
