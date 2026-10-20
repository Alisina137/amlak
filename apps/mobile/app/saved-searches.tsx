import {router,useFocusEffect} from "expo-router";
import {useCallback,useEffect,useRef,useState} from "react";
import {Alert,Switch,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../src/auth";
import {usePreferences} from "../src/context";
import {useSearchFilters} from "../src/search-context";
import type {SearchFilters} from "../src/discovery-client";
import {savedFilterSummary} from "../src/saved-utils";
import {savedText} from "../src/saved-copy";
import {Action,AppInput,BackButton,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../src/ui";
type Saved={id:string;title:string;filters:Record<string,string>;alertsEnabled:boolean;createdAt:string};
const translations={
 en:{heading:"Saved searches",sub:"Revisit your filters and opt in to in-app alerts.",
  label:"Search name",name:"My property search",save:"Save current search",alerts:"New match and price-drop alerts",
  open:"Apply filters",remove:"Delete",empty:"No saved searches yet.",login:"Sign in to save searches.",
  fail:"Could not update saved searches. Try again.",max:"You can save up to 12 searches.",current:"Current search",
  back:"Go to property search",deleteTitle:"Delete saved search?",yes:"Delete",cancel:"Cancel",
  viewport:"A moved-map rectangle cannot be saved. Draw a custom area or clear the map filter first.",
  rename:"Rename search",saveName:"Save name",edit:"Rename",dismiss:"Cancel edit",count:"saved searches"},
 fa:{heading:"جستجوهای ذخیره‌شده",sub:"فیلترهای دلخواه و اعلان‌های داخل برنامه را مدیریت کنید.",
  label:"نام جستجو",name:"جستجوی ملک من",save:"ذخیره جستجوی فعلی",alerts:"اعلان ملک جدید و کاهش قیمت",
  open:"استفاده از فیلترها",remove:"حذف",empty:"هنوز جستجویی ذخیره نشده است.",login:"برای ذخیره جستجو وارد شوید.",
  fail:"ذخیره یا تغییر جستجو ممکن نشد.",max:"حداکثر ۱۲ جستجو می‌توانید ذخیره کنید.",current:"جستجوی فعلی",
  back:"بازگشت به جستجو",deleteTitle:"جستجو حذف شود؟",yes:"حذف",cancel:"انصراف",
  viewport:"محدودهٔ مستطیلی نقشه قابل ذخیره نیست؛ محدودهٔ دلخواه رسم کنید یا فیلتر نقشه را پاک کنید.",
  rename:"تغییر نام جستجو",saveName:"ذخیره نام",edit:"تغییر نام",dismiss:"لغو ویرایش",count:"جستجوی ذخیره‌شده"},
 ps:{heading:"خوندي شوې پلټنې",sub:"چاڼونه او د اپ خبرتیاوې اداره کړئ.",
  label:"د پلټنې نوم",name:"زما د ملکیت پلټنه",save:"اوسنۍ پلټنه خوندي کړه",alerts:"د نوو پایلو او بیې کمېدو خبرتیا",
  open:"چاڼونه وکاروه",remove:"ړنګول",empty:"تر اوسه پلټنه نشته.",login:"لومړی ننوزئ.",
  fail:"پلټنه خوندي یا بدله نشوه.",max:"تر ۱۲ پلټنو پورې خوندي کولی شئ.",current:"اوسنۍ پلټنه",
  back:"پلټنې ته ستنېدل",deleteTitle:"پلټنه ړنګه شي؟",yes:"ړنګول",cancel:"لغوه",
  viewport:"د نقشې مستطیلي سیمه نه خوندي کېږي؛ ځانګړې ساحه رسم یا چاڼ لرې کړئ.",
  rename:"د پلټنې نوم بدل کړه",saveName:"نوم خوندي کړه",edit:"نوم بدل کړه",dismiss:"سمون لغوه",count:"خوندي پلټنې"}
} as const;
export default function SavedSearches(){
 const {locale}=usePreferences(),copy=translations[locale],rtl=isRTL(locale);
 const {token}=useAuth(),{filters,replaceFilters}=useSearchFilters();
 const [snapshot,setSnapshot]=useState<{token:string|null;items:Saved[]}>({token:null,items:[]});
 const [title,setTitle]=useState(""),[alertsEnabled,setAlertsEnabled]=useState(false);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [editing,setEditing]=useState<string|null>(null),[editingTitle,setEditingTitle]=useState("");
 const tokenRef=useRef(token),epoch=useRef(0);tokenRef.current=token;
 const items=snapshot.token===token?snapshot.items:[];
 useEffect(()=>{setEditing(null);setTitle("");},[token]);
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setSnapshot({token:null,items:[]});setLoading(false);setError("");return;}
  setLoading(true);setError("");
  try{
   const response=await requestJson<{items:Saved[]}>("/v1/saved-searches",{token});
   if(version!==epoch.current||tokenRef.current!==token)return;
   setSnapshot({token,items:response.items});
  }catch{if(version===epoch.current&&tokenRef.current===token)setError(copy.fail);}
  finally{if(version===epoch.current&&tokenRef.current===token)setLoading(false);}
 },[token,copy.fail]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 async function change(id:string,body:{title?:string;alertsEnabled?:boolean}){
  if(!token||busy)return;
  setBusy(true);setError("");
  try{
   await requestJson("/v1/saved-searches/"+id,{token,method:"PATCH",body});
   setEditing(null);await load();
  }catch{setError(copy.fail);}finally{setBusy(false);}
 }
 async function create(){
  if(!token||busy||filters.viewport||items.length>=12)return;
  const name=(title||copy.name).trim();
  if(name.length<2)return;setBusy(true);setError("");
  try{
   const normalized=Object.fromEntries(Object.entries(filters).filter(([,v])=>v!==undefined&&v!=="")
    .map(([k,v])=>[k,String(v)]));
   await requestJson("/v1/saved-searches",{token,method:"POST",body:{title:name,filters:normalized,alertsEnabled}});
   setTitle("");await load();
  }catch{setError(copy.fail);}finally{setBusy(false);}
 }
 function remove(item:Saved){
  if(busy||!token)return;
  Alert.alert(copy.deleteTitle,item.title,[
   {text:copy.cancel,style:"cancel"},
   {text:copy.yes,style:"destructive",onPress:()=>{void (async()=>{
    if(!token||busy)return;setBusy(true);
    try{await requestJson("/v1/saved-searches/"+item.id,{token,method:"DELETE"});await load();}
    catch{setError(copy.fail);}finally{setBusy(false);}
   })();}}
  ]);
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={copy.heading} subtitle={copy.sub}/>
  {!token?<SectionCard><Label>{copy.login}</Label>
   <Action label={savedText(locale,"signIn")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:<>
   <SectionCard>
    <Label weight="bold">{copy.current}</Label>
    <Label muted style={{fontSize:13,lineHeight:20}}>{savedFilterSummary(filters,locale).join(" · ")||"—"}</Label>
    <Label>{copy.label}</Label>
    <AppInput accessibilityLabel={copy.label} value={title} onChangeText={setTitle}
     maxLength={80} placeholder={copy.name} editable={!busy}/>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:12}}>
     <Switch accessibilityLabel={copy.alerts} value={alertsEnabled} disabled={busy} onValueChange={setAlertsEnabled}/>
     <Label style={{flex:1,fontSize:14}}>{copy.alerts}</Label>
    </View>
    {filters.viewport?<StateNotice tone="warning" message={copy.viewport}/>:null}
    <Action label={copy.save} disabled={busy||items.length>=12||(title||copy.name).trim().length<2||!!filters.viewport}
     onPress={()=>void create()}/>
    <Label muted style={{fontSize:12}}>{copy.max}</Label>
   </SectionCard>
   {loading?<LoadingCard rows={3}/>:null}
   {!loading?<Label muted style={{fontSize:13}}>{formatNumber(items.length,locale)} / 12 {copy.count}</Label>:null}
   {!loading&&items.length===0?<SectionCard><Label muted>{copy.empty}</Label></SectionCard>:null}
   {!loading&&items.map(item=><SectionCard key={item.id}>
    <Label weight="bold" style={{fontSize:16}}>{item.title}</Label>
    <Label muted style={{fontSize:13,lineHeight:22}}>{savedFilterSummary(item.filters,locale).join(" · ")||savedText(locale,"unknown")}</Label>
    <StatusBadge tone={item.alertsEnabled?"success":"neutral"} label={savedText(locale,item.alertsEnabled?"alertOn":"alertOff")}/>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:12}}>
     <Switch accessibilityLabel={copy.alerts+" "+item.title} value={item.alertsEnabled}
      disabled={busy} onValueChange={v=>void change(item.id,{alertsEnabled:v})}/>
     <Label style={{flex:1,fontSize:13}}>{copy.alerts}</Label>
    </View>
    {editing===item.id?<View style={{gap:8}}>
     <Label>{copy.rename}</Label>
     <AppInput accessibilityLabel={copy.rename} value={editingTitle} maxLength={80}
      editable={!busy} onChangeText={setEditingTitle}/>
     <Action label={copy.saveName} disabled={busy||editingTitle.trim().length<2}
      onPress={()=>void change(item.id,{title:editingTitle.trim()})}/>
     <Action label={copy.dismiss} kind="secondary" onPress={()=>setEditing(null)}/>
    </View>:<Action kind="secondary" label={copy.edit} onPress={()=>{setEditing(item.id);setEditingTitle(item.title);}}/>}
    <Action label={copy.open} disabled={busy} onPress={()=>{
     replaceFilters(item.filters as SearchFilters);
     router.push("/(tabs)/search");
    }}/>
    <Action kind="secondary" label={copy.remove} disabled={busy} onPress={()=>remove(item)}/>
   </SectionCard>)}
  </>}
  {error?<StateNotice message={error} retryLabel={savedText(locale,"reload")} onRetry={()=>void load()}/>:null}
  <Action kind="secondary" label={copy.back} onPress={()=>router.push("/(tabs)/search")}/>
 </Page>;
}
