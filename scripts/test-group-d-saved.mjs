import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
test("Group D 16: Saved preserves exactly five bottom tabs and adds three internal sections",()=>{
 const layout=read("apps/mobile/app/(tabs)/_layout.tsx"),saved=read("apps/mobile/app/(tabs)/saved.tsx");
 for(const token of ['"favorites"|"searches"|"shortlists"','<FilterChip','savedTabs(locale)',
  'active==="favorites"','active==="searches"','active==="shortlists"',
  'previews.token===token','snapshot.token===token','setLoading(true)',
  '/v1/saved-searches','/v1/shortlists'])assert.ok(saved.includes(token),token);
 assert.match(layout,/initialRouteName="index"/);
});
test("Group D 17: favorites support selection, removal, undo and unavailable states",()=>{
 const s=read("apps/mobile/app/(tabs)/saved.tsx");
 for(const token of ['accessibilityRole="checkbox"','effectiveSelection.length<2','effectiveSelection.length>4',
  'comparable(item)','setLastRemoved(item)','async function undo','await toggle(lastRemoved.id)',
  'selected.filter','/v1/favorites','LoadingCard','StateNotice'])assert.ok(s.includes(token),token);
 assert.match(s,/epoch\.current!==version\|\|tokenRef\.current!==token/);
});
test("Group D 18: 2 to 4 property comparisons display genuine pricing and missing values",()=>{
 const s=read("apps/mobile/app/compare.tsx"),api=read("apps/api/src/growth.ts");
 for(const token of ['ScrollView horizontal','onlyDifferences','new Set(values).size>1',
 'refundableDeposit','refundablePrincipal','monthlyRent','furnished','parking','water','electricity',
 'savedText(locale,"missing")','result.currenciesDiffer','[ids,locale,retry]'])assert.ok(s.includes(token),token);
 assert.match(api,/ids:z\.array\(z\.uuid\(\)\)\.min\(2\)\.max\(4\)/);
});
test("Group D 19: saved searches provide readable localized filters, alerts and rename without cursor reset",()=>{
 const s=read("apps/mobile/app/saved-searches.tsx"),api=read("apps/api/src/growth.ts"),
  utils=read("apps/mobile/src/saved-utils.ts");
 for(const token of ['savedFilterSummary','editingTitle','title:editingTitle.trim()',
  'alertsEnabled:v','replaceFilters','/v1/saved-searches','filters.viewport','maxLength={80}'])assert.ok(s.includes(token),token);
 assert.match(api,/title:z\.string\(\)\.trim\(\)\.min\(2\)\.max\(80\)\.optional\(\)/);
 assert.match(api,/title!==undefined\?\{title\}:\{\}/);
 assert.match(api,/alertsEnabled!==undefined\?\{alertsEnabled,lastScannedAt:new Date\(\),lastListingId:null\}:\{\}/);
 assert.match(utils,/\["viewport","polygon","cursor","limit","sort"\]/);
});
test("Group D 20: shortlists keep member permissions, pending invitations, votes and private placeholders",()=>{
 const index=read("apps/mobile/app/shortlists/index.tsx"),
  detail=read("apps/mobile/app/shortlists/[id].tsx"),backend=read("apps/api/src/shortlists.ts");
 for(const token of ['membershipStatus==="pending"','/v1/shortlists','setSnapshot','BackButton'])assert.ok(index.includes(token),token);
 for(const token of ['groupSummary','detail.isOwner','/invitations','accessibilityLabel={t.notes}',
  'item.available','interestedCount','passCount','item.votes','t.unavailable'])assert.ok(detail.includes(token),token);
 assert.match(backend,/shortlistAccess\(db,id,actor.id,true\)/);
 assert.match(backend,/available:!!property/);
});
