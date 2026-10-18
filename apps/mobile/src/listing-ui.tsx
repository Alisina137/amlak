import {useEffect,useState} from "react";
import {Image,Pressable,View,ActivityIndicator} from "react-native";
import {router} from "expo-router";
import {colors} from "@amlaklink/design-tokens";
import type {ListingDTO} from "./listing-client";
import {photoSource} from "./listing-client";
import {usePreferences} from "./context";
import {Label,SectionCard} from "./ui";
import {useFavorites} from "./favorites";
import {dt} from "./discovery-copy";
import {Action} from "./ui";
import {formatNumber,isRTL,type Locale} from "@amlaklink/localization";
import {uiText} from "./ui-copy";
import {findProvince} from "@amlaklink/catalog";
const labels={
 en:{sale:"Sale",rent:"Rent",gharawi:"Gharawi",house:"House",apartment:"Apartment",land:"Land",shop:"Shop",office:"Office",commercial:"Commercial",published:"Published",paused:"Paused",pending_review:"Under review",rejected:"Rejected",draft:"Draft",sold:"Sold",rented:"Rented",available:"Confirmed available",notAvailable:"Not currently available",deposit:"Refundable deposit",principal:"Refundable gharawi principal",monthly:"Monthly rent"},
 fa:{sale:"فروش",rent:"کرایه",gharawi:"گروی",house:"خانه",apartment:"آپارتمان",land:"زمین",shop:"دکان",office:"دفتر",commercial:"تجاری",published:"نشرشده",paused:"متوقف",pending_review:"در حال بررسی",rejected:"ردشده",draft:"پیش‌نویس",sold:"فروخته‌شده",rented:"به کرایه داده‌شده",available:"موجودی تأیید شده",notAvailable:"موجودی تأیید نشده",deposit:"پیش‌پرداخت/تضمین",principal:"مبلغ قابل بازپرداخت گروی",monthly:"کرایه ماهانه"},
 ps:{sale:"پلور",rent:"کرایه",gharawi:"ګروۍ",house:"کور",apartment:"اپارتمان",land:"ځمکه",shop:"دوکان",office:"دفتر",commercial:"تجارتي",published:"خپور شوی",paused:"درېدلی",pending_review:"د څېړنې لاندې",rejected:"رد شوی",draft:"مسوده",sold:"پلورل شوی",rented:"کرایه شوی",available:"شتون تایید شوی",notAvailable:"شتون نه دی تایید شوی",deposit:"بېرته ورکول کېدونکې پیسې",principal:"د ګروۍ بېرته ورکول کېدونکي پیسې",monthly:"میاشتنۍ کرایه"}
} as const;
export function lt(locale:Locale,k:keyof typeof labels.en){return labels[locale][k];}
function money(v:number|undefined,c:string,locale:Locale){
 if(v===undefined)return "—";
 return formatNumber(v,locale)+" "+c;
}
export function priceSummary(d:ListingDTO["data"],locale:Locale){
 const p=d.price;
 if(d.transactionType==="sale")return money(p.askingPrice,p.currency,locale);
 if(d.transactionType==="rent")return money(p.monthlyRent,p.currency,locale)+" / "+lt(locale,"monthly");
 return money(p.refundablePrincipal,p.currency,locale)+" / "+lt(locale,"principal");
}
export function ListingCard({item}:{item:ListingDTO}){
 const {locale}=usePreferences(),d=item.data,photo=item.photos[0]?.id;
 const {isSaved,toggle}=useFavorites();const [error,setError]=useState("");
 return <Pressable accessibilityRole="button" onPress={()=>router.push({pathname:"/property/[id]",params:{id:item.id}})}>
  <View style={{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:18,overflow:"hidden",marginBottom:14}}>
   {photo?<View>
    <Image source={photoSource(photo)} accessibilityLabel={d.title}
     style={{width:"100%",aspectRatio:4/3,backgroundColor:colors.border}} resizeMode="cover"/>
    {item.photos.length>1?<View style={{position:"absolute",bottom:10,end:10,paddingHorizontal:11,paddingVertical:6,
     borderRadius:16,backgroundColor:"rgba(15,20,19,0.82)"}}>
     <Label style={{fontSize:12,color:"#fff"}}>▣ {item.photos.length}</Label>
    </View>:null}
   </View>:
    <View style={{height:160,backgroundColor:colors.border,justifyContent:"center",alignItems:"center"}}><Label>⌂</Label></View>}
   <View style={{padding:16,gap:6}}>
    <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",alignItems:"center",justifyContent:"flex-end"}}>
     <Pressable accessibilityRole="button" accessibilityLabel={isSaved(item.id)?dt(locale,"unsave"):dt(locale,"save")} onPress={event=>{event.stopPropagation();void toggle(item.id).catch(()=>setError(dt(locale,"favoriteError")));}} style={{paddingHorizontal:15,paddingVertical:8,minHeight:44,borderRadius:18,backgroundColor:isSaved(item.id)?"#e1f0e9":colors.background}}>
      <Label style={{fontSize:23,color:colors.primary}}>{isSaved(item.id)?"♥":"♡"}</Label>
     </Pressable>
    </View>
    <Label weight="bold" style={{fontSize:20,color:colors.primary}}>{priceSummary(d,locale)}</Label>
    <Label weight="bold">{d.title}</Label>
    <Label muted>{lt(locale,d.transactionType)} · {lt(locale,d.propertyType)} · {findProvince(d.location.provinceId)?.names[locale]} / {d.location.district}</Label>
    {error?<Label style={{color:colors.error}}>{error}</Label>:null}
    <Label muted style={{fontSize:13}}>{formatNumber(d.attributes.areaM2||0,locale)} m² · {item.lastConfirmedAt?new Date(item.lastConfirmedAt).toLocaleDateString(locale==="en"?"en-US":locale==="ps"?"ps-AF":"fa-AF"):"—"}</Label>
   </View>
  </View>
 </Pressable>;
}
export function ListingFeed({provinceId}:{provinceId?:string}){
 const [items,setItems]=useState<ListingDTO[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const {locale}=usePreferences();
 useEffect(()=>{let active=true;setLoading(true);setError("");
  import("./listing-client").then(({listPublic})=>listPublic(provinceId)).then(data=>{if(active)setItems(data.items);})
  .catch(()=>{if(active)setError(uiText(locale,"feedError"))})
  .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[provinceId,locale]);
 if(loading)return <SectionCard><ActivityIndicator color={colors.primary}/><Label muted>{uiText(locale,"feedLoading")}</Label></SectionCard>;
 if(error)return <SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>;
 if(items.length===0)return <SectionCard><Label muted>{uiText(locale,"feedEmpty")}</Label></SectionCard>;
 return <View>{items.map(item=><ListingCard key={item.id} item={item}/>)}</View>;
}
