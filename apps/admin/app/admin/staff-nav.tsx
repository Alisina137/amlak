"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

const sections=[
 {href:"/admin",label:"نمای کلی",en:"Overview",roles:["moderator","support","verification","billing","admin","super_admin"]},
 {href:"/admin/listings",label:"آگهی‌ها",en:"Listings",roles:["moderator","admin","super_admin"]},
 {href:"/admin/agencies",label:"دفترها",en:"Agencies",roles:["verification","admin","super_admin"]},
 {href:"/admin/agents",label:"رهنماها",en:"Agents",roles:["verification","admin","super_admin"]},
 {href:"/admin/safety",label:"ایمنی",en:"Safety",roles:["moderator","support","verification","admin","super_admin"]},
 {href:"/admin/support",label:"پشتیبانی",en:"Support",roles:["support","admin","super_admin"]},
 {href:"/admin/billing",label:"پرداخت خدمات",en:"Billing",roles:["billing","admin","super_admin"]},
 {href:"/admin/pilot",label:"عملیات",en:"Operations",roles:["moderator","support","verification","admin","super_admin"]}
] as const;
export function visibleStaffSections(role:string){return sections.filter(section=>(section.roles as readonly string[]).includes(role));}
export function StaffNav({role}:{role:string}){
 const pathname=usePathname();
 return <aside className="staff-nav" aria-label="ناوبری بخش مدیریت">
  <Link href="/admin" className="staff-nav-brand" aria-label="AmlakLink staff overview">
   <span className="staff-brand-mark">⌂</span><span>AMLAKLINK<small>STAFF WORKSPACE</small></span>
  </Link>
  <p className="staff-nav-caption">بخش‌های مجاز · {role.replaceAll("_"," ")}</p>
  <nav aria-label="Staff sections">
   {visibleStaffSections(role).map(section=>{
    const selected=section.href==="/admin"?pathname==="/admin":pathname.startsWith(section.href);
    return <Link key={section.href} href={section.href} aria-current={selected?"page":undefined}
     className={"staff-nav-link"+(selected?" active":"")}>
     <span>{section.label}</span><small>{section.en}</small>
    </Link>;
   })}
  </nav>
  <p className="staff-nav-foot">ورود دو مرحله‌ای الزامی است. تصمیم‌های کارمندان ثبت حسابرسی می‌شوند.</p>
 </aside>;
}
