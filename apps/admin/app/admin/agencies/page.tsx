import {redirect} from "next/navigation";
import Link from "next/link";
import {getStaff} from "../../../lib/staff";
import {AgencyQueue} from "./queue";
export default async function AgencyAdmin(){
 const staff=await getStaff();if(!staff)redirect("/admin/login");
 if(!["verification","admin","super_admin"].includes(staff.role))redirect("/admin");
 return <main className="admin-workspace" dir="rtl">
  <Link href="/admin">→ برگشت به مدیریت</Link>
  <h1>درخواست‌های ثبت دفتر رهنمای معاملات</h1>
  <p>بررسی هویت و اسناد به کارمند مسئول نیاز دارد. تصمیم شما ثبت و قابل پیگیری است.</p>
  <AgencyQueue/>
 </main>;
}
