import {StaffNav} from "../staff-nav";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getStaff} from "../../../lib/staff";
import {SupportPanel} from "./panel";
export default async function SupportAdmin(){
 const staff=await getStaff();
 if(!staff)redirect("/admin/login");
 if(!["support","admin","super_admin"].includes(staff.role))redirect("/admin");
 return <main dir="rtl" className="admin-workspace">
  <StaffNav role={staff.role}/>
  <div className="admin-main-content">
  <Link href="/admin">→ بازگشت به مدیریت</Link>
  <h1>مرکز پشتیبانی املاک لینک</h1>
  <p>پرسش‌های کاربران محرمانه هستند. اطلاعات شخصی را در گزارش‌های عمومی بازنشر نکنید.</p>
  <SupportPanel/>
  </div>
 </main>;
}
