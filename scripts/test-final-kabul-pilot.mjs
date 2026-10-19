import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const runbook = read("../docs/FINAL-COMPLETION-STEP-11-KABUL-PILOT.md");
const packageJson = JSON.parse(read("../package.json"));

test("Kabul pilot QA command is registered", () => {
  assert.equal(packageJson.scripts["qa:kabul-pilot"], "node --test scripts/test-final-kabul-pilot.mjs");
});

test("pilot has an explicit Step 10 physical-device entry gate", () => {
  assert.match(runbook, /Step 10 physical Android acceptance must be recorded/i);
  assert.match(runbook, /internal rehearsal only/i);
});

test("pilot covers listing lifecycle, inquiries, appointments and moderation", () => {
  for (const phrase of [/listing creation/i, /inquiry delivery/i, /viewing\/appointment request/i, /moderation/i]) {
    assert.match(runbook, phrase);
  }
});

test("privacy, agency isolation, pause process and severity are documented", () => {
  assert.match(runbook, /cross-account exposure/i);
  assert.match(runbook, /least-privilege role/i);
  assert.match(runbook, /P0 — Stop immediately/i);
  assert.match(runbook, /private tracker/i);
});

test("billing stays disabled unless separately approved and port 4000 is explicit", () => {
  assert.match(runbook, /Billing must remain disabled/i);
  assert.match(runbook, /port 4000/i);
  assert.match(runbook, /4040 is not the API/i);
});

test("runbook has a real-world exit gate and blank result record", () => {
  assert.match(runbook, /Exit \/ go-no-go gate/i);
  assert.match(runbook, /Complete after actual field testing/i);
  assert.match(runbook, /Operator and review date:/i);
});

test("Step 10 runbook remains available for prerequisite execution", () => {
  assert.ok(existsSync(new URL("../docs/FINAL-COMPLETION-STEP-10-ANDROID-E2E.md", import.meta.url)));
});
