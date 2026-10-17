import {findProvince} from "@amlaklink/catalog";
import {colors} from "@amlaklink/design-tokens";
import {router} from "expo-router";
import {useState} from "react";
import {TextInput} from "react-native";
import {useAuth,requestJson} from "../../src/auth";
import {authT} from "../../src/auth-copy";
import {usePreferences} from "../../src/context";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function AgencyApply(){
 const {locale,provinceId}=usePreferences(),{token}=useAuth(),[name,setName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const t=(key:Parameters<typeof authT>[1])=>authT(locale,key);
 async function submit(){
  if(!token||name.trim().length<3){setError(t("attempt"));return;}
  setBusy(true);setError("");
  try{await requestJson("/v1/agencies/apply",{method:"POST",token,body:{name:name.trim(),provinceId}});
    router.replace("/(tabs)/account");}
  catch{setError(t("attempt"));}finally{setBusy(false);}
 }
 return <Page><ScreenHeading title={t("applyAgency")} subtitle={t("contactWarning")}/>
 <SectionCard><Label>{t("agencyName")}</Label>
 <TextInput value={name} onChangeText={setName} accessibilityLabel={t("agencyName")} maxLength={160} style={{fontSize:16,borderRadius:12,borderWidth:1,borderColor:colors.border,padding:12,color:colors.text}}/>
 <Label muted>{t("province")}: {findProvince(provinceId)?.names[locale]}</Label>
 {error?<Label style={{color:colors.error}}>{error}</Label>:null}
 <Action disabled={busy} label={busy?t("processing"):t("apply")} onPress={()=>void submit()}/>
 <Action kind="secondary" label={t("back")} onPress={()=>router.back()}/></SectionCard></Page>;
}
