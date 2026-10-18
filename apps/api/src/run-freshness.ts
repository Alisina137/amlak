import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {connectDatabase} from "@amlaklink/database";
import {freshnessSweep} from "./pilot";
loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
const execute=process.argv.includes("--execute");
if(process.argv.some(a=>!["--execute","--dry-run"].includes(a)))throw new Error("Only --dry-run or --execute are allowed");
const {db,sql}=connectDatabase();
try{
 const result=await freshnessSweep(db,{execute,limit:100});
 console.log(JSON.stringify(result,null,2));
 if(!execute)console.log("DRY RUN ONLY; to update availability, use pnpm ops:freshness --execute.");
}catch(err){console.error("Freshness sweep failed:",(err as Error).message);process.exitCode=1;}
finally{await sql.end().catch(()=>{});}
