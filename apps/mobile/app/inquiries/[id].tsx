import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {Pressable,TextInput,View,ActivityIndicator} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {addLeadNote,assignInquiry,blockUser,closeInquiry,reopenInquiry,displayKabul,fetchLeadNotes,inquiry,requestId,sendMessage,updateLeadStatus,
 type InquiryDetail,type LeadNote} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
type Member={id:string;userId:string;displayName:string;role:string;status:string};
const LEAD_STATES=["new","contacted","viewing","negotiating","won","lost","archived"] as const;
export default function InquiryDetailPage(){
 const {id}=useLocalSearchParams<{id:string}>(),{token,user}=useAuth(),{locale}=usePreferences();
 const [data,setData]=useState<InquiryDetail|null>(null),[members,setMembers]=useState<Member[]>([]),[notes,setNotes]=useState<LeadNote[]>([]);
 const [draft,setDraft]=useState(""),[note,setNote]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const messageKey=useRef(requestId());
 const load=useCallback(async()=>{
  if(!token)return;
  try{
   const value=await inquiry(id,token);setData(value);setError("");
   if(value.agencyId&&value.side==="advertiser"){
    const notes=await fetchLeadNotes(id,token).catch(()=>({items:[]}));
    setNotes(notes.items);
    if(value.role==="owner"||value.role==="manager"){
     const result=await requestJson<{items:Member[]}>("/v1/agencies/"+value.agencyId+"/members",{token}).catch(()=>({items:[]}));
     setMembers(result.items.filter(m=>m.status==="active"));
    }
   }else{setNotes([]);setMembers([]);}
  }catch(e){setError((e as Error).message||et(locale,"noAccess"));}
  finally{setLoading(false);}
 },[token,id,locale]);
 useFocusEffect(useCallback(()=>{
  setLoading(true);void load();
  const timer=setInterval(()=>void load(),15000);
  return()=>clearInterval(timer);
 },[load]));
 async function send(){
  if(!token||!data||!draft.trim()||busy)return;
  setBusy(true);setError("");
  try{await sendMessage(data.id,token,draft.trim(),messageKey.current);
   messageKey.current=requestId();setDraft("");await load();}
  catch(e){setError((e as Error).message||et(locale,"unknown"));}
  finally{setBusy(false);}
 }
 async function act(work:()=>Promise<unknown>){
  if(busy)return;
  setBusy(true);setError("");
  try{await work();await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const canSend=data&&!["closed","blocked"].includes(data.status);
 return <Page>
  <Action kind="secondary" label="←" onPress={()=>router.back()}/>
  <ScreenHeading title={data?.title||et(locale,"inquiries")} subtitle={data?(data.side==="seeker"?data.advertiserName:data.seekerName):undefined}/>
  {loading&&!data?<SectionCard><ActivityIndicator color={colors.primary}/></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  {data?<><SectionCard>
   <Label weight="bold">{et(locale,"inquiries")} · {data.status}</Label>
   {data.priceChanged?<Label style={{color:colors.warning}}>{et(locale,"priceChanged")}</Label>:null}
   <Label muted>{et(locale,"snapshot")}: {JSON.stringify(data.priceSnapshot)}</Label>
   <Action kind="secondary" label={locale==="en"?"View property":"مشاهدهٔ ملک"} onPress={()=>router.push({pathname:"/property/[id]",params:{id:data.listingId}})}/>
   {data.side==="seeker"&&canSend&&data.propertyStatus==="published"?
    <Action label={et(locale,"newViewing")} onPress={()=>router.push({pathname:"/viewings/new",params:{inquiryId:data.id}})}/>:null}
  </SectionCard>
  <SectionCard><Label weight="bold">{et(locale,"inquiries")}</Label>
   {data.messages.map(m=><View key={m.id} style={{padding:12,borderRadius:12,gap:4,
    backgroundColor:m.authorId===user?.id?"#e2efe8":colors.background,
    alignSelf:m.authorId===user?.id?"flex-end":"flex-start",maxWidth:"94%"}}>
    <Label>{m.body}</Label><Label muted style={{fontSize:11}}>{displayKabul(m.createdAt,locale)}</Label>
   </View>)}
   {canSend?<><TextInput accessibilityLabel={et(locale,"message")} value={draft} onChangeText={setDraft}
    placeholder={et(locale,"message")} multiline maxLength={3000} style={{minHeight:96,padding:12,color:colors.text,textAlignVertical:"top",fontSize:16,
     borderWidth:1,borderColor:colors.border,borderRadius:12}}/>
    <Action disabled={busy||draft.trim().length===0} label={busy?et(locale,"sending"):et(locale,"reply")} onPress={()=>void send()}/></>:
    <Label muted>{et(locale,"closed")}</Label>}
  </SectionCard>
  {data.viewings.length>0?<SectionCard><Label weight="bold">{et(locale,"viewings")}</Label>
   {data.viewings.map(v=><View key={v.id} style={{gap:5}}>
    <Label>{et(locale,v.status)} · {v.confirmedSlot?displayKabul(v.confirmedSlot,locale):v.proposedSlots.map(s=>displayKabul(s,locale)).join(" / ")}</Label>
    <Action kind="secondary" label={et(locale,"more")} onPress={()=>router.push({pathname:"/viewings/[id]",params:{id:v.id}})}/>
   </View>)}
  </SectionCard>:null}
  {data.side==="advertiser"?<SectionCard>
   <Label weight="bold">{et(locale,"lead")}</Label>
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
    {LEAD_STATES.map(status=><Pressable key={status} disabled={busy} onPress={()=>void act(()=>updateLeadStatus(data.id,token!,status))}
      accessibilityRole="button" accessibilityState={{selected:status===data.leadStatus}} style={{minHeight:42,paddingHorizontal:12,paddingVertical:8,borderRadius:14,
       borderWidth:1,borderColor:status===data.leadStatus?colors.primary:colors.border,
       backgroundColor:status===data.leadStatus?"#e2efe8":colors.surface}}>
     <Label style={{color:status===data.leadStatus?colors.primary:colors.text}}>{status}</Label>
    </Pressable>)}
   </View>
   {data.agencyId&&(data.role==="owner"||data.role==="manager")?<>
    <Label weight="bold">{et(locale,"assignee")}: {members.find(m=>m.userId===data.assignedTo)?.displayName||et(locale,"unassigned")}</Label>
    <Action kind="secondary" label={et(locale,"unassigned")} onPress={()=>void act(()=>assignInquiry(data.id,token!,null))}/>
    {members.map(m=><Action key={m.userId} disabled={busy} kind={data.assignedTo===m.userId?"primary":"secondary"}
      label={m.displayName+" · "+m.role} onPress={()=>void act(()=>assignInquiry(data.id,token!,m.userId))}/>)}
   </>:null}
   {data.agencyId?<><Label weight="bold">{et(locale,"agencyNotes")}</Label>
    {notes.map(n=><Label key={n.id} muted>{n.body} · {displayKabul(n.createdAt,locale)}</Label>)}
    <TextInput accessibilityLabel={et(locale,"note")} multiline maxLength={1000} value={note} onChangeText={setNote}
     placeholder={et(locale,"note")} style={{minHeight:80,padding:12,borderWidth:1,borderColor:colors.border,borderRadius:12,color:colors.text}}/>
    <Action kind="secondary" disabled={busy||note.trim().length<2} label={et(locale,"addNote")} onPress={()=>void act(async()=>{await addLeadNote(data.id,token!,note.trim());setNote("");})}/>
   </>:null}
  </SectionCard>:null}
  <SectionCard><Label muted>{et(locale,"safety")}</Label>
   {canSend?<Action kind="secondary" disabled={busy} label={et(locale,"close")} onPress={()=>void act(()=>closeInquiry(data.id,token!))}/>:null}
   {data.status==="closed"&&data.side==="seeker"?<Action kind="secondary" disabled={busy} label={et(locale,"reopen")} onPress={()=>void act(()=>reopenInquiry(data.id,token!))}/>:null}
   <Action kind="secondary" disabled={busy} label={et(locale,"block")} onPress={()=>void act(()=>blockUser(data.side==="seeker"?data.advertiserId:data.seekerId,token!))}/>
  </SectionCard>
 </>:null}
 </Page>;
}
