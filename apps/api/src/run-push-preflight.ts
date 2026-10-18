import {config as loadEnv} from "dotenv";
import {fileURLToPath} from "node:url";
import {pushReadiness} from "./push-readiness";
loadEnv({path:fileURLToPath(new URL("../../../.env",import.meta.url)),quiet:true});
const report=pushReadiness(process.env);
console.log(JSON.stringify(report,null,2));
if(!report.environmentReady)process.exitCode=1;
// Exit success only means local environment flag/UUID checks passed, never EAS/FCM approval.
