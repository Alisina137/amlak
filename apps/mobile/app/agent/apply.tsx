import {router} from "expo-router";
import {useRef,useState} from "react";
import {Switch,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {authT} from "../../src/auth-copy";
import {ax,professionalStatus} from "../../src/account-experience";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard,StateNotice,StatusBadge} from "../../src/ui";
export default function AgentApply(){
 const {token,user,refresh}=useAuth(),{locale}=usePreferences(),rtl=isRTL(locale),
  [accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const lock=useRef(false),t=(key:Parameters<typeof authT>[1])=>authT(locale,key);
 const status=user?.independentAgentStatus||"none";
 async function submit(){
  if(!token||!user?.verified||!accepted||lock.current||status==="approved"||status==="pending")return;
  lock.current=true;setBusy(true);setError("");
  try{
   await requestJson("/v1/agents/apply",{method:"POST",token,body:{acceptedProfessionalRules:true}});
   await refresh();router.replace("/(tabs)/account");
  }catch{setError(t("attempt"));}finally{lock.current=false;setBusy(false);}
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={t("agentApplication")} subtitle={ax(locale,"professionalDetails")}/>
  <SectionCard>
   <Label weight="bold">{ax(locale,"agent")}</Label>
   <StatusBadge label={professionalStatus(locale,status)}
    tone={status==="approved"?"success":status==="pending"?"warning":"neutral"}/>
   <Label muted style={{fontSize:13}}>{t("contactWarning")}</Label>
   {!token||!user?.verified?<StateNotice tone="warning" message={ax(locale,"permission")}/>:null}
   {status!=="approved"&&status!=="pending"?<>
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:12,alignItems:"center"}}>
     <Switch value={accepted} onValueChange={setAccepted} disabled={busy||!user?.verified}
      accessibilityLabel={t("agentRules")}/>
     <View style={{flex:1}}><Label>{t("agentRules")}</Label></View>
    </View>
    <Action disabled={busy||!accepted||!user?.verified} label={busy?t("processing"):t("apply")}
     onPress={()=>void submit()}/>
   </>:null}
   {error?<StateNotice message={error}/>:null}
   <Action kind="secondary" label={t("goAccount")} onPress={()=>router.replace("/(tabs)/account")}/>
  </SectionCard>
 </Page>;
}
