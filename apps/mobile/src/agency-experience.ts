import type {Locale} from "@amlaklink/localization";
const en={
 overview:"Overview",properties:"Properties",leads:"Leads",team:"Team",reports:"Reports",performance:"Performance",billing:"Billing",
 workspace:"Agency workspace",sub:"Manage properties, conversations, team and platform services.",
 activity:"Activity",active:"Active",pending:"Pending",disabled:"Not approved",member:"Member",owner:"Owner",manager:"Manager",agent:"Agent",
 invite:"Invite team member",email:"Verified account email",emailHint:"Invitations require the recipient's verified email.",
 send:"Send invitation",assigned:"Assigned",unassigned:"Unassigned",all:"All",new:"New",viewing:"Viewing",followup:"Follow up",
 open:"Open conversation",search:"Search inquiries",empty:"No inquiries match these filters.",
 reply:"Respond soon",recent:"Most recent activity",stages:"CRM stage",total:"Total",awaiting:"Awaiting reply",
 error:"Unable to load workspace. Check your access and retry.",refresh:"Refresh",retry:"Retry",back:"Back to workspace",
 notAvailable:"This tool is unavailable for your role or agency status.",
 role:"Your role",members:"Members",membership:"Membership",access:"Actions are authorized by the server. Membership may change at any time.",
 viewProperties:"Manage agency listings",newProperty:"New property",viewLeads:"Open lead queue",
 analytics:"Actual in-app activity only, not verified sales or completed phone calls.",
 invoices:"Invoices are for platform services, not payments for homes.",pendingReview:"Approval requires staff review.",
 note:"Only approved listings become public. Previous public revisions remain unchanged during review.",
 noMembers:"No team members yet.",status:"Status",loading:"Loading agency data",filter:"Filter",choose:"Select",
 month:"Days",count:"items",notVerified:"Professional verification does not guarantee title ownership.",
 teamInvitation:"Pending membership",update:"Update",closed:"Closed",stale:"Access revoked or no longer available.",
 allProperties:"All properties",draft:"Draft",review:"Under review",published:"Published",paused:"Paused"
};
type Key=keyof typeof en;
const fa:Record<Key,string>={
 overview:"نمای کلی",properties:"ملک‌ها",leads:"مشتریان",team:"اعضای دفتر",reports:"گزارش‌ها",performance:"عملکرد",billing:"پرداخت",
 workspace:"محیط کاری دفتر",sub:"ملک‌ها، گفتگوها، همکاران و خدمات پلتفرم را مدیریت کنید.",
 activity:"فعالیت",active:"فعال",pending:"در انتظار",disabled:"تأیید نشده",member:"عضو",owner:"مالک",manager:"مدیر",agent:"رهنما",
 invite:"دعوت عضو جدید",email:"ایمیل حساب تأییدشده",emailHint:"دعوت‌نامه نیازمند ایمیل تأییدشدهٔ گیرنده است.",
 send:"ارسال دعوت",assigned:"مسئول تعیین شده",unassigned:"بدون مسئول",all:"همه",new:"جدید",viewing:"بازدید",followup:"پیگیری",
 open:"بازکردن گفتگو",search:"جستجوی درخواست‌ها",empty:"درخواستی با این فیلتر نیست.",
 reply:"نیازمند پاسخ",recent:"آخرین فعالیت",stages:"مرحلهٔ پیگیری",total:"مجموع",awaiting:"منتظر پاسخ",
 error:"بارگیری دفتر ممکن نشد. صلاحیت را بررسی و دوباره تلاش کنید.",refresh:"تازه‌سازی",retry:"تلاش دوباره",back:"بازگشت به دفتر",
 notAvailable:"این بخش برای نقش یا وضعیت دفتر شما در دسترس نیست.",
 role:"نقش شما",members:"اعضا",membership:"عضویت",access:"صلاحیت در سرور بررسی می‌شود و ممکن است تغییر کند.",
 viewProperties:"مدیریت آگهی‌های دفتر",newProperty:"ثبت ملک جدید",viewLeads:"صف مشتریان",
 analytics:"فقط فعالیت واقعی داخل برنامه؛ نه فروش تأییدشده و نه مکالمهٔ تلفنی.",
 invoices:"فاکتور فقط برای خدمات پلتفرم است، نه پرداخت خانه.",pendingReview:"تأیید به بررسی کارمندان نیاز دارد.",
 note:"تنها آگهی تأییدشده عمومی می‌شود؛ نسخهٔ نشرشده در هنگام بررسی محفوظ می‌ماند.",
 noMembers:"هنوز عضوی ثبت نشده است.",status:"وضعیت",loading:"بارگیری دفتر",filter:"فیلتر",choose:"انتخاب",
 month:"روز",count:"مورد",notVerified:"تأیید حرفه‌ای سند مالکیت را تضمین نمی‌کند.",
 teamInvitation:"عضویت در انتظار",update:"تغییر",closed:"بسته",stale:"صلاحیت قطع شده یا دفتر در دسترس نیست.",
 allProperties:"همه ملک‌ها",draft:"پیش‌نویس",review:"زیر بررسی",published:"نشرشده",paused:"متوقف"
};
const ps:Record<Key,string>={
 overview:"لنډیز",properties:"ملکیتونه",leads:"پېرودونکي",team:"د دفتر غړي",reports:"راپورونه",performance:"فعالیت",billing:"بیلونه",
 workspace:"د دفتر کاري ځای",sub:"ملکیتونه، خبرې، ټیم او د اپ خدمتونه اداره کړئ.",
 activity:"فعالیت",active:"فعال",pending:"په تمه",disabled:"نه دی تایید شوی",member:"غړی",owner:"څښتن",manager:"مدیر",agent:"استازی",
 invite:"نوی غړی راوبلئ",email:"تایید شوی ایمیل",emailHint:"بلنه د اخیستونکي تایید شوي ایمیل ته اړتیا لري.",
 send:"بلنه ولېږئ",assigned:"مسؤل لري",unassigned:"بې مسؤله",all:"ټول",new:"نوي",viewing:"لیدنه",followup:"تعقیب",
 open:"خبرې پرانیزئ",search:"غوښتنې ولټوئ",empty:"دې چاڼ ته غوښتنې نشته.",
 reply:"ځواب ته اړتیا لري",recent:"وروستی فعالیت",stages:"د مشتریانو مرحله",total:"ټول",awaiting:"ځواب ته انتظار",
 error:"د دفتر معلومات پورته نشول. لاسرسی وګورئ او بیا هڅه وکړئ.",refresh:"تازه کول",retry:"بیا هڅه",back:"دفتر ته ستنېدل",
 notAvailable:"دا برخه ستاسو د رول یا دفتر حالت ته نشته.",
 role:"ستاسو رول",members:"غړي",membership:"غړیتوب",access:"اجازې په سرور کې کتل کېږي او بدلېدلی شي.",
 viewProperties:"د دفتر اعلانونه اداره کړئ",newProperty:"نوی اعلان",viewLeads:"د مشتریانو لړلیک",
 analytics:"یوازې په اپ کې ثبت شوی فعالیت؛ د پلور یا ټیلیفوني خبرو ثبوت نه دی.",
 invoices:"بیل یوازې د اپ خدمتونو لپاره دی، د کور بیه نه ده.",pendingReview:"تایید د کارکوونکو کتنه غواړي.",
 note:"یوازې تایید شوی اعلان خپرېږي؛ د کتنې پر وخت پخوانی خپور اعلان ساتل کېږي.",
 noMembers:"لا غړي نشته.",status:"حالت",loading:"د دفتر معلومات پورته کېږي",filter:"چاڼ",choose:"غوره کول",
 month:"ورځې",count:"توکي",notVerified:"مسلکي تایید د ملکیت سند نه تضمینوي.",
 teamInvitation:"د غړیتوب انتظار",update:"بدلون",closed:"تړلی",stale:"لاسرسی لغوه یا دفتر شتون نه لري.",
 allProperties:"ټول ملکیتونه",draft:"مسوده",review:"د کتنې لاندې",published:"خپور شوی",paused:"درول شوی"
};
export const ag=(locale:Locale,key:Key)=>({en,fa,ps})[locale][key];
