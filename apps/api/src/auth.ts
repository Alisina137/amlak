import {and,desc,eq,gt,isNull,lt,sql} from "drizzle-orm";
import {type FastifyInstance} from "fastify";
import {z} from "zod";
import {authenticator} from "otplib";
import {type Database,schema} from "@amlaklink/database";
import {HttpProblem,parseBearer,requireActor,requireVerified} from "./access";
import {checkTotp,decryptTotp,hashCode,hashToken,newToken,normalizeEmail,passwordCheck,passwordHash,randomCode,verifyCode} from "./security";
import {type SendCode} from "./mail";
const email=z.email().max(254).transform(normalizeEmail);
const password=z.string().min(10).max(128).regex(/[a-zA-Z]/).regex(/[0-9]/);
const name=z.string().trim().min(2).max(100);
const register=z.object({email,password,displayName:name,locale:z.enum(["fa","ps","en"]).default("fa")}).strict();
const login=z.object({email,password:z.string().min(1)}).strict();
const codeBody=z.object({email,code:z.string().regex(/^\d{6}$/)}).strict();
const resetBody=z.object({email,code:z.string().regex(/^\d{6}$/),newPassword:password}).strict();
const staffLoginBody=z.object({email,password:z.string().min(1),totp:z.string().regex(/^\d{6}$/)}).strict();
const generic={message:"If this address is eligible, instructions will be sent."};
function parse<T>(schemaToUse:z.ZodType<T>,body:unknown):T {
 const result=schemaToUse.safeParse(body);
 if(!result.success)throw new HttpProblem(422,"VALIDATION_ERROR");
 return result.data;
}
type Purpose="verify"|"recover";
async function deliverChallenge(db:Database,notify:SendCode,user:{id:string;email:string},purpose:Purpose) {
 const [last]=await db.select({sentAt:schema.challenges.sentAt}).from(schema.challenges)
   .where(and(eq(schema.challenges.email,user.email),eq(schema.challenges.purpose,purpose)))
   .orderBy(desc(schema.challenges.sentAt)).limit(1);
 if(last && Date.now()-last.sentAt.getTime()<60_000)throw new HttpProblem(429,"CODE_COOLDOWN");
 const code=randomCode();
 await notify(user.email,purpose,code);
 await db.insert(schema.challenges).values({userId:user.id,email:user.email,purpose,secretHash:hashCode(user.email,purpose,code),expiresAt:new Date(Date.now()+10*60_000)});
}
async function validateCode(db:Database,mail:string,purpose:Purpose,code:string){
 const [latest]=await db.select().from(schema.challenges).where(and(eq(schema.challenges.email,mail),eq(schema.challenges.purpose,purpose)))
   .orderBy(desc(schema.challenges.sentAt)).limit(1);
 if(!latest || latest.consumedAt || latest.expiresAt.getTime()<=Date.now() || latest.attempts>=5)
   throw new HttpProblem(422,"CODE_INVALID_OR_EXPIRED");
 // Count failed guesses using DB-side atomic increment.
 if(!verifyCode(mail,purpose,code,latest.secretHash)){
   await db.update(schema.challenges).set({attempts:sql`${schema.challenges.attempts}+1`}).where(and(eq(schema.challenges.id,latest.id),isNull(schema.challenges.consumedAt),lt(schema.challenges.attempts,5)));
   throw new HttpProblem(422,"CODE_INVALID_OR_EXPIRED");
 }
 const success=await db.update(schema.challenges).set({consumedAt:new Date()}).where(and(eq(schema.challenges.id,latest.id),isNull(schema.challenges.consumedAt),lt(schema.challenges.attempts,5))).returning({id:schema.challenges.id});
 if(!success.length)throw new HttpProblem(422,"CODE_ALREADY_USED");
 const [user]=await db.select().from(schema.users).where(eq(schema.users.email,mail)).limit(1);
 if(!user || user.status!=="active" || latest.userId!==user.id)throw new HttpProblem(422,"CODE_INVALID_OR_EXPIRED");
 return user;
}
async function issue(db:Database,audience:"user"|"staff",id:string){
 const token=newToken();
 await db.insert(schema.sessions).values({
  tokenHash:hashToken(token),audience,
  ...(audience==="user"?{userId:id}:{staffId:id}),
  expiresAt:new Date(Date.now()+(audience==="user"?30:1)*24*60*60_000),
 });
 return {token,expiresInSeconds:(audience==="user"?30:1)*86400};
}
async function revoke(db:Database,token:string,audience:"user"|"staff"){
 const rows=await db.update(schema.sessions).set({revokedAt:new Date()})
 .where(and(eq(schema.sessions.tokenHash,hashToken(token)),eq(schema.sessions.audience,audience),isNull(schema.sessions.revokedAt)))
 .returning({id:schema.sessions.id});
 return !!rows.length;
}
const userProjection=(u:typeof schema.users.$inferSelect)=>({
 id:u.id,displayName:u.displayName,email:u.email,verified:!!u.emailVerifiedAt,
 advertiserEnabled:u.advertiserEnabled,independentAgentStatus:u.independentAgentStatus,locale:u.locale,status:u.status,
});
export function registerAuthRoutes(app:FastifyInstance,db:Database,notify:SendCode) {
 app.post("/v1/auth/register",{config:{rateLimit:{max:5,timeWindow:"15 minutes"}}},async request=>{
  const values=parse(register,request.body);
  const existing=await db.select({id:schema.users.id}).from(schema.users).where(eq(schema.users.email,values.email)).limit(1);
  if(existing.length)throw new HttpProblem(409,"CONTACT_ALREADY_REGISTERED");
  const [user]=await db.insert(schema.users).values({email:values.email,displayName:values.displayName,passwordHash:await passwordHash(values.password),locale:values.locale}).returning();
  try{await deliverChallenge(db,notify,user,"verify");}catch(err){
   // The user can request another code after delivery is reconfigured, but do not pretend email was sent.
   if(err instanceof HttpProblem)throw err;
   throw new HttpProblem(503,"EMAIL_DELIVERY_UNAVAILABLE");
  }
  return {user:userProjection(user),requiresVerification:true};
 });
 app.post("/v1/auth/resend-verification",{config:{rateLimit:{max:4,timeWindow:"15 minutes"}}},async request=>{
  const {email:mail}=parse(z.object({email}).strict(),request.body);
  const [user]=await db.select().from(schema.users).where(eq(schema.users.email,mail)).limit(1);
  if(!user||user.emailVerifiedAt||user.status!=="active")return generic;
  try{await deliverChallenge(db,notify,user,"verify");}catch(err){
   if(err instanceof HttpProblem)throw err;
   throw new HttpProblem(503,"EMAIL_DELIVERY_UNAVAILABLE");
  }
  return generic;
 });
 app.post("/v1/auth/verify",{config:{rateLimit:{max:8,timeWindow:"15 minutes"}}},async request=>{
  const {email:mail,code}=parse(codeBody,request.body);
  const user=await validateCode(db,mail,"verify",code);
  await db.update(schema.users).set({emailVerifiedAt:new Date(),updatedAt:new Date()}).where(eq(schema.users.id,user.id));
  const tokens=await issue(db,"user",user.id);
  return {...tokens,user:userProjection({...user,emailVerifiedAt:new Date()})};
 });
 app.post("/v1/auth/login",{config:{rateLimit:{max:8,timeWindow:"15 minutes"}}},async request=>{
  const {email:mail,password:pass}=parse(login,request.body);
  const [user]=await db.select().from(schema.users).where(eq(schema.users.email,mail)).limit(1);
  if(!user||user.status!=="active"||!await passwordCheck(pass,user.passwordHash))throw new HttpProblem(401,"INVALID_CREDENTIALS");
  if(!user.emailVerifiedAt)throw new HttpProblem(403,"CONTACT_NOT_VERIFIED");
  return {...await issue(db,"user",user.id),user:userProjection(user)};
 });
 app.post("/v1/auth/recover",{config:{rateLimit:{max:4,timeWindow:"15 minutes"}}},async request=>{
  const {email:mail}=parse(z.object({email}).strict(),request.body);
  const [user]=await db.select().from(schema.users).where(eq(schema.users.email,mail)).limit(1);
  if(!user || !user.emailVerifiedAt || user.status!=="active")return generic;
  try{await deliverChallenge(db,notify,user,"recover");}catch(err){
   if(err instanceof HttpProblem)throw err;
   throw new HttpProblem(503,"EMAIL_DELIVERY_UNAVAILABLE");
  }
  return generic;
 });
 app.post("/v1/auth/recover/complete",{config:{rateLimit:{max:8,timeWindow:"15 minutes"}}},async request=>{
  const values=parse(resetBody,request.body);
  const user=await validateCode(db,values.email,"recover",values.code);
  await db.update(schema.users).set({passwordHash:await passwordHash(values.newPassword),updatedAt:new Date()}).where(eq(schema.users.id,user.id));
  await db.update(schema.sessions).set({revokedAt:new Date()}).where(and(eq(schema.sessions.userId,user.id),isNull(schema.sessions.revokedAt)));
  await db.insert(schema.audit).values({actorType:"user",actorId:user.id,action:"password_reset",targetType:"user",targetId:user.id});
  return {success:true};
 });
 app.get("/v1/me",async request=>{
  const actor=await requireActor(db,request,"user");
  const [user]=await db.select().from(schema.users).where(eq(schema.users.id,actor.id)).limit(1);
  if(!user)throw new HttpProblem(404,"ACCOUNT_NOT_FOUND");
  return {user:userProjection(user)};
 });
 app.patch("/v1/me",async request=>{
  const actor=await requireActor(db,request,"user");
  const values=parse(z.object({displayName:name}).strict(),request.body);
  const [user]=await db.update(schema.users).set({displayName:values.displayName,updatedAt:new Date()}).where(eq(schema.users.id,actor.id)).returning();
  return {user:userProjection(user)};
 });
 app.get("/v1/auth/sessions",async request=>{
  const actor=await requireActor(db,request,"user");
  const active=await db.select({id:schema.sessions.id,createdAt:schema.sessions.createdAt,expiresAt:schema.sessions.expiresAt})
    .from(schema.sessions).where(and(eq(schema.sessions.userId,actor.id),isNull(schema.sessions.revokedAt),gt(schema.sessions.expiresAt,new Date())));
  return {items:active};
 });
 app.delete<{Params:{id:string}}>("/v1/auth/sessions/:id",async request=>{
  const actor=await requireActor(db,request,"user");
  await db.update(schema.sessions).set({revokedAt:new Date()})
    .where(and(eq(schema.sessions.userId,actor.id),eq(schema.sessions.id,request.params.id)));
  return {success:true};
 });
 app.post("/v1/auth/refresh",async request=>{
  const actor=await requireActor(db,request,"user");
  if(!await revoke(db,parseBearer(request),"user"))throw new HttpProblem(401,"SESSION_EXPIRED");
  return await issue(db,"user",actor.id);
 });
 app.post("/v1/auth/logout",async request=>{
  await requireActor(db,request,"user");
  await revoke(db,parseBearer(request),"user");
  return {success:true};
 });
 app.post("/v1/advertiser/activate",async request=>{
  const actor=await requireActor(db,request,"user");
  const user=await requireVerified(db,actor);
  parse(z.object({acceptedRules:z.literal(true)}).strict(),request.body);
  await db.update(schema.users).set({advertiserEnabled:true,updatedAt:new Date()}).where(eq(schema.users.id,actor.id));
  if(!user.advertiserEnabled)await db.insert(schema.audit).values({actorType:"user",actorId:actor.id,action:"seller_activated",targetType:"user",targetId:actor.id});
  return {advertiserEnabled:true,canCreatePrivateDraft:true};
 });
 app.get("/v1/advertiser/capabilities",async request=>{
  const actor=await requireActor(db,request,"user");
  const [user]=await db.select().from(schema.users).where(eq(schema.users.id,actor.id)).limit(1);
  return {verified:!!user?.emailVerifiedAt,advertiserEnabled:!!user?.advertiserEnabled,independentAgentStatus:user?.independentAgentStatus??"none",canCreatePrivateDraft:!!user?.emailVerifiedAt && !!user?.advertiserEnabled,canSubmitListing:!!user?.emailVerifiedAt && (!!user?.advertiserEnabled || user?.independentAgentStatus==="approved")};
 });
 app.post("/v1/staff/auth/login",{config:{rateLimit:{max:6,timeWindow:"15 minutes"}}},async request=>{
  const values=parse(staffLoginBody,request.body);
  const [person]=await db.select().from(schema.staff).where(eq(schema.staff.email,values.email)).limit(1);
  if(!person?.active || !await passwordCheck(values.password,person.passwordHash))
    throw new HttpProblem(401,"INVALID_CREDENTIALS");
  const delta=authenticator.checkDelta(values.totp,decryptTotp(person.totpSecretEncrypted));
  if(delta===null)throw new HttpProblem(401,"INVALID_CREDENTIALS");
  const step=Math.floor(Date.now()/30000)+delta;
  const updated=await db.update(schema.staff).set({lastTotpStep:step})
    .where(and(eq(schema.staff.id,person.id),lt(schema.staff.lastTotpStep,step),eq(schema.staff.active,true)))
    .returning({id:schema.staff.id});
  if(!updated.length)throw new HttpProblem(401,"MFA_CODE_ALREADY_USED");
  await db.insert(schema.audit).values({actorType:"staff",actorId:person.id,action:"staff_login",targetType:"staff",targetId:person.id});
  return { ...await issue(db,"staff",person.id), staff:{id:person.id,displayName:person.displayName,role:person.role} };
 });
 app.get("/v1/staff/me",async request=>{
  const actor=await requireActor(db,request,"staff");
  const [person]=await db.select({id:schema.staff.id,displayName:schema.staff.displayName,role:schema.staff.role}).from(schema.staff).where(eq(schema.staff.id,actor.id)).limit(1);
  return {staff:person};
 });
 app.post("/v1/staff/auth/logout",async request=>{
  await requireActor(db,request,"staff");
  await revoke(db,parseBearer(request),"staff");
  return {success:true};
 });
}
