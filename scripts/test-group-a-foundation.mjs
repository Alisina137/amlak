import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");

test("Group A: screen kit exports consistent accessible controls and loading states",()=>{
 const ui=read("apps/mobile/src/ui.tsx");
 for(const component of ["Page","Action","AppInput","BackButton","SectionCard","ScreenHeading","FilterChip","StatusBadge","SectionHeader","LoadingCard","StateNotice"]){
  assert.match(ui,new RegExp("export function "+component+"\\("));
 }
 assert.match(ui,/accessibilityRole="progressbar"/);
 assert.match(ui,/accessibilityState=\{\{disabled\}\}/);
 assert.match(ui,/accessibilityState=\{\{selected\}\}/);
 assert.match(ui,/keyboardShouldPersistTaps="handled"/);
 assert.match(ui,/foundationText\(locale,status\)/);
});
test("Group A: one network provider shares foreground heartbeat across Page and Home",()=>{
 const api=read("apps/mobile/src/api.ts"),root=read("apps/mobile/app/_layout.tsx"),
  page=read("apps/mobile/src/ui.tsx"),home=read("apps/mobile/app/(tabs)/index.tsx");
 assert.match(api,/export function NetworkProvider/);
 assert.match(api,/const NetworkContext=createContext/);
 assert.match(api,/AppState\.addEventListener/);
 assert.match(api,/setInterval/);
 assert.match(root,/<NetworkProvider>/);
 assert.match(page,/<ConnectionNotice\/>/);
 assert.doesNotMatch(home,/\{offline \? <Pressable/);
});
test("Group A: navigation keeps five tabs, mirrors stack direction and has all account routes",()=>{
 const tabs=read("apps/mobile/app/(tabs)/_layout.tsx"),stack=read("apps/mobile/app/_layout.tsx");
 assert.match(tabs,/initialRouteName="index"/);
 assert.match(tabs,/rtl\?\["account","inbox","saved","search","index"\]/);
 assert.match(tabs,/tabBarAccessibilityLabel/);
 assert.match(tabs,/focused\?"#E1F0E9":"transparent"/);
 assert.match(stack,/animation:isRTL\(locale\)\?"slide_from_left":"slide_from_right"/);
 assert.match(stack,/<Stack.Screen name="account-sessions"/);
 for(const p of ["inquiries/new","viewings/new","viewings/[id]","safety/index","report/[listingId]"]){
  assert.match(read("apps/mobile/app/"+p+".tsx"),/<BackButton onPress=\{\(\)=>router\.back\(\)\}\/>/);
 }
});
test("Group A: trilingual common feedback is complete and numeric identifiers can stay LTR",()=>{
 const copy=read("apps/mobile/src/foundation-copy.ts"),ui=read("apps/mobile/src/ui.tsx");
 for(const key of ["offline","unconfigured","retry","loading","error","nothing","cached","empty"]){
  assert.equal((copy.match(new RegExp("\\b"+key+":","g"))||[]).length,3,key+" appears in all locales");
 }
 assert.match(ui,/inputDirection!=="ltr"\&\&isRTL\(locale\)/);
 assert.match(copy,/locale==="ps"\?"ps-AF":"fa-AF"/);
});
test("Group A: discovery, inbox, saved and property pages use shared states",()=>{
 for(const path of ["apps/mobile/app/(tabs)/search.tsx","apps/mobile/app/(tabs)/saved.tsx",
  "apps/mobile/app/(tabs)/inbox.tsx","apps/mobile/app/my-listings.tsx",
  "apps/mobile/app/property/[id].tsx","apps/mobile/src/listing-ui.tsx"]){
  const page=read(path);
  assert.match(page,/LoadingCard/,path+" skeleton");
  assert.match(page,/StateNotice/,path+" error/retry notice");
 }
 const saved=read("apps/mobile/app/(tabs)/saved.tsx"),
  mine=read("apps/mobile/app/my-listings.tsx");
 assert.match(saved,/snapshot\.token===token\?snapshot\.items:\[\]/);
 assert.match(mine,/snapshot\.token===token\?snapshot\.items:\[\]/);
 assert.match(saved,/epoch\.current!==version\|\|tokenRef\.current!==token/);
 assert.match(mine,/version===epoch\.current\&\&tokenRef\.current===token/);
});
