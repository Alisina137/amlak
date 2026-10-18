import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useMemo,useState} from "react";
import {Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth} from "../../../src/auth";
import {usePreferences} from "../../../src/context";
import {displayKabul,inbox,type InquirySummary} from "../../../src/engagement-client";
import {et} from "../../../src/engagement-copy";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../../src/ui";
export default function AgencyLeads(){
 const {id}=useLocalSearchParams<{id:string}>(),{token}=useAuth(),{locale}=usePreferences();
 const [items,setItems]=useState<InquirySummary[]>([]),[tab,setTab]=useState<"all"|"unassigned"|"new"|"viewing">("all"),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const load=useCallback(async()=>{
  if(!token)return;
  setLoading(true);setError("");
  try{const result=await inbox(token);setItems(result.items.filter(i=>i.agencyId===id&&i.side==="advertiser"));}
  catch(e){setError((e as Error).message||et(locale,"unknown"));}finally{setLoading(false);}
 },[token,id,locale]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 const filtered=useMemo(()=>items.filter(i=>tab==="all"||tab==="unassigned"&&!i.assignedTo||
  tab==="new"&&i.leadStatus==="new"||tab==="viewing"&&i.leadStatus==="viewing"),[items,tab]);
 return <Page>
  <ScreenHeading title={locale==="en"?"Agency leads":"مشتریان دفتر"} subtitle={locale==="en"?"Only leads within your active agency permissions appear here.":"تنها مشتریان مربوط به صلاحیت فعلی شما نمایش داده می‌شوند."}/>
  <Action kind="secondary" label="←" onPress={()=>router.back()}/>
  <View style={{flexDirection:"row",gap:6,flexWrap:"wrap"}}>
   {(["all","unassigned","new","viewing"] as const).map(k=><Pressable key={k} accessibilityRole="button" accessibilityState={{selected:tab===k}}
    onPress={()=>setTab(k)} style={{paddingHorizontal:12,minHeight:44,justifyContent:"center",borderWidth:1,borderRadius:14,
     borderColor:tab===k?colors.primary:colors.border,backgroundColor:tab===k?"#e3f0e9":colors.surface}}>
    <Label>{k==="all"?(locale==="en"?"All":"همه"):k==="unassigned"?et(locale,"unassigned"):k==="new"?et(locale,"new"):et(locale,"viewings")}</Label>
   </Pressable>)}
  </View>
  <Label muted>{filtered.length} · {et(locale,"lead")}</Label>
  {loading?<SectionCard><Label muted>…</Label></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  {!loading&&filtered.length===0?<SectionCard><Label muted>{et(locale,"empty")}</Label></SectionCard>:null}
  {filtered.map(item=><SectionCard key={item.id}>
   <Label weight="bold">{item.title}</Label>
   <Label muted>{item.leadStatus} · {item.assignedTo?et(locale,"assignee"):et(locale,"unassigned")} · {displayKabul(item.lastMessageAt,locale)}</Label>
   <Action label={et(locale,"open")} onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:item.id}})}/>
  </SectionCard>)}
  <Action kind="secondary" label={et(locale,"refresh")} onPress={()=>void load()}/>
 </Page>;
}
