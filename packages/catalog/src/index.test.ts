import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PROVINCE_ID, findProvince, normalizeLocation, provinces, searchProvinces } from "./index";
test("all 34 provinces are unique and Kabul is the default", () => {
 assert.equal(provinces.length,34);
 assert.equal(new Set(provinces.map(p=>p.id)).size,34);
 assert.ok(findProvince(DEFAULT_PROVINCE_ID));
 for (const p of provinces) assert.ok(p.names.en && p.names.fa && p.names.ps);
});
test("search works in English, Dari, Pashto, and Arabic-script variants", () => {
 assert.equal(searchProvinces("kabul","en")[0]?.id,"kabul");
 assert.equal(searchProvinces("كابل","fa")[0]?.id,"kabul");
 assert.equal(searchProvinces("کونړ","ps")[0]?.id,"kunar");
 assert.equal(searchProvinces("Maidan Wardak","en")[0]?.id,"wardak");
 assert.equal(normalizeLocation("كابل"),normalizeLocation("کابل"));
});
test("invalid ids fail closed",()=>assert.equal(findProvince("not-a-province"),undefined));
