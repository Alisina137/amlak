import type {Locale} from "@amlaklink/localization";
const en={
 title:"Help & support",subtitle:"Get help with your account, properties or platform services.",
 new:"New request",history:"My requests",open:"Open",awaiting_user:"Your reply needed",resolved:"Resolved",closed:"Closed",
 all:"All",active:"Active",past:"Resolved & closed",empty:"No requests in this group.",
 category:"Category",subject:"Subject",details:"Describe what happened",send:"Send request",reply:"Send reply",
 select:"Choose the topic",submitHint:"Do not share passwords, verification codes or payment details in messages.",
 categories:{account:"Account access",listing:"Property listing",payments:"Platform billing",safety:"Safety concern",other:"Other"},
 safety:"If you suspect fraud or an unsafe listing, also use the formal reporting process.",
 report:"Report a safety concern",retry:"Retry",failed:"Request failed. Check your connection and try again.",
 limit:"At most five open requests can exist at once.",count:"requests",required:"Subject requires 6 characters; description requires 10.",
 mine:"You",staff:"Support team",updated:"Updated",replyHint:"Replies are private to your account and authorized support staff.",
 closedNote:"This ticket is closed. Start a new support request if you still need assistance.",refresh:"Refresh",
 signin:"Sign in and verify your email to contact support.",write:"Write your reply",back:"Back to support",
 privacy:"Support cannot confirm a property's legal ownership or complete a property payment for you."
};
type Key=Exclude<keyof typeof en,"categories">;
const fa:Record<Key,string>={
 title:"کمک و پشتیبانی",subtitle:"برای حساب، ملک‌ها یا خدمات برنامه کمک بگیرید.",
 new:"درخواست جدید",history:"درخواست‌های من",open:"باز",awaiting_user:"پاسخ شما لازم است",resolved:"حل‌شده",closed:"بسته",
 all:"همه",active:"فعال",past:"حل‌شده و بسته",empty:"در این بخش درخواستی نیست.",
 category:"دسته‌بندی",subject:"موضوع",details:"مشکل را توضیح دهید",send:"ارسال درخواست",reply:"ارسال پاسخ",
 select:"نوع مشکل را انتخاب کنید",submitHint:"رمز عبور، کد تأیید یا معلومات پرداخت را در پیام نفرستید.",
 safety:"اگر به تقلب یا آگهی خطرناک شک دارید، از گزارش رسمی نیز استفاده کنید.",
 report:"گزارش مشکل ایمنی",retry:"تلاش دوباره",failed:"درخواست انجام نشد. اتصال را بررسی و دوباره تلاش کنید.",
 limit:"حداکثر پنج درخواست باز می‌توانید داشته باشید.",count:"درخواست",required:"موضوع حداقل ۶ و توضیحات حداقل ۱۰ حرف باشد.",
 mine:"شما",staff:"تیم پشتیبانی",updated:"آخرین تغییر",replyHint:"پاسخ‌ها خصوصی بین حساب شما و کارمندان مجاز است.",
 closedNote:"این درخواست بسته شده است. در صورت نیاز درخواست جدید بسازید.",refresh:"تازه‌سازی",
 signin:"برای ارتباط با پشتیبانی وارد شوید و ایمیل را تأیید کنید.",write:"پاسخ خود را بنویسید",back:"بازگشت به پشتیبانی",
 privacy:"پشتیبانی مالکیت قانونی ملک را تضمین یا پرداخت ملک را تکمیل نمی‌کند."
};
const ps:Record<Key,string>={
 title:"مرسته او ملاتړ",subtitle:"د حساب، ملکیتونو او د اپ خدمتونو لپاره مرسته واخلئ.",
 new:"نوې غوښتنه",history:"زما غوښتنې",open:"پرانستې",awaiting_user:"ستاسو ځواب پکار دی",resolved:"حل شوې",closed:"تړل شوې",
 all:"ټول",active:"فعال",past:"حل شوې او تړلې",empty:"دلته غوښتنه نشته.",
 category:"ډول",subject:"موضوع",details:"ستونزه تشریح کړئ",send:"غوښتنه ولېږئ",reply:"ځواب ولېږئ",
 select:"د ستونزې ډول وټاکئ",submitHint:"پټنوم، د تایید کوډ یا د پیسو معلومات په پیغام کې مه لېږئ.",
 safety:"که د درغلۍ یا ناامن اعلان شک لرئ، رسمي راپور هم ورکړئ.",
 report:"د خوندیتوب راپور",retry:"بیا هڅه",failed:"غوښتنه ناکامه شوه. اړیکه وګورئ او بیا هڅه وکړئ.",
 limit:"تر پنځو پورې خلاصې غوښتنې لرلی شئ.",count:"غوښتنې",required:"موضوع لږ تر لږه ۶ او تشریح ۱۰ توري غواړي.",
 mine:"تاسو",staff:"د ملاتړ ډله",updated:"وروستی بدلون",replyHint:"ځوابونه یوازې ستاسو او مجاز کارکوونکو ترمنځ دي.",
 closedNote:"دا غوښتنه تړل شوې. د نورې مرستې لپاره نوې غوښتنه جوړه کړئ.",refresh:"تازه کول",
 signin:"د ملاتړ لپاره ننوځئ او ایمیل تایید کړئ.",write:"خپل ځواب ولیکئ",back:"ملاتړ ته ستنېدل",
 privacy:"ملاتړ د ملکیت قانوني سند نه تضمینوي او د ملکیت پیسې نه لېږدوي."
};
const categoryLabels:Record<"account"|"listing"|"payments"|"safety"|"other",Record<Locale,string>>={
 account:{en:"Account access",fa:"دسترسی حساب",ps:"حساب ته لاسرسی"},
 listing:{en:"Property listing",fa:"آگهی ملک",ps:"د ملکیت اعلان"},
 payments:{en:"Platform billing",fa:"پرداخت خدمات برنامه",ps:"د اپ د خدمتونو بیل"},
 safety:{en:"Safety concern",fa:"مشکل ایمنی",ps:"د خوندیتوب ستونزه"},
 other:{en:"Other",fa:"دیگر",ps:"نور"}
};
export type TicketCategory=keyof typeof categoryLabels;
export const ticketCategories=Object.keys(categoryLabels) as TicketCategory[];
export const sx=(locale:Locale,key:Key)=>({en,fa,ps})[locale][key];
export const ticketCategory=(locale:Locale,category:string)=>category in categoryLabels?categoryLabels[category as TicketCategory][locale]:category;
export const ticketStatus=(locale:Locale,status:string)=>status in en? sx(locale,status as Key):status;
