import * as Crypto from "expo-crypto";
import {useCallback,useEffect,useState} from "react";
import {TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {requestJson} from "./auth";
import {usePreferences} from "./context";
import {Action,Label,SectionCard} from "./ui";

export type PlatformInvoice={id:string;agencyId:string|null;listingId:string|null;
 productCode:string;amountAfn:number;status:string;createdAt:string};
type Claim={id:string;status:string;method:string;reviewReason:string|null;reviewedAt:string|null};
type Adjustment={id:string;invoiceId:string;kind:"refund"|"credit";amountAfn:number;
 reason:string;status:string;reviewReason:string|null;createdAt:string};
const strings={
 en:{title:"Payment reviews and adjustments",claims:"Payment review history",failed:"Payment claim rejected",
  note:"Submit a different, genuine receipt reference for a rejected claim. The previous reference cannot be used again.",
  choose:"Request a platform-service refund or credit review",refund:"Refund review",credit:"Service credit memo",
  amount:"Requested amount (AFN)",reason:"Reason for adjustment (at least 15 characters)",
  submit:"Submit request",details:"Your adjustment requests",
  none:"No adjustment requests.",accepted:"Request recorded; staff review is required.",
  error:"Unable to complete request. Check your invoice and try again.",
  caution:"No refund is transferred by this request. Credits are noncash memos, not spendable balances. Platform services only.",
  select:"Select a confirmed invoice",status:"Status",updated:"Refresh",reasonLabel:"Staff decision"},
 fa:{title:"بررسی پرداخت و اصلاحات",claims:"سابقه بررسی پرداخت",failed:"ادعای پرداخت رد شده",
  note:"برای ادعای ردشده، یک شماره رسید واقعی دیگر ارائه کنید. شماره قبلی دوباره قابل استفاده نیست.",
  choose:"درخواست بررسی بازپرداخت یا اعتبار خدمات",refund:"بررسی بازپرداخت",credit:"یادداشت اعتبار خدمات",
  amount:"مبلغ درخواستی (افغانی)",reason:"دلیل درخواست (حداقل ۱۵ حرف)",
  submit:"ارسال درخواست",details:"درخواست‌های مالی شما",
  none:"هنوز درخواستی ثبت نشده.",accepted:"درخواست ثبت شد و نیاز به بررسی کارمند دارد.",
  error:"درخواست انجام نشد؛ فاکتور را بررسی و دوباره تلاش کنید.",
  caution:"ارسال این درخواست پولی بازنمی‌گرداند. اعتبار فقط یادداشت غیرنقدی است و فعلاً قابل مصرف نیست. فقط خدمات پلتفرم.",
  select:"فاکتور تأییدشده را انتخاب کنید",status:"وضعیت",updated:"تازه‌سازی",reasonLabel:"دلیل تصمیم"},
 ps:{title:"د تادیې ارزونه او سمون",claims:"د تادیې د ارزونې تاریخ",failed:"د تادیې ادعا رد شوې",
  note:"د رد شوې تادیې لپاره بل رښتینی رسید نمبر وړاندې کړئ. زوړ نمبر بیا مه کاروئ.",
  choose:"د خدمت پیسو بیرته ورکولو یا اعتبار غوښتنه",refund:"د پیسو بیرته ورکولو ارزونه",credit:"د خدمت اعتبار یادښت",
  amount:"غوښتل شوې اندازه (افغانۍ)",reason:"د غوښتنې دلیل (لږ تر لږه ۱۵ توري)",
  submit:"غوښتنه ولېږئ",details:"ستاسو مالي غوښتنې",
  none:"تراوسه غوښتنه نشته.",accepted:"غوښتنه ثبت شوه؛ د کارمند ارزونې ته اړتیا لري.",
  error:"غوښتنه ترسره نه شوه؛ بل وګورئ او بیا هڅه وکړئ.",
  caution:"دا غوښتنه پخپله پیسې نه لېږدوي. اعتبار یوازې غیرنغدي یادښت دی او تر اوسه د مصرف وړ نه دی. یوازې د اپ خدمتونه.",
  select:"تایید شوی بل غوره کړئ",status:"حالت",updated:"بیا تازه کړه",reasonLabel:"د پرېکړې دلیل"}
};
export function BillingAdjustmentUI({token,invoices}:{token:string;invoices:PlatformInvoice[]}){
 const {locale}=usePreferences(),t=strings[locale],rtl=isRTL(locale);
 const [items,setItems]=useState<Adjustment[]>([]),[claims,setClaims]=useState<Claim[]>([]);
 const [invoiceId,setInvoiceId]=useState<string|null>(null),[historyId,setHistoryId]=useState<string|null>(null);
 const [kind,setKind]=useState<"refund"|"credit">("refund"),[amount,setAmount]=useState(""),[reason,setReason]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const refresh=useCallback(async()=>{
  try{const r=await requestJson<{items:Adjustment[]}>("/v1/billing/adjustments",{token});
   setItems(r.items);setError("");
  }catch{setError(t.error);}
 },[token,t.error]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{
  let active=true;
  if(!historyId){setClaims([]);return;}
  void requestJson<{items:Claim[]}>("/v1/invoices/"+historyId+"/claims",{token})
   .then(r=>{if(active)setClaims(r.items);}).catch(()=>{if(active)setError(t.error);});
  return ()=>{active=false;};
 },[historyId,token,t.error]);
 const available=invoices.filter(i=>i.status==="confirmed");
 const chosen=available.find(i=>i.id===invoiceId);
 const used=items.filter(i=>i.invoiceId===invoiceId&&i.status!=="rejected").reduce((sum,i)=>sum+i.amountAfn,0);
 async function submit(){
  const value=Number(amount.trim());
  if(!chosen||busy||!Number.isInteger(value)||value<=0||value>chosen.amountAfn-used||reason.trim().length<15)return;
  setBusy(true);setMessage("");setError("");
  try{
   await requestJson("/v1/invoices/"+chosen.id+"/adjustments",{
    token,method:"POST",body:{requestId:Crypto.randomUUID(),kind,
     amountAfn:value,reason:reason.trim()}});
   setAmount("");setReason("");setMessage(t.accepted);await refresh();
  }catch{setError(t.error);}finally{setBusy(false);}
 }
 const inputStyle={color:colors.text,borderColor:colors.border,borderWidth:1,borderRadius:10,
  padding:12,minHeight:48,writingDirection:rtl?"rtl" as const:"ltr" as const,
  textAlign:rtl?"right" as const:"left" as const};
 return <SectionCard>
  <Label weight="bold">{t.title}</Label><Label muted>{t.caution}</Label>
  {invoices.filter(i=>i.status==="rejected"||i.status==="confirmed"||i.status==="submitted").map(i=>
   <View key={i.id} style={{gap:6,borderTopWidth:1,borderColor:colors.border,paddingTop:8}}>
    <Label>{i.productCode.replaceAll("_"," ")} · {i.amountAfn.toLocaleString()} AFN</Label>
    <Label muted>{t.status}: {i.status}</Label>
    <Action kind="secondary" label={t.claims}
     onPress={()=>setHistoryId(previous=>previous===i.id?null:i.id)}/>
    {historyId===i.id?<View style={{gap:4}}>
     {claims.map(claim=><View key={claim.id}>
      <Label muted>{claim.method} · {claim.status}</Label>
      {claim.reviewReason?<Label>{t.reasonLabel}: {claim.reviewReason}</Label>:null}
      {claim.status==="rejected"?<Label style={{color:colors.warning}}>{t.note}</Label>:null}
     </View>)}
    </View>:null}
   </View>)}
  <Label weight="bold">{t.choose}</Label>
  {!available.length?<Label muted>{t.select}</Label>:null}
  {available.map(i=><Action key={i.id} kind={invoiceId===i.id?"primary":"secondary"}
   label={i.productCode.replaceAll("_"," ")+" · "+i.amountAfn.toLocaleString()+" AFN"}
   onPress={()=>{setInvoiceId(i.id);setAmount("");setReason("");}}/>)}
  {chosen?<View style={{gap:8}}>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
    <View style={{flex:1}}><Action label={t.refund} kind={kind==="refund"?"primary":"secondary"}
     onPress={()=>setKind("refund")}/></View>
    <View style={{flex:1}}><Action label={t.credit} kind={kind==="credit"?"primary":"secondary"}
     onPress={()=>setKind("credit")}/></View>
   </View>
   <Label>{t.amount} · max {(chosen.amountAfn-used).toLocaleString()}</Label>
   <TextInput accessibilityLabel={t.amount} keyboardType="numeric"
    value={amount} onChangeText={setAmount} style={inputStyle}/>
   <Label>{t.reason}</Label>
   <TextInput accessibilityLabel={t.reason} multiline maxLength={700}
    value={reason} onChangeText={setReason} style={[inputStyle,{minHeight:86,textAlignVertical:"top"}]}/>
   <Action label={t.submit} disabled={busy||reason.trim().length<15||
    !Number.isInteger(Number(amount))||Number(amount)<=0||Number(amount)>chosen.amountAfn-used}
    onPress={()=>void submit()}/>
  </View>:null}
  <Label weight="bold">{t.details}</Label>
  {!items.length?<Label muted>{t.none}</Label>:items.map(item=>
   <View key={item.id} style={{paddingVertical:8,gap:5,borderTopWidth:1,borderColor:colors.border}}>
    <Label weight="bold">{item.kind==="credit"?t.credit:t.refund} · {item.amountAfn.toLocaleString()} AFN</Label>
    <Label muted>{t.status}: {item.status}</Label>
    <Label>{item.reason}</Label>
    {item.reviewReason?<Label muted>{t.reasonLabel}: {item.reviewReason}</Label>:null}
   </View>)}
  {message?<Label style={{color:colors.success}}>{message}</Label>:null}
  {error?<Label style={{color:colors.error}}>{error}</Label>:null}
  <Action kind="secondary" label={t.updated} disabled={busy} onPress={()=>void refresh()}/>
 </SectionCard>;
}
