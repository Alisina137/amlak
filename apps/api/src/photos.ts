import {and,eq,sql} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {type Database,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {HttpProblem,requireActor,requireStaffRole} from "./access";
import {getListing,getRevision,requireEditor,validId,canShowPublic} from "./listings";
import {storePhoto,retrievePhoto,removePhoto} from "./media-storage";
export function registerPhotoRoutes(app:FastifyInstance,db:Database){
 app.post<{Params:{id:string}}>("/v1/listings/:id/photos",
  {config:{rateLimit:{max:18,timeWindow:"15 minutes"}}},async request=>{
  const l=await getListing(db,request.params.id),actor=await requireEditor(db,request,l);
  if(["archived","sold","rented"].includes(l.status))throw new HttpProblem(409,"LISTING_IS_CLOSED");
  const file=await request.file({limits:{fileSize:6_000_000,files:1}});
  if(!file)throw new HttpProblem(422,"IMAGE_REQUIRED");
  if(!["image/jpeg","image/png","image/webp","image/heic","image/heif","image/avif"].includes(file.mimetype))
   throw new HttpProblem(422,"UNSUPPORTED_IMAGE_TYPE");
  let bytes:Buffer;
  try{bytes=await file.toBuffer();}catch{throw new HttpProblem(413,"IMAGE_SIZE_INVALID");}
  // A mobile upload may succeed on the server while the reply is lost. A retry
  // of the exact same normalized image must reuse its original photo ID.
  const stored=await storePhoto(l.id,bytes);
  try{
   const result=await db.transaction(async tx=>{
    // Lock by listing, not just hash: capacity and duplicate detection are atomic.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${l.id}::text))`);
    const [same]=await tx.select({id:schema.photos.id,bytes:schema.photos.bytes,
     width:schema.photos.width,height:schema.photos.height})
     .from(schema.photos).where(and(eq(schema.photos.listingId,l.id),
      eq(schema.photos.uploaderId,actor.id),
      eq(schema.photos.fingerprint,stored.fingerprint))).limit(1);
    if(same)return {...same,reused:true};
    const [count]=await tx.select({n:sql<number>`count(*)::integer`})
     .from(schema.photos).where(eq(schema.photos.listingId,l.id));
    if(Number(count?.n||0)>=20)throw new HttpProblem(409,"PHOTO_LIMIT_REACHED");
    const [photo]=await tx.insert(schema.photos).values({listingId:l.id,uploaderId:actor.id,
     storageKey:stored.key,storageMode:stored.mode,bytes:stored.bytes,
     width:stored.width,height:stored.height,fingerprint:stored.fingerprint})
     .returning({id:schema.photos.id,bytes:schema.photos.bytes,
      width:schema.photos.width,height:schema.photos.height});
    return {...photo,reused:false};
   });
   if(result.reused)await removePhoto(stored.key,stored.mode).catch(()=>{});
   return {...result,url:"/v1/photos/"+result.id};
  }catch(error){
   // A failed DB transaction should not leave freshly stored orphan media.
   await removePhoto(stored.key,stored.mode).catch(()=>{});
   throw error;
  }
 });
 app.delete<{Params:{id:string;photoId:string}}>("/v1/listings/:id/photos/:photoId",async request=>{
  const l=await getListing(db,request.params.id);
  await requireEditor(db,request,l);
  const [photo]=await db.select().from(schema.photos).where(and(eq(schema.photos.listingId,l.id),eq(schema.photos.id,validId(request.params.photoId)))).limit(1);
  if(!photo)throw new HttpProblem(404,"PHOTO_NOT_FOUND");
  for(const revisionId of [l.approvedRevisionId,l.currentRevisionId]){
   if(!revisionId)continue;
   const rev=await getRevision(db,revisionId);
   if((rev.status==="approved"||rev.status==="submitted") && listingDraftSchema.parse(rev.data).photoIds.includes(photo.id))
    throw new HttpProblem(409,"PHOTO_IN_APPROVED_OR_REVIEW_VERSION");
  }
  await removePhoto(photo.storageKey,photo.storageMode);
  await db.delete(schema.photos).where(and(eq(schema.photos.id,photo.id),eq(schema.photos.listingId,l.id)));
  return {success:true};
 });
 app.get<{Params:{id:string}}>("/v1/photos/:id",async(request,reply)=>{
  const [photo]=await db.select().from(schema.photos).where(eq(schema.photos.id,validId(request.params.id))).limit(1);
  if(!photo)throw new HttpProblem(404,"PHOTO_NOT_FOUND");
  const listing=await getListing(db,photo.listingId);
  let allowed=false;
  if(listing.approvedRevisionId && ["published","paused","sold","rented"].includes(listing.status) && await canShowPublic(db,listing)){
   const r=await getRevision(db,listing.approvedRevisionId);
   allowed=listingDraftSchema.parse(r.data).photoIds.includes(photo.id);
  }
  if(!allowed && request.headers.authorization){
   try{await requireEditor(db,request,listing);allowed=true;}catch{}
  }
  if(!allowed && request.headers.authorization){
   try{const actor=await requireActor(db,request,"staff");requireStaffRole(actor,["moderator","admin","super_admin"]);allowed=true;}catch{}
  }
  if(!allowed)throw new HttpProblem(404,"PHOTO_NOT_FOUND");
  const bytes=await retrievePhoto(photo.storageKey,photo.storageMode);
  return reply.type("image/webp").header("Cache-Control",listing.status==="published"?"public,max-age=120":"private,no-store").send(bytes);
 });
}
