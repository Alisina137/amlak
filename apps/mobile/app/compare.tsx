import {router,useLocalSearchParams} from "expo-router";
import {useEffect,useState} from "react";
import {ActivityIndicator,ScrollView,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {usePreferences} from "../src/context";
import {requestJson} from "../src/auth";
import type {ListingDTO} from "../src/listing-client";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../src/ui";
type Result={items:ListingDTO[];currenciesDiffer:boolean;notice:string};
const copy={
 en:{title:"Compare properties",sub:"Up to four properties. Original asking prices only.",status:"Status",
  type:"Type",location:"Location",area:"Area (m²)",rooms:"Bedrooms",price:"Asking terms",
  warning:"Different currencies cannot be compared directly; no exchange rate is assumed.",
  retry:"Try again",empty:"Choose 2–4 properties in Saved to compare.",back:"Back to Saved"},
 fa:{title:"مقایسه ملک‌ها",sub:"حداکثر چهار ملک، فقط قیمت پیشنهادی.",status:"وضعیت",
  type:"نوع ملک",location:"موقعیت",area:"مساحت (متر مربع)",rooms:"اتاق خواب",price:"شرایط قیمت",
  warning:"ارزها متفاوت است؛ هیچ نرخ تبدیل فرض نمی‌شود.",retry:"تلاش دوباره",
  empty:"برای مقایسه ۲ تا ۴ ملک را در بخش ذخیره‌ها انتخاب کنید.",back:"بازگشت به ذخیره‌ها"},
 ps:{title:"د ملکیتونو پرتله",sub:"تر څلورو ملکیتونو، یوازې غوښتل شوې بیې.",status:"حالت",
  type:"ډول",location:"ځای",area:"مساحت (متر مربع)",rooms:"د خوب خونې",price:"بیه",
  warning:"اسعار توپیر لري؛ هېڅ د تبادلې نرخ نه دی اټکل شوی.",retry:"بیا هڅه",
  empty:"د پرتله کولو لپاره له ۲ تر ۴ ملکیتونو وټاکئ.",back:"خوندي شوو ته ستنېدل"}
};
function priceText(data:ListingDTO["data"]){
 const raw=data.price as unknown as Record<string,unknown>;
 const fields=data.transactionType==="sale"?["askingPrice"]:data.transactionType==="rent"?
  ["monthlyRent","advance"]:["refundablePrincipal","monthlyRent"];
 return fields.filter(k=>raw[k]!==undefined&&raw[k]!==null).map(k=>k+": "+String(raw[k])).join(" · ")+" "+data.price.currency;
}
export default function Compare(){
 const {ids}=useLocalSearchParams<{ids:string}>(),{locale}=usePreferences(),t=copy[locale];
 const [result,setResult]=useState<Result|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const load=async()=>{
  const unique=Array.from(new Set((ids||"").split(",").filter(Boolean)));
  if(unique.length<2||unique.length>4){setError(t.empty);setLoading(false);return;}
  setLoading(true);setError("");
  try{setResult(await requestJson<Result>("/v1/properties/compare",{method:"POST",body:{ids:unique}}));}
  catch{setError(locale==="en"?"Unable to compare these properties.":locale==="fa"?"مقایسه ملک‌ها ممکن نشد.":"پرتله ممکنه نه شوه.");}
  finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[ids,locale]);
 return <Page><ScreenHeading title={t.title} subtitle={t.sub}/>
  {loading?<ActivityIndicator color={colors.primary}/>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label>
   <Action kind="secondary" label={t.retry} onPress={()=>void load()}/></SectionCard>:null}
  {result?.currenciesDiffer?<SectionCard><Label style={{color:colors.warning}}>{t.warning}</Label></SectionCard>:null}
  {result?.items.map(item=><SectionCard key={item.id}>
   <Label weight="bold">{item.data.title}</Label>
   {([
    [t.status,item.status],[t.type,item.data.propertyType],
    [t.location,[item.data.location.city,item.data.location.district].filter(Boolean).join(" · ")],
    [t.area,String(item.data.attributes.areaM2??"—")],
    [t.rooms,String(item.data.attributes.bedrooms??"—")],
    [t.price,priceText(item.data)]
   ] as [string,string][]).map(([label,value])=><View key={label}
    style={{flexDirection:locale==="en"?"row":"row-reverse",justifyContent:"space-between",gap:12}}>
     <View style={{width:"35%"}}><Label muted>{label}</Label></View>
     <View style={{flex:1}}><Label>{value||"—"}</Label></View>
    </View>)}
   <Action kind="secondary" label={locale==="en"?"Property details":"جزئیات ملک"}
    onPress={()=>router.push({pathname:"/property/[id]",params:{id:item.id}})}/>
  </SectionCard>)}
  {result?<Label muted>{result.notice}</Label>:null}
  <Action kind="secondary" label={t.back} onPress={()=>router.back()}/>
 </Page>;
}
