import {router,useLocalSearchParams} from "expo-router";
import {useEffect,useMemo,useState} from "react";
import {ScrollView,Switch,View} from "react-native";
import {findProvince} from "@amlaklink/catalog";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {usePreferences} from "../src/context";
import {requestJson} from "../src/auth";
import type {ListingDTO} from "../src/listing-client";
import {lt,priceSummary} from "../src/listing-ui";
import {savedText} from "../src/saved-copy";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../src/ui";

type Result={items:ListingDTO[];currenciesDiffer:boolean;notice:string};
const copy={
 en:{title:"Compare properties",sub:"Compare two to four properties side by side.",warning:"Prices in different currencies are not converted.",empty:"Select 2–4 available properties from your favorites.",failed:"Unable to compare these properties.",back:"Back to Saved"},
 fa:{title:"مقایسهٔ ملک‌ها",sub:"دو تا چهار ملک را کنار هم مقایسه کنید.",warning:"قیمت‌ها با واحد پول مختلف تبدیل نمی‌شوند.",empty:"۲ تا ۴ ملک موجود را از علاقه‌مندی‌ها انتخاب کنید.",failed:"مقایسهٔ ملک‌ها ممکن نشد.",back:"بازگشت به ذخیره‌شده‌ها"},
 ps:{title:"د ملکیتونو پرتله",sub:"دوه تر څلورو ملکیتونه څنګ تر څنګ پرتله کړئ.",warning:"د بېلو اسعارو بیې نه بدلېږي.",empty:"له خوښو ۲–۴ موجود ملکیتونه وټاکئ.",failed:"پرتله ممکنه نه شوه.",back:"خوندي شوو ته ستنېدل"}
} as const;
type Row={key:string;label:string;values:string[];difference:boolean};
const COLUMN=198,LABEL=118;
export default function Compare(){
 const {ids}=useLocalSearchParams<{ids:string}>(),{locale}=usePreferences(),t=copy[locale],rtl=isRTL(locale);
 const [result,setResult]=useState<Result|null>(null),[loading,setLoading]=useState(true),
  [error,setError]=useState(""),[retry,setRetry]=useState(0),[onlyDifferences,setOnlyDifferences]=useState(false);
 const selected=useMemo(()=>Array.from(new Set((ids||"").split(",").filter(Boolean))),[ids]);
 useEffect(()=>{let live=true;setLoading(true);setError("");setResult(null);
  if(selected.length<2||selected.length>4){setError(t.empty);setLoading(false);return()=>{live=false;};}
  void requestJson<Result>("/v1/properties/compare",{method:"POST",body:{ids:selected}}).then(data=>{
   if(live)setResult(data);
  }).catch(()=>{if(live)setError(t.failed);}).finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[ids,locale,retry]);
 const rows=useMemo<Row[]>(()=>{
  if(!result)return [];
  const list=result.items;
  const text=(value:unknown):string=>value===undefined||value===null||value===""?savedText(locale,"missing"):String(value);
  const number=(value:number|undefined)=>value===undefined?savedText(locale,"missing"):formatNumber(value,locale);
  const yn=(value:boolean|undefined)=>value===undefined?savedText(locale,"missing"):savedText(locale,value?"yes":"no");
  const money=(value:number|undefined,currency:string)=>value===undefined?savedText(locale,"missing"):formatNumber(value,locale)+" "+currency;
  const row=(key:string,label:string,fn:(item:ListingDTO)=>string):Row=>{
   const values=list.map(fn);return {key,label,values,difference:new Set(values).size>1};
  };
  return [
   row("price",savedText(locale,"price"),x=>priceSummary(x.data,locale)),
   row("currency",savedText(locale,"currency"),x=>x.data.price.currency),
   row("transaction",savedText(locale,"transaction"),x=>lt(locale,x.data.transactionType)),
   row("type",savedText(locale,"type"),x=>lt(locale,x.data.propertyType)),
   row("status",savedText(locale,"status"),x=>text(x.status)),
   row("location",savedText(locale,"location"),x=>[findProvince(x.data.location.provinceId)?.names[locale],
    x.data.location.city,x.data.location.district,x.data.location.neighborhood].filter(Boolean).join(" · ")||savedText(locale,"unknown")),
   row("area",savedText(locale,"area")+" (m²)",x=>number(x.data.attributes.areaM2)),
   row("bedrooms",savedText(locale,"bedrooms"),x=>number(x.data.attributes.bedrooms)),
   row("bathrooms",savedText(locale,"bathrooms"),x=>number(x.data.attributes.bathrooms)),
   row("furnished",savedText(locale,"furnished"),x=>yn(x.data.attributes.furnished)),
   row("parking",savedText(locale,"parking"),x=>yn(x.data.attributes.parking)),
   row("water",savedText(locale,"water"),x=>yn(x.data.attributes.water)),
   row("electricity",savedText(locale,"electricity"),x=>yn(x.data.attributes.electricity)),
   row("deposit",savedText(locale,"deposit"),x=>x.data.transactionType==="rent"?
    money(x.data.price.refundableDeposit,x.data.price.currency):savedText(locale,"missing")),
   row("principal",savedText(locale,"principal"),x=>x.data.transactionType==="gharawi"?
    money(x.data.price.refundablePrincipal,x.data.price.currency):savedText(locale,"missing")),
   row("monthly",savedText(locale,"monthly"),x=>x.data.transactionType!=="sale"?
    money(x.data.price.monthlyRent,x.data.price.currency):savedText(locale,"missing"))
  ];
 },[result,locale]);
 const visible=rows.filter(row=>!onlyDifferences||row.difference);
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={t.title} subtitle={t.sub}/>
  <Label muted style={{fontSize:13}}>{savedText(locale,"compareHint")}</Label>
  {loading?<LoadingCard rows={4}/>:null}
  {error?<StateNotice message={error} retryLabel={savedText(locale,"reload")} onRetry={()=>setRetry(v=>v+1)}/>:null}
  {result?<View style={{gap:12}}>
   {result.currenciesDiffer?<StateNotice tone="warning" message={t.warning}/>:null}
   <SectionCard>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:12}}>
     <Switch accessibilityLabel={savedText(locale,"differences")} value={onlyDifferences} onValueChange={setOnlyDifferences}/>
     <Label weight="medium" style={{flex:1,fontSize:13}}>{savedText(locale,onlyDifferences?"differences":"allFields")}</Label>
    </View>
   </SectionCard>
   <ScrollView horizontal showsHorizontalScrollIndicator={true} accessibilityLabel={t.title} nestedScrollEnabled>
    <View style={{gap:0,borderWidth:1,borderColor:colors.border,borderRadius:14,overflow:"hidden"}}>
     <View style={{flexDirection:rtl?"row-reverse":"row",backgroundColor:colors.surface}}>
      <View style={{width:LABEL,padding:10,justifyContent:"center"}}><Label muted style={{fontSize:12}}>{savedText(locale,"filters")}</Label></View>
      {result.items.map(item=><View key={item.id} style={{width:COLUMN,padding:10,borderStartWidth:1,borderColor:colors.border,gap:8}}>
       <Label weight="bold" style={{fontSize:14,lineHeight:22}}>{item.data.title}</Label>
       <StatusBadge tone={item.available===false?"warning":"success"} label={item.status}/>
       <Action kind="secondary" label={savedText(locale,"view")}
        onPress={()=>router.push({pathname:"/property/[id]",params:{id:item.id}})}/>
      </View>)}
     </View>
     {visible.map((row,index)=><View key={row.key} style={{flexDirection:rtl?"row-reverse":"row",
      backgroundColor:row.difference?"#FFF7E8":index%2?colors.surface:colors.background,
      borderTopWidth:1,borderColor:colors.border}}>
      <View style={{width:LABEL,padding:9,justifyContent:"center"}}>
       <Label weight={row.difference?"medium":"regular"} style={{fontSize:12,lineHeight:18}}>{row.label}</Label>
       {row.difference?<Label style={{fontSize:10,color:colors.warning}}>{savedText(locale,"different")}</Label>:null}
      </View>
      {row.values.map((value,i)=><View key={result.items[i].id} style={{width:COLUMN,minHeight:54,padding:10,
       borderStartWidth:1,borderColor:colors.border,justifyContent:"center"}}>
       <Label style={{fontSize:12,lineHeight:20}}>{value}</Label>
      </View>)}
     </View>)}
    </View>
   </ScrollView>
   <Label muted style={{fontSize:12}}>{result.notice}</Label>
  </View>:null}
  <Action kind="secondary" label={t.back} onPress={()=>router.push("/(tabs)/saved")}/>
 </Page>;
}
