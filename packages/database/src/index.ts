import postgres from "postgres";
import {Pool,neonConfig} from "@neondatabase/serverless";
import WebSocket from "ws";
import {drizzle as drizzlePostgres} from "drizzle-orm/postgres-js";
import {drizzle as drizzleNeon} from "drizzle-orm/neon-serverless";
import * as core from "./schema";
import * as inventory from "./listing-schema";
import * as discovery from "./discovery-schema";
import * as engagement from "./engagement-schema";
import * as safety from "./safety-schema";
import * as growth from "./growth-schema";
import * as collaboration from "./collaboration-schema";
import * as support from "./support-schema";
import * as push from "./push-schema";
import * as billingControls from "./billing-controls-schema";
const schema={...core,...inventory,...discovery,...engagement,...safety,...growth,...collaboration,...support,...push,...billingControls};

/** TCP remains the default for local PostgreSQL and existing deployments. */
function createTcp(databaseUrl:string){
 const u=new URL(databaseUrl),local=["localhost","127.0.0.1","::1","[::1]"].includes(u.hostname);
 const sql=postgres(databaseUrl,{max:10,connect_timeout:25,ssl:local?false:"require"});
 return {sql,db:drizzlePostgres(sql,{schema})};
}
export type Database=ReturnType<typeof createTcp>["db"];
export type DatabaseTransport="tcp"|"websocket";
type SqlLifecycle={
 /** Migrations use one simple-protocol query, allowing idempotent SQL migration files. */
 unsafe:(text:string,...args:unknown[])=>Promise<unknown>;
 end:()=>Promise<unknown>;
};
export function transportFromEnvironment():DatabaseTransport{
 const mode=(process.env.DATABASE_TRANSPORT||"tcp").trim().toLowerCase();
 if(mode!=="tcp" && mode!=="websocket")throw new Error("DATABASE_TRANSPORT must be tcp or websocket");
 return mode;
}
export function safeDbEndpoint(databaseUrl:string){
 try{
  const url=new URL(databaseUrl);
  if(!["postgres:","postgresql:"].includes(url.protocol) || !url.hostname || !url.pathname || url.pathname==="/")
   throw Error("Invalid PostgreSQL connection string");
  return {hostname:url.hostname,port:Number(url.port||5432),
   neon:url.hostname.endsWith(".neon.tech")||url.hostname==="neon.tech"};
 }catch{throw new Error("DATABASE_URL must be a full postgres:// or postgresql:// URL with host and database. Copy a new connection string from your provider; do not share its password.");}
}
export function connectDatabase(databaseUrl=process.env.DATABASE_URL):{db:Database;sql:SqlLifecycle}{
 if(!databaseUrl)throw new Error("DATABASE_URL is missing. Add the connection string to the repository root .env file.");
 const target=safeDbEndpoint(databaseUrl);
 if(transportFromEnvironment()==="websocket"){
  if(!target.neon)throw new Error("DATABASE_TRANSPORT=websocket requires a Neon .neon.tech connection string; use tcp for localhost or other PostgreSQL hosts.");
  // Neon WebSockets use port 443 rather than a direct TCP socket to port 5432.
  // The WebSocket driver supports interactive transactions and SELECT FOR UPDATE.
  neonConfig.webSocketConstructor=WebSocket;
  const pool=new Pool({connectionString:databaseUrl,max:10,connectionTimeoutMillis:25000});
  const db=drizzleNeon({client:pool,schema}) as unknown as Database;
  return {db,sql:{unsafe:async(text:string)=>pool.query(text),end:async()=>pool.end()}};
 }
 const {sql,db}=createTcp(databaseUrl);
 return {db,sql:{unsafe:async(text:string)=>sql.unsafe(text,[],{prepare:false}),end:async()=>sql.end()}};
}
export {schema};
