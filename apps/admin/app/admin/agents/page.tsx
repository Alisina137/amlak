import {StaffNav} from "../staff-nav";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getStaff} from "../../../lib/staff";
import {AgentQueue} from "./queue";
export default async function AgentReview(){
 const staff=await getStaff();if(!staff)redirect("/admin/login");
 if(!["verification","admin","super_admin"].includes(staff.role))redirect("/admin");
 return <main className="admin-workspace" dir="rtl">
  <StaffNav role={staff.role}/>
  <div className="admin-main-content">
  <Link href="/admin">→ بازگشت به مدیریت</Link>
  <h1>درخواست‌های رهنمای معاملات مستقل</h1>
  <p>تأیید صلاحیت حرفه‌ای به بررسی مستقل کارمند نیاز دارد.</p>
  <AgentQueue/>
  </div>
 </main>;
}
