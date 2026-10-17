import {config as loadEnv} from "dotenv";
loadEnv({path:new URL("../../../.env",import.meta.url).pathname,quiet:true});
import {eq} from "drizzle-orm";
import {connectDatabase,schema} from "@amlaklink/database";
import {encryptTotp,newTotpSecret,normalizeEmail,passwordHash,totpUri} from "./security";
async function main(){
 const email=process.env.STAFF_EMAIL,password=process.env.STAFF_PASSWORD,name=process.env.STAFF_NAME||"Platform Administrator";
 if(!email||!password||password.length<12)throw new Error("Set STAFF_EMAIL and a random STAFF_PASSWORD of at least 12 characters");
 if(process.env.NODE_ENV==="production" && process.env.STAFF_ALLOW_PROVISION!=="true")throw new Error("Production provisioning needs STAFF_ALLOW_PROVISION=true");
 const role=process.env.STAFF_ROLE==="super_admin"?"super_admin":process.env.STAFF_ROLE==="verification"?"verification":undefined;
 if(!role)throw new Error("Set STAFF_ROLE=super_admin or verification");
 const {db,sql}=connectDatabase();
 try{
  const existing=await db.select({id:schema.staff.id}).from(schema.staff).where(eq(schema.staff.email,normalizeEmail(email))).limit(1);
  if(existing.length)throw new Error("Staff email already exists; refusing to overwrite MFA or credentials");
  const secret=newTotpSecret();
  await db.insert(schema.staff).values({email:normalizeEmail(email),displayName:name,passwordHash:await passwordHash(password),role,totpSecretEncrypted:encryptTotp(secret)});
  console.log("Staff account created. Scan this enrollment URI with an authenticator, then store backup securely. This URI is shown only now:");
  console.log(totpUri(normalizeEmail(email),secret));
 }finally{await sql.end();}
}
main().catch(err=>{console.error(err instanceof Error?err.message:"Staff provisioning error");process.exitCode=1;});
