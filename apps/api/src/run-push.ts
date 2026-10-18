import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {connectDatabase} from "@amlaklink/database";
import {scanPushDeliveries} from "./push-worker";

loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
const execute=process.argv.includes("--execute");
if(process.argv.some(arg=>!["--dry-run","--execute"].includes(arg)))
 throw Error("Only --dry-run or --execute are supported.");
const {db,sql}=connectDatabase();
try{
 const result=await scanPushDeliveries(db,{execute});
 console.log(JSON.stringify(result,null,2));
 if(!execute)console.log("DRY RUN: no push sent. Requires AMLAK_PUSH_ENABLED=true and an EAS project UUID.");
}catch(error){
 console.error("Push worker failure:",error instanceof Error?error.message:"UNKNOWN");
 process.exitCode=1;
}finally{await sql.end().catch(()=>{});}
