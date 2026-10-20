import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync,existsSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");

test("Expo Router only manually configures registered group navigators",()=>{
 const layout=read("apps/mobile/app/_layout.tsx");
 assert.match(layout,/<Stack.Screen name="\(tabs\)"\s*\/>/);
 // A /viewings folder with new.tsx and [id].tsx but no _layout.tsx is not a Stack screen.
 assert.ok(existsSync(resolve(root,"apps/mobile/app/viewings/new.tsx")));
 assert.ok(existsSync(resolve(root,"apps/mobile/app/viewings/[id].tsx")));
 assert.ok(!existsSync(resolve(root,"apps/mobile/app/viewings/_layout.tsx")));
 assert.doesNotMatch(layout,/<Stack.Screen name="viewings"/);
 assert.doesNotMatch(layout,/<Stack.Screen name="auth"/);
 assert.doesNotMatch(layout,/<Stack.Screen name="agency"/);
 const count=(layout.match(/<Stack.Screen name=/g)||[]).length;
 assert.equal(count,1,"Nested file routes must be discovered automatically, without phantom route names");
});

test("All SecureStore keys use allowed characters, never colons or slashes",()=>{
 const paths=["apps/mobile/src/auth.tsx","apps/mobile/src/push-client.ts"];
 for(const path of paths){
  const source=read(path);
  const match=[...source.matchAll(/const\s+(?:KEY|INSTALL_KEY)\s*=\s*"([^"]+)"/g)];
  assert.ok(match.length, "No key found: "+path);
  for(const [,key] of match){
   assert.match(key,/^[A-Za-z0-9._-]+$/,"SecureStore key must be valid: "+path);
   assert.ok(key.length>0);
  }
 }
});

test("Session hydration catches unexpected native-store failures",()=>{
 const auth=read("apps/mobile/src/auth.tsx");
 assert.match(auth,/try\{saved=await SecureStore\.getItemAsync\(KEY\);\}/);
 assert.match(auth,/catch\{[^}]*return;[^}]*\}/);
 assert.match(auth,/catch\{\/\* Never throw from app bootstrap\. \*\/\}/);
 assert.ok(auth.includes("sessionEpoch.current"),"auth switching protections remain");
 assert.ok(auth.includes("queueCredentialWrite"),"credential write serialization remains");
});
