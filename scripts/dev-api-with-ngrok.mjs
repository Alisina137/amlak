import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const API_PORT = 4000;
const READY_URL = `http://127.0.0.1:${API_PORT}/ready`;
const isWindows = process.platform === "win32";
const children = [];
let stopping = false;

function start(command, args, label) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: isWindows,
    env: process.env,
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(`[${label}] Failed to start: ${error.message}`);
    shutdown(1);
  });
  child.on("exit", (code) => {
    if (!stopping) {
      console.error(`[${label}] Exited (code ${code ?? "unknown"}). Stopping the other process.`);
      shutdown(code || 1);
    }
  });
  return child;
}

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    if (isWindows) {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      killer.on("error", () => {});
    } else {
      child.kill("SIGTERM");
    }
  }
  process.exitCode = exitCode;
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[dev:api] Starting Amlak API on port 4000...");
start("pnpm", ["--filter", "@amlaklink/api", "dev"], "api");

let ready = false;
for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
  try {
    const response = await fetch(READY_URL, { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {
    // Wait for the local API to become ready.
  }
  await delay(1000);
}
if (!stopping && !ready) {
  console.error("[dev:api] API /ready did not respond within 60 seconds. Check the API and database.");
  shutdown(1);
}
if (!stopping && ready) {
  console.log("[dev:api] API ready. Starting ngrok http 4000...");
  console.log("[dev:api] ngrok must be installed and authenticated on this machine.");
  console.log("[dev:api] Keep AUTH_DEV_PRINT_CODES=false while exposing the API.");
  start("ngrok", ["http", String(API_PORT)], "ngrok");
}

// Keep this launcher alive while its child processes run.
await new Promise(() => {});
