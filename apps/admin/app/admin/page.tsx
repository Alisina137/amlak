import {redirect} from "next/navigation";
import Link from "next/link";
import {getStaff} from "../../lib/staff";
import {LogoutButton} from "./signout";
import {StaffNav} from "./staff-nav";
const cards=[
 {href:"/admin/listings",label:"آگهی‌های ملک",desc:"بررسی نسخه‌های پیشنهادی، عکس‌ها و دلایل تصمیم",roles:["moderator","admin","super_admin"]},
 {href:"/admin/agencies",label:"دفترهای رهنمای معاملات",desc:"صف بررسی درخواست‌های دفتر",roles:["verification","admin","super_admin"]},
 {href:"/admin/agents",label:"رهنماهای مستقل",desc:"بررسی هویت و درخواست‌های حرفه‌ای",roles:["verification","admin","super_admin"]},
 {href:"/admin/safety",label:"ایمنی و اعتراض‌ها",desc:"گزارش‌ها، بررسی‌ها و پرونده‌های ایمنی",roles:["moderator","support","verification","admin","super_admin"]},
 {href:"/admin/support",label:"پشتیبانی کاربران",desc:"گفتگوهای خصوصی و رسیدگی به شکایت‌ها",roles:["support","admin","super_admin"]},
 {href:"/admin/billing",label:"بررسی پرداخت خدمات",desc:"ادعاهای پرداخت خدمات پلتفرم و وضعیت فاکتورها",roles:["billing","admin","super_admin"]},
 {href:"/admin/pilot",label:"عملیات و آمادگی آزمایشی",desc:"شاخص‌ها، سلامت سیستم و بررسی پیش از نشر",roles:["moderator","support","verification","admin","super_admin"]}
] as const;
export default async function AdminHome(){
 const staff=await getStaff();if(!staff)redirect("/admin/login");
 return <main className="admin-workspace" dir="rtl">
  <StaffNav role={staff.role}/>
  <div className="admin-main-content">
   <header className="admin-dashboard-header">
    <div><span className="staff-kicker">AMLAKLINK / STAFF</span><h1>مرکز مدیریت املاک لینک</h1>
     <p>{staff.displayName} · {staff.role.replaceAll("_"," ")}</p></div>
    <LogoutButton/>
   </header>
   <section className="admin-card">
    <h2>بخش‌های کاری شما</h2>
    <p>هر بخش براساس صلاحیت حساب کارمند قابل دسترسی است. تصمیم‌های نشر، تأیید و پرداخت در سرور بررسی می‌شوند.</p>
    <div className="admin-quick-grid">
     {cards.filter(card=>(card.roles as readonly string[]).includes(staff.role)).map(card=><Link
      className="admin-quick-link" href={card.href} key={card.href}>
      <strong>{card.label}</strong><span>{card.desc}</span><b aria-hidden>‹</b>
     </Link>)}
    </div>
   </section>
   <section className="admin-card staff-guidance">
    <h2>روند بررسی</h2>
    <p>ورود دومرحله‌ای فعال است. تأیید حرفه‌ای یا آگهی، سند قانونی ملک یا معاملات خارج از برنامه را تضمین نمی‌کند.
     پیش از نشر عمومی باید بررسی عملی دستگاه‌ها، امنیت، نسخهٔ پشتیبان و آمادگی خدمات انجام شود.</p>
   </section>
  </div>
 </main>;
}
