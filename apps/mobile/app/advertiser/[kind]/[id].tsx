import {router,useLocalSearchParams} from "expo-router";
import {useEffect,useState} from "react";
import {ActivityIndicator,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {usePreferences} from "../../../src/context";
import {fetchAdvertiser,fetchAdvertiserProperties,type AdvertiserProfile} from "../../../src/discovery-client";
import {dt} from "../../../src/discovery-copy";
import {ListingCard} from "../../../src/listing-ui";
import type {ListingDTO} from "../../../src/listing-client";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../../src/ui";
export default function AdvertiserProfilePage(){
 const {id,kind}=useLocalSearchParams<{id:string;kind:string}>(),{locale}=usePreferences();
 const [profile,setProfile]=useState<AdvertiserProfile|null>(null),[list,setList]=useState<ListingDTO[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let active=true;setLoading(true);setError("");
  void Promise.all([fetchAdvertiser(kind,id),fetchAdvertiserProperties(kind,id)]).then(([person,items])=>{
   if(active){setProfile(person);setList(items.items);}
  }).catch(()=>{if(active)setError(dt(locale,"unknown"));}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[id,kind,locale]);
 return <Page><BackButton onPress={()=>router.back()}/>
  {loading?<ActivityIndicator color={colors.primary}/>:null}
  {error?<SectionCard><Label>{error}</Label></SectionCard>:null}
  {profile?<><ScreenHeading title={profile.name} subtitle={dt(locale,"profile")}/>
   <SectionCard><Label weight="bold">{dt(locale,"badges")}</Label>
    {profile.badges.map(b=><View key={b.kind} style={{gap:6}}>
     <Label style={{color:colors.primary}}>{b.kind==="agency_registration_reviewed"?dt(locale,"agencyBadge"):
      b.kind==="professional_application_reviewed"?dt(locale,"proBadge"):dt(locale,"contactBadge")}</Label>
     <Label muted>{b.kind==="agency_registration_reviewed"?
  (locale==="en"?"Staff reviewed the agency registration, not the title of its properties.":locale==="fa"?"کارمند ثبت دفتر را بررسی کرده است، نه سند مالکیت ملک‌های آن را.":"کارکوونکي د دفتر نوملیکنه کتلې ده، نه د ملکیتونو سندونه.") :
  b.kind==="professional_application_reviewed"?
  (locale==="en"?"Staff reviewed the professional application; ownership is not certified.":locale==="fa"?"درخواست فعالیت حرفه‌ای بررسی شده، اما مالکیت ملک تأیید نشده است.":"مسلکي غوښتنه کتل شوې؛ د ملکیت مالکیت نه دی تایید شوی.") :
  (locale==="en"?"The account email was confirmed; property ownership is unverified.":locale==="fa"?"ایمیل حساب تأیید شده؛ مالکیت ملک هنوز تأیید نشده است.":"د حساب ایمیل تایید شوی؛ د ملکیت مالکیت نه دی تایید شوی.")}</Label>
    </View>)}
    <Label style={{color:colors.warning}}>{dt(locale,"notOwnership")}</Label>
   </SectionCard>
   <Label weight="bold">{dt(locale,"profileListings")}</Label>
   {list.map(item=><ListingCard item={item} key={item.id}/>)}
   {!list.length?<SectionCard><Label muted>{dt(locale,"noResults")}</Label></SectionCard>:null}
  </>:null}
 </Page>;
}
