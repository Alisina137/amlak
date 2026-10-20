import {router,useFocusEffect} from "expo-router";
import {useCallback,useEffect,useRef,useState} from "react";
import {Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL,t} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {useFavorites} from "../../src/favorites";
import {dt} from "../../src/discovery-copy";
import {ListingCard} from "../../src/listing-ui";
import type {ListingDTO} from "../../src/listing-client";
import {Action,FilterChip,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";
import {savedFilterSummary} from "../../src/saved-utils";
import {savedTabs,savedText} from "../../src/saved-copy";
import {uiText} from "../../src/ui-copy";

type Tab="favorites"|"searches"|"shortlists";
type Search={id:string;title:string;filters:Record<string,string>;alertsEnabled:boolean};
type Shortlist={id:string;title:string;role:"owner"|"member";membershipStatus:"pending"|"active"};
export default function Saved(){
 const {locale}=usePreferences(),{token}=useAuth(),{refresh,toggle}=useFavorites(),rtl=isRTL(locale);
 const [active,setActive]=useState<Tab>("favorites");
 const [snapshot,setSnapshot]=useState<{token:string|null;items:ListingDTO[]}>({token:null,items:[]});
 const [previews,setPreviews]=useState<{token:string|null;searches:Search[];shortlists:Shortlist[]}>({token:null,searches:[],shortlists:[]});
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[working,setWorking]=useState(false);
 const [selected,setSelected]=useState<string[]>([]);
 const [lastRemoved,setLastRemoved]=useState<ListingDTO|null>(null);
 const tokenRef=useRef(token),epoch=useRef(0);
 tokenRef.current=token;
 useEffect(()=>{setSelected([]);setLastRemoved(null);},[token]);
 const items=snapshot.token===token?snapshot.items:[];
 const searches=previews.token===token?previews.searches:[];
 const shortlists=previews.token===token?previews.shortlists:[];
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setSnapshot({token:null,items:[]});setPreviews({token:null,searches:[],shortlists:[]});setSelected([]);
   setLoading(false);setError("");return;}
  setLoading(true);setError("");
  try{
   if(active==="favorites"){
    const result=await requestJson<{items:ListingDTO[]}>("/v1/favorites",{token});
    if(epoch.current!==version||tokenRef.current!==token)return;
    setSnapshot({token,items:result.items});
    setSelected(previous=>previous.filter(id=>result.items.some(item=>item.id===id)));
    void refresh().catch(()=>{});
   }else if(active==="searches"){
    const result=await requestJson<{items:Search[]}>("/v1/saved-searches",{token});
    if(epoch.current!==version||tokenRef.current!==token)return;
    setPreviews(prev=>({token,searches:result.items,shortlists:prev.token===token?prev.shortlists:[]}));
   }else{
    const result=await requestJson<{items:Shortlist[]}>("/v1/shortlists",{token});
    if(epoch.current!==version||tokenRef.current!==token)return;
    setPreviews(prev=>({token,searches:prev.token===token?prev.searches:[],shortlists:result.items}));
   }
  }catch{
   if(epoch.current===version&&tokenRef.current===token)setError(dt(locale,"unknown"));
  }finally{if(epoch.current===version&&tokenRef.current===token)setLoading(false);}
 },[token,locale,active,refresh]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 const comparable=(item:ListingDTO)=>item.status==="published"&&item.available!==false;
 const effectiveSelection=selected.filter(id=>items.some(item=>item.id===id&&comparable(item)));
 async function remove(item:ListingDTO){
  if(!token||working)return;setWorking(true);setError("");
  try{await toggle(item.id);setLastRemoved(item);setSelected(prev=>prev.filter(id=>id!==item.id));await load();}
  catch{setError(savedText(locale,"removeFailed"));}finally{setWorking(false);}
 }
 async function undo(){
  if(!token||!lastRemoved||working)return;setWorking(true);
  try{await toggle(lastRemoved.id);setLastRemoved(null);await load();}
  catch{setError(savedText(locale,"removeFailed"));}finally{setWorking(false);}
 }
 const names=savedTabs(locale),tabs:Tab[]=["favorites","searches","shortlists"];
 return <Page>
  <ScreenHeading title={savedText(locale,"savedTitle")} subtitle={savedText(locale,"savedSubtitle")}/>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:7,flexWrap:"wrap"}}>
   {tabs.map((tab,index)=><FilterChip key={tab} selected={active===tab} label={names[index]}
    onPress={()=>{setActive(tab);setError("");setLastRemoved(null);}}/>)}
  </View>
  {!token?<SectionCard><Label>{savedText(locale,"signIn")}</Label>
   <Action label={uiText(locale,"signIn")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/></SectionCard>:null}
  {token&&loading?(active==="favorites"?<View style={{gap:12}}><LoadingCard withImage rows={2}/><LoadingCard withImage rows={2}/></View>:
   <LoadingCard rows={3}/>):null}
  {token&&error?<StateNotice message={error} retryLabel={savedText(locale,"reload")} onRetry={()=>void load()}/>:null}
  {token&&active==="favorites"&&!loading?<View style={{gap:12}}>
   {lastRemoved?<SectionCard><Label>{savedText(locale,"removed")}</Label>
    <Action kind="secondary" label={savedText(locale,"undo")} disabled={working} onPress={()=>void undo()}/></SectionCard>:null}
   {items.length===0?<SectionCard><Label muted>{savedText(locale,"emptyFavorites")}</Label></SectionCard>:null}
   {items.length>0?<SectionCard style={{backgroundColor:colors.primaryWash,borderColor:colors.borderStrong}}>
    <Label weight="bold">{savedText(locale,"select")} · {formatNumber(effectiveSelection.length,locale)}/4</Label>
    <Label muted style={{fontSize:12}}>{savedText(locale,"history")}</Label>
    <Action disabled={working||effectiveSelection.length<2||effectiveSelection.length>4}
     label={savedText(locale,"compare")+" ("+formatNumber(effectiveSelection.length,locale)+")"}
     onPress={()=>router.push({pathname:"/compare",params:{ids:effectiveSelection.join(",")}})}/>
   </SectionCard>:null}
   {items.map(item=><View key={item.id} style={{gap:6}}>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",justifyContent:"space-between",gap:8}}>
     <Pressable accessibilityRole="checkbox" accessibilityLabel={savedText(locale,"select")+" "+item.data.title}
      accessibilityState={{checked:effectiveSelection.includes(item.id),disabled:!comparable(item)||working}}
      disabled={!comparable(item)||working}
      onPress={()=>setSelected(previous=>previous.includes(item.id)?previous.filter(id=>id!==item.id):previous.length<4?[...previous,item.id]:previous)}
      style={{flex:1,minHeight:48,justifyContent:"center",padding:10,borderWidth:1,
       borderColor:effectiveSelection.includes(item.id)?colors.primary:colors.borderStrong,borderRadius:14,
       backgroundColor:effectiveSelection.includes(item.id)?colors.primarySoft:colors.surface}}>
      <Label style={{fontSize:13}}>{effectiveSelection.includes(item.id)?"☑":"☐"} {savedText(locale,"select")}</Label>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={savedText(locale,"remove")+" "+item.data.title}
      disabled={working} onPress={()=>void remove(item)} style={{minHeight:48,paddingHorizontal:14,
       justifyContent:"center",borderWidth:1,borderRadius:14,borderColor:colors.borderStrong,backgroundColor:colors.surface}}>
      <Label style={{fontSize:13,color:colors.error}}>{savedText(locale,"remove")}</Label>
     </Pressable>
    </View>
    {!comparable(item)?<StatusBadge tone="warning" label={savedText(locale,"unavailable")}/>:null}
    <ListingCard item={item}/>
   </View>)}
  </View>:null}
  {token&&active==="searches"&&!loading?<View style={{gap:10}}>
   {searches.length===0?<SectionCard><Label muted>{savedText(locale,"searchesEmpty")}</Label></SectionCard>:null}
   {searches.map(item=><SectionCard key={item.id} style={{borderStartWidth:4,borderStartColor:item.alertsEnabled?colors.success:colors.borderStrong}}>
    <Label weight="bold">{item.title}</Label>
    <Label muted style={{fontSize:13}}>{savedFilterSummary(item.filters,locale).slice(0,4).join(" · ")||savedText(locale,"unknown")}</Label>
    <StatusBadge tone={item.alertsEnabled?"success":"neutral"}
     label={savedText(locale,item.alertsEnabled?"alertOn":"alertOff")}/>
   </SectionCard>)}
   <Action label={savedText(locale,"newSearch")} onPress={()=>router.push("/saved-searches")}/>
   <Action kind="secondary" label={savedText(locale,"more")} onPress={()=>router.push("/saved-searches")}/>
  </View>:null}
  {token&&active==="shortlists"&&!loading?<View style={{gap:10}}>
   {shortlists.length===0?<SectionCard><Label muted>{savedText(locale,"listsEmpty")}</Label></SectionCard>:null}
   {shortlists.map(item=><SectionCard key={item.id} style={{borderStartWidth:4,borderStartColor:colors.secondary}}>
    <Label weight="bold">{item.title}</Label>
    <StatusBadge tone={item.membershipStatus==="pending"?"warning":"success"}
     label={savedText(locale,item.membershipStatus==="pending"?"pending":item.role==="owner"?"owner":"member")}/>
    <Action kind="secondary" label={savedText(locale,"manage")}
     onPress={()=>router.push(item.membershipStatus==="pending"?"/shortlists":{pathname:"/shortlists/[id]",params:{id:item.id}})}/>
   </SectionCard>)}
   <Action label={savedText(locale,"more")} onPress={()=>router.push("/shortlists")}/>
  </View>:null}
  <Action kind="secondary" label={t(locale,"browse")} onPress={()=>router.push("/(tabs)/search")}/>
 </Page>;
}
