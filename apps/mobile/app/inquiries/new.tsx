import {router,useLocalSearchParams} from "expo-router";
import {useState} from "react";
import {TextInput} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {openInquiry,requestId} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function NewInquiry(){
 const {listingId}=useLocalSearchParams<{listingId:string}>(),{token,user}=useAuth(),{locale}=usePreferences();
 const [body,setBody]=useState(""),[key,setKey]=useState(requestId()),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(){
  if(!token||body.trim().length<1||busy)return;
  setBusy(true);setError("");
  try{
   const r=await openInquiry(listingId,token,body.trim(),key);
   setKey(requestId());router.replace({pathname:"/inquiries/[id]",params:{id:r.id}});
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <Page><ScreenHeading title={et(locale,"newInquiry")} subtitle={et(locale,"inquiryPrompt")}/>
  <SectionCard>
   {token&&user?.verified?<><Label>{et(locale,"message")}</Label>
    <TextInput accessibilityLabel={et(locale,"message")} value={body} multiline maxLength={3000}
     onChangeText={setBody} placeholder={et(locale,"message")}
     style={{minHeight:140,textAlignVertical:"top",borderColor:colors.border,borderWidth:1,borderRadius:12,padding:12,color:colors.text,fontSize:16}}/>
    {error?<Label style={{color:colors.error}}>{error}</Label>:null}
    <Action label={busy?et(locale,"sending"):et(locale,"send")} disabled={busy||body.trim().length===0} onPress={()=>void submit()}/></>:
    <><Label muted>{et(locale,"signInRequired")}</Label>
     <Action label={et(locale,"login")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/></>}
  </SectionCard>
  <Label muted>{et(locale,"safety")}</Label>
  <BackButton onPress={()=>router.back()}/>
 </Page>;
}
