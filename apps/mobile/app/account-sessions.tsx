import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {Alert,View} from "react-native";
import {useAuth,requestJson} from "../src/auth";
import {usePreferences} from "../src/context";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../src/ui";
type Session={id:string;createdAt:string;expiresAt:string;current:boolean};
const copy={
 en:{title:"Active sessions",current:"This device",other:"Other device",all:"Sign out other devices",revoke:"Sign out",confirm:"Confirm sign out?",yes:"Sign out",cancel:"Cancel",refresh:"Refresh",error:"Connection unavailable",login:"Sign in first",empty:"No active sessions"},
 fa:{title:"نشست‌های فعال",current:"این دستگاه",other:"دستگاه دیگر",all:"خروج از دستگاه‌های دیگر",revoke:"خروج",confirm:"خروج تأیید شود؟",yes:"خروج",cancel:"انصراف",refresh:"تازه‌سازی",error:"اتصال برقرار نیست",login:"ابتدا وارد شوید",empty:"نشستی وجود ندارد"},
 ps:{title:"فعالې ناستې",current:"دا وسیله",other:"بله وسیله",all:"له نورو وسیلو وتل",revoke:"وتل",confirm:"وتل تایید کړئ؟",yes:"وتل",cancel:"لغوه کول",refresh:"تازه کول",error:"اړیکه نشته",login:"لومړی ننوزئ",empty:"فعاله ناسته نشته"}
} as const;
export default function AccountSessions(){
 const {token,signOut}=useAuth(),{locale}=usePreferences(),t=copy[locale];
 const [items,setItems]=useState<Session[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const load=useCallback(async()=>{
  if(!token){setItems([]);return;}
  setBusy(true);
  try{
   const response=await requestJson<{items:Session[]}>("/v1/auth/sessions",{token});
   setItems(response.items);setError("");
  }catch{setError(t.error);}finally{setBusy(false);}
 },[token,t.error]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 async function revoke(id?:string){
  if(!token||busy)return;setBusy(true);
  try{
   if(id)await requestJson("/v1/auth/sessions/"+id,{method:"DELETE",token});
   else await requestJson("/v1/auth/sessions/revoke-others",{method:"POST",token,body:{confirm:true}});
   if(items.some(x=>x.id===id&&x.current)){await signOut();router.replace("/(tabs)/account");}
   else await load();
  }catch{setError(t.error);}finally{setBusy(false);}
 }
 const visible=token?items:[];
 return <Page><BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={t.title}/>
  {!token?<SectionCard><Label>{t.login}</Label></SectionCard>:null}
  {token?<SectionCard>
   <Action kind="secondary" label={t.refresh} disabled={busy} onPress={()=>void load()}/>
   <Action label={t.all} disabled={busy||!visible.some(x=>!x.current)}
    onPress={()=>Alert.alert(t.confirm,undefined,[{text:t.cancel,style:"cancel"},
     {text:t.yes,style:"destructive",onPress:()=>void revoke()}])}/>
  </SectionCard>:null}
  {error?<SectionCard><Label>{error}</Label></SectionCard>:null}
  {token&&!visible.length&&!busy?<SectionCard><Label muted>{t.empty}</Label></SectionCard>:null}
  {visible.map(row=><SectionCard key={row.id}>
   <Label weight="bold">{row.current?t.current:t.other}</Label>
   <View><Label muted>{new Date(row.createdAt).toLocaleString()}</Label>
    <Label muted>{new Date(row.expiresAt).toLocaleString()}</Label></View>
   <Action kind="secondary" disabled={busy} label={t.revoke}
    onPress={()=>Alert.alert(t.confirm,undefined,[{text:t.cancel,style:"cancel"},
     {text:t.yes,style:"destructive",onPress:()=>void revoke(row.id)}])}/>
  </SectionCard>)}
 </Page>;
}
