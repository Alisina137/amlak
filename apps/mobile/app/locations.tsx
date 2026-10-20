import AsyncStorage from "@react-native-async-storage/async-storage";
import {findProvince,searchProvinces} from "@amlaklink/catalog";
import {colors} from "@amlaklink/design-tokens";
import {isRTL,t} from "@amlaklink/localization";
import {router} from "expo-router";
import {useEffect,useMemo,useState} from "react";
import {Pressable,View} from "react-native";
import {usePreferences} from "../src/context";
import {useSearchFilters} from "../src/search-context";
import {sx} from "../src/search-extras-copy";
import {AppInput,BackButton,DirectionalRow,Label,Page,ScreenHeading,SectionCard,StatusBadge} from "../src/ui";
const RECENTS_KEY="amlak:recent-provinces:v1";
const LIMIT=5;
export default function Locations(){
 const {locale,provinceId,setProvinceId}=usePreferences();
 const {setFilters}=useSearchFilters();
 const [query,setQuery]=useState(""),[recents,setRecents]=useState<string[]>([]);
 const rtl=isRTL(locale);
 const results=useMemo(()=>searchProvinces(query,locale),[query,locale]);
 useEffect(()=>{let active=true;
  void AsyncStorage.getItem(RECENTS_KEY).then(value=>{
   if(!active||!value)return;
   const parsed:unknown=JSON.parse(value);
   if(Array.isArray(parsed))setRecents([...new Set(parsed.filter((x):x is string=>typeof x==="string"&&!!findProvince(x)))].slice(0,LIMIT));
  }).catch(()=>{});
  return()=>{active=false;};
 },[]);
 function select(id:string){
  if(!findProvince(id))return;
  setProvinceId(id);
  // One shared location choice: clear city, district and previous map boundaries together.
  setFilters({provinceId:id,city:undefined,district:undefined,neighborhood:undefined,viewport:undefined,polygon:undefined});
  const updated=[id,...recents.filter(previous=>previous!==id)].slice(0,LIMIT);
  setRecents(updated);
  void AsyncStorage.setItem(RECENTS_KEY,JSON.stringify(updated)).catch(()=>{});
  router.back();
 }
 const choices=(ids:string[])=>ids.map(id=>{
  const p=findProvince(id);
  if(!p)return null;
  const selected=p.id===provinceId;
  return <Pressable key={id} accessibilityRole="button" accessibilityLabel={p.names[locale]}
   accessibilityState={{selected}} onPress={()=>select(p.id)}
   style={{paddingHorizontal:14,paddingVertical:12,minHeight:52,borderRadius:14,
    backgroundColor:selected?"#E1F0E9":colors.surface,borderWidth:1,
    borderColor:selected?colors.primary:colors.border,flexDirection:rtl?"row-reverse":"row",
    justifyContent:"space-between",alignItems:"center",gap:8}}>
   <Label weight={selected?"bold":"regular"} style={{flex:1}}>{p.names[locale]}</Label>
   {selected?<StatusBadge label="✓" tone="success"/>:null}
  </Pressable>;
 });
 return <Page>
  <DirectionalRow style={{gap:12}}>
   <BackButton onPress={()=>router.back()}/>
   <View style={{flex:1}}><ScreenHeading title={t(locale,"chooseProvince")}/></View>
  </DirectionalRow>
  <Label muted>{sx(locale,"locationHint")}</Label>
  <AppInput accessibilityLabel={t(locale,"searchProvince")} value={query} onChangeText={setQuery}
   placeholder={t(locale,"searchProvince")} autoCorrect={false} style={{height:52}}/>
  {!query.trim()&&recents.length>0?<SectionCard>
   <Label weight="bold">{locale==="en"?"Recently selected":locale==="fa"?"ولایت‌های اخیر":"وروستي ټاکل شوي ولایتونه"}</Label>
   {choices(recents)}
  </SectionCard>:null}
  <View style={{gap:9}}>
   <DirectionalRow style={{justifyContent:"space-between"}}>
    <Label weight="bold">{locale==="en"?"All provinces":locale==="fa"?"همه ولایت‌ها":"ټول ولایتونه"}</Label>
    <Label muted style={{fontSize:12}}>{results.length}</Label>
   </DirectionalRow>
   {results.length?choices(results.map(p=>p.id)):<SectionCard><Label muted>{t(locale,"noResults")}</Label></SectionCard>}
  </View>
 </Page>;
}
