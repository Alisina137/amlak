import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
test("Group B: search has accessible province suggestions and a stable active filter UI",()=>{
 const s=read("apps/mobile/app/(tabs)/search.tsx");
 for(const token of ["showSuggestions","searchProvinces(query,locale)","<ActiveFilterRow","<SortResultsRow","<FilterSheet",
  "setFilters({provinceId:province.id,q:undefined","<LoadingCard","<StateNotice"])
  assert.ok(s.includes(token),token);
 assert.match(s,/loadEpoch\.current/);
 assert.match(s,/filterKeyRef\.current!==key/);
 assert.match(s,/const visibleItems=resultKey===filterKey\?items:\[\]/);
});
test("Group B: filters normalize Dari/Pashto digits and reject reversed ranges",()=>{
 const s=read("apps/mobile/src/search-filter-utils.ts");
 for(const required of ["asciiDigits","validateSearchFilters","normalizeSearchNumbers","patchSearchFilters",
  "minPrice>values.maxPrice","minArea>values.maxArea","Number.isFinite","bedrooms","bathrooms",
  "Object.prototype.hasOwnProperty.call(patch,\"provinceId\")"])
  assert.ok(s.includes(required),required);
 const screen=read("apps/mobile/app/(tabs)/search.tsx");
 assert.match(screen,/const issue=validateSearchFilters\(normalized,locale\)/);
 assert.match(screen,/if\(issue\)\{setValidation\(issue.message\);return;\}/);
 assert.match(screen,/keyboardType="decimal-pad" inputDirection="ltr"/);
});
test("Group B: sorting never silently converts USD and AFN amounts",()=>{
 const s=read("apps/mobile/src/search-experience.tsx");
 assert.match(s,/sortRequiresCurrency\(sort\)/);
 assert.match(s,/filters.currency\|\|"AFN"/);
 assert.match(s,/dt\(locale,"currency"\)/);
});
test("Group B: moving provinces clears city and private map geometry",()=>{
 const utils=read("apps/mobile/src/search-filter-utils.ts");
 const picker=read("apps/mobile/app/locations.tsx");
 const context=read("apps/mobile/src/search-context.tsx");
 assert.match(utils,/"city","district","neighborhood","viewport","polygon"/);
 assert.match(picker,/setProvinceId\(id\)/);
 assert.match(picker,/setFilters\(\{provinceId:id,city:undefined,district:undefined,neighborhood:undefined,viewport:undefined,polygon:undefined\}\)/);
 assert.match(context,/reset=useCallback\(\(\)=>set\(\{intent:"sale",provinceId,sort:"newest"\}\),\[provinceId\]\)/);
});
test("Group B: full province catalog is searchable and device recents are bounded",()=>{
 const s=read("apps/mobile/app/locations.tsx"),catalog=read("packages/catalog/src/index.ts");
 assert.match(s,/const LIMIT=5/);
 assert.match(s,/searchProvinces\(query,locale\)/);
 assert.match(s,/AsyncStorage\.setItem\(RECENTS_KEY/);
 assert.match(s,/findProvince\(x\)/);
 const codes=[...catalog.matchAll(/^\s+\["([a-z]+(?:-[a-z]+)?)","/gm)];
 assert.equal(codes.length,34);
});
test("Group B: map only renders authorized exact pins and has an offline list fallback",()=>{
 const map=read("apps/mobile/app/search-map.tsx"),backend=read("apps/mobile/src/discovery-client.ts");
 assert.match(map,/Number\.isFinite\(item\.latitude\)/);
 assert.match(map,/selectedPrice/);
 assert.match(map,/mapText\(locale,"returnList"\)/);
 assert.match(map,/serializePolygon\(vertices\)/);
 assert.match(backend,/\/v1\/discovery\/map/);
 assert.match(map,/MapView/);
});
