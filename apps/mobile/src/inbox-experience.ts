import {formatNumber,type Locale} from "@amlaklink/localization";
import type {InquiryDetail,InquirySummary,Viewing,Alert} from "./engagement-client";
import {et} from "./engagement-copy";
import {displayKabul} from "./engagement-client";

const en={
 inbox:"Messages & appointments",inboxSub:"Private inquiries, visits and in-app notices.",
 messages:"Messages",viewings:"Viewings",notices:"Notifications",
 all:"All",sent:"Sent",received:"Received",active:"Active",closed:"Closed",
 search:"Search conversations",searchEmpty:"No conversations match your filters.",
 conversation:"Conversation",lastActivity:"Last activity",viewingHint:"Suggested times are not bookings until confirmed.",
 allVisits:"All visits",upcoming:"Upcoming",history:"Past",today:"Today",noVisits:"No visits for this filter.",
 unread:"Unread",read:"Read",markRead:"Mark read",markAll:"Mark all as read",
 settings:"Push notification settings",settingsHint:"In-app notifications work without push permission. Remote push needs an enabled development build, configured server, device consent and a delivery worker.",
 recent:"Recent",older:"Earlier",noNotices:"No notifications in this group.",noMessages:"No messages yet.",
 pricing:"Price at first inquiry",currency:"Currency",sale:"Asking price",rent:"Monthly rent",deposit:"Refundable deposit",principal:"Refundable principal",duration:"Duration (months)",terms:"Refund terms",unknown:"Not provided",
 updated:"The listed price has changed. Check current listing before deciding.",
 sendHint:"Messages may take time to send; don't send twice while a request is pending.",
 contact:"Conversation",management:"Agency lead management",property:"View property",retry:"Retry",
 booked:"Agreed viewing time",pending:"Waiting for agreement",status:"Status",steps:"Appointment progress",requested:"Requested",counterproposed:"Time proposed",confirmed:"Confirmed",completed:"Completed",cancelled:"Cancelled",declined:"Declined",no_show:"No-show",
 selectSlot:"Choose a valid proposed time",timeZone:"All times shown in Kabul time (UTC+4:30).",conflict:"That viewing time is no longer available. Refresh and choose another.",
 cancelConfirm:"Cancel this visit?",yes:"Yes, cancel",no:"Keep visit",bookedNotice:"Only a confirmed visit has an agreed appointment time.",choose:"Choose one slot",
 direction:"Conversation details",date:"Date",reload:"Refresh",missing:"Nothing here yet.",remote:"Remote push is optional"
};
type Key=keyof typeof en;
const fa:Record<Key,string>={
 inbox:"پیام‌ها و بازدیدها",inboxSub:"پرسش‌ها، قرارهای بازدید و اطلاعیه‌های خصوصی.",
 messages:"پیام‌ها",viewings:"بازدیدها",notices:"اطلاعیه‌ها",all:"همه",sent:"ارسالی",received:"دریافتی",active:"فعال",closed:"بسته",
 search:"جستجو در گفتگوها",searchEmpty:"گفتگویی مطابق فیلتر پیدا نشد.",conversation:"گفتگو",lastActivity:"آخرین فعالیت",viewingHint:"زمان پیشنهادی تا تأیید طرفین قرار قطعی نیست.",
 allVisits:"همه بازدیدها",upcoming:"آینده",history:"گذشته",today:"امروز",noVisits:"بازدیدی برای این فیلتر نیست.",
 unread:"خوانده‌نشده",read:"خوانده‌شده",markRead:"علامت خوانده‌شده",markAll:"خواندن همه",
 settings:"تنظیمات اعلان تلفن",settingsHint:"اطلاعیه‌های داخل برنامه بدون اجازهٔ تلفن کار می‌کنند. اعلان‌های بیرونی به نسخهٔ توسعه‌ای، سرور فعال، اجازهٔ کاربر و سرویس ارسال نیاز دارند.",
 recent:"تازه",older:"قدیمی‌تر",noNotices:"اطلاعیه‌ای در این بخش نیست.",noMessages:"هنوز پیامی نیست.",
 pricing:"قیمت در آغاز پرسش",currency:"واحد پول",sale:"قیمت پیشنهادی",rent:"کرایهٔ ماهانه",deposit:"پیش‌پرداخت قابل بازپرداخت",principal:"گروی قابل بازپرداخت",duration:"مدت (ماه)",terms:"شرایط بازپرداخت",unknown:"ثبت نشده",
 updated:"قیمت آگهی تغییر کرده است. قبل از تصمیم، آگهی فعلی را بررسی کنید.",
 sendHint:"ارسال پیام ممکن است زمان ببرد؛ هنگام ارسال دوباره کلیک نکنید.",
 contact:"گفتگو",management:"مدیریت مشتریان دفتر",property:"نمایش ملک",retry:"تلاش دوباره",
 booked:"زمان تأییدشدهٔ بازدید",pending:"در انتظار توافق",status:"وضعیت",steps:"روند بازدید",requested:"درخواست",counterproposed:"زمان پیشنهادی",confirmed:"تأیید",completed:"انجام‌شده",cancelled:"لغو",declined:"رد",no_show:"حاضر نشد",
 selectSlot:"یک زمان پیشنهادی معتبر انتخاب کنید",timeZone:"همه زمان‌ها به وقت کابل (۴:۳۰+) است.",conflict:"این زمان دیگر در دسترس نیست. تازه‌سازی کرده و زمان دیگری انتخاب کنید.",
 cancelConfirm:"این بازدید لغو شود؟",yes:"بله، لغو",no:"بازدید حفظ شود",bookedNotice:"تنها بازدید تأییدشده دارای زمان قطعی است.",choose:"یک زمان را انتخاب کنید",
 direction:"جزئیات گفتگو",date:"تاریخ",reload:"تازه‌سازی",missing:"هنوز چیزی نیست.",remote:"اعلان تلفن اختیاری است"
};
const ps:Record<Key,string>={
 inbox:"پیغامونه او لیدنې",inboxSub:"شخصي پوښتنې، لیدنې او د اپ خبرتیاوې.",
 messages:"پیغامونه",viewings:"لیدنې",notices:"خبرتیاوې",all:"ټول",sent:"لېږل شوي",received:"ترلاسه شوي",active:"فعال",closed:"تړلي",
 search:"خبرې ولټوئ",searchEmpty:"د دې چاڼ لپاره خبرې نشته.",conversation:"خبرې",lastActivity:"وروستی فعالیت",viewingHint:"وړاندیز شوی وخت د دواړو له تایید پرته قطعي نه دی.",
 allVisits:"ټولې لیدنې",upcoming:"راتلونکې",history:"تېرې",today:"نن",noVisits:"دې چاڼ ته لیدنې نشته.",
 unread:"نالوستل شوي",read:"لوستل شوي",markRead:"لوستل شوی وښایه",markAll:"ټول ولوستل شو",
 settings:"د موبایل خبرتیاوې",settingsHint:"د اپ خبرتیاوې د موبایل له اجازې پرته هم کار کوي. بهرني خبرتیاوې پرمختیايي نسخه، فعال سرور، اجازه او لېږونکی غواړي.",
 recent:"نوي",older:"مخکیني",noNotices:"دلته خبرتیا نشته.",noMessages:"تر اوسه پیغام نشته.",
 pricing:"د لومړۍ پوښتنې بیه",currency:"اسعار",sale:"غوښتل شوې بیه",rent:"میاشتنۍ کرایه",deposit:"بېرته ورکول کېدونکې پیسې",principal:"د ګروۍ اصل",duration:"موده (میاشتې)",terms:"د بېرته ورکولو شرطونه",unknown:"نه دي ورکړل شوي",
 updated:"د اعلان بیه بدله شوې ده. له پرېکړې مخکې اوسنی اعلان وګورئ.",
 sendHint:"د پیغام لېږل وخت نیولی شي؛ د لېږلو پر وخت بیا مه ټکوه.",
 contact:"خبرې",management:"د دفتر د مشتریانو اداره",property:"ملکیت وګورئ",retry:"بیا هڅه",
 booked:"د لیدنې تایید شوی وخت",pending:"موافقې ته انتظار",status:"حالت",steps:"د لیدنې بهیر",requested:"غوښتنه",counterproposed:"بل وخت",confirmed:"تایید",completed:"بشپړه",cancelled:"لغوه",declined:"رد",no_show:"حاضر نه شو",
 selectSlot:"یو سم وړاندیز شوی وخت وټاکئ",timeZone:"ټول وختونه د کابل وخت (۴:۳۰+) دي.",conflict:"دا وخت نور نه شته. تازه یې کړئ او بل وخت وټاکئ.",
 cancelConfirm:"دا لیدنه لغوه شي؟",yes:"هو، لغوه",no:"لیدنه وساته",bookedNotice:"یوازې تایید شوې لیدنه قطعي وخت لري.",choose:"یو وخت وټاکئ",
 direction:"د خبرو معلومات",date:"نېټه",reload:"تازه کول",missing:"تر اوسه نشته.",remote:"بهرنۍ خبرتیاوې اختیاري دي"
};
export function ix(locale:Locale,key:Key){return ({en,fa,ps})[locale][key];}
export function inquiryStatus(locale:Locale,value:string){
 if(value==="closed")return et(locale,"closed");
 if(value==="responded")return et(locale,"responded");
 if(value==="blocked")return et(locale,"blocked");
 return et(locale,"new");
}
export function priceSnapshotRows(input:InquiryDetail["priceSnapshot"],locale:Locale):Array<[string,string]>{
 const currency=typeof input.currency==="string"?input.currency:"";
 const fmt=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?formatNumber(value,locale)+(currency?" "+currency:""):ix(locale,"unknown");
 const rows:Array<[string,string]>=[];
 if(input.askingPrice!==undefined)rows.push([ix(locale,"sale"),fmt(input.askingPrice)]);
 if(input.monthlyRent!==undefined)rows.push([ix(locale,"rent"),fmt(input.monthlyRent)]);
 if(input.refundableDeposit!==undefined)rows.push([ix(locale,"deposit"),fmt(input.refundableDeposit)]);
 if(input.refundablePrincipal!==undefined)rows.push([ix(locale,"principal"),fmt(input.refundablePrincipal)]);
 if(typeof input.durationMonths==="number")rows.push([ix(locale,"duration"),formatNumber(input.durationMonths,locale)]);
 if(typeof input.refundTerms==="string"&&input.refundTerms.trim())rows.push([ix(locale,"terms"),input.refundTerms]);
 if(currency)rows.push([ix(locale,"currency"),currency]);
 return rows.length?rows:[[ix(locale,"pricing"),ix(locale,"unknown")]];
}
export const isPastVisit=(viewing:Viewing,now=Date.now())=>["completed","cancelled","declined","no_show"].includes(viewing.status)||
 viewing.status==="confirmed"&&!!viewing.confirmedSlot&&new Date(viewing.confirmedSlot).getTime()<now;
export function notificationGroup(value:Alert,now=Date.now()){
 return now-new Date(value.createdAt).getTime()<7*86400000?"recent" as const:"older" as const;
}
/** Only the backend notification record supplies read state. Conversation status is not an unread count. */
export function unreadForThreads(items:InquirySummary[],notices:Alert[]){
 const activeIds=new Set(items.map(item=>item.id));
 return new Set(notices.filter(n=>!n.isRead&&["inquiry","lead","message"].includes(n.kind)&&n.referenceId&&activeIds.has(n.referenceId)).map(n=>n.referenceId!));
}
export function noticeLabel(locale:Locale,kind:string){
 if(kind==="viewing")return ix(locale,"viewings");
 if(["message","inquiry","lead"].includes(kind))return ix(locale,"messages");
 if(kind==="saved_search")return locale==="en"?"Saved search":locale==="fa"?"جستجوی ذخیره‌شده":"خوندي پلټنه";
 if(kind==="support")return locale==="en"?"Support":locale==="fa"?"پشتیبانی":"ملاتړ";
 if(kind==="safety")return locale==="en"?"Safety":locale==="fa"?"ایمنی":"خوندیتوب";
 if(kind==="freshness")return locale==="en"?"Availability":locale==="fa"?"موجودیت":"شتون";
 if(kind.startsWith("subscription"))return locale==="en"?"Subscription":locale==="fa"?"اشتراک":"ګډون";
 return ix(locale,"notices");
}
export function viewingLabel(viewing:Viewing,locale:Locale){
 const slot=viewing.confirmedSlot||viewing.counterSlot||viewing.proposedSlots[0];
 return slot?displayKabul(slot,locale):ix(locale,"unknown");
}
