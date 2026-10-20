import type {Locale} from "@amlaklink/localization";
const en={
 tabs:["Favorites","Saved searches","Shortlists"] as const,savedTitle:"Saved",savedSubtitle:"Properties and searches you want to revisit",
 manage:"Manage",browse:"Browse properties",compare:"Compare",selected:"selected",select:"Select property",
 remove:"Remove",undo:"Undo",removed:"Removed from favorites",removeFailed:"Could not remove saved property.",emptyFavorites:"No saved properties yet.",history:"Unavailable favorites remain visible until you remove them.",
 unavailable:"Unavailable",signIn:"Sign in to manage private saved items.",alerts:"In-app alerts",savedSearches:"Saved searches",shortlists:"Shared shortlists",
 searchesEmpty:"Save your current filters to see them here.",listsEmpty:"Create a private shortlist and invite trusted people.",more:"Open all",reload:"Retry",
 interest:"Interested",pass:"Not for me",groupSummary:"Group interest",none:"No votes yet",pending:"Invitation pending",member:"Member",owner:"Owner",
 status:"Status",type:"Property type",transaction:"Transaction",location:"Location",area:"Area",bedrooms:"Bedrooms",bathrooms:"Bathrooms",
 furnished:"Furnished",parking:"Parking",water:"Water",electricity:"Electricity",price:"Asking terms",deposit:"Refundable deposit",
 principal:"Refundable principal",monthly:"Monthly rent",currency:"Currency",missing:"Not provided",yes:"Yes",no:"No",
 different:"Different",same:"Same",differences:"Show differences only",allFields:"Show all details",
 compareUnavailable:"A selected property is no longer publicly comparable. Remove it from the comparison and retry.",
 compareHint:"Swipe horizontally to compare 2–4 properties. Prices are not converted between currencies.",
 view:"View details",rename:"Rename",renamePrompt:"Edit the name",save:"Save",cancel:"Cancel",filters:"Filters",
 unknown:"Unspecified",priceMin:"Min price",priceMax:"Max price",areaMin:"Min area",areaMax:"Max area",province:"Province",district:"District",city:"City",neighborhood:"Neighborhood",propertyType:"Property type",
 updated:"Updated",filterCount:"filters",newSearch:"Create a saved search",alertOff:"Alerts off",alertOn:"Alerts on",
 interestedCount:"interested",passCount:"passed",notes:"Group notes",safe:"Private to members; an opinion is not a property verification.",
 limit:"Select between two and four properties."
};
type Key=keyof typeof en;
const fa:Record<Key,typeof en[Key]|string|readonly string[]>={
 tabs:["علاقه‌مندی‌ها","جستجوهای ذخیره‌شده","فهرست‌های مشترک"],savedTitle:"ذخیره‌شده‌ها",savedSubtitle:"ملک‌ها و جستجوهای دلخواه شما",
 manage:"مدیریت",browse:"جستجوی ملک",compare:"مقایسه",selected:"انتخاب‌شده",select:"انتخاب ملک",
 remove:"حذف",undo:"بازگرداندن",removed:"از علاقه‌مندی‌ها حذف شد",removeFailed:"حذف ملک ممکن نشد.",emptyFavorites:"هنوز ملکی ذخیره نشده است.",history:"ملک‌های غیرموجود تا زمان حذف در ذخیره‌ها باقی می‌مانند.",
 unavailable:"غیرموجود",signIn:"برای مدیریت ذخیره‌های خصوصی وارد شوید.",alerts:"اعلان‌های داخل برنامه",savedSearches:"جستجوهای ذخیره‌شده",shortlists:"فهرست‌های مشترک",
 searchesEmpty:"فیلترهای خود را ذخیره کنید تا اینجا نمایش داده شوند.",listsEmpty:"یک فهرست خصوصی بسازید و افراد مورد اعتماد را دعوت کنید.",more:"مشاهدهٔ همه",reload:"تلاش دوباره",
 interest:"علاقه‌مند",pass:"نمی‌خواهم",groupSummary:"علاقه‌مندی گروه",none:"هنوز نظری نیست",pending:"دعوت در انتظار",member:"عضو",owner:"مالک",
 status:"وضعیت",type:"نوع ملک",transaction:"نوع معامله",location:"موقعیت",area:"مساحت",bedrooms:"اتاق خواب",bathrooms:"تشناب",
 furnished:"مبله",parking:"پارکینگ",water:"آب",electricity:"برق",price:"شرایط قیمت",deposit:"پیش‌پرداخت قابل بازپرداخت",
 principal:"گروی قابل بازپرداخت",monthly:"کرایهٔ ماهانه",currency:"واحد پول",missing:"ثبت نشده",yes:"بلی",no:"نخیر",
 different:"متفاوت",same:"یکسان",differences:"فقط تفاوت‌ها",allFields:"همهٔ جزئیات",
 compareUnavailable:"یکی از ملک‌ها دیگر قابل مقایسه نیست. آن را حذف و دوباره تلاش کنید.",
 compareHint:"برای مقایسهٔ ۲ تا ۴ ملک افقی حرکت کنید. هیچ تبدیل ارزی انجام نمی‌شود.",
 view:"مشاهدهٔ ملک",rename:"تغییر نام",renamePrompt:"ویرایش نام",save:"ذخیره",cancel:"انصراف",filters:"فیلترها",
 unknown:"نامشخص",priceMin:"حداقل قیمت",priceMax:"حداکثر قیمت",areaMin:"حداقل مساحت",areaMax:"حداکثر مساحت",province:"ولایت",district:"ناحیه",city:"شهر",neighborhood:"محله",propertyType:"نوع ملک",
 updated:"تازه‌شده",filterCount:"فیلتر",newSearch:"ایجاد جستجوی ذخیره‌شده",alertOff:"اعلان خاموش",alertOn:"اعلان روشن",
 interestedCount:"علاقه‌مند",passCount:"مخالف",notes:"یادداشت‌های گروه",safe:"خصوصی برای اعضا؛ نظر به معنای تأیید ملک نیست.",
 limit:"بین دو تا چهار ملک انتخاب کنید."
};
const ps:Record<Key,string|readonly string[]>={
 tabs:["خوښې","خوندي پلټنې","ګډ فهرستونه"],savedTitle:"خوندي شوي",savedSubtitle:"ستاسو خوښ ملکیتونه او پلټنې",
 manage:"مدیریت",browse:"ملکیتونه ولټوئ",compare:"پرتله",selected:"غوره شوي",select:"ملکیت وټاکئ",
 remove:"لرې کړه",undo:"بېرته راوړه",removed:"له خوښو لرې شو",removeFailed:"خوندي ملکیت لرې نه شو.",emptyFavorites:"تر اوسه ملکیت نه دی خوندي شوی.",history:"نه موجود ملکیتونه تر لرې کولو پورې پاتې کېږي.",
 unavailable:"نشته",signIn:"د شخصي خوندي شویو لپاره ننوځئ.",alerts:"د اپ خبرتیاوې",savedSearches:"خوندي پلټنې",shortlists:"ګډ فهرستونه",
 searchesEmpty:"خپل چاڼونه خوندي کړئ تر څو دلته ښکاره شي.",listsEmpty:"یو شخصي فهرست جوړ او باور وړ کسان راوبلئ.",more:"ټول وګورئ",reload:"بیا هڅه",
 interest:"زړه راښکونکی",pass:"نه مې خوښېږي",groupSummary:"د ډلې خوښه",none:"لا رایه نشته",pending:"بلنه پاتې ده",member:"غړی",owner:"څښتن",
 status:"حالت",type:"د ملکیت ډول",transaction:"د معاملې ډول",location:"ځای",area:"مساحت",bedrooms:"د خوب خونې",bathrooms:"تشنابونه",
 furnished:"مبله",parking:"پارکینګ",water:"اوبه",electricity:"برېښنا",price:"د بیې شرطونه",deposit:"بېرته ورکول کېدونکې پیسې",
 principal:"د ګروۍ اصل",monthly:"میاشتنۍ کرایه",currency:"اسعار",missing:"نه دي ورکړل شوي",yes:"هو",no:"نه",
 different:"بېل",same:"یو شان",differences:"یوازې توپیرونه",allFields:"ټول معلومات",
 compareUnavailable:"یو ملکیت نور د پرتله کېدو وړ نه دی؛ لرې یې کړئ او بیا هڅه وکړئ.",
 compareHint:"۲–۴ ملکیتونه څنګ ته پرتله کړئ. د اسعارو بدلون نه کېږي.",
 view:"معلومات وګورئ",rename:"نوم بدل کړه",renamePrompt:"نوم سم کړه",save:"خوندي کړه",cancel:"لغوه",filters:"چاڼونه",
 unknown:"نامعلوم",priceMin:"ټیټه بیه",priceMax:"لوړه بیه",areaMin:"لږ مساحت",areaMax:"ډېر مساحت",province:"ولایت",district:"ولسوالي",city:"ښار",neighborhood:"سیمه",propertyType:"د ملکیت ډول",
 updated:"تازه شوی",filterCount:"چاڼونه",newSearch:"نوې خوندي پلټنه",alertOff:"خبرتیا بنده",alertOn:"خبرتیا فعاله",
 interestedCount:"خوښونکي",passCount:"ناخوښونکي",notes:"د ډلې یادښتونه",safe:"یوازې د غړو لپاره؛ نظر د ملکیت تصدیق نه دی.",
 limit:"له دوو تر څلورو ملکیتونه وټاکئ."
};
export function savedText(locale:Locale,key:Exclude<Key,"tabs">):string{return ({en,fa,ps})[locale][key] as string;}
export function savedTabs(locale:Locale):readonly string[]{return ({en,fa,ps})[locale].tabs;}
