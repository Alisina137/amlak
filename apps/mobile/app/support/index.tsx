import {router,useFocusEffect} from "expo-router";
import * as Crypto from "expo-crypto";
import {useCallback,useRef,useState} from "react";
import {View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {authT} from "../../src/auth-copy";
import {usePreferences} from "../../src/context";
import {sx,ticketCategory,ticketCategories,ticketStatus,type TicketCategory} from "../../src/support-experience";
import {Action,AppInput,BackButton,FilterChip,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";
type Ticket={id:string;subject:string;status:string;category:string;updatedAt:string};
type Tab="new"|"history";
type HistoryFilter="all"|"active"|"past";
export default function Support(){
 const {locale}=usePreferences(),rtl=isRTL(locale),{token,user}=useAuth();
 const [snapshot,setSnapshot]=useState<{token:string|null;items:Ticket[]}>({token:null,items:[]});
 const items=snapshot.token===token?snapshot.items:[];
 const [tab,setTab]=useState<Tab>("new"),[filter,setFilter]=useState<HistoryFilter>("all"),
  [category,setCategory]=useState<TicketCategory>("account"),[subject,setSubject]=useState(""),[body,setBody]=useState(""),
  [error,setError]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const epoch=useRef(0),tokenRef=useRef(token),key=useRef(Crypto.randomUUID()),lock=useRef(false);
 tokenRef.current=token;
 const refresh=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setSnapshot({token:null,items:[]});setLoading(false);setError("");return;}
  setLoading(true);
  try{
   const result=await requestJson<{items:Ticket[]}>("/v1/support/tickets",{token});
   if(version===epoch.current&&tokenRef.current===token){setSnapshot({token,items:result.items});setError("");}
  }catch{if(version===epoch.current&&tokenRef.current===token)setError(sx(locale,"failed"));}
  finally{if(version===epoch.current&&tokenRef.current===token)setLoading(false);}
 },[token,locale]);
 useFocusEffect(useCallback(()=>{void refresh();return()=>{epoch.current++;};},[refresh]));
 const openCount=items.filter(i=>i.status==="open"||i.status==="awaiting_user").length;
 const filtered=items.filter(i=>filter==="all"||(filter==="active"?["open","awaiting_user"].includes(i.status):["resolved","closed"].includes(i.status)));
 async function submit(){
  if(!token||!user?.verified||lock.current||busy||openCount>=5||subject.trim().length<6||body.trim().length<10)return;
  lock.current=true;setBusy(true);setError("");
  try{
   const ticket=await requestJson<Ticket>("/v1/support/tickets",{token,method:"POST",body:{
    requestId:key.current,category,subject:subject.trim(),body:body.trim()
   }});
   key.current=Crypto.randomUUID();setSubject("");setBody("");await refresh();
   router.push({pathname:"/support/[id]",params:{id:ticket.id}});
  }catch{setError(sx(locale,"failed"));}finally{lock.current=false;setBusy(false);}
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={sx(locale,"title")} subtitle={sx(locale,"subtitle")}/>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
   {(["new","history"] as const).map(keyName=><View key={keyName} style={{flex:1}}>
    <Action kind={tab===keyName?"primary":"secondary"} label={sx(locale,keyName)} onPress={()=>setTab(keyName)}/>
   </View>)}
  </View>
  {!token||!user?.verified?<SectionCard>
   <Label>{sx(locale,"signin")}</Label>
   <Action label={authT(locale,"login")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:null}
  {token&&user?.verified&&tab==="new"?<SectionCard>
   <Label weight="bold" style={{fontSize:17}}>{sx(locale,"new")}</Label>
   <Label muted style={{fontSize:12}}>{sx(locale,"submitHint")}</Label>
   <Label weight="medium">{sx(locale,"category")}</Label>
   <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:8}}>
    {ticketCategories.map(c=><FilterChip key={c} selected={category===c} label={ticketCategory(locale,c)} onPress={()=>setCategory(c)}/>)}
   </View>
   <Label>{sx(locale,"subject")}</Label>
   <AppInput accessibilityLabel={sx(locale,"subject")} value={subject} editable={!busy}
    onChangeText={setSubject} maxLength={150} placeholder={sx(locale,"subject")}/>
   <Label>{sx(locale,"details")}</Label>
   <AppInput accessibilityLabel={sx(locale,"details")} value={body} editable={!busy}
    onChangeText={setBody} multiline maxLength={2000}
    placeholder={sx(locale,"details")} style={{minHeight:124,textAlignVertical:"top"}}/>
   <Label muted style={{fontSize:12}}>{sx(locale,"required")}</Label>
   <Label muted style={{fontSize:12}}>{sx(locale,"limit")} ({formatNumber(openCount,locale)}/5)</Label>
   <Action disabled={busy||loading||openCount>=5||subject.trim().length<6||body.trim().length<10}
    label={sx(locale,"send")} onPress={()=>void submit()}/>
  </SectionCard>:null}
  {tab==="history"&&token?<View style={{gap:10}}>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
    {(["all","active","past"] as const).map(v=><FilterChip key={v} selected={v===filter} label={sx(locale,v)} onPress={()=>setFilter(v)}/>)}
   </View>
   {loading?<LoadingCard rows={3}/>:null}
   {!loading&&filtered.length===0?<SectionCard><Label muted>{sx(locale,"empty")}</Label></SectionCard>:null}
   {!loading&&filtered.map(item=><SectionCard key={item.id}>
    <Label weight="bold" style={{fontSize:16}}>{item.subject}</Label>
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:7,flexWrap:"wrap"}}>
     <StatusBadge label={ticketStatus(locale,item.status)} tone={item.status==="open"?"success":"neutral"}/>
     <Label muted style={{fontSize:12}}>{ticketCategory(locale,item.category)}</Label>
    </View>
    <Label muted style={{fontSize:12}}>{sx(locale,"updated")}: {new Intl.DateTimeFormat(locale==="en"?"en-US":locale==="fa"?"fa-AF":"ps-AF",{
     timeZone:"Asia/Kabul",month:"short",day:"numeric",year:"numeric"
    }).format(new Date(item.updatedAt))}</Label>
    <Action kind="secondary" label={sx(locale,"open")} onPress={()=>router.push({pathname:"/support/[id]",params:{id:item.id}})}/>
   </SectionCard>)}
  </View>:null}
  <SectionCard>
   <Label muted style={{fontSize:13}}>{sx(locale,"privacy")}</Label>
   <Label muted style={{fontSize:13}}>{sx(locale,"safety")}</Label>
   <Action kind="secondary" label={sx(locale,"report")} onPress={()=>router.push("/safety")}/>
  </SectionCard>
  {error?<StateNotice message={error} retryLabel={sx(locale,"retry")} onRetry={()=>void refresh()}/>:null}
  {token?<Action kind="secondary" label={sx(locale,"refresh")} disabled={busy||loading} onPress={()=>void refresh()}/>:null}
 </Page>;
}
