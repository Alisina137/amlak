import * as Crypto from "expo-crypto";
import {useCallback,useEffect,useState} from "react";
import {TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "./auth";
import {usePreferences} from "./context";
import {Action,Label,Page,ScreenHeading,SectionCard} from "./ui";
type Product={code:string;kind:string;amountAfn:number;listingLimit:number;seatLimit:number;days:number};
type Plans={billingEnabled:boolean;illustrativePricing:boolean;products:Product[];disclaimer:string};
type SubscriptionState={plan:string;listingLimit:number;seatLimit:number;expiresAt:string|null;
 status:"free"|"active"|"grace"|"expired";daysRemaining:number|null;previousPlan:string|null;
 lastExpiredAt:string|null;graceEndsAt:string|null;graceDaysRemaining:number|null;
 scheduled:{plan:string;startsAt:string;expiresAt:string;listingLimit:number;seatLimit:number}|null;
 renewalNeeded:boolean;graceAllowsNewPaidCapacity:false};
type Invoice={id:string;agencyId:string|null;listingId:string|null;productCode:string;amountAfn:number;status:string;createdAt:string};
const copy={
 en:{heading:"Professional plans & billing",sub:"Platform services only — never property payments.",
  plans:"Proposed plans",disabled:"Billing is OFF until local rates and payment procedures are approved.",
  create:"Request platform invoice",invoice:"Your platform invoices",empty:"No invoices yet.",
  ref:"Verified external receipt reference",send:"Submit payment claim for manual review",
  method:"Payment method",wait:"Do not send money before obtaining official payment instructions.",
  fail:"Request failed. Please check access and retry.",renew:"Active entitlement",status:"Status",return:"Refresh",subscriptionStatus:"Subscription status",expiry:"Ends",daysLeft:"Days remaining",
  free:"Free",active:"Active",grace:"Renewal window",expired:"Expired",scheduled:"Confirmed upcoming plan",
  upgrade:"Review renewal options",graceWarning:"Paid capacity ended. During the 3-day renewal window, free quotas apply. Existing listings, leads and conversations stay available.",
  expiredWarning:"The renewal window ended. Free limits now apply; existing listings and conversations are preserved.",
  pendingWarning:"Renewal is not automatic. New quota starts only after a staff-verified payment.",
  renewalDays:"Renewal window days remaining",renewalPending:"Next plan starts",notYet:"No active paid plan"},
 fa:{heading:"اشتراک حرفه‌ای و پرداخت",sub:"فقط خدمات پلتفرم؛ نه پرداخت ملک یا گروی.",
  plans:"طرح‌های پیشنهادی",disabled:"پرداخت تا تصویب نرخ‌ها و روش محلی غیرفعال است.",
  create:"درخواست فاکتور خدمات",invoice:"فاکتورهای خدمات شما",empty:"هنوز فاکتوری نیست.",
  ref:"شماره مرجع رسید قابل‌بررسی",send:"ارسال ادعای پرداخت برای بررسی دستی",
  method:"روش پرداخت",wait:"بدون دریافت رهنمود رسمی، هیچ پولی انتقال ندهید.",
  fail:"درخواست ناموفق بود؛ صلاحیت حساب را بررسی کنید.",renew:"حق اشتراک فعال",status:"وضعیت",return:"تازه‌سازی",subscriptionStatus:"وضعیت اشتراک",expiry:"پایان",daysLeft:"روز باقی‌مانده",
  free:"رایگان",active:"فعال",grace:"فرصت تمدید",expired:"منقضی",scheduled:"طرح تأییدشده آینده",
  upgrade:"بررسی گزینه‌های تمدید",graceWarning:"ظرفیت پولی پایان یافته است. در فرصت ۳ روزه تمدید محدودیت رایگان اجرا می‌شود. آگهی‌ها و پیام‌های قبلی محفوظ‌اند.",
  expiredWarning:"فرصت تمدید پایان یافت. محدودیت رایگان اجرا می‌شود و آگهی‌ها و گفتگوهای موجود محفوظ‌اند.",
  pendingWarning:"تمدید خودکار نیست. امتیاز جدید تنها پس از تأیید پرداخت توسط کارمند فعال می‌شود.",
  renewalDays:"روزهای باقی‌مانده فرصت تمدید",renewalPending:"شروع اشتراک بعدی",notYet:"اشتراک پولی فعال نیست"},
 ps:{heading:"مسلکي پلانونه او حسابونه",sub:"یوازې د اپ خدمتونه؛ د ملکیت پیسې نه دي.",
  plans:"وړاندیز شوي پلانونه",disabled:"تر ځايي نرخونو او تادیې تایید پورې پیسې بندې دي.",
  create:"د خدمت بل وغواړئ",invoice:"ستاسو د خدمت بلونه",empty:"تر اوسه بل نشته.",
  ref:"د رسید د تادیې حواله",send:"د لاسي ارزونې لپاره ادعا ولېږئ",
  method:"د تادیې ډول",wait:"د رسمي لارښوونو پرته پیسې مه لېږئ.",
  fail:"غوښتنه ناکامه وه، خپل لاسرسی وګورئ.",renew:"فعال پلان",status:"حالت",return:"بیا تازه کړه",subscriptionStatus:"د پلان حالت",expiry:"پای",daysLeft:"پاتې ورځې",
  free:"وړیا",active:"فعال",grace:"د نوي کولو موده",expired:"پای ته رسېدلی",scheduled:"راتلونکی تایید شوی پلان",
  upgrade:"د نوي کولو لارې وګورئ",graceWarning:"پیسې پلان پای ته رسېدلی. په ۳ ورځنۍ موده کې وړیا محدودیتونه دي. پخواني اعلانونه او پیغامونه خوندي دي.",
  expiredWarning:"د نوي کولو موده ختمه شوه. وړیا محدودیتونه پلي دي او پخواني اعلانونه او خبرې خوندي دي.",
  pendingWarning:"اتومات نوي کول نشته. نوی پلان یوازې د کارمند له لوري د پیسو تر تایید وروسته فعالېږي.",
  renewalDays:"د نوي کولو پاتې ورځې",renewalPending:"بل پلان پیلېږي",notYet:"فعال پیسې پلان نشته"}
};
export function BillingScreen({agencyId,listingId}:{agencyId?:string;listingId?:string}){
 const {token}=useAuth(),{locale}=usePreferences(),t=copy[locale],rtl=isRTL(locale);
 const [plans,setPlans]=useState<Plans|null>(null),[invoices,setInvoices]=useState<Invoice[]>([]);
 const [entitlement,setEntitlement]=useState<SubscriptionState|null>(null);
 const [reference,setReference]=useState(""),[selectedInvoice,setSelectedInvoice]=useState<string|null>(null),
  [method,setMethod]=useState<"bank_transfer"|"cash_deposit"|"other">("bank_transfer"),
  [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const load=useCallback(async()=>{
  if(!token)return;
  try{
   const [catalog,owned,grant]=await Promise.all([
    requestJson<Plans>("/v1/plans"),
    requestJson<{items:Invoice[]}>("/v1/invoices",{token}),
    requestJson<SubscriptionState>(
     "/v1/entitlements"+(agencyId?"?agencyId="+encodeURIComponent(agencyId):""),{token})
   ]);
   setPlans(catalog);setInvoices(owned.items.filter(i=>agencyId?i.agencyId===agencyId:
    listingId?i.listingId===listingId:!i.agencyId&&!i.listingId));
   setEntitlement(grant);setError("");
  }catch{setError(t.fail);}
 },[token,agencyId,listingId,t.fail]);
 useEffect(()=>{void load();},[load]);
 async function invoice(code:string){
  if(!token||busy)return;setBusy(true);setError("");setMessage("");
  try{
   const row=await requestJson<Invoice>("/v1/invoices",{token,method:"POST",
    body:{productCode:code,requestId:Crypto.randomUUID(),...(agencyId?{agencyId}:{}),...(listingId?{listingId}:{})}});
   setSelectedInvoice(row.id);setMessage(row.id);await load();
  }catch{setError(t.fail);}finally{setBusy(false);}
 }
 async function claim(){
  if(!token||!selectedInvoice||reference.trim().length<8||busy)return;
  setBusy(true);setError("");setMessage("");
  try{
   await requestJson("/v1/invoices/"+selectedInvoice+"/claims",{token,method:"POST",
    body:{reference:reference.trim(),method}});
   setMessage(locale==="en"?"Claim submitted; no entitlement until verified.":"درخواست ثبت شد؛ تا تأیید پرداخت امتیازی فعال نمی‌شود.");
   setReference("");setSelectedInvoice(null);await load();
  }catch{setError(t.fail);}finally{setBusy(false);}
 }
 const products=(plans?.products||[]).filter(p=>agencyId?
  p.code.startsWith("agency_"):listingId?p.code==="featured_7d":p.code==="solo_agent");
 return <Page><ScreenHeading title={t.heading} subtitle={t.sub}/>
  <SectionCard><Label style={{color:colors.warning}}>{t.wait}</Label>
   {plans&&!plans.billingEnabled?<Label style={{color:colors.warning}}>{t.disabled}</Label>:null}
   <Label muted>{plans?.disclaimer||""}</Label>
  </SectionCard>
  {!listingId?<SectionCard>
   <Label weight="bold">{t.subscriptionStatus}</Label>
   <Label weight="bold" style={{color:entitlement?.status==="active"?colors.success:colors.warning}}>
    {entitlement?t[entitlement.status]:"—"} · {(entitlement?.plan||"free").replaceAll("_"," ")}
   </Label>
   <Label>{entitlement?.listingLimit??3} listings · {entitlement?.seatLimit??(agencyId?3:1)} seats</Label>
   {entitlement?.expiresAt?<Label muted>{t.expiry}: {new Date(entitlement.expiresAt).toLocaleDateString(locale==="en"?"en-GB":locale==="ps"?"ps-AF":"fa-AF")}
    {entitlement.daysRemaining!==null?" · "+t.daysLeft+": "+entitlement.daysRemaining:""}</Label>:null}
   {entitlement?.scheduled?<View style={{gap:5}}>
    <Label weight="bold">{t.scheduled}: {entitlement.scheduled.plan.replaceAll("_"," ")}</Label>
    <Label muted>{t.renewalPending}: {new Date(entitlement.scheduled.startsAt).toLocaleDateString(locale==="en"?"en-GB":locale==="ps"?"ps-AF":"fa-AF")}</Label>
   </View>:null}
   {entitlement?.status==="grace"?<View style={{gap:5}}>
    <Label style={{color:colors.warning}}>{t.graceWarning}</Label>
    <Label muted>{t.renewalDays}: {entitlement.graceDaysRemaining??0}</Label>
   </View>:null}
   {entitlement?.status==="expired"?<Label style={{color:colors.warning}}>{t.expiredWarning}</Label>:null}
   {entitlement?.renewalNeeded?<Label weight="bold" style={{color:colors.primary}}>{t.upgrade}</Label>:null}
   <Label muted>{t.pendingWarning}</Label>
  </SectionCard>:null}
  <SectionCard><Label weight="bold">{t.plans}</Label>
   {products.map(p=><View key={p.code} style={{gap:8,borderTopWidth:1,borderColor:colors.border,paddingTop:10}}>
    <Label weight="bold">{p.code.replaceAll("_"," ")}</Label>
    <Label muted>{p.amountAfn.toLocaleString()} AFN · {p.days} days · {p.listingLimit||"—"} listings · {p.seatLimit||"—"} seats</Label>
    <Action disabled={busy||!plans?.billingEnabled} label={t.create} onPress={()=>void invoice(p.code)}/>
   </View>)}
  </SectionCard>
  <SectionCard><Label weight="bold">{t.invoice}</Label>
   {!invoices.length?<Label muted>{t.empty}</Label>:null}
   {invoices.map(i=><View key={i.id} style={{gap:6,paddingVertical:8,borderTopWidth:1,borderColor:colors.border}}>
    <Label>{i.productCode} · {i.amountAfn.toLocaleString()} AFN</Label>
    <Label muted>{t.status}: {i.status}</Label>
    {["unpaid","rejected"].includes(i.status)?
     <Action kind="secondary" label={locale==="en"?"Submit claim for this invoice":"ارسال رسید برای این فاکتور"}
      onPress={()=>setSelectedInvoice(i.id)}/>:null}
   </View>)}
  </SectionCard>
  {selectedInvoice&&plans?.billingEnabled?<SectionCard>
   <Label weight="bold">{t.method}</Label>
   <View style={{gap:6}}>
    {(["bank_transfer","cash_deposit","other"] as const).map(m=>
     <Action key={m} kind={method===m?"primary":"secondary"} label={m.replace("_"," ")} onPress={()=>setMethod(m)}/>)}
   </View>
   <Label>{t.ref}</Label>
   <TextInput accessibilityLabel={t.ref} value={reference} onChangeText={setReference}
    maxLength={120} autoCapitalize="characters" placeholder={t.ref}
    style={{borderWidth:1,borderColor:colors.border,borderRadius:10,minHeight:48,padding:12,color:colors.text,
      writingDirection:rtl?"rtl":"ltr",textAlign:rtl?"right":"left"}}/>
   <Action disabled={busy||reference.trim().length<8} label={t.send} onPress={()=>void claim()}/>
  </SectionCard>:null}
  {message?<SectionCard><Label style={{color:colors.success}}>{message}</Label></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  <Action kind="secondary" label={t.return} disabled={busy} onPress={()=>void load()}/>
 </Page>;
}
