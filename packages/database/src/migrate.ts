import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
import {sql as drizzleSql} from "drizzle-orm";
import {connectDatabase,safeDbEndpoint,transportFromEnvironment} from "./index";
const loaded=loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
if(loaded.error && !process.env.DATABASE_URL){
 console.error("Root .env file is missing or unreadable. Copy .env.example to .env and set DATABASE_URL.");
 process.exit(1);
}
const endpoint=process.env.DATABASE_URL?safeDbEndpoint(process.env.DATABASE_URL):null;
if(endpoint)console.log("Database connection:",endpoint.hostname+":"+endpoint.port,"transport:",transportFromEnvironment());
let lifecycle:ReturnType<typeof connectDatabase>["sql"]|undefined;
async function migrate(){
 const conn=connectDatabase();
 lifecycle=conn.sql;
 // Check connection before attempting schema writes or parsing migration files.
 await conn.db.execute(drizzleSql`SELECT 1`);
 for(const name of ["0001_identity.sql","0002_inventory.sql","0003_discovery.sql","0004_engagement.sql"]){
  const path=fileURLToPath(new URL("../migrations/"+name,import.meta.url));
  await conn.sql.unsafe(readFileSync(path,"utf8"));
  console.log("Applied "+name);
 }
}
try{
 await migrate();
}catch(error){
 const code=(error as {code?:string})?.code;
 if(code==="CONNECT_TIMEOUT"||code==="ETIMEDOUT"||code==="ECONNREFUSED"||code==="ENETUNREACH"||code==="EHOSTUNREACH"){
  console.error("Database network connection failed (",code,"). Migrations may be incomplete.");
  console.error("Check DNS/connection with: pnpm db:diagnose");
  if(endpoint?.neon && transportFromEnvironment()==="tcp")
   console.error("If port 5432 is blocked, set DATABASE_TRANSPORT=websocket in root .env, then rerun pnpm db:diagnose and pnpm db:migrate.");
 }else{
  console.error("Migration failed:",error instanceof Error?error.message:String(error));
 }
 process.exitCode=1;
}finally{
 if(lifecycle)await lifecycle.end().catch(()=>{});
}
