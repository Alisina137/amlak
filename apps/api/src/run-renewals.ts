import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {connectDatabase} from "@amlaklink/database";
import {scanSubscriptionRenewals} from "./subscription-worker";

loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
const args=process.argv.slice(2);
const flags=new Set(["--dry-run","--execute","--all"]);
if(args.some(v=>!flags.has(v)&&!/^--limit=\d{1,3}$/.test(v)&&
 !/^--cursor=[A-Za-z0-9_-]{1,180}$/.test(v)))
 throw Error("Use --dry-run or --execute, optionally --all, --limit=1..100, --cursor=<token>.");
if(args.includes("--execute")&&args.includes("--dry-run"))
 throw Error("Choose exactly one of --execute or --dry-run");
if(args.filter(x=>x==="--execute").length>1||args.filter(x=>x==="--dry-run").length>1||
 args.filter(x=>x==="--all").length>1)
 throw Error("Duplicate operation flags are not allowed");
const values=(prefix:string)=>args.filter(v=>v.startsWith(prefix)).map(v=>v.slice(prefix.length));
if(values("--limit=").length>1||values("--cursor=").length>1)
 throw Error("Only one limit and one cursor are accepted");
const execute=args.includes("--execute"),all=args.includes("--all"),limit=Number(values("--limit=")[0]||100);
if(!Number.isInteger(limit)||limit<1||limit>100)throw Error("limit must be 1 through 100");
const {db,sql}=connectDatabase();
let cursor=values("--cursor=")[0];
const aggregate={execute,scanned:0,due:0,notified:0,skippedRenewed:0,batches:0,
 complete:false,nextCursor:null as string|null,at:new Date().toISOString()};
try{
 // One timestamp for all pages so a long drain has stable expiry windows.
 const now=new Date();
 for(let page=0;page<(all?20:1);page++){
  const current=await scanSubscriptionRenewals(db,{execute,now,limit,cursor});
  aggregate.batches++;
  for(const key of ["scanned","due","notified","skippedRenewed"] as const)
   aggregate[key]+=current[key];
  aggregate.nextCursor=current.nextCursor;
  if(!current.hasMore){aggregate.complete=true;break;}
  cursor=current.nextCursor||undefined;
 }
 console.log(JSON.stringify(aggregate,null,2));
 if(!execute)console.log("DRY RUN: no notifications sent, no invoices or paid entitlements modified.");
 if(!aggregate.complete){
  console.error("Renewal backlog remains. Re-run with --all or nextCursor after reviewing capacity.");
  process.exitCode=2; // Alert operators/schedulers instead of silently losing reminders.
 }
}catch(error){
 console.error("Subscription reminder scan failed:",error instanceof Error?error.message:"UNKNOWN");
 process.exitCode=1;
}finally{await sql.end().catch(()=>{});}
