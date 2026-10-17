import {useEffect,useRef,useState} from "react";
import {router,useLocalSearchParams} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Image,Pressable,ScrollView,TextInput,View,ActivityIndicator} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {findProvince,searchProvinces} from "@amlaklink/catalog";
import {listingDraftSchema,type ListingDraft} from "@amlaklink/contracts";
import {useAuth,requestJson} from "../../../src/auth";
import {usePreferences} from "../../../src/context";
import {lt,priceSummary} from "../../../src/listing-ui";
import {getOwned,photoSource,uploadPhoto,type ListingDTO} from "../../../src/listing-client";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../../src/ui";
const steps={
 en:["Category","Transaction","Location","Property details","Pricing","Photos","Contact","Review"],
 fa:["نوع ملک","معامله","موقعیت","مشخصات ملک","قیمت","عکس‌ها","تماس","بررسی"],
 ps:["د ملکیت ډول","معامله","ځای","ځانګړنې","بیه","انځورونه","اړیکه","بیاکتنه"]
};
const labels={
 en:{title:"Title",description:"Description",province:"Province",city:"City",district:"District",neighborhood:"Neighborhood",address:"Street address (kept private)",area:"Area (m²)",bedrooms:"Bedrooms",bathrooms:"Bathrooms",floor:"Floor",floors:"Total floors",frontage:"Frontage (m)",currency:"Currency",salePrice:"Asking price",rent:"Monthly rent",deposit:"Refundable deposit / advance (0 allowed)",principal:"Refundable gharawi principal",duration:"Duration in months",refund:"Refund terms",maint:"Monthly maintenance",phone:"Telephone number",whatsapp:"WhatsApp number",enablePhone:"Allow telephone calls",enableWhatsapp:"Allow WhatsApp",precise:"Share exact coordinates publicly",photo:"Choose and upload a property photo",preview:"Preview / submission checks",save:"Save draft",next:"Save & next",back:"Previous",submit:"Submit for moderation",rejected:"This revision was rejected; edit and resubmit.",review:"Submitted for staff review. The approved public version stays unchanged.",pending:"Under review",approval:"Approved version visible publicly",required:"Complete required fields before submission",offline:"Offline draft saved on this device; server not yet updated.",conflict:"Draft changed elsewhere; reload before saving.",withdraw:"Withdraw submitted revision"},
 fa:{title:"عنوان",description:"توضیحات",province:"ولایت",city:"شهر",district:"ناحیه / ولسوالی",neighborhood:"محله / گذر",address:"آدرس دقیق (خصوصی)",area:"مساحت (متر مربع)",bedrooms:"اتاق خواب",bathrooms:"تشناب",floor:"طبقه",floors:"تعداد طبقات",frontage:"بر زمین (متر)",currency:"پول",salePrice:"قیمت فروش",rent:"کرایه ماهانه",deposit:"پول پیش / تضمین (صفر نیز مجاز)",principal:"اصل پول قابل بازپرداخت گروی",duration:"مدت به ماه",refund:"شرایط بازپرداخت گروی",maint:"مصرف ماهانه خدمات",phone:"شماره تماس",whatsapp:"شماره واتساپ",enablePhone:"تماس تلفنی فعال",enableWhatsapp:"واتساپ فعال",precise:"نمایش مختصات دقیق برای همه",photo:"انتخاب و بارگذاری عکس ملک",preview:"بررسی معلومات پیش از ارسال",save:"ذخیره پیش‌نویس",next:"ذخیره و ادامه",back:"قبلی",submit:"ارسال برای بررسی",rejected:"این نسخه رد شده است؛ اصلاح و دوباره ارسال کنید.",review:"برای بررسی مسئول ارسال شد. نسخهٔ نشرشده تغییر نمی‌کند.",pending:"در حال بررسی",approval:"نسخهٔ تأییدشده برای عموم قابل مشاهده است",required:"تمام معلومات ضروری را تکمیل کنید",offline:"نسخهٔ محلی ذخیره شد؛ هنوز به سرور نرسیده است.",conflict:"ملک در جای دیگری تغییر یافته؛ دوباره دریافت کنید.",withdraw:"پس گرفتن نسخهٔ ارسال‌شده"},
 ps:{title:"سرلیک",description:"تشریح",province:"ولایت",city:"ښار",district:"ولسوالي / ناحیه",neighborhood:"سیمه",address:"د کوڅې پته (خصوصي)",area:"مساحت (متر مربع)",bedrooms:"خوب خونې",bathrooms:"تشنابونه",floor:"پوړ",floors:"ټول پوړونه",frontage:"مخ (متر)",currency:"پیسې",salePrice:"د پلور بیه",rent:"میاشتنۍ کرایه",deposit:"بېرته ورکړه / مخکې ورکړه (صفر هم شونی)",principal:"د ګروۍ بېرته ورکړه",duration:"موده په میاشتو",refund:"د بېرته ورکولو شرطونه",maint:"میاشتنۍ خدمت فیس",phone:"تلیفون شمېره",whatsapp:"واټساپ شمېره",enablePhone:"تلیفون فعال",enableWhatsapp:"واټساپ فعال",precise:"دقیق ځای عام ښکاره کول",photo:"د ملک انځور واچوئ",preview:"د سپارلو معلومات وګورئ",save:"مسوده خوندي کړه",next:"خوندي او بل ګام",back:"مخکې",submit:"کتنې ته ولېږئ",rejected:"دا نسخه رد شوې. سمون او بیا یې وسپارئ.",review:"کتنې ته ولېږل شو. مخکینی خپور شوی معلومات پاتې دي.",pending:"د کتنې لاندې",approval:"منل شوی معلومات خلکو ته ښکاري",required:"ټول ضروري معلومات ډک کړئ",offline:"مسوده په دې وسیله خوندي شوه، سرور ته نه ده تللې.",conflict:"مسوده بل ځای بدله شوې، بیا یې راواخلئ.",withdraw:"سپارل شوې نسخه بېرته واخلئ"}
} as const;
type Key=keyof typeof labels.en;
export default function ListingEditor(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{token}=useAuth();
 const [pendingImage,setPendingImage]=useState<{uri:string;mime:string;bytes?:number}|null>(null);
 const [data,setData]=useState<ListingDraft>(listingDraftSchema.parse({})),[status,setStatus]=useState("draft"),[revisionStatus,setRevisionStatus]=useState("draft"),[revisionReason,setRevisionReason]=useState("");
 const [version,setVersion]=useState(1),[step,setStep]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),
 [error,setError]=useState(""),[notice,setNotice]=useState(""),[provinceQuery,setProvinceQuery]=useState("");
 const latest=useRef(data),versionRef=useRef(1),saveChain=useRef<Promise<void>>(Promise.resolve()),loaded=useRef(false);
 const tx=(key:Key)=>labels[locale][key];
 const localKey="amlak:draft:"+id;
 const mutable=revisionStatus!=="submitted" && !["sold","rented","archived"].includes(status);
 const change=(value:ListingDraft)=>{latest.current=value;setData(value);};
 const field=(section:"location"|"attributes"|"price"|"contact",key:string,value:unknown)=>{
  change({...latest.current,[section]:{...latest.current[section],[key]:value}});
 };
 async function refresh(){
  if(!token||!id)return;
  setLoading(true);setError("");
  try{
   const response=await getOwned(id,token);
   const saved=await AsyncStorage.getItem(localKey).catch(()=>null);
   let doc=response.data;
   if(saved){
    try{const cached=JSON.parse(saved) as {version:number;data:unknown;unsynced:boolean};
     const result=listingDraftSchema.safeParse(cached.data);
     if(result.success && cached.version===response.version && cached.unsynced && response.revisionStatus!=="submitted")doc=result.data;
    }catch{}
   }
   change(doc);versionRef.current=response.version;setVersion(response.version);
   setStatus(response.status);setRevisionStatus(response.revisionStatus||"approved");setRevisionReason(response.revisionReason||"");loaded.current=true;
  }catch{setError(tx("offline"));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[id,token]);
 async function save(){
  if(!token||!id||!loaded.current||!mutable)return;
  const snapshot=latest.current;
  saveChain.current=saveChain.current.catch(()=>{}).then(async()=>{
    const r=await requestJson<{version:number;status:string}>("/v1/listings/"+id+"/draft",{method:"PUT",token,body:{expectedVersion:versionRef.current,data:snapshot}});
    versionRef.current=r.version;setVersion(r.version);setStatus(r.status);
    await AsyncStorage.setItem(localKey,JSON.stringify({version:r.version,data:snapshot,unsynced:false})).catch(()=>{});
  });
  return saveChain.current;
 }
 useEffect(()=>{
  if(!loaded.current||!mutable)return;
  void AsyncStorage.setItem(localKey,JSON.stringify({version:versionRef.current,data,unsynced:true})).catch(()=>{});
  const timer=setTimeout(()=>{void save().catch(()=>setNotice(tx("offline")));},1800);
  return()=>clearTimeout(timer);
 },[data,id,token,mutable]);
 async function next(){
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{await save();setStep(s=>Math.min(s+1,7));}catch{setError(tx("conflict"));}finally{setBusy(false);}
 }
 async function submit(){
  if(busy||!token)return;setBusy(true);setError("");setNotice("");
  try{
   await save();
   await requestJson("/v1/listings/"+id+"/submit",{method:"POST",token,body:{expectedVersion:versionRef.current}});
   setRevisionStatus("submitted");setStatus(s=>s==="published"?"published":"pending_review");setNotice(tx("review"));
   await AsyncStorage.removeItem(localKey).catch(()=>{});
  }catch(e){
   setError((e as Error).message==="LISTING_VALIDATION_FAILED"?tx("required"):(e as Error).message);
  }finally{setBusy(false);}
 }
 async function withdraw(){
  if(!token)return;setBusy(true);setError("");
  try{await requestJson("/v1/listings/"+id+"/withdraw",{method:"POST",token});await refresh();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function transmitPhoto(asset:{uri:string;mime:string;bytes?:number}){
  if(!token||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await uploadPhoto(id,token,asset.uri,asset.mime);
   change({...latest.current,photoIds:[...latest.current.photoIds,response.id]});
   await save();setNotice(locale==="en"?"Photo uploaded":"عکس بارگذاری شد");
   setPendingImage(null);
  }catch(err){
   setPendingImage(asset);setError((err as Error).message);
  }finally{setBusy(false);}
 }
 async function choosePhoto(){
  if(!token||busy)return;
  const selection=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:0.8,allowsMultipleSelection:false});
  if(selection.canceled||!selection.assets[0])return;
  const a=selection.assets[0];
  const asset={uri:a.uri,mime:a.mimeType||"image/jpeg",bytes:a.fileSize};
  setPendingImage(asset);await transmitPhoto(asset);
 }
 function chooseItem<S extends keyof ListingDraft>(key:S,value:ListingDraft[S]){change({...latest.current,[key]:value});}
 const numeric=(section:"attributes"|"price",key:string,lab:string,opt=false)=>
  <Field label={lab} key={key} numeric value={String((data[section] as Record<string,unknown>)[key]??"")} onChange={v=>field(section,key,v.trim()===""?(opt?undefined:0):Number(v))}/>;
 const form=()=>{
  if(step===0)return <SectionCard><Label weight="bold">{locale==="en"?"Property category":"نوع ملک"}</Label>
   {(["house","apartment","land","shop","office","commercial"] as const).map(p=><Action key={p} kind={data.propertyType===p?"primary":"secondary"} label={lt(locale,p)} onPress={()=>chooseItem("propertyType",p)}/>)}
  </SectionCard>;
  if(step===1)return <SectionCard><Label weight="bold">{locale==="en"?"Transaction type":"نوع معامله"}</Label>
   {(["sale","rent","gharawi"] as const).map(p=><Action key={p} kind={data.transactionType===p?"primary":"secondary"} label={lt(locale,p)} onPress={()=>chooseItem("transactionType",p)}/>)}
  </SectionCard>;
  if(step===2)return <SectionCard>
   <Field label={tx("province")} value={provinceQuery} onChange={setProvinceQuery} placeholder={findProvince(data.location.provinceId)?.names[locale]}/>
   <View style={{maxHeight:215,overflow:"hidden"}}>
    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
     {searchProvinces(provinceQuery,locale).map(p=><Pressable key={p.id} onPress={()=>{field("location","provinceId",p.id);setProvinceQuery("");}} style={{padding:8,minHeight:42}}>
      <Label style={{color:data.location.provinceId===p.id?colors.primary:colors.text}}>{p.names[locale]} {data.location.provinceId===p.id?"✓":""}</Label>
     </Pressable>)}
    </ScrollView>
   </View>
   <Field label={tx("city")} value={data.location.city} onChange={v=>field("location","city",v)}/>
   <Field label={tx("district")} value={data.location.district} onChange={v=>field("location","district",v)}/>
   <Field label={tx("neighborhood")} value={data.location.neighborhood} onChange={v=>field("location","neighborhood",v)}/>
   <Field label={tx("address")} value={data.location.streetAddress||""} onChange={v=>field("location","streetAddress",v)}/>
   <Action kind="secondary" label={data.location.precision==="approximate"?"✓ "+(locale==="en"?"Approximate map location":"موقعیت تقریبی"):(locale==="en"?"Exact position":"موقعیت دقیق")} onPress={()=>field("location","precision",data.location.precision==="approximate"?"exact":"approximate")}/>
  </SectionCard>;
  if(step===3)return <SectionCard>
   <Field label={tx("title")} value={data.title} onChange={v=>chooseItem("title",v)}/>
   <Field label={tx("description")} multiline value={data.description} onChange={v=>chooseItem("description",v)}/>
   {numeric("attributes","areaM2",tx("area"))}
   {data.propertyType!=="land"?<>{numeric("attributes","bedrooms",tx("bedrooms"),true)}{numeric("attributes","bathrooms",tx("bathrooms"),true)}</>:numeric("attributes","landFrontageM",tx("frontage"),true)}
   {data.propertyType==="apartment"?<>{numeric("attributes","floor",tx("floor"),true)}{numeric("attributes","totalFloors",tx("floors"),true)}</>:null}
  </SectionCard>;
  if(step===4)return <SectionCard>
   <Label>{tx("currency")}</Label>
   <View style={{flexDirection:"row",gap:8}}>{(["AFN","USD"] as const).map(c=><View key={c} style={{flex:1}}><Action kind={data.price.currency===c?"primary":"secondary"} label={c} onPress={()=>field("price","currency",c)}/></View>)}</View>
   {data.transactionType==="sale"?numeric("price","askingPrice",tx("salePrice"),true):null}
   {data.transactionType==="rent"?<>{numeric("price","monthlyRent",tx("rent"))}{numeric("price","refundableDeposit",tx("deposit"))}</>:null}
   {data.transactionType==="gharawi"?<>{numeric("price","refundablePrincipal",tx("principal"),true)}{numeric("price","monthlyRent",tx("rent"))}{numeric("price","durationMonths",tx("duration"),true)}
    <Field label={tx("refund")} multiline value={data.price.refundTerms||""} onChange={v=>field("price","refundTerms",v)}/></>:null}
   {numeric("price","maintenanceMonthly",tx("maint"),true)}
  </SectionCard>;
  if(step===5)return <SectionCard><Label muted>{locale==="en"?"At least one photo. Maximum 20; images are re-encoded to remove metadata.":"حداقل یک عکس، حداکثر ۲۰ عکس؛ معلومات مخفی عکس حذف می‌شود."}</Label>
   <Action label={busy?"…":tx("photo")} disabled={busy||data.photoIds.length>=20} onPress={()=>void choosePhoto()}/>
   {pendingImage?<View style={{gap:8}}><Label muted>{(pendingImage.bytes?Math.round(pendingImage.bytes/1024):"?")+" KB"} · {busy?"Uploading…":error}</Label><Action kind="secondary" disabled={busy} label={locale==="en"?"Retry this photo":"تلاش دوباره برای این عکس"} onPress={()=>void transmitPhoto(pendingImage)}/></View>:null}
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{data.photoIds.map((photoId,i)=><View key={photoId} style={{width:"47%",gap:4}}>
    <Image source={photoSource(photoId,token)} style={{width:"100%",height:125,backgroundColor:colors.border,borderRadius:12}}/>
    <Label muted style={{fontSize:12}}>{i===0?(locale==="en"?"Cover":"عکس اصلی"):"#"+(i+1)}</Label>
    {i>0?<Action kind="secondary" label={locale==="en"?"Set as cover":"تعیین به‌عنوان عکس اصلی"} onPress={()=>change({...latest.current,photoIds:[photoId,...latest.current.photoIds.filter(p=>p!==photoId)]})}/>:null}
    <Action kind="secondary" label={locale==="en"?"Remove":"حذف"} onPress={()=>change({...latest.current,photoIds:latest.current.photoIds.filter(p=>p!==photoId)})}/>
   </View>)}</View>
  </SectionCard>;
  if(step===6)return <SectionCard>
   <Action kind={data.contact.allowPhone?"primary":"secondary"} label={tx("enablePhone")} onPress={()=>field("contact","allowPhone",!data.contact.allowPhone)}/>
   {data.contact.allowPhone?<Field label={tx("phone")} value={data.contact.phone||""} onChange={v=>field("contact","phone",v)}/>:null}
   <Action kind={data.contact.allowWhatsApp?"primary":"secondary"} label={tx("enableWhatsapp")} onPress={()=>field("contact","allowWhatsApp",!data.contact.allowWhatsApp)}/>
   {data.contact.allowWhatsApp?<Field label={tx("whatsapp")} value={data.contact.whatsapp||""} onChange={v=>field("contact","whatsapp",v)}/>:null}
  </SectionCard>;
  const validation=listingDraftSchema.safeParse(data);
  return <SectionCard><Label weight="bold">{tx("preview")}</Label>
   <Label weight="bold">{data.title}</Label>
   <Label muted>{lt(locale,data.propertyType)} · {lt(locale,data.transactionType)}</Label>
   <Label weight="bold" style={{fontSize:19,color:colors.primary}}>{priceSummary(data,locale)}</Label>
   <Label>{data.location.city} · {data.location.district} · {findProvince(data.location.provinceId)?.names[locale]}</Label>
   <Label>{data.description}</Label><Label muted>{data.photoIds.length} 📷</Label>
   {data.transactionType==="gharawi"?<Label>{data.price.refundTerms}</Label>:null}
   <Label muted>{validation.success?"":"⚠ "+tx("required")}</Label>
  </SectionCard>;
 };
 if(loading)return <Page><ActivityIndicator color={colors.primary}/></Page>;
 return <Page>
  <ScreenHeading title={locale==="en"?"Property editor":"مدیریت نشر ملک"} subtitle={steps[locale][step]+" · "+(step+1)+"/8"}/>
  <Label muted>{locale==="en"?"Status":"وضعیت"}: {status} · v{version}</Label>
  {revisionStatus==="submitted"?<SectionCard><Label>{tx("review")}</Label><Action kind="secondary" label={tx("withdraw")} disabled={busy} onPress={()=>void withdraw()}/></SectionCard>:null}
  {revisionStatus==="rejected"?<SectionCard><Label>{tx("rejected")}</Label><Label muted>{revisionReason}</Label></SectionCard>:null}
  {status==="published"&&revisionStatus!=="submitted"?<SectionCard><Label style={{color:colors.success}}>{tx("approval")}</Label></SectionCard>:null}
  {mutable?form():null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  {notice?<SectionCard><Label muted>{notice}</Label></SectionCard>:null}
  {mutable?<View style={{gap:10}}>
   {step===7?<Action disabled={busy} label={busy?"…":tx("submit")} onPress={()=>void submit()}/>:<Action disabled={busy} label={busy?"…":tx("next")} onPress={()=>void next()}/>}
   {step>0?<Action kind="secondary" disabled={busy} label={tx("back")} onPress={()=>setStep(s=>s-1)}/>:null}
   <Action kind="secondary" disabled={busy} label={tx("save")} onPress={()=>void save().then(()=>setNotice(tx("save"))).catch(()=>setError(tx("offline")))}/>
  </View>:null}
  <Action kind="secondary" label={locale==="en"?"My listings":"ملک‌های من"} onPress={()=>router.replace("/my-listings")}/>
 </Page>;
}
function Field({label,value,onChange,multiline=false,numeric=false,placeholder}:{label:string;value:string;onChange:(v:string)=>void;multiline?:boolean;numeric?:boolean;placeholder?:string}){
 return <View style={{gap:6}}>
  <Label weight="medium">{label}</Label>
  <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder}
   multiline={multiline} keyboardType={numeric?"decimal-pad":"default"}
   style={{minHeight:multiline?100:48,padding:12,color:colors.text,fontSize:16,borderRadius:12,borderWidth:1,borderColor:colors.border,textAlignVertical:multiline?"top":"center"}}/>
 </View>;
}
