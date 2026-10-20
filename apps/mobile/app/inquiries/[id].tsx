import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {addLeadNote,assignInquiry,blockUser,closeInquiry,reopenInquiry,displayKabul,fetchLeadNotes,inquiry,requestId,sendMessage,updateLeadStatus,
 type InquiryDetail,type LeadNote} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {Action,AppInput,BackButton,DirectionalRow,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";
import {leadStageLabel,uiText} from "../../src/ui-copy";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {ix,priceSnapshotRows,inquiryStatus} from "../../src/inbox-experience";
type Member={id:string;userId:string;displayName:string;role:string;status:string};
const LEAD_STATES=["new","contacted","viewing","negotiating","won","lost","archived"] as const;
export default function InquiryDetailPage(){
 const {id}=useLocalSearchParams<{id:string}>(),{token,user}=useAuth(),{locale}=usePreferences();
 const [data,setData]=useState<InquiryDetail|null>(null),[members,setMembers]=useState<Member[]>([]),[notes,setNotes]=useState<LeadNote[]>([]);
 const [draft,setDraft]=useState(""),[note,setNote]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const messageKey=useRef(requestId()),sendLock=useRef(false),epoch=useRef(0),activeToken=useRef(token);
 activeToken.current=token;
 const load=useCallback(async()=>{
  const request=++epoch.current;
  if(!token){setData(null);setLoading(false);return;}
  try{
   const value=await inquiry(id,token);
   if(request!==epoch.current||activeToken.current!==token)return;
   setData(value);setError("");
   // This action only clears notices for this authorized conversation, never for other threads.
   void requestJson("/v1/inquiries/"+id+"/read-notifications",{method:"POST",token}).catch(()=>{});
   if(value.agencyId&&value.side==="advertiser"){
    const [notesResult,memberResult]=await Promise.all([
     fetchLeadNotes(id,token).catch(()=>({items:[]})),
     value.role==="owner"||value.role==="manager"?
      requestJson<{items:Member[]}>("/v1/agencies/"+value.agencyId+"/members",{token}).catch(()=>({items:[]})):Promise.resolve({items:[]})
    ]);
    if(request!==epoch.current||activeToken.current!==token)return;
    setNotes(notesResult.items);setMembers(memberResult.items.filter(m=>m.status==="active"));
   }else{setNotes([]);setMembers([]);}
  }catch(e){
   if(request===epoch.current&&activeToken.current===token)setError((e as Error).message||et(locale,"noAccess"));
  }finally{if(request===epoch.current&&activeToken.current===token)setLoading(false);}
 },[token,id,locale]);
 useFocusEffect(useCallback(()=>{
  setData(null);setLoading(true);void load();
  const timer=setInterval(()=>void load(),15000);
  return()=>{clearInterval(timer);epoch.current++;};
 },[load]));
 async function send(){
  if(!token||!data||!draft.trim()||busy||sendLock.current)return;
  sendLock.current=true;setBusy(true);setError("");
  try{await sendMessage(data.id,token,draft.trim(),messageKey.current);
   messageKey.current=requestId();setDraft("");await load();}
  catch(e){setError((e as Error).message||et(locale,"unknown"));}
  finally{sendLock.current=false;setBusy(false);}
 }
 async function act(work:()=>Promise<unknown>){
  if(busy)return;
  setBusy(true);setError("");
  try{await work();await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const canSend=data&&!["closed","blocked"].includes(data.status);
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={data?.title||et(locale,"inquiries")} subtitle={data?(data.side==="seeker"?data.advertiserName:data.seekerName):undefined}/>
  {loading&&!data?<LoadingCard rows={4}/>:null}
  {error?<StateNotice message={error} retryLabel={ix(locale,"retry")} onRetry={()=>void load()}/>:null}
  {data?<><SectionCard>
   <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
    <StatusBadge label={inquiryStatus(locale,data.status)} tone={data.status==="closed"?"warning":"neutral"}/>
    <Label muted style={{fontSize:13}}>{data.side==="seeker"?et(locale,"sent"):et(locale,"received")}</Label>
   </View>
   {data.priceChanged?<StateNotice tone="warning" message={ix(locale,"updated")}/>:null}
   <Label weight="medium">{ix(locale,"pricing")}</Label>
   {priceSnapshotRows(data.priceSnapshot,locale).map(([label,value])=>
    <DirectionalRow key={label} style={{justifyContent:"space-between",alignItems:"flex-start"}}>
     <Label muted style={{fontSize:13,flex:1}}>{label}</Label>
     <Label style={{fontSize:13,flex:1}}>{value}</Label>
    </DirectionalRow>)}
   <Action kind="secondary" label={uiText(locale,"viewProperty")} onPress={()=>router.push({pathname:"/property/[id]",params:{id:data.listingId}})}/>
   {data.side==="seeker"&&canSend&&data.propertyStatus==="published"?
    <Action label={et(locale,"newViewing")} onPress={()=>router.push({pathname:"/viewings/new",params:{inquiryId:data.id}})}/>:null}
  </SectionCard>
  <SectionCard>
   <Label weight="bold">{ix(locale,"messages")} · {formatNumber(data.messages.length,locale)}</Label>
   {data.messages.length===0?<Label muted>{ix(locale,"noMessages")}</Label>:null}
   {data.messages.map(m=>{
    const mine=m.authorId===user?.id;
    return <View key={m.id} accessibilityLabel={m.body+" · "+displayKabul(m.createdAt,locale)}
     style={{padding:12,borderRadius:16,gap:5,borderWidth:1,borderColor:mine?"#BCDBC9":colors.border,
      backgroundColor:mine?"#E1F0E9":colors.background,
      alignSelf:mine?(isRTL(locale)?"flex-start":"flex-end"):(isRTL(locale)?"flex-end":"flex-start"),maxWidth:"88%"}}>
     <Label style={{fontSize:14,lineHeight:23}}>{m.body}</Label>
     <Label muted style={{fontSize:11}}>{displayKabul(m.createdAt,locale)}</Label>
    </View>;
   })}
   {canSend?<><AppInput accessibilityLabel={et(locale,"message")} value={draft} onChangeText={setDraft}
    placeholder={et(locale,"message")} multiline maxLength={3000} style={{minHeight:96,padding:12,color:colors.text,textAlignVertical:"top",fontSize:16,
     borderWidth:1,borderColor:colors.border,borderRadius:12}}/>
    <Label muted style={{fontSize:12}}>{ix(locale,"sendHint")}</Label>
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
   <Label weight="bold">{ix(locale,"management")}</Label>
   <Label muted style={{fontSize:12}}>{et(locale,"note")}</Label>
   <Label weight="bold">{et(locale,"lead")}</Label>
   <DirectionalRow style={{flexWrap:"wrap",gap:8}}>
    {LEAD_STATES.map(status=><Pressable key={status} disabled={busy} onPress={()=>void act(()=>updateLeadStatus(data.id,token!,status))}
      accessibilityRole="button" accessibilityState={{selected:status===data.leadStatus}} style={{minHeight:42,paddingHorizontal:12,paddingVertical:8,borderRadius:14,
       borderWidth:1,borderColor:status===data.leadStatus?colors.primary:colors.border,
       backgroundColor:status===data.leadStatus?"#e2efe8":colors.surface}}>
     <Label style={{color:status===data.leadStatus?colors.primary:colors.text}}>{leadStageLabel(locale,status)}</Label>
    </Pressable>)}
   </DirectionalRow>
   {data.agencyId&&(data.role==="owner"||data.role==="manager")?<>
    <Label weight="bold">{et(locale,"assignee")}: {members.find(m=>m.userId===data.assignedTo)?.displayName||et(locale,"unassigned")}</Label>
    <Action kind="secondary" label={et(locale,"unassigned")} onPress={()=>void act(()=>assignInquiry(data.id,token!,null))}/>
    {members.map(m=><Action key={m.userId} disabled={busy} kind={data.assignedTo===m.userId?"primary":"secondary"}
      label={m.displayName+" · "+(m.role==="owner"?uiText(locale,"localeAgencyRoleOwner"):m.role==="manager"?uiText(locale,"localeAgencyRoleManager"):uiText(locale,"localeAgencyRoleAgent"))} onPress={()=>void act(()=>assignInquiry(data.id,token!,m.userId))}/>)}
   </>:null}
   {data.agencyId?<><Label weight="bold">{et(locale,"agencyNotes")}</Label>
    {notes.map(n=><Label key={n.id} muted>{n.body} · {displayKabul(n.createdAt,locale)}</Label>)}
    <AppInput accessibilityLabel={et(locale,"note")} multiline maxLength={1000} value={note} onChangeText={setNote}
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
