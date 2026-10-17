import {useEffect,useState} from "react";
import {router,useLocalSearchParams} from "expo-router";
import {Image,ScrollView,View,ActivityIndicator} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {findProvince} from "@amlaklink/catalog";
import {usePreferences} from "../../src/context";
import {getPublic,photoSource,type ListingDTO} from "../../src/listing-client";
import {lt,priceSummary} from "../../src/listing-ui";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function PropertyDetails(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences();
 const [data,setData]=useState<ListingDTO|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let live=true;setLoading(true);
  void getPublic(id).then(v=>{if(live)setData(v);}).catch(()=>{if(live)setError(locale==="en"?"This property is unavailable.":"این ملک قابل نمایش نیست.");})
   .finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[id,locale]);
 if(loading)return <Page><ActivityIndicator color={colors.primary}/></Page>;
 if(!data)return <Page><SectionCard><Label>{error}</Label></SectionCard><Action kind="secondary" label="←" onPress={()=>router.back()}/></Page>;
 const d=data.data,p=d.price,a=d.attributes;
 const cash=(amount:number|undefined)=>amount===undefined?"—":new Intl.NumberFormat(locale==="en"?"en-US":"fa-AF").format(amount)+" "+p.currency;
 return <Page>
  <Action kind="secondary" label={locale==="en"?"← Back":"بازگشت ←"} onPress={()=>router.back()}/>
  <View style={{gap:8}}>
   <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {data.photos.length?data.photos.map(photo=><Image key={photo.id} source={photoSource(photo.id)} resizeMode="cover" style={{width:285,height:235,marginEnd:12,borderRadius:18,backgroundColor:colors.border}}/>):
     <SectionCard><Label>⌂</Label></SectionCard>}
   </ScrollView>
  </View>
  <ScreenHeading title={d.title} subtitle={lt(locale,d.transactionType)+" · "+lt(locale,d.propertyType)}/>
  {data.available?<Label style={{color:colors.success}}>{lt(locale,"available")}</Label>:
   <Label style={{color:colors.warning}}>{lt(locale,"notAvailable")} · {data.status}</Label>}
  <SectionCard>
   <Label weight="bold" style={{fontSize:24,color:colors.primary}}>{priceSummary(d,locale)}</Label>
   {d.transactionType==="rent"?<><Label>{lt(locale,"deposit")}: {cash(p.refundableDeposit)}</Label><Label>{lt(locale,"monthly")}: {cash(p.monthlyRent)}</Label></>:null}
   {d.transactionType==="gharawi"?<>
    <Label>{lt(locale,"principal")}: {cash(p.refundablePrincipal)}</Label>
    <Label>{lt(locale,"monthly")}: {cash(p.monthlyRent)}</Label>
    <Label>{p.durationMonths} {locale==="en"?"months":"ماه"}</Label>
    <Label>{p.refundTerms}</Label>
   </>:null}
  </SectionCard>
  <SectionCard>
   <Label weight="bold">{locale==="en"?"Location":"موقعیت"}</Label>
   <Label>{findProvince(d.location.provinceId)?.names[locale]} · {d.location.city} · {d.location.district} · {d.location.neighborhood}</Label>
   <Label muted>{d.location.precision==="approximate"?(locale==="en"?"Approximate location for privacy":"موقعیت تقریبی برای حفظ حریم خصوصی"):""}</Label>
  </SectionCard>
  <SectionCard>
   <Label weight="bold">{locale==="en"?"Property details":"مشخصات ملک"}</Label>
   <Label>{a.areaM2} m² {a.bedrooms!==undefined?" · "+a.bedrooms+" 🛏":""}{a.bathrooms!==undefined?" · "+a.bathrooms+" 🚿":""}</Label>
   <Label>{d.description}</Label>
  </SectionCard>
  <SectionCard><Label muted>{locale==="en"?"Advertiser contact options and inquiries launch in Phase 4–5.":"تماس مستقیم و پیام‌ها در مراحل ۴ و ۵ فعال می‌شوند."}</Label></SectionCard>
 </Page>;
}
