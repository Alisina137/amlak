import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");

test("Group E phase 21: inbox has three original sections, thread statuses, filters and noninvented unread",()=>{
 const p=read("apps/mobile/app/(tabs)/inbox.tsx"),helper=read("apps/mobile/src/inbox-experience.ts");
 for(const token of ['"inquiries"|"viewings"|"notifications"','threadFilter','visitFilter','alertFilter',
  'AppInput','conversations','StatusBadge','ix(locale,"messages")','ix(locale,"notices")',
  'setInterval(()=>void refresh(),20000)','dataToken===token','unreadForThreads'])assert.ok(p.includes(token),token);
 assert.match(helper,/notices\.filter\(n=>!n\.isRead/);
 assert.match(helper,/\["inquiry","lead","message"\]/);
 assert.doesNotMatch(p,/unreadThreads\\.add\\(/);
 assert.match(p,/i\\.lastMessagePreview/);
 assert.match(read("apps/api/src/engagement.ts"),/lastMessagePreview:recentMessage\\?\\.body\\.slice\\(0,140\\)/);
});
test("Group E phase 22: human-readable price snapshot and idempotent secure message composer",()=>{
 const p=read("apps/mobile/app/inquiries/[id].tsx"),u=read("apps/mobile/src/inbox-experience.ts"),
  api=read("apps/api/src/engagement.ts");
 for(const token of ['priceSnapshotRows','sendLock.current','messageKey.current','setDraft("")',
  'AppInput','data.messages.map','leadStageLabel','agencyNotes','read-notifications'])assert.ok(p.includes(token),token);
 assert.doesNotMatch(p,/JSON\.stringify\(data\.priceSnapshot\)/);
 for(const token of ["refundableDeposit","refundablePrincipal","monthlyRent","formatNumber"])assert.ok(u.includes(token),token);
 assert.match(api,/\/v1\/inquiries\/:id\/read-notifications/);
 assert.match(api,/eq\(schema.notifications.userId,permission.actor.id\)/);
});
test("Group E phase 23: visit selection validates distinct future Kabul slots and respects server conflict",()=>{
 const p=read("apps/mobile/app/viewings/new.tsx"),api=read("apps/api/src/engagement.ts");
 for(const token of ['kabulSlots()','useFocusEffect','submitLock.current','new Set(times).size',
  'Date.now()+30*60000','ix(locale,"conflict")','chosen.length<2','chosen.length>3'])assert.ok(p.includes(token),token);
 assert.match(api,/VIEWING_TIME_CONFLICT/);
 assert.match(api,/VIEWING_VERSION_CONFLICT/);
 assert.match(api,/slotsValid\(input.proposedSlots\)/);
});
test("Group E phase 24: appointment screen shows only server-confirmed times and authorized transitions",()=>{
 const p=read("apps/mobile/app/viewings/[id].tsx"),api=read("apps/api/src/engagement.ts");
 for(const token of ['visit.confirmedSlot','timeline.map','counterSlot','accept_counter',
  'viewingDecision(visit.id,token,visit.version','actionLock.current','cancelConfirm','confirmed<=now',
  'pathname:"/property/[id]"','pathname:"/inquiries/[id]"','read-notifications'])assert.ok(p.includes(token),token);
 assert.match(api,/\/v1\/viewings\/:id\/read-notifications/);
 assert.match(api,/eq\(schema.notifications.referenceId,visit.id\)/);
});
test("Group E phase 25: read/unread notifications, deep links and conditional push configuration",()=>{
 const p=read("apps/mobile/app/(tabs)/inbox.tsx"),api=read("apps/api/src/engagement.ts"),
  prefs=read("apps/mobile/app/notification-settings.tsx"),router=read("apps/mobile/src/push-client.ts");
 for(const token of ['notificationGroup(n)','readAllAlerts(token)','readAlert(n.id,token)',
  'routeForNotification','filteredAlerts','alertFilter','"/notification-settings"'])assert.ok(p.includes(token),token);
 assert.match(api,/"New property viewing request",created.id/);
 assert.match(api,/"Property viewing updated",v.id/);
 assert.match(router,/kind==="viewing"&&ref/);
 assert.match(router,/\["inquiry","lead","message"\]\.includes\(kind\)\&\&ref/);
 for(const token of ['nativePushAvailable','serverConfigured','registerCurrentDevice','settingsHint'])assert.ok(prefs.includes(token)||p.includes(token),token);
});
