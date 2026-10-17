import {and,eq} from "drizzle-orm";
import type {FastifyInstance} from "fastify";
import {type Database,schema} from "@amlaklink/database";
import {listingDraftSchema} from "@amlaklink/contracts";
import {HttpProblem,requireActor,requireStaffRole} from "./access";
import {getListing,getRevision,requireEditor,validId,canShowPublic} from "./listings";
import {storePhoto,retrievePhoto,removePhoto} from "./media-storage";
export function registerPhotoRoutes(app:FastifyInstance,db:Database){
 app.post<{Params:{id:string}}>("/v1/listings/:id/photos",async request=>{
  const l=await getListing(db,request.params.id),actor=await requireEditor(db,request,l);
  if(["archived","sold","rented"].includes(l.status))throw new HttpProblem(409,"LISTING_IS_CLOSED");
  const existing=await db.select({id:schema.photos.id}).from(schema.photos).where(eq(schema.photos.listingId,l.id));
  if(existing.length>=20)throw new HttpProblem(409,"PHOTO_LIMIT_REACHED");
  const file=await request.file({limits:{fileSize:6_000_000,files:1}});
  if(!file)throw new HttpProblem(422,"IMAGE_REQUIRED");
  if(!["image/jpeg","image/png","image/webp","image/heic","image/heif","image/avif"].includes(file.mimetype))throw new HttpProblem(422,"UNSUPPORTED_IMAGE_TYPE");
  let bytes:Buffer;
  try{bytes=await file.toBuffer();}catch{throw new HttpProblem(413,"IMAGE_SIZE_INVALID");}
  const result=await storePhoto(l.id,bytes);
  const [photo]=await db.insert(schema.photos).values({listingId:l.id,uploaderId:actor.id,storageKey:result.key,
   storageMode:result.mode,bytes:result.bytes,width:result.width,height:result.height,fingerprint:result.fingerprint}).returning();
  return {id:photo.id,bytes:photo.bytes,width:photo.width,height:photo.height,url:"/v1/photos/"+photo.id};
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
