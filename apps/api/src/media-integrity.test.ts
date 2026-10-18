import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";
import {verifyPhotoIntegrity,auditMedia} from "./media-integrity";

test("media audit validates byte length, SHA256 and image dimensions",()=>{
 const bytes=Buffer.from("AmlaKLink media content fixture");
 const hash=createHash("sha256").update(bytes).digest("hex");
 const row={bytes:bytes.length,fingerprint:hash,width:640,height:480};
 assert.equal(verifyPhotoIntegrity(row,bytes),null);
 assert.equal(verifyPhotoIntegrity({...row,bytes:999},bytes),"BYTE_COUNT_MISMATCH");
 assert.equal(verifyPhotoIntegrity({...row,fingerprint:"wrong"},bytes),"INVALID_FINGERPRINT");
 assert.equal(verifyPhotoIntegrity(row,Buffer.from("AmlaKLink media content CHANGE")),"SHA256_MISMATCH");
 assert.equal(verifyPhotoIntegrity({...row,width:100},bytes),"INVALID_DIMENSIONS");
});
test("media audit is bounded by operator limit",async()=>{
 await assert.rejects(()=>auditMedia({} as never,0),/1 to 100/);
 await assert.rejects(()=>auditMedia({} as never,101),/1 to 100/);
 await assert.rejects(()=>auditMedia({} as never,2.5),/1 to 100/);
});
