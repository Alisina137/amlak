import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import {DEFAULT_PROVINCE_ID,findProvince,searchProvinces} from "@amlaklink/catalog";
import {healthSchema,provinceListSchema,provinceQuerySchema} from "@amlaklink/contracts";
import {type Database} from "@amlaklink/database";
import {sql} from "drizzle-orm";
import {HttpProblem} from "./access";
import {registerAuthRoutes} from "./auth";
import {registerAgencyRoutes} from "./agencies";
import {registerAgentRoutes} from "./agents";
import {sendCode,type SendCode} from "./mail";
import multipart from "@fastify/multipart";
import {registerListingRoutes} from "./listings";
import {registerPhotoRoutes} from "./photos";
import {registerDiscoveryRoutes} from "./discovery";
import {registerEngagementRoutes} from "./engagement";
import {registerSafetyRoutes} from "./safety";
import {registerVerificationRoutes} from "./verification";
export function buildApp(options:{db?:Database;mailer?:SendCode}={}){
 const app=Fastify({logger:true,bodyLimit:256*1024,trustProxy:false});
 app.register(rateLimit,{global:true,max:120,timeWindow:"1 minute"});
 app.register(multipart,{limits:{fileSize:6_000_000,files:1}});
 app.addHook("onSend",async(_request,reply,payload)=>{
   reply.header("X-Content-Type-Options","nosniff");reply.header("Referrer-Policy","no-referrer");
   reply.header("Cache-Control","no-store");return payload;
 });
 app.get("/health",async()=>healthSchema.parse({status:"ok",service:"amlaklink-api"}));
 app.get("/ready",async(_request,reply)=>{
  if(!options.db){reply.code(503);return {status:"unavailable",reason:"DATABASE_NOT_CONFIGURED"};}
  try{await options.db.execute(sql`SELECT 1`);return {status:"ok",phase:"safety"};}
  catch{reply.code(503);return {status:"unavailable",reason:"DATABASE_UNREACHABLE"};}
 });
 app.get("/v1/catalog/provinces",async(request,reply)=>{
  const query=provinceQuerySchema.safeParse(request.query);
  if(!query.success){reply.code(400);return {error:"INVALID_PROVINCE_QUERY",requestId:request.id};}
  const items=searchProvinces(query.data.q,query.data.locale);
  return provinceListSchema.parse({country:"AF",defaultProvinceId:DEFAULT_PROVINCE_ID,items,count:items.length});
 });
 app.get<{Params:{id:string}}>("/v1/catalog/provinces/:id",async(request,reply)=>{
  const province=findProvince(request.params.id);
  if(!province){reply.code(404);return {error:"PROVINCE_NOT_FOUND",requestId:request.id};}
  return province;
 });
 if(options.db){registerAuthRoutes(app,options.db,options.mailer||sendCode);registerAgencyRoutes(app,options.db);registerAgentRoutes(app,options.db);registerListingRoutes(app,options.db);registerPhotoRoutes(app,options.db);registerDiscoveryRoutes(app,options.db);registerEngagementRoutes(app,options.db);registerSafetyRoutes(app,options.db);registerVerificationRoutes(app,options.db);}
 app.setNotFoundHandler((request,reply)=>reply.code(404).send({error:"ROUTE_NOT_FOUND",requestId:request.id}));
 app.setErrorHandler((error,request,reply)=>{
  if(error instanceof HttpProblem)return reply.code(error.status).send({error:error.code,requestId:request.id});
  if(error && typeof error==="object" && "statusCode" in error && error.statusCode===429)return reply.code(429).send({error:"RATE_LIMITED",requestId:request.id});
  if(error instanceof Error && /duplicate key value violates unique constraint/i.test(error.message))
    return reply.code(409).send({error:"DUPLICATE_RECORD",requestId:request.id});
  if(error instanceof Error && /invalid input syntax for type uuid/i.test(error.message))
    return reply.code(422).send({error:"INVALID_ID",requestId:request.id});
  app.log.error({err:error,requestId:request.id},"Request failed");
  return reply.code(500).send({error:"INTERNAL_ERROR",requestId:request.id});
 });
 return app;
}
