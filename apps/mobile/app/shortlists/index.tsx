import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
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
 const {locale}=usePreferences(),t=copy[locale],rtl=isRTL(locale),{token}=useAuth();
 const [items,setItems]=useState<List[]>([]),[title,setTitle]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const refresh=useCallback(async()=>{
  if(!token){setItems([]);setError("");return;}
  try{const res=await requestJson<{items:List[]}>("/v1/shortlists",{token});setItems(res.items);setError("");}
  catch{setError(t.error);}
 },[token,t.error]);
 useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
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
 return <Page><ScreenHeading title={t.title} subtitle={t.subtitle}/>
  {!token?<SectionCard><Label>{t.signin}</Label>
   <Action label={locale==="en"?"Sign in":"ورود"} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:<><SectionCard>
   <Label weight="bold">{t.create}</Label><Label>{t.name}</Label>
   <TextInput accessibilityLabel={t.name} value={title} onChangeText={setTitle}
    placeholder={t.placeholder} maxLength={100} style={{minHeight:48,padding:12,borderWidth:1,borderColor:colors.border,
     borderRadius:12,textAlign:rtl?"right":"left",writingDirection:rtl?"rtl":"ltr",color:colors.text}}/>
   <Action label={t.create} disabled={busy||title.trim().length<2} onPress={()=>void create()}/>
  </SectionCard>
  {!items.length?<SectionCard><Label muted>{t.empty}</Label></SectionCard>:null}
  {items.map(item=><SectionCard key={item.id}>
   <Label weight="bold">{item.title}</Label>
   <Label muted>{item.role==="owner"?locale==="en"?"Owner":"مالک":t.members} · {item.membershipStatus}</Label>
   {item.membershipStatus==="pending"?
    <Action disabled={busy} label={t.accept} onPress={()=>void accept(item.id)}/>:
    <Action kind="secondary" label={t.open}
     onPress={()=>router.push({pathname:"/shortlists/[id]",params:{id:item.id}})}/>}
  </SectionCard>)}</>}
  {busy?<ActivityIndicator color={colors.primary}/>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  <Action kind="secondary" label={t.retry} onPress={()=>void refresh()}/>
 </Page>;
}
