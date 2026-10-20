import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
test("Group C: property detail has accessible summary, area, location and description",()=>{
 const s=read("apps/mobile/app/property/[id].tsx");
 for(const token of ["PropertyGallery","ScreenHeading","StatusBadge","priceSummary","InfoMetric","copy.location","copy.description","copy.noAddress","formatNumber(a.areaM2,locale)"]) assert.ok(s.includes(token),token);
});
test("Group C: inquiry, viewing, safe contact and reporting retain existing permissions",()=>{
 const s=read("apps/mobile/app/property/[id].tsx");
 for(const token of ['pathname:"/inquiries/new"','pathname:"/viewings/new"','pathname:"/report/[listingId]"',
  "disabled={!canContact}","!d.contact.allowPhone","!d.contact.allowWhatsApp","getContact(id,channel)"]) assert.ok(s.includes(token),token);
});
test("Group C: detail reload and gallery preserve localization and photo privacy",()=>{
 const s=read("apps/mobile/app/property/[id].tsx"),g=read("apps/mobile/src/property-gallery.tsx");
 for(const code of ["en:{location:","fa:{location:","ps:{location:","setRetry(v=>v+1)","[id,locale,retry]"]) assert.ok(s.includes(code),code);
 for(const code of ["roomFilters","fullScreen","photoSource(photo.id)","accessibilityRole"]) assert.ok(g.includes(code),code);
});
