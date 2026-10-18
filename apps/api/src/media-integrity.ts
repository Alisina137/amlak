import {createHash} from "node:crypto";
import {desc,sql} from "drizzle-orm";
import {type Database,schema} from "@amlaklink/database";
import {retrievePhoto} from "./media-storage";

export function verifyPhotoIntegrity(row:{bytes:number;fingerprint:string;width:number;height:number},content:Buffer){
 if(!Number.isInteger(row.bytes)||row.bytes<=0||row.bytes!==content.length)return "BYTE_COUNT_MISMATCH";
 if(!/^[a-f0-9]{64}$/i.test(row.fingerprint))return "INVALID_FINGERPRINT";
 if(createHash("sha256").update(content).digest("hex")!==row.fingerprint.toLowerCase())
  return "SHA256_MISMATCH";
 if(row.width<320||row.height<240)return "INVALID_DIMENSIONS";
 return null;
}
/** Read-only sample check; S3 object bytes are fetched and hashed, never deleted.
 * Database rows are counted separately so the sample coverage is explicit.
 */
export async function auditMedia(db:Database,limit=10){
 if(!Number.isInteger(limit)||limit<1||limit>100)throw Error("MEDIA_AUDIT_LIMIT must be 1 to 100");
 const [[counts],rows]=await Promise.all([
  db.select({n:sql<number>`count(*)::integer`}).from(schema.photos),
  db.select({id:schema.photos.id,storageKey:schema.photos.storageKey,
   storageMode:schema.photos.storageMode,bytes:schema.photos.bytes,
   fingerprint:schema.photos.fingerprint,width:schema.photos.width,
   height:schema.photos.height}).from(schema.photos)
   .orderBy(desc(schema.photos.createdAt)).limit(limit)
 ]);
 const failures:Record<string,number>={};
 let checked=0;
 for(const p of rows){
  try{
   const bytes=await retrievePhoto(p.storageKey,p.storageMode);
   const issue=verifyPhotoIntegrity(p,bytes);
   if(issue)failures[issue]=(failures[issue]||0)+1;
   else checked++;
  }catch{
   failures["STORAGE_UNAVAILABLE_OR_MISSING"]=(failures["STORAGE_UNAVAILABLE_OR_MISSING"]||0)+1;
  }
 }
 return {totalDatabasePhotos:Number(counts?.n||0),sampleRequested:limit,
  sampled:rows.length,verified:checked,failed:rows.length-checked,
  failures,coverage:"recent photos only; does not detect unreferenced orphaned objects",
  destructiveActions:false,passed:rows.length===checked};
}
