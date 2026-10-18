import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {alias} from "drizzle-orm/pg-core";
import {and,eq,isNotNull,isNull,ne,or,sql} from "drizzle-orm";
import {connectDatabase,schema} from "./index";

loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
const {db,sql:connection}=connectDatabase();
try{
 const current=alias(schema.revisions,"qa_current_revisions");
 const approved=alias(schema.revisions,"qa_approved_revisions");
 const [brokenCurrent,brokenApproved,publishedWithoutApproval,duplicateMedia]=await Promise.all([
  db.select({id:schema.listings.id}).from(schema.listings)
   .leftJoin(current,eq(schema.listings.currentRevisionId,current.id))
   .where(and(isNotNull(schema.listings.currentRevisionId),
    or(isNull(current.id),ne(current.listingId,schema.listings.id)))).limit(100),
  db.select({id:schema.listings.id}).from(schema.listings)
   .leftJoin(approved,eq(schema.listings.approvedRevisionId,approved.id))
   .where(and(isNotNull(schema.listings.approvedRevisionId),
    or(isNull(approved.id),ne(approved.listingId,schema.listings.id)))).limit(100),
  db.select({id:schema.listings.id}).from(schema.listings)
   .where(and(eq(schema.listings.status,"published"),isNull(schema.listings.approvedRevisionId)))
   .limit(100),
  db.select({listingId:schema.photos.listingId,uploaderId:schema.photos.uploaderId,
   fingerprint:schema.photos.fingerprint,count:sql<number>`count(*)::integer`})
   .from(schema.photos).groupBy(schema.photos.listingId,schema.photos.uploaderId,
    schema.photos.fingerprint).having(sql`count(*)>1`).limit(100)
 ]);
 const issues={
  invalidCurrentRevisionReferences:brokenCurrent.length,
  invalidApprovedRevisionReferences:brokenApproved.length,
  publishedWithoutApprovedRevision:publishedWithoutApproval.length,
  duplicateImageFingerprints:duplicateMedia.length
 };
 const passed=Object.values(issues).every(v=>v===0);
 console.log(JSON.stringify({passed,issues,
  queryCap:100,cappedCounts:"Counts are lower bounds when there are more than 100 issues.",
  readOnly:true},null,2));
 if(!passed)process.exitCode=1;
}catch(error){
 console.error("Database integrity check could not complete:",error instanceof Error?error.message:"Unknown error");
 process.exitCode=1;
}finally{await connection.end();}
