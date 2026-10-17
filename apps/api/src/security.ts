import {createCipheriv,createDecipheriv,createHmac,createHash,randomBytes,randomInt,timingSafeEqual} from "node:crypto";
import bcrypt from "bcryptjs";
import {authenticator} from "otplib";
export const normalizeEmail=(value:string)=>value.trim().toLowerCase();
export async function passwordHash(value:string){return bcrypt.hash(value,12);}
export async function passwordCheck(value:string,hash:string){return bcrypt.compare(value,hash);}
export function newToken(){return randomBytes(32).toString("base64url");}
export function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
export function randomCode(){return String(randomInt(0,1000000)).padStart(6,"0");}
export function hashCode(email:string,purpose:string,code:string){
 const secret=process.env.AUTH_CODE_PEPPER;
 if(!secret || secret.length<32)throw new Error("AUTH_CODE_PEPPER must contain at least 32 characters");
 return createHmac("sha256",secret).update(email+"|"+purpose+"|"+code).digest("hex");
}
export function verifyCode(email:string,purpose:string,input:string,hash:string){
 const calculated=Buffer.from(hashCode(email,purpose,input),"hex"),stored=Buffer.from(hash,"hex");
 return calculated.length===stored.length && timingSafeEqual(calculated,stored);
}
function key(){
 const value=process.env.STAFF_TOTP_ENCRYPTION_KEY_HEX || "";
 if(!/^[a-f0-9]{64}$/i.test(value))throw new Error("STAFF_TOTP_ENCRYPTION_KEY_HEX must be a 64-character hex AES key");
 return Buffer.from(value,"hex");
}
export function encryptTotp(secret:string) {
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);
 const data=Buffer.concat([cipher.update(secret,"utf8"),cipher.final()]);
 return [iv.toString("hex"),cipher.getAuthTag().toString("hex"),data.toString("hex")].join(":");
}
export function decryptTotp(value:string){
 const parts=value.split(":");
 if(parts.length!==3)throw new Error("Invalid encrypted MFA secret");
 const [iv,tag,data]=parts;const decipher=createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"hex"));
 decipher.setAuthTag(Buffer.from(tag,"hex"));
 return Buffer.concat([decipher.update(Buffer.from(data,"hex")),decipher.final()]).toString("utf8");
}
export function newTotpSecret(){return authenticator.generateSecret();}
export function checkTotp(secret:string,code:string){return authenticator.check(code,secret);}
export function totpUri(email:string,secret:string){return authenticator.keyuri(email,"AmlakLink Staff",secret);}
