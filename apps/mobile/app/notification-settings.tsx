import {useCallback,useState} from "react";
import {router,useFocusEffect} from "expo-router";
import {ActivityIndicator,Switch,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth,requestJson} from "../src/auth";
import {usePreferences} from "../src/context";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../src/ui";
import {checkSystemPermission,nativePushAvailable,readPushSettings,registerCurrentDevice,
 type PushSettings,type PushPreferences} from "../src/push-client";
const copy={
 en:{title:"Push notifications",sub:"Decide whether AmlakLink may send alerts to this device. In-app messages always remain available.",
  enable:"Enable push alerts",disable:"Turn off push alerts",unsupported:"Remote push needs an installed Expo development build, not Expo Go.",
  server:"Push delivery is not configured on the server yet.",permission:"Phone permission",
  savedSearches:"Saved searches and price changes",inquiries:"Inquiries and new leads",viewings:"Viewing requests and updates",
  account:"Account, safety and support",enabled:"Enabled",disabled:"Off",blocked:"Blocked in phone settings",
  notGranted:"Not permitted yet",granted:"Allowed",busy:"Saving...",error:"Unable to change your notifications.",
  noAccount:"Sign in and verify your email to enable push.",retry:"Refresh",
  disclaimer:"Notifications may arrive late. Always check your inbox for up-to-date information."},
 fa:{title:"اعلان‌های تلفن",sub:"انتخاب کنید که آیا املاک لینک به تلفن شما اعلان بفرستد. پیام‌های داخل برنامه همیشه قابل دسترس هستند.",
  enable:"فعال‌کردن اعلان‌ها",disable:"خاموش‌کردن اعلان‌ها",unsupported:"اعلان‌های بیرونی نیاز به نسخه توسعه‌ای نصب‌شده دارد، نه Expo Go.",
  server:"ارسال اعلان در سرور هنوز فعال نیست.",permission:"اجازه تلفن",
  savedSearches:"جستجوهای ذخیره‌شده و کاهش قیمت",inquiries:"پرسش‌ها و درخواست‌های جدید",
  viewings:"درخواست‌ها و تغییرات بازدید",account:"حساب، امنیت و پشتیبانی",
  enabled:"فعال",disabled:"خاموش",blocked:"در تنظیمات تلفن مسدود است",
  notGranted:"هنوز اجازه داده نشده",granted:"مجاز",busy:"در حال ذخیره...",error:"تغییر اعلان‌ها ممکن نشد.",
  noAccount:"برای فعال‌کردن اعلان، وارد شوید و ایمیل خود را تأیید کنید.",retry:"تازه‌سازی",
  disclaimer:"اعلان‌ها ممکن است با تأخیر برسند؛ برای اطلاعات تازه همیشه صندوق پیام‌ها را بررسی کنید."},
 ps:{title:"د موبایل خبرتیاوې",sub:"تاسو وټاکئ چې املاک لینک ستاسو موبایل ته خبرتیا ولېږي. د اپ پیغامونه تل شته.",
  enable:"خبرتیاوې فعالې کړه",disable:"خبرتیاوې بندې کړه",unsupported:"د موبایل خبرتیاوو لپاره د Expo پرمختیايي نسخه پکار ده، Expo Go نه.",
  server:"په سرور کې د خبرتیاوو استول لا نه دي تنظیم شوي.",permission:"د موبایل اجازه",
  savedSearches:"خوندي پلټنې او د بیې بدلون",inquiries:"پوښتنې او نوي غوښتنلیکونه",
  viewings:"د لیدنې غوښتنې او بدلونونه",account:"حساب، خوندیتوب او ملاتړ",
  enabled:"فعال",disabled:"بند",blocked:"د موبایل په تنظیماتو کې بند",
  notGranted:"لا اجازه نشته",granted:"اجازه لري",busy:"خوندي کېږي...",error:"خبرتیاوې بدلې نه شوې.",
  noAccount:"د خبرتیاوو لپاره ننوزئ او ایمیل تایید کړئ.",retry:"بیا تازه کړه",
  disclaimer:"خبرتیاوې کېدای شي ناوخته ورسېږي؛ د تازه مالوماتو لپاره پیغامونه وګورئ."}
};
type Choice="savedSearches"|"inquiries"|"viewings"|"account";
const kinds:Choice[]=["savedSearches","inquiries","viewings","account"];
export default function PushSettingsScreen(){
 const {locale}=usePreferences(),t=copy[locale],{user,token}=useAuth();
 const [state,setState]=useState<PushSettings|null>(null),[permission,setPermission]=useState<string>(""),
 [busy,setBusy]=useState(false),[error,setError]=useState("");
 const refresh=useCallback(async()=>{
  if(!token){setState(null);return;}
  try{const [r,p]=await Promise.all([readPushSettings(token),checkSystemPermission()]);
   setState(r);setPermission(p);setError("");
  }catch{setError(t.error);}
 },[token,t.error]);
 useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
 async function change(patch:Partial<PushPreferences>,enableOnDevice=false){
  if(!token||busy)return;setBusy(true);setError("");
  try{
   if(enableOnDevice)await registerCurrentDevice(token,true);
   const r=await requestJson<{preferences:PushPreferences}>("/v1/push/preferences",{
    token,method:"PATCH",body:patch});
   setState(prev=>prev?{...prev,preferences:r.preferences}:prev);
   await refresh();
  }catch(err){setError(err instanceof Error&&["PUSH_PERMISSION_NOT_GRANTED","EAS_PROJECT_ID_REQUIRED",
   "PUSH_DEV_BUILD_REQUIRED","PUSH_PHYSICAL_DEVICE_REQUIRED"].includes(err.message)?err.message:t.error);}
  finally{setBusy(false);}
 }
 const consented=!!state?.preferences.enabled;
 return <Page>
  <ScreenHeading title={t.title} subtitle={t.sub}/>
  {!token||!user?.verified?<SectionCard><Label>{t.noAccount}</Label>
   <Action label={locale==="en"?"Sign in":"ورود"} onPress={()=>
    router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:<><SectionCard>
   <Label weight="bold">{t.permission}</Label>
   {!nativePushAvailable()?<Label style={{color:colors.warning}}>{t.unsupported}</Label>:null}
   {!state?.serverConfigured?<Label style={{color:colors.warning}}>{t.server}</Label>:null}
   <Label muted>{permission==="blocked"?t.blocked:
    permission==="granted"?t.granted:t.notGranted}</Label>
   <Label weight="bold">{consented?t.enabled:t.disabled}</Label>
   <Action disabled={busy||!state?.serverConfigured&&!consented||!nativePushAvailable()&&!consented}
    label={consented?t.disable:t.enable}
    onPress={()=>void change({enabled:!consented},!consented)}/>
  </SectionCard>
  <SectionCard>
   {kinds.map(kind=><View key={kind}
    style={{minHeight:56,flexDirection:locale==="en"?"row":"row-reverse",alignItems:"center",gap:8}}>
    <View style={{flex:1}}><Label>{t[kind]}</Label></View>
    <Switch accessibilityLabel={t[kind]} disabled={busy||!state} value={!!state?.preferences[kind]}
     onValueChange={checked=>void change({[kind]:checked})}/>
   </View>)}
  </SectionCard></>}
  <SectionCard><Label muted>{t.disclaimer}</Label></SectionCard>
  {busy?<ActivityIndicator color={colors.primary}/>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  <Action kind="secondary" disabled={busy} label={t.retry} onPress={()=>void refresh()}/>
 </Page>;
}
