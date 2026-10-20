import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const detail=read("apps/mobile/app/property/[id].tsx");
const gallery=read("apps/mobile/src/property-gallery.tsx");
const inquiry=read("apps/mobile/app/inquiries/new.tsx");
const copy=read("apps/mobile/src/property-detail-copy.ts");

test("Group C phase 11: property detail offers a readable hero, actions, retry and mobile footer",()=>{
 for(const marker of ["<PropertyGallery","<PriceDetails","<Facts","<BackButton","<LoadingCard",
  "<StateNotice","<StatusBadge","inset.bottom","refresh","router.back()","isSaved(id)"])
  assert.ok(detail.includes(marker),marker);
 assert.match(detail,/retryLabel=\{pd\(locale,"retry"\)\}/);
});
test("Group C phase 12: sale, rent and gharawi prices include explicit zero values",()=>{
 for(const marker of ['data.transactionType==="sale"','data.transactionType==="rent"',
  'data.transactionType==="gharawi"',"refundableDeposit","refundablePrincipal",
  "monthlyRent","maintenanceMonthly","durationMonths","refundTerms","p.negotiable"])
  assert.ok(detail.includes(marker),marker);
 assert.match(detail,/value===undefined\|\|!Number.isFinite\(value\)/);
 assert.match(detail,/pd\(locale,"termsNote"\)/);
});
test("Group C phase 13: photo gallery can filter, open full screen and navigate accessibly",()=>{
 for(const marker of ["roomFilters","selectFilter","fullScreen","pagingEnabled",
  "onMomentumScrollEnd","movePhoto(-1)","movePhoto(1)",
  "accessibilityLabel={text.previous}","accessibilityLabel={text.next}"])
  assert.ok(gallery.includes(marker),marker);
});
test("Group C phase 14: restricted contact and visit journey preserves server gatekeeping",()=>{
 assert.match(detail,/!data.available\|\|data.status!=="published"/);
 assert.match(detail,/data.data.contact.allowPhone/);
 assert.match(detail,/data.data.contact.allowWhatsApp/);
 assert.match(detail,/getContact\(data.id,channel\)/);
 assert.match(detail,/Linking.canOpenURL/);
 assert.match(detail,/intent:"viewing"/);
 assert.match(inquiry,/intent==="viewing"/);
 assert.match(inquiry,/pd\(locale,"viewingMessage"\)/);
 assert.match(inquiry,/router.replace\(\{pathname:"\/viewings\/new"/);
 assert.match(inquiry,/!token\|\|body.trim\(\).length<1/);
});
test("Group C phase 15: only general location, limited verification and true feature flags",()=>{
 assert.match(detail,/findProvince\(d.location.provinceId\)/);
 assert.match(detail,/privateLocation/);
 assert.doesNotMatch(detail,/streetAddress/);
 assert.doesNotMatch(detail,/d.location.latitude/);
 assert.match(detail,/authorizationReviewed/);
 assert.match(detail,/verificationNote/);
 assert.match(detail,/lastConfirmedAt/);
 assert.match(detail,/a\[k\]===true/);
 assert.match(detail,/router.push\(\{pathname:"\/report\/\[listingId\]"/);
 for(const value of ['const en=','const fa:Record<Key,string>','const ps:Record<Key,string>',
  'dictionaries:Record<Locale,Record<Key,string>>','viewingMessage'])
  assert.ok(copy.includes(value),value);
});
