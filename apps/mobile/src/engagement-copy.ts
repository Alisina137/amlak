import type {Locale} from "@amlaklink/localization";
const en={
 inquiries:"Inquiries",viewings:"Viewings",notifications:"Notifications",newInquiry:"Ask about this property",
 inquiryPrompt:"Ask the advertiser a question about this property.",send:"Send inquiry",reply:"Send message",
 message:"Write a message",sending:"Sending…",none:"Your conversations will appear here.",login:"Sign in to send messages",
 sent:"My inquiries",received:"Received inquiries",open:"Open conversation",refresh:"Refresh",unknown:"Something went wrong. Try again.",
 empty:"No records yet.",new:"New",responded:"Responded",closed:"Closed",block:"Block this user",blocked:"This conversation is blocked.",
 close:"Close conversation",priceChanged:"The listing price changed since this inquiry began.",
 snapshot:"Price at first inquiry",lead:"Lead status",assignee:"Assigned agent",unassigned:"Unassigned",
 addNote:"Save internal note",note:"Private agency note (not visible to seeker)",agencyNotes:"Agency-only notes",assign:"Assign lead",
 newViewing:"Request a property visit",pickSlots:"Choose 2–3 proposed times (Kabul time).",noteForViewing:"Optional note",viewingSent:"Request sent; awaiting advertiser confirmation.",
 requested:"Requested",counterproposed:"New time proposed",confirmed:"Confirmed",declined:"Declined",cancelled:"Cancelled",completed:"Completed",no_show:"No-show",
 accept:"Accept proposed time",confirm:"Confirm",counter:"Propose this time",decline:"Decline",cancel:"Cancel viewing",complete:"Mark completed",noShow:"Mark no-show",
 proposed:"Suggested times",confirmedTime:"Confirmed time",counterTime:"Alternative time",timeNote:"Only the advertiser can confirm a requested time.",
 pending:"No booking until confirmed by both parties.",choose:"Choose a time",more:"Open viewing",allRead:"Mark all read",
 safety:"Messages are not binding property contracts. Never transfer money based solely on messages.",
 signInRequired:"Sign in and verify your email to inquire.",noAccess:"You no longer have permission to see this conversation."
} as const;
type Key=keyof typeof en;
const fa:Record<Key,string>={
 inquiries:"پیام‌ها",viewings:"بازدیدها",notifications:"اطلاعیه‌ها",newInquiry:"پرسش دربارهٔ این ملک",
 inquiryPrompt:"دربارهٔ این ملک به آگهی‌دهنده پیام بفرستید.",send:"ارسال پرسش",reply:"ارسال پیام",
 message:"پیام بنویسید",sending:"در حال ارسال…",none:"گفتگوهای شما اینجا نمایش داده می‌شوند.",login:"برای ارسال پیام وارد شوید",
 sent:"پرسش‌های من",received:"پرسش‌های دریافتی",open:"بازکردن گفتگو",refresh:"تازه‌سازی",unknown:"مشکل پیش آمد؛ دوباره تلاش کنید.",
 empty:"هنوز معلوماتی وجود ندارد.",new:"جدید",responded:"پاسخ‌داده‌شده",closed:"بسته",block:"مسدودکردن این کاربر",blocked:"این گفتگو مسدود شده است.",
 close:"بستن گفتگو",priceChanged:"قیمت ملک پس از آغاز این گفتگو تغییر کرده است.",
 snapshot:"قیمت در هنگام اولین پرسش",lead:"وضعیت مشتری",assignee:"نمایندهٔ مسئول",unassigned:"بدون مسئول",
 addNote:"ذخیرهٔ یادداشت خصوصی",note:"یادداشت داخلی دفتر (برای مشتری قابل مشاهده نیست)",agencyNotes:"یادداشت‌های مخصوص دفتر",assign:"تعیین مسئول",
 newViewing:"درخواست بازدید ملک",pickSlots:"۲ تا ۳ زمان پیشنهادی (وقت کابل) را انتخاب کنید.",noteForViewing:"یادداشت اختیاری",viewingSent:"درخواست ارسال شد؛ منتظر تأیید آگهی‌دهنده باشید.",
 requested:"درخواست‌شده",counterproposed:"زمان جدید پیشنهاد شد",confirmed:"تأییدشده",declined:"ردشده",cancelled:"لغوشده",completed:"انجام‌شده",no_show:"حاضر نشد",
 accept:"پذیرفتن زمان پیشنهادی",confirm:"تأیید",counter:"پیشنهاد زمان جدید",decline:"رد",cancel:"لغو بازدید",complete:"علامت انجام‌شده",noShow:"علامت حاضر نشد",
 proposed:"زمان‌های پیشنهادی",confirmedTime:"زمان تأییدشده",counterTime:"زمان جدید",timeNote:"فقط آگهی‌دهنده می‌تواند زمان درخواستی را تأیید کند.",
 pending:"تا پیش از تأیید طرفین، بازدید قطعی نیست.",choose:"انتخاب زمان",more:"نمایش بازدید",allRead:"همه خوانده شدند",
 safety:"پیام‌ها قرارداد قانونی ملک نیستند. بر اساس پیام‌ها پول انتقال ندهید.",
 signInRequired:"برای پرسش، وارد شوید و ایمیل خود را تأیید کنید.",noAccess:"شما دیگر اجازهٔ دیدن این گفتگو را ندارید."
};
const ps:Record<Key,string>={
 inquiries:"پیغامونه",viewings:"لیدنې",notifications:"خبرتیاوې",newInquiry:"د دې ملکیت پوښتنه",
 inquiryPrompt:"د ملکیت په اړه اعلان ورکوونکي ته پیغام ولیکئ.",send:"پوښتنه ولېږئ",reply:"پیغام ولېږئ",
 message:"پیغام ولیکئ",sending:"لېږل کېږي…",none:"ستاسو خبرې دلته ښکاري.",login:"د پیغام لپاره ننوځئ",
 sent:"زما پوښتنې",received:"ترلاسه شوې پوښتنې",open:"خبرې پرانیزئ",refresh:"تازه کول",unknown:"ستونزه پېښه شوه، بیا هڅه وکړئ.",
 empty:"لا څه نشته.",new:"نوی",responded:"ځواب شوی",closed:"تړل شوی",block:"دا کارن بند کړئ",blocked:"دا خبرې بندې دي.",
 close:"خبرې وتړئ",priceChanged:"د ملکیت بیه د پوښتنې وروسته بدله شوې ده.",
 snapshot:"د لومړۍ پوښتنې بیه",lead:"د مشتری حالت",assignee:"مسئول استازی",unassigned:"بې مسئوله",
 addNote:"شخصي یادښت خوندي کړئ",note:"د دفتر داخلي یادښت (مشتري یې نه ویني)",agencyNotes:"یوازې د دفتر یادښتونه",assign:"استازی وټاکئ",
 newViewing:"د ملکیت لیدنې غوښتنه",pickSlots:"۲–۳ وختونه وټاکئ (د کابل وخت).",noteForViewing:"اختیاري یادښت",viewingSent:"غوښتنه ولېږل شوه؛ د اعلان ورکوونکي تایید ته انتظار دی.",
 requested:"غوښتل شوی",counterproposed:"بل وخت وړاندیز شو",confirmed:"تایید شوی",declined:"رد شوی",cancelled:"لغوه شوی",completed:"بشپړ شوی",no_show:"حاضر نه شو",
 accept:"وخت ومنئ",confirm:"تایید",counter:"بل وخت وړاندیز",decline:"رد",cancel:"لیدنه لغوه کړئ",complete:"بشپړ نښه",noShow:"غیرحاضر نښه",
 proposed:"وړاندیز شوي وختونه",confirmedTime:"تایید شوی وخت",counterTime:"بل وړاندیز",timeNote:"یوازې اعلان ورکوونکی غوښتل شوی وخت تاییدولی شي.",
 pending:"د دواړو تر موافقې پرته لیدنه قطعي نه ده.",choose:"وخت وټاکئ",more:"لیدنه وګورئ",allRead:"ټول لوستل شوي",
 safety:"پیغامونه قانوني تړونونه نه دي؛ یوازې د پیغام پر بنسټ پیسې مه ورکوئ.",
 signInRequired:"د پوښتنې لپاره ننوځئ او ایمیل تایید کړئ.",noAccess:"تاسو نور د دې خبرو د لیدو اجازه نه لرئ."
};
export function et(locale:Locale,key:Key){return ({fa,ps,en})[locale][key];}
