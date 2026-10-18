import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Readable} from "node:stream";
import test from "node:test";
import {encryptBackup,decryptBackup,backupKey} from "./backup-crypto";
test("pilot encrypted backup round trip, bad key and corruption rejected",async()=>{
 const root=await mkdtemp(join(tmpdir(),"amlak-backup-test-"));
 try{
  const key=randomBytes(32),secret=randomBytes(1048576),encrypted=join(root,"backup.enc"),restored=join(root,"restore.pg");
  await encryptBackup(Readable.from([secret]),encrypted,key);
  assert.notDeepEqual(await readFile(encrypted),secret);
  await decryptBackup(encrypted,restored,key);
  assert.deepEqual(await readFile(restored),secret);
  await assert.rejects(()=>decryptBackup(encrypted,join(root,"wrong.pg"),randomBytes(32)),/authenticate/);
  const bytes=await readFile(encrypted);bytes[30]^=1;
  await writeFile(encrypted,bytes);
  await assert.rejects(()=>decryptBackup(encrypted,join(root,"tampered.pg"),key),/authenticate/);
  assert.throws(()=>backupKey("bad"),/64 random/);
 }finally{await rm(root,{recursive:true,force:true});}
});
