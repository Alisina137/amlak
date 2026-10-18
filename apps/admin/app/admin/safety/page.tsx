import Link from "next/link";
import {redirect} from "next/navigation";
import {getStaff} from "../../../lib/staff";
import {SafetyPanel} from "./panel";
export default async function SafetyAdmin(){
 const person=await getStaff();if(!person)redirect("/admin/login");
 if(!["moderator","support","verification","admin","super_admin"].includes(person.role))redirect("/admin");
 return <main className="admin-workspace" dir="rtl">
  <Link href="/admin">→ بازگشت به مدیریت</Link>
  <h1>ایمنی، شکایات، اعتراض و تأییدها</h1>
  <p>گزارش‌ها اتهام اثبات‌شده نیستند. هیچ ملک یا سند مالکیت به صورت خودکار تأیید نمی‌شود؛ تصمیم‌ها با دلیل و ثبت حسابرسی انجام می‌شوند.</p>
  <SafetyPanel role={person.role}/>
 </main>;
}
