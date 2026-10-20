import {StaffNav} from "../staff-nav";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getStaff} from "../../../lib/staff";
import {ListingQueue} from "./queue";
export default async function ListingModeration(){
 const person=await getStaff();if(!person)redirect("/admin/login");
 if(!["moderator","admin","super_admin"].includes(person.role))redirect("/admin");
 return <main className="admin-workspace" dir="rtl">
  <StaffNav role={person.role}/>
  <div className="admin-main-content">
  <Link href="/admin">→ بازگشت به مدیریت</Link>
  <h1>بررسی آگهی‌های ملک</h1>
  <p>تأیید یا رد نسخهٔ پیشنهادی؛ نسخهٔ تأییدشدهٔ قبلی تا ختم بررسی حفظ می‌شود.</p>
  <ListingQueue/>
  </div>
 </main>;
}
