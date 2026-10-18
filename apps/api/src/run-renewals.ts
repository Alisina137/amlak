import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {connectDatabase} from "@amlaklink/database";
import {scanSubscriptionRenewals} from "./subscription-worker";

loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
const execute=process.argv.includes("--execute");
if(process.argv.some(arg=>!["--dry-run","--execute"].includes(arg)))
 throw new Error("Only --dry-run or --execute are allowed.");
const {db,sql}=connectDatabase();
try{
 const result=await scanSubscriptionRenewals(db,{execute});
 console.log(JSON.stringify(result,null,2));
 if(!execute)console.log("DRY RUN; use pnpm ops:renewals --execute for actual in-app reminders after verification.");
}catch(error){
 console.error("Subscription reminder scan failed:",error instanceof Error?error.message:String(error));
 process.exitCode=1;
}finally{await sql.end().catch(()=>{});}
