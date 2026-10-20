import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useMemo,useRef,useState} from "react";
import {View} from "react-native";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {leadStageLabel} from "../../../src/ui-copy";
import {useAuth} from "../../../src/auth";
import {usePreferences} from "../../../src/context";
import {displayKabul,inbox,type InquirySummary} from "../../../src/engagement-client";
import {ag} from "../../../src/agency-experience";
import {Action,AppInput,BackButton,FilterChip,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../../src/ui";
type Stage="all"|"unassigned"|"new"|"contacted"|"viewing"|"negotiating"|"won"|"lost";
export default function AgencyLeads(){
 const {id}=useLocalSearchParams<{id:string}>(),{token}=useAuth(),{locale}=usePreferences(),rtl=isRTL(locale);
 const [snapshot,setSnapshot]=useState<{scope:string;items:InquirySummary[]}>({scope:"",items:[]});
 const scope=token+":"+id,items=snapshot.scope===scope?snapshot.items:[];
 const [stage,setStage]=useState<Stage>("all"),[query,setQuery]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const epoch=useRef(0),scopeRef=useRef(scope);scopeRef.current=scope;
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setSnapshot({scope,items:[]});setBusy(false);return;}
  setBusy(true);setError("");
  try{
   const result=await inbox(token);
   if(version===epoch.current&&scopeRef.current===scope)
    setSnapshot({scope,items:result.items.filter(i=>i.agencyId===id&&i.side==="advertiser")});
  }catch{if(version===epoch.current&&scopeRef.current===scope)setError(ag(locale,"error"));}
  finally{if(version===epoch.current&&scopeRef.current===scope)setBusy(false);}
 },[token,id,locale,scope]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 const filtered=useMemo(()=>items.filter(item=>{
  const stageMatch=stage==="all"||stage==="unassigned"&&!item.assignedTo||item.leadStatus===stage;
  return stageMatch&&item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
 }),[items,stage,query]);
 const label=(value:Stage)=>value==="all"?ag(locale,"all"):value==="unassigned"?ag(locale,"unassigned"):leadStageLabel(locale,value);
 const stages:Stage[]=["all","unassigned","new","contacted","viewing","negotiating","won","lost"];
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={ag(locale,"leads")} subtitle={ag(locale,"analytics")}/>
  <AppInput accessibilityLabel={ag(locale,"search")} placeholder={ag(locale,"search")} value={query} onChangeText={setQuery}/>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:7,flexWrap:"wrap"}}>
   {stages.map(value=><FilterChip key={value} label={label(value)}
    selected={stage===value} onPress={()=>setStage(value)}/>)}
  </View>
  <Label muted style={{fontSize:12}}>{formatNumber(filtered.length,locale)} / {formatNumber(items.length,locale)} {ag(locale,"leads")}</Label>
  {busy?<LoadingCard rows={3}/>:null}
  {error?<StateNotice message={error} retryLabel={ag(locale,"retry")} onRetry={()=>void load()}/>:null}
  {!busy&&filtered.length===0?<SectionCard><Label muted>{ag(locale,"empty")}</Label></SectionCard>:null}
  {!busy&&filtered.map(item=><SectionCard key={item.id}>
   <Label weight="bold" style={{fontSize:16}}>{item.title}</Label>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
    <StatusBadge label={leadStageLabel(locale,item.leadStatus)}
     tone={["new","contacted"].includes(item.leadStatus)?"warning":"neutral"}/>
    <StatusBadge label={item.assignedTo?ag(locale,"assigned"):ag(locale,"unassigned")}/>
   </View>
   <Label muted style={{fontSize:12}}>{ag(locale,"recent")}: {displayKabul(item.lastMessageAt,locale)}</Label>
   <Action label={ag(locale,"open")} onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:item.id}})}/>
  </SectionCard>)}
  <Action kind="secondary" label={ag(locale,"refresh")} disabled={busy} onPress={()=>void load()}/>
  <Action kind="secondary" label={ag(locale,"performance")}
   onPress={()=>router.push({pathname:"/agency/[id]/performance",params:{id}})}/>
 </Page>;
}
