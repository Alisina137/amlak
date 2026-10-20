import type {Locale} from "@amlaklink/localization";
const en={
 title:"My account",subtitle:"Manage properties, services and privacy",
 guest:"Browse listings without an account. Sign in to save homes, message advertisers and manage your listings.",
 profile:"Profile",verified:"Verified email",unverified:"Email verification required",editProfile:"Edit profile",listing:"My properties",
 listingSubtitle:"Manage adverts and publication",create:"Create a listing",manage:"My listings",
 inquiries:"Messages and appointments",professional:"Professional services",personalAdvertiser:"Private property advertiser",
 proIntro:"Advertise your own property after email verification and acceptance of the marketplace rules.",
 enable:"Activate seller tools",active:"Seller tools active",agency:"Agency workspace",agent:"Independent agent",
 approved:"Approved",pending:"Pending staff review",rejected:"Not approved",notApplied:"Not applied",
 agencyCreate:"Apply to register an agency",agentCreate:"Apply as an independent agent",
 professionalDetails:"Verification is reviewed by staff. It does not confirm legal title or guarantee a transaction.",
 plans:"Plans & billing",invite:"Invitation awaiting acceptance",accept:"Accept invitation",members:"Agency membership",
 help:"Help & safety",support:"Help & support",safety:"Report & appeals",
 settings:"Settings & security",security:"Devices and sessions",push:"Notifications",language:"App language",
 refresh:"Refresh account",logout:"Sign out",permission:"Verify your email to unlock professional applications and property tools.",
 protected:"Changes to advertising status require an authenticated verified account.",terms:"I accept the advertiser rules.",
 failed:"Unable to update account data. Try again.",refreshAgencies:"Refresh agency memberships",none:"No agency memberships yet.",
 accountStatus:"Account",more:"View details",province:"Default province",edit:"Edit display name",name:"Display name",
 save:"Save changes",cancel:"Cancel",updated:"Profile updated.",nameRules:"Please enter a name between 2 and 120 characters.",
 signOutTitle:"Sign out of this device?",signOutBody:"Your saved data remains in your account. This device's session will be cleared.",
 sessionNote:"Review signed-in devices and revoke sessions you no longer recognize.",
 noPassword:"Account recovery uses your verified email.",sensitive:"Professional status is shown as reviewed by staff, not automatically verified."
};
type Key=keyof typeof en;
const fa:Record<Key,string>={
 title:"حساب من",subtitle:"مدیریت ملک‌ها، خدمات و حریم خصوصی",
 guest:"بدون حساب نیز می‌توانید ملک‌ها را ببینید. برای ذخیره، گفتگو و مدیریت آگهی‌ها وارد شوید.",
 profile:"پروفایل",verified:"ایمیل تأیید شده",unverified:"ایمیل باید تأیید شود",editProfile:"ویرایش پروفایل",listing:"ملک‌های من",
 listingSubtitle:"مدیریت آگهی‌ها و نشر",create:"ثبت ملک جدید",manage:"مدیریت آگهی‌های من",
 inquiries:"پیام‌ها و قرارهای بازدید",professional:"خدمات حرفه‌ای",personalAdvertiser:"آگهی‌دهندهٔ شخصی",
 proIntro:"پس از تأیید ایمیل و پذیرش قوانین بازار، ملک خود را آگهی کنید.",
 enable:"فعال‌سازی ابزار نشر",active:"ابزار نشر فعال است",agency:"محیط کاری دفتر",agent:"رهنمای مستقل",
 approved:"تأیید شده",pending:"در انتظار بررسی کارمندان",rejected:"تأیید نشده",notApplied:"درخواست داده نشده",
 agencyCreate:"درخواست ثبت دفتر",agentCreate:"درخواست رهنمای مستقل",
 professionalDetails:"تأیید حرفه‌ای به بررسی کارمندان نیاز دارد؛ تضمین سند مالکیت یا معامله نیست.",
 plans:"اشتراک و پرداخت",invite:"دعوت در انتظار پذیرش",accept:"پذیرش دعوت",members:"عضویت دفتر",
 help:"کمک و ایمنی",support:"کمک و پشتیبانی",safety:"گزارش و اعتراض",
 settings:"تنظیمات و امنیت",security:"دستگاه‌ها و نشست‌ها",push:"اعلان‌ها",language:"زبان برنامه",
 refresh:"تازه‌سازی حساب",logout:"خروج",permission:"برای استفاده از خدمات حرفه‌ای و ثبت ملک، ایمیل را تأیید کنید.",
 protected:"تغییر وضعیت نشر به حساب تأییدشده نیاز دارد.",terms:"قوانین نشر آگهی را می‌پذیرم.",
 failed:"بارگیری یا تغییر حساب ممکن نشد؛ دوباره تلاش کنید.",refreshAgencies:"تازه‌سازی عضویت دفاتر",none:"هنوز عضو دفتری نیستید.",
 accountStatus:"حساب",more:"نمایش جزئیات",province:"ولایت پیش‌فرض",edit:"ویرایش نام نمایشی",name:"نام نمایشی",
 save:"ذخیره تغییرات",cancel:"انصراف",updated:"پروفایل تغییر کرد.",nameRules:"نام باید بین ۲ تا ۱۲۰ حرف باشد.",
 signOutTitle:"از این دستگاه خارج شوید؟",signOutBody:"معلومات ذخیره‌شده در حساب می‌ماند؛ نشست این دستگاه پاک می‌شود.",
 sessionNote:"دستگاه‌های واردشده را بررسی و نشست‌های ناشناس را قطع کنید.",
 noPassword:"بازیابی حساب با ایمیل تأییدشده انجام می‌شود.",sensitive:"وضعیت حرفه‌ای با بررسی کارمندان ثبت می‌شود؛ خودکار نیست."
};
const ps:Record<Key,string>={
 title:"زما حساب",subtitle:"ملکیتونه، خدمتونه او شخصي معلومات اداره کړئ",
 guest:"له حساب پرته هم ملکیتونه لیدلی شئ. د خوندي کولو، خبرو او اعلان لپاره ننوځئ.",
 profile:"پروفایل",verified:"ایمیل تایید شوی",unverified:"د ایمیل تایید پکار دی",editProfile:"پروفایل سم کړه",listing:"زما ملکیتونه",
 listingSubtitle:"اعلانونه او خپرونې اداره کړئ",create:"نوی ملکیت ثبت کړئ",manage:"زما اعلانونه اداره کړئ",
 inquiries:"پیغامونه او لیدنې",professional:"مسلکي خدمتونه",personalAdvertiser:"شخصي اعلان ورکوونکی",
 proIntro:"د ایمیل تر تایید او د بازار اصولو تر منلو وروسته خپل ملکیت اعلان کړئ.",
 enable:"د اعلان وسایل فعال کړئ",active:"د اعلان وسایل فعال دي",agency:"د دفتر کاري ځای",agent:"خپلواک استازی",
 approved:"تایید شوی",pending:"د کارکوونکو کتنې ته انتظار",rejected:"نه دی تایید شوی",notApplied:"لا غوښتنه نشته",
 agencyCreate:"د دفتر د ثبت غوښتنه",agentCreate:"د خپلواک استازي غوښتنه",
 professionalDetails:"مسلکي تایید د کارکوونکو کتنه غواړي؛ د مالکیت سند یا معامله نه تضمینوي.",
 plans:"پلانونه او پیسې",invite:"د بلنې منل پاتې دي",accept:"بلنه ومنئ",members:"د دفتر غړیتوب",
 help:"مرسته او خوندیتوب",support:"مرسته او ملاتړ",safety:"راپور او اعتراض",
 settings:"تنظیمات او امنیت",security:"وسیلي او ناستې",push:"خبرتیاوې",language:"د اپ ژبه",
 refresh:"حساب تازه کړئ",logout:"وتل",permission:"د مسلکي خدمتونو او اعلان لپاره ایمیل تایید کړئ.",
 protected:"د اعلان حالت بدلولو ته تایید شوی حساب پکار دی.",terms:"د اعلان اصول منم.",
 failed:"د حساب بدلون یا بارول ناکام شول؛ بیا هڅه وکړئ.",refreshAgencies:"د دفتر غړیتوب تازه کړئ",none:"لا د دفتر غړیتوب نشته.",
 accountStatus:"حساب",more:"نور معلومات",province:"اصلي ولایت",edit:"د ښکاره نوم سمون",name:"ښکاره نوم",
 save:"بدلونونه خوندي کړه",cancel:"لغوه",updated:"پروفایل بدل شو.",nameRules:"نوم باید ۲ تر ۱۲۰ توري وي.",
 signOutTitle:"له دې وسیلې ووځئ؟",signOutBody:"خوندي معلومات په حساب کې پاتې کېږي؛ د دې وسیلې ناسته پاکېږي.",
 sessionNote:"ننوتلې وسیلې وګورئ او نااشنا ناستې بندې کړئ.",
 noPassword:"د حساب بیا ترلاسه کول د تایید شوي ایمیل له لارې کېږي.",sensitive:"مسلکي حالت کارکوونکي تاییدوي، په اوتومات ډول نه."
};
export function ax(locale:Locale,key:Key){return ({en,fa,ps})[locale][key];}
export function professionalStatus(locale:Locale,status:string){
 return ax(locale,status==="approved"?"approved":status==="pending"?"pending":status==="rejected"?"rejected":"notApplied");
}
