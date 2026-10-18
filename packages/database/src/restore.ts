import {mkdtemp,rm} from "node:fs/promises";
import {join,resolve} from "node:path";
import {tmpdir} from "node:os";
import {backupKey,decryptBackup} from "./backup-crypto";
import {postgresEnv,runCommand} from "./backup-env";
import {validateRestoreTarget} from "./restore-guard";

const file=process.argv[2];
if(!file)throw Error("Usage: pnpm db:restore:staging <backup-file.pg.enc>");
const production=process.env.DATABASE_URL,staging=process.env.STAGING_DATABASE_URL;
const dest=validateRestoreTarget({
 productionUrl:production,stagingUrl:staging,
 expectedDatabase:process.env.RESTORE_EXPECT_DATABASE,
 confirmation:process.env.RESTORE_CONFIRM,
 allowSameServer:process.env.RESTORE_ALLOW_SAME_HOST==="true"
});
// All guards above must run before decryption and before any database operation.
const key=backupKey(),temp=await mkdtemp(join(tmpdir(),"amlak-staging-")),clear=join(temp,"archive.pg");
try{
 await decryptBackup(resolve(file),clear,key); // Authenticate full archive before staging DB mutation.
 // Verify the file is actually a valid PostgreSQL custom archive.
 await runCommand("pg_restore",["--list",clear],postgresEnv(staging!));
 await runCommand("pg_restore",[
  "--no-owner","--no-acl","--clean","--if-exists","--single-transaction",
  "--exit-on-error","--dbname="+dest.database
 ],postgresEnv(staging!),clear);
 console.log("Staging restore completed. Independently check counts, access controls, and media.");
}catch(error){
 console.error("Restore did not complete. No automatic retry is safe for database restores.");
 throw error;
}finally{await rm(temp,{recursive:true,force:true});}
