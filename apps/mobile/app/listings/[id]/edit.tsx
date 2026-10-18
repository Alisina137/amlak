import {useEffect,useRef,useState} from "react";
import {router,useLocalSearchParams} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Image,Pressable,ScrollView,View,ActivityIndicator} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {findProvince,searchProvinces} from "@amlaklink/catalog";
import {listingDraftSchema,photoInfoFor,type ListingDraft,type PhotoDetail} from "@amlaklink/contracts";
import {useAuth,requestJson,ApiError} from "../../../src/auth";
import {usePreferences} from "../../../src/context";
import {PropertyLocationPicker} from "../../../src/location-picker";
import {lt,priceSummary} from "../../../src/listing-ui";
import {mediaCopy,roomName,photoRoomTypes} from "../../../src/media-copy";
import {getOwned,photoSource,uploadPhoto,type ListingDTO} from "../../../src/listing-client";
import {Action,AppInput,BackButton,DirectionalRow,Label,Page,ScreenHeading,SectionCard} from "../../../src/ui";
import {uiText} from "../../../src/ui-copy";
const steps={
 en:["Category","Transaction","Location","Property details","Pricing","Photos","Contact","Review"],
 fa:["نوع ملک","معامله","موقعیت","مشخصات ملک","قیمت","عکس‌ها","تماس","بررسی"],
 ps:["د ملکیت ډول","معامله","ځای","ځانګړنې","بیه","انځورونه","اړیکه","بیاکتنه"]
};
const labels={
 en:{title:"Title",description:"Description",province:"Province",city:"City",district:"District",neighborhood:"Neighborhood",address:"Street address (kept private)",area:"Area (m²)",bedrooms:"Bedrooms",bathrooms:"Bathrooms",floor:"Floor",floors:"Total floors",frontage:"Frontage (m)",currency:"Currency",salePrice:"Asking price",rent:"Monthly rent",deposit:"Refundable deposit / advance (0 allowed)",principal:"Refundable gharawi principal",duration:"Duration in months",refund:"Refund terms",maint:"Monthly maintenance",phone:"Telephone number",whatsapp:"WhatsApp number",enablePhone:"Allow telephone calls",enableWhatsapp:"Allow WhatsApp",precise:"Share exact coordinates publicly",photo:"Choose and upload a property photo",preview:"Preview / submission checks",save:"Save draft",next:"Save & next",back:"Previous",submit:"Submit for moderation",rejected:"This revision was rejected; edit and resubmit.",review:"Submitted for staff review. The approved public version stays unchanged.",pending:"Under review",approval:"Approved version visible publicly",required:"Complete required fields before submission",offline:"Offline draft saved on this device; server not yet updated.",conflict:"Draft changed elsewhere; reload before saving.",restoreLocal:"Restore my offline edits (overwrites newer draft after saving)",keepServer:"Keep server draft",withdraw:"Withdraw submitted revision"},
 fa:{title:"عنوان",description:"توضیحات",province:"ولایت",city:"شهر",district:"ناحیه / ولسوالی",neighborhood:"محله / گذر",address:"آدرس دقیق (خصوصی)",area:"مساحت (متر مربع)",bedrooms:"اتاق خواب",bathrooms:"تشناب",floor:"طبقه",floors:"تعداد طبقات",frontage:"بر زمین (متر)",currency:"پول",salePrice:"قیمت فروش",rent:"کرایه ماهانه",deposit:"پول پیش / تضمین (صفر نیز مجاز)",principal:"اصل پول قابل بازپرداخت گروی",duration:"مدت به ماه",refund:"شرایط بازپرداخت گروی",maint:"مصرف ماهانه خدمات",phone:"شماره تماس",whatsapp:"شماره واتساپ",enablePhone:"تماس تلفنی فعال",enableWhatsapp:"واتساپ فعال",precise:"نمایش مختصات دقیق برای همه",photo:"انتخاب و بارگذاری عکس ملک",preview:"بررسی معلومات پیش از ارسال",save:"ذخیره پیش‌نویس",next:"ذخیره و ادامه",back:"قبلی",submit:"ارسال برای بررسی",rejected:"این نسخه رد شده است؛ اصلاح و دوباره ارسال کنید.",review:"برای بررسی مسئول ارسال شد. نسخهٔ نشرشده تغییر نمی‌کند.",pending:"در حال بررسی",approval:"نسخهٔ تأییدشده برای عموم قابل مشاهده است",required:"تمام معلومات ضروری را تکمیل کنید",offline:"نسخهٔ محلی ذخیره شد؛ هنوز به سرور نرسیده است.",conflict:"ملک در جای دیگری تغییر یافته؛ دوباره دریافت کنید.",restoreLocal:"بازیابی اصلاحات محلی (پس از ذخیره نسخهٔ جدید را جایگزین می‌کند)",keepServer:"حفظ نسخهٔ سرور",withdraw:"پس گرفتن نسخهٔ ارسال‌شده"},
 ps:{title:"سرلیک",description:"تشریح",province:"ولایت",city:"ښار",district:"ولسوالي / ناحیه",neighborhood:"سیمه",address:"د کوڅې پته (خصوصي)",area:"مساحت (متر مربع)",bedrooms:"خوب خونې",bathrooms:"تشنابونه",floor:"پوړ",floors:"ټول پوړونه",frontage:"مخ (متر)",currency:"پیسې",salePrice:"د پلور بیه",rent:"میاشتنۍ کرایه",deposit:"بېرته ورکړه / مخکې ورکړه (صفر هم شونی)",principal:"د ګروۍ بېرته ورکړه",duration:"موده په میاشتو",refund:"د بېرته ورکولو شرطونه",maint:"میاشتنۍ خدمت فیس",phone:"تلیفون شمېره",whatsapp:"واټساپ شمېره",enablePhone:"تلیفون فعال",enableWhatsapp:"واټساپ فعال",precise:"دقیق ځای عام ښکاره کول",photo:"د ملک انځور واچوئ",preview:"د سپارلو معلومات وګورئ",save:"مسوده خوندي کړه",next:"خوندي او بل ګام",back:"مخکې",submit:"کتنې ته ولېږئ",rejected:"دا نسخه رد شوې. سمون او بیا یې وسپارئ.",review:"کتنې ته ولېږل شو. مخکینی خپور شوی معلومات پاتې دي.",pending:"د کتنې لاندې",approval:"منل شوی معلومات خلکو ته ښکاري",required:"ټول ضروري معلومات ډک کړئ",offline:"مسوده په دې وسیله خوندي شوه، سرور ته نه ده تللې.",conflict:"مسوده بل ځای بدله شوې، بیا یې راواخلئ.",restoreLocal:"زما محلي بدلونونه بېرته راوګرځوئ (له خوندي کولو وروسته نوې مسوده بدلوي)",keepServer:"د سرور مسوده وساتئ",withdraw:"سپارل شوې نسخه بېرته واخلئ"}
} as const;
type Key=keyof typeof labels.en;
export default function ListingEditor(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{token,user}=useAuth();
 const [pendingImage,setPendingImage]=useState<{uri:string;mime:string;bytes?:number}|null>(null);
 const [pendingConflict,setPendingConflict]=useState<ListingDraft|null>(null);
 const [roomEditor,setRoomEditor]=useState<string|null>(null);
 const [data,setData]=useState<ListingDraft>(listingDraftSchema.parse({})),[status,setStatus]=useState("draft"),[revisionStatus,setRevisionStatus]=useState("draft"),[revisionReason,setRevisionReason]=useState("");
 const [version,setVersion]=useState(1),[step,setStep]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),
 [error,setError]=useState(""),[notice,setNotice]=useState(""),[provinceQuery,setProvinceQuery]=useState("");
 const latest=useRef(data),versionRef=useRef(1),saveChain=useRef<Promise<void>>(Promise.resolve()),loaded=useRef(false);
 const lastHydrated=useRef<ListingDraft|null>(null);
 const tx=(key:Key)=>labels[locale][key],media=mediaCopy[locale];
 // Private contact details and drafts must never be shared between accounts on one phone.
 const localKey="amlak:draft:v5:"+user?.id+":"+id;
 const scope=token+":"+user?.id+":"+id;
 const activeScope=useRef(scope),cacheChain=useRef<Promise<void>>(Promise.resolve()),offlineUntil=useRef(0);
 activeScope.current=scope;
 const cache=async(snapshot:ListingDraft,serverVersion:number,unsynced:boolean)=>{
  const key=localKey,ownerScope=scope;
  cacheChain.current=cacheChain.current.catch(()=>{}).then(async()=>{
   if(activeScope.current!==ownerScope)return;
   await AsyncStorage.setItem(key,JSON.stringify({version:serverVersion,data:snapshot,unsynced,
    status,revisionStatus,revisionReason})).catch(()=>{});
  });
  await cacheChain.current;
 };
 const mutableBase=revisionStatus!=="submitted" && !["sold","rented","archived"].includes(status);
 const mutable=mutableBase&&!pendingConflict;
 const change=(value:ListingDraft)=>{latest.current=value;setData(value);};
 const setPhotoDetail=(photoId:string,updates:Partial<PhotoDetail>)=>{
  const current=photoInfoFor(latest.current,photoId);
  change({...latest.current,photoDetails:{...latest.current.photoDetails,
   [photoId]:{...current,...updates}}});
 };
 const removePhotoFromDraft=(photoId:string)=>{
  const details={...latest.current.photoDetails};delete details[photoId];
  change({...latest.current,photoIds:latest.current.photoIds.filter(p=>p!==photoId),photoDetails:details});
 };
 const field=(section:"location"|"attributes"|"price"|"contact",key:string,value:unknown)=>{
  change({...latest.current,[section]:{...latest.current[section],[key]:value}});
 };
 async function refresh(){
  if(!token||!id||!user?.id)return;
  const requestScope=scope;
  setLoading(true);setError("");setPendingConflict(null);
  try{
   const response=await getOwned(id,token);
   if(activeScope.current!==requestScope)return;
   const saved=await AsyncStorage.getItem(localKey).catch(()=>null);
   let doc=response.data;
   if(saved){
    try{
     const cached=JSON.parse(saved) as {version:number;data:unknown;unsynced:boolean};
     const result=listingDraftSchema.safeParse(cached.data);
     if(result.success&&cached.unsynced&&response.revisionStatus!=="submitted"&&
      !["sold","rented","archived"].includes(response.status)){
      if(cached.version===response.version){
       doc=result.data;
       setNotice(tx("offline")); // Cached edits are NOT confirmed saved on the server.
      }else if(JSON.stringify(result.data)!==JSON.stringify(response.data))
       setPendingConflict(result.data); // Never silently discard or overwrite divergent remote edits.
     }
    }catch{}
   }
   if(activeScope.current!==requestScope)return;
   lastHydrated.current=doc;
   change(doc);versionRef.current=response.version;setVersion(response.version);
   setStatus(response.status);setRevisionStatus(response.revisionStatus||"approved");
   setRevisionReason(response.revisionReason||"");loaded.current=true;
   offlineUntil.current=0;
  }catch(err){
   if(activeScope.current!==requestScope)return;
   // Only a network/timeout failure is eligible for offline edits. Authorization
   // or stale-version errors must not resurrect an inaccessible property.
   const network=err instanceof ApiError&&(err.status===0||[502,503,504].includes(err.status));
   const saved=network?await AsyncStorage.getItem(localKey).catch(()=>null):null;
   if(saved&&activeScope.current===requestScope){
    try{
     const cached=JSON.parse(saved) as {version:number;data:unknown;unsynced:boolean;
      status?:string;revisionStatus?:string;revisionReason?:string};
     const parsed=listingDraftSchema.safeParse(cached.data);
     if(parsed.success&&Number.isInteger(cached.version)&&cached.version>0&&
      cached.revisionStatus!=="submitted"&&!["archived","sold","rented"].includes(cached.status||"")){
      lastHydrated.current=parsed.data;
      change(parsed.data);versionRef.current=cached.version;setVersion(cached.version);
      setStatus(cached.status||"draft");setRevisionStatus(cached.revisionStatus||"draft");
      setRevisionReason(cached.revisionReason||"");loaded.current=true;
      offlineUntil.current=Date.now()+10000;setNotice(tx("offline"));
      return;
     }
    }catch{}
   }
   setError(network?tx("offline"):(err as Error).message);
  }finally{if(activeScope.current===requestScope)setLoading(false);}
 }
 useEffect(()=>{
  loaded.current=false;lastHydrated.current=null;saveChain.current=Promise.resolve();cacheChain.current=Promise.resolve();
  offlineUntil.current=0;
  setLoading(true);setNotice("");setError("");setPendingImage(null);setPendingConflict(null);
  void refresh();
 },[id,token,user?.id]);
 async function save(manual=false){
  if(!token||!id||!user?.id||!loaded.current||!mutable)return;
  if(!manual&&Date.now()<offlineUntil.current)return;
  const snapshot=latest.current,ownerScope=scope;
  saveChain.current=saveChain.current.catch(()=>{}).then(async()=>{
   if(activeScope.current!==ownerScope) return;
   try{
    const r=await requestJson<{version:number;status:string}>("/v1/listings/"+id+"/draft",
     {method:"PUT",token,body:{expectedVersion:versionRef.current,data:snapshot}});
    if(activeScope.current!==ownerScope)return;
    versionRef.current=r.version;setVersion(r.version);setStatus(r.status);
    offlineUntil.current=0;
    const changed=latest.current!==snapshot;
    await cache(changed?latest.current:snapshot,r.version,changed);
    if(!changed){lastHydrated.current=snapshot;setNotice("");}
   }catch(err){
    if(activeScope.current!==ownerScope)return;
    if(err instanceof ApiError&&err.status===0){
     offlineUntil.current=Date.now()+10000;
     await cache(latest.current,versionRef.current,true);
     setNotice(tx("offline"));
    }else if(err instanceof ApiError&&err.status===409){
     await cache(latest.current,versionRef.current,true);
     setError(tx("conflict"));
    }
    throw err;
   }
  });
  return saveChain.current;
 }
 useEffect(()=>{
  if(!loaded.current||!mutable||!token||!user?.id||lastHydrated.current===data)return;
  void cache(data,versionRef.current,true);
  const timer=setTimeout(()=>{
   if(activeScope.current===scope)void save(false).catch(()=>{});
  },1800);
  return()=>clearTimeout(timer);
 },[data,id,token,user?.id,mutable]);
 async function next(){
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{await save(true);setStep(s=>Math.min(s+1,7));}
  catch(err){
   if(err instanceof ApiError&&err.status===0){
    setStep(s=>Math.min(s+1,7));setNotice(tx("offline"));
   }else setError(tx("conflict"));
  }finally{setBusy(false);}
 }
 async function submit(){
  if(busy||!token)return;setBusy(true);setError("");setNotice("");
  try{
   await save(true);
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
 async function listingAction(action:"pause"|"resume"|"close"|"confirm-availability",outcome?:"sold"|"rented"){
  if(!token||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   await requestJson("/v1/listings/"+id+"/"+action,{method:"POST",token,body:outcome?{outcome}:undefined});
   await refresh();
  }catch(err){setError((err as Error).message);}
  finally{setBusy(false);}
 }
 async function transmitPhoto(asset:{uri:string;mime:string;bytes?:number}){
  if(!token||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await uploadPhoto(id,token,asset.uri,asset.mime);
   change({...latest.current,
    photoIds:latest.current.photoIds.includes(response.id)?
     latest.current.photoIds:[...latest.current.photoIds,response.id],
    photoDetails:{...latest.current.photoDetails,
     [response.id]:latest.current.photoDetails[response.id]||{room:"other",caption:""}}});
   await save(true);setNotice(uiText(locale,"editorUploadSuccess"));
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
  if(step===0)return <SectionCard><Label weight="bold">{uiText(locale,"propertyCategory")}</Label>
   {(["house","apartment","land","shop","office","commercial"] as const).map(p=><Action key={p} kind={data.propertyType===p?"primary":"secondary"} label={lt(locale,p)} onPress={()=>chooseItem("propertyType",p)}/>)}
  </SectionCard>;
  if(step===1)return <SectionCard><Label weight="bold">{uiText(locale,"editorTransactionType")}</Label>
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
   <Action kind="secondary" label={data.location.precision==="approximate"?"✓ "+(uiText(locale,"editorApproximate")):(uiText(locale,"editorExact"))} onPress={()=>field("location","precision",data.location.precision==="approximate"?"exact":"approximate")}/>
   {data.location.precision==="exact"?<PropertyLocationPicker locale={locale}
    latitude={data.location.latitude} longitude={data.location.longitude}
    onChange={(latitude,longitude)=>change({...latest.current,location:{...latest.current.location,latitude,longitude}})}/>:<Label muted>{
      uiText(locale,"editorPrivacyHint")
    }</Label>}
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
   <View style={{flexDirection:locale==="en"?"row":"row-reverse",gap:8}}>{(["AFN","USD"] as const).map(c=><View key={c} style={{flex:1}}><Action kind={data.price.currency===c?"primary":"secondary"} label={c} onPress={()=>field("price","currency",c)}/></View>)}</View>
   {data.transactionType==="sale"?numeric("price","askingPrice",tx("salePrice"),true):null}
   {data.transactionType==="rent"?<>{numeric("price","monthlyRent",tx("rent"))}{numeric("price","refundableDeposit",tx("deposit"))}</>:null}
   {data.transactionType==="gharawi"?<>{numeric("price","refundablePrincipal",tx("principal"),true)}{numeric("price","monthlyRent",tx("rent"))}{numeric("price","durationMonths",tx("duration"),true)}
    <Field label={tx("refund")} multiline value={data.price.refundTerms||""} onChange={v=>field("price","refundTerms",v)}/></>:null}
   {numeric("price","maintenanceMonthly",tx("maint"),true)}
  </SectionCard>;
  if(step===5)return <SectionCard>
   <Label weight="bold">{media.photos} · {data.photoIds.length}/20</Label>
   <Label muted>{locale==="en"?"At least one photo. Maximum 20; images are re-encoded to remove metadata.":locale==="fa"?"حداقل یک عکس، حداکثر ۲۰ عکس؛ معلومات مخفی عکس حذف می‌شود.":"لږ تر لږه یو انځور، تر ۲۰ پورې؛ پټ عکس معلومات لرې کېږي."}</Label>
   <Label muted>{media.note}</Label>
   <Action label={busy?"…":tx("photo")} disabled={busy||!mutable||data.photoIds.length>=20} onPress={()=>void choosePhoto()}/>
   {pendingImage?<View style={{gap:8}}><Label muted>{(pendingImage.bytes?Math.round(pendingImage.bytes/1024):"?")+" KB"} · {busy?"Uploading…":error}</Label>
    <Action kind="secondary" disabled={busy||!mutable} label={uiText(locale,"editorPhotoRetry")} onPress={()=>void transmitPhoto(pendingImage)}/></View>:null}
   {data.photoIds.map((photoId,i)=>{
    const photo=photoInfoFor(data,photoId);
    return <View key={photoId} style={{gap:10,borderWidth:1,borderColor:colors.border,padding:12,borderRadius:14}}>
     <View style={{flexDirection:locale==="en"?"row":"row-reverse",gap:12,alignItems:"center"}}>
      <Image source={photoSource(photoId,token)} style={{width:126,height:106,backgroundColor:colors.border,borderRadius:10}}/>
      <View style={{flex:1,gap:6}}>
       <Label weight="bold">{i===0?media.cover:"#"+(i+1)}</Label>
       <Label muted>{roomName(locale,photo.room)}</Label>
      </View>
     </View>
     <Action kind="secondary" disabled={!mutable||busy}
      label={media.room+": "+roomName(locale,photo.room)}
      onPress={()=>setRoomEditor(current=>current===photoId?null:photoId)}/>
     {roomEditor===photoId?<View style={{flexDirection:locale==="en"?"row":"row-reverse",gap:7,flexWrap:"wrap"}}>
      {photoRoomTypes.map(room=><Pressable key={room} accessibilityRole="button"
       accessibilityState={{selected:photo.room===room}} disabled={!mutable||busy}
       onPress={()=>{setPhotoDetail(photoId,{room});setRoomEditor(null);}}
       style={{minHeight:44,justifyContent:"center",borderRadius:16,paddingHorizontal:12,borderWidth:1,
        borderColor:photo.room===room?colors.primary:colors.border,
        backgroundColor:photo.room===room?"#E1F0E9":colors.surface}}>
       <Label style={{fontSize:13}}>{roomName(locale,room)}</Label>
      </Pressable>)}
     </View>:null}
     <Label>{media.caption}</Label>
     <AppInput accessibilityLabel={media.caption+" "+(i+1)} value={photo.caption}
      onChangeText={caption=>setPhotoDetail(photoId,{caption})}
      maxLength={100} editable={mutable&&!busy} placeholder={media.caption}
      style={{borderWidth:1,borderColor:colors.border,borderRadius:10,padding:12,minHeight:48,
       color:colors.text,textAlign:locale==="en"?"left":"right",
       writingDirection:locale==="en"?"ltr":"rtl"}}/>
     <Label muted style={{fontSize:12}}>{media.captionHint}</Label>
     {i>0?<Action kind="secondary" disabled={!mutable||busy} label={media.coverAction}
      onPress={()=>change({...latest.current,photoIds:[photoId,...latest.current.photoIds.filter(p=>p!==photoId)]})}/>:null}
     <Action kind="secondary" disabled={!mutable||busy} label={media.remove}
      onPress={()=>{removePhotoFromDraft(photoId);if(roomEditor===photoId)setRoomEditor(null);}}/>
    </View>;
   })}
  </SectionCard>;
  if(step===6)return <SectionCard>
   <Action kind={data.contact.allowPhone?"primary":"secondary"} label={tx("enablePhone")} onPress={()=>field("contact","allowPhone",!data.contact.allowPhone)}/>
   {data.contact.allowPhone?<Field label={tx("phone")} inputDirection="ltr" value={data.contact.phone||""} onChange={v=>field("contact","phone",v)}/>:null}
   <Action kind={data.contact.allowWhatsApp?"primary":"secondary"} label={tx("enableWhatsapp")} onPress={()=>field("contact","allowWhatsApp",!data.contact.allowWhatsApp)}/>
   {data.contact.allowWhatsApp?<Field label={tx("whatsapp")} inputDirection="ltr" value={data.contact.whatsapp||""} onChange={v=>field("contact","whatsapp",v)}/>:null}
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
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={uiText(locale,"editorTitle")} subtitle={steps[locale][step]+" · "+(step+1)+"/8"}/>
  <Label muted>{uiText(locale,"invalidState")}: {status} · v{version}</Label>
  {status==="published"?<SectionCard>
   <Label weight="bold">{uiText(locale,"editorAvailability")}</Label>
   <Action kind="secondary" disabled={busy} label={uiText(locale,"editorConfirmAvailability")} onPress={()=>void listingAction("confirm-availability")}/>
   <Action kind="secondary" disabled={busy} label={uiText(locale,"editorPause")} onPress={()=>void listingAction("pause")}/>
   <Action kind="secondary" disabled={busy} label={data.transactionType==="sale"?uiText(locale,"editorSold"):uiText(locale,"editorRented")} onPress={()=>void listingAction("close",data.transactionType==="sale"?"sold":"rented")}/>
  </SectionCard>:null}
  {status==="paused"?<SectionCard><Label muted>{uiText(locale,"editorPausedWarning")}</Label>
   <Action disabled={busy} label={uiText(locale,"editorResume")} onPress={()=>void listingAction("resume")}/>
  </SectionCard>:null}
  {revisionStatus==="submitted"?<SectionCard><Label>{tx("review")}</Label><Action kind="secondary" label={tx("withdraw")} disabled={busy} onPress={()=>void withdraw()}/></SectionCard>:null}
  {revisionStatus==="rejected"?<SectionCard><Label>{tx("rejected")}</Label><Label muted>{revisionReason}</Label></SectionCard>:null}
  {status==="published"&&revisionStatus!=="submitted"?<SectionCard><Label style={{color:colors.success}}>{tx("approval")}</Label></SectionCard>:null}
  {mutable?form():null}
  {pendingConflict?<SectionCard>
   <Label style={{color:colors.warning}}>{tx("conflict")}</Label>
   <Label muted>{tx("offline")}</Label>
   <Action kind="secondary" label={tx("restoreLocal")} onPress={()=>{
    if(!mutableBase)return;
    const local=pendingConflict;setPendingConflict(null);change(local);
    void cache(local,versionRef.current,true);
   }}/>
   <Action kind="secondary" label={tx("keepServer")} onPress={()=>{
    setPendingConflict(null);
    void AsyncStorage.removeItem(localKey).catch(()=>{});
   }}/>
  </SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label>
   <Action kind="secondary" disabled={busy} label={tx("save")}
    onPress={()=>void save(true).then(()=>refresh()).catch(()=>setNotice(tx("offline")))}/>
  </SectionCard>:null}
  {notice?<SectionCard><Label muted>{notice}</Label></SectionCard>:null}
  {mutable?<View style={{gap:10}}>
   {step===7?<Action disabled={busy} label={busy?"…":tx("submit")} onPress={()=>void submit()}/>:<Action disabled={busy} label={busy?"…":tx("next")} onPress={()=>void next()}/>}
   {step>0?<Action kind="secondary" disabled={busy} label={tx("back")} onPress={()=>setStep(s=>s-1)}/>:null}
   <Action kind="secondary" disabled={busy} label={tx("save")} onPress={()=>void save(true).then(()=>setNotice(tx("save"))).catch(()=>setError(tx("offline")))}/>
  </View>:null}
  <Action kind="secondary" label={uiText(locale,"editorMyListings")} onPress={()=>router.replace("/my-listings")}/>
 </Page>;
}
function Field({label,value,onChange,multiline=false,numeric=false,inputDirection="auto",placeholder}:{label:string;value:string;onChange:(v:string)=>void;multiline?:boolean;numeric?:boolean;inputDirection?:"auto"|"ltr";placeholder?:string}){
 return <View style={{gap:6}}>
  <Label weight="medium">{label}</Label>
  <AppInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder}
   multiline={multiline} keyboardType={numeric?"decimal-pad":"default"} inputDirection={numeric?"ltr":inputDirection}
   style={{minHeight:multiline?100:48,padding:12,color:colors.text,fontSize:16,borderRadius:12,borderWidth:1,borderColor:colors.border,textAlignVertical:multiline?"top":"center"}}/>
 </View>;
}
