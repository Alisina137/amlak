import {useCallback,useMemo,useRef,useState} from "react";
import {useFocusEffect,router} from "expo-router";
import {View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {useAuth} from "../src/auth";
import {usePreferences} from "../src/context";
import {getMyListings,type InventoryItem} from "../src/listing-client";
import {Action,AppInput,FilterChip,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge,BackButton} from "../src/ui";
import {localeDate} from "../src/foundation-copy";
import {ox,listingStatus} from "../src/owner-experience";
type Tab="all"|"draft"|"pending_review"|"published"|"paused"|"closed";
export default function MyListings(){
 const {token,user}=useAuth(),{locale}=usePreferences(),rtl=isRTL(locale);
 const [snapshot,setSnapshot]=useState<{token:string|null;items:InventoryItem[]}>({token:null,items:[]});
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const [tab,setTab]=useState<Tab>("all"),[query,setQuery]=useState("");
 const tokenRef=useRef(token),epoch=useRef(0);tokenRef.current=token;
 const items=snapshot.token===token?snapshot.items:[];
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setSnapshot({token:null,items:[]});setLoading(false);setError("");return;}
  setLoading(true);setError("");
  try{
   const result=await getMyListings(token);
   if(version===epoch.current&&tokenRef.current===token)setSnapshot({token,items:result.items});
  }catch{if(version===epoch.current&&tokenRef.current===token)setError(ox(locale,"unavailable"));}
  finally{if(version===epoch.current&&tokenRef.current===token)setLoading(false);}
 },[token,locale]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 const filtered=useMemo(()=>items.filter(item=>{
  const match=tab==="all"||tab==="closed"?tab==="all"||["sold","rented","archived"].includes(item.status):tab==="draft"?
   ["draft","rejected"].includes(item.status):tab==="pending_review"?item.status==="pending_review":item.status===tab;
  const text=(item.title||"")+" "+item.id.slice(0,8);
  return match&&text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
 }),[items,tab,query]);
 const count=(group:Tab)=>items.filter(item=>group==="all"||group==="closed"&&["sold","rented","archived"].includes(item.status)||
  group==="draft"&&["draft","rejected"].includes(item.status)||item.status===group).length;
 const groups:Tab[]=["all","draft","pending_review","published","paused","closed"];
 const groupLabel=(group:Tab)=>group==="closed"?ox(locale,"archived"):ox(locale,group);
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={ox(locale,"myListings")} subtitle={ox(locale,"myListingsSub")}/>
  {user?.verified?<Action label={ox(locale,"create")} onPress={()=>router.push("/listings/new")}/>:null}
  {!token||!user?.verified?<SectionCard>
   <Label>{ox(locale,"createLocked")}</Label>
   <Action label={ox(locale,"logIn")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:<>
   <AppInput accessibilityLabel={ox(locale,"search")} placeholder={ox(locale,"search")} value={query} onChangeText={setQuery}/>
   <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:8}}>
    {groups.map(group=><FilterChip key={group} selected={tab===group}
     label={groupLabel(group)+" ("+formatNumber(count(group),locale)+")"} onPress={()=>setTab(group)}/>)}
   </View>
   {loading?<><LoadingCard rows={3}/><LoadingCard rows={3}/></>:null}
   {error?<StateNotice message={error} retryLabel={ox(locale,"retry")} onRetry={()=>void load()}/>:null}
   {!loading?<Label muted style={{fontSize:12}}>{formatNumber(filtered.length,locale)} / {formatNumber(items.length,locale)}</Label>:null}
   {!loading&&filtered.length===0?<SectionCard>
    <Label muted>{ox(locale,"empty")}</Label>
    <Action kind="secondary" label={ox(locale,"create")} onPress={()=>router.push("/listings/new")}/>
   </SectionCard>:null}
   {!loading&&filtered.map(item=><SectionCard key={item.id}>
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:12,alignItems:"center"}}>
     <View style={{width:52,height:52,borderRadius:12,justifyContent:"center",alignItems:"center",backgroundColor:"#E1F0E9"}}>
      <Label style={{fontSize:25,color:colors.primary}}>⌂</Label>
     </View>
     <View style={{flex:1,gap:5}}>
      <Label weight="bold" style={{fontSize:16,lineHeight:23}}>{item.title||ox(locale,"property")+" #"+item.id.slice(0,8)}</Label>
      <StatusBadge label={listingStatus(locale,item.status)}
       tone={item.status==="published"?"success":item.status==="rejected"?"error":"warning"}/>
     </View>
    </View>
    <Label muted style={{fontSize:12}}>{ox(locale,"lastUpdated")}: {localeDate(item.updatedAt,locale)}</Label>
    {item.status==="draft"||item.status==="rejected"?<Label muted style={{fontSize:12}}>{ox(locale,"draftAlert")}</Label>:null}
    <View style={{gap:8}}>
     <Action label={ox(locale,"edit")} onPress={()=>router.push({pathname:"/listings/[id]/edit",params:{id:item.id}})}/>
     {item.status==="published"?<Action kind="secondary" label={ox(locale,"viewPublic")}
      onPress={()=>router.push({pathname:"/property/[id]",params:{id:item.id}})}/>:null}
     <Action kind="secondary" label={ox(locale,"safetyCases")}
      onPress={()=>router.push({pathname:"/safety",params:{listingId:item.id}})}/>
    </View>
   </SectionCard>)}
  </>}
  <Action kind="secondary" label={ox(locale,"refresh")} onPress={()=>void load()} disabled={loading}/>
 </Page>;
}
