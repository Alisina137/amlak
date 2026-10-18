"use client";
import {useCallback,useEffect,useState} from "react";
type Case={id:string;listingId:string;status:string;severity:string;version:number;createdAt:string;resolution:string|null};
type Detail={case:Case;listing:{id:string;status:string;safetyHold:boolean;version:number};report:{reason:string;details:string}|null;
 appeal:{reason:string;decision:string|null;reviewReason:string|null}|null};
type Duplicate={id:string;listingId:string;otherListingId:string;rationale:string;status:string;createdAt:string};
const statuses=["all","open","triaged","investigating","appealed","resolved","rejected","closed"] as const;
type Props={role:string};
async function api<T>(path:string,body?:object):Promise<T>{
 const r=await fetch("/api/safety/"+path,{method:body?"POST":"GET",
  headers:body?{"Content-Type":"application/json"}:{},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store"});
 const result=await r.json() as T&{error?:string};
 if(!r.ok)throw Error(result.error||"REQUEST_FAILED");
 return result;
}
export function SafetyPanel({role}:Props){
 const canModerate=["moderator","admin","super_admin"].includes(role);
 const canVerify=["verification","admin","super_admin"].includes(role);
 const canSeeCases=["moderator","support","admin","super_admin"].includes(role);
 const [tab,setTab]=useState<"cases"|"duplicates"|"verify">(canSeeCases?"cases":"verify");
 const [status,setStatus]=useState<string>("open"),[cases,setCases]=useState<Case[]>([]),[duplicates,setDuplicates]=useState<Duplicate[]>([]);
 const [selected,setSelected]=useState<Detail|null>(null),[reason,setReason]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [kind,setKind]=useState<"user"|"agency"|"listing">("listing"),[subject,setSubject]=useState(""),[scope,setScope]=useState("listing_authorization_reviewed");
 const [method,setMethod]=useState("manual_offline_review"),[result,setResult]=useState<"approved"|"rejected"|"revoked"|"expired">("approved"),[expiry,setExpiry]=useState("");
 const load=useCallback(async()=>{
  setError("");
  try{
   if(tab==="cases"){
    const r=await api<{items:Case[]}>("cases"+(status==="all"?"":"?status="+status));setCases(r.items);
   }else if(tab==="duplicates"){
    const r=await api<{items:Duplicate[]}>("duplicates");setDuplicates(r.items);
   }
  }catch(e){setError((e as Error).message);}
 },[tab,status]);
 useEffect(()=>{void load();},[load]);
 async function openCase(id:string){
  setError("");setMessage("");
  try{const r=await api<Detail>("cases/"+id);setSelected(r);setReason("");}catch(e){setError((e as Error).message);}
 }
 async function mutate(path:string,data:object){
  if(busy)return;setBusy(true);setError("");setMessage("");
  try{await api(path,data);setMessage("تصمیم با ثبت حسابرسی ذخیره شد.");await load();
   if(selected)await openCase(selected.case.id);
  }catch(e){setError("عملیات ناموفق: "+(e as Error).message);}finally{setBusy(false);}
 }
 async function scan(){
  await mutate("duplicates/scan",{limit:80});setTab("duplicates");
 }
 async function recordVerification(){
  if(subject.length!==36||reason.trim().length<8)return;
  await mutate("verification",{subjectKind:kind,subjectId:subject,scope,method,result,reason,
   expiresAt:expiry?new Date(expiry).toISOString():null});
 }
 const availableScopes=kind==="user"?["identity_reviewed","professional_application_reviewed"]:kind==="agency"?["agency_registration_reviewed"]:["listing_authorization_reviewed"];
 return <div className="admin-card" style={{display:"grid",gap:18}}>
  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
   {canSeeCases?<button type="button" className={tab==="cases"?"admin-button":"admin-button secondary"} onClick={()=>{setTab("cases");setSelected(null);}}>شکایات / اعتراض‌ها</button>:null}
   {canModerate?<button type="button" className={tab==="duplicates"?"admin-button":"admin-button secondary"} onClick={()=>{setTab("duplicates");setSelected(null);}}>آگهی‌های مشابه</button>:null}
   {canVerify?<button type="button" className={tab==="verify"?"admin-button":"admin-button secondary"} onClick={()=>{setTab("verify");setSelected(null);}}>ثبت بررسی معتبر</button>:null}
  </div>
  {error?<p role="alert" style={{color:"#a52a2a"}}>{error}</p>:null}
  {message?<p role="status">{message}</p>:null}
  {tab==="cases"&&canSeeCases?<section style={{display:"grid",gap:12}}>
   <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
    <label htmlFor="case-status">وضعیت پرونده</label>
    <select id="case-status" value={status} onChange={e=>{setStatus(e.target.value);setSelected(null);}}>
     {statuses.map(s=><option key={s} value={s}>{s}</option>)}
    </select>
    <button type="button" className="admin-button secondary" onClick={()=>void load()}>تازه‌سازی</button>
   </div>
   {cases.length===0?<p>در این صف پرونده‌ای موجود نیست.</p>:null}
   {cases.map(c=><article key={c.id} className="agency-review">
    <strong>{c.status} · {c.severity}</strong><p>ملک: {c.listingId}</p>
    <p>{new Date(c.createdAt).toLocaleString("fa-AF")} · نسخه {c.version}</p>
    <button type="button" className="admin-button secondary" onClick={()=>void openCase(c.id)}>بازکردن پرونده</button>
   </article>)}
   {selected?<article className="agency-review" style={{display:"grid",gap:9}}>
    <h2>پرونده {selected.case.id}</h2>
    <p>ملک {selected.listing.id} · {selected.listing.status} {selected.listing.safetyHold?" · در حالت توقف ایمنی":""}</p>
    <p>دلیل گزارش: {selected.report?.reason||"—"}</p>
    <p style={{whiteSpace:"pre-wrap"}}>{selected.report?.details||"بدون گزارش مستقیم"}</p>
    {selected.appeal?<div><h3>اعتراض آگهی‌دهنده</h3><p>{selected.appeal.reason}</p>
     <p>{selected.appeal.decision||"در انتظار تصمیم"}</p></div>:null}
    {canModerate?<><label htmlFor="safety-reason">دلیل الزامی تصمیم (حداقل ۱۲ حرف برای توقف، ۸ حرف برای بررسی)</label>
     <textarea id="safety-reason" maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/>
     <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {(["triaged","investigating","resolved","rejected","closed"] as const).map(next=>
       <button key={next} type="button" className="admin-button secondary" disabled={busy||reason.trim().length<8||next===selected.case.status}
        onClick={()=>void mutate("cases/"+selected.case.id+"/transition",{status:next,expectedVersion:selected.case.version,reason})}>{next}</button>)}
     </div>
     <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {!selected.listing.safetyHold&&selected.listing.status==="published"?
       <button className="admin-button" disabled={busy||reason.trim().length<12} onClick={()=>void mutate("listings/"+selected.listing.id+"/hold",{action:"hold",reason,expectedVersion:selected.listing.version})}>توقف ایمنی ملک</button>:null}
      {selected.listing.safetyHold?
       <button className="admin-button secondary" disabled={busy||reason.trim().length<12} onClick={()=>void mutate("listings/"+selected.listing.id+"/hold",{action:"release",reason,expectedVersion:selected.listing.version})}>رفع توقف توسط کارمند</button>:null}
     </div>
     {selected.case.status==="appealed"&&selected.appeal?<div style={{display:"flex",gap:8}}>
      <button className="admin-button" disabled={busy||reason.trim().length<8} onClick={()=>void mutate("cases/"+selected.case.id+"/appeal-decision",{decision:"upheld",reason})}>تأیید تصمیم اصلی</button>
      <button className="admin-button secondary" disabled={busy||reason.trim().length<8} onClick={()=>void mutate("cases/"+selected.case.id+"/appeal-decision",{decision:"overturned",reason})}>پذیرش اعتراض</button>
     </div>:null}
    </>:<p>نقش شما فقط اجازهٔ مشاهدهٔ شکایات را دارد؛ تصمیم ایمنی به مسئول بررسی نیاز دارد.</p>}
   </article>:null}
  </section>:null}
  {tab==="duplicates"&&canModerate?<section style={{display:"grid",gap:14}}>
   <p>این اسکن فقط نامزدهای مشابه را علامت می‌زند و هیچ ملک را خودکار حذف یا متوقف نمی‌کند.</p>
   <button className="admin-button" disabled={busy} onClick={()=>void scan()}>اسکن ۸۰ آگهی تازه</button>
   <button className="admin-button secondary" onClick={()=>void load()}>تازه‌سازی فهرست</button>
   {duplicates.length===0?<p>هیچ نامزد مشابه در انتظار بررسی نیست.</p>:null}
   {duplicates.map(c=><article key={c.id} className="agency-review">
    <p>{c.listingId}</p><p>{c.otherListingId}</p><p>{c.rationale}</p>
    <textarea maxLength={500} placeholder="دلیل تصمیم با حداقل ۸ حرف" value={reason} onChange={e=>setReason(e.target.value)}/>
    <div style={{display:"flex",gap:8}}>
     <button className="admin-button" disabled={busy||reason.trim().length<8} onClick={()=>void mutate("duplicates/"+c.id+"/decision",{decision:"duplicate",reason})}>مشابه است</button>
     <button className="admin-button secondary" disabled={busy||reason.trim().length<8} onClick={()=>void mutate("duplicates/"+c.id+"/decision",{decision:"distinct",reason})}>متفاوت است</button>
    </div>
   </article>)}
  </section>:null}
  {tab==="verify"&&canVerify?<section style={{display:"grid",gap:12}}>
   <p>این کار تنها نتیجهٔ بررسی دستی را ثبت می‌کند؛ فایل‌های هویت/سند در این صفحه آپلود یا نمایش داده نمی‌شوند.</p>
   <label htmlFor="subject-kind">نوع حساب/ملک</label>
   <select id="subject-kind" value={kind} onChange={e=>{const next=e.target.value as typeof kind;setKind(next);
     setScope(next==="user"?"identity_reviewed":next==="agency"?"agency_registration_reviewed":"listing_authorization_reviewed");}}>
    <option value="user">کاربر</option><option value="agency">دفتر</option><option value="listing">ملک</option>
   </select>
   <label htmlFor="subject-id">شناسه UUID</label>
   <input id="subject-id" value={subject} onChange={e=>setSubject(e.target.value)} maxLength={36}/>
   <label htmlFor="scope">محدودهٔ بررسی</label>
   <select id="scope" value={scope} onChange={e=>setScope(e.target.value)}>
    {availableScopes.map(x=><option key={x} value={x}>{x}</option>)}
   </select>
   <label htmlFor="method">روش بررسی (بدون ثبت سند شخصی)</label>
   <input id="method" value={method} onChange={e=>setMethod(e.target.value)} maxLength={80}/>
   <label htmlFor="verification-result">نتیجه</label>
   <select id="verification-result" value={result} onChange={e=>setResult(e.target.value as typeof result)}>
    {["approved","rejected","revoked","expired"].map(x=><option key={x}>{x}</option>)}
   </select>
   <label htmlFor="expiration">انقضا (اختیاری؛ تاریخ ISO)</label>
   <input id="expiration" type="datetime-local" value={expiry} onChange={e=>setExpiry(e.target.value)}/>
   <label htmlFor="verification-reason">دلیل بررسی (حداقل ۸ حرف)</label>
   <textarea id="verification-reason" maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/>
   <button type="button" className="admin-button" disabled={busy||subject.length!==36||reason.trim().length<8}
    onClick={()=>void recordVerification()}>ثبت تصمیم و حسابرسی</button>
  </section>:null}
 </div>;
}
