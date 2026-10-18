import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {connectDatabase} from "@amlaklink/database";
import {scanSavedSearchAlerts} from "./growth-alerts";
loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
const execute=process.argv.includes("--execute");
if(process.argv.some(a=>!["--execute","--dry-run"].includes(a)))throw new Error("Only --dry-run or --execute are allowed");
const {db,sql}=connectDatabase();
try{
 const result=await scanSavedSearchAlerts(db,{execute});
 console.log(JSON.stringify(result,null,2));
 if(!execute)console.log("DRY RUN; use pnpm ops:alerts --execute after confirming notification settings.");
}catch(err){console.error("Saved-search alert scan failed:",(err as Error).message);process.exitCode=1;}
finally{await sql.end().catch(()=>{});}
