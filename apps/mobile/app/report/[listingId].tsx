import {router,useLocalSearchParams} from "expo-router";
import {useRef,useState} from "react";
import {Pressable,TextInput,View} from "react-native";
import * as Crypto from "expo-crypto";
import {colors} from "@amlaklink/design-tokens";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {st,reportReasons,reasonLabel} from "../../src/safety-copy";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function ReportProperty(){
 const {listingId}=useLocalSearchParams<{listingId:string}>(),{locale}=usePreferences(),{user,token}=useAuth();
 const [reason,setReason]=useState<typeof reportReasons[number]>("inaccurate_details"),[details,setDetails]=useState("");
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 const requestId=useRef(Crypto.randomUUID());
 async function submit(){
  if(!token||busy||details.trim().length<12)return;
  setBusy(true);setError("");
  try{
   await requestJson("/v1/properties/"+listingId+"/reports",{token,method:"POST",
    body:{reason,details:details.trim(),requestId:requestId.current}});
   setDone(true);
  }catch(e){setError((e as Error).message||st(locale,"error"));}finally{setBusy(false);}
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={st(locale,"report")} subtitle={st(locale,"warning")}/>
  {!token||!user?.verified?<SectionCard>
   <Label>{st(locale,"login")}</Label>
   <Action label={st(locale,"open")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:done?<SectionCard><Label style={{color:colors.success}}>{st(locale,"submitted")}</Label>
    <Action kind="secondary" label={st(locale,"close")} onPress={()=>router.back()}/>
   </SectionCard>:<SectionCard>
   <Label weight="bold">{st(locale,"reason")}</Label>
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{reportReasons.map(key=>
    <Pressable key={key} accessibilityRole="button" accessibilityState={{selected:reason===key}} onPress={()=>setReason(key)}
     style={{padding:11,borderRadius:12,minHeight:44,borderWidth:1,borderColor:reason===key?colors.primary:colors.border,
      backgroundColor:reason===key?"#dff0e8":colors.surface}}>
     <Label>{reasonLabel(locale,key)}</Label>
    </Pressable>)}</View>
   <Label>{st(locale,"details")}</Label>
   <TextInput multiline value={details} maxLength={2000} onChangeText={setDetails}
    accessibilityLabel={st(locale,"details")} style={{minHeight:125,padding:12,borderWidth:1,borderColor:colors.border,
     borderRadius:12,color:colors.text,textAlignVertical:"top"}}/>
   {error?<Label style={{color:colors.error}}>{error}</Label>:null}
   <Action label={st(locale,"submit")} disabled={busy||details.trim().length<12} onPress={()=>void submit()}/>
  </SectionCard>}
 </Page>;
}
