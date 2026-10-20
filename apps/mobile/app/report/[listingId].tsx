import {router,useLocalSearchParams} from "expo-router";
import {useRef,useState} from "react";
import {Pressable,View} from "react-native";
import * as Crypto from "expo-crypto";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {st,reportReasons,reasonLabel} from "../../src/safety-copy";
import {Action,AppInput,BackButton,Label,Page,ScreenHeading,SectionCard,StateNotice} from "../../src/ui";
import {ox} from "../../src/owner-experience";
export default function ReportProperty(){
 const {listingId}=useLocalSearchParams<{listingId:string}>(),{locale}=usePreferences(),{user,token}=useAuth(),rtl=isRTL(locale);
 const [reason,setReason]=useState<typeof reportReasons[number]>("inaccurate_details"),[details,setDetails]=useState("");
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 const requestId=useRef(Crypto.randomUUID()),submitLock=useRef(false);
 async function submit(){
  if(!token||!user?.verified||!listingId||busy||submitLock.current||details.trim().length<12)return;
  submitLock.current=true;setBusy(true);setError("");
  try{
   await requestJson("/v1/properties/"+listingId+"/reports",{token,method:"POST",
    body:{reason,details:details.trim(),requestId:requestId.current}});
   setDone(true);
  }catch(e){setError(st(locale,"error"));}finally{submitLock.current=false;setBusy(false);}
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={st(locale,"report")} subtitle={st(locale,"warning")}/>
  {!token||!user?.verified?<SectionCard>
   <Label>{st(locale,"login")}</Label>
   <Action label={ox(locale,"logIn")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:done?<SectionCard><Label style={{color:colors.success}}>{st(locale,"submitted")}</Label>
    <Action kind="secondary" label={st(locale,"close")} onPress={()=>router.back()}/>
   </SectionCard>:<SectionCard>
   <Label weight="bold">{st(locale,"reason")}</Label>
   <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:8}}>{reportReasons.map(key=>
    <Pressable key={key} accessibilityRole="button" accessibilityState={{selected:reason===key}} onPress={()=>setReason(key)}
     style={{padding:11,borderRadius:12,minHeight:44,borderWidth:1,borderColor:reason===key?colors.primary:colors.border,
      backgroundColor:reason===key?"#dff0e8":colors.surface}}>
     <Label>{reasonLabel(locale,key)}</Label>
    </Pressable>)}</View>
   <Label>{st(locale,"details")}</Label>
   <AppInput multiline value={details} maxLength={2000} onChangeText={setDetails}
    accessibilityLabel={st(locale,"details")} editable={!busy} style={{minHeight:125,textAlignVertical:"top"}}/>
   {error?<StateNotice message={error}/>:null}
   <Action label={st(locale,"submit")} disabled={busy||details.trim().length<12} onPress={()=>void submit()}/>
  </SectionCard>}
 </Page>;
}
