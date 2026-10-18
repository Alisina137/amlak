import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {connectDatabase} from "@amlaklink/database";
import {auditMedia} from "./media-integrity";
loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
const arg=process.argv.find(v=>v.startsWith("--limit="));
const limit=arg?Number(arg.slice("--limit=".length)):10;
const {db,sql}=connectDatabase();
try{
 const report=await auditMedia(db,limit);
 console.log(JSON.stringify(report,null,2));
 if(!report.passed)process.exitCode=1;
}catch(error){
 console.error("Media integrity audit failed:",error instanceof Error?error.message:"Unknown error");
 process.exitCode=1;
}finally{await sql.end();}
