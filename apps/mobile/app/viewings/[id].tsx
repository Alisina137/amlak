import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {Alert,Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL,formatNumber} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {fetchViewings,inquiry,viewingDecision,displayKabul,kabulSlots,type Viewing,type InquiryDetail} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {ix} from "../../src/inbox-experience";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";

const timeline=["requested","counterproposed","confirmed","completed"] as const;
export default function ViewingDetail(){
 const {id}=useLocalSearchParams<{id:string}>(),{token}=useAuth(),{locale}=usePreferences(),rtl=isRTL(locale);
 const [visit,setVisit]=useState<Viewing|null>(null),[thread,setThread]=useState<InquiryDetail|null>(null);
 const [selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const epoch=useRef(0),tokenRef=useRef(token),actionLock=useRef(false);
 tokenRef.current=token;
 const reload=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setVisit(null);setThread(null);setLoading(false);return;}
  setLoading(true);
  try{
   const response=await fetchViewings(token);
   const entry=response.items.find(row=>row.id===id);
   if(!entry){
    // Legacy viewing notices sometimes held the inquiry UUID. Route only if this
    // signed-in actor is authorized to open that conversation.
    const oldThread=await inquiry(id,token).catch(()=>null);
    if(oldThread&&epoch.current===version&&tokenRef.current===token)
     router.replace({pathname:"/inquiries/[id]",params:{id:oldThread.id}});
    if(oldThread)return;
    throw Error("NOT_FOUND");
   }
   const conversation=await inquiry(entry.inquiryId,token);
   if(epoch.current!==version||tokenRef.current!==token)return;
   setVisit(entry);setThread(conversation);setError("");
   void requestJson("/v1/viewings/"+entry.id+"/read-notifications",{method:"POST",token}).catch(()=>{});
  }catch{
   if(epoch.current===version&&tokenRef.current===token){
    setVisit(null);setThread(null);setError(et(locale,"noAccess"));
   }
  }finally{if(epoch.current===version&&tokenRef.current===token)setLoading(false);}
 },[token,id,locale]);
 useFocusEffect(useCallback(()=>{setVisit(null);setThread(null);void reload();return()=>{epoch.current++;};},[reload]));
 const side=thread?.side;
 async function act(action:string,slot?:string){
  if(!token||!visit||actionLock.current)return;
  actionLock.current=true;setBusy(true);setError("");
  try{
   await viewingDecision(visit.id,token,visit.version,action,slot);
   setSelected(null);await reload();
  }catch(e){
   const message=(e as Error).message||"";
   setError(/CONFLICT|VIEWING_TIME_PASSED|VERSION/i.test(message)?ix(locale,"conflict"):et(locale,"unknown"));
   void reload();
  }finally{setBusy(false);actionLock.current=false;}
 }
 const now=Date.now();
 const confirmed=visit?.confirmedSlot?new Date(visit.confirmedSlot).getTime():null;
 const future=kabulSlots().slice(0,16);
 const cancel=()=>{
  Alert.alert(ix(locale,"cancelConfirm"),et(locale,"pending"),[
   {text:ix(locale,"no"),style:"cancel"},
   {text:ix(locale,"yes"),style:"destructive",onPress:()=>void act("cancel")}
  ]);
 };
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={et(locale,"viewings")} subtitle={thread?.title||ix(locale,"timeZone")}/>
  {loading&&!visit?<LoadingCard rows={4}/>:null}
  {error?<StateNotice message={error} retryLabel={ix(locale,"reload")} onRetry={()=>void reload()}/>:null}
  {visit?<SectionCard>
   <Label weight="bold" style={{fontSize:17}}>{ix(locale,"status")}</Label>
   <StatusBadge tone={visit.status==="confirmed"?"success":(["cancelled","declined","no_show"].includes(visit.status)?"warning":"neutral")}
    label={et(locale,visit.status)}/>
   <Label muted style={{fontSize:12}}>{ix(locale,"timeZone")}</Label>
   {visit.confirmedSlot?<View style={{borderColor:"#BADCC6",borderWidth:1,backgroundColor:"#E1F0E9",padding:12,borderRadius:12,gap:4}}>
    <Label weight="bold">{ix(locale,"booked")}</Label>
    <Label>{displayKabul(visit.confirmedSlot,locale)}</Label>
   </View>:<Label muted>{ix(locale,"bookedNotice")}</Label>}
   <Label weight="bold">{ix(locale,"steps")}</Label>
   <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:6}}>
    {timeline.map(stage=><StatusBadge key={stage}
     tone={visit.status===stage?"success":"neutral"} label={et(locale,stage)}/>)}
   </View>
   <Label weight="medium">{et(locale,"proposed")} · {formatNumber(visit.proposedSlots.length,locale)}</Label>
   {visit.proposedSlots.map(slot=><Label key={slot} muted style={{fontSize:13}}>{displayKabul(slot,locale)}</Label>)}
   {visit.counterSlot?<View style={{gap:4}}>
    <Label weight="medium">{et(locale,"counterTime")}</Label>
    <Label>{displayKabul(visit.counterSlot,locale)}</Label>
   </View>:null}
   {visit.note?<Label>{visit.note}</Label>:null}
   {visit.status==="requested"&&side==="advertiser"?<>
    <Label weight="bold">{et(locale,"choose")}</Label>
    {visit.proposedSlots.map(slot=><Action key={slot} kind="secondary"
     disabled={busy||new Date(slot).getTime()<=now+5*60000}
     label={et(locale,"confirm")+" · "+displayKabul(slot,locale)} onPress={()=>void act("confirm",slot)}/>)}
    <Action kind="secondary" disabled={busy} label={et(locale,"decline")} onPress={()=>void act("decline")}/>
   </>:null}
   {["requested","counterproposed"].includes(visit.status)&&side==="advertiser"?<>
    <Label weight="bold">{et(locale,"counter")}</Label>
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
     {future.map(option=><Pressable key={option.iso} disabled={busy}
      accessibilityRole="button" accessibilityState={{selected:selected===option.iso,disabled:busy}}
      onPress={()=>setSelected(option.iso)}
      style={{minHeight:48,padding:10,justifyContent:"center",borderWidth:1,borderRadius:12,
       backgroundColor:selected===option.iso?"#E1F0E9":colors.surface,
       borderColor:selected===option.iso?colors.primary:colors.border}}>
      <Label style={{fontSize:13}}>{displayKabul(option.iso,locale)}</Label>
     </Pressable>)}
    </View>
    <Action disabled={!selected||busy||new Date(selected||0).getTime()<=Date.now()+30*60000}
     kind="secondary" label={et(locale,"counter")} onPress={()=>void act("counter",selected||undefined)}/>
   </>:null}
   {visit.status==="counterproposed"&&side==="seeker"&&visit.counterSlot?
    <Action disabled={busy||new Date(visit.counterSlot).getTime()<=now+5*60000} label={et(locale,"accept")}
     onPress={()=>void act("accept_counter")}/>:null}
   {["requested","counterproposed","confirmed"].includes(visit.status)?
    <Action kind="secondary" disabled={busy} label={et(locale,"cancel")} onPress={cancel}/>:null}
   {visit.status==="confirmed"&&side==="advertiser"&&confirmed!==null&&confirmed<=now?<>
    <Action kind="secondary" disabled={busy} label={et(locale,"complete")} onPress={()=>void act("complete")}/>
    <Action kind="secondary" disabled={busy} label={et(locale,"noShow")} onPress={()=>void act("no_show")}/>
   </>:null}
   <Label muted style={{fontSize:12}}>{ix(locale,"viewingHint")}</Label>
  </SectionCard>:null}
  {thread?<SectionCard>
   <Label weight="bold">{ix(locale,"direction")}</Label>
   <Label>{thread.title}</Label>
   <Action kind="secondary" label={ix(locale,"property")}
    onPress={()=>router.push({pathname:"/property/[id]",params:{id:thread.listingId}})}/>
   <Action kind="secondary" label={ix(locale,"contact")}
    onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:thread.id}})}/>
  </SectionCard>:null}
  {visit?<Action kind="secondary" label={ix(locale,"reload")} disabled={busy||loading} onPress={()=>void reload()}/>:null}
 </Page>;
}
