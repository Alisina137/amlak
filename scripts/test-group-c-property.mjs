import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");

test("Group C phase 11/12: property details preserve pricing, hierarchy and private locations",()=>{
 const s=read("apps/mobile/app/property/[id].tsx");
 for(const token of ["<PropertyGallery","<ScreenHeading","<StatusBadge","priceSummary","InfoMetric",
  "copy.location","copy.description","copy.noAddress","formatNumber(a.areaM2,locale)","d.location.precision",
  "cash(p.refundableDeposit)","cash(p.monthlyRent)","cash(p.refundablePrincipal)",
  "copy.noDescription"])assert.ok(s.includes(token),token);
});
test("Group C phase 13: public gallery has filtered images, full-screen paging, a11y, retry and rotation alignment",()=>{
 const s=read("apps/mobile/src/property-gallery.tsx");
 const copy=read("apps/mobile/src/media-copy.ts");
 for(const token of ["roomFilters","chooseFilter","photoKey","fullScreen","onMomentumScrollEnd",
  "onRequestClose","onShow=","requestAnimationFrame","accessibilityState={{selected",
  "accessibilityState={{disabled","accessibilityLabel","photoSource(photo.id)","onError","setFailed(false)",
  "photo.caption","photoRoomTypes"]){
  // Caption belongs to selected image, not a generic placeholder.
  if(token==="photo.caption")continue;
  assert.ok(s.includes(token),token);
 }
 assert.match(s,/current\?\.caption/);
 for(const locale of ["en","fa","ps"])assert.ok(copy.includes(locale+":{"),locale);
 assert.equal((copy.match(/imageUnavailable:/g)||[]).length,3);
});
test("Group C phase 14: property visit creates inquiry first and then opens viewing slots",()=>{
 const p=read("apps/mobile/app/property/[id].tsx");
 const inquiry=read("apps/mobile/app/inquiries/new.tsx");
 const viewing=read("apps/mobile/app/viewings/new.tsx");
 const chat=read("apps/mobile/app/inquiries/[id].tsx");
 assert.match(p,/pathname:"\/inquiries\/new",params:\{listingId:id,intent:"viewing"\}/);
 assert.doesNotMatch(p,/pathname:"\/viewings\/new",params:\{listingId:id\}/);
 assert.match(inquiry,/viewingIntent=intent==="viewing"/);
 assert.match(inquiry,/openInquiry\(listingId,token,body\.trim\(\),key\)/);
 assert.match(inquiry,/pathname:"\/viewings\/new",params:\{inquiryId:r\.id\}/);
 assert.match(viewing,/requestViewing\(inquiryId,token,chosen,note\.trim\(\),key\)/);
 assert.match(viewing,/if\(!inquiryId\)/);
 assert.match(chat,/pathname:"\/viewings\/new",params:\{inquiryId:data\.id\}/);
});
test("Group C phase 14/15: safe contact disabled when unavailable; action errors in visible footer",()=>{
 const s=read("apps/mobile/app/property/[id].tsx");
 for(const token of ['pathname:"/report/[listingId]"',"disabled={!canContact}",
  "!d.contact.allowPhone","!d.contact.allowWhatsApp","getContact(id,channel)",
  "contactError","setContactError","SafeAreaView edges","setData(null)",
  "onRetry={()=>setRetry(v=>v+1)}"])assert.ok(s.includes(token),token);
});
test("Group C phase 15: viewings use Kabul timezone, verified conversation and idempotency key",()=>{
 const s=read("apps/mobile/app/viewings/new.tsx");
 for(const token of ["Asia/Kabul","kabulSlots()","disabled={busy}",
  "chosen.length<2","chosen.length>3","requestId()",
  "et(locale,\"safety\")","AppInput","new Intl.DateTimeFormat",
  "router.replace({pathname:\"/inquiries/[id]\""])assert.ok(s.includes(token),token);
});
