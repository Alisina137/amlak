import type {Locale} from "@amlaklink/localization";

/** Property detail copy: mirrors content and controls for Dari, Pashto and English. */
const en={
 priceBreakdown:"Price & terms",asking:"Asking price",monthlyRent:"Monthly rent",
 refundableDeposit:"Refundable deposit",refundablePrincipal:"Refundable gharawi principal",
 maintenance:"Monthly maintenance",duration:"Duration",months:"months",refundTerms:"Refund terms",
 negotiable:"Price negotiable",termsNote:"Confirm all prices, fees and terms with the advertiser before paying.",
 facts:"Property at a glance",area:"Area",bedrooms:"Bedrooms",bathrooms:"Bathrooms",
 floor:"Floor",totalFloors:"Total floors",frontage:"Frontage",condition:"Condition",
 new:"New",good:"Good",needs_work:"Needs work",amenities:"Amenities",
 furnished:"Furnished",parking:"Parking",water:"Water",electricity:"Electricity",
 description:"Description",readMore:"Read more",readLess:"Show less",
 location:"Location",locationNote:"Only general location information is shown here. Ask the advertiser for a visit.",
 lastConfirmed:"Availability last checked",availabilityNote:"Availability is not guaranteed. Confirm before visiting.",
 advertiser:"About the advertiser",reviewed:"Listing authorization reviewed",
 verificationNote:"Review does not guarantee property ownership, title, condition or safety.",
 contact:"Contact & next steps",inquiry:"Ask a question",viewing:"Request a viewing",
 viewingHint:"Start an inquiry and propose visit times. A visit is not booked until accepted.",
 phone:"Call advertiser",whatsapp:"WhatsApp",noPhone:"Phone calls disabled by advertiser.",
 noWhatsApp:"WhatsApp disabled by advertiser.",noContact:"This property is unavailable for contact.",
 problem:"Could not load this property.",retry:"Retry",shareFailed:"Could not share right now.",
 published:"Published",save:"Save",share:"Share",refresh:"Refresh property",
 confirm:"Published does not mean ownership verified.",privateLocation:"Exact private address is not shown.",
 photoCount:"photos",contactBusy:"Opening…",valueMissing:"Not specified"
} as const;
type Key=keyof typeof en;
const fa:Record<Key,string>={
 priceBreakdown:"قیمت و شرایط",asking:"قیمت پیشنهادی",monthlyRent:"کرایه ماهانه",
 refundableDeposit:"پیش‌پرداخت قابل بازگشت",refundablePrincipal:"مبلغ قابل بازگشت گروی",
 maintenance:"مصارف ماهانهٔ خدمات",duration:"مدت قرارداد",months:"ماه",refundTerms:"شرایط بازپرداخت",
 negotiable:"قیمت قابل مذاکره است",termsNote:"پیش از پرداخت، همه قیمت‌ها، هزینه‌ها و شرایط را با آگهی‌دهنده تأیید کنید.",
 facts:"مشخصات ملک",area:"مساحت",bedrooms:"اتاق خواب",bathrooms:"تشناب",
 floor:"طبقه",totalFloors:"مجموع طبقات",frontage:"بر ملک",condition:"وضعیت",
 new:"نو",good:"خوب",needs_work:"نیازمند ترمیم",amenities:"امکانات",
 furnished:"مبله",parking:"پارکینگ",water:"آب",electricity:"برق",
 description:"توضیحات",readMore:"نمایش بیشتر",readLess:"نمایش کمتر",
 location:"موقعیت",locationNote:"تنها موقعیت عمومی نشان داده شده است؛ برای بازدید با آگهی‌دهنده هماهنگ کنید.",
 lastConfirmed:"آخرین بررسی موجودیت",availabilityNote:"موجودیت ملک تضمین نیست؛ پیش از بازدید تأیید کنید.",
 advertiser:"دربارهٔ آگهی‌دهنده",reviewed:"صلاحیت نشر این آگهی بررسی شده است",
 verificationNote:"بررسی به معنای تضمین مالکیت، سند، وضعیت یا مصونیت ملک نیست.",
 contact:"تماس و مراحل بعدی",inquiry:"پرسش دربارهٔ ملک",viewing:"درخواست بازدید",
 viewingHint:"ابتدا پیام بفرستید و زمان پیشنهاد کنید. بازدید تنها پس از تأیید قطعی می‌شود.",
 phone:"تماس تلفنی",whatsapp:"واتساپ",noPhone:"تماس تلفنی توسط آگهی‌دهنده غیرفعال شده است.",
 noWhatsApp:"واتساپ توسط آگهی‌دهنده غیرفعال شده است.",noContact:"راه‌های تماس برای این ملک غیرفعال است.",
 problem:"دریافت معلومات این ملک ممکن نشد.",retry:"تلاش دوباره",shareFailed:"اشتراک‌گذاری ممکن نشد.",
 published:"نشر شده",save:"ذخیره",share:"اشتراک",refresh:"تازه‌سازی ملک",
 confirm:"نشر آگهی به معنای تأیید مالکیت نیست.",privateLocation:"آدرس دقیق خصوصی نمایش داده نمی‌شود.",
 photoCount:"عکس",contactBusy:"در حال بازکردن…",valueMissing:"ذکر نشده"
};
const ps:Record<Key,string>={
 priceBreakdown:"بیه او شرطونه",asking:"غوښتل شوې بیه",monthlyRent:"میاشتنۍ کرایه",
 refundableDeposit:"بېرته ورکړل کېدونکې زیرمه",refundablePrincipal:"د ګروۍ بېرته ورکړل کېدونکې پیسې",
 maintenance:"میاشتني خدماتي لګښتونه",duration:"د تړون موده",months:"میاشتې",refundTerms:"د بېرته ورکولو شرطونه",
 negotiable:"بیه د خبرو وړ ده",termsNote:"له پیسو ورکولو وړاندې ټولې بیې او شرطونه له اعلان ورکوونکي سره تایید کړئ.",
 facts:"د ملکیت ځانګړنې",area:"مساحت",bedrooms:"د خوب خونې",bathrooms:"تشنابونه",
 floor:"پوړ",totalFloors:"ټول پوړونه",frontage:"د ځمکې مخ",condition:"حالت",
 new:"نوی",good:"ښه",needs_work:"ترمیم ته اړتیا لري",amenities:"اسانتیاوې",
 furnished:"مبله",parking:"پارکینګ",water:"اوبه",electricity:"برېښنا",
 description:"معلومات",readMore:"نور ولولئ",readLess:"لنډ یې کړئ",
 location:"ځای",locationNote:"یوازې عمومي ځای ښودل کېږي؛ د لیدنې لپاره له اعلان ورکوونکي سره خبرې وکړئ.",
 lastConfirmed:"وروستی ځل شتون کتل شوی",availabilityNote:"شتون تضمین نه دی؛ له لیدنې مخکې یې تایید کړئ.",
 advertiser:"د اعلان ورکوونکي په اړه",reviewed:"د دې اعلان د خپرولو واک ارزول شوی",
 verificationNote:"ارزونه د ملکیت، اسنادو، حالت یا خوندیتوب تضمین نه کوي.",
 contact:"اړیکه او راتلونکي ګامونه",inquiry:"د ملکیت پوښتنه",viewing:"د لیدنې غوښتنه",
 viewingHint:"لومړی پوښتنه ولېږئ او وختونه وټاکئ. لیدنه یوازې په تایید ترسره کېږي.",
 phone:"ټیلیفون",whatsapp:"واټساپ",noPhone:"ټیلیفون د اعلان ورکوونکي له خوا بند شوی.",
 noWhatsApp:"واټساپ د اعلان ورکوونکي له خوا بند شوی.",noContact:"له دې ملکیت سره اړیکه نشته.",
 problem:"د ملکیت معلومات ترلاسه نشول.",retry:"بیا هڅه",shareFailed:"شریکول ونه شول.",
 published:"خپور شوی",save:"خوندي کړه",share:"شریکول",refresh:"ملکیت تازه کړه",
 confirm:"خپریدل د ملکیت د مالکیت تایید نه دی.",privateLocation:"کره شخصي پته نه ښودل کېږي.",
 photoCount:"انځورونه",contactBusy:"پرانیستل کېږي…",valueMissing:"نه دي ویل شوي"
};
const dictionaries:Record<Locale,Record<Key,string>>={en,fa,ps};
export function pd(locale:Locale,key:Key){return dictionaries[locale][key];}
