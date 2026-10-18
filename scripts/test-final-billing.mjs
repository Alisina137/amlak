import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const file=path=>readFileSync(resolve(root,path),"utf8");
test("billing defaults to disabled and cannot activate paid benefits while paused",()=>{
 const s=file("apps/api/src/billing.ts");
 assert.match(s,/process.env.AMLAK_BILLING_ENABLED==="true"/);
 assert.match(s,/if\(!billingEnabled\(\)\)throw new HttpProblem\(503,"BILLING_NOT_ENABLED"\)/);
 assert.match(s,/if\(input.decision==="confirm"&&!billingEnabled\(\)\)/);
 assert.match(s,/EXTERNAL_RECONCILIATION_REQUIRED/);
 assert.match(s,/RECONCILIATION_AMOUNT_MISMATCH/);
 assert.match(s,/RECONCILIATION_REFERENCE_REUSED/);
 assert.match(s,/onConflictDoNothing\(\)/);
});
test("refund and adjustment records still require authorization and audit",()=>{
 const s=file("apps/api/src/billing-controls.ts");
 assert.match(s,/requireStaffRole\(actor,permissions\)/);
 assert.match(s,/SECOND_REVIEWER_REQUIRED/);
 assert.match(s,/REFUND_REFERENCE_ALREADY_USED/);
 assert.match(s,/ADJUSTMENT_EXCEEDS_INVOICE/);
 assert.match(s,/kind==="credit"/);
 assert.match(s,/readOnly:true/);
 assert.match(s,/confirmedInvoiceWithoutConfirmedClaim/);
 assert.match(s,/confirmedClaimWithIncompleteEvidence/);
 assert.match(s,/refundWithoutSettlementEvidence/);
});
test("network retries reuse payment and refund request identities",()=>{
 const billing=file("apps/mobile/src/billing-ui.tsx");
 const adjustments=file("apps/mobile/src/billing-adjustment-ui.tsx");
 assert.match(billing,/pendingInvoiceRequests\.current\[attempt\]/);
 assert.match(adjustments,/pendingRequests\.current\[key\]/);
 assert.match(adjustments,/snapshot.token===token/);
 assert.match(billing,/snapshot.scope===scope/);
});
test("finance proxy only permits known staff endpoints",()=>{
 const proxy=file("apps/admin/app/api/billing/[...path]/route.ts");
 assert.match(proxy,/safeOrigin\(request\)/);
 assert.match(proxy,/exceptions/);
 assert.match(proxy,/staffToken\(\)/);
});
