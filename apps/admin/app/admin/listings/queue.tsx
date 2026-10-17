"use client";
import {useEffect,useState,useCallback} from "react";
type Listing={
 id:string;version:number;revisionId:string;status:string;publisher:string;approvedRevisionId:string|null;
 submittedAt:string;data:{title:string;description:string;propertyType:string;transactionType:string;
 location:{provinceId:string;city:string;district:string;precision:string};
 price:Record<string,string|number|boolean|undefined>;attributes:{areaM2:number};
 photoIds:string[];contact:Record<string,unknown>};
};
export function ListingQueue(){
 const [items,setItems]=useState<Listing[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [reasons,setReasons]=useState<Record<string,string>>({}),[working,setWorking]=useState<string|null>(null);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/listings",{cache:"no-store"});
   if(!r.ok)throw Error("DENIED");
   const result=await r.json() as {items:Listing[]};setItems(result.items);
  }catch{setError("بارگیری صف بررسی آگهی‌ها ناموفق بود.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 async function decide(item:Listing,decision:"approve"|"reject"){
  setWorking(item.id);setError("");
  try{
   const response=await fetch("/api/listings/"+encodeURIComponent(item.id)+"/decision",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({revisionId:item.revisionId,decision,reason:reasons[item.id]||""})
   });
   if(!response.ok)throw Error((await response.json() as {error?:string}).error||"FAILED");
   await load();
  }catch(e){setError("تصمیم ثبت نشد: "+String((e as Error).message));}
  finally{setWorking(null);}
 }
 return <section className="admin-card">
  <button type="button" className="admin-button secondary" onClick={()=>void load()} disabled={loading}>تازه‌سازی صف</button>
  {error?<p role="alert">{error}</p>:null}
  {loading?<p>در حال بارگیری آگهی‌ها…</p>:items.length===0?<p>هیچ آگهی معطل بررسی نیست.</p>:null}
  {items.map(item=><article className="agency-review" key={item.revisionId}>
   <h2>{item.data.title||"بدون عنوان"}</h2>
   <p>{item.data.transactionType} · {item.data.propertyType} · {item.data.location.city} / {item.data.location.district} · {item.data.location.provinceId}</p>
   <p>شماره نسخه: {item.version} · {item.approvedRevisionId?"اصلاح نسخهٔ نشرشده":"نشر نخست"}</p>
   <p>{item.data.description}</p>
   <p>مساحت: {item.data.attributes.areaM2} m² · قیمت: {JSON.stringify(item.data.price)}</p>
   <div style={{display:"flex",gap:10,overflowX:"auto",margin:"16px 0"}}>
    {item.data.photoIds.map(photo=><img key={photo} alt="تصویر آگهی در حال بررسی" src={"/api/photos/"+photo} style={{width:168,height:130,objectFit:"cover",borderRadius:12}} />)}
   </div>
   <label htmlFor={"reason-"+item.id}>دلیل تصمیم (حداقل ۸ حرف)</label>
   <textarea id={"reason-"+item.id} maxLength={500} value={reasons[item.id]||""} onChange={e=>setReasons(p=>({...p,[item.id]:e.target.value}))}/>
   <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <button className="admin-button" type="button" disabled={working===item.id||(reasons[item.id]||"").trim().length<8} onClick={()=>void decide(item,"approve")}>تأیید و نشر</button>
    <button className="admin-button secondary" type="button" disabled={working===item.id||(reasons[item.id]||"").trim().length<8} onClick={()=>void decide(item,"reject")}>رد با دلیل</button>
   </div>
  </article>)}
 </section>;
}
