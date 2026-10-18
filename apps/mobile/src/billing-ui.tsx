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
type Invoice={id:string;agencyId:string|null;listingId:string|null;productCode:string;amountAfn:number;status:string;createdAt:string};
const copy={
 en:{heading:"Professional plans & billing",sub:"Platform services only — never property payments.",
  plans:"Proposed plans",disabled:"Billing is OFF until local rates and payment procedures are approved.",
  create:"Request platform invoice",invoice:"Your platform invoices",empty:"No invoices yet.",
  ref:"Verified external receipt reference",send:"Submit payment claim for manual review",
  method:"Payment method",wait:"Do not send money before obtaining official payment instructions.",
  fail:"Request failed. Please check access and retry.",renew:"Active entitlement",status:"Status",return:"Refresh"},
 fa:{heading:"اشتراک حرفه‌ای و پرداخت",sub:"فقط خدمات پلتفرم؛ نه پرداخت ملک یا گروی.",
  plans:"طرح‌های پیشنهادی",disabled:"پرداخت تا تصویب نرخ‌ها و روش محلی غیرفعال است.",
  create:"درخواست فاکتور خدمات",invoice:"فاکتورهای خدمات شما",empty:"هنوز فاکتوری نیست.",
  ref:"شماره مرجع رسید قابل‌بررسی",send:"ارسال ادعای پرداخت برای بررسی دستی",
  method:"روش پرداخت",wait:"بدون دریافت رهنمود رسمی، هیچ پولی انتقال ندهید.",
  fail:"درخواست ناموفق بود؛ صلاحیت حساب را بررسی کنید.",renew:"حق اشتراک فعال",status:"وضعیت",return:"تازه‌سازی"},
 ps:{heading:"مسلکي پلانونه او حسابونه",sub:"یوازې د اپ خدمتونه؛ د ملکیت پیسې نه دي.",
  plans:"وړاندیز شوي پلانونه",disabled:"تر ځايي نرخونو او تادیې تایید پورې پیسې بندې دي.",
  create:"د خدمت بل وغواړئ",invoice:"ستاسو د خدمت بلونه",empty:"تر اوسه بل نشته.",
  ref:"د رسید د تادیې حواله",send:"د لاسي ارزونې لپاره ادعا ولېږئ",
  method:"د تادیې ډول",wait:"د رسمي لارښوونو پرته پیسې مه لېږئ.",
  fail:"غوښتنه ناکامه وه، خپل لاسرسی وګورئ.",renew:"فعال پلان",status:"حالت",return:"بیا تازه کړه"}
};
export function BillingScreen({agencyId,listingId}:{agencyId?:string;listingId?:string}){
 const {token}=useAuth(),{locale}=usePreferences(),t=copy[locale],rtl=isRTL(locale);
 const [plans,setPlans]=useState<Plans|null>(null),[invoices,setInvoices]=useState<Invoice[]>([]);
 const [entitlement,setEntitlement]=useState<{plan:string;listingLimit:number;seatLimit:number;expiresAt:string|null}|null>(null);
 const [reference,setReference]=useState(""),[selectedInvoice,setSelectedInvoice]=useState<string|null>(null),
  [method,setMethod]=useState<"bank_transfer"|"cash_deposit"|"other">("bank_transfer"),
  [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const load=useCallback(async()=>{
  if(!token)return;
  try{
   const [catalog,owned,grant]=await Promise.all([
    requestJson<Plans>("/v1/plans"),
    requestJson<{items:Invoice[]}>("/v1/invoices",{token}),
    requestJson<{plan:string;listingLimit:number;seatLimit:number;expiresAt:string|null}>(
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
  <SectionCard>
   <Label weight="bold">{t.renew}</Label>
   <Label>{entitlement?.plan||"—"} · {entitlement?.listingLimit??3} listings · {entitlement?.seatLimit??1} seats</Label>
   {entitlement?.expiresAt?<Label muted>{new Date(entitlement.expiresAt).toLocaleDateString(locale==="en"?"en-GB":"fa-AF")}</Label>:null}
  </SectionCard>
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
