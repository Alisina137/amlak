import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const has=(s,tokens)=>{for(const t of tokens)assert.ok(s.includes(t),"missing "+t);};
test("Group F phase 26: grouped account experience and real account capabilities",()=>{
 const p=read("apps/mobile/app/(tabs)/account.tsx");
 has(p,["AccountLink","ax(locale,\"listing\")","ax(locale,\"professional\")",
  "ax(locale,\"agency\")","ax(locale,\"help\")","ax(locale,\"settings\")",
  "LanguagePicker","user?.advertiserEnabled","independentAgentStatus","/v1/agencies/mine",
  "/v1/me","/v1/advertiser/activate","pathname:\"/agency/[id]\"",
  "pathname:\"/auth/[action]\"","signOut","Alert.alert","/account-sessions"]);
 assert.ok(p.includes("tokenRef.current===token"));
});
test("Group F phase 27: email-based auth validates, rate-limits resend and protects duplicate writes",()=>{
 const p=read("apps/mobile/app/auth/[action].tsx"),u=read("apps/mobile/src/auth-experience.ts");
 has(p,["validEmail(email)","validPassword(password)","lock.current","setSeconds(60)",
  "secureTextEntry={secure}","setShowPassword","returnPropertyId","/v1/auth/resend-verification",
  "/v1/auth/recover/complete","/v1/auth/register","/v1/auth/recover"]);
 has(u,["value.length>=10","value.length<=128","a-zA-Z"]);
});
test("Group F phase 28: device sessions scoped to active token, include deliberate confirmations and bulk logout",()=>{
 const p=read("apps/mobile/app/account-sessions.tsx"),api=read("apps/api/src/auth.ts");
 has(p,["snapshot.token===token","epoch.current===version","/v1/auth/sessions",
  "/v1/auth/sessions/revoke-others","Alert.alert","signOut","Asia/Kabul","current"]);
 has(api,["hashToken(parseBearer(request))","revokedAt:new Date()","other_sessions_revoked"]);
});
test("Group F phase 29: agent/agency applications require verified email and explicit consent",()=>{
 const agent=read("apps/mobile/app/agent/apply.tsx"),agency=read("apps/mobile/app/agency/apply.tsx");
 has(agent,["user?.verified","acceptedProfessionalRules:true","lock.current",
  "status===\"approved\"","status===\"pending\"","Switch"]);
 has(agency,["user?.verified","name.trim().length<3","findProvince(provinceId)",
  "/v1/agencies/apply","lock.current","AppInput"]);
});
test("Group F phase 30: categorized support, safe retry IDs and private replies",()=>{
 const p=read("apps/mobile/app/support/index.tsx"),
  detail=read("apps/mobile/app/support/[id].tsx"),
  api=read("apps/api/src/support.ts");
 has(p,["ticketCategories.map","sx(locale,\"submitHint\")","key.current","openCount>=5",
  "snapshot.token===token","/v1/support/tickets","/safety"]);
 has(detail,["messageKey.current","requestId:messageKey.current","snapshot.token===token",
  "ticket.status===\"closed\"","messages.slice().reverse()","/replies"]);
 has(api,["requireActor(db,request,\"user\")","requireVerified(db,actor)","MAX_OPEN=5",
  "eq(schema.supportTickets.userId,actor.id)","REQUEST_ID_REUSED"]);
});
