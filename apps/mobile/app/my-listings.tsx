import {useCallback,useState} from "react";
import {useFocusEffect,router} from "expo-router";
import {View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth} from "../src/auth";
import {usePreferences} from "../src/context";
import {getMyListings,type InventoryItem} from "../src/listing-client";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../src/ui";
export default function MyListings(){
 const {token}=useAuth(),{locale}=usePreferences();
 const [items,setItems]=useState<InventoryItem[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useFocusEffect(useCallback(()=>{let active=true;setLoading(true);setError("");
  if(token)void getMyListings(token).then(result=>{if(active)setItems(result.items);}).catch(()=>{if(active)setError("Unable to load your listings / بارگیری نشد");}).finally(()=>{if(active)setLoading(false);});
  else{setLoading(false);}
  return()=>{active=false;};
 },[token]));
 return <Page><ScreenHeading title={locale==="en"?"My listings":"ملک‌های من"} subtitle={locale==="en"?"Manage drafts, approvals and availability.":"مدیریت پیش‌نویس‌ها، تأیید و موجودی ملک‌ها."}/>
 <Action label={locale==="en"?"+ Create property listing":"+ ثبت ملک جدید"} onPress={()=>router.push("/listings/new")}/>
 {loading?<SectionCard><Label muted>{locale==="en"?"Loading…":"در حال بارگیری…"}</Label></SectionCard>:null}
 {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
 {!loading && items.length===0?<SectionCard><Label muted>{locale==="en"?"No listings yet":"هنوز ملکی ثبت نکرده‌اید"}</Label></SectionCard>:null}
 {items.map(l=><SectionCard key={l.id}><Label weight="bold">{l.title||((locale==="en"?"Property":"ملک")+" #"+l.id.slice(0,8))}</Label>
 <Label muted>{l.status} · {new Date(l.updatedAt).toLocaleDateString(locale==="en"?"en-US":"fa-AF")}</Label>
 <Action kind="secondary" label={locale==="en"?"Safety cases & appeals":"بررسی ایمنی و اعتراض"} onPress={()=>router.push({pathname:"/safety",params:{listingId:l.id}})}/>
 <Action kind="secondary" label={locale==="en"?"Open / edit":"بازکردن / ویرایش"} onPress={()=>router.push({pathname:"/listings/[id]/edit",params:{id:l.id}})}/>
 </SectionCard>)}
 <Action kind="secondary" label={locale==="en"?"Return to account":"بازگشت به حساب"} onPress={()=>router.back()}/></Page>;
}
