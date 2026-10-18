import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {t} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {useFavorites} from "../../src/favorites";
import {dt} from "../../src/discovery-copy";
import {ListingCard} from "../../src/listing-ui";
import type {ListingDTO} from "../../src/listing-client";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function Saved(){
 const {locale}=usePreferences(),{token}=useAuth(),{refresh}=useFavorites();
 const [items,setItems]=useState<ListingDTO[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [selected,setSelected]=useState<string[]>([]);
 const load=useCallback(async()=>{
  if(!token){setItems([]);setLoading(false);return;}
  setLoading(true);setError("");
  try{
   const result=await requestJson<{items:ListingDTO[]}>("/v1/favorites",{token});
   setItems(result.items);setSelected(previous=>previous.filter(id=>result.items.some(item=>item.id===id)));await refresh();
  }catch{setError(dt(locale,"unknown"));}
  finally{setLoading(false);}
 },[token,locale,refresh]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 const compareLabel=locale==="en"?"Compare selected":locale==="fa"?"مقایسه موارد انتخاب‌شده":"ټاکل شوي پرتله کړئ";
 const selectLabel=locale==="en"?"Select to compare":locale==="fa"?"انتخاب برای مقایسه":"د پرتله لپاره وټاکئ";
 return <Page><ScreenHeading title={t(locale,"saved")} subtitle={dt(locale,"savedHistory")}/>
  <Action kind="secondary" label={locale==="en"?"Saved searches & alerts":locale==="fa"?"جستجوهای ذخیره‌شده و اعلان‌ها":"خوندي پلټنې او خبرتیاوې"} onPress={()=>router.push("/saved-searches")}/>
  {!token?<SectionCard><Label>{dt(locale,"signin")}</Label>
   <Action label={locale==="en"?"Sign in":"ورود"} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:null}
  {loading?<SectionCard><ActivityIndicator color={colors.primary}/></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label><Action label={dt(locale,"retry")} onPress={()=>void load()}/></SectionCard>:null}
  {!loading&&!error&&items.length===0&&token?<SectionCard><Label>{dt(locale,"savedEmpty")}</Label></SectionCard>:null}
  {items.length>0?<SectionCard><Label weight="bold">{selectLabel} · {selected.length}/4</Label>
   <Action disabled={selected.length<2||selected.length>4} label={compareLabel+" ("+selected.length+")"}
    onPress={()=>router.push({pathname:"/compare",params:{ids:selected.join(",")}})}/></SectionCard>:null}
  {items.map(item=><View key={item.id} style={{gap:6}}>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:selected.includes(item.id)}}
    onPress={()=>setSelected(previous=>previous.includes(item.id)?previous.filter(id=>id!==item.id):previous.length<4?[...previous,item.id]:previous)}
    style={{padding:12,borderWidth:1,borderColor:selected.includes(item.id)?colors.primary:colors.border,borderRadius:12}}>
    <Label weight="medium">{selected.includes(item.id)?"☑":"☐"} {selectLabel}</Label>
   </Pressable>
   <ListingCard item={item}/>
  </View>)}
  <Action kind="secondary" label={t(locale,"browse")} onPress={()=>router.replace("/(tabs)/search")}/>
 </Page>;
}
