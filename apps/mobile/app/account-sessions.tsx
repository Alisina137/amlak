import {router,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {Alert,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../src/auth";
import {usePreferences} from "../src/context";
import {ax} from "../src/account-experience";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../src/ui";
type Session={id:string;createdAt:string;expiresAt:string;current:boolean};
const copy={
 en:{title:"Devices & active sessions",sub:"Protect your account by signing out sessions you do not recognize.",
 current:"This session",other:"Another signed-in session",all:"Sign out other devices",revoke:"Sign out this session",
 confirm:"Confirm sign out?",yes:"Sign out",cancel:"Cancel",refresh:"Refresh",error:"Could not load or revoke sessions.",
 login:"Sign in first",empty:"No active sessions",started:"Signed in",expiry:"Expires",privacy:"For privacy, AmlakLink displays session dates, not device tracking or precise locations.",
 allTitle:"Sign out from other devices?",allBody:"Those sessions will stop working. This current session remains active.",
 currentWarning:"This action also signs out this phone.",none:"No other sessions to revoke."},
 fa:{title:"دستگاه‌ها و نشست‌های فعال",sub:"نشست‌های ناشناس را برای حفاظت حساب قطع کنید.",
 current:"نشست فعلی",other:"نشست دستگاه دیگر",all:"خروج از دستگاه‌های دیگر",revoke:"خروج از این نشست",
 confirm:"خروج تأیید شود؟",yes:"خروج",cancel:"انصراف",refresh:"تازه‌سازی",error:"بارگیری یا قطع نشست ممکن نشد.",
 login:"ابتدا وارد شوید",empty:"نشست فعالی وجود ندارد",started:"آغاز نشست",expiry:"پایان اعتبار",privacy:"برای حریم خصوصی، زمان نشست نشان داده می‌شود، نه ردیابی دستگاه یا موقعیت دقیق.",
 allTitle:"از دیگر دستگاه‌ها خارج شوید؟",allBody:"نشست‌های دیگر غیرفعال می‌شوند و نشست فعلی باقی می‌ماند.",
 currentWarning:"با این کار از همین تلفن نیز خارج می‌شوید.",none:"نشست دیگری برای خروج نیست."},
 ps:{title:"وسیلي او فعالې ناستې",sub:"د خپل حساب ساتنې لپاره نااشنا ناستې وتړئ.",
 current:"اوسنۍ ناسته",other:"د بلې وسیلې ناسته",all:"له نورو وسیلو وتل",revoke:"له دې ناستې وتل",
 confirm:"وتل تایید کړئ؟",yes:"وتل",cancel:"لغوه",refresh:"تازه کول",error:"ناستې بار یا بندې نه شوې.",
 login:"لومړی ننوزئ",empty:"فعاله ناسته نشته",started:"د ننوتلو وخت",expiry:"تر دې پورې",privacy:"د شخصي خوندیتوب لپاره یوازې د ناستې وخت ښودل کېږي؛ کره ځای نه څارل کېږي.",
 allTitle:"له نورو وسیلو ووځئ؟",allBody:"نورې ناستې بندېږي او اوسنۍ فعاله پاتې کېږي.",
 currentWarning:"له همدې موبایل څخه هم وځئ.",none:"بله ناسته نشته."}
} as const;
function kabulDate(value:string,locale:"en"|"fa"|"ps"){
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return "—";
 return new Intl.DateTimeFormat(locale==="en"?"en-US":locale==="fa"?"fa-AF":"ps-AF",{
  timeZone:"Asia/Kabul",year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"
 }).format(date);
}
export default function AccountSessions(){
 const {token,signOut}=useAuth(),{locale}=usePreferences(),t=copy[locale],rtl=isRTL(locale);
 const [snapshot,setSnapshot]=useState<{token:string|null;items:Session[]}>({token:null,items:[]});
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const activeToken=useRef(token),epoch=useRef(0),lock=useRef(false);
 activeToken.current=token;
 const visible=snapshot.token===token?snapshot.items:[];
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setSnapshot({token:null,items:[]});setLoading(false);setError("");return;}
  setLoading(true);
  try{
   const response=await requestJson<{items:Session[]}>("/v1/auth/sessions",{token});
   if(activeToken.current===token&&epoch.current===version){setSnapshot({token,items:response.items});setError("");}
  }catch{if(activeToken.current===token&&epoch.current===version)setError(t.error);}
  finally{if(activeToken.current===token&&epoch.current===version)setLoading(false);}
 },[token,t.error]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 async function revoke(id?:string){
  if(!token||lock.current)return;
  lock.current=true;setBusy(true);setError("");
  try{
   if(id)await requestJson("/v1/auth/sessions/"+id,{method:"DELETE",token});
   else await requestJson("/v1/auth/sessions/revoke-others",{method:"POST",token,body:{confirm:true}});
   if(visible.some(x=>x.id===id&&x.current)){
    await signOut();router.replace("/(tabs)/account");
   }else await load();
  }catch{setError(t.error);}finally{lock.current=false;setBusy(false);}
 }
 function confirm(id?:string){
  const current=!!id&&visible.some(x=>x.id===id&&x.current);
  Alert.alert(id?t.confirm:t.allTitle,current?t.currentWarning:t.allBody,[
   {text:t.cancel,style:"cancel"},{text:t.yes,style:"destructive",onPress:()=>void revoke(id)}
  ]);
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={t.title} subtitle={t.sub}/>
  <SectionCard><Label muted style={{fontSize:13}}>{t.privacy}</Label>
   <Label muted style={{fontSize:13}}>{ax(locale,"sessionNote")}</Label>
  </SectionCard>
  {!token?<SectionCard><Label>{t.login}</Label></SectionCard>:null}
  {token?<SectionCard>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,alignItems:"center",justifyContent:"space-between"}}>
    <Label weight="bold">{formatNumber(visible.length,locale)} {t.title}</Label>
    <StatusBadge tone="neutral" label={t.current}/>
   </View>
   <Action kind="secondary" label={t.refresh} disabled={busy||loading} onPress={()=>void load()}/>
   <Action disabled={busy||loading||!visible.some(x=>!x.current)} label={t.all} onPress={()=>confirm()}/>
   {!visible.some(x=>!x.current)&&!loading?<Label muted style={{fontSize:12}}>{t.none}</Label>:null}
  </SectionCard>:null}
  {loading&&token?<LoadingCard rows={3}/>:null}
  {error?<StateNotice message={error} retryLabel={t.refresh} onRetry={()=>void load()}/>:null}
  {token&&!visible.length&&!loading?<SectionCard><Label muted>{t.empty}</Label></SectionCard>:null}
  {visible.map(row=><SectionCard key={row.id}>
   <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:8}}>
    <Label weight="medium" style={{flex:1}}>{row.current?t.current:t.other}</Label>
    <StatusBadge tone={row.current?"success":"neutral"} label={row.current?t.current:t.other}/>
   </View>
   <Label muted style={{fontSize:13}}>{t.started}: {kabulDate(row.createdAt,locale)}</Label>
   <Label muted style={{fontSize:13}}>{t.expiry}: {kabulDate(row.expiresAt,locale)}</Label>
   <Action kind="secondary" disabled={busy} label={t.revoke} onPress={()=>confirm(row.id)}/>
  </SectionCard>)}
 </Page>;
}
