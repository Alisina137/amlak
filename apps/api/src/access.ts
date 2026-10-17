import {and,eq,gt,isNull} from "drizzle-orm";
import {type FastifyRequest} from "fastify";
import {type Database,schema} from "@amlaklink/database";
import {hashToken} from "./security";
export class HttpProblem extends Error {
 constructor(public status:number,public code:string,message?:string){super(message||code);}
}
export type Actor={id:string;audience:"user"|"staff";role?:typeof schema.staff.$inferSelect.role};
export function parseBearer(request:FastifyRequest){
 const auth=request.headers.authorization;
 if(!auth || !/^Bearer [A-Za-z0-9_-]{32,100}$/.test(auth))throw new HttpProblem(401,"AUTH_REQUIRED");
 return auth.slice(7);
}
export async function requireActor(db:Database,request:FastifyRequest,audience:"user"|"staff"):Promise<Actor>{
 const token=parseBearer(request);
 const matches=await db.select().from(schema.sessions).where(and(eq(schema.sessions.tokenHash,hashToken(token)),eq(schema.sessions.audience,audience),isNull(schema.sessions.revokedAt),gt(schema.sessions.expiresAt,new Date()))).limit(1);
 const session=matches[0];
 if(!session)throw new HttpProblem(401,"SESSION_EXPIRED");
 if(audience==="staff"){
   if(!session.staffId)throw new HttpProblem(403,"FORBIDDEN");
   const [person]=await db.select().from(schema.staff).where(eq(schema.staff.id,session.staffId)).limit(1);
   if(!person?.active)throw new HttpProblem(403,"ACCOUNT_DISABLED");
   return {id:person.id,audience,role:person.role};
 }
 if(!session.userId)throw new HttpProblem(403,"FORBIDDEN");
 const [person]=await db.select().from(schema.users).where(eq(schema.users.id,session.userId)).limit(1);
 if(!person || person.status!=="active")throw new HttpProblem(403,"ACCOUNT_DISABLED");
 return {id:person.id,audience};
}
export async function requireVerified(db:Database,actor:Actor){
 if(actor.audience!=="user")throw new HttpProblem(403,"USER_ACCOUNT_REQUIRED");
 const [user]=await db.select().from(schema.users).where(eq(schema.users.id,actor.id)).limit(1);
 if(!user?.emailVerifiedAt)throw new HttpProblem(403,"CONTACT_NOT_VERIFIED");
 if(!user || user.status!=="active")throw new HttpProblem(403,"ACCOUNT_DISABLED");
 return user;
}
export function canSubmitListing(actor:{verified:boolean;advertiserEnabled:boolean;memberRole?:string;agencyActive?:boolean},publisher:"private"|"agency") {
 return !!actor.verified && (publisher==="private"?actor.advertiserEnabled:!!actor.agencyActive && ["owner","manager","agent"].includes(actor.memberRole||""));
}
export async function requireAgencyMember(db:Database,actor:Actor,agencyId:string,allowed:("owner"|"manager"|"agent")[]){
 await requireVerified(db,actor);
 const [agency]=await db.select().from(schema.agencies).where(eq(schema.agencies.id,agencyId)).limit(1);
 if(!agency || agency.status!=="active")throw new HttpProblem(403,"AGENCY_INACTIVE");
 const [membership]=await db.select().from(schema.memberships).where(and(eq(schema.memberships.agencyId,agencyId),eq(schema.memberships.userId,actor.id),eq(schema.memberships.status,"active"))).limit(1);
 if(!membership || !allowed.includes(membership.role))throw new HttpProblem(403,"AGENCY_ACCESS_DENIED");
 return membership;
}
export function requireStaffRole(actor:Actor,roles:typeof schema.staff.$inferSelect.role[]){
 if(actor.audience!=="staff" || !actor.role || !roles.includes(actor.role))throw new HttpProblem(403,"STAFF_PERMISSION_DENIED");
}
