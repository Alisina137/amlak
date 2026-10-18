import {spawn} from "node:child_process";
import {mkdir,unlink} from "node:fs/promises";
import {join,resolve} from "node:path";
import {backupKey,encryptBackup} from "./backup-crypto";
import {postgresEnv} from "./backup-env";
const url=process.env.DATABASE_URL;if(!url)throw Error("DATABASE_URL is missing");
const key=backupKey();
const folder=resolve(process.env.BACKUP_DIRECTORY||".amlak-backups");
await mkdir(folder,{recursive:true,mode:0o700});
const destination=join(folder,"amlak-"+new Date().toISOString().replaceAll(":","-")+".pg.enc");
const cmd=spawn("pg_dump",["--format=custom","--no-owner","--no-acl"],{
 env:{...process.env,...postgresEnv(url)},stdio:["ignore","pipe","inherit"],windowsHide:true
});
const finished=new Promise<void>((resolve,reject)=>{
 cmd.on("error",()=>reject(Error("pg_dump unavailable. Install PostgreSQL client tools (matching server major version).")));
 cmd.on("close",code=>code===0?resolve():reject(Error("pg_dump exited with status "+code)));
});
try{
 if(!cmd.stdout)throw Error("pg_dump output stream unavailable");
 await Promise.all([encryptBackup(cmd.stdout,destination,key),finished]);
 console.log("Encrypted PostgreSQL backup written to",destination);
 console.log("This excludes S3/other uploaded property images. Back them up separately.");
}catch(err){cmd.kill();await finished.catch(()=>{});await unlink(destination).catch(()=>{});throw err;}
