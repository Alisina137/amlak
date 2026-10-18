import {router,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {leadStageLabel,uiText} from "../../src/ui-copy";
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
 const [dataToken,setDataToken]=useState<string|null>(null);
 const tokenRef=useRef(token),requestSequence=useRef(0);
 tokenRef.current=token;
 const refresh=useCallback(async()=>{
  const sequence=++requestSequence.current;
  if(!token){setDataToken(null);setItems([]);setViewings([]);setAlerts([]);setBusy(false);return;}
  setBusy(true);
  try{
   const [threads,visits,notes]=await Promise.all([inbox(token),fetchViewings(token),fetchAlerts(token)]);
   if(tokenRef.current===token&&sequence===requestSequence.current){
    setItems(threads.items);setViewings(visits.items);setAlerts(notes.items);
    setDataToken(token);setError("");
   }
  }catch{if(tokenRef.current===token&&sequence===requestSequence.current)setError(et(locale,"unknown"));}
  finally{if(tokenRef.current===token&&sequence===requestSequence.current)setBusy(false);}
 },[token,locale]);
 useFocusEffect(useCallback(()=>{
  void refresh();
  if(!token)return;
  const timer=setInterval(()=>void refresh(),20000);
  return()=>clearInterval(timer);
 },[refresh,token]));
 const safeItems=dataToken===token?items:[];
 const safeViewings=dataToken===token?viewings:[];
 const safeAlerts=dataToken===token?alerts:[];
 const unread=safeAlerts.filter(x=>!x.isRead).length;
 return <Page>
  <ScreenHeading title={locale==="en"?"Inbox":locale==="fa"?"پیام‌ها و بازدیدها":"پیغامونه او لیدنې"}
   subtitle={et(locale,"safety")}/>
  {!token?<SectionCard><Label>{et(locale,"login")}</Label>
    <Action label={et(locale,"login")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
   </SectionCard>:null}
  <ScrollView horizontal showsHorizontalScrollIndicator={false}
   contentContainerStyle={{flexDirection:isRTL(locale)?"row-reverse":"row",gap:8,paddingVertical:3}}
   accessibilityRole="tablist">
   {(["inquiries","viewings","notifications"] as const).map(key=>
    <Pressable key={key} accessibilityRole="tab" accessibilityState={{selected:tab===key}}
     accessibilityLabel={et(locale,key)} onPress={()=>setTab(key)}
     style={{minWidth:112,minHeight:48,paddingHorizontal:14,justifyContent:"center",alignItems:"center",
      borderWidth:1,borderRadius:14,borderColor:tab===key?colors.primary:colors.border,
      backgroundColor:tab===key?colors.primary:colors.surface}}>
     <Label weight="medium" style={{textAlign:"center",color:tab===key?colors.surface:colors.text}}>
      {et(locale,key)}{key==="notifications"&&unread?" ("+formatNumber(unread,locale)+")":""}
     </Label>
    </Pressable>)}
  </ScrollView>
  {token?<Action kind="secondary" disabled={busy} label={et(locale,"refresh")} onPress={()=>void refresh()}/>:null}
  {busy&&safeItems.length===0&&safeViewings.length===0&&safeAlerts.length===0?<SectionCard><ActivityIndicator color={colors.primary}/></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  {token&&tab==="inquiries"&&safeItems.length===0&&!busy?<SectionCard><Label>{et(locale,"none")}</Label></SectionCard>:null}
  {token&&tab==="inquiries"&&safeItems.map(i=><SectionCard key={i.id}>
   <Pressable accessibilityRole="button" onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:i.id}})} style={{gap:5,minHeight:44}}>
    <Label weight="bold">{i.title}</Label>
    <Label muted>{i.side==="seeker"?et(locale,"sent"):et(locale,"received")} · {i.status==="closed"?et(locale,"closed"):i.status==="responded"?et(locale,"responded"):et(locale,"new")}</Label>
    <Label muted>{displayKabul(i.lastMessageAt,locale)}</Label>
   </Pressable>
   <Action kind="secondary" label={et(locale,"open")} onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:i.id}})}/>
  </SectionCard>)}
  {token&&tab==="viewings"&&safeViewings.length===0&&!busy?<SectionCard><Label>{et(locale,"empty")}</Label></SectionCard>:null}
  {token&&tab==="viewings"&&safeViewings.map(v=><SectionCard key={v.id}>
   <Label weight="bold">{et(locale,v.status)}</Label>
   <Label muted>{v.confirmedSlot?displayKabul(v.confirmedSlot,locale):v.counterSlot?displayKabul(v.counterSlot,locale):v.proposedSlots.map(s=>displayKabul(s,locale)).join(" · ")}</Label>
   <Action kind="secondary" label={et(locale,"more")} onPress={()=>router.push({pathname:"/viewings/[id]",params:{id:v.id}})}/>
  </SectionCard>)}
  {token&&tab==="notifications"&&<Action kind="secondary" label={et(locale,"allRead")} onPress={()=>void readAllAlerts(token).then(refresh).catch(()=>setError(et(locale,"unknown")))}/>}
  {token&&tab==="notifications"&&safeAlerts.length===0&&!busy?<SectionCard><Label>{et(locale,"empty")}</Label></SectionCard>:null}
  {token&&tab==="notifications"&&safeAlerts.map(n=><Pressable accessibilityRole="button" key={n.id}
   onPress={()=>{
    if(token)void readAlert(n.id,token).then(()=>refresh()).catch(()=>{});
    router.push(routeForNotification({kind:n.kind,referenceId:n.referenceId}));
   }}>
   <SectionCard>
    <Label weight={n.isRead?"regular":"bold"}>{n.kind==="freshness"?
     (locale==="en"?"Availability":locale==="fa"?"تأیید موجودی":"د شتون تایید"):
     n.kind==="safety"?(locale==="en"?"Safety":locale==="fa"?"ایمنی":"خوندیتوب"):
     (n.kind==="subscription_agency"||n.kind==="subscription_solo")?(locale==="en"?"Subscription":locale==="fa"?"اشتراک":"ګډون"):n.kind==="saved_search"?(locale==="en"?"Saved search":locale==="fa"?"جستجوی ذخیره‌شده":"خوندي پلټنه"):n.kind==="support"?(locale==="en"?"Support":locale==="fa"?"پشتیبانی":"ملاتړ"):n.kind==="viewing"?et(locale,"viewings"):n.kind==="lead"?et(locale,"lead"):et(locale,"inquiries")}</Label>
    <Label>{n.title}</Label>
    <Label muted>{displayKabul(n.createdAt,locale)} {n.isRead?"":"●"}</Label>
   </SectionCard>
  </Pressable>)}
 </Page>;
}
