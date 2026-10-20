import {router,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {ActivityIndicator,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {Action,AppInput,BackButton,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";
import {savedText} from "../../src/saved-copy";
type List={id:string;title:string;role:"owner"|"member";membershipStatus:"pending"|"active"};
const copy={
 en:{title:"Shared shortlists",subtitle:"Private property collections for up to five invited people.",
 create:"Create shortlist",name:"Shortlist name",placeholder:"Homes to visit",invite:"Invitation pending",
 accept:"Accept invitation",open:"Open shortlist",empty:"No shortlists yet.",signin:"Sign in to create or join shortlists.",
 error:"Could not update your shortlists.",retry:"Refresh",members:"Members"},
 fa:{title:"فهرست‌های مشترک",subtitle:"مجموعه‌های خصوصی ملک با حداکثر پنج عضو دعوت‌شده.",
 create:"ایجاد فهرست",name:"نام فهرست",placeholder:"خانه‌های مورد نظر",invite:"دعوت در انتظار",
 accept:"قبول دعوت",open:"بازکردن فهرست",empty:"هنوز فهرست مشترک ندارید.",signin:"برای ایجاد یا پیوستن وارد شوید.",
 error:"تغییر فهرست‌ها ممکن نشد.",retry:"تازه‌سازی",members:"اعضا"},
 ps:{title:"ګډ فهرستونه",subtitle:"د پنځو بلل شوو کسانو لپاره د ملکیت خصوصي فهرستونه.",
 create:"فهرست جوړ کړه",name:"د فهرست نوم",placeholder:"د لیدلو کورونه",invite:"بلنه لا نه ده منل شوې",
 accept:"بلنه ومنه",open:"فهرست پرانیزه",empty:"تر اوسه ګډ فهرست نشته.",signin:"د جوړولو لپاره ننوزئ.",
 error:"فهرست بدل نه شو.",retry:"بیا تازه کړه",members:"غړي"}
};
export default function Shortlists(){
 const {locale}=usePreferences(),t=copy[locale],{token}=useAuth();
 const [snapshot,setSnapshot]=useState<{token:string|null;items:List[]}>({token:null,items:[]});
 const [title,setTitle]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const epoch=useRef(0),tokenRef=useRef(token);tokenRef.current=token;
 const items=snapshot.token===token?snapshot.items:[];
 const refresh=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setSnapshot({token:null,items:[]});setError("");setLoading(false);return;}
  setLoading(true);
  try{
   const res=await requestJson<{items:List[]}>("/v1/shortlists",{token});
   if(version!==epoch.current||tokenRef.current!==token)return;
   setSnapshot({token,items:res.items});setError("");
  }catch{if(version===epoch.current&&tokenRef.current===token)setError(t.error);}
  finally{if(version===epoch.current&&tokenRef.current===token)setLoading(false);}
 },[token,t.error]);
 useFocusEffect(useCallback(()=>{void refresh();return()=>{epoch.current++;};},[refresh]));
 async function create(){
  if(!token||busy||title.trim().length<2)return;setBusy(true);setError("");
  try{const list=await requestJson<List>("/v1/shortlists",{token,method:"POST",body:{title:title.trim()}});
   setTitle("");await refresh();router.push({pathname:"/shortlists/[id]",params:{id:list.id}});
  }catch{setError(t.error);}finally{setBusy(false);}
 }
 async function accept(id:string){
  if(!token||busy)return;setBusy(true);
  try{await requestJson("/v1/shortlists/"+id+"/accept",{token,method:"POST"});await refresh();}
  catch{setError(t.error);}finally{setBusy(false);}
 }
 return <Page><BackButton onPress={()=>router.back()}/><ScreenHeading title={t.title} subtitle={t.subtitle}/>
  {!token?<SectionCard><Label>{t.signin}</Label>
   <Action label={locale==="en"?"Sign in":"ورود"} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:<><SectionCard>
   <Label weight="bold">{t.create}</Label><Label>{t.name}</Label>
   <AppInput accessibilityLabel={t.name} value={title} onChangeText={setTitle} editable={!busy}
    placeholder={t.placeholder} maxLength={100}/>
   <Action label={t.create} disabled={busy||title.trim().length<2} onPress={()=>void create()}/>
  </SectionCard>
  {loading?<LoadingCard rows={3}/>:null}
  {!loading&&!items.length?<SectionCard><Label muted>{t.empty}</Label></SectionCard>:null}
  {items.map(item=><SectionCard key={item.id}>
   <Label weight="bold">{item.title}</Label>
   <StatusBadge tone={item.membershipStatus==="pending"?"warning":"success"}
    label={savedText(locale,item.membershipStatus==="pending"?"pending":item.role==="owner"?"owner":"member")}/>
   {item.membershipStatus==="pending"?
    <Action disabled={busy} label={t.accept} onPress={()=>void accept(item.id)}/>:
    <Action kind="secondary" label={t.open}
     onPress={()=>router.push({pathname:"/shortlists/[id]",params:{id:item.id}})}/>}
  </SectionCard>)}</>}
  {busy?<ActivityIndicator color={colors.primary}/>:null}
  {error?<StateNotice message={error} retryLabel={t.retry} onRetry={()=>void refresh()}/>:null}
  <Action kind="secondary" label={t.retry} onPress={()=>void refresh()}/>
 </Page>;
}
