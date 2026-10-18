import {mkdtemp,rm} from "node:fs/promises";
import {join,resolve} from "node:path";
import {tmpdir} from "node:os";
import {backupKey,decryptBackup} from "./backup-crypto";
import {postgresEnv,runCommand} from "./backup-env";
const file=process.argv[2];
if(!file)throw Error("Usage: pnpm db:restore:staging <backup-file.pg.enc>");
if(process.env.RESTORE_CONFIRM!=="RESTORE_TO_STAGING_ONLY")
 throw Error("Set RESTORE_CONFIRM=RESTORE_TO_STAGING_ONLY to explicitly authorize overwriting a disposable staging database");
if(!process.env.STAGING_DATABASE_URL)throw Error("STAGING_DATABASE_URL required; never use DATABASE_URL as destination");
const production=process.env.DATABASE_URL,staging=process.env.STAGING_DATABASE_URL;
const prod=production?new URL(production):null,dest=new URL(staging);
if(prod && prod.hostname===dest.hostname && decodeURIComponent(prod.pathname)===decodeURIComponent(dest.pathname))
 throw Error("Staging target is the production database. Refusing restore.");
if(!/staging|_test|test_|sandbox|_restore/i.test(dest.pathname))
 throw Error("Restore destination database name must clearly contain staging, test, sandbox or restore");
const key=backupKey(),temp=await mkdtemp(join(tmpdir(),"amlak-staging-")),clear=join(temp,"archive.pg");
try{
 await decryptBackup(resolve(file),clear,key); // Authenticate full archive BEFORE ANY staging DB mutation.
 await runCommand("pg_restore",["--no-owner","--no-acl","--clean","--if-exists","--single-transaction","--dbname="+decodeURIComponent(dest.pathname.slice(1))],
  postgresEnv(staging),clear);
 console.log("Staging restore completed. Verify sample counts, access controls and search against the restored database.");
}finally{await rm(temp,{recursive:true,force:true});}
