"use client";
import {useCallback,useEffect,useState} from "react";
type Claim={id:string;invoiceId:string;method:string;reference:string;createdAt:string;status:string};
type Invoice={id:string;productCode:string;agencyId:string|null;listingId:string|null;amountAfn:number;status:string;payerId:string};
type Item={claim:Claim;invoice:Invoice};
export function BillingPanel(){
 const [items,setItems]=useState<Item[]>([]),[reason,setReason]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [statementRef,setStatementRef]=useState<Record<string,string>>({});
 const [matchedAmount,setMatchedAmount]=useState<Record<string,string>>({});
 const [statementDate,setStatementDate]=useState<Record<string,string>>({});
 const [verified,setVerified]=useState<Record<string,boolean>>({});
 const reload=useCallback(async()=>{
  setBusy(true);setError("");try{
   const response=await fetch("/api/billing/claims",{cache:"no-store"});
   const json=await response.json() as {items?:Item[];error?:string};
   if(!response.ok)throw Error(json.error||"REQUEST_FAILED");
   setItems(json.items||[]);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 async function decide(item:Item,decision:"confirm"|"reject"){
  const note=(reason[item.claim.id]||"").trim();
  if(note.length<12){setError("دلیل بررسی حداقل ۱۲ حرف لازم دارد.");return;}
  const amount=Number(matchedAmount[item.claim.id]||"");
  if(decision==="confirm"&&(!verified[item.claim.id]||
    (statementRef[item.claim.id]||"").trim().length<8||
    !statementDate[item.claim.id]||amount!==item.invoice.amountAfn)){
   setError("برای تأیید، تاریخ، مرجع سند مالی مستقل، مبلغ دقیق و تأیید تطبیق را درج کنید.");return;
  }
  if(decision==="confirm"&&!window.confirm("آیا مرجع مستقل مالی، تاریخ و مبلغ را واقعاً تطبیق داده‌اید؟"))return;
  if(decision==="reject"&&!window.confirm("این درخواست پرداخت رد شود؟"))return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/billing/claims/"+item.claim.id+"/decision",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
     decision,reason:note,...(decision==="confirm"?{reconciliation:{
      statementReference:statementRef[item.claim.id].trim(),matchedAmountAfn:amount,
      statementDate:statementDate[item.claim.id],independentlyVerified:true}}:{})
    })});
   const body=await response.json() as {error?:string};
   if(!response.ok)throw Error(body.error||"REQUEST_FAILED");
   setMessage(decision==="confirm"?"پرداخت خدمات تأیید شد.":"درخواست پرداخت رد شد.");
   await reload();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="admin-card" style={{display:"grid",gap:16}}>
  <button className="admin-button secondary" disabled={busy} onClick={()=>void reload()}>تازه‌سازی صف پرداخت</button>
  {error?<p role="alert" className="notice">{error}</p>:null}
  {message?<p role="status">{message}</p>:null}
  {!items.length&&!busy?<p>درخواستی برای بررسی وجود ندارد.</p>:null}
  {items.map(({claim,invoice})=><article className="agency-review" key={claim.id}>
   <h2>فاکتور {invoice.id.slice(0,8)} · {invoice.productCode}</h2>
   <p><strong>{invoice.amountAfn.toLocaleString("fa-AF")} افغانی</strong> (خدمات پلتفرم)</p>
   <p>شناسهٔ پرداخت‌کننده: <code dir="ltr">{invoice.payerId}</code></p>
   <p>دفتر: <code dir="ltr">{invoice.agencyId||"—"}</code> · ملک: <code dir="ltr">{invoice.listingId||"—"}</code></p>
   <p>روش: {claim.method} · زمان ادعا: {new Date(claim.createdAt).toLocaleString("fa-AF")}</p>
   <p>شماره مرجع پرداخت (محرمانه، مخصوص تیم مالی): <code dir="ltr">{claim.reference}</code></p>
   <label htmlFor={"billing-reason-"+claim.id}>یادداشت تطبیق با مدرک مستقل / دلیل رد</label>
   <textarea id={"billing-reason-"+claim.id} maxLength={700} value={reason[claim.id]||""}
    onChange={e=>setReason(old=>({...old,[claim.id]:e.target.value}))}
    placeholder="شماره سند مالی بررسی‌شده و یافته‌های تطبیق را وارد کنید؛ اسناد هویت/بانکی شخص را وارد نکنید."/>
   <fieldset style={{display:"grid",gap:8,border:"1px solid #b8c7c2",borderRadius:12,padding:12}}>
    <legend>تطبیق مستقل پیش از تأیید پرداخت</legend>
    <label htmlFor={"stmt-"+claim.id}>مرجع مستقل سند مالی (غیر از ادعای مشتری)</label>
    <input id={"stmt-"+claim.id} value={statementRef[claim.id]||""} maxLength={120}
     onChange={event=>setStatementRef(old=>({...old,[claim.id]:event.target.value}))}/>
    <label htmlFor={"amount-"+claim.id}>مبلغ تطبیق‌شده به افغانی</label>
    <input id={"amount-"+claim.id} type="number" min="1" max={invoice.amountAfn} step="1"
     value={matchedAmount[claim.id]||""} onChange={event=>setMatchedAmount(old=>({...old,[claim.id]:event.target.value}))}/>
    <label htmlFor={"date-"+claim.id}>تاریخ ثبت پرداخت در سند مستقل (میلادی)</label>
    <input id={"date-"+claim.id} type="date" value={statementDate[claim.id]||""}
     onChange={event=>setStatementDate(old=>({...old,[claim.id]:event.target.value}))}/>
    <label style={{display:"flex",gap:8,alignItems:"center"}}>
     <input type="checkbox" checked={!!verified[claim.id]}
      onChange={event=>setVerified(old=>({...old,[claim.id]:event.target.checked}))}/>
     این پرداخت را شخصاً با مدرک مستقل مالی تطبیق داده‌ام.
    </label>
   </fieldset>
   <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
    <button disabled={busy||!(reason[claim.id]||"").trim()} className="admin-button" onClick={()=>void decide({claim,invoice},"confirm")}>تأیید پس از تطبیق</button>
    <button disabled={busy||!(reason[claim.id]||"").trim()} className="admin-button secondary" onClick={()=>void decide({claim,invoice},"reject")}>رد ادعا</button>
   </div>
  </article>)}
 </section>;
}
