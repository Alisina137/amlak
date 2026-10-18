import assert from "node:assert/strict";
import test from "node:test";
import {randomUUID} from "node:crypto";
import {pushReadiness} from "./push-readiness";

test("push preflight is fail closed unless explicitly enabled and linked to real matching UUIDs",()=>{
 const id=randomUUID(),other=randomUUID();
 const disabled=pushReadiness({});
 assert.equal(disabled.environmentReady,false);
 assert.ok(disabled.blocking.some(x=>x.includes("AMLAK_PUSH_ENABLED")));
 assert.ok(disabled.blocking.some(x=>x.includes("AMLAK_EXPO_PROJECT_ID")));
 const ready=pushReadiness({AMLAK_PUSH_ENABLED:"true",AMLAK_EXPO_PROJECT_ID:id,
  EXPO_PUBLIC_EAS_PROJECT_ID:id});
 assert.equal(ready.environmentReady,true);
 assert.ok(ready.externalChecks.some(x=>x.includes("FCM V1")));
 assert.ok(ready.notice.includes("do not verify"));
 const mismatched=pushReadiness({AMLAK_PUSH_ENABLED:"true",AMLAK_EXPO_PROJECT_ID:id,
  EXPO_PUBLIC_EAS_PROJECT_ID:other});
 assert.equal(mismatched.environmentReady,false);
 assert.ok(mismatched.blocking.some(x=>x.includes("do not match")));
 const bogus=pushReadiness({AMLAK_PUSH_ENABLED:"true",AMLAK_EXPO_PROJECT_ID:"not-a-uuid"});
 assert.equal(bogus.environmentReady,false);
});
