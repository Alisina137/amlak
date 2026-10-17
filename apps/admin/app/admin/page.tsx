import {redirect} from "next/navigation";
import Link from "next/link";
import {getStaff} from "../../lib/staff";
import {LogoutButton} from "./signout";
export default async function AdminHome(){
 const staff=await getStaff();if(!staff)redirect("/admin/login");
 return <main className="admin-workspace" dir="rtl">
  <header><h1>املاک لینک — مدیریت</h1><p>{staff.displayName} · {staff.role}</p><LogoutButton/></header>
  <section className="admin-card"><h2>مرکز کاری کارمندان</h2><p>ورود دو مرحله‌ای و نقش کارمند بررسی شده است.</p>
   {["moderator","admin","super_admin"].includes(staff.role)?<p><Link href="/admin/listings">صف بررسی آگهی‌های ملک ←</Link></p>:null}
   {["verification","admin","super_admin"].includes(staff.role)?
    <div style={{display:"flex",gap:24,flexWrap:"wrap"}}><Link href="/admin/agencies">بررسی درخواست‌های ثبت دفتر ←</Link><Link href="/admin/agents">درخواست‌های رهنمای معاملات مستقل ←</Link></div>:
    <p>ماژول‌های بیشتر طبق صلاحیت شما در مراحل بعدی فعال می‌شوند.</p>}
  </section>
 </main>;
}
