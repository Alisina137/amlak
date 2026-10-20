import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useState} from "react";
import {Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {fetchViewings,inquiry,viewingDecision,displayKabul,kabulSlots,type Viewing,type InquiryDetail} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function ViewingDetail(){
 const {id}=useLocalSearchParams<{id:string}>(),{token}=useAuth(),{locale}=usePreferences();
 const [visit,setVisit]=useState<Viewing|null>(null),[thread,setThread]=useState<InquiryDetail|null>(null),[selected,setSelected]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const reload=useCallback(async()=>{
  if(!token)return;
  try{
   const result=await fetchViewings(token),entry=result.items.find(row=>row.id===id);
   if(!entry){setError(et(locale,"noAccess"));return;}
   setVisit(entry);
   const conversation=await inquiry(entry.inquiryId,token);setThread(conversation);setError("");
  }catch{setError(et(locale,"unknown"));}
 },[token,id,locale]);
 useFocusEffect(useCallback(()=>{void reload();},[reload]));
 const side=thread?.side;
 async function act(action:string,slot?:string){
  if(!token||!visit)return;
  setBusy(true);setError("");
  try{await viewingDecision(visit.id,token,visit.version,action,slot);setSelected(null);await reload();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const future=kabulSlots().slice(0,12);
 return <Page><BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={et(locale,"viewings")} subtitle={thread?.title}/>
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  {visit?<SectionCard>
   <Label weight="bold">{et(locale,visit.status)}</Label>
   <Label weight="bold">{et(locale,"proposed")}</Label>
   {visit.proposedSlots.map(slot=><Label key={slot} muted>{displayKabul(slot,locale)}</Label>)}
   {visit.counterSlot?<Label>{et(locale,"counterTime")}: {displayKabul(visit.counterSlot,locale)}</Label>:null}
   {visit.confirmedSlot?<Label style={{color:colors.success}}>{et(locale,"confirmedTime")}: {displayKabul(visit.confirmedSlot,locale)}</Label>:null}
   {visit.note?<Label>{visit.note}</Label>:null}
   {visit.status==="requested"&&side==="advertiser"?<>
    <Label>{et(locale,"choose")}</Label>
    {visit.proposedSlots.map(slot=><Action key={slot} kind="secondary" disabled={busy}
     label={et(locale,"confirm")+" · "+displayKabul(slot,locale)} onPress={()=>void act("confirm",slot)}/>)}
    <Action kind="secondary" disabled={busy} label={et(locale,"decline")} onPress={()=>void act("decline")}/>
   </>:null}
   {["requested","counterproposed"].includes(visit.status)&&side==="advertiser"?<>
    <Label weight="bold">{et(locale,"counter")}</Label>
    <View style={{flexDirection:"row",gap:8,flexWrap:"wrap"}}>{future.map(option=><Pressable key={option.iso} onPress={()=>setSelected(option.iso)} accessibilityRole="button"
      style={{minHeight:44,padding:10,borderWidth:1,borderRadius:12,borderColor:selected===option.iso?colors.primary:colors.border}}>
     <Label>{displayKabul(option.iso,locale)}</Label></Pressable>)}</View>
    <Action disabled={!selected||busy} kind="secondary" label={et(locale,"counter")} onPress={()=>void act("counter",selected||undefined)}/>
   </>:null}
   {visit.status==="counterproposed"&&side==="seeker"?<Action disabled={busy} label={et(locale,"accept")} onPress={()=>void act("accept_counter")}/>:null}
   {["requested","counterproposed","confirmed"].includes(visit.status)?<Action kind="secondary" disabled={busy} label={et(locale,"cancel")} onPress={()=>void act("cancel")}/>:null}
   {visit.status==="confirmed"&&side==="advertiser"&&visit.confirmedSlot&&new Date(visit.confirmedSlot).getTime()<=Date.now()?<>
     <Action kind="secondary" disabled={busy} label={et(locale,"complete")} onPress={()=>void act("complete")}/>
     <Action kind="secondary" disabled={busy} label={et(locale,"noShow")} onPress={()=>void act("no_show")}/>
   </>:null}
   <Label muted>{et(locale,"timeNote")}</Label>
  </SectionCard>:null}
  {thread?<Action kind="secondary" label={et(locale,"open")} onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:thread.id}})}/>:null}
 </Page>;
}
