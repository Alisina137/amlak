import Link from "next/link";
import {redirect} from "next/navigation";
import {getStaff} from "../../../lib/staff";
import {PilotPanel} from "./panel";
export default async function PilotAdmin(){
 const staff=await getStaff();
 if(!staff)redirect("/admin/login");
 if(!["moderator","support","verification","admin","super_admin"].includes(staff.role))redirect("/admin");
 return <main className="admin-workspace" dir="rtl">
  <Link href="/admin">→ بازگشت به مدیریت</Link>
  <h1>عملیات آزمایشی کابل</h1>
  <p>شاخص‌های عددی به‌تنهایی اجازهٔ نشر عمومی نیستند. بررسی امنیت، قوانین، نسخهٔ پشتیبان و آزمایش دستگاه ضروری است.</p>
  <PilotPanel role={staff.role}/>
 </main>;
}