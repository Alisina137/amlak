import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
function dictionary(source,start,end){
 const section=source.slice(source.indexOf(start)+start.length,source.indexOf(end,source.indexOf(start)));
 assert.ok(section.length>100,"Locale dictionary section exists: "+start);
 return new Map([...section.matchAll(/\b([A-Za-z][A-Za-z0-9]*):"([^"]*)"/g)].map(m=>[m[1],m[2]]));
}
test("Dari, Pashto and English have identical, nonempty screen copy keys",()=>{
 const source=read("apps/mobile/src/ui-copy.ts");
 const en=dictionary(source,"const en={","type Key="),
  fa=dictionary(source,"const fa:Record<Key,string>={","const ps:Record"),
  ps=dictionary(source,"const ps:Record<Key,string>={","const dictionaries:");
 assert.ok(en.size>=50,"UI copy should cover navigation and major workflows");
 for(const [locale,set] of [["fa",fa],["ps",ps]]){
  assert.deepEqual([...set.keys()].sort(),[...en.keys()].sort(),locale+" translation keys");
  for(const [key,value] of set){
   assert.ok(value.trim().length>0,locale+" "+key+" has a translation");
   assert.match(value,/[\u0600-\u06FF]/,locale+" "+key+" must not silently fall back to English");
  }
 }
});
test("direction is determined by in-app locale, not just translated strings",()=>{
 const ui=read("apps/mobile/src/ui.tsx"),tabs=read("apps/mobile/app/(tabs)/_layout.tsx");
 assert.match(ui,/flexDirection:isRTL\(locale\)\?"row-reverse":"row"/);
 assert.match(ui,/writingDirection:rtl\?"rtl":"ltr"/);
 assert.match(ui,/export function AppInput/);
 assert.match(ui,/inputDirection!=="ltr"\&\&isRTL\(locale\)/);
 assert.match(ui,/accessibilityLabel=\{uiText\(locale,"back"\)\}/);
 assert.match(tabs,/const order=rtl\?\[\.\.\.tabs\]\.reverse\(\):tabs/);
 assert.match(tabs,/initialRouteName="index"/);
});
test("major screen forms use locale-correct inputs and keep email/numbers LTR",()=>{
 const search=read("apps/mobile/app/(tabs)/search.tsx");
 const editor=read("apps/mobile/app/listings/[id]/edit.tsx");
 const agency=read("apps/mobile/app/agency/[id].tsx");
 const conversation=read("apps/mobile/app/inquiries/[id].tsx");
 assert.match(search,/keyboardType="decimal-pad" inputDirection="ltr"/);
 assert.match(editor,/inputDirection=\{numeric\?"ltr":inputDirection\}/);
 assert.match(editor,/inputDirection="ltr" value=\{data.contact.phone/);
 assert.match(agency,/AppInput inputDirection="ltr"/);
 assert.match(conversation,/isRTL\(locale\)\?"flex-start":"flex-end"/);
 assert.match(conversation,/leadStageLabel\(locale,status\)/);
 assert.match(read("apps/mobile/app/locations.tsx"),/BackButton/);
});
