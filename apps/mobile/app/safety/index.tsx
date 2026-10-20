import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useEffect,useRef,useState} from "react";
import {View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {getMyListings,type InventoryItem} from "../../src/listing-client";
import {st,reasonLabel,reportReasons} from "../../src/safety-copy";
import {ox} from "../../src/owner-experience";
import {Action,AppInput,BackButton,FilterChip,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";
type Report={id:string;listingId:string;reason:typeof reportReasons[number];status:string;createdAt:string};
type Case={id:string;status:string;resolution:string|null;createdAt:string;appealed:boolean};
type Section="reports"|"cases";
export default function SafetyCenter(){
 const {token,user}=useAuth(),{locale}=usePreferences(),rtl=isRTL(locale);
 const {listingId:initialId}=useLocalSearchParams<{listingId?:string}>();
 const [reports,setReports]=useState<Report[]>([]),[mine,setMine]=useState<InventoryItem[]>([]);
 const [listingId,setListingId]=useState(initialId||""),[cases,setCases]=useState<Case[]>([]),[safetyHold,setSafetyHold]=useState(false);
 const [section,setSection]=useState<Section>(initialId?"cases":"reports");
 const [error,setError]=useState(""),[loading,setLoading]=useState(true),[casesLoading,setCasesLoading]=useState(false);
 const [selected,setSelected]=useState(""),[reason,setReason]=useState(""),[sending,setSending]=useState(false),[notice,setNotice]=useState("");
 const epoch=useRef(0),caseEpoch=useRef(0),tokenRef=useRef(token),appealLock=useRef(false);
 tokenRef.current=token;
 useEffect(()=>{if(initialId){setListingId(initialId);setSection("cases");}},[initialId]);
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!token||!user?.verified){setReports([]);setMine([]);setLoading(false);setError("");return;}
  setLoading(true);
  try{
   const [r,list]=await Promise.all([
    requestJson<{items:Report[]}>("/v1/reports/mine",{token}),
    getMyListings(token)
   ]);
   if(version!==epoch.current||tokenRef.current!==token)return;
   setReports(r.items);setMine(list.items);setError("");
  }catch{if(version===epoch.current&&tokenRef.current===token)setError(st(locale,"error"));}
  finally{if(version===epoch.current&&tokenRef.current===token)setLoading(false);}
 },[token,user?.verified,locale]);
 const check=useCallback(async(id:string)=>{
  const version=++caseEpoch.current;
  if(!token||!user?.verified||!id)return;
  setCasesLoading(true);setError("");setSelected("");setReason("");
  try{
   const response=await requestJson<{items:Case[];safetyHold:boolean}>("/v1/properties/"+id+"/safety-cases",{token});
   if(version===caseEpoch.current&&tokenRef.current===token){
    setCases(response.items);setSafetyHold(response.safetyHold);
   }
  }catch{
   if(version===caseEpoch.current&&tokenRef.current===token){
    setCases([]);setSafetyHold(false);setError(ox(locale,"eligibility"));
   }
  }finally{if(version===caseEpoch.current&&tokenRef.current===token)setCasesLoading(false);}
 },[token,user?.verified,locale]);
 useFocusEffect(useCallback(()=>{
  void load();if(initialId)void check(initialId);
  return()=>{epoch.current++;caseEpoch.current++;};
 },[load,initialId,check]));
 async function appeal(id:string){
  if(!token||!user?.verified||appealLock.current||reason.trim().length<12)return;
  appealLock.current=true;setSending(true);setError("");setNotice("");
  try{
   await requestJson("/v1/safety-cases/"+id+"/appeal",{token,method:"POST",body:{reason:reason.trim()}});
   setSelected("");setReason("");setNotice(ox(locale,"appealSuccess"));await check(listingId);
  }catch{setError(st(locale,"error"));await check(listingId);}
  finally{appealLock.current=false;setSending(false);}
 }
 function selectListing(id:string){setListingId(id);setCases([]);setSelected("");setNotice("");void check(id);}
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={ox(locale,"safety")} subtitle={ox(locale,"notice")}/>
  {!token||!user?.verified?<SectionCard>
   <Label muted>{ox(locale,"auth")}</Label>
   <Action label={ox(locale,"logIn")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:<>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
    <FilterChip label={ox(locale,"myReports")} selected={section==="reports"} onPress={()=>setSection("reports")}/>
    <FilterChip label={ox(locale,"ownerCases")} selected={section==="cases"} onPress={()=>setSection("cases")}/>
   </View>
   {error?<StateNotice message={error} retryLabel={ox(locale,"retry")} onRetry={()=>void (section==="reports"?load():check(listingId))}/>:null}
   {notice?<SectionCard><Label style={{color:colors.success}}>{notice}</Label></SectionCard>:null}
   {loading?<LoadingCard rows={3}/>:null}
   {!loading&&section==="reports"?<View style={{gap:10}}>
    {reports.length===0?<SectionCard><Label muted>{ox(locale,"reportsEmpty")}</Label></SectionCard>:null}
    {reports.map(report=><SectionCard key={report.id}>
     <Label weight="medium">{reasonLabel(locale,report.reason)}</Label>
     <StatusBadge label={report.status} tone={["closed","rejected"].includes(report.status)?"warning":"neutral"}/>
     <Label muted style={{fontSize:12}}>{ox(locale,"property")}: {mine.find(m=>m.id===report.listingId)?.title||report.listingId.slice(0,8)}</Label>
    </SectionCard>)}
   </View>:null}
   {!loading&&section==="cases"?<View style={{gap:12}}>
    <SectionCard>
     <Label weight="bold">{ox(locale,"choose")}</Label>
     <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
      {mine.map(item=><FilterChip key={item.id} label={item.title||item.id.slice(0,8)}
       selected={listingId===item.id} onPress={()=>selectListing(item.id)}/>)}
      {initialId&&!mine.some(item=>item.id===initialId)?<FilterChip
       label={initialId.slice(0,8)} selected={listingId===initialId} onPress={()=>selectListing(initialId)}/>:null}
     </View>
     {mine.length===0&&!initialId?<Label muted>{ox(locale,"casesEmpty")}</Label>:null}
     <Label muted style={{fontSize:12}}>{ox(locale,"eligibility")}</Label>
     {listingId?<Action kind="secondary" label={ox(locale,"refresh")} disabled={casesLoading} onPress={()=>void check(listingId)}/>:null}
    </SectionCard>
    {casesLoading?<LoadingCard rows={3}/>:null}
    {!casesLoading&&listingId?<SectionCard>
     <StatusBadge label={safetyHold?ox(locale,"hold"):ox(locale,"noHold")} tone={safetyHold?"warning":"success"}/>
     {cases.length===0?<Label muted>{ox(locale,"casesEmpty")}</Label>:null}
     {cases.map(c=><View key={c.id} style={{gap:8,paddingVertical:12,borderTopWidth:1,borderColor:colors.border}}>
      <StatusBadge label={c.status} tone={c.status==="appealed"?"warning":"neutral"}/>
      {c.resolution?<Label style={{fontSize:13,lineHeight:22}}>{c.resolution}</Label>:null}
      {c.appealed?<Label muted>{ox(locale,"appealed")}</Label>:null}
      {!c.appealed&&["resolved","rejected","closed"].includes(c.status)?
       selected===c.id?<View style={{gap:8}}>
        <Label>{ox(locale,"reason")}</Label>
        <AppInput accessibilityLabel={ox(locale,"reason")} multiline maxLength={2000}
         editable={!sending} value={reason} onChangeText={setReason}
         placeholder={st(locale,"appealReason")} style={{minHeight:112,textAlignVertical:"top"}}/>
        <Label muted style={{fontSize:12}}>{ox(locale,"appealHint")}</Label>
        <Action disabled={sending||reason.trim().length<12} label={ox(locale,"submitAppeal")} onPress={()=>void appeal(c.id)}/>
       </View>:<Action kind="secondary" label={ox(locale,"appeal")} onPress={()=>setSelected(c.id)}/>:null}
     </View>)}
    </SectionCard>:null}
   </View>:null}
  </>}
 </Page>;
}
