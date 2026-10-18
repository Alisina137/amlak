"use client";
import {useCallback,useEffect,useState} from "react";
type Invoice={id:string;payerId:string;amountAfn:number;productCode:string;status:string};
type Adjustment={id:string;invoiceId:string;kind:"refund"|"credit";amountAfn:number;
 status:"requested"|"approved"|"rejected"|"settled"|"issued";reason:string;
 reviewReason:string|null;reviewedBy:string|null;createdAt:string};
type Row={adjustment:Adjustment;invoice:Invoice};
type History={claims:{claim:{id:string;status:string;reviewReason:string|null;
 reconciliationAmountAfn:number|null;reconciliationDate:string|null;reviewedAt:string|null},invoice:Invoice}[];
 adjustments:Adjustment[]};
type FinanceSummary={currency:"AFN";confirmedPlatformInvoices:number;verifiedPlatformFeesAfn:number;
 externallySettledRefundsAfn:number;noncashCreditMemosAfn:number;feesMinusExternallySettledRefundsAfn:number;
 pendingClaimCount:number;notice:string};
export function BillingAdjustmentsPanel(){
 const [items,setItems]=useState<Row[]>([]),[history,setHistory]=useState<History>({claims:[],adjustments:[]});
 const [summary,setSummary]=useState<FinanceSummary|null>(null);
 const [reasons,setReasons]=useState<Record<string,string>>({}),[references,setReferences]=useState<Record<string,string>>({});
 const [methods,setMethods]=useState<Record<string,"bank_transfer"|"cash_deposit"|"other">>({});
 const [verified,setVerified]=useState<Record<string,boolean>>({});
 const [loading,setLoading]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const reload=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [queueResponse,historyResponse,summaryResponse]=await Promise.all([
    fetch("/api/billing/adjustments",{cache:"no-store"}),
    fetch("/api/billing/history",{cache:"no-store"}),
    fetch("/api/billing/reconciliation",{cache:"no-store"})
   ]);
   const queue=await queueResponse.json() as {items?:Row[];error?:string};
   const past=await historyResponse.json() as History&{error?:string};
   const summaryResult=await summaryResponse.json() as FinanceSummary&{error?:string};
   if(!queueResponse.ok||!historyResponse.ok||!summaryResponse.ok)
    throw Error(queue.error||past.error||summaryResult.error||"REQUEST_FAILED");
   setItems(queue.items||[]);setHistory(past);setSummary(summaryResult);
  }catch(err){setError((err as Error).message);}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 async function action(row:Row,mode:"approve"|"reject"|"settle"){
  const id=row.adjustment.id,reason=(reasons[id]||"").trim();
  if(reason.length<15){setError("دلیل تصمیم باید حداقل ۱۵ حرف باشد.");return;}
  if(mode==="settle"&&((references[id]||"").trim().length<8||!verified[id])){
   setError("مرجع پرداخت برگشتی را پس از انتقال واقعی و تطبیق مستقل درج کنید.");return;
  }
  if(!window.confirm(mode==="settle"?"آیا پول واقعاً در کانال بانکی/نقدی خارج از برنامه برگشت داده شده و مدرک آن ثبت است؟":
   mode==="approve"?"آیا پس از بررسی درخواست و سیاست بازپرداخت آن را تأیید می‌کنید؟":"آیا این درخواست رد شود؟"))return;
  setLoading(true);setError("");setNotice("");
  try{
   const endpoint="/api/billing/adjustments/"+id+"/"+(mode==="settle"?"settle":"decision");
   const payload=mode==="settle"?{method:methods[id]||"bank_transfer",
    reference:references[id].trim(),reason,independentlyVerified:true}:
    {decision:mode,reason};
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)});
   const data=await response.json() as {error?:string;status?:string};
   if(!response.ok)throw Error(data.error||"REQUEST_FAILED");
   setNotice("وضعیت درخواست به "+data.status+" تغییر یافت.");
   await reload();
  }catch(err){setError((err as Error).message);}finally{setLoading(false);}
 }
 return <section className="admin-card" style={{display:"grid",gap:14}}>
  <h2>خلاصه سوابق داخلی خدمات — فقط افغانی</h2>
  {summary?<div className="agency-review" style={{display:"grid",gap:6}}>
   <p>فاکتورهای تأییدشده: {summary.confirmedPlatformInvoices}</p>
   <p>جمع خدمات تأییدشده: {summary.verifiedPlatformFeesAfn.toLocaleString("fa-AF")} افغانی</p>
   <p>جمع بازپرداخت‌های تسویه‌شده: {summary.externallySettledRefundsAfn.toLocaleString("fa-AF")} افغانی</p>
   <p>یادداشت‌های اعتبار غیرنقدی: {summary.noncashCreditMemosAfn.toLocaleString("fa-AF")} افغانی</p>
   <p>ادعاهای در انتظار بررسی: {summary.pendingClaimCount}</p>
   <p>جمع خدمات منهای بازپرداخت‌های ثبت‌شده: {summary.feesMinusExternallySettledRefundsAfn.toLocaleString("fa-AF")} افغانی</p>
   <p>این فقط خلاصه سوابق داخلی است، نه موجودی بانک یا تأیید حسابرسی و نه پول معاملهٔ ملک.</p>
  </div>:null}
  <h2>درخواست‌های بازپرداخت و اعتبار خدمات</h2>
  <p>اعتبار فقط یادداشت غیرنقدی است و فعلاً قابل مصرف به‌عنوان پول نیست. درخواست بازپرداخت پول را انتقال نمی‌دهد؛ تسویه فقط پس از انتقال واقعی خارج از سیستم ثبت می‌شود.</p>
  <button className="admin-button secondary" onClick={()=>void reload()} disabled={loading}>تازه‌سازی</button>
  {error?<p role="alert">{error}</p>:null}{notice?<p role="status">{notice}</p>:null}
  {items.length===0&&!loading?<p>درخواست فعال وجود ندارد.</p>:null}
  {items.map(row=>{
   const item=row.adjustment,id=item.id;
   return <article key={id} className="agency-review" style={{display:"grid",gap:8}}>
    <h3>{item.kind==="refund"?"بازپرداخت":"یادداشت اعتبار"} · {item.amountAfn.toLocaleString("fa-AF")} افغانی</h3>
    <p>شماره فاکتور <code dir="ltr">{item.invoiceId}</code> · {item.status}</p>
    <p>{item.reason}</p>
    <label htmlFor={"adjust-reason-"+id}>دلیل تصمیم و تطبیق با سیاست (حداقل ۱۵ حرف)</label>
    <textarea id={"adjust-reason-"+id} value={reasons[id]||""} maxLength={700}
     onChange={event=>setReasons(old=>({...old,[id]:event.target.value}))}/>
    {item.status==="requested"?<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
     <button className="admin-button" disabled={loading} onClick={()=>void action(row,"approve")}>تأیید بررسی</button>
     <button className="admin-button secondary" disabled={loading} onClick={()=>void action(row,"reject")}>رد درخواست</button>
    </div>:null}
    {item.status==="approved"&&item.kind==="refund"?<fieldset style={{display:"grid",gap:8}}>
     <legend>ثبت تسویه واقعی بیرونی — توسط کارمند دوم</legend>
     <label htmlFor={"settle-method-"+id}>روش بازپرداخت واقعی</label>
     <select id={"settle-method-"+id} value={methods[id]||"bank_transfer"}
      onChange={event=>setMethods(old=>({...old,[id]:event.target.value as "bank_transfer"|"cash_deposit"|"other"}))}>
      <option value="bank_transfer">انتقال بانکی</option>
      <option value="cash_deposit">پرداخت نقدی تأییدشده</option>
      <option value="other">روش دیگر</option>
     </select>
     <label htmlFor={"settle-ref-"+id}>مرجع مستقل تراکنش بازگشت پول</label>
     <input id={"settle-ref-"+id} value={references[id]||""} maxLength={120}
      onChange={event=>setReferences(old=>({...old,[id]:event.target.value}))}/>
     <label><input type="checkbox" checked={!!verified[id]}
      onChange={event=>setVerified(old=>({...old,[id]:event.target.checked}))}/>
      انتقال پول واقعاً انجام و مستقل تطبیق شده است.</label>
     <button className="admin-button" disabled={loading} onClick={()=>void action(row,"settle")}>ثبت تسویه مستقل</button>
    </fieldset>:null}
   </article>;
  })}
  <h2>سوابق مالی بررسی‌شده (حداکثر ۱۰۰ مورد)</h2>
  {history.claims.map(({claim,invoice})=><div key={claim.id} className="agency-review">
   <p>پرداخت: {invoice.productCode} · {invoice.amountAfn} AFN · {claim.status}</p>
   <p>{claim.reviewReason||"—"} · سند تطبیق: {claim.reconciliationDate||"—"} · {claim.reconciliationAmountAfn??"—"} AFN</p>
  </div>)}
  {history.adjustments.map(item=><div key={item.id} className="agency-review">
   <p>{item.kind} · {item.amountAfn} AFN · {item.status}</p>
   <p>{item.reviewReason||item.reason}</p>
  </div>)}
 </section>;
}
