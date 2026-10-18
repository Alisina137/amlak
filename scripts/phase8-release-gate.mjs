// Fail-closed Phase 8 preflight. A passing CI check is NOT launch approval.
// No external service calls, no secret values printed and no production writes.
import {readFileSync,existsSync,writeFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
export const SIGNOFF_ITEMS=[
 "kabul_agencies_and_inventory",
 "real_android_weak_network_rtl_talkback",
 "real_push_development_build_fcm",
 "cross_role_access_review",
 "real_finance_statement_reconciliation",
 "refund_credit_and_legal_policy",
 "email_mfa_and_staff_rota",
 "backup_staging_restore_and_media_recovery",
 "map_provider_licensing",
 "seven_day_pilot_observation_and_incidents"
];
const configFiles=[
 "package.json",".env.example","apps/mobile/app.json","apps/mobile/eas.json",
 ".github/workflows/verify.yml","docs/PHASE-7-PILOT.md","docs/PHASE-8-GROWTH.md",
 "docs/PHASE-8-STEP-1-PUSH.md","docs/PHASE-8-STEP-2-MEDIA.md",
 "docs/PHASE-8-STEP-3-SUBSCRIPTIONS.md","docs/PHASE-8-STEP-4-BILLING.md",
 "docs/PHASE-8-STEP-5-AGENCIES.md","docs/PHASE-8-STEP-6-QA.md",
 "packages/database/migrations/0010_billing_controls.sql"
];
export function safeStatus(ok,message){return {ok:Boolean(ok),message};}
export function releaseManifestIssues(manifest,now=new Date()){
 const issues=[];
 if(!manifest||typeof manifest!=="object"||Array.isArray(manifest))
  return ["Private pilot evidence JSON missing or invalid."];
 if(manifest.product!=="AmlakLink"||manifest.environment!=="production")
  issues.push("Product/environment identifiers must be AmlakLink and production.");
 if(manifest.phase7PilotAccepted!==true)issues.push("Phase 7 staffed pilot acceptance not attested.");
 if(manifest.humanReleaseAuthorized!==true)issues.push("External staff release authorization not attested.");
 if(typeof manifest.owner!=="string"||manifest.owner.trim().length<5)
  issues.push("Named accountable release owner is missing.");
 if(!Number.isFinite(Date.parse(manifest.reviewedAt||""))||
   Math.abs(now.getTime()-Date.parse(manifest.reviewedAt))>7*86400_000)
  issues.push("Release review must be dated within seven days of the run.");
 for(const key of SIGNOFF_ITEMS){
  const v=manifest.evidence?.[key];
  if(!v||v.passed!==true||typeof v.reviewer!=="string"||v.reviewer.trim().length<5||
    typeof v.recordId!=="string"||v.recordId.trim().length<6)
   issues.push("Missing independently reviewable acceptance evidence: "+key);
 }
 return issues;
}
export function operationalRisks(env,now=new Date()){
 const risks=[];
 const good=(s)=>typeof s==="string"&&s.trim().length>0;
 if(env.AUTH_DEV_PRINT_CODES==="true")risks.push("AUTH_DEV_PRINT_CODES must be false for release.");
 if(env.AMLAK_BILLING_ENABLED==="true")
  risks.push("Billing enabled: require separately validated provider/legal/merchant release; preflight blocks activation.");
 if(env.AMLAK_PUSH_ENABLED==="true"){
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(env.AMLAK_EXPO_PROJECT_ID||""))
   risks.push("Push enabled without a valid existing EAS project UUID.");
 }
 if(!good(env.DATABASE_URL)||!String(env.DATABASE_URL).startsWith("postgres"))
  risks.push("Database URL not configured.");
 if(!good(env.AUTH_CODE_PEPPER)||env.AUTH_CODE_PEPPER.length<32)
  risks.push("AUTH_CODE_PEPPER not configured to at least 32 characters.");
 if(!/^[a-f0-9]{64}$/i.test(env.STAFF_TOTP_ENCRYPTION_KEY_HEX||""))
  risks.push("Staff MFA encryption key missing/invalid.");
 if(!good(env.SMTP_HOST)||!good(env.SMTP_FROM))
  risks.push("SMTP delivery not configured.");
 if(!good(env.MEDIA_S3_BUCKET)||!good(env.MEDIA_S3_ACCESS_KEY_ID)||!good(env.MEDIA_S3_SECRET_ACCESS_KEY))
  risks.push("Private production S3 media storage incomplete.");
 if(!/^[a-f0-9]{64}$/i.test(env.BACKUP_ENCRYPTION_KEY_HEX||""))
  risks.push("Encrypted backup key missing/invalid.");
 if(!String(env.EXPO_PUBLIC_API_URL||"").startsWith("https://"))
  risks.push("Expo public API URL must use HTTPS.");
 return risks;
}
export function runPhase8Qa({mode="ci",env=process.env,
 evidenceFile=env.AMLAK_RELEASE_EVIDENCE_FILE,now=new Date()}={}){
 if(!["ci","release"].includes(mode))throw Error("Mode must be ci or release");
 const checks=[];
 const expect=(predicate,message)=>checks.push(safeStatus(predicate,message));
 for(const rel of configFiles)expect(existsSync(resolve(root,rel)),"Source present: "+rel);
 const read=rel=>readFileSync(resolve(root,rel),"utf8");
 const rootPkg=JSON.parse(read("package.json"));
 expect(rootPkg.scripts?.check==="pnpm typecheck && pnpm test","TypeScript and tests remain in quality gate.");
 expect(rootPkg.scripts?.["db:migrate"]?.includes("migrate"),"Database migration command exists.");
 expect(read(".github/workflows/verify.yml").includes("pnpm check"),
  "CI runs workspace tests and type checks.");
 expect(read(".github/workflows/verify.yml").includes("expo export --platform android"),
  "CI exports Android app.");
 const template=read(".env.example");
 expect(/^AMLAK_BILLING_ENABLED=false$/m.test(template),"Billing OFF by default.");
 expect(/^AMLAK_PUSH_ENABLED=false$/m.test(template),"Push OFF by default.");
 expect(/^AUTH_DEV_PRINT_CODES=false$/m.test(template),"OTP printing OFF by default.");
 expect(read("apps/mobile/app.json").includes('"defaultLocale": "fa"'),"Dari configured as default.");
 expect(read("apps/mobile/eas.json").includes('"developmentClient": true'),"Development build profile exists.");
 const migration=read("packages/database/src/migrate.ts");
 const expected=["0006_professional_growth.sql","0007_collaboration.sql","0008_support.sql","0009_push.sql","0010_billing_controls.sql"];
 expect(expected.every((f,i)=>migration.includes(f)&&(i===0||migration.indexOf(expected[i-1])<migration.indexOf(f))),
  "Phase 8 migrations registered in ordered sequence.");
 expect(rootPkg.scripts?.["qa:phase8"]?.includes("phase8-release-gate.mjs"),"QA preflight command registered.");
 if(mode==="release"){
  // Evidence files are deliberately local/private. This command only evaluates attestation.
  const risks=operationalRisks(env,now);for(const reason of risks)expect(false,reason);
  let manifest=null;
  if(evidenceFile&&existsSync(resolve(evidenceFile))){
   try{manifest=JSON.parse(readFileSync(resolve(evidenceFile),"utf8"));}catch{}
  }
  for(const reason of releaseManifestIssues(manifest,now))expect(false,reason);
 }
 const failures=checks.filter(x=>!x.ok);
 const summary={mode,checkedAt:now.toISOString(),passed:failures.length===0,
  meaning:mode==="ci"?"Automated static preflight only; NOT release authorization.":
   "Self-attested preflight only; passing cannot replace human/legal/provider approval.",
  checks,blockers:failures.map(x=>x.message),
  releaseApproved:false,requiresHumanApproval:true};
 return summary;
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 const mode=process.argv.includes("--release")?"release":"ci";
 const result=runPhase8Qa({mode});
 const out=process.env.AMLAK_QA_REPORT_FILE;
 if(out)writeFileSync(out,JSON.stringify(result,null,2)+"\n",{flag:"w",mode:0o600});
 for(const item of result.checks)console.log(item.ok?"PASS":"BLOCK",item.message);
 console.log("Release approved: NO — automatic checks never authorize production.");
 console.log("QA RESULT "+(result.passed?"PASS":"FAIL")+" (mode="+mode+")");
 if(!result.passed)process.exitCode=1;
}
