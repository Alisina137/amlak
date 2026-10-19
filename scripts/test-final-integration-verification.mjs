import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const exists = (path) => existsSync(resolve(root, path));
const rootPackage = JSON.parse(read("package.json"));
const apiPackage = JSON.parse(read("apps/api/package.json"));
const databasePackage = JSON.parse(read("packages/database/package.json"));
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const adminPackage = JSON.parse(read("apps/admin/package.json"));
const runbook = read("docs/FINAL-COMPLETION-STEP-13-INTEGRATION-VERIFICATION.md");
const workflow = read(".github/workflows/verify.yml");
const releaseGate = read("scripts/phase8-release-gate.mjs");

test("Step 13 QA command and root quality scripts are registered", () => {
  assert.equal(rootPackage.scripts["qa:integration-verification"], "node --test scripts/test-final-integration-verification.mjs");
  assert.equal(rootPackage.scripts.check, "pnpm typecheck && pnpm test");
  assert.ok(rootPackage.scripts.typecheck);
  assert.ok(rootPackage.scripts.test);
});

test("pnpm workspace includes apps and packages, with expected app manifests", () => {
  const workspace = read("pnpm-workspace.yaml");
  assert.match(workspace, /apps\/\*/);
  assert.match(workspace, /packages\/\*/);
  assert.equal(apiPackage.name, "@amlaklink/api");
  assert.equal(databasePackage.name, "@amlaklink/database");
  assert.equal(mobilePackage.name, "@amlaklink/mobile");
  assert.equal(adminPackage.name, "@amlaklink/admin");
  for (const path of ["apps/api/tsconfig.json", "apps/mobile/tsconfig.json", "apps/admin/tsconfig.json", "packages/database/tsconfig.json"]) {
    assert.ok(exists(path), "missing workspace config: " + path);
  }
});

test("API, database, admin, and mobile expose expected verification commands", () => {
  assert.ok(apiPackage.scripts.typecheck);
  assert.ok(apiPackage.scripts.test);
  assert.ok(databasePackage.scripts.typecheck);
  assert.ok(databasePackage.scripts.test);
  assert.ok(databasePackage.scripts.migrate);
  assert.ok(adminPackage.scripts.typecheck);
  assert.ok(adminPackage.scripts.build);
  assert.ok(mobilePackage.scripts.typecheck);
  assert.ok(rootPackage.scripts["qa:android-e2e"]);
});

test("CI runs isolated database migrations, workspace checks, QA, API smoke, admin build and Android export", () => {
  for (const phrase of [
    "postgres:16",
    "pnpm --filter @amlaklink/database migrate",
    "Migration rerun safety",
    "pnpm db:integrity",
    "pnpm check",
    "pnpm qa:integration-verification",
    "pnpm qa:phase8",
    "pnpm qa:ui",
    "pnpm qa:network",
    "pnpm qa:billing",
    "http://127.0.0.1:4000/ready",
    "pnpm pilot:smoke",
    "pnpm --filter @amlaklink/admin build",
    "expo export --platform android"
  ]) assert.ok(workflow.includes(phrase), "CI missing integration step: " + phrase);
});

test("API port defaults to 4000 and is not confused with ngrok inspector 4040", () => {
  const server = read("apps/api/src/server.ts");
  assert.match(server, /process\.env\.API_PORT\|\|4000/);
  assert.match(runbook, /port 4040 is the ngrok inspector, not the API/i);
  assert.match(runbook, /port 4000/i);
});

test("release gate remains fail-closed and human approval is mandatory", () => {
  assert.match(releaseGate, /releaseApproved:false/);
  assert.match(releaseGate, /requiresHumanApproval:true/);
  assert.match(runbook, /This is not production approval/i);
  assert.match(runbook, /A PASS here is not a GO decision/i);
});

test("verification runbook keeps database migrations environment-scoped and secrets private", () => {
  assert.match(runbook, /Never run migrations against production/i);
  assert.match(runbook, /verify the selected database hostname\/name/i);
  assert.match(runbook, /Do not print or commit credentials/i);
  assert.match(runbook, /sanitized error output/i);
});

test("prior completion gates and regression QA commands remain available", () => {
  for (const command of [
    "qa:phase8", "qa:android-e2e", "qa:kabul-pilot",
    "qa:production-readiness", "qa:ui", "qa:network", "qa:renewals", "qa:billing"
  ]) assert.ok(rootPackage.scripts[command], "missing regression command: " + command);
  for (const path of [
    "docs/FINAL-COMPLETION-STEP-10-ANDROID-E2E.md",
    "docs/FINAL-COMPLETION-STEP-11-KABUL-PILOT.md",
    "docs/FINAL-COMPLETION-STEP-12-PRODUCTION-READINESS.md",
    "scripts/test-final-android-e2e.mjs",
    "scripts/test-final-kabul-pilot.mjs",
    "scripts/test-final-production-readiness.mjs"
  ]) assert.ok(exists(path), "missing prior gate: " + path);
});
