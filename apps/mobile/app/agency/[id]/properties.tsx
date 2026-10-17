import {router,useLocalSearchParams,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {useAuth} from "../../../src/auth";
import {usePreferences} from "../../../src/context";
import {getMyListings,type InventoryItem} from "../../../src/listing-client";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../../src/ui";
export default function AgencyProperties(){
 const {id}=useLocalSearchParams<{id:string}>(),{token}=useAuth(),{locale}=usePreferences();
 const [items,setItems]=useState<InventoryItem[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useFocusEffect(useCallback(()=>{let valid=true;if(!token){setError("Login required");return()=>{};}
  setLoading(true);void getMyListings(token,id).then(v=>{if(valid)setItems(v.items);}).catch(()=>{if(valid)setError("Access denied / دسترسی ندارید");}).finally(()=>{if(valid)setLoading(false);});
  return()=>{valid=false;};},[token,id]));
 return <Page><ScreenHeading title={locale==="en"?"Agency properties":"ملک‌های دفتر"}/>
 <Action label={locale==="en"?"+ Create":"+ ثبت ملک"} onPress={()=>router.push({pathname:"/listings/new",params:{agencyId:id}})}/>
 {error?<Label>{error}</Label>:null}
 {loading?<Label muted>{locale==="en"?"Loading…":"در حال بارگیری…"}</Label>:null}
 {!loading&&items.length===0?<SectionCard><Label muted>{locale==="en"?"No properties assigned yet.":"هنوز ملکی ثبت نشده است."}</Label></SectionCard>:null}
 {items.map(l=><SectionCard key={l.id}><Label>{l.id.slice(0,8)} · {l.status}</Label>
  <Action kind="secondary" label={locale==="en"?"Open":"بازکردن"} onPress={()=>router.push({pathname:"/listings/[id]/edit",params:{id:l.id}})}/>
 </SectionCard>)}
 </Page>;
}
