import assert from "node:assert/strict";
import test from "node:test";
import {validateRestoreTarget,normalizedRestoreTarget} from "./restore-guard";
import {postgresEnv} from "./backup-env";

const production="postgresql://prod:pw@db.example.test:5432/amlak";
const staging="postgresql://restore:pw@staging.example.test:5432/amlak_staging";
const args={productionUrl:production,stagingUrl:staging,
 expectedDatabase:"amlak_staging",confirmation:"RESTORE_TO_STAGING_ONLY"};
test("staging restore target requires exact reviewed identity before DB access",()=>{
 assert.deepEqual(validateRestoreTarget(args),{
  hostname:"staging.example.test",port:"5432",database:"amlak_staging",username:"restore"});
 assert.throws(()=>validateRestoreTarget({...args,confirmation:"YES"}),/RESTORE_CONFIRM/);
 assert.throws(()=>validateRestoreTarget({...args,expectedDatabase:"amlak_test"}),/RESTORE_EXPECT_DATABASE/);
 assert.throws(()=>validateRestoreTarget({...args,productionUrl:undefined}),/DATABASE_URL/);
 assert.throws(()=>validateRestoreTarget({...args,stagingUrl:undefined}),/STAGING_DATABASE_URL/);
 assert.throws(()=>validateRestoreTarget({...args,stagingUrl:production,expectedDatabase:"amlak"}),/staging|RESTORE_EXPECT/);
 assert.throws(()=>validateRestoreTarget({...args,stagingUrl:
  "postgresql://restore:pw@staging.example.test:5432/amlak_production_test",
  expectedDatabase:"amlak_production_test"}),/production\/live/);
 assert.throws(()=>validateRestoreTarget({...args,stagingUrl:
  "postgresql://restore:pw@staging.example.test:5432/production",
  expectedDatabase:"production"}),/Staging DB name/);
 assert.throws(()=>validateRestoreTarget({...args,stagingUrl:
  "postgresql://restore:pw@staging.example.test:5432/amlak_staging_prod",
  expectedDatabase:"amlak_staging_prod"}),/production\/live/);
 assert.throws(()=>validateRestoreTarget({...args,stagingUrl:
  "postgresql://restore:pw@db.example.test:5432/amlak_staging"}),/same database server/);
 assert.equal(validateRestoreTarget({...args,stagingUrl:
  "postgresql://restore:pw@db.example.test:5432/amlak_staging",
  allowSameServer:true}).database,"amlak_staging");
 assert.throws(()=>validateRestoreTarget({...args,stagingUrl:production,
  expectedDatabase:"amlak",allowSameServer:true}),/Staging DB name|production database/);
});
test("PostgreSQL backup tooling enforces verified TLS for remote databases",()=>{
 assert.equal(postgresEnv(staging).PGSSLMODE,"verify-full");
 assert.equal(postgresEnv("postgresql://tester:secret@127.0.0.1:5432/amlak_test").PGSSLMODE,"disable");
 assert.equal(normalizedRestoreTarget(staging).database,"amlak_staging");
 assert.throws(()=>normalizedRestoreTarget("https://example.com"),/PostgreSQL/);
});
