"use client";
import {useState,type CSSProperties} from "react";
import {colors} from "@amlaklink/design-tokens";
import {isRTL,localeNames,type Locale} from "@amlaklink/localization";
const copy={
 fa:{heading:"ورود کارمندان",subtitle:"پنل مدیریت مستقل املاک لینک",user:"ایمیل کاری",pass:"رمز عبور",submit:"ورود",notice:"ورود امن کارمندان در مرحلهٔ دوم همراه با احراز هویت چندمرحله‌ای فعال می‌شود. این فرم هنوز اطلاعات ورود را ارسال نمی‌کند.",status:"نسخهٔ زیربنایی — مرحلهٔ اول"},
 ps:{heading:"د کارکوونکو ننوتل",subtitle:"د املاک لینک خپلواک اداري سیستم",user:"د کار ایمیل",pass:"پټنوم",submit:"ننوتل",notice:"د کارکوونکو خوندي ننوتل په دویم پړاو کې د څو پړاوې تایید سره فعالېږي. دا فورمه اوس معلومات نه لېږي.",status:"بنسټیزه نسخه — لومړی پړاو"},
 en:{heading:"Staff sign in",subtitle:"Separate AmlakLink administration",user:"Work email",pass:"Password",submit:"Sign in",notice:"Secure staff login with MFA is implemented in Phase 2. This form does not submit or accept credentials yet.",status:"Foundation release — Phase 1"}
} as const;
export default function AdminLogin(){
 const [locale,setLocale]=useState<Locale>("fa"),m=copy[locale],rtl=isRTL(locale);
 const vars={"--brand":colors.primary,"--ink":colors.text,"--muted":colors.muted,"--bg":colors.background,"--edge":colors.border} as CSSProperties;
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
    <div className="fields"><label htmlFor="staff-email">{m.user}</label><input id="staff-email" type="email" disabled autoComplete="off" />
    <label htmlFor="staff-password">{m.pass}</label><input id="staff-password" type="password" disabled autoComplete="off" />
    <button type="button" className="sign-in" disabled>{m.submit}</button></div>
    <div className="notice" role="status">{m.notice}</div>
   </div>
  </section>
 </main>;
}
