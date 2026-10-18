import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
export function postgresEnv(urlValue:string){
 const url=new URL(urlValue);
 if(!["postgres:","postgresql:"].includes(url.protocol)||!url.hostname||url.pathname==="/")
  throw Error("A complete PostgreSQL URL is required");
 const localhost=["localhost","127.0.0.1","[::1]"].includes(url.hostname);
 return {PGHOST:url.hostname,PGPORT:url.port||"5432",PGUSER:decodeURIComponent(url.username),
  PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:decodeURIComponent(url.pathname.slice(1)),
  PGSSLMODE:localhost?"disable":"verify-full"};
}
export async function runCommand(command:string,args:string[],env:Record<string,string>,inputFile?:string){
 const {spawn}=await import("node:child_process");
 const {createReadStream}=await import("node:fs");
 const {pipeline}=await import("node:stream/promises");
 const child=spawn(command,args,{env:{...process.env,...env},stdio:[inputFile?"pipe":"ignore","inherit","inherit"],windowsHide:true});
 const ended=new Promise<void>((resolve,reject)=>{
  child.on("error",()=>reject(Error(command+" cannot start. Install PostgreSQL client tools and ensure they are on PATH.")));
  child.on("close",code=>code===0?resolve():reject(Error(command+" exited with status "+code)));
 });
 if(inputFile){
  if(!child.stdin)throw Error("No restoration input stream");
  try{await pipeline(createReadStream(inputFile),child.stdin);}catch(err){child.kill();await ended.catch(()=>{});throw err;}
 }
 await ended;
}
