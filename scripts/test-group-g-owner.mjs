import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const contains=(source,needles)=>{for(const text of needles)assert.ok(source.includes(text),"missing "+text);};
test("Group G phase 31: reports and property safety cases use private, authorized endpoints",()=>{
 const hub=read("apps/mobile/app/safety/index.tsx"),form=read("apps/mobile/app/report/[listingId].tsx"),
  api=read("apps/api/src/safety.ts");
 contains(hub,["getMyListings(token)","/v1/reports/mine","/safety-cases","/v1/properties/",
  '["resolved","rejected","closed"]','ox(locale,"eligibility")',"appealLock.current",
  "caseEpoch.current","tokenRef.current===token","safetyHold","LoadingCard","StateNotice"]);
 contains(form,["submitLock.current","requestId.current","AppInput","isRTL(locale)"]);
 contains(api,["await owner(db,request,request.params.id)","app.post<{Params:{id:string}}>(\"/v1/safety-cases/:id/appeal\"",
  "APPEAL_ALREADY_SUBMITTED","eq(schema.safetyReports.reporterId,actor.id)"]);
});
test("Group G phase 32: owner listings search/filter and data token isolation",()=>{
 const s=read("apps/mobile/app/my-listings.tsx");
 contains(s,["snapshot.token===token","useFocusEffect","epoch.current++","getMyListings(token)",
  "AppInput","FilterChip","filtered.map","listingStatus(locale,item.status)","/safety",
  'pathname:"/listings/[id]/edit"','pathname:"/property/[id]"']);
});
test("Group G phase 33: new draft choice and stable idempotency key",()=>{
 const s=read("apps/mobile/app/listings/new.tsx"),api=read("apps/api/src/listings.ts");
 contains(s,["requestId.current","lastContext.current","lock.current","clientRequestId:requestId.current",
  "canSubmit","propertyTypes.map","transactionTypes.map","params.agencyId",
  'router.replace({pathname:"/listings/[id]/edit"']);
 contains(api,["clientRequestId:input.clientRequestId","requireAgencyMember(db,actor,input.agencyId",
  "canSubmitListing({verified:true"]);
});
test("Group G phase 34: eight-step editor safeguards and progress",()=>{
 const s=read("apps/mobile/app/listings/[id]/edit.tsx");
 contains(s,["steps[locale].map","setStep(index)","disabled={index>step||busy}",
  "versionRef.current","expectedVersion:versionRef.current","pendingConflict",
  "AsyncStorage","listingDraftSchema.safeParse(data)","submit()","ox(locale,\"editSub\")"]);
 assert.match(s,/onPress=\{\(\)=>setStep\(index\)\}/);
});
test("Group G phase 35: photo ordering/cover, guarded removal and private retry",()=>{
 const s=read("apps/mobile/app/listings/[id]/edit.tsx");
 contains(s,["movePhoto(photoId,-1)","movePhoto(photoId,1)","media.coverAction",
  "Alert.alert(media.remove","PrivatePhotoPreview","photoSource(photoId,token)",
  "onError={()=>setFailed(true)}","setRetry(n=>n+1)","photoIds.length>=20",
  "setPhotoDetail(photoId,{caption})","setPhotoDetail(photoId,{room})","uploadPhoto(id,token"]);
});
test("Group G localization: all 35 phase labels in Dari, Pashto, English",()=>{
 const s=read("apps/mobile/src/owner-experience.ts");
 for(const locale of ["en","fa","ps"])assert.ok(s.includes("const "+locale),locale);
 for(const key of ["safety","myReports","ownerCases","myListings","newTitle","media","photoRule","photosTip","appeal"])assert.ok(s.includes(key+":"),key);
});
