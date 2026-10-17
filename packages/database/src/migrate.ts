import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
import {readFileSync} from "node:fs";
import {connectDatabase} from "./index";
const {sql}=connectDatabase();
async function migrate(){
 for(const name of ["0001_identity.sql","0002_inventory.sql","0003_discovery.sql"]){
  const path=fileURLToPath(new URL("../migrations/"+name,import.meta.url));
  await sql.unsafe(readFileSync(path,"utf8"),[],{prepare:false});
  console.log("Applied "+name);
 }
}
migrate().catch(error=>{console.error("Migration error",error);process.exitCode=1;}).finally(async()=>sql.end());
