import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator} from "react-native";
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
 const load=useCallback(async()=>{
  if(!token){setItems([]);setLoading(false);return;}
  setLoading(true);setError("");
  try{
   const result=await requestJson<{items:ListingDTO[]}>("/v1/favorites",{token});
   setItems(result.items);await refresh();
  }catch{setError(dt(locale,"unknown"));}
  finally{setLoading(false);}
 },[token,locale,refresh]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 return <Page><ScreenHeading title={t(locale,"saved")} subtitle={dt(locale,"savedHistory")}/>
  {!token?<SectionCard><Label>{dt(locale,"signin")}</Label>
   <Action label={locale==="en"?"Sign in":"ورود"} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:null}
  {loading?<SectionCard><ActivityIndicator color={colors.primary}/></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label><Action label={dt(locale,"retry")} onPress={()=>void load()}/></SectionCard>:null}
  {!loading&&!error&&items.length===0&&token?<SectionCard><Label>{dt(locale,"savedEmpty")}</Label></SectionCard>:null}
  {items.map(item=><ListingCard key={item.id} item={item}/>)}
  <Action kind="secondary" label={t(locale,"browse")} onPress={()=>router.replace("/(tabs)/search")}/>
 </Page>;
}
