import {useCallback,useRef,useState} from "react";
import {useFocusEffect,router} from "expo-router";
import {View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth} from "../src/auth";
import {usePreferences} from "../src/context";
import {getMyListings,type InventoryItem} from "../src/listing-client";
import {Action,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge,BackButton} from "../src/ui";
import {localeDate} from "../src/foundation-copy";
import {lt} from "../src/listing-ui";
export default function MyListings(){
 const {token}=useAuth(),{locale}=usePreferences();
 const [snapshot,setSnapshot]=useState<{token:string|null;items:InventoryItem[]}>({token:null,items:[]});
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const tokenRef=useRef(token),epoch=useRef(0);
 tokenRef.current=token;
 const items=snapshot.token===token?snapshot.items:[];
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setSnapshot({token:null,items:[]});setLoading(false);setError("");return;}
  setLoading(true);setError("");
  try{
   const result=await getMyListings(token);
   if(version===epoch.current&&tokenRef.current===token)setSnapshot({token,items:result.items});
  }catch{
   if(version===epoch.current&&tokenRef.current===token)setError(locale==="en"?"Unable to load your listings.":locale==="fa"?"بارگیری ملکیت‌ها ممکن نشد.":"ملکیتونه پورته نه شول.");
  }finally{if(version===epoch.current&&tokenRef.current===token)setLoading(false);}
 },[token,locale]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 const status=(value:string)=>{
  const supported=["published","paused","pending_review","rejected","draft","sold","rented"] as const;
  return supported.some(key=>key===value)?lt(locale,value as typeof supported[number]):value;
 };
 return <Page><BackButton onPress={()=>router.back()}/><ScreenHeading title={locale==="en"?"My listings":"ملک‌های من"} subtitle={locale==="en"?"Manage drafts, approvals and availability.":"مدیریت پیش‌نویس‌ها، تأیید و موجودی ملک‌ها."}/>
 <Action label={locale==="en"?"+ Create property listing":"+ ثبت ملک جدید"} onPress={()=>router.push("/listings/new")}/>
 {token&&loading&&items.length===0?<LoadingCard rows={3}/>:null}
 {error?<StateNotice message={error} retryLabel={locale==="en"?"Retry":locale==="fa"?"تلاش دوباره":"بیا هڅه"} onRetry={()=>void load()}/>:null}
 {!loading && items.length===0?<SectionCard><Label muted>{locale==="en"?"No listings yet":"هنوز ملکی ثبت نکرده‌اید"}</Label></SectionCard>:null}
 {items.map(l=><SectionCard key={l.id}><Label weight="bold">{l.title||((locale==="en"?"Property":"ملک")+" #"+l.id.slice(0,8))}</Label>
 <StatusBadge label={status(l.status)} tone={l.status==="published"?"success":l.status==="rejected"?"error":"warning"}/>
 <Label muted>{localeDate(l.updatedAt,locale)}</Label>
 <Action kind="secondary" label={locale==="en"?"Safety cases & appeals":"بررسی ایمنی و اعتراض"} onPress={()=>router.push({pathname:"/safety",params:{listingId:l.id}})}/>
 <Action kind="secondary" label={locale==="en"?"Open / edit":"بازکردن / ویرایش"} onPress={()=>router.push({pathname:"/listings/[id]/edit",params:{id:l.id}})}/>
 </SectionCard>)}
 <Action kind="secondary" label={locale==="en"?"Return to account":"بازگشت به حساب"} onPress={()=>router.back()}/></Page>;
}
