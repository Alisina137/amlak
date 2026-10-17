"use client";
import {useState,type CSSProperties,type FormEvent} from "react";
import {colors} from "@amlaklink/design-tokens";
import {isRTL,localeNames,type Locale} from "@amlaklink/localization";
const copy={
 fa:{heading:"ورود کارمندان",subtitle:"پنل مدیریت مستقل املاک لینک",user:"ایمیل کاری",pass:"رمز عبور",totp:"کد شش رقمی احراز هویت",submit:"ورود امن",notice:"این پنل فقط برای کارمندان تأییدشده با احراز هویت دومرحله‌ای در دسترس است.",status:"دسترسی محدود کارمندان",error:"ورود ناموفق بود. معلومات یا کد را بررسی کنید."},
 ps:{heading:"د کارکوونکو ننوتل",subtitle:"د املاک لینک خپلواک اداري سیستم",user:"د کار ایمیل",pass:"پټنوم",totp:"د تصدیق شپږ رقمي کوډ",submit:"خوندي ننوتل",notice:"دا سیستم یوازې د تایید شوو کارکوونکو لپاره د دوو پړاوونو تایید سره دی.",status:"د کارکوونکو محدود لاسرسی",error:"ننوتل ناکام شول. معلومات او کوډ وګورئ."},
 en:{heading:"Staff sign in",subtitle:"Separate AmlakLink administration",user:"Work email",pass:"Password",totp:"6-digit authenticator code",submit:"Secure sign in",notice:"Only provisioned staff with an authenticator app may access this panel.",status:"Restricted staff access",error:"Sign-in failed. Check your credentials or authenticator code."}
} as const;
export default function AdminLogin(){
 const [locale,setLocale]=useState<Locale>("fa"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[totp,setTotp]=useState(""),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const m=copy[locale],rtl=isRTL(locale);
 const vars={"--brand":colors.primary,"--ink":colors.text,"--muted":colors.muted,"--bg":colors.background,"--edge":colors.border} as CSSProperties;
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setLoading(true);setError("");
  try{
   const res=await fetch("/api/staff/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,totp})});
   if(!res.ok)throw new Error("AUTH_FAILED");
   window.location.assign("/admin");
  }catch{setError(m.error);}finally{setLoading(false);}
 }
 return <main dir={rtl?"rtl":"ltr"} lang={locale} style={vars} className="staff-shell">
  <div className="staff-side">
   <div className="brand">⌂ <span>AMLAKLINK</span></div>
   <div className="side-copy"><span className="eyebrow">{m.status}</span><h1>{m.subtitle}</h1><p>Afghanistan · افغانستان</p></div>
   <p className="footer">Internal operations · No public staff registration</p>
  </div>
  <section className="login-panel">
   <nav aria-label="Language" className="languages">{(["fa","ps","en"] as Locale[]).map(code=><button key={code} type="button" onClick={()=>setLocale(code)}
    aria-pressed={code===locale} className={code===locale?"current":""}>{localeNames[code]}</button>)}</nav>
   <div className="login-box">
    <span className="shield" aria-hidden="true">◇</span>
    <h2>{m.heading}</h2><p>{m.subtitle}</p>
    <form className="fields" onSubmit={e=>void submit(e)}>
     <label htmlFor="staff-email">{m.user}</label><input id="staff-email" type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} />
     <label htmlFor="staff-password">{m.pass}</label><input id="staff-password" type="password" minLength={12} required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/>
     <label htmlFor="staff-totp">{m.totp}</label><input id="staff-totp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={totp} onChange={e=>setTotp(e.target.value)}/>
     <button type="submit" disabled={loading} className="sign-in">{loading?"…":m.submit}</button>
    </form>
    {error?<div className="notice" role="alert">{error}</div>:null}
    <div className="notice">{m.notice}</div>
   </div>
  </section>
 </main>;
}
