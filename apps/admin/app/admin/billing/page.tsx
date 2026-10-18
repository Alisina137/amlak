import Link from "next/link";
import {redirect} from "next/navigation";
import {getStaff} from "../../../lib/staff";
import {BillingPanel} from "./panel";
import {BillingAdjustmentsPanel} from "./adjustments";
export default async function BillingAdmin(){
 const staff=await getStaff();
 if(!staff)redirect("/admin/login");
 if(!["billing","admin","super_admin"].includes(staff.role))redirect("/admin");
 return <main className="admin-workspace" dir="rtl">
  <Link href="/admin">→ بازگشت به مدیریت</Link>
  <h1>بررسی پرداخت خدمات املاک لینک</h1>
  <p>تنها پرداخت حق اشتراک و تبلیغات پلتفرم را با مدارک مستقل تطبیق دهید؛ این سیستم پول ملک، کرایه، گروی یا سند مالکیت را تأیید نمی‌کند.</p>
  <BillingPanel/>
  <BillingAdjustmentsPanel/>
 </main>;
}
