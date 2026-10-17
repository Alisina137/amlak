"use client";
import {useCallback,useEffect,useState} from "react";
type Agency={id:string;name:string;provinceId:string;createdAt:string;status:string};
export function AgencyQueue(){
 const [items,setItems]=useState<Agency[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const [reason,setReason]=useState<Record<string,string>>({}),[working,setWorking]=useState<string|null>(null);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/agencies",{cache:"no-store"});
   if(!r.ok)throw new Error("No access");
   const data=await r.json() as {items:Agency[]};setItems(data.items);
  }catch{setError("فهرست درخواست‌ها بارگیری نشد.");}finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 async function decide(id:string,decision:"approve"|"reject"){
  setError("");setWorking(id);
  try{
   const r=await fetch("/api/agencies/"+encodeURIComponent(id)+"/decision",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision,reason:reason[id]||""})
   });
   if(!r.ok)throw new Error("Failed");
   await load();
  }catch{setError("عملیات انجام نشد؛ علت را وارد کنید و صلاحیت خود را بررسی نمایید.");}finally{setWorking(null);}
 }
 return <div className="admin-card">
  <button className="admin-button" type="button" onClick={()=>void load()} disabled={loading}>تازه‌سازی</button>
  {error?<p role="alert">{error}</p>:null}
  {loading?<p>در حال بارگیری درخواست‌ها…</p>:items.length===0?<p>درخواست معطل موجود نیست.</p>:null}
  {items.map(item=><article key={item.id} className="agency-review">
   <h3>{item.name}</h3><p>{item.provinceId} · {new Date(item.createdAt).toLocaleDateString("fa-AF")}</p>
   <label htmlFor={"reason-"+item.id}>علت تصمیم (حداقل ۸ حرف)</label>
   <textarea id={"reason-"+item.id} value={reason[item.id]||""} onChange={e=>setReason(s=>({...s,[item.id]:e.target.value}))} maxLength={500}/>
   <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
    <button className="admin-button" disabled={working===item.id || (reason[item.id]||"").trim().length<8}
      onClick={()=>void decide(item.id,"approve")}>تأیید</button>
    <button className="admin-button secondary" disabled={working===item.id || (reason[item.id]||"").trim().length<8}
      onClick={()=>void decide(item.id,"reject")}>رد درخواست</button>
   </div>
  </article>)}
 </div>;
}
