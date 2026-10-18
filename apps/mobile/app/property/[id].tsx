import {useEffect,useState} from "react";
import {router,useLocalSearchParams} from "expo-router";
import {ActivityIndicator,Image,Linking,Pressable,ScrollView,Share,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {findProvince} from "@amlaklink/catalog";
import {usePreferences} from "../../src/context";
import {getPublic,photoSource,type ListingDTO} from "../../src/listing-client";
import {advertiserId,advertiserKind,getContact} from "../../src/discovery-client";
import {dt} from "../../src/discovery-copy";
import {et} from "../../src/engagement-copy";
import {st} from "../../src/safety-copy";
import {useFavorites} from "../../src/favorites";
import {lt,priceSummary} from "../../src/listing-ui";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function PropertyDetails(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{isSaved,toggle}=useFavorites();
 const [data,setData]=useState<ListingDTO|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState<"call"|"whatsapp"|null>(null);
 useEffect(()=>{let live=true;setLoading(true);setError("");
  void getPublic(id).then(v=>{if(live)setData(v);}).catch(()=>{if(live)setError(locale==="en"?"This property is not available.":"این ملک فعلاً قابل مشاهده نیست.");})
   .finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[id,locale]);
 async function contact(channel:"call"|"whatsapp"){
  if(!data?.available||data.status!=="published")return;
  setBusy(channel);setError("");
  try{
   const res=await getContact(id,channel);
   const can=await Linking.canOpenURL(res.href);
   if(!can)throw Error(channel==="call"?dt(locale,"callUnavailable"):dt(locale,"whatsappUnavailable"));
   await Linking.openURL(res.href);
  }catch(e){setError((e as Error).message||dt(locale,"unknown"));}
  finally{setBusy(null);}
 }
 async function share(){
  if(!data)return;
  try{await Share.share({message:data.data.title+"\n"+priceSummary(data.data,locale)+"\n"+"amlaklink://property/"+data.id});}
  catch{setError(dt(locale,"unknown"));}
 }
 if(loading)return <Page><ActivityIndicator color={colors.primary}/></Page>;
 if(!data)return <Page><SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>
  <Action kind="secondary" label="←" onPress={()=>router.back()}/></Page>;
 const d=data.data,p=d.price,a=d.attributes,canContact=!!data.available&&data.status==="published";
 const cash=(amount:number|undefined)=>amount===undefined?"—":new Intl.NumberFormat(locale==="en"?"en-US":"fa-AF").format(amount)+" "+p.currency;
 const profileId=advertiserId(data),kind=advertiserKind(data);
 return <View style={{flex:1,backgroundColor:colors.background}}>
  <Page>
   <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
    <Pressable accessibilityRole="button" onPress={()=>router.back()} style={{padding:12,minHeight:44}}>
     <Label weight="medium">←</Label>
    </Pressable>
    <View style={{flexDirection:"row",gap:8}}>
     <Pressable accessibilityRole="button" accessibilityLabel={isSaved(id)?dt(locale,"unsave"):dt(locale,"save")}
       onPress={()=>void toggle(id).catch(()=>setError(dt(locale,"favoriteError")))} style={{padding:12,minHeight:44}}>
      <Label style={{fontSize:23,color:colors.primary}}>{isSaved(id)?"♥":"♡"}</Label>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={dt(locale,"share")} onPress={()=>void share()} style={{padding:12,minHeight:44}}><Label>↗</Label></Pressable>
    </View>
   </View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={297} decelerationRate="fast">
    {data.photos.length?data.photos.map(photo=><Image key={photo.id} source={photoSource(photo.id)} resizeMode="cover"
      accessibilityLabel={d.title} style={{width:285,height:238,marginEnd:12,borderRadius:16,backgroundColor:colors.border}}/>):
     <SectionCard><Label>⌂</Label></SectionCard>}
   </ScrollView>
   <ScreenHeading title={d.title} subtitle={lt(locale,d.transactionType)+" · "+lt(locale,d.propertyType)}/>
   <Label style={{color:canContact?colors.success:colors.warning}}>{canContact?dt(locale,"active"):dt(locale,"unavailable")}</Label>
   <SectionCard>
    <Label weight="bold" style={{fontSize:24,color:colors.primary}}>{priceSummary(d,locale)}</Label>
    {d.transactionType==="rent"?<>
     <Label>{lt(locale,"deposit")}: {cash(p.refundableDeposit)}</Label><Label>{lt(locale,"monthly")}: {cash(p.monthlyRent)}</Label>
    </>:null}
    {d.transactionType==="gharawi"?<>
     <Label>{lt(locale,"principal")}: {cash(p.refundablePrincipal)}</Label>
     <Label>{lt(locale,"monthly")}: {cash(p.monthlyRent)}</Label>
     <Label>{p.durationMonths} {locale==="en"?"months":"ماه"}</Label>
     <Label>{p.refundTerms}</Label>
    </>:null}
   </SectionCard>
   <SectionCard><Label weight="bold">{locale==="en"?"Location":"موقعیت"}</Label>
    <Label>{findProvince(d.location.provinceId)?.names[locale]} · {d.location.city} · {d.location.district} · {d.location.neighborhood}</Label>
    <Label muted>{d.location.precision==="approximate"?dt(locale,"approximate"):dt(locale,"limited")}</Label>
    {data.lastConfirmedAt?<Label muted>{locale==="en"?"Last availability confirmation:":"آخرین تأیید موجودی:"} {new Date(data.lastConfirmedAt).toLocaleDateString(locale==="en"?"en-US":"fa-AF")}</Label>:null}
   </SectionCard>
   <SectionCard><Label weight="bold">{locale==="en"?"Property details":"مشخصات ملک"}</Label>
    <Label>{a.areaM2} m² {a.bedrooms!==undefined?" · "+a.bedrooms+" 🛏":""}{a.bathrooms!==undefined?" · "+a.bathrooms+" 🚿":""}</Label>
    {a.furnished!==undefined?<Label>{dt(locale,"furnished")}: {a.furnished?"✓":"✕"}</Label>:null}
    {a.parking!==undefined?<Label>{dt(locale,"parking")}: {a.parking?"✓":"✕"}</Label>:null}
    <Label>{d.description}</Label>
   </SectionCard>
   <SectionCard><Label weight="bold">{dt(locale,"profile")}</Label>
    <Label muted>{kind==="agency"?dt(locale,"agencyBadge"):data.publisher==="independent_agent"?dt(locale,"proBadge"):dt(locale,"contactBadge")}</Label>
    <Label muted>{dt(locale,"notOwnership")}</Label>
    <Action kind="secondary" label={dt(locale,"profile")} onPress={()=>router.push({pathname:"/advertiser/[kind]/[id]",params:{kind,id:profileId}})}/>
   </SectionCard>
   <Label muted>{dt(locale,"safeContact")}</Label>
   <Action kind="secondary" label={st(locale,"report")} onPress={()=>router.push({pathname:"/report/[listingId]",params:{listingId:id}})}/>
   {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  </Page>
  <View style={{gap:8,backgroundColor:colors.surface,padding:12,borderTopWidth:1,borderColor:colors.border,paddingBottom:20}}>
   <Action label={et(locale,"newInquiry")} disabled={!canContact} onPress={()=>router.push({pathname:"/inquiries/new",params:{listingId:id}})}/>
   <View style={{flexDirection:"row",gap:10}}>
   <View style={{flex:1}}><Action label={busy==="call"?"…":dt(locale,"call")} disabled={!canContact||!d.contact.allowPhone||busy!==null} onPress={()=>void contact("call")}/></View>
   <View style={{flex:1}}><Action kind="secondary" label={busy==="whatsapp"?"…":dt(locale,"whatsapp")} disabled={!canContact||!d.contact.allowWhatsApp||busy!==null} onPress={()=>void contact("whatsapp")}/></View>
   </View>
  </View>
 </View>;
}
