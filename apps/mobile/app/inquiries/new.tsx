import {router,useLocalSearchParams} from "expo-router";
import {useState} from "react";
import {isRTL} from "@amlaklink/localization";
import {colors} from "@amlaklink/design-tokens";
import {useAuth} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {openInquiry,requestId} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {Action,AppInput,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
const viewingCopy={
 en:{intro:"Step 1 of 2 · Send a message first. After the conversation is created, choose 2–3 preferred visit times.",continue:"Continue to viewing times"},
 fa:{intro:"مرحلهٔ ۱ از ۲ · ابتدا پیام بفرستید؛ سپس ۲ تا ۳ زمان دلخواه برای بازدید انتخاب کنید.",continue:"ادامه به زمان‌های بازدید"},
 ps:{intro:"له ۲ څخه ۱ ګام · لومړی پیغام ولېږئ؛ بیا د لیدنې لپاره ۲–۳ وختونه وټاکئ.",continue:"د لیدنې وختونو ته دوام"}
} as const;
export default function NewInquiry(){
 const {listingId,intent}=useLocalSearchParams<{listingId:string;intent?:string}>(),{token,user}=useAuth(),{locale}=usePreferences();
 const viewingIntent=intent==="viewing";
 const [body,setBody]=useState(""),[key,setKey]=useState(requestId()),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(){
  if(!token||!listingId||body.trim().length<1||busy)return;
  setBusy(true);setError("");
  try{
   const r=await openInquiry(listingId,token,body.trim(),key);
   setKey(requestId());
   if(viewingIntent)router.replace({pathname:"/viewings/new",params:{inquiryId:r.id}});
   else router.replace({pathname:"/inquiries/[id]",params:{id:r.id}});
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={et(locale,viewingIntent?"newViewing":"newInquiry")} subtitle={et(locale,"inquiryPrompt")}/>
  {viewingIntent?<SectionCard><Label style={{fontSize:14,lineHeight:22}}>{viewingCopy[locale].intro}</Label></SectionCard>:null}
  <SectionCard>
   {token&&user?.verified?<><Label>{et(locale,"message")}</Label>
    <AppInput accessibilityLabel={et(locale,"message")} value={body} multiline maxLength={3000}
     onChangeText={setBody} placeholder={et(locale,"message")}
     style={{minHeight:140,textAlignVertical:"top",fontSize:16,textAlign:isRTL(locale)?"right":"left"}}/>
    {error?<Label style={{color:colors.error}}>{error}</Label>:null}
    <Action label={busy?et(locale,"sending"):viewingIntent?viewingCopy[locale].continue:et(locale,"send")} disabled={busy||body.trim().length===0} onPress={()=>void submit()}/></>:
    <><Label muted>{et(locale,"signInRequired")}</Label>
     <Action label={et(locale,"login")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/></>}
  </SectionCard>
  <Label muted>{et(locale,"safety")}</Label>
 </Page>;
}
