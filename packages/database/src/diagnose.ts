import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {lookup} from "node:dns/promises";
import {connect} from "node:net";
import {sql as drizzleSql} from "drizzle-orm";
import {connectDatabase,safeDbEndpoint,transportFromEnvironment} from "./index";
loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
const url=process.env.DATABASE_URL;
if(!url){
 console.error("DATABASE_URL is missing. Create a root .env file and paste your full connection string from Neon.");
 process.exit(1);
}
const endpoint=safeDbEndpoint(url),transport=transportFromEnvironment();
console.log("DB target:",endpoint.hostname+":"+endpoint.port,endpoint.neon?"(Neon)":"");
console.log("Selected driver:",transport);
console.log("No credentials are printed.");
try{
 const addresses=await lookup(endpoint.hostname,{all:true});
 console.log("DNS resolves:",addresses.map(a=>a.address+" (IPv"+a.family+")").join(", "));
}catch(error){
 const code=(error as {code?:string}).code||"DNS_FAILURE";
 console.error("DNS lookup failed:",code);
 console.error("Verify the endpoint in Neon Console and your network DNS settings.");
 process.exit(1);
}
const connectTcp=()=>new Promise<boolean>(resolve=>{
 const socket=connect({host:endpoint.hostname,port:endpoint.port});
 const timeout=setTimeout(()=>{socket.destroy();resolve(false);},6500);
 socket.once("connect",()=>{clearTimeout(timeout);socket.end();resolve(true);});
 socket.once("error",()=>{clearTimeout(timeout);socket.destroy();resolve(false);});
});
const reachable=await connectTcp();
console.log("TCP "+endpoint.port+":",reachable?"reachable":"not reachable from this PC");
if(!reachable&&endpoint.neon)console.log("If port 5432 is blocked, use DATABASE_TRANSPORT=websocket in root .env for Neon over port 443.");
let connection:ReturnType<typeof connectDatabase>|undefined;
try{
 connection=connectDatabase();
 await Promise.race([
  connection.db.execute(drizzleSql`SELECT 1`),
  new Promise<never>((_,reject)=>setTimeout(()=>reject(Object.assign(new Error("Database query exceeded 30 seconds"),{code:"QUERY_TIMEOUT"})),30000))
 ]);
 console.log("Database query: SUCCESS. Credentials and selected transport work.");
}catch(error){
 const code=(error as {code?:string}).code||"CONNECTION_FAILURE";
 console.error("Database query: FAILED ("+code+").");
 if(code==="28P01")console.error("Password rejected; regenerate the full connection string from Neon.");
 else if(code==="3D000")console.error("Database name is invalid; copy the connection string from Neon.");
 else if(!reachable && transport==="tcp")console.error("Raw TCP is blocked/unreachable; try Neon WebSocket transport. If it also fails, check DNS/firewall/VPN.");
 else if(transport==="websocket")console.error("Neon WebSocket on port 443 failed. Check that HTTPS/WebSocket traffic to Neon is allowed.");
 else console.error("Check the hostname, credentials, database state, TLS and network.");
 process.exitCode=1;
}finally{
 if(connection)await connection.sql.end().catch(()=>{});
}
