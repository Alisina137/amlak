import {router,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {t} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {useFavorites} from "../../src/favorites";
import {dt} from "../../src/discovery-copy";
import {ListingCard} from "../../src/listing-ui";
import type {ListingDTO} from "../../src/listing-client";
import {Action,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice} from "../../src/ui";
import {uiText} from "../../src/ui-copy";
export default function Saved(){
 const {locale}=usePreferences(),{token}=useAuth(),{refresh}=useFavorites();
 const [snapshot,setSnapshot]=useState<{token:string|null;items:ListingDTO[]}>({token:null,items:[]});
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const [selected,setSelected]=useState<string[]>([]);
 const tokenRef=useRef(token),epoch=useRef(0);
 tokenRef.current=token;
 const items=snapshot.token===token?snapshot.items:[];
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setSnapshot({token:null,items:[]});setSelected([]);setLoading(false);setError("");return;}
  setLoading(true);setError("");
  try{
   const result=await requestJson<{items:ListingDTO[]}>("/v1/favorites",{token});
   if(epoch.current!==version||tokenRef.current!==token)return;
   setSnapshot({token,items:result.items});
   setSelected(previous=>previous.filter(id=>result.items.some(item=>item.id===id)));
   void refresh().catch(()=>{});
  }catch{
   if(epoch.current===version&&tokenRef.current===token)setError(dt(locale,"unknown"));
  }finally{if(epoch.current===version&&tokenRef.current===token)setLoading(false);}
 },[token,locale,refresh]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 const compareLabel=locale==="en"?"Compare selected":locale==="fa"?"مقایسه موارد انتخاب‌شده":"ټاکل شوي پرتله کړئ";
 const selectLabel=locale==="en"?"Select to compare":locale==="fa"?"انتخاب برای مقایسه":"د پرتله لپاره وټاکئ";
 const effectiveSelection=selected.filter(id=>items.some(item=>item.id===id));
 return <Page><ScreenHeading title={t(locale,"saved")} subtitle={dt(locale,"savedHistory")}/>
  <Action kind="secondary" label={locale==="en"?"Shared property shortlists":locale==="fa"?"فهرست‌های مشترک ملک":"د ملکیتونو ګډ فهرستونه"} onPress={()=>router.push("/shortlists")}/>
  <Action kind="secondary" label={locale==="en"?"Saved searches & alerts":locale==="fa"?"جستجوهای ذخیره‌شده و اعلان‌ها":"خوندي پلټنې او خبرتیاوې"} onPress={()=>router.push("/saved-searches")}/>
  {!token?<SectionCard><Label>{dt(locale,"signin")}</Label>
   <Action label={uiText(locale,"signIn")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:null}
  {token&&loading&&items.length===0?<View style={{gap:12}}><LoadingCard withImage rows={2}/><LoadingCard withImage rows={2}/></View>:null}
  {token&&error?<StateNotice message={error} retryLabel={dt(locale,"retry")} onRetry={()=>void load()}/>:null}
  {!loading&&!error&&items.length===0&&token?<SectionCard><Label>{dt(locale,"savedEmpty")}</Label></SectionCard>:null}
  {items.length>0?<SectionCard><Label weight="bold">{selectLabel} · {effectiveSelection.length}/4</Label>
   <Action disabled={effectiveSelection.length<2||effectiveSelection.length>4} label={compareLabel+" ("+effectiveSelection.length+")"}
    onPress={()=>router.push({pathname:"/compare",params:{ids:effectiveSelection.join(",")}})}/></SectionCard>:null}
  {items.map(item=><View key={item.id} style={{gap:6}}>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:effectiveSelection.includes(item.id)}}
    onPress={()=>setSelected(previous=>previous.includes(item.id)?previous.filter(id=>id!==item.id):previous.length<4?[...previous,item.id]:previous)}
    style={{padding:12,borderWidth:1,borderColor:effectiveSelection.includes(item.id)?colors.primary:colors.border,borderRadius:12,
     backgroundColor:effectiveSelection.includes(item.id)?"#E1F0E9":colors.surface}}>
    <Label weight="medium">{effectiveSelection.includes(item.id)?"☑":"☐"} {selectLabel}</Label>
   </Pressable>
   <ListingCard item={item}/>
  </View>)}
  <Action kind="secondary" label={t(locale,"browse")} onPress={()=>router.push("/(tabs)/search")}/>
 </Page>;
}
