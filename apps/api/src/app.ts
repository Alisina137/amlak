import Fastify from "fastify";
import { DEFAULT_PROVINCE_ID, findProvince, provinces, searchProvinces } from "@amlaklink/catalog";
import { healthSchema, provinceListSchema, provinceQuerySchema } from "@amlaklink/contracts";
export function buildApp() {
  const app=Fastify({logger:false,bodyLimit:1024*1024});
  app.addHook("onSend",async(_request,reply,payload)=>{
    reply.header("X-Content-Type-Options","nosniff");
    reply.header("Referrer-Policy","no-referrer");
    reply.header("Cache-Control","no-store");
    return payload;
  });
  app.get("/health",async()=>healthSchema.parse({status:"ok",service:"amlaklink-api"}));
  app.get("/ready",async()=>({status:"ok",phase:"foundation"}));
  app.get("/v1/catalog/provinces",async(request,reply)=>{
    const params=provinceQuerySchema.safeParse(request.query);
    if (!params.success) {
      reply.code(400);
      return {error:"INVALID_PROVINCE_QUERY",requestId:request.id};
    }
    const items=searchProvinces(params.data.q,params.data.locale);
    return provinceListSchema.parse({country:"AF",defaultProvinceId:DEFAULT_PROVINCE_ID,items,count:items.length});
  });
  app.get<{Params:{id:string}}>("/v1/catalog/provinces/:id",async(request,reply)=>{
    const province=findProvince(request.params.id);
    if (!province) {reply.code(404);return {error:"PROVINCE_NOT_FOUND",requestId:request.id};}
    return province;
  });
  app.setNotFoundHandler((request,reply)=>{
    reply.code(404).send({error:"ROUTE_NOT_FOUND",requestId:request.id});
  });
  app.setErrorHandler((error,request,reply)=>{
    app.log.error({err:error,requestId:request.id},"Unexpected request failure");
    reply.code(500).send({error:"INTERNAL_ERROR",requestId:request.id});
  });
  return app;
}
