"use client";
import {useCallback,useEffect,useState} from "react";
type Claim={id:string;invoiceId:string;method:string;reference:string;createdAt:string;status:string};
type Invoice={id:string;productCode:string;agencyId:string|null;listingId:string|null;amountAfn:number;status:string;payerId:string};
type Item={claim:Claim;invoice:Invoice};
export function BillingPanel(){
 const [items,setItems]=useState<Item[]>([]),[reason,setReason]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
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
  if(decision==="confirm"&&!window.confirm("آیا پرداخت این فاکتور را در سوابق مستقل مالی واقعاً تطبیق و تأیید کردید؟"))return;
  if(decision==="reject"&&!window.confirm("این درخواست پرداخت رد شود؟"))return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/billing/claims/"+item.claim.id+"/decision",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
     decision,reason:note,reconciled:decision==="confirm"
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
   <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
    <button disabled={busy||!(reason[claim.id]||"").trim()} className="admin-button" onClick={()=>void decide({claim,invoice},"confirm")}>تأیید پس از تطبیق</button>
    <button disabled={busy||!(reason[claim.id]||"").trim()} className="admin-button secondary" onClick={()=>void decide({claim,invoice},"reject")}>رد ادعا</button>
   </div>
  </article>)}
 </section>;
}
