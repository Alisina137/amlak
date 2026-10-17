import {buildApp} from "./app";
import {connectDatabase} from "@amlaklink/database";
const port=Number(process.env.API_PORT||4000);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error("API_PORT must be a valid TCP port");
const {db,sql}=connectDatabase();
const app=buildApp({db});
async function main(){await app.listen({port,host:process.env.API_HOST||"0.0.0.0"});console.log("AmlakLink API: http://localhost:"+port);}
main().catch(err=>{console.error("API startup failed:",err);process.exitCode=1;});
for(const signal of ["SIGINT","SIGTERM"] as const)process.on(signal,()=>{void app.close().finally(()=>sql.end().finally(()=>process.exit(0)));});
