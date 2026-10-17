import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
export function connectDatabase(databaseUrl=process.env.DATABASE_URL){
 if(!databaseUrl)throw new Error("DATABASE_URL is required for Phase 2");
 const sql=postgres(databaseUrl,{max:10,connect_timeout:10,ssl:databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1") ? false : "require"});
 return { sql, db:drizzle(sql,{schema}) };
}
export type Database=ReturnType<typeof connectDatabase>["db"];
export {schema};
