"use client";
import {useCallback,useEffect,useRef,useState} from "react";
type Ticket={id:string;subject:string;category:string;status:string;userId:string;updatedAt:string};
type Entry={ticket:Ticket;userName:string};
type Msg={id:string;body:string;authorUserId:string|null;authorStaffId:string|null;createdAt:string};
export function SupportPanel(){
 const [items,setItems]=useState<Entry[]>([]),[selected,setSelected]=useState<Ticket|null>(null);
 const [messages,setMessages]=useState<Msg[]>([]),[body,setBody]=useState(""),[reason,setReason]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [query,setQuery]=useState(""),[statusFilter,setStatusFilter]=useState<"all"|"open"|"awaiting_user"|"resolved"|"closed">("all");
 const replyKey=useRef(crypto.randomUUID());
 const visible=items.filter(entry=>(statusFilter==="all"||entry.ticket.status===statusFilter)&&
  (entry.ticket.subject+" "+entry.userName+" "+entry.ticket.category).toLowerCase().includes(query.trim().toLowerCase()));
 const get=useCallback(async()=>{
  setBusy(true);try{
   const resp=await fetch("/api/support/tickets",{cache:"no-store"});
   const obj=await resp.json() as {items?:Entry[];error?:string};
   if(!resp.ok)throw Error(obj.error||"REQUEST_FAILED");
   setItems(obj.items||[]);setError("");
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 },[]);
 const open=useCallback(async(id:string)=>{
  setBusy(true);
  try{
   const resp=await fetch("/api/support/tickets/"+id,{cache:"no-store"});
   const obj=await resp.json() as {ticket?:Ticket;messages?:Msg[];error?:string};
   if(!resp.ok||!obj.ticket)throw Error(obj.error||"REQUEST_FAILED");
   setSelected(obj.ticket);setMessages(obj.messages||[]);setError("");replyKey.current=crypto.randomUUID();
  }catch(e){setError((e as Error).message);}
  finally{setBusy(false);}
 },[]);
 useEffect(()=>{void get();},[get]);
 async function post(kind:"replies"|"status",payload:object){
  if(!selected||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const resp=await fetch("/api/support/tickets/"+selected.id+"/"+kind,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const res=await resp.json() as {error?:string};
   if(!resp.ok)throw Error(res.error||"REQUEST_FAILED");
   setNotice("تغییر ثبت شد.");setBody("");setReason("");replyKey.current=crypto.randomUUID();
   await open(selected.id);await get();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="admin-card" style={{display:"grid",gap:14}}>
  <div className="admin-queue-tools">
   <label htmlFor="support-search">جستجوی موضوع، کاربر یا دسته‌بندی</label>
   <input id="support-search" type="search" value={query} onChange={e=>setQuery(e.target.value)}/>
   <label htmlFor="support-status">وضعیت</label>
   <select id="support-status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as typeof statusFilter)}>
    <option value="all">همه</option><option value="open">باز</option><option value="awaiting_user">در انتظار پاسخ کاربر</option>
    <option value="resolved">حل‌شده</option><option value="closed">بسته</option>
   </select>
   <button className="admin-button secondary" disabled={busy} onClick={()=>void get()}>تازه‌سازی درخواست‌ها</button>
  </div><p aria-live="polite">{visible.length.toLocaleString("fa-AF")} / {items.length.toLocaleString("fa-AF")} درخواست</p>
  {error?<p role="alert" className="notice">{error}</p>:null}
  {notice?<p role="status">{notice}</p>:null}
  {!items.length?<p>درخواست باز یا در انتظار پاسخ وجود ندارد.</p>:null}
  {visible.map(({ticket,userName})=><article className="agency-review" key={ticket.id}>
   <strong>{ticket.subject}</strong><p>{userName} · {ticket.category} · {ticket.status}</p>
   <button className="admin-button secondary" onClick={()=>void open(ticket.id)}>دیدن گفتگو</button>
  </article>)}
  {selected?<div className="admin-card" style={{borderColor:"#135448"}}>
   <h2>{selected.subject}</h2><p>{selected.category} · {selected.status}</p>
   {messages.slice().reverse().map(message=><section key={message.id} className="agency-review">
    <strong>{message.authorStaffId?"کارمند":"کاربر"}</strong>
    <p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{message.body}</p>
    <small>{new Date(message.createdAt).toLocaleString("fa-AF")}</small>
   </section>)}
   {selected.status!=="closed"?<>
    <label htmlFor="support-reply">پاسخ پشتیبانی</label>
    <textarea id="support-reply" value={body} maxLength={2000} onChange={e=>setBody(e.target.value)}/>
    <button className="admin-button" disabled={busy||body.trim().length<2}
     onClick={()=>void post("replies",{requestId:replyKey.current,body:body.trim()})}>ارسال پاسخ</button>
    <label htmlFor="support-reason">دلیل تغییر وضعیت (حداقل ۸ حرف)</label>
    <textarea id="support-reason" value={reason} maxLength={500} onChange={e=>setReason(e.target.value)}/>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
     {(["open","resolved","closed"] as const).map(status=>
      <button key={status} className="admin-button secondary" disabled={busy||reason.trim().length<8}
       onClick={()=>void post("status",{status,reason:reason.trim()})}>{status}</button>)}
    </div></>:null}
  </div>:null}
 </section>;
}
