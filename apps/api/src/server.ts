import {buildApp} from "./app";
const app=buildApp();
const portRaw=Number(process.env.API_PORT ?? "4000");
if (!Number.isInteger(portRaw)||portRaw<1||portRaw>65535) throw new Error("API_PORT must be a valid TCP port");
const host=process.env.API_HOST || "0.0.0.0";
async function main(){await app.listen({port:portRaw,host});app.log.info("AmlakLink API listening");console.log("AmlakLink API: http://localhost:"+portRaw);}
main().catch(error=>{console.error("API startup error:",error);process.exitCode=1;});
for (const signal of ["SIGINT","SIGTERM"] as const) process.on(signal,()=>{void app.close().finally(()=>process.exit(0));});
