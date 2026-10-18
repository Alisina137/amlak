import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {inbox,fetchViewings,fetchAlerts,readAllAlerts,readAlert,displayKabul,type InquirySummary,type Viewing,type Alert} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {routeForNotification} from "../../src/push-client";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function Inbox(){
 const {locale}=usePreferences(),{token}=useAuth();
 const [tab,setTab]=useState<"inquiries"|"viewings"|"notifications">("inquiries");
 const [items,setItems]=useState<InquirySummary[]>([]),[viewings,setViewings]=useState<Viewing[]>([]),[alerts,setAlerts]=useState<Alert[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const refresh=useCallback(async()=>{
  if(!token){setItems([]);setViewings([]);setAlerts([]);setBusy(false);return;}
  setBusy(true);
  try{
   const [threads,visits,notes]=await Promise.all([inbox(token),fetchViewings(token),fetchAlerts(token)]);
   setItems(threads.items);setViewings(visits.items);setAlerts(notes.items);setError("");
  }catch{setError(et(locale,"unknown"));}finally{setBusy(false);}
 },[token,locale]);
 useFocusEffect(useCallback(()=>{
  void refresh();
  if(!token)return;
  const timer=setInterval(()=>void refresh(),20000);
  return()=>clearInterval(timer);
 },[refresh,token]));
 const unread=alerts.filter(x=>!x.isRead).length;
 return <Page>
  <ScreenHeading title={locale==="en"?"Inbox":locale==="fa"?"پیام‌ها و بازدیدها":"پیغامونه او لیدنې"}
   subtitle={et(locale,"safety")}/>
  {!token?<SectionCard><Label>{et(locale,"login")}</Label>
    <Action label={et(locale,"login")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
   </SectionCard>:null}
  <View style={{flexDirection:locale==="en"?"row":"row-reverse",gap:5}}>
   {(["inquiries","viewings","notifications"] as const).map(key=><View key={key} style={{flex:1}}>
    <Action kind={tab===key?"primary":"secondary"} label={et(locale,key)+(key==="notifications"&&unread?" ("+unread+")":"")} onPress={()=>setTab(key)}/>
   </View>)}
  </View>
  {token?<Action kind="secondary" disabled={busy} label={et(locale,"refresh")} onPress={()=>void refresh()}/>:null}
  {busy&&items.length===0&&viewings.length===0&&alerts.length===0?<SectionCard><ActivityIndicator color={colors.primary}/></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  {token&&tab==="inquiries"&&items.length===0&&!busy?<SectionCard><Label>{et(locale,"none")}</Label></SectionCard>:null}
  {token&&tab==="inquiries"&&items.map(i=><SectionCard key={i.id}>
   <Pressable accessibilityRole="button" onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:i.id}})} style={{gap:5,minHeight:44}}>
    <Label weight="bold">{i.title}</Label>
    <Label muted>{i.side==="seeker"?et(locale,"sent"):et(locale,"received")} · {i.status}</Label>
    <Label muted>{displayKabul(i.lastMessageAt,locale)}</Label>
   </Pressable>
   <Action kind="secondary" label={et(locale,"open")} onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:i.id}})}/>
  </SectionCard>)}
  {token&&tab==="viewings"&&viewings.length===0&&!busy?<SectionCard><Label>{et(locale,"empty")}</Label></SectionCard>:null}
  {token&&tab==="viewings"&&viewings.map(v=><SectionCard key={v.id}>
   <Label weight="bold">{et(locale,v.status)}</Label>
   <Label muted>{v.confirmedSlot?displayKabul(v.confirmedSlot,locale):v.counterSlot?displayKabul(v.counterSlot,locale):v.proposedSlots.map(s=>displayKabul(s,locale)).join(" · ")}</Label>
   <Action kind="secondary" label={et(locale,"more")} onPress={()=>router.push({pathname:"/viewings/[id]",params:{id:v.id}})}/>
  </SectionCard>)}
  {token&&tab==="notifications"&&<Action kind="secondary" label={et(locale,"allRead")} onPress={()=>void readAllAlerts(token).then(refresh).catch(()=>setError(et(locale,"unknown")))}/>}
  {token&&tab==="notifications"&&alerts.length===0&&!busy?<SectionCard><Label>{et(locale,"empty")}</Label></SectionCard>:null}
  {token&&tab==="notifications"&&alerts.map(n=><Pressable accessibilityRole="button" key={n.id}
   onPress={()=>{
    if(token)void readAlert(n.id,token).then(()=>refresh()).catch(()=>{});
    router.push(routeForNotification({kind:n.kind,referenceId:n.referenceId}));
   }}>
   <SectionCard>
    <Label weight={n.isRead?"regular":"bold"}>{n.kind==="freshness"?
     (locale==="en"?"Availability":locale==="fa"?"تأیید موجودی":"د شتون تایید"):
     n.kind==="safety"?(locale==="en"?"Safety":locale==="fa"?"ایمنی":"خوندیتوب"):
     n.kind==="saved_search"?(locale==="en"?"Saved search":locale==="fa"?"جستجوی ذخیره‌شده":"خوندي پلټنه"):n.kind==="support"?(locale==="en"?"Support":locale==="fa"?"پشتیبانی":"ملاتړ"):n.kind==="viewing"?et(locale,"viewings"):n.kind==="lead"?et(locale,"lead"):et(locale,"inquiries")}</Label>
    <Label>{n.title}</Label>
    <Label muted>{displayKabul(n.createdAt,locale)} {n.isRead?"":"●"}</Label>
   </SectionCard>
  </Pressable>)}
 </Page>;
}
