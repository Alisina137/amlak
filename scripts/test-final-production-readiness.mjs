import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const runbook = read("../docs/FINAL-COMPLETION-STEP-12-PRODUCTION-READINESS.md");
const packageJson = JSON.parse(read("../package.json"));
const phase8 = read("../scripts/phase8-release-gate.mjs");

test("production readiness QA command is registered", () => {
  assert.equal(packageJson.scripts["qa:production-readiness"], "node --test scripts/test-final-production-readiness.mjs");
});

test("release is explicitly fail-closed and automation never approves production", () => {
  assert.match(runbook, /Current release status: NOT APPROVED/i);
  assert.match(runbook, /A GO is an explicit human operational decision/i);
  assert.match(phase8, /releaseApproved:false/);
  assert.match(phase8, /requiresHumanApproval:true/);
});

test("physical Android acceptance and real Kabul pilot evidence are prerequisites", () => {
  assert.match(runbook, /physical Android acceptance matrix is completed/i);
  assert.match(runbook, /Kabul pilot was actually executed/i);
  assert.match(runbook, /keep the release in internal\/staging use/i);
});

test("security, backups, restore, media recovery and monitoring gates are present", () => {
  for (const phrase of [/encrypted backup/i, /restore drill into an isolated staging environment succeeds/i, /Media\/object-storage recovery is tested/i, /Monitoring covers API availability/i, /account\/agency isolation/i, /An incident exercise is completed/i]) assert.match(runbook, phrase);
});

test("production secrets and non-approved billing remain protected", () => {
  assert.match(runbook, /never copied into GitHub/i);
  assert.match(runbook, /AUTH_DEV_PRINT_CODES=false/i);
  assert.match(runbook, /AMLAK_BILLING_ENABLED=false/i);
  assert.match(runbook, /Never commit credentials/i);
});

test("API port 4000 and ngrok inspector 4040 are not confused", () => {
  assert.match(runbook, /API uses port \*\*4000\*\*/i);
  assert.match(runbook, /port \*\*4040\*\* is not the API/i);
});

test("release candidate commands and human decision record are documented", () => {
  for (const command of ["pnpm qa:production-readiness", "pnpm qa:phase8", "pnpm qa:android-e2e", "pnpm qa:kabul-pilot", "pnpm check"]) assert.ok(runbook.includes(command), "Missing documented command: " + command);
  assert.match(runbook, /Production decision record/i);
  assert.match(runbook, /Decision: \*\*NO-GO \/ GO\*\*/i);
});

test("Step 10, Step 11 and existing release-gate implementations remain available", () => {
  assert.ok(existsSync(new URL("../docs/FINAL-COMPLETION-STEP-10-ANDROID-E2E.md", import.meta.url)));
  assert.ok(existsSync(new URL("../docs/FINAL-COMPLETION-STEP-11-KABUL-PILOT.md", import.meta.url)));
  assert.ok(existsSync(new URL("../scripts/phase8-release-gate.mjs", import.meta.url)));
});
