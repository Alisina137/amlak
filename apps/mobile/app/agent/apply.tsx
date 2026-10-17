import {router} from "expo-router";
import {useState} from "react";
import {Switch,View} from "react-native";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {authT} from "../../src/auth-copy";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function AgentApply(){
 const {token,refresh}=useAuth(),{locale}=usePreferences(),[accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const t=(key:Parameters<typeof authT>[1])=>authT(locale,key);
 async function submit(){
  if(!token||!accepted)return;
  setBusy(true);setError("");
  try{await requestJson("/v1/agents/apply",{method:"POST",token,body:{acceptedProfessionalRules:true}});
   await refresh();router.replace("/(tabs)/account");
  }catch{setError(t("attempt"));}finally{setBusy(false);}
 }
 return <Page><ScreenHeading title={t("agentApplication")} subtitle={t("contactWarning")}/>
  <SectionCard>
   <View style={{flexDirection:"row",gap:12,alignItems:"center"}}>
    <Switch value={accepted} onValueChange={setAccepted} accessibilityLabel={t("agentRules")}/>
    <View style={{flex:1}}><Label>{t("agentRules")}</Label></View>
   </View>
   {error?<Label>{error}</Label>:null}
   <Action disabled={busy||!accepted} label={busy?t("processing"):t("apply")} onPress={()=>void submit()}/>
   <Action kind="secondary" label={t("goAccount")} onPress={()=>router.back()}/>
  </SectionCard></Page>;
}
