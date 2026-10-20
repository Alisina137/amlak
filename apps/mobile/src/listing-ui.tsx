import {useEffect,useState} from "react";
import {Animated,Pressable,View} from "react-native";
import {router} from "expo-router";
import {colors,elevation} from "@amlaklink/design-tokens";
import type {ListingDTO} from "./listing-client";
import {photoSource} from "./listing-client";
import {usePreferences} from "./context";
import {Label,SectionCard,LoadingCard,StateNotice} from "./ui";
import {useFavorites} from "./favorites";
import {dt} from "./discovery-copy";
import {Action} from "./ui";
import {formatNumber,isRTL,type Locale} from "@amlaklink/localization";
import {uiText} from "./ui-copy";
import {findProvince} from "@amlaklink/catalog";
import {FavoriteGlyph,MotionImage,usePressScale} from "./motion";
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
 const {isSaved,toggle}=useFavorites();
 const [error,setError]=useState("");
 const rtl=isRTL(locale),motion=usePressScale();
 const area=d.attributes.areaM2;
 const areaText=typeof area==="number"&&Number.isFinite(area)&&area>0?formatNumber(area,locale)+" m²":null;
 const location=[findProvince(d.location.provinceId)?.names[locale],d.location.district].filter(Boolean).join(" · ");
 const confirmation=item.lastConfirmedAt?new Date(item.lastConfirmedAt):null;
 const confirmationText=confirmation&&!Number.isNaN(confirmation.getTime())?
  (locale==="en"?"Availability checked: ":locale==="fa"?"بررسی موجودیت: ":"شتون کتل شوی: ")+
  confirmation.toLocaleDateString(locale==="en"?"en-US":locale==="ps"?"ps-AF":"fa-AF"):null;
 return <Animated.View style={motion.pressStyle}><Pressable accessibilityRole="button" accessibilityLabel={d.title}
  onPressIn={motion.onPressIn} onPressOut={motion.onPressOut}
  onPress={()=>router.push({pathname:"/property/[id]",params:{id:item.id}})}>
  <View style={{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,
   borderRadius:22,overflow:"hidden",marginBottom:16,...elevation.card}}>
   <View style={{position:"relative"}}>
    {photo?<MotionImage imageKey={photo} source={photoSource(photo)} accessibilityLabel={d.title}
     style={{width:"100%",aspectRatio:1.63,backgroundColor:colors.surfaceMuted}} resizeMode="cover"/>:
     <View style={{width:"100%",aspectRatio:1.63,backgroundColor:colors.primarySoft,justifyContent:"center",alignItems:"center"}}>
      <Label style={{fontSize:40,color:colors.primary}}>⌂</Label>
     </View>}
    <View style={{position:"absolute",top:10,start:10,backgroundColor:"rgba(8,43,35,0.92)",paddingHorizontal:12,paddingVertical:7,borderRadius:12}}>
     <Label style={{fontSize:12,color:"#fff"}}>{lt(locale,d.transactionType)} · {lt(locale,d.propertyType)}</Label>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={isSaved(item.id)?dt(locale,"unsave"):dt(locale,"save")}
     onPress={event=>{event.stopPropagation();void toggle(item.id).catch(()=>setError(dt(locale,"favoriteError")));}}
     style={{position:"absolute",top:10,end:10,width:46,height:46,borderRadius:23,backgroundColor:colors.surface,justifyContent:"center",alignItems:"center",...elevation.card}}>
     <FavoriteGlyph saved={isSaved(item.id)}/>
    </Pressable>
    {item.photos.length>1?<View style={{position:"absolute",bottom:10,end:10,paddingHorizontal:10,paddingVertical:5,borderRadius:14,backgroundColor:"rgba(8,43,35,0.88)"}}>
     <Label style={{fontSize:12,color:"#fff"}}>▣ {formatNumber(item.photos.length,locale)}</Label>
    </View>:null}
   </View>
   <View style={{padding:16,gap:8}}>
    <Label weight="bold" style={{fontSize:21,lineHeight:29,color:colors.primaryDark,letterSpacing:-0.3}}>{priceSummary(d,locale)}</Label>
    <Label weight="medium" style={{fontSize:15,lineHeight:23,color:colors.text}}>{d.title}</Label>
    {location?<View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:7}}>
     <View style={{width:24,height:24,backgroundColor:colors.primarySoft,borderRadius:8,alignItems:"center",justifyContent:"center"}}>
      <Label style={{fontSize:13,color:colors.primary,textAlign:"center"}}>⌖</Label>
     </View>
     <Label muted style={{fontSize:12,lineHeight:19,flex:1}}>{location}</Label>
    </View>:null}
    {areaText?<View style={{flexDirection:rtl?"row-reverse":"row",gap:8,alignItems:"center"}}>
     <Label muted style={{fontSize:12,lineHeight:18,color:colors.textSecondary}}>▱ {areaText}</Label>
    </View>:null}
    {confirmationText?<View style={{paddingTop:8,borderTopWidth:1,borderTopColor:colors.divider,
     flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:6}}>
     <View style={{width:7,height:7,borderRadius:4,backgroundColor:colors.success}}/>
     <Label muted style={{fontSize:11,lineHeight:17,flex:1}}>{confirmationText}</Label>
    </View>:null}
    {error?<Label style={{fontSize:12,color:colors.error}}>{error}</Label>:null}
   </View>
  </View>
 </Pressable></Animated.View>;
}
export function ListingFeed({provinceId,reconnectEpoch=0}:{provinceId?:string;reconnectEpoch?:number}){
 const [items,setItems]=useState<ListingDTO[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[retry,setRetry]=useState(0);
 const {locale}=usePreferences();
 useEffect(()=>{let active=true;setLoading(true);setError("");
  import("./listing-client").then(({listPublic})=>listPublic(provinceId)).then(data=>{if(active)setItems(data.items);})
  .catch(()=>{if(active)setError(uiText(locale,"feedError"))})
  .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[provinceId,locale,retry,reconnectEpoch]);
 if(loading)return <View style={{gap:12}}><LoadingCard withImage rows={3} label={uiText(locale,"feedLoading")}/><LoadingCard withImage rows={2}/></View>;
 if(error)return <StateNotice message={error} retryLabel={dt(locale,"retry")} onRetry={()=>setRetry(v=>v+1)}/>;
 if(items.length===0)return <SectionCard><Label muted>{uiText(locale,"feedEmpty")}</Label></SectionCard>;
 return <View>{items.map(item=><ListingCard key={item.id} item={item}/>)}</View>;
}
