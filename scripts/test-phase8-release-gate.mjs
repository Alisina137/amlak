import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {
 SIGNOFF_ITEMS,releaseManifestIssues,operationalRisks,runPhase8Qa
} from "./phase8-release-gate.mjs";

function completeEvidence(now=new Date()){
 return {product:"AmlakLink",environment:"production",phase7PilotAccepted:true,
  humanReleaseAuthorized:true,owner:"Pilot release coordinator",
  reviewedAt:now.toISOString(),
  evidence:Object.fromEntries(SIGNOFF_ITEMS.map(k=>[k,{
   passed:true,reviewer:"Separate verified reviewer",recordId:"pilot-ticket-"+k
  }]))};
}
test("CI gate passes only source preflight; never approves release",()=>{
 const r=runPhase8Qa({mode:"ci",env:{}});
 assert.equal(r.mode,"ci");assert.equal(r.passed,true,r.blockers.join(", "));
 assert.equal(r.releaseApproved,false);assert.equal(r.requiresHumanApproval,true);
 assert.match(r.meaning,/NOT release authorization/);
});
test("a manifest is mandatory and every independent pilot signoff must exist",()=>{
 const now=new Date("2026-10-18T07:30:00Z");
 assert.ok(releaseManifestIssues(undefined,now).length>0);
 const manifest=completeEvidence(now);
 assert.deepEqual(releaseManifestIssues(manifest,now),[]);
 for(const key of SIGNOFF_ITEMS){
  const withMissing=structuredClone(manifest);
  delete withMissing.evidence[key];
  assert.match(releaseManifestIssues(withMissing,now).join(" "),new RegExp(key));
 }
 const stale=completeEvidence(new Date("2026-09-01"));
 assert.ok(releaseManifestIssues(stale,now).some(v=>v.includes("seven days")));
 const bad=completeEvidence(now);bad.humanReleaseAuthorized=false;
 assert.ok(releaseManifestIssues(bad,now).some(v=>v.includes("authorization")));
});
test("dangerous release flags are always explicitly blocked",()=>{
 const env={AUTH_DEV_PRINT_CODES:"true",AMLAK_BILLING_ENABLED:"true",
  AMLAK_PUSH_ENABLED:"true",AMLAK_EXPO_PROJECT_ID:"placeholder",
  DATABASE_URL:"http://wrong",AUTH_CODE_PEPPER:"short",
  STAFF_TOTP_ENCRYPTION_KEY_HEX:"insecure",SMTP_HOST:"",SMTP_FROM:"",
  MEDIA_S3_BUCKET:"",MEDIA_S3_ACCESS_KEY_ID:"",MEDIA_S3_SECRET_ACCESS_KEY:"",
  BACKUP_ENCRYPTION_KEY_HEX:"",EXPO_PUBLIC_API_URL:"http://insecure"};
 const issues=operationalRisks(env);
 assert.ok(issues.length>=9);
 assert.ok(issues.some(v=>v.includes("billing enabled")||v.includes("Billing enabled")));
 assert.ok(issues.some(v=>v.includes("OTP")));
 assert.ok(issues.some(v=>v.includes("HTTPS")));
 assert.equal(JSON.stringify(issues).includes("insecure"),false);
});
test("release command remains blocked without evidence and runtime prerequisites",()=>{
 const r=runPhase8Qa({mode:"release",env:{AUTH_DEV_PRINT_CODES:"false"},evidenceFile:"/file/does/not/exist"});
 assert.equal(r.passed,false);
 assert.equal(r.releaseApproved,false);
 assert.ok(r.blockers.some(v=>v.includes("evidence")));
 assert.ok(r.blockers.some(v=>v.includes("Database URL")));
});
