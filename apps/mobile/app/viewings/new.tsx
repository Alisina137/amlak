import {router,useLocalSearchParams} from "expo-router";
import {useMemo,useState} from "react";
import {Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {useAuth} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {kabulSlots,requestId,displayKabul,requestViewing} from "../../src/engagement-client";
import {et} from "../../src/engagement-copy";
import {Action,AppInput,BackButton,Label,Page,ScreenHeading,SectionCard,StateNotice} from "../../src/ui";

const copy={
 en:{select:"Select two or three time options",selected:"Selected",first:"Your suggestions are not confirmed until the advertiser agrees.",invalid:"Open a conversation about this property before requesting a visit.",none:"No upcoming viewing times are currently offered.",signin:"Sign in to continue",timeZone:"Times are in Kabul (UTC+4:30)"},
 fa:{select:"دو یا سه زمان پیشنهادی را انتخاب کنید",selected:"انتخاب‌شده",first:"زمان‌های پیشنهادی تا تأیید آگهی‌دهنده قطعی نیستند.",invalid:"برای درخواست بازدید، ابتدا گفتگوی مربوط به ملک را آغاز کنید.",none:"اکنون زمانی برای بازدید پیشنهاد نشده است.",signin:"برای ادامه وارد شوید",timeZone:"تمام زمان‌ها به وقت کابل (۴:۳۰+) است"},
 ps:{select:"دوه یا درې وړاندیز شوي وختونه وټاکئ",selected:"غوره شوي",first:"وختونه تر هغه نه تاییدېږي، څو اعلان ورکوونکی یې ونه مني.",invalid:"د لیدنې غوښتنې لپاره لومړی د ملکیت خبرې پیل کړئ.",none:"اوس د لیدنې لپاره وختونه نشته.",signin:"د دوام لپاره ننوځئ",timeZone:"ټول وختونه د کابل په وخت (۴:۳۰+) دي"}
} as const;

export default function NewViewing(){
 const {inquiryId}=useLocalSearchParams<{inquiryId?:string}>(),{token}=useAuth(),{locale}=usePreferences();
 const rtl=isRTL(locale);
 const options=useMemo(()=>kabulSlots(),[]);
 const days=useMemo(()=>{
  const result:{key:string;date:Date;slots:typeof options}[]=[];
  for(const slot of options){
   const key=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kabul",year:"numeric",month:"2-digit",day:"2-digit"}).format(slot.date);
   const day=result.find(group=>group.key===key);
   if(day)day.slots.push(slot);
   else result.push({key,date:slot.date,slots:[slot]});
  }
  return result;
 },[options]);
 const [chosen,setChosen]=useState<string[]>([]),[note,setNote]=useState(""),[key,setKey]=useState(requestId()),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(){
  if(!token||!inquiryId||chosen.length<2||chosen.length>3||busy)return;
  setBusy(true);setError("");
  try{
   await requestViewing(inquiryId,token,chosen,note.trim(),key);
   setKey(requestId());
   router.replace({pathname:"/inquiries/[id]",params:{id:inquiryId}});
  }catch(e){setError((e as Error).message||et(locale,"unknown"));}finally{setBusy(false);}
 }
 if(!inquiryId)return <Page><BackButton onPress={()=>router.back()}/>
  <StateNotice message={copy[locale].invalid} tone="warning"/></Page>;
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={et(locale,"newViewing")} subtitle={et(locale,"pickSlots")}/>
  {!token?<SectionCard>
   <Label muted>{et(locale,"signInRequired")}</Label>
   <Action label={copy[locale].signin} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:<SectionCard>
   <Label weight="bold" style={{fontSize:16}}>{copy[locale].select}</Label>
   <Label muted style={{fontSize:12}}>{copy[locale].timeZone}</Label>
   {days.length===0?<Label muted>{copy[locale].none}</Label>:days.map(day=><View key={day.key} style={{gap:8}}>
    <Label weight="medium">{new Intl.DateTimeFormat(locale==="en"?"en-US":locale==="ps"?"ps-AF":"fa-AF",{
     timeZone:"Asia/Kabul",weekday:"long",month:"short",day:"numeric"
    }).format(day.date)}</Label>
    <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:8}}>
     {day.slots.map(option=>{
      const selected=chosen.includes(option.iso);
      return <Pressable key={option.iso} accessibilityRole="button"
       accessibilityLabel={displayKabul(option.date,locale)}
       accessibilityState={{selected,disabled:busy}} disabled={busy}
       onPress={()=>setChosen(before=>selected?before.filter(t=>t!==option.iso):before.length<3?[...before,option.iso]:before)}
       style={{paddingVertical:10,paddingHorizontal:12,minHeight:48,borderWidth:1,borderRadius:12,
        borderColor:selected?colors.primary:colors.border,backgroundColor:selected?"#e0efe7":colors.surface}}>
       <Label style={{color:selected?colors.primary:colors.text,fontSize:13}}>{selected?"✓ ":""}{displayKabul(option.date,locale)}</Label>
      </Pressable>;
     })}
    </View>
   </View>)}
   <Label weight="medium" style={{fontSize:13}}>{copy[locale].selected}: {formatNumber(chosen.length,locale)} / {formatNumber(3,locale)}</Label>
   <Label muted style={{fontSize:13}}>{copy[locale].first}</Label>
   <Label>{et(locale,"noteForViewing")}</Label>
   <AppInput value={note} multiline maxLength={500} onChangeText={setNote}
    editable={!busy} accessibilityLabel={et(locale,"noteForViewing")}
    style={{minHeight:92,textAlignVertical:"top"}}/>
   {error?<StateNotice message={error}/>:null}
   <Action disabled={busy||chosen.length<2||chosen.length>3} label={busy?et(locale,"sending"):et(locale,"newViewing")} onPress={()=>void submit()}/>
  </SectionCard>}
  <Label muted style={{fontSize:12}}>{et(locale,"safety")}</Label>
 </Page>;
}
