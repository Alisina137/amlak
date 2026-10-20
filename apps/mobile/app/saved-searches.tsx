import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {Alert,Switch,TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../src/auth";
import {usePreferences} from "../src/context";
import {useSearchFilters} from "../src/search-context";
import type {SearchFilters} from "../src/discovery-client";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../src/ui";
type Saved={id:string;title:string;filters:Record<string,string>;alertsEnabled:boolean;createdAt:string};
const translations={
 en:{heading:"Saved searches",sub:"Save filters and choose which searches should create in-app alerts.",
  label:"Search name",name:"My property search",save:"Save current search",alerts:"New match & price-drop alerts",
  open:"Use filters",remove:"Delete search",empty:"No saved searches yet.",login:"Sign in to save searches.",
  fail:"Could not update saved searches. Try again.",max:"Up to 12 saved searches.",current:"Current filters",
  back:"Back to search",deleteTitle:"Delete saved search?",yes:"Delete",cancel:"Cancel",viewport:"A moved-map rectangle cannot be saved. Draw a custom area on the map or clear the map filter first."},
 fa:{heading:"جستجوهای ذخیره‌شده",sub:"فیلترها را ذخیره کنید و اعلان‌های داخل برنامه را فعال کنید.",
  label:"نام جستجو",name:"جستجوی ملک من",save:"ذخیره جستجوی فعلی",alerts:"اعلان ملک جدید یا کاهش قیمت",
  open:"اعمال فیلترها",remove:"حذف جستجو",empty:"هنوز جستجویی ذخیره نشده است.",login:"برای ذخیره جستجو وارد شوید.",
  fail:"ذخیره یا تغییر جستجو ممکن نشد.",max:"حداکثر ۱۲ جستجو",current:"فیلترهای فعلی",
  back:"بازگشت به جستجو",deleteTitle:"جستجو حذف شود؟",yes:"حذف",cancel:"انصراف",viewport:"محدودهٔ مستطیلی نقشه قابل ذخیره نیست. محدودهٔ دلخواه رسم کنید یا فیلتر نقشه را پاک کنید."},
 ps:{heading:"خوندي شوې پلټنې",sub:"فلټرونه خوندي کړئ او د اپ دننه خبرتیاوې فعالې کړئ.",
  label:"د پلټنې نوم",name:"زما د ملکیت پلټنه",save:"اوسنۍ پلټنه خوندي کړه",alerts:"د نوې پایلې او بیې کمېدو خبرتیا",
  open:"فلټرونه وکاروه",remove:"پلټنه ړنګه کړه",empty:"تر اوسه هېڅ پلټنه نشته.",login:"لومړی ننوزئ.",
  fail:"پلټنه خوندي یا بدله نشوه.",max:"تر ۱۲ پلټنو پورې",current:"اوسني فلټرونه",
  back:"پلټنې ته ورشه",deleteTitle:"پلټنه ړنګه شي؟",yes:"ړنګه کړه",cancel:"لغوه",viewport:"د نقشې مستطیلي سیمه نه خوندي کېږي. ځانګړې ساحه رسم یا چاڼ لرې کړئ."}
};
export default function SavedSearches(){
 const {locale}=usePreferences(),copy=translations[locale],rtl=isRTL(locale);
 const {token}=useAuth(),{filters,replaceFilters}=useSearchFilters();
 const [items,setItems]=useState<Saved[]>([]),[title,setTitle]=useState(copy.name),
  [alertsEnabled,setAlertsEnabled]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const load=useCallback(async()=>{
  if(!token){setItems([]);return;}
  try{const response=await requestJson<{items:Saved[]}>("/v1/saved-searches",{token});setItems(response.items);setError("");}
  catch{setError(copy.fail);}
 },[token,copy.fail]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 async function create(){
  if(!token||!title.trim()||busy||filters.viewport)return;setBusy(true);
  try{
   const normalized=Object.fromEntries(Object.entries(filters).filter(([,v])=>v!==undefined&&v!=="")
    .map(([k,v])=>[k,String(v)]));
   await requestJson("/v1/saved-searches",{token,method:"POST",body:{
    title:title.trim(),filters:normalized,alertsEnabled}});
   await load();setTitle(copy.name);setError("");
  }catch{setError(copy.fail);}finally{setBusy(false);}
 }
 async function toggle(item:Saved,value:boolean){
  if(!token)return;
  try{await requestJson("/v1/saved-searches/"+item.id,{token,method:"PATCH",body:{alertsEnabled:value}});await load();}
  catch{setError(copy.fail);}
 }
 function remove(item:Saved){
  Alert.alert(copy.deleteTitle,item.title,[
   {text:copy.cancel,style:"cancel"},
   {text:copy.yes,style:"destructive",onPress:()=>{void (async()=>{
    try{await requestJson("/v1/saved-searches/"+item.id,{token,method:"DELETE"});await load();}
    catch{setError(copy.fail);}
   })();}}
  ]);
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={copy.heading} subtitle={copy.sub}/>
  {!token?<SectionCard><Label>{copy.login}</Label><Action label={locale==="en"?"Sign in":"ورود"} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/></SectionCard>:
  <>
   <SectionCard>
    <Label weight="bold">{copy.current}</Label>
    <Label muted>{Object.entries(filters).filter(([,v])=>v).map(([k,v])=>k+": "+v).join(" · ")||"—"}</Label>
    <Label>{copy.label}</Label>
    <TextInput accessibilityLabel={copy.label} value={title} onChangeText={setTitle}
     maxLength={80} placeholder={copy.name}
     style={{minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:10,padding:12,color:colors.text,
      textAlign:rtl?"right":"left",writingDirection:rtl?"rtl":"ltr"}}/>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:12}}>
     <Switch accessibilityLabel={copy.alerts} value={alertsEnabled} onValueChange={setAlertsEnabled}/>
     <View style={{flex:1}}><Label>{copy.alerts}</Label></View>
    </View>
    {filters.viewport?<Label muted>{copy.viewport}</Label>:null}
    <Action label={copy.save} disabled={busy||items.length>=12||!title.trim()||!!filters.viewport} onPress={()=>void create()}/>
    <Label muted>{copy.max}</Label>
   </SectionCard>
   {items.length===0?<SectionCard><Label>{copy.empty}</Label></SectionCard>:null}
   {items.map(item=><SectionCard key={item.id}>
    <Label weight="bold">{item.title}</Label>
    <Label muted>{Object.entries(item.filters).filter(([,v])=>v).map(([k,v])=>k+": "+v).join(" · ")}</Label>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:12}}>
     <Switch accessibilityLabel={copy.alerts+" "+item.title} value={item.alertsEnabled}
      onValueChange={v=>void toggle(item,v)}/>
     <View style={{flex:1}}><Label>{copy.alerts}</Label></View>
    </View>
    <Action label={copy.open} onPress={()=>{
     replaceFilters(item.filters as SearchFilters);
     router.push("/(tabs)/search");
    }}/>
    <Action kind="secondary" label={copy.remove} onPress={()=>remove(item)}/>
   </SectionCard>)}
  </>}
  {error?<Label style={{color:colors.error}}>{error}</Label>:null}
  <Action kind="secondary" label={copy.back} onPress={()=>router.push("/(tabs)/search")}/>
 </Page>;
}
