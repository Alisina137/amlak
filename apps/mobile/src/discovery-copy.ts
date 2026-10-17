import type {Locale} from "@amlaklink/localization";
const en={
 latest:"Recently confirmed properties",searchPlaceholder:"City, neighborhood, property description",results:"Results",filter:"Filters",sort:"Sort",map:"Map",list:"List",
 showMore:"Show more properties",loading:"Loading properties…",noResults:"No properties match these filters.",relax:"Remove a filter or choose a broader area.",
 retry:"Retry",offline:"Offline: showing previously viewed properties",refresh:"Refresh",apply:"Apply filters",reset:"Reset filters",all:"All",
 region:"Location",city:"City",district:"District",neighborhood:"Neighborhood",category:"Property type",transaction:"Transaction",price:"Price range",
 currency:"Currency",priceMin:"Minimum price",priceMax:"Maximum price",areaMin:"Minimum m²",areaMax:"Maximum m²",
 bedrooms:"Bedrooms (minimum)",bathrooms:"Bathrooms (minimum)",furnished:"Furnished",parking:"Parking",water:"Water",electricity:"Electricity",
 professional:"Advertiser",verified:"Reviewed agency only",newest:"Newest",recent:"Recently confirmed",low:"Lowest price",high:"Highest price",
 clear:"Clear",done:"Done",approximate:"Approximate location is not shown as an exact map pin.",
 mapEmpty:"No properties with shareable precise coordinates in these results. Use the list to explore more.",
 mapProvider:"Map tiles unavailable. Continue using the list view.",returnList:"Return to list",mapArea:"Search this map area",
 save:"Save property",unsave:"Remove from saved",signin:"Sign in to save this property",savedEmpty:"You have not saved any properties yet.",
 savedHistory:"Unavailable properties remain visible in your saved history.",contact:"Contact advertiser",call:"Call",whatsapp:"WhatsApp",
 callUnavailable:"Calls are not enabled for this property.",whatsappUnavailable:"WhatsApp is not enabled for this property.",
 safeContact:"Call/WhatsApp opens an external app. A tap does not confirm a conversation or transaction.",
 profile:"Advertiser profile",profileListings:"Other available properties",badges:"Verification scope",contactBadge:"Verified email contact",
 agencyBadge:"Agency registration reviewed",proBadge:"Professional application reviewed",notOwnership:"Verification does not certify ownership, legal title or the property’s condition.",
 share:"Share",unavailable:"This property is not currently available. Contact options are disabled.",active:"Available",limited:"Map shows only exact locations voluntarily shared by advertisers.",
 favoriteError:"Could not change saved status. Try again.",unknown:"Service unavailable. Try again."
} as const;
type Key=keyof typeof en;
const fa:Record<Key,string>={
 latest:"ملک‌های تازه تأییدشده",searchPlaceholder:"شهر، محله یا مشخصات ملک",results:"نتایج",filter:"فیلترها",sort:"ترتیب",map:"نقشه",list:"فهرست",
 showMore:"نمایش ملک‌های بیشتر",loading:"در حال دریافت ملک‌ها…",noResults:"با این فیلترها ملکی یافت نشد.",relax:"یکی از فیلترها را حذف کنید یا محدوده را وسیع‌تر سازید.",
 retry:"تلاش دوباره",offline:"آفلاین: ملک‌های مشاهده‌شدهٔ قبلی",refresh:"تازه‌سازی",apply:"اعمال فیلترها",reset:"پاک‌کردن فیلترها",all:"همه",
 region:"موقعیت",city:"شهر",district:"ناحیه / ولسوالی",neighborhood:"محله",category:"نوع ملک",transaction:"نوع معامله",price:"محدودهٔ قیمت",
 currency:"واحد پول",priceMin:"حداقل قیمت",priceMax:"حداکثر قیمت",areaMin:"حداقل متر مربع",areaMax:"حداکثر متر مربع",
 bedrooms:"حداقل اتاق خواب",bathrooms:"حداقل تشناب",furnished:"مبله",parking:"پارکینگ",water:"آب",electricity:"برق",
 professional:"آگهی‌دهنده",verified:"فقط دفاتر بررسی‌شده",newest:"جدیدترین",recent:"تازه‌ترین تأیید موجودی",low:"قیمت کمتر",high:"قیمت بیشتر",
 clear:"پاک‌کردن",done:"تمام",approximate:"موقعیت تقریبی به‌عنوان نقطهٔ دقیق روی نقشه نمایش داده نمی‌شود.",
 mapEmpty:"هیچ ملکی با مختصات دقیق و قابل نشر یافت نشد. از فهرست استفاده کنید.",
 mapProvider:"نقشه بارگیری نشد. جستجو را در فهرست ادامه دهید.",returnList:"بازگشت به فهرست",mapArea:"جستجو در این محدودهٔ نقشه",
 save:"ذخیرهٔ ملک",unsave:"حذف از ذخیره‌شده‌ها",signin:"برای ذخیرهٔ ملک وارد حساب شوید",savedEmpty:"هنوز ملکی ذخیره نکرده‌اید.",
 savedHistory:"ملک‌های غیرموجود نیز در تاریخچهٔ ذخیره‌ها می‌مانند.",contact:"تماس با آگهی‌دهنده",call:"تماس",whatsapp:"واتساپ",
 callUnavailable:"تماس تلفنی برای این ملک فعال نیست.",whatsappUnavailable:"واتساپ برای این ملک فعال نیست.",
 safeContact:"تماس و واتساپ برنامهٔ دیگری را باز می‌کند؛ تماس یا معامله تأییدشده محسوب نمی‌شود.",
 profile:"پروفایل آگهی‌دهنده",profileListings:"دیگر ملک‌های موجود",badges:"حدود تأیید",contactBadge:"تماس ایمیلی تأیید شده",
 agencyBadge:"ثبت دفتر بررسی شده",proBadge:"درخواست فعالیت حرفه‌ای بررسی شده",notOwnership:"این تأیید به معنای تضمین مالکیت، سند قانونی یا وضعیت ملک نیست.",
 share:"اشتراک‌گذاری",unavailable:"این ملک فعلاً موجود نیست. راه‌های تماس غیرفعال اند.",active:"موجود",limited:"نقشه فقط موقعیت دقیق را نشان می‌دهد که صاحب ملک اجازهٔ نمایش آن را داده است.",
 favoriteError:"ذخیره یا حذف ملک ممکن نشد.",unknown:"سرویس در دسترس نیست؛ دوباره تلاش کنید."
};
const ps:Record<Key,string>={
 latest:"نوي تایید شوي ملکیتونه",searchPlaceholder:"ښار، سیمه یا د ملک ځانګړنې",results:"پایلې",filter:"چاڼونه",sort:"ترتیب",map:"نقشه",list:"لړلیک",
 showMore:"نور ملکیتونه وښایئ",loading:"ملکیتونه بارېږي…",noResults:"د دې چاڼونو سره ملکیت ونه موندل شو.",relax:"یو چاڼ لرې کړئ یا ساحه پراخه کړئ.",
 retry:"بیا هڅه",offline:"بې انټرنېټه: پخوا لیدل شوي ملکیتونه",refresh:"تازه کول",apply:"چاڼونه پلي کړئ",reset:"چاڼونه پاک کړئ",all:"ټول",
 region:"سیمه",city:"ښار",district:"ولسوالي / ناحیه",neighborhood:"محله",category:"د ملکیت ډول",transaction:"معامله",price:"د بیې حد",
 currency:"پیسې",priceMin:"لږه بیه",priceMax:"لوړه بیه",areaMin:"لږ متر مربع",areaMax:"ډېر متر مربع",
 bedrooms:"لږ خوب خونې",bathrooms:"لږ تشنابونه",furnished:"مبله",parking:"تمځای",water:"اوبه",electricity:"برېښنا",
 professional:"اعلان ورکوونکی",verified:"یوازې کتل شوي دفترونه",newest:"نوي",recent:"تازه شتون تایید شوي",low:"ټیټه بیه",high:"لوړه بیه",
 clear:"پاکول",done:"بشپړ",approximate:"نږدې ځای د دقیقې نقطې په توګه نه ښکاري.",
 mapEmpty:"دقیقې عامې همغږۍ لرونکي ملکیتونه نشته؛ له لړلیک څخه کار واخلئ.",
 mapProvider:"نقشه نه ده موجوده؛ لړلیک وکاروئ.",returnList:"لړلیک ته ستنېدل",mapArea:"په دې نقشه کې لټون",
 save:"ملکیت خوندي کړه",unsave:"له خوندي شویو لرې کړه",signin:"د خوندي کولو لپاره ننوځئ",savedEmpty:"تاسو تراوسه ملکیت نه دی خوندي کړی.",
 savedHistory:"نه موجود ملکیتونه هم په خوندي تاریخچه کې پاتې کېږي.",contact:"له اعلان ورکوونکي سره اړیکه",call:"ټیلیفون",whatsapp:"واټساپ",
 callUnavailable:"ټیلیفون اړیکه فعاله نه ده.",whatsappUnavailable:"واټساپ فعاله نه دی.",
 safeContact:"ټیلیفون او واټساپ بل اپ پرانیزي؛ دا بریالۍ اړیکه یا معامله نه تاییدوي.",
 profile:"د اعلان ورکوونکي پروفایل",profileListings:"نور موجود ملکیتونه",badges:"د تایید حدود",contactBadge:"ایمیل تایید شوی",
 agencyBadge:"د دفتر نوم‌لیکنه کتل شوې",proBadge:"مسلکي غوښتنه کتل شوې",notOwnership:"دا د ملکیت مالکیت، قانوني سند یا حالت تضمین نه کوي.",
 share:"شریکول",unavailable:"دا ملکیت اوس نشته؛ د اړیکې لارې تړلې دي.",active:"موجود",limited:"نقشه یوازې هغه دقیق ځایونه ښيي چې اعلان ورکوونکي یې اجازه ورکړې.",
 favoriteError:"خوندي کول بریالي نه شول.",unknown:"خدمت نشته، بیا هڅه وکړئ."
};
export function dt(locale:Locale,key:Key){return {en,fa,ps}[locale][key];}
