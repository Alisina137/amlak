import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import {open,appendFile,unlink} from "node:fs/promises";
import {createReadStream,createWriteStream} from "node:fs";
import {pipeline} from "node:stream/promises";
import type {Readable} from "node:stream";
const MAGIC=Buffer.from("AMLAKBK1"),IV_LENGTH=12,TAG_LENGTH=16;
export function backupKey(value=process.env.BACKUP_ENCRYPTION_KEY_HEX){
 if(!value||!/^[\da-f]{64}$/i.test(value))throw Error("BACKUP_ENCRYPTION_KEY_HEX must be 64 random hexadecimal digits (32 bytes).");
 return Buffer.from(value,"hex");
}
export async function encryptBackup(source:Readable,target:string,key:Buffer){
 const nonce=randomBytes(IV_LENGTH),cipher=createCipheriv("aes-256-gcm",key,nonce);
 const output=createWriteStream(target,{flags:"wx",mode:0o600});
 output.write(Buffer.concat([MAGIC,nonce]));
 try{
  await pipeline(source,cipher,output);
  await appendFile(target,cipher.getAuthTag());
 }catch(error){await unlink(target).catch(()=>{});throw error;}
}
export async function decryptBackup(source:string,target:string,key:Buffer){
 const handle=await open(source,"r");
 let size=0,nonce:Buffer,tag:Buffer;
 try{
  size=(await handle.stat()).size;
  if(size<MAGIC.length+IV_LENGTH+TAG_LENGTH+1)throw Error("Encrypted backup is empty or truncated");
  const header=Buffer.alloc(MAGIC.length+IV_LENGTH);await handle.read(header,0,header.length,0);
  if(!header.subarray(0,MAGIC.length).equals(MAGIC))throw Error("Incorrect encrypted backup format");
  nonce=header.subarray(MAGIC.length);
  tag=Buffer.alloc(TAG_LENGTH);await handle.read(tag,0,TAG_LENGTH,size-TAG_LENGTH);
 }finally{await handle.close();}
 const decipher=createDecipheriv("aes-256-gcm",key,nonce!);decipher.setAuthTag(tag!);
 try{
  await pipeline(createReadStream(source,{start:MAGIC.length+IV_LENGTH,end:size-TAG_LENGTH-1}),
   decipher,createWriteStream(target,{flags:"wx",mode:0o600}));
 }catch(error){await unlink(target).catch(()=>{});throw Error("Backup cannot be authenticated. Incorrect key or corrupted data.");}
}
