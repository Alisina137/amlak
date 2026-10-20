import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {st,reasonLabel,reportReasons} from "../../src/safety-copy";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
type Report={id:string;listingId:string;reason:typeof reportReasons[number];status:string;createdAt:string};
type Case={id:string;status:string;resolution:string|null;createdAt:string;appealed:boolean};
export default function SafetyCenter(){
 const {token}=useAuth(),{locale}=usePreferences();
 const {listingId:initialId}=useLocalSearchParams<{listingId?:string}>();
 const [reports,setReports]=useState<Report[]>([]),[listingId,setListingId]=useState(initialId||""),[cases,setCases]=useState<Case[]>([]);
 const [error,setError]=useState(""),[loading,setLoading]=useState(true),[selected,setSelected]=useState(""),[reason,setReason]=useState(""),[sending,setSending]=useState(false);
 const load=useCallback(async()=>{
  if(!token){setLoading(false);return;}
  setLoading(true);
  try{const r=await requestJson<{items:Report[]}>("/v1/reports/mine",{token});setReports(r.items);setError("");}
  catch{setError(st(locale,"error"));}finally{setLoading(false);}
 },[token,locale]);
 useFocusEffect(useCallback(()=>{
  void load();
  if(token&&initialId)void requestJson<{items:Case[];safetyHold:boolean}>("/v1/properties/"+initialId+"/safety-cases",{token})
    .then(r=>setCases(r.items)).catch(()=>setError(st(locale,"error")));
 },[load,token,initialId,locale]));
 async function check(){
  if(!token||!listingId.trim())return;
  setError("");
  try{const r=await requestJson<{items:Case[];safetyHold:boolean}>("/v1/properties/"+listingId.trim()+"/safety-cases",{token});setCases(r.items);}
  catch(e){setError((e as Error).message||st(locale,"error"));setCases([]);}
 }
 async function appeal(id:string){
  if(!token||reason.trim().length<12)return;setSending(true);setError("");
  try{await requestJson("/v1/safety-cases/"+id+"/appeal",{token,method:"POST",body:{reason:reason.trim()}});
   setSelected("");setReason("");await check();}
  catch(e){setError((e as Error).message||st(locale,"error"));}finally{setSending(false);}
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={st(locale,"appeals")} subtitle={st(locale,"warning")}/>
  {!token?<SectionCard><Label>{st(locale,"login")}</Label></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  <SectionCard><Label weight="bold">{st(locale,"myReports")}</Label>
   {loading?<ActivityIndicator color={colors.primary}/>:null}
   {reports.length===0&&!loading?<Label muted>{st(locale,"none")}</Label>:null}
   {reports.map(r=><View key={r.id} style={{gap:3}}>
    <Label>{reasonLabel(locale,r.reason)}</Label><Label muted>{r.status} · {new Date(r.createdAt).toLocaleDateString()}</Label>
   </View>)}
  </SectionCard>
  {token?<SectionCard>
   <Label weight="bold">{st(locale,"appeals")}</Label>
   <Label muted>{locale==="en"?"Enter an ID of a property you advertise to review safety decisions.":locale==="fa"?"شناسهٔ ملکی را که آگهی کرده‌اید وارد کنید.":"د خپل اعلان د ملکیت پېژندپاڼه ولیکئ."}</Label>
   <TextInput accessibilityLabel="Property ID" value={listingId} onChangeText={setListingId} autoCapitalize="none"
    style={{borderWidth:1,borderColor:colors.border,borderRadius:10,minHeight:44,padding:10,color:colors.text}}/>
   <Action kind="secondary" label={st(locale,"open")} disabled={!listingId.trim()} onPress={()=>void check()}/>
   {cases.map(c=><View key={c.id} style={{gap:8,paddingVertical:12,borderTopWidth:1,borderColor:colors.border}}>
    <Label weight="bold">{c.status}</Label>
    <Label muted>{c.resolution||"—"}</Label>
    {!c.appealed&&["resolved","rejected","closed"].includes(c.status)?
     selected===c.id?<><TextInput multiline maxLength={2000} value={reason} onChangeText={setReason}
       placeholder={st(locale,"appealReason")} style={{minHeight:100,borderWidth:1,borderColor:colors.border,color:colors.text,padding:10,borderRadius:10}}/>
      <Action disabled={sending||reason.trim().length<12} label={st(locale,"save")} onPress={()=>void appeal(c.id)}/></>:
     <Action kind="secondary" label={st(locale,"appeal")} onPress={()=>setSelected(c.id)}/>:null}
   </View>)}
  </SectionCard>:null}
 </Page>;
}
