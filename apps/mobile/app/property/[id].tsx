import {useEffect,useState} from "react";
import {requestJson} from "../../src/auth";
import {router,useLocalSearchParams} from "expo-router";
import {Linking,Pressable,Share,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {colors,elevation} from "@amlaklink/design-tokens";
import {findProvince} from "@amlaklink/catalog";
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
import {FavoriteGlyph,MotionReveal} from "../../src/motion";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";
import {localeDate} from "../../src/foundation-copy";
import {formatNumber,isRTL} from "@amlaklink/localization";
const detailCopy={
 en:{location:"Location",details:"Property details",description:"Description",available:"Availability",checked:"Availability checked",price:"Price overview",area:"Area",beds:"Bedrooms",baths:"Bathrooms",yes:"Yes",no:"No",features:"Features",months:"months",viewing:"Request a viewing",photos:"Photos",retry:"Try again",notFound:"This listing could not be loaded.",updated:"Listing information",about:"About the advertiser",noAddress:"Precise address is shared only with permission",noDescription:"No description provided.",month:"Monthly",safe:"Only contact through methods enabled by the advertiser"},
 fa:{location:"موقعیت",details:"مشخصات ملک",description:"توضیحات",available:"موجودیت",checked:"آخرین تأیید موجودی",price:"جزئیات قیمت",area:"مساحت",beds:"اتاق خواب",baths:"حمام",yes:"بلی",no:"نخیر",features:"امکانات",months:"ماه",viewing:"درخواست بازدید",photos:"تصاویر",retry:"تلاش دوباره",notFound:"بارگذاری این آگهی ممکن نشد.",updated:"اطلاعات آگهی",about:"درباره آگهی‌دهنده",noAddress:"آدرس دقیق تنها با اجازه شریک می‌شود",noDescription:"توضیحی ثبت نشده است.",month:"ماهانه",safe:"تنها از روش‌های تماس مجاز آگهی‌دهنده استفاده کنید"},
 ps:{location:"موقعیت",details:"د ملک ځانګړنې",description:"تفصیل",available:"شتون",checked:"د شتون وروستی تایید",price:"د بیې جزییات",area:"مساحت",beds:"د خوب خونې",baths:"تشنابونه",yes:"هو",no:"نه",features:"اسانتیاوې",months:"میاشتې",viewing:"د لیدنې غوښتنه",photos:"انځورونه",retry:"بیا هڅه",notFound:"دا اعلان پورته نه شو.",updated:"د اعلان معلومات",about:"د اعلان ورکوونکي په اړه",noAddress:"کره پته یوازې په اجازه شریکېږي",noDescription:"تفصیل نه دی ورکړل شوی.",month:"میاشتنی",safe:"یوازې د اعلان ورکوونکي له اجازې سره سم اړیکه ونیسئ"}
} as const;
function InfoMetric({label,value}:{label:string;value:string}){return <View style={{flexGrow:1,flexBasis:"29%",minWidth:90,gap:3,padding:10,borderWidth:1,borderColor:colors.border,borderRadius:12,backgroundColor:colors.primaryWash}}><Label muted style={{fontSize:12,lineHeight:18}}>{label}</Label><Label weight="bold" style={{fontSize:15,lineHeight:23}}>{value}</Label></View>;}

export default function PropertyDetails(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{isSaved,toggle}=useFavorites();
 const [data,setData]=useState<ListingDTO|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState<"call"|"whatsapp"|null>(null),[retry,setRetry]=useState(0);
 const [authorizationReviewed,setAuthorizationReviewed]=useState(false),[contactError,setContactError]=useState("");
 useEffect(()=>{let live=true;setLoading(true);setData(null);setError("");setContactError("");
  void getPublic(id).then(v=>{if(live){setData(v);if(v.status==="published")void markRecentlyViewed(v.id).catch(()=>{});}}).catch(()=>{if(live)setError(locale==="en"?"This property is not available.":"این ملک فعلاً قابل مشاهده نیست.");})
   .finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[id,locale,retry]);
 useEffect(()=>{let active=true;setAuthorizationReviewed(false);
  void requestJson<{items:{scope:string}[]}>("/v1/properties/"+id+"/verified-checks")
   .then(r=>{if(active)setAuthorizationReviewed(r.items.some(i=>i.scope==="listing_authorization_reviewed"));})
   .catch(()=>{});return()=>{active=false;};
 },[id]);
 async function contact(channel:"call"|"whatsapp"){
  if(!data?.available||data.status!=="published"||busy)return;
  setBusy(channel);setContactError("");
  try{
   const res=await getContact(id,channel);
   const can=await Linking.canOpenURL(res.href);
   if(!can)throw Error(channel==="call"?dt(locale,"callUnavailable"):dt(locale,"whatsappUnavailable"));
   await Linking.openURL(res.href);
  }catch(e){setContactError((e as Error).message||dt(locale,"unknown"));}
  finally{setBusy(null);}
 }
 async function share(){
  if(!data)return;
  try{await Share.share({message:data.data.title+"\n"+priceSummary(data.data,locale)+"\n"+"amlaklink://property/"+data.id});}
  catch{setError(dt(locale,"unknown"));}
 }
 if(loading)return <Page><LoadingCard withImage rows={4}/><LoadingCard rows={3}/></Page>;
 if(!data)return <Page><BackButton onPress={()=>router.back()}/><StateNotice message={error||detailCopy[locale].notFound} retryLabel={detailCopy[locale].retry} onRetry={()=>setRetry(v=>v+1)}/></Page>;
 const d=data.data,p=d.price,a=d.attributes,canContact=!!data.available&&data.status==="published",copy=detailCopy[locale];
 const cash=(amount:number|undefined)=>amount===undefined?"—":new Intl.NumberFormat(locale==="en"?"en-US":"fa-AF").format(amount)+" "+p.currency;
 const profileId=advertiserId(data),kind=advertiserKind(data);
 const location=[findProvince(d.location.provinceId)?.names[locale],d.location.city,d.location.district,d.location.neighborhood].filter(Boolean).join(" · ");
 const features=[a.furnished!==undefined?dt(locale,"furnished")+": "+(a.furnished?copy.yes:copy.no):null,a.parking!==undefined?dt(locale,"parking")+": "+(a.parking?copy.yes:copy.no):null].filter((v):v is string=>!!v);
 return <View style={{flex:1,backgroundColor:colors.background}}>
  <Page>
   <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",justifyContent:"space-between",alignItems:"center"}}>
    <BackButton onPress={()=>router.back()}/>
    <View style={{flexDirection:"row",gap:8}}>
     <Pressable accessibilityRole="button" accessibilityLabel={isSaved(id)?dt(locale,"unsave"):dt(locale,"save")}
       onPress={()=>void toggle(id).catch(()=>setError(dt(locale,"favoriteError")))} style={{padding:12,minHeight:44}}>
      <FavoriteGlyph saved={isSaved(id)}/>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={dt(locale,"share")} onPress={()=>void share()} style={{padding:12,minHeight:44}}><Label>↗</Label></Pressable>
    </View>
   </View>
   {error?<StateNotice message={error}/>:null}
   <MotionReveal delay={35}><PropertyGallery photos={data.photos} title={d.title}/></MotionReveal>
   <View style={{gap:10}}>
    <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
     <StatusBadge label={lt(locale,d.transactionType)+" · "+lt(locale,d.propertyType)}/>
     <StatusBadge tone={canContact?"success":"warning"} label={canContact?dt(locale,"active"):dt(locale,"unavailable")}/>
    </View>
    <ScreenHeading title={d.title} subtitle={location||copy.noAddress}/>
   </View>
   <MotionReveal delay={85}><SectionCard>
    <Label muted style={{fontSize:13}}>{copy.price}</Label>
    <Label weight="bold" style={{fontSize:25,lineHeight:34,color:colors.primary}}>{priceSummary(d,locale)}</Label>
    {d.transactionType==="rent"?<>
     <Label>{lt(locale,"deposit")}: {cash(p.refundableDeposit)}</Label><Label>{lt(locale,"monthly")}: {cash(p.monthlyRent)}</Label>
    </>:null}
    {d.transactionType==="gharawi"?<>
     <Label>{lt(locale,"principal")}: {cash(p.refundablePrincipal)}</Label>
     <Label>{lt(locale,"monthly")}: {cash(p.monthlyRent)}</Label>
     <Label>{p.durationMonths} {copy.months}</Label>
     <Label>{p.refundTerms}</Label>
    </>:null}
   </SectionCard></MotionReveal>
   <SectionCard>
    <Label weight="bold" style={{fontSize:17}}>{copy.details}</Label>
    <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
     <InfoMetric label={copy.area} value={formatNumber(a.areaM2,locale)+" m²"}/>
     {a.bedrooms!==undefined?<InfoMetric label={copy.beds} value={formatNumber(a.bedrooms,locale)}/>:null}
     {a.bathrooms!==undefined?<InfoMetric label={copy.baths} value={formatNumber(a.bathrooms,locale)}/>:null}
    </View>
    {features.length?<><Label weight="medium">{copy.features}</Label><View style={{gap:5}}>{features.map(v=><Label key={v} style={{fontSize:14}}>{v}</Label>)}</View></>:null}
   </SectionCard>
   <SectionCard>
    <Label weight="bold" style={{fontSize:17}}>{copy.location}</Label>
    <Label>{location||copy.noAddress}</Label>
    <Label muted style={{fontSize:13}}>{d.location.precision==="approximate"?dt(locale,"approximate"):dt(locale,"limited")} · {copy.noAddress}</Label>
    {data.lastConfirmedAt?<Label muted style={{fontSize:12}}>{copy.checked}: {localeDate(data.lastConfirmedAt,locale)}</Label>:null}
   </SectionCard>
   <SectionCard>
    <Label weight="bold" style={{fontSize:17}}>{copy.description}</Label>
    <Label style={{fontSize:14,lineHeight:24}}>{d.description?.trim()||copy.noDescription}</Label>
   </SectionCard>
   <SectionCard><Label weight="bold" style={{fontSize:17}}>{copy.about}</Label>
    <Label muted>{kind==="agency"?dt(locale,"agencyBadge"):data.publisher==="independent_agent"?dt(locale,"proBadge"):dt(locale,"contactBadge")}</Label>
    {authorizationReviewed?<Label style={{color:colors.primary}}>{st(locale,"verified")}</Label>:null}
    <Label muted>{dt(locale,"notOwnership")}</Label>
    <Action kind="secondary" label={dt(locale,"profile")} onPress={()=>router.push({pathname:"/advertiser/[kind]/[id]",params:{kind,id:profileId}})}/>
   </SectionCard>
   <Label muted style={{fontSize:12}}>{copy.safe}</Label>
   <Action kind="secondary" label={st(locale,"report")} onPress={()=>router.push({pathname:"/report/[listingId]",params:{listingId:id}})}/>
  </Page>
  <SafeAreaView edges={["bottom"]} style={{backgroundColor:colors.surface}}>
   <View style={{gap:8,padding:12,borderTopWidth:1,borderColor:colors.border}}>
   {contactError?<Label style={{fontSize:13,lineHeight:20,color:colors.error}}>{contactError}</Label>:null}
   <Action label={et(locale,"newInquiry")} disabled={!canContact} onPress={()=>router.push({pathname:"/inquiries/new",params:{listingId:id}})}/>
   <Action kind="secondary" label={copy.viewing} disabled={!canContact} onPress={()=>router.push({pathname:"/inquiries/new",params:{listingId:id,intent:"viewing"}})}/>
   <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",gap:10}}>
   <View style={{flex:1}}><Action label={busy==="call"?"…":dt(locale,"call")} disabled={!canContact||!d.contact.allowPhone||busy!==null} onPress={()=>void contact("call")}/></View>
   <View style={{flex:1}}><Action kind="secondary" label={busy==="whatsapp"?"…":dt(locale,"whatsapp")} disabled={!canContact||!d.contact.allowWhatsApp||busy!==null} onPress={()=>void contact("whatsapp")}/></View>
   </View>
   </View>
  </SafeAreaView>
 </View>;
}
