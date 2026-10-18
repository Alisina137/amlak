import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const file=path=>readFileSync(resolve(root,path),"utf8");
test("API retry policy remains bounded and read-only",()=>{
 const s=file("apps/mobile/src/auth.tsx");
 assert.match(s,/GET_ATTEMPTS=3/);
 assert.match(s,/attempts=read\?GET_ATTEMPTS:1/);
 assert.match(s,/retryableReadStatus\(response.status\)/);
 assert.match(s,/retryDelayMs\(attempt,response.headers.get\("Retry-After"\)\)/);
 assert.match(s,/REQUEST_TIMEOUT/);
 assert.match(s,/NETWORK_UNAVAILABLE/);
 assert.match(s,/throw new ApiError\("INVALID_SERVER_RESPONSE"/);
 assert.doesNotMatch(s,/attempts=3/);
});
test("public offline cached discovery expires, is bounded and ignores corrupt JSON",()=>{
 const s=file("apps/mobile/src/discovery-client.ts");
 assert.match(s,/CACHE_MAX_AGE_MS=48\*3600_000/);
 assert.match(s,/CACHE_LIMIT=24/);
 assert.match(s,/CACHE_PREFIX="amlak:search:v5:"/);
 assert.match(s,/try\{\s*const value=JSON.parse\(raw\)/);
 assert.match(s,/catch\{return null;\}/);
 assert.match(s,/AsyncStorage.multiRemove/);
 assert.match(s,/if\(!cached\)throw error/);
});
test("filter changes discard stale results and sponsored cards never use offline snapshots",()=>{
 const s=file("apps/mobile/app/(tabs)/search.tsx");
 assert.match(s,/loadEpoch\.current/);
 assert.match(s,/filterKeyRef\.current!==key/);
 assert.match(s,/if\(response.fromCache\|\|filters.polygon\|\|filters.viewport\)\{setFeatured\(\[\]\);return;\}/);
 assert.match(s,/const visibleItems=resultKey===filterKey\?items:\[\]/);
 assert.match(s,/visibleCursor/);
});
test("offline drafts are isolated, versioned and never silently overwrite divergent remote edits",()=>{
 const s=file("apps/mobile/app/listings/[id]/edit.tsx");
 assert.match(s,/amlak:draft:v5:/);
 assert.match(s,/user\?\.id/);
 assert.match(s,/cacheChain\.current/);
 assert.match(s,/lastHydrated\.current===data/);
 assert.match(s,/pendingConflict/);
 assert.match(s,/restoreLocal/);
 assert.match(s,/keepServer/);
 assert.match(s,/REQUEST_TIMEOUT|offlineUntil/);
 assert.match(s,/mutableBase&&!pendingConflict/);
});
test("image upload retries are deduplicated under agency/listing lock",()=>{
 const server=file("apps/api/src/photos.ts"),editor=file("apps/mobile/app/listings/[id]/edit.tsx");
 assert.match(server,/schema.photos.fingerprint/);
 assert.match(server,/pg_advisory_xact_lock/);
 assert.match(server,/reused:true/);
 assert.match(server,/removePhoto\(stored.key,stored.mode\)/);
 assert.match(editor,/photoIds.includes\(response.id\)/);
});
test("network awareness and retry controls respond to foreground and offline errors",()=>{
 const status=file("apps/mobile/src/api.ts"),feed=file("apps/mobile/src/listing-ui.tsx");
 assert.match(status,/AppState\.addEventListener/);
 assert.match(status,/setInterval/);
 assert.match(status,/controllerRef\.current\?\.abort/);
 assert.match(feed,/setRetry\(v=>v\+1\)/);
});
