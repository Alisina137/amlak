import {randomUUID,createHash} from "node:crypto";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from "@aws-sdk/client-s3";
import sharp from "sharp";
import {HttpProblem} from "./access";
export type StoredPhoto={key:string;mode:"s3"|"local";bytes:number;width:number;height:number;fingerprint:string};
const mode=()=>process.env.MEDIA_S3_BUCKET?"s3" as const:"local" as const;
const root=()=>resolve(process.env.MEDIA_LOCAL_DIR||".amlak-media");
function client(){return new S3Client({region:process.env.MEDIA_S3_REGION||"us-east-1",...(process.env.MEDIA_S3_ENDPOINT?{endpoint:process.env.MEDIA_S3_ENDPOINT,forcePathStyle:true}:{}),...(process.env.MEDIA_S3_ACCESS_KEY_ID&&process.env.MEDIA_S3_SECRET_ACCESS_KEY?{credentials:{accessKeyId:process.env.MEDIA_S3_ACCESS_KEY_ID,secretAccessKey:process.env.MEDIA_S3_SECRET_ACCESS_KEY}}:{})});}
export async function storePhoto(listingId:string,input:Buffer):Promise<StoredPhoto>{
 if(input.length<200||input.length>6_000_000)throw new HttpProblem(413,"IMAGE_SIZE_INVALID");
 if(mode()==="local" && process.env.NODE_ENV==="production")throw new HttpProblem(503,"MEDIA_STORAGE_NOT_CONFIGURED");
 let image:sharp.Sharp;let meta:sharp.Metadata;
 try{
  image=sharp(input,{limitInputPixels:25_000_000,failOn:"error"});meta=await image.metadata();
  if(!["jpeg","png","webp","heif","avif"].includes(meta.format||"")||!meta.width||!meta.height||meta.width<320||meta.height<240)throw Error("Unsupported image");
 }catch{throw new HttpProblem(422,"INVALID_PROPERTY_IMAGE");}
 const out=await image.rotate().resize({width:1600,height:1600,fit:"inside",withoutEnlargement:true}).webp({quality:78,effort:4}).toBuffer({resolveWithObject:true});
 if(out.data.length>4_000_000)throw new HttpProblem(413,"IMAGE_TOO_LARGE");
 const fingerprint=createHash("sha256").update(out.data).digest("hex"),key="listings/"+listingId+"/"+randomUUID()+".webp";
 if(mode()==="s3")await client().send(new PutObjectCommand({Bucket:process.env.MEDIA_S3_BUCKET,Key:key,Body:out.data,ContentType:"image/webp"}));
 else{await mkdir(join(root(),"listings",listingId),{recursive:true,mode:0o700});await writeFile(join(root(),key),out.data,{flag:"wx",mode:0o600});}
 return {key,mode:mode(),bytes:out.data.length,width:out.info.width,height:out.info.height,fingerprint};
}
export async function retrievePhoto(key:string,storageMode:string):Promise<Buffer>{
 if(!/^listings\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/i.test(key))throw new HttpProblem(404,"PHOTO_NOT_FOUND");
 if(storageMode==="local"){
  if(process.env.NODE_ENV==="production")throw new HttpProblem(503,"MEDIA_STORAGE_NOT_CONFIGURED");
  return readFile(join(root(),key));
 }
 if(storageMode==="s3"){
  if(!process.env.MEDIA_S3_BUCKET)throw new HttpProblem(503,"MEDIA_STORAGE_NOT_CONFIGURED");
  const obj=await client().send(new GetObjectCommand({Bucket:process.env.MEDIA_S3_BUCKET,Key:key}));
  if(!obj.Body)throw new HttpProblem(404,"PHOTO_NOT_FOUND");
  const b=await obj.Body.transformToByteArray();if(b.length>4_000_000)throw new HttpProblem(413,"IMAGE_TOO_LARGE");return Buffer.from(b);
 }
 throw new HttpProblem(404,"PHOTO_NOT_FOUND");
}

export async function removePhoto(key:string,storageMode:string):Promise<void>{
 if(!/^listings\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/i.test(key))throw new HttpProblem(404,"PHOTO_NOT_FOUND");
 if(storageMode==="s3"){
  if(!process.env.MEDIA_S3_BUCKET)throw new HttpProblem(503,"MEDIA_STORAGE_NOT_CONFIGURED");
  await client().send(new DeleteObjectCommand({Bucket:process.env.MEDIA_S3_BUCKET,Key:key}));return;
 }
 if(storageMode==="local" && process.env.NODE_ENV!=="production"){
  const {unlink}=await import("node:fs/promises");
  await unlink(join(root(),key)).catch(e=>{if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;});
  return;
 }
 throw new HttpProblem(503,"MEDIA_STORAGE_NOT_CONFIGURED");
}
