import {router} from "expo-router";
import {useEffect,useState} from "react";
import {Switch,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {t} from "@amlaklink/localization";
import {findProvince} from "@amlaklink/catalog";
import {usePreferences} from "../../src/context";
import {authT} from "../../src/auth-copy";
import {useAuth,requestJson} from "../../src/auth";
import {Action,Label,LanguagePicker,Page,ScreenHeading,SectionCard} from "../../src/ui";
type Membership={agencyId:string;name:string;agencyStatus:string;role:string;membershipStatus:string};
export default function Account(){
 const {locale,provinceId}=usePreferences(),{user,token,signOut,refresh,loading}=useAuth();
 const [agencies,setAgencies]=useState<Membership[]>([]),[busy,setBusy]=useState(false),[accept,setAccept]=useState(false),[message,setMessage]=useState("");
 const copy=(key:Parameters<typeof authT>[1])=>authT(locale,key);
 useEffect(()=>{if(!token){setAgencies([]);return;}
 let active=true;void requestJson<{items:Membership[]}>("/v1/agencies/mine",{token}).then(r=>{if(active)setAgencies(r.items);}).catch(()=>{});
 return()=>{active=false;};},[token]);
 async function activate(){
  if(!token || !accept)return;
  setBusy(true);setMessage("");
  try{await requestJson("/v1/advertiser/activate",{method:"POST",token,body:{acceptedRules:true}});
      await refresh();setMessage(copy("sellerActive"));}catch{setMessage(copy("attempt"));}finally{setBusy(false);}
 }
 return <Page>
  <ScreenHeading title={t(locale,"account")} subtitle={user?.displayName||t(locale,"guest")} />
  <SectionCard><Label weight="bold">{t(locale,"changeLanguage")}</Label><LanguagePicker/></SectionCard>
  {!user? <SectionCard>
   <Label muted>{loading?copy("processing"):copy("guestInfo")}</Label>
   <Action label={copy("login")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
   <Action kind="secondary" label={copy("register")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"register"}})}/>
  </SectionCard>:<>
   <SectionCard>
    <Label weight="bold">{user.displayName}</Label><Label muted>{user.email}</Label>
    <Label style={{color:user.verified?colors.success:colors.warning}}>{user.verified?copy("verified"):copy("notVerified")}</Label>
   </SectionCard>
   <SectionCard>
    <Label weight="bold">{copy("seller")}</Label>
    <Label muted>{copy("listingLater")}</Label>
    {user.advertiserEnabled?<Label style={{color:colors.success}}>{copy("sellerActive")}</Label>:<>
     <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
      <Switch accessibilityLabel={copy("sellerTerms")} value={accept} onValueChange={setAccept}/>
      <View style={{flex:1}}><Label>{copy("sellerTerms")}</Label></View>
     </View>
     <Action disabled={busy||!accept||!user.verified} label={copy("sellerActivate")} onPress={()=>void activate()}/>
    </>}
   </SectionCard>
   <SectionCard>
    <Label weight="bold">{copy("agency")}</Label>
    {agencies.map(a=><View key={a.agencyId} style={{gap:6}}>
      <Label weight="bold">{a.name}</Label><Label muted>{copy("status")}: {a.agencyStatus==="active"?copy("agencyActive"):copy("agencyPending")} · {a.role}</Label>
      {a.agencyStatus==="active"&&a.membershipStatus==="active"?
       <Action kind="secondary" label={copy("workspace")} onPress={()=>router.push({pathname:"/agency/[id]",params:{id:a.agencyId}})}/>:null}
    </View>)}
    <Label muted>{copy("contactWarning")}</Label>
    <Action kind="secondary" disabled={!user.verified} label={copy("applyAgency")} onPress={()=>router.push("/agency/apply")}/>
   </SectionCard>
   {message?<Label style={{color:colors.muted}}>{message}</Label>:null}
   <Action kind="secondary" label={copy("refresh")} onPress={()=>void refresh()}/>
   <Action kind="secondary" label={copy("logout")} onPress={()=>void signOut()}/>
  </>}
  <SectionCard><Label weight="bold">{t(locale,"privacy")}</Label><Label muted>{t(locale,"country")} · {findProvince(provinceId)?.names[locale]}</Label></SectionCard>
 </Page>;
}
