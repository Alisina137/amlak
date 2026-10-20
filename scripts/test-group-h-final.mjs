import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync,existsSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const includes=(content,...parts)=>{for(const part of parts)assert.ok(content.includes(part),part)};
test("Phase 36: lifecycle actions are explicitly confirmed, with approved public revision preserved",()=>{
 const editor=read("apps/mobile/app/listings/[id]/edit.tsx"),api=read("apps/api/src/listings.ts");
 includes(editor,'function confirmLifecycle','confirmLifecycle("pause")','confirmLifecycle("resume")',
  'confirmLifecycle("close"','confirmLifecycle("confirm-availability")','revisionStatus==="submitted"',
  'listingStatus(locale,"pending_review")','tx("rejected")','revisionReason','pathname:"/property/[id]"');
 includes(api,'approvedRevisionId','currentRevisionId','/v1/listings/:id/submit','/v1/listings/:id/withdraw');
});
test("Phase 37: role scoped agency workspace, team member actions and lead stage filters",()=>{
 const space=read("apps/mobile/app/agency/[id].tsx"),leads=read("apps/mobile/app/agency/[id]/leads.tsx"),
  api=read("apps/api/src/agencies.ts");
 includes(space,'snapshot.scope===scope','epoch.current===version','canManage','!!active',
  'memberRole==="owner"','workspace.canSubmitListing','/v1/agencies/','/revoke',
  'canManage','visibleStaffSections' in {}?'':'ag(locale,"members")');
 includes(leads,'snapshot.scope===scope','"contacted"','"viewing"','"negotiating"',
  'leadStageLabel(locale,item.leadStatus)','item.agencyId===id','i.side==="advertiser"'.replace('i.','i.'));
 includes(api,'requireAgencyMember(db,actor,id','VERIFIED_MEMBER_NOT_FOUND','OWNER_APPROVAL_REQUIRED');
});
test("Phase 38: charts are derived from server metrics; billing stays gated by server flags",()=>{
 const reports=read("apps/mobile/app/agency/[id]/reports.tsx"),
  performance=read("apps/mobile/app/agency/[id]/performance.tsx"),billing=read("apps/mobile/src/billing-ui.tsx");
 includes(reports,'/reports','report.properties.published','report.leads.open','report.contactTaps','snapshot.scope===scope');
 includes(performance,'/performance?days=','answeredWithin24h','avgFirstResponseMinutes','report?.sampled');
 includes(billing,'plans?.illustrativePricing','plans?.billingEnabled','products.map','invoices.map',
  'independentlyVerified' in {}?'':'selectedInvoice','ScrollView horizontal');
 assert.ok(!/completed sales|verified sales\s*=\s*\d/i.test(reports));
});
test("Phase 39: staff navigation hides routes by role; page guards remain server-side",()=>{
 const nav=read("apps/admin/app/admin/staff-nav.tsx"),home=read("apps/admin/app/admin/page.tsx");
 includes(nav,'"moderator"','"support"','"verification"','"billing"','"admin"','"super_admin"',
  'visibleStaffSections','aria-current={selected?"page":undefined}');
 includes(home,'getStaff()','redirect("/admin/login")','StaffNav role={staff.role}','cards.filter');
 for(const [area,roles] of Object.entries({
  listings:'moderator',agencies:'verification',agents:'verification',
  support:'support',billing:'billing',safety:'moderator',pilot:'support'
 })){
  const page=read(`apps/admin/app/admin/${area}/page.tsx`);
  includes(page,"getStaff()",'redirect("/admin/login")','redirect("/admin")','StaffNav role=');
  assert.ok(page.includes(roles),area);
 }
 const style=read("apps/admin/app/globals.css");
 includes(style,'.staff-nav','.admin-quick-grid','@media(max-width:980px)');
});
test("Phase 39: staff review requires reasons, guarded approval and search where applicable",()=>{
 for(const area of ["listings","agencies","agents"]){
  const file=read(`apps/admin/app/admin/${area}/queue.tsx`);
  includes(file,'type="search"','window.confirm','reason','disabled=');
 }
 const support=read("apps/admin/app/admin/support/panel.tsx");
 includes(support,'support-status','support-search','requestId:replyKey.current');
});
test("Phase 40: release gate checks remain separate from human acceptance",()=>{
 for(const file of [
  "scripts/test-final-rtl-ui.mjs","scripts/test-final-network.mjs",
  "scripts/test-final-production-readiness.mjs","scripts/test-final-integration-verification.mjs",
  "docs/GROUP-H-FINAL-READINESS.md",
 ])assert.ok(existsSync(resolve(root,file)),file);
 const packageJson=JSON.parse(read("package.json"));
 includes(packageJson.scripts["qa:ui"],"scripts/test-group-h-final.mjs");
 includes(packageJson.scripts["check"],"pnpm typecheck","pnpm test");
 includes(read("docs/GROUP-H-FINAL-READINESS.md"),"physical Android","manual","not production approval");
});
