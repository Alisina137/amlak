"use client";
import {useCallback,useEffect,useState} from "react";
type Agent={id:string;displayName:string;email:string;agentStatus:string};
export function AgentQueue(){
 const [items,setItems]=useState<Agent[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [reason,setReason]=useState<Record<string,string>>({}),[working,setWorking]=useState<string|null>(null);
 const [query,setQuery]=useState("");
 const filtered=items.filter(item=>(item.displayName+" "+item.email).toLowerCase().includes(query.trim().toLowerCase()));
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{const r=await fetch("/api/agents",{cache:"no-store"});if(!r.ok)throw Error("Read failed");
    const data=await r.json() as {items:Agent[]};setItems(data.items);}
  catch{setError("فهرست رهنماها بارگیری نشد.");}finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 async function decide(id:string,decision:"approve"|"reject"){
  if(working||(reason[id]||"").trim().length<8)return;
  if(!window.confirm(decision==="approve"?"درخواست رهنما تأیید شود؟":"درخواست رهنما با دلیل رد شود؟"))return;
  setWorking(id);setError("");
  try{
   const r=await fetch("/api/agents/"+encodeURIComponent(id)+"/decision",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision,reason:reason[id]||""})
   });
   if(!r.ok)throw Error("Decision failed");
   await load();
  }catch{setError("تصمیم ثبت نشد؛ علت را وارد کنید و دوباره تلاش کنید.");}finally{setWorking(null);}
 }
 return <div className="admin-card">
  <div className="admin-queue-tools">
   <label htmlFor="agent-search">جستجوی نام یا ایمیل</label>
   <input id="agent-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو"/>
  </div>
  <p aria-live="polite">{filtered.length.toLocaleString("fa-AF")} / {items.length.toLocaleString("fa-AF")}</p>
  <button className="admin-button" type="button" disabled={loading} onClick={()=>void load()}>تازه‌سازی</button>
  {error?<p role="alert">{error}</p>:null}
  {loading?<p>در حال بارگیری…</p>:items.length===0?<p>درخواستی معطل نیست.</p>:null}
  {filtered.map(agent=><article className="agency-review" key={agent.id}>
   <h3>{agent.displayName}</h3><p>{agent.email}</p>
   <label htmlFor={"reason-"+agent.id}>علت تصمیم (حداقل ۸ حرف)</label>
   <textarea id={"reason-"+agent.id} value={reason[agent.id]||""} maxLength={500} onChange={e=>setReason(prev=>({...prev,[agent.id]:e.target.value}))}/>
   <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <button className="admin-button" disabled={!!working||working===agent.id||(reason[agent.id]||"").trim().length<8} onClick={()=>void decide(agent.id,"approve")}>تأیید</button>
    <button className="admin-button secondary" disabled={!!working||working===agent.id||(reason[agent.id]||"").trim().length<8} onClick={()=>void decide(agent.id,"reject")}>رد</button>
   </div>
  </article>)}
 </div>;
}
