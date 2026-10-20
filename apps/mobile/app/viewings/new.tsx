import {router,useLocalSearchParams} from "expo-router";
import {useMemo,useState} from "react";
import {Pressable,TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {kabulSlots,requestId,displayKabul,requestViewing} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function NewViewing(){
 const {inquiryId}=useLocalSearchParams<{inquiryId:string}>(),{token}=useAuth(),{locale}=usePreferences();
 const options=useMemo(()=>kabulSlots(),[]);
 const [chosen,setChosen]=useState<string[]>([]),[note,setNote]=useState(""),[key,setKey]=useState(requestId()),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(){
  if(!token||chosen.length<2||chosen.length>3)return;
  setBusy(true);setError("");
  try{
   await requestViewing(inquiryId,token,chosen,note,key);setKey(requestId());router.replace({pathname:"/inquiries/[id]",params:{id:inquiryId}});
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <Page><ScreenHeading title={et(locale,"newViewing")} subtitle={et(locale,"pickSlots")}/>
  <SectionCard>
   <Label muted>{et(locale,"pending")}</Label>
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:9}}>
    {options.map(option=>{
     const selected=chosen.includes(option.iso);
     return <Pressable key={option.iso} accessibilityRole="button" accessibilityState={{selected}}
      onPress={()=>setChosen(before=>selected?before.filter(t=>t!==option.iso):before.length<3?[...before,option.iso]:before)}
      style={{padding:12,minHeight:46,borderWidth:1,borderRadius:12,borderColor:selected?colors.primary:colors.border,
       backgroundColor:selected?"#e0efe7":colors.surface}}>
      <Label style={{color:selected?colors.primary:colors.text}}>{selected?"✓ ":""}{displayKabul(option.date,locale)}</Label>
     </Pressable>;
    })}
   </View>
   <Label muted>{chosen.length}/3</Label>
   <Label>{et(locale,"noteForViewing")}</Label>
   <TextInput value={note} multiline maxLength={500} onChangeText={setNote} accessibilityLabel={et(locale,"noteForViewing")}
    style={{minHeight:80,padding:10,borderWidth:1,borderColor:colors.border,borderRadius:12,color:colors.text}}/>
   {error?<Label style={{color:colors.error}}>{error}</Label>:null}
   <Action disabled={busy||chosen.length<2} label={busy?et(locale,"sending"):et(locale,"newViewing")} onPress={()=>void submit()}/>
  </SectionCard>
  <BackButton onPress={()=>router.back()}/>
 </Page>;
}
