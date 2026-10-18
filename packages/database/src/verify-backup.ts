import {mkdtemp,rm,stat} from "node:fs/promises";
import {join,resolve} from "node:path";
import {tmpdir} from "node:os";
import {backupKey,decryptBackup} from "./backup-crypto";
import {runCommand} from "./backup-env";

/** Offline integrity check; never connects to production or staging database. */
const file=process.argv[2];
if(!file)throw Error("Usage: pnpm db:backup:verify <backup-file.pg.enc>");
const key=backupKey();
const temporary=await mkdtemp(join(tmpdir(),"amlak-backup-verification-"));
const decrypted=join(temporary,"archive.pg");
try{
 await decryptBackup(resolve(file),decrypted,key);
 const size=(await stat(decrypted)).size;
 if(size<64)throw Error("Decrypted PostgreSQL archive is unexpectedly small");
 // PostgreSQL client validates archive framing, section headers and TOC.
 await runCommand("pg_restore",["--list",decrypted],{});
 console.log("Encrypted backup authentication and PostgreSQL archive validation: PASS");
 console.log("Decrypted archive size:",size,"bytes. No live database was modified.");
 console.log("A real isolated staging restore and S3/media reconciliation are still required.");
}finally{await rm(temporary,{recursive:true,force:true});}
