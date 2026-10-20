import {findProvince} from "@amlaklink/catalog";
import {router} from "expo-router";
import {useRef,useState} from "react";
import {useAuth,requestJson} from "../../src/auth";
import {authT} from "../../src/auth-copy";
import {ax} from "../../src/account-experience";
import {usePreferences} from "../../src/context";
import {Action,AppInput,BackButton,Label,Page,ScreenHeading,SectionCard,StateNotice,StatusBadge} from "../../src/ui";
export default function AgencyApply(){
 const {locale,provinceId}=usePreferences(),{token,user}=useAuth();
 const [name,setName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const lock=useRef(false),t=(key:Parameters<typeof authT>[1])=>authT(locale,key);
 const province=findProvince(provinceId);
 async function submit(){
  if(!token||!user?.verified||lock.current||name.trim().length<3||name.trim().length>160||!province)return;
  lock.current=true;setBusy(true);setError("");
  try{
   await requestJson("/v1/agencies/apply",{method:"POST",token,body:{name:name.trim(),provinceId}});
   router.replace("/(tabs)/account");
  }catch{setError(t("attempt"));}finally{lock.current=false;setBusy(false);}
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={t("applyAgency")} subtitle={ax(locale,"professionalDetails")}/>
  <SectionCard>
   <Label weight="bold">{ax(locale,"agency")}</Label>
   <StatusBadge tone="warning" label={ax(locale,"pending")}/>
   <Label muted style={{fontSize:13}}>{t("contactWarning")}</Label>
   {!token||!user?.verified?<StateNotice tone="warning" message={ax(locale,"permission")}/>:null}
   <Label>{t("agencyName")}</Label>
   <AppInput value={name} onChangeText={setName} accessibilityLabel={t("agencyName")} maxLength={160}
    editable={!busy} placeholder={t("agencyName")}/>
   <Label muted style={{fontSize:13}}>{t("province")}: {province?.names[locale]||provinceId}</Label>
   {error?<StateNotice message={error}/>:null}
   <Action disabled={busy||!user?.verified||!province||name.trim().length<3}
    label={busy?t("processing"):t("apply")} onPress={()=>void submit()}/>
   <Action kind="secondary" label={t("back")} onPress={()=>router.replace("/(tabs)/account")}/>
  </SectionCard>
 </Page>;
}
