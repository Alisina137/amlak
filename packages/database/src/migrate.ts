import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {connectDatabase} from "./index";
const {sql}=connectDatabase();
const path=fileURLToPath(new URL("../migrations/0001_identity.sql",import.meta.url));
sql.unsafe(readFileSync(path,"utf8"),[],{prepare:false}).then(()=>console.log("Identity migration applied")).catch(error=>{console.error("Migration error",error);process.exitCode=1;}).finally(async()=>sql.end());
