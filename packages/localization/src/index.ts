export type Locale = "fa" | "ps" | "en";
export const DEFAULT_LOCALE: Locale = "fa";
export const isRTL = (locale: Locale): boolean => locale !== "en";
export const localeNames: Record<Locale, string> = { fa: "دری", ps: "پښتو", en: "English" };
const en = {
  appName:"AmlakLink", tagline:"A better way to find property in Afghanistan",
  explore:"Explore",search:"Search",saved:"Saved",inbox:"Inbox",account:"Account",
  buy:"Buy",rent:"Rent",gharawi:"Gharawi",properties:"Properties",findHome:"Find your next place",
  location:"Location",chooseProvince:"Choose province",allAfghanistan:"All Afghanistan",
  searchProvince:"Search all 34 provinces",selectedLocation:"Your area",kabul:"Kabul",
  filters:"Filters",noListings:"Listings will appear once verified advertisers start publishing.",
  noSaved:"No saved properties yet",noInbox:"Your conversations will appear here",
  browse:"Browse properties",signInLater:"Account sign-in will be available in Phase 2.",
  noResults:"No provinces matched your search",tryAgain:"Try again",networkOnline:"API connected",
  networkOffline:"Unable to reach API — location catalog remains available offline.",
  networkUnconfigured:"API URL not configured — browsing provinces works offline.",
  changeLanguage:"Language",welcome:"Welcome",guest:"Browsing as guest",
  myProperties:"Manage properties",privacy:"Privacy and safety",country:"Afghanistan",
  phaseNotice:"Property publishing is not available in this foundation release.",
  searchHint:"Search by province or property type",availableSoon:"Available in a later phase",
  current:"Selected",select:"Select",languageDescription:"Choose the app language",
  openProvince:"Change province", retryConnection:"Retry connection", viewAll:"All provinces",
  noAccess:"Please sign in to use this feature after account access is enabled.",
} as const;
type Key = keyof typeof en;
const fa: Record<Key,string> = {
  appName:"املاک لینک",tagline:"راه آسان‌تر برای یافتن ملک در افغانستان",
  explore:"خانه",search:"جستجو",saved:"ذخیره‌شده",inbox:"پیام‌ها",account:"حساب",
  buy:"خرید",rent:"کرایه",gharawi:"گروی",properties:"ملک‌ها",findHome:"خانهٔ بعدی‌تان را پیدا کنید",
  location:"موقعیت",chooseProvince:"انتخاب ولایت",allAfghanistan:"تمام افغانستان",
  searchProvince:"جستجو در ۳۴ ولایت",selectedLocation:"محدودهٔ شما",kabul:"کابل",
  filters:"فیلترها",noListings:"پس از نشر آگهی‌های تأییدشده، ملک‌ها اینجا نمایش داده می‌شوند.",
  noSaved:"هنوز ملکی ذخیره نکرده‌اید",noInbox:"گفتگوهای شما اینجا نشان داده می‌شوند",
  browse:"جستجوی ملک",signInLater:"ورود به حساب در مرحلهٔ دوم فعال می‌شود.",
  noResults:"ولایتی یافت نشد",tryAgain:"تلاش دوباره",networkOnline:"اتصال با سرور برقرار است",
  networkOffline:"اتصال با سرور برقرار نشد؛ فهرست ولایات آفلاین هم کار می‌کند.",
  networkUnconfigured:"آدرس سرور تنظیم نشده؛ جستجوی ولایت آفلاین کار می‌کند.",
  changeLanguage:"زبان",welcome:"خوش آمدید",guest:"در حال مرور به‌عنوان مهمان",
  myProperties:"مدیریت ملک‌ها",privacy:"حریم خصوصی و امنیت",country:"افغانستان",
  phaseNotice:"نشر آگهی ملک در نسخهٔ زیربنایی هنوز فعال نیست.",
  searchHint:"ولایت یا نوع ملک را جستجو کنید",availableSoon:"در مرحلهٔ بعدی فعال می‌شود",
  current:"انتخاب‌شده",select:"انتخاب",languageDescription:"زبان برنامه را انتخاب کنید",
  openProvince:"تغییر ولایت",retryConnection:"تلاش مجدد برای اتصال",viewAll:"همهٔ ولایات",
  noAccess:"برای استفاده از این بخش، پس از فعال‌شدن حساب‌ها وارد شوید.",
};
const ps: Record<Key,string> = {
  appName:"املاک لینک",tagline:"په افغانستان کې د کور موندلو اسانه لاره",
  explore:"کورپاڼه",search:"لټون",saved:"خوندي شوي",inbox:"پیغامونه",account:"حساب",
  buy:"پېرود",rent:"کرایه",gharawi:"ګروۍ",properties:"ملکیتونه",findHome:"خپل راتلونکی کور ومومئ",
  location:"ځای",chooseProvince:"ولایت وټاکئ",allAfghanistan:"ټول افغانستان",
  searchProvince:"په ۳۴ ولایتونو کې لټون",selectedLocation:"ستاسې سیمه",kabul:"کابل",
  filters:"چاڼونه",noListings:"کله چې تایید شوي اعلانونه خپاره شي، دلته به ښکاره شي.",
  noSaved:"تر اوسه مو کوم ملکیت نه دی خوندي کړی",noInbox:"ستاسې خبرې اترې به دلته ښکاره شي",
  browse:"د ملکیتونو لټون",signInLater:"حساب ته ننوتل په دویم پړاو کې فعالېږي.",
  noResults:"هیڅ ولایت پیدا نه شو",tryAgain:"بیا هڅه وکړئ",networkOnline:"له سرور سره اړیکه ټینګه ده",
  networkOffline:"سرور ته لاسرسی نشته؛ د ولایتونو لټون بې انټرنېټه هم کار کوي.",
  networkUnconfigured:"د سرور پته نه ده ټاکل شوې؛ ولایتونه بې انټرنېټه لټول کېږي.",
  changeLanguage:"ژبه",welcome:"ښه راغلاست",guest:"د مېلمه په توګه لټون",
  myProperties:"زما ملکیتونه",privacy:"محرمیت او خوندیتوب",country:"افغانستان",
  phaseNotice:"د ملکیت اعلان خپرول په دې بنسټیز پړاو کې لا نشته.",
  searchHint:"ولایت یا د ملکیت ډول ولټوئ",availableSoon:"په راتلونکي پړاو کې",
  current:"غوره شوی",select:"وټاکئ",languageDescription:"د اپلیکیشن ژبه وټاکئ",
  openProvince:"ولایت بدل کړئ",retryConnection:"د اړیکې بیا هڅه",viewAll:"ټول ولایتونه",
  noAccess:"د دې برخې لپاره، کله چې حسابونه فعال شي، ننوځئ.",
};
const translations: Record<Locale,Record<Key,string>>={fa,ps,en};
export function t(locale: Locale, key: Key): string { return translations[locale][key]; }
export function isLocale(value: unknown): value is Locale {return value === "fa" || value === "ps" || value === "en";}
export function formatNumber(value:number,locale:Locale):string {
 return new Intl.NumberFormat(locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-US").format(value);
}
