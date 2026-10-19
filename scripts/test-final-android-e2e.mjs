import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {test} from "node:test";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const exists=path=>existsSync(resolve(root,path));
test("all five public marketplace tabs have route modules and locale-aware order",()=>{
 const layout=read("apps/mobile/app/(tabs)/_layout.tsx");
 for(const route of ["index","search","saved","inbox","account"]) assert.ok(exists("apps/mobile/app/(tabs)/"+route+".tsx"),"missing tab route: "+route);
 assert.match(layout,/initialRouteName="index"/); assert.match(layout,/rtl\?\["account","inbox","saved","search","index"\]/); assert.match(layout,/\["index","search","saved","inbox","account"\]/);
});
test("critical marketplace destinations exist for property, map and account journeys",()=>{
 for(const path of ["apps/mobile/app/listings/new.tsx","apps/mobile/app/search-map.tsx","apps/mobile/app/(tabs)/inbox.tsx","apps/mobile/app/(tabs)/saved.tsx","apps/mobile/app/(tabs)/account.tsx"]) assert.ok(exists(path),"missing journey screen: "+path);
 const listing=read("apps/mobile/app/listings/new.tsx"); assert.match(listing,/useAuth/); assert.match(listing,/requestJson/); const map=read("apps/mobile/app/search-map.tsx"); assert.match(map,/fetchMap/); assert.match(map,/serializePolygon|parsePolygon/);
});
test("session credentials use secure storage and account transitions are explicit",()=>{ const auth=read("apps/mobile/src/auth.tsx"); assert.match(auth,/expo-secure-store/); assert.match(auth,/SecureStore\./); assert.match(auth,/signOut/); assert.match(auth,/KEY=/); assert.match(auth,/BASE_URL/); });
test("network retries remain read-only and offline discovery is bounded",()=>{ const auth=read("apps/mobile/src/auth.tsx"),discovery=read("apps/mobile/src/discovery-client.ts"); assert.match(auth,/attempts=read\?GET_ATTEMPTS:1/); assert.match(auth,/retryableReadStatus\(response.status\)/); assert.match(discovery,/CACHE_MAX_AGE_MS=48\*3600_000/); assert.match(discovery,/CACHE_LIMIT=24/); assert.match(discovery,/AsyncStorage\.multiRemove/); });
test("offline listing drafts are user-scoped and conflicts require explicit resolution",()=>{ const editor=read("apps/mobile/app/listings/[id]/edit.tsx"); assert.match(editor,/amlak:draft:v5:/); assert.match(editor,/user\?\.id/); assert.match(editor,/pendingConflict/); assert.match(editor,/restoreLocal/); assert.match(editor,/keepServer/); });
test("locale and accessibility primitives are wired into the mobile UI",()=>{ const ui=read("apps/mobile/src/ui.tsx"),layout=read("apps/mobile/app/(tabs)/_layout.tsx"); assert.match(ui,/accessibilityLabel/); assert.match(ui,/writingDirection/); assert.match(ui,/isRTL\(locale\)/); assert.match(layout,/isRTL\(locale\)/); assert.ok(exists("scripts/test-final-rtl-ui.mjs")); });
test("Android app identity, orientation and media permissions are present",()=>{ const app=JSON.parse(read("apps/mobile/app.json")).expo; assert.ok(app.platforms.includes("android")); assert.equal(app.android.package,"af.amlaklink.app"); assert.equal(app.orientation,"portrait"); const plugins=JSON.stringify(app.plugins); assert.match(plugins,/photosPermission/); assert.match(plugins,/cameraPermission/); });
