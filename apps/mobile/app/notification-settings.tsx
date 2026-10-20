import {useCallback,useEffect,useRef,useState} from "react";
import {router,useFocusEffect} from "expo-router";
import {ActivityIndicator,Switch,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth,requestJson} from "../src/auth";
import {usePreferences} from "../src/context";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard,StateNotice,LoadingCard} from "../src/ui";
import {ix} from "../src/inbox-experience";
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
const testCopy={
 en:{send:"Send a test notification",queued:"Test alert queued. An enabled worker must run before your device can receive it.",conflict:"This installation is registered to another account. Sign out of that account while online before enrolling this device.",devices:"Registered devices",worker:"Remote push needs an installed development build, valid EAS/FCM setup and a running delivery worker."},
 fa:{send:"ارسال اعلان آزمایشی",queued:"اعلان آزمایشی در صف قرار گرفت. برای دریافت آن در تلفن باید کارگر ارسال فعال باشد.",conflict:"این دستگاه به حساب دیگری وصل است. نخست از آن حساب هنگام اتصال به اینترنت خارج شوید.",devices:"دستگاه‌های ثبت‌شده",worker:"اعلان بیرونی به نسخهٔ توسعه‌ای، تنظیم درست EAS/FCM و اجرای کارگر ارسال نیاز دارد."},
 ps:{send:"ازمایښتي خبرتیا ولېږئ",queued:"ازمایښتي خبرتیا په کتار کې واچول شوه. د رسېدو لپاره باید د لېږلو دنده فعاله وي.",conflict:"دا وسیله له بل حساب سره ثبت ده. د انټرنېټ پر وخت له هغه حسابه ووځئ.",devices:"ثبت شوې وسیلې",worker:"بهرنۍ خبرتیا نصب شوې پرمختیايي نسخه، سم EAS/FCM او فعال لېږونکی غواړي."}
} as const;
type Choice="savedSearches"|"inquiries"|"viewings"|"account";
const kinds:Choice[]=["savedSearches","inquiries","viewings","account"];
export default function PushSettingsScreen(){
 const {locale}=usePreferences(),t=copy[locale],p=testCopy[locale],{user,token}=useAuth();
 const [snapshot,setSnapshot]=useState<{token:string|null;value:PushSettings|null}>({token:null,value:null});
 const state=snapshot.token===token?snapshot.value:null;
 const activeToken=useRef(token),epoch=useRef(0);
 activeToken.current=token;
 const [testMessage,setTestMessage]=useState("");
 const [permission,setPermission]=useState<string>(""),
 [busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{setTestMessage("");setError("");},[token]);
 const refresh=useCallback(async()=>{
  const request=++epoch.current;
  if(!token){setSnapshot({token:null,value:null});return;}
  try{const [r,permissionValue]=await Promise.all([readPushSettings(token),checkSystemPermission()]);
   if(activeToken.current!==token||request!==epoch.current)return;
   setSnapshot({token,value:r});setPermission(permissionValue);setError("");
  }catch{if(activeToken.current===token&&request===epoch.current)setError(t.error);}
 },[token,t.error]);
 useFocusEffect(useCallback(()=>{void refresh();return()=>{epoch.current++;};},[refresh]));
 async function change(patch:Partial<PushPreferences>,enableOnDevice=false){
  if(!token||busy)return;setBusy(true);setError("");
  try{
   if(enableOnDevice)await registerCurrentDevice(token,true);
   const r=await requestJson<{preferences:PushPreferences}>("/v1/push/preferences",{
    token,method:"PATCH",body:patch});
   if(activeToken.current===token)setSnapshot(prev=>prev.token===token&&prev.value?
    {token,value:{...prev.value,preferences:r.preferences}}:prev);
   await refresh();
  }catch(err){setError(err instanceof Error&&err.message==="PUSH_TOKEN_ALREADY_REGISTERED"?p.conflict:
   err instanceof Error&&["PUSH_PERMISSION_NOT_GRANTED","EAS_PROJECT_ID_REQUIRED",
   "PUSH_DEV_BUILD_REQUIRED","PUSH_PHYSICAL_DEVICE_REQUIRED"].includes(err.message)?err.message:t.error);}
  finally{setBusy(false);}
 }
 async function testDelivery(){
  if(!token||busy||!state?.serverConfigured||!state.preferences.enabled)return;
  setBusy(true);setError("");setTestMessage("");
  try{
   await requestJson("/v1/push/test",{method:"POST",token});
   if(activeToken.current===token)setTestMessage(p.queued);
  }catch{if(activeToken.current===token)setError(t.error);}
  finally{setBusy(false);}
 }
 const consented=!!state?.preferences.enabled;
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={t.title} subtitle={t.sub}/>
  <SectionCard><Label weight="bold">{ix(locale,"notices")}</Label>
   <Label muted style={{fontSize:13}}>{ix(locale,"settingsHint")}</Label>
   <Action kind="secondary" label={ix(locale,"inbox")} onPress={()=>router.push("/(tabs)/inbox")}/>
  </SectionCard>
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
   <Label muted>{p.devices}: {state?.registeredDevices||0}</Label>
   <Action disabled={busy||!state?.serverConfigured&&!consented||!nativePushAvailable()&&!consented}
    label={consented?t.disable:t.enable}
    onPress={()=>void change({enabled:!consented},!consented)}/>
   {consented?<Action kind="secondary" label={p.send} disabled={busy||!state?.serverConfigured}
    onPress={()=>void testDelivery()}/>:null}
   <Label muted>{p.worker}</Label>
   {testMessage?<Label style={{color:colors.primary}}>{testMessage}</Label>:null}
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
  {error?<StateNotice message={error} retryLabel={t.retry} onRetry={()=>void refresh()}/>:null}
  <Action kind="secondary" disabled={busy} label={t.retry} onPress={()=>void refresh()}/>
 </Page>;
}
