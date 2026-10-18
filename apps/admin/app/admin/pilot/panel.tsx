"use client";
import {useCallback,useEffect,useState} from "react";
type Metrics={asOf:string;agencyActive:number;kabulPublished:number;kabulFresh14:number;kabulFresh14Percent:number;
 pendingReview:number;openCases:number;highRisk:number;inquiries30:number;viewings30:number;stalePublished:number;
 automatedEligibility:boolean;releaseReason:string;pilotTargets:{kabulAgencies:number;kabulListings:number;freshPercent:number}};
type Sweep={dueReminder:number;duePause:number;reminded:number;paused:number;visitCancellations:number;inspected:number};
async function get<T>(key:string,method:"GET"|"POST"="GET"):Promise<T>{
 const response=await fetch("/api/pilot/"+key,{method,cache:"no-store"});
 const body=await response.json() as T&{error?:string};
 if(!response.ok)throw Error(body.error||"REQUEST_FAILED");
 return body;
}
const labels:[keyof Metrics,string][]=[
 ["agencyActive","دفاتر فعال"],["kabulPublished","ملک‌های کابل"],["kabulFresh14","ملک‌های تازه"],
 ["kabulFresh14Percent","تازگی (%)"],["pendingReview","بررسی‌های معطل"],
 ["openCases","پرونده‌های باز"],["highRisk","پرونده‌های خطرناک"],["inquiries30","پرسش‌های ۳۰ روز"],
 ["viewings30","بازدیدهای ۳۰ روز"],["stalePublished","آگهی‌های منقضی"]
];
export function PilotPanel({role}:{role:string}){
 const [metrics,setMetrics]=useState<Metrics|null>(null),[preview,setPreview]=useState<Sweep|null>(null);
 const [result,setResult]=useState<Sweep|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const canExecute=["admin","super_admin"].includes(role);
 const reload=useCallback(async()=>{
  setBusy(true);setError("");
  try{const [m,p]=await Promise.all([get<Metrics>("scorecard"),get<Sweep>("freshness")]);setMetrics(m);setPreview(p);}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 async function sweep(){
  if(!canExecute||busy||!window.confirm("اجرای کنترل موجودی؟ ملک‌هایی که ۳۰ روز تأیید نشده‌اند، متوقف خواهند شد."))return;
  setBusy(true);setError("");
  try{setResult(await get<Sweep>("freshness/run","POST"));
   const [m,p]=await Promise.all([get<Metrics>("scorecard"),get<Sweep>("freshness")]);setMetrics(m);setPreview(p);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="admin-card" style={{display:"grid",gap:16}}>
  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
   <button type="button" disabled={busy} className="admin-button secondary" onClick={()=>void reload()}>تازه‌سازی آمار</button>
   {canExecute?<button type="button" disabled={busy} className="admin-button" onClick={()=>void sweep()}>کنترل موجودی (حداکثر ۱۰۰ ملک)</button>:null}
  </div>
  {error?<p role="alert">{error}</p>:null}
  {metrics?<><p>آخرین بررسی: {new Date(metrics.asOf).toLocaleString("fa-AF")}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
    {labels.map(([k,label])=><article key={k} style={{padding:12,border:"1px solid #bacac5",borderRadius:12}}>
      <strong style={{fontSize:26}}>{String(metrics[k])}</strong><p>{label}</p>
    </article>)}</div>
    <p>آستانهٔ آزمایشی: {metrics.pilotTargets.kabulAgencies} دفتر، {metrics.pilotTargets.kabulListings} آگهی و {metrics.pilotTargets.freshPercent}% تازگی.</p>
    <p>{metrics.automatedEligibility?"آستانه‌های آماری برآورده شدند. تأیید انسانی هنوز ضروری است.":"هنوز به آستانه‌های آماری نرسیده‌ایم."}</p>
    <p>{metrics.releaseReason}</p>
  </>:<p>در حال بارگیری…</p>}
  {preview?<article className="agency-review"><h2>پیش‌نمایش، بدون تغییر</h2>
   <p>{preview.inspected} بررسی · {preview.dueReminder} یادآوری · {preview.duePause} توقف</p>
  </article>:null}
  {result?<p role="status">{result.reminded} یادآوری، {result.paused} توقف، {result.visitCancellations} لغو بازدید.</p>:null}
 </section>;
}