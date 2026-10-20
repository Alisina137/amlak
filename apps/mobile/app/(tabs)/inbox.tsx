import {router,useFocusEffect} from "expo-router";
import {useCallback,useMemo,useRef,useState} from "react";
import {Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {useAuth} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {inbox,fetchViewings,fetchAlerts,readAllAlerts,readAlert,displayKabul,type InquirySummary,type Viewing,type Alert} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {ix,inquiryStatus,isPastVisit,notificationGroup,noticeLabel,unreadForThreads,viewingLabel} from "../../src/inbox-experience";
import {routeForNotification} from "../../src/push-client";
import {Action,AppInput,FilterChip,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";

type Tab="inquiries"|"viewings"|"notifications";
type ConversationFilter="all"|"sent"|"received"|"active"|"closed";
type VisitFilter="all"|"upcoming"|"history";
type AlertFilter="all"|"unread"|"read";
export default function Inbox(){
 const {locale}=usePreferences(),{token}=useAuth(),rtl=isRTL(locale);
 const [tab,setTab]=useState<Tab>("inquiries"),[query,setQuery]=useState("");
 const [threadFilter,setThreadFilter]=useState<ConversationFilter>("all");
 const [visitFilter,setVisitFilter]=useState<VisitFilter>("all"),[alertFilter,setAlertFilter]=useState<AlertFilter>("all");
 const [items,setItems]=useState<InquirySummary[]>([]),[viewings,setViewings]=useState<Viewing[]>([]),[alerts,setAlerts]=useState<Alert[]>([]);
 const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[mutating,setMutating]=useState(false),[error,setError]=useState("");
 const [dataToken,setDataToken]=useState<string|null>(null),tokenRef=useRef(token),requestSequence=useRef(0);
 tokenRef.current=token;
 const refresh=useCallback(async()=>{
  const sequence=++requestSequence.current;
  if(!token){setDataToken(null);setItems([]);setViewings([]);setAlerts([]);setLoading(false);setRefreshing(false);setError("");return;}
  setRefreshing(true);
  try{
   const [threads,visits,notes]=await Promise.all([inbox(token),fetchViewings(token),fetchAlerts(token)]);
   if(tokenRef.current===token&&sequence===requestSequence.current){
    setItems(threads.items);setViewings(visits.items);setAlerts(notes.items);
    setDataToken(token);setError("");
   }
  }catch{
   if(tokenRef.current===token&&sequence===requestSequence.current)setError(et(locale,"unknown"));
  }finally{if(tokenRef.current===token&&sequence===requestSequence.current){setLoading(false);setRefreshing(false);}}
 },[token,locale]);
 useFocusEffect(useCallback(()=>{
  void refresh();
  if(!token)return()=>{requestSequence.current++;};
  const timer=setInterval(()=>void refresh(),20000);
  return()=>{clearInterval(timer);requestSequence.current++;};
 },[refresh,token]));
 const safeItems=dataToken===token?items:[],safeViewings=dataToken===token?viewings:[],safeAlerts=dataToken===token?alerts:[];
 const unread=safeAlerts.filter(x=>!x.isRead).length,unreadThreads=unreadForThreads(safeItems,safeAlerts);
 const conversations=useMemo(()=>safeItems.filter(item=>{
  const q=query.trim().toLocaleLowerCase();
  if(q&&!item.title.toLocaleLowerCase().includes(q))return false;
  if(threadFilter==="sent"&&item.side!=="seeker"||threadFilter==="received"&&item.side!=="advertiser")return false;
  if(threadFilter==="closed"&&item.status!=="closed"||threadFilter==="active"&&["closed","blocked"].includes(item.status))return false;
  return true;
 }),[safeItems,query,threadFilter]);
 const filteredViewings=useMemo(()=>safeViewings.filter(v=>visitFilter==="all"||
  (visitFilter==="history"?isPastVisit(v):!isPastVisit(v))),[safeViewings,visitFilter]);
 const filteredAlerts=useMemo(()=>safeAlerts.filter(n=>alertFilter==="all"||(alertFilter==="unread"?!n.isRead:n.isRead)),[safeAlerts,alertFilter]);
 const notificationSections=(["recent","older"] as const).map(group=>({group,items:filteredAlerts.filter(n=>notificationGroup(n)===group)}));
 async function markAll(){
  if(!token||mutating||!unread)return;setMutating(true);setError("");
  try{await readAllAlerts(token);await refresh();}catch{setError(et(locale,"unknown"));}finally{setMutating(false);}
 }
 async function openNotice(n:Alert){
  if(!token||mutating)return;setMutating(true);setError("");
  try{if(!n.isRead)await readAlert(n.id,token);await refresh();}
  catch{setError(et(locale,"unknown"));}finally{setMutating(false);}
  router.push(routeForNotification({kind:n.kind,referenceId:n.referenceId}));
 }
 const tabText:Record<Tab,string>={inquiries:ix(locale,"messages"),viewings:ix(locale,"viewings"),notifications:ix(locale,"notices")};
 return <Page>
  <ScreenHeading title={ix(locale,"inbox")} subtitle={ix(locale,"inboxSub")}/>
  <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:8}}>
   {(["inquiries","viewings","notifications"] as const).map(key=><Pressable key={key}
    accessibilityRole="tab" accessibilityState={{selected:tab===key}}
    onPress={()=>setTab(key)} style={{minHeight:48,flexGrow:1,paddingHorizontal:10,justifyContent:"center",alignItems:"center",
     backgroundColor:tab===key?colors.primary:colors.surface,borderWidth:1,borderColor:tab===key?colors.primary:colors.border,borderRadius:12}}>
    <Label weight="medium" style={{fontSize:13,color:tab===key?colors.surface:colors.text}}>
     {tabText[key]}{key==="notifications"&&unread?" ("+formatNumber(unread,locale)+")":""}
    </Label>
   </Pressable>)}
  </View>
  {!token?<SectionCard><Label>{et(locale,"login")}</Label>
   <Action label={et(locale,"login")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/></SectionCard>:null}
  {token&&tab==="inquiries"?<View style={{gap:10}}>
   <AppInput accessibilityLabel={ix(locale,"search")} placeholder={ix(locale,"search")}
    value={query} onChangeText={setQuery}/>
   <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:8}}>
    {(["all","sent","received","active","closed"] as const).map(key=><FilterChip key={key}
     label={ix(locale,key)} selected={threadFilter===key} onPress={()=>setThreadFilter(key)}/>)}
   </View>
   {!loading?<Label muted style={{fontSize:12}}>{formatNumber(conversations.length,locale)} {ix(locale,"conversation")}</Label>:null}
  </View>:null}
  {token&&tab==="viewings"?<View style={{gap:10}}>
   <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:8}}>
    {(["all","upcoming","history"] as const).map(key=><FilterChip key={key}
     label={ix(locale,key)} selected={visitFilter===key} onPress={()=>setVisitFilter(key)}/>)}
   </View>
   <Label muted style={{fontSize:12}}>{ix(locale,"timeZone")} {ix(locale,"viewingHint")}</Label>
  </View>:null}
  {token&&tab==="notifications"?<View style={{gap:10}}>
   <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:8}}>
    {(["all","unread","read"] as const).map(key=><FilterChip key={key}
     label={ix(locale,key)} selected={alertFilter===key} onPress={()=>setAlertFilter(key)}/>)}
   </View>
   <Label muted style={{fontSize:12}}>{ix(locale,"settingsHint")}</Label>
   <Action kind="secondary" label={ix(locale,"settings")} onPress={()=>router.push("/notification-settings")}/>
   <Action kind="secondary" disabled={mutating||refreshing||!unread} label={ix(locale,"markAll")} onPress={()=>void markAll()}/>
  </View>:null}
  {token&&loading?<View style={{gap:10}}><LoadingCard rows={3}/><LoadingCard rows={2}/></View>:null}
  {error?<StateNotice message={error} retryLabel={ix(locale,"retry")} onRetry={()=>void refresh()}/>:null}
  {token&&!loading&&tab==="inquiries"&&conversations.length===0?<SectionCard>
   <Label muted>{safeItems.length?ix(locale,"searchEmpty"):et(locale,"none")}</Label>
  </SectionCard>:null}
  {token&&!loading&&tab==="inquiries"&&conversations.map(i=><Pressable key={i.id}
   accessibilityRole="button" accessibilityLabel={i.title+" · "+inquiryStatus(locale,i.status)}
   onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:i.id}})}>
   <SectionCard>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",justifyContent:"space-between",gap:8}}>
     <Label weight="bold" style={{flex:1,fontSize:16}}>{i.title}</Label>
     {unreadThreads.has(i.id)?<StatusBadge tone="warning" label={ix(locale,"unread")}/>:null}
    </View>
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
     <StatusBadge label={inquiryStatus(locale,i.status)} tone={i.status==="closed"?"warning":"neutral"}/>
     <Label muted style={{fontSize:12}}>{i.side==="seeker"?ix(locale,"sent"):ix(locale,"received")}</Label>
    </View>
    {i.lastMessagePreview?<Label muted style={{fontSize:13,lineHeight:20}}>{i.lastMessagePreview}</Label>:null}
    <Label muted style={{fontSize:12}}>{ix(locale,"lastActivity")}: {displayKabul(i.lastMessageAt,locale)}</Label>
   </SectionCard>
  </Pressable>)}
  {token&&!loading&&tab==="viewings"&&filteredViewings.length===0?<SectionCard><Label muted>{ix(locale,"noVisits")}</Label></SectionCard>:null}
  {token&&!loading&&tab==="viewings"&&filteredViewings.map(v=><Pressable key={v.id} accessibilityRole="button"
   onPress={()=>router.push({pathname:"/viewings/[id]",params:{id:v.id}})}>
   <SectionCard>
    <StatusBadge label={et(locale,v.status)} tone={v.status==="confirmed"?"success":isPastVisit(v)?"warning":"neutral"}/>
    <Label weight="medium">{viewingLabel(v,locale)}</Label>
    <Label muted style={{fontSize:12}}>{ix(locale,"viewingHint")}</Label>
   </SectionCard>
  </Pressable>)}
  {token&&!loading&&tab==="notifications"&&filteredAlerts.length===0?<SectionCard><Label muted>{ix(locale,"noNotices")}</Label></SectionCard>:null}
  {token&&!loading&&tab==="notifications"&&notificationSections.map(section=>section.items.length?
   <View key={section.group} style={{gap:10}}>
    <Label weight="bold" style={{fontSize:16}}>{ix(locale,section.group)}</Label>
    {section.items.map(n=><Pressable accessibilityRole="button" accessibilityLabel={n.title} key={n.id}
     disabled={mutating} onPress={()=>void openNotice(n)}>
     <SectionCard style={{backgroundColor:n.isRead?colors.surface:"#F1F8F4"}}>
      <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,alignItems:"center"}}>
       {!n.isRead?<View style={{width:9,height:9,borderRadius:5,backgroundColor:colors.primary}}/>:null}
       <Label weight={n.isRead?"regular":"bold"} style={{fontSize:13,flex:1}}>{noticeLabel(locale,n.kind)}</Label>
       <Label muted style={{fontSize:11}}>{displayKabul(n.createdAt,locale)}</Label>
      </View>
      <Label style={{fontSize:14}}>{n.title}</Label>
      <Label muted style={{fontSize:11}}>{ix(locale,n.isRead?"read":"unread")}</Label>
     </SectionCard>
    </Pressable>)}
   </View>:null)}
  {token?<Pressable accessibilityRole="button" disabled={refreshing||mutating} onPress={()=>void refresh()}
   style={{minHeight:44,alignSelf:rtl?"flex-end":"flex-start",justifyContent:"center",paddingHorizontal:8}}>
   <Label style={{fontSize:13,color:colors.primary}}>{refreshing?"…":ix(locale,"reload")+" ↻"}</Label>
  </Pressable>:null}
 </Page>;
}
