import {useEffect,useRef,useState} from "react";
import {Linking,Pressable,Share,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {colors} from "@amlaklink/design-tokens";
import {findProvince} from "@amlaklink/catalog";
import {formatNumber,isRTL,type Locale} from "@amlaklink/localization";
import {requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {getPublic,type ListingDTO} from "../../src/listing-client";
import {markRecentlyViewed} from "../../src/recently-viewed";
import {advertiserId,advertiserKind,getContact} from "../../src/discovery-client";
import {dt} from "../../src/discovery-copy";
import {et} from "../../src/engagement-copy";
import {st} from "../../src/safety-copy";
import {useFavorites} from "../../src/favorites";
import {lt,priceSummary} from "../../src/listing-ui";
import {PropertyGallery} from "../../src/property-gallery";
import {pd} from "../../src/property-detail-copy";
import {Action,BackButton,Label,Page,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";
import {localeDate} from "../../src/foundation-copy";

type ContactChannel="call"|"whatsapp";
type Price=ListingDTO["data"]["price"];
type Attributes=ListingDTO["data"]["attributes"];

function money(value:number|undefined,currency:Price["currency"],locale:Locale){
 return value===undefined||!Number.isFinite(value)?pd(locale,"valueMissing"):formatNumber(value,locale)+" "+currency;
}
function iconButton(icon:string,label:string,onPress:()=>void){
 return {icon,label,onPress};
}
function PropertyStat({label,value}:{label:string;value:string}){
 return <View style={{flexBasis:"46%",flexGrow:1,minWidth:130,backgroundColor:colors.background,
  borderRadius:14,paddingHorizontal:12,paddingVertical:10,gap:3}}>
  <Label muted style={{fontSize:12,lineHeight:17}}>{label}</Label>
  <Label weight="bold" style={{fontSize:15,lineHeight:23}}>{value}</Label>
 </View>;
}
function PriceRow({label,value}:{label:string;value:string}){
 const {locale}=usePreferences();
 return <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",justifyContent:"space-between",
  alignItems:"flex-start",gap:12,paddingVertical:4}}>
  <Label muted style={{flex:1,fontSize:13}}>{label}</Label>
  <Label weight="medium" style={{flex:1,fontSize:14,textAlign:isRTL(locale)?"left":"right"}}>{value}</Label>
 </View>;
}
function Facts({attributes:a}:{attributes:Attributes}){
 const {locale}=usePreferences();
 const items:{label:string;value:string}[]=[];
 if(a.areaM2>0)items.push({label:pd(locale,"area"),value:formatNumber(a.areaM2,locale)+" m²"});
 if(a.bedrooms!==undefined)items.push({label:pd(locale,"bedrooms"),value:formatNumber(a.bedrooms,locale)});
 if(a.bathrooms!==undefined)items.push({label:pd(locale,"bathrooms"),value:formatNumber(a.bathrooms,locale)});
 if(a.floor!==undefined)items.push({label:pd(locale,"floor"),value:formatNumber(a.floor,locale)});
 if(a.totalFloors!==undefined)items.push({label:pd(locale,"totalFloors"),value:formatNumber(a.totalFloors,locale)});
 if(a.landFrontageM!==undefined)items.push({label:pd(locale,"frontage"),value:formatNumber(a.landFrontageM,locale)+" m"});
 if(a.condition)items.push({label:pd(locale,"condition"),value:pd(locale,a.condition)});
 const amenities=(["furnished","parking","water","electricity"] as const).filter(k=>a[k]===true);
 return <>
  {items.length>0?<SectionCard><Label weight="bold" style={{fontSize:17}}>{pd(locale,"facts")}</Label>
   <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",flexWrap:"wrap",gap:10}}>
    {items.map(item=><PropertyStat key={item.label} {...item}/>)}
   </View>
  </SectionCard>:null}
  {amenities.length>0?<SectionCard><Label weight="bold" style={{fontSize:17}}>{pd(locale,"amenities")}</Label>
   <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",flexWrap:"wrap",gap:8}}>
    {amenities.map(k=><View key={k} style={{borderRadius:18,backgroundColor:"#E9F4EE",paddingVertical:8,paddingHorizontal:12,
     borderWidth:1,borderColor:"#CFE6D9"}}>
     <Label style={{fontSize:13,color:colors.primary}}>✓ {pd(locale,k)}</Label>
    </View>)}
   </View>
  </SectionCard>:null}
 </>;
}
function PriceDetails({data}:{data:ListingDTO["data"]}){
 const {locale}=usePreferences(),p=data.price;
 return <SectionCard>
  <Label weight="bold" style={{fontSize:17}}>{pd(locale,"priceBreakdown")}</Label>
  <Label weight="bold" style={{fontSize:24,lineHeight:34,color:colors.primary}}>{priceSummary(data,locale)}</Label>
  {data.transactionType==="sale"?<PriceRow label={pd(locale,"asking")} value={money(p.askingPrice,p.currency,locale)}/>:null}
  {data.transactionType==="rent"?<>
   <PriceRow label={pd(locale,"monthlyRent")} value={money(p.monthlyRent,p.currency,locale)}/>
   <PriceRow label={pd(locale,"refundableDeposit")} value={money(p.refundableDeposit,p.currency,locale)}/>
  </>:null}
  {data.transactionType==="gharawi"?<>
   <PriceRow label={pd(locale,"refundablePrincipal")} value={money(p.refundablePrincipal,p.currency,locale)}/>
   <PriceRow label={pd(locale,"monthlyRent")} value={money(p.monthlyRent,p.currency,locale)}/>
   {p.durationMonths!==undefined?<PriceRow label={pd(locale,"duration")}
    value={formatNumber(p.durationMonths,locale)+" "+pd(locale,"months")}/>:null}
   {p.refundTerms?.trim()?<View style={{gap:3}}>
    <Label muted style={{fontSize:13}}>{pd(locale,"refundTerms")}</Label>
    <Label>{p.refundTerms.trim()}</Label>
   </View>:null}
  </>:null}
  {p.maintenanceMonthly!==undefined?<PriceRow label={pd(locale,"maintenance")}
   value={money(p.maintenanceMonthly,p.currency,locale)}/>:null}
  {p.negotiable?<StatusBadge tone="success" label={pd(locale,"negotiable")}/>:null}
  <Label muted style={{fontSize:12,lineHeight:19}}>{pd(locale,"termsNote")}</Label>
 </SectionCard>;
}
export default function PropertyDetails(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{isSaved,toggle}=useFavorites();
 const inset=useSafeAreaInsets(),rtl=isRTL(locale);
 const [data,setData]=useState<ListingDTO|null>(null),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[retry,setRetry]=useState(0),[busy,setBusy]=useState<ContactChannel|null>(null);
 const contactLock=useRef(false);
 const [authorizationReviewed,setAuthorizationReviewed]=useState(false),[expanded,setExpanded]=useState(false);
 useEffect(()=>{
  let active=true;
  setLoading(true);setError("");setData(null);setExpanded(false);
  if(!id){setLoading(false);return()=>{active=false;};}
  void getPublic(id).then(item=>{
   if(!active)return;
   setData(item);
   if(item.status==="published")void markRecentlyViewed(item.id).catch(()=>{});
  }).catch(()=>{if(active)setError(pd(locale,"problem"));})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[id,retry]);
 useEffect(()=>{
  let active=true;
  setAuthorizationReviewed(false);
  if(!id)return()=>{active=false;};
  void requestJson<{items:{scope:string}[]}>("/v1/properties/"+encodeURIComponent(id)+"/verified-checks")
   .then(r=>{if(active)setAuthorizationReviewed(r.items.some(i=>i.scope==="listing_authorization_reviewed"));})
   .catch(()=>{});
  return()=>{active=false;};
 },[id,retry]);
 async function contact(channel:ContactChannel){
  if(contactLock.current||!data||data.id!==id||!data.available||data.status!=="published")return;
  if(channel==="call"&&!data.data.contact.allowPhone)return;
  if(channel==="whatsapp"&&!data.data.contact.allowWhatsApp)return;
  contactLock.current=true;setBusy(channel);setError("");
  try{
   const result=await getContact(data.id,channel);
   if(!(await Linking.canOpenURL(result.href)))throw Error(channel==="call"?dt(locale,"callUnavailable"):dt(locale,"whatsappUnavailable"));
   await Linking.openURL(result.href);
  }catch(e){setError((e as Error).message||dt(locale,"unknown"));}
  finally{contactLock.current=false;setBusy(null);}
 }
 async function share(){
  if(!data||data.id!==id)return;
  try{await Share.share({message:data.data.title+"\n"+priceSummary(data.data,locale)+"\n"+"amlaklink://property/"+data.id});}
  catch{setError(pd(locale,"shareFailed"));}
 }
 function inquiry(viewing=false){
  if(!data||data.id!==id||!data.available||data.status!=="published")return;
  router.push({pathname:"/inquiries/new",params:{listingId:data.id,...(viewing?{intent:"viewing"}:{})}});
 }
 if(loading)return <Page><BackButton onPress={()=>router.back()}/><LoadingCard withImage rows={4}/><LoadingCard rows={4}/><LoadingCard rows={3}/></Page>;
 if(!data||data.id!==id)return <Page><BackButton onPress={()=>router.back()}/>
  <StateNotice message={error||pd(locale,"problem")} retryLabel={pd(locale,"retry")} onRetry={()=>setRetry(n=>n+1)}/>
 </Page>;
 const d=data.data,p=d.price,a=d.attributes,canContact=!!data.available&&data.status==="published";
 const kind=advertiserKind(data),profileId=advertiserId(data);
 const location=[findProvince(d.location.provinceId)?.names[locale],d.location.city,d.location.district,d.location.neighborhood]
  .map(x=>x?.trim()).filter(Boolean).join(" · ");
 const description=d.description?.trim()||"";
 const shortDescription=description.length>360&&!expanded?description.slice(0,360).trimEnd()+"…":description;
 const buttons=[
  iconButton(isSaved(id)?"♥":"♡",isSaved(id)?dt(locale,"unsave"):dt(locale,"save"),
   ()=>void toggle(id).catch(()=>setError(dt(locale,"favoriteError")))),
  iconButton("↗",dt(locale,"share"),()=>void share()),
  iconButton("↻",pd(locale,"refresh"),()=>setRetry(n=>n+1))
 ];
 return <View style={{flex:1,backgroundColor:colors.background}}>
  <Page>
   <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",justifyContent:"space-between",gap:12}}>
    <BackButton onPress={()=>router.back()}/>
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
     {buttons.map(button=><Pressable key={button.label} accessibilityRole="button" accessibilityLabel={button.label}
      onPress={button.onPress} style={({pressed})=>({width:46,height:46,borderRadius:14,
       borderWidth:1,borderColor:colors.border,backgroundColor:pressed?colors.background:colors.surface,
       justifyContent:"center",alignItems:"center"})}>
      <Label style={{fontSize:23,lineHeight:29,color:colors.primary}}>{button.icon}</Label>
     </Pressable>)}
    </View>
   </View>
   <PropertyGallery photos={data.photos} title={d.title}/>
   <View style={{gap:9}}>
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap",alignItems:"center"}}>
     <StatusBadge label={lt(locale,d.transactionType)+" · "+lt(locale,d.propertyType)}/>
     <StatusBadge tone={canContact?"success":"warning"}
      label={canContact?dt(locale,"active"):dt(locale,"unavailable")}/>
    </View>
    <Label weight="bold" style={{fontSize:22,lineHeight:31}}>{d.title}</Label>
    {location?<Label muted style={{fontSize:13}}>⌖ {location}</Label>:null}
    <Label muted style={{fontSize:12,lineHeight:18}}>{pd(locale,"confirm")}</Label>
   </View>
   {!canContact?<StateNotice tone="warning" message={dt(locale,"unavailable")}/>:null}
   <PriceDetails data={d}/>
   <Facts attributes={a}/>
   {description?<SectionCard>
    <Label weight="bold" style={{fontSize:17}}>{pd(locale,"description")}</Label>
    <Label style={{lineHeight:26}}>{shortDescription}</Label>
    {description.length>360?<Pressable accessibilityRole="button" accessibilityState={{expanded}}
     onPress={()=>setExpanded(x=>!x)} style={{minHeight:44,justifyContent:"center",alignSelf:rtl?"flex-end":"flex-start"}}>
     <Label weight="medium" style={{fontSize:14,color:colors.primary}}>{pd(locale,expanded?"readLess":"readMore")}</Label>
    </Pressable>:null}
   </SectionCard>:null}
   <SectionCard>
    <Label weight="bold" style={{fontSize:17}}>{pd(locale,"location")}</Label>
    {location?<Label>{location}</Label>:null}
    <Label muted style={{fontSize:13}}>{pd(locale,"locationNote")}</Label>
    <Label muted style={{fontSize:12}}>{pd(locale,"privateLocation")}</Label>
    {data.lastConfirmedAt?<PriceRow label={pd(locale,"lastConfirmed")} value={localeDate(data.lastConfirmedAt,locale)}/>:null}
    <Label muted style={{fontSize:12}}>{pd(locale,"availabilityNote")}</Label>
   </SectionCard>
   <SectionCard>
    <Label weight="bold" style={{fontSize:17}}>{pd(locale,"advertiser")}</Label>
    <Label muted>{kind==="agency"?dt(locale,"agencyBadge"):data.publisher==="independent_agent"?dt(locale,"proBadge"):dt(locale,"contactBadge")}</Label>
    {authorizationReviewed?<StatusBadge tone="success" label={pd(locale,"reviewed")}/>:null}
    <Label muted style={{fontSize:12}}>{pd(locale,"verificationNote")}</Label>
    <Action kind="secondary" label={dt(locale,"profile")} onPress={()=>
     router.push({pathname:"/advertiser/[kind]/[id]",params:{kind,id:profileId}})}/>
   </SectionCard>
   <SectionCard>
    <Label weight="bold" style={{fontSize:17}}>{pd(locale,"contact")}</Label>
    <Label muted>{pd(locale,"viewingHint")}</Label>
    <Label muted style={{fontSize:12}}>{dt(locale,"safeContact")}</Label>
    <Action kind="secondary" label={st(locale,"report")} onPress={()=>
     router.push({pathname:"/report/[listingId]",params:{listingId:id}})}/>
   </SectionCard>
   {error?<StateNotice message={error} retryLabel={pd(locale,"retry")} onRetry={()=>setError("")}/>:null}
  </Page>
  <View style={{backgroundColor:colors.surface,paddingHorizontal:14,paddingTop:10,
   paddingBottom:Math.max(12,inset.bottom),gap:9,borderTopWidth:1,borderColor:colors.border}}>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:9}}>
    <View style={{flex:1}}><Action label={pd(locale,"inquiry")} disabled={!canContact} onPress={()=>inquiry()}/></View>
    <View style={{flex:1}}><Action kind="secondary" label={pd(locale,"viewing")} disabled={!canContact} onPress={()=>inquiry(true)}/></View>
   </View>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:9}}>
    <View style={{flex:1}}><Action kind="secondary" label={busy==="call"?pd(locale,"contactBusy"):pd(locale,"phone")}
     disabled={!canContact||!d.contact.allowPhone||busy!==null} onPress={()=>void contact("call")}/></View>
    <View style={{flex:1}}><Action kind="secondary" label={busy==="whatsapp"?pd(locale,"contactBusy"):pd(locale,"whatsapp")}
     disabled={!canContact||!d.contact.allowWhatsApp||busy!==null} onPress={()=>void contact("whatsapp")}/></View>
   </View>
  </View>
 </View>;
}
