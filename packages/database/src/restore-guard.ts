/** Destructive restore guard: no database is touched by a failed validation. */
export type RestoreTarget={hostname:string;port:string;database:string;username:string};
export function normalizedRestoreTarget(value:string):RestoreTarget{
 let u:URL;
 try{u=new URL(value);}catch{throw Error("Invalid PostgreSQL restore endpoint");}
 if(!["postgres:","postgresql:"].includes(u.protocol)||!u.hostname||!u.pathname||u.pathname==="/")
  throw Error("A complete PostgreSQL restore endpoint is required");
 const database=decodeURIComponent(u.pathname.slice(1));
 if(!database||database.includes("/")||database.includes("\u0000"))
  throw Error("Invalid PostgreSQL database name");
 return {hostname:u.hostname.toLowerCase(),port:u.port||"5432",database,
  username:decodeURIComponent(u.username)};
}
/** Must have both explicit operator target name and an unambiguous staging DB.
 * Production and staging on same host are prohibited by default even if named differently.
 */
export function validateRestoreTarget(input:{
 productionUrl:string|undefined;stagingUrl:string|undefined;expectedDatabase:string|undefined;
 allowSameServer?:boolean;confirmation:string|undefined
}):RestoreTarget{
 if(input.confirmation!=="RESTORE_TO_STAGING_ONLY")
  throw Error("RESTORE_CONFIRM=RESTORE_TO_STAGING_ONLY is required");
 if(!input.productionUrl)
  throw Error("DATABASE_URL is required to independently check the production target");
 if(!input.stagingUrl)
  throw Error("STAGING_DATABASE_URL is required; no fallback to the normal DATABASE_URL");
 const production=normalizedRestoreTarget(input.productionUrl);
 const staging=normalizedRestoreTarget(input.stagingUrl);
 const expected=input.expectedDatabase?.trim();
 if(!expected||expected!==staging.database)
  throw Error("RESTORE_EXPECT_DATABASE must exactly equal the staging database name");
 if(!/(?:^|[_-])(staging|test|sandbox|restore)(?:$|[_-])/i.test(staging.database))
  throw Error("Staging DB name must have a standalone staging/test/sandbox/restore marker");
 if(/(?:^|[_-])(prod|production|live)(?:$|[_-])/i.test(staging.database))
  throw Error("A production/live database name cannot be used for staging restore");
 const serverSame=production.hostname===staging.hostname&&production.port===staging.port;
 if(serverSame && production.database===staging.database)
  throw Error("Refusing restore into the existing production database");
 if(serverSame&&!input.allowSameServer)
  throw Error("Production and staging share the same database server; set RESTORE_ALLOW_SAME_HOST=true only after a separate access review");
 if(!staging.username)throw Error("Staging connection must specify an explicit database user");
 return staging;
}
