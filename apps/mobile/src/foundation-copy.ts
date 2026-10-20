import type {Locale} from "@amlaklink/localization";

/** Shared messaging uses the active app locale; no English fallback in RTL layouts. */
const dictionaries={
 en:{
  offline:"Connection lost. Information may be out of date.",
  unconfigured:"API connection has not been configured.",
  retry:"Try connecting again",loading:"Loading…",error:"Something went wrong.",
  nothing:"Nothing to show yet.",searchAgain:"Try different filters.",
  cached:"Previously saved results — availability may have changed.",
  empty:"No items found.",dismiss:"Dismiss"
 },
 fa:{
  offline:"اتصال قطع شده است؛ معلومات ممکن است تازه نباشد.",
  unconfigured:"اتصال سرور برنامه هنوز تنظیم نشده است.",
  retry:"تلاش دوباره برای اتصال",loading:"در حال بارگیری…",error:"مشکلی رخ داده است.",
  nothing:"هنوز چیزی برای نمایش نیست.",searchAgain:"فیلترهای دیگری را امتحان کنید.",
  cached:"نتایج قبلاً ذخیره شده‌اند؛ موجودیت ملک ممکن است تغییر کرده باشد.",
  empty:"موردی پیدا نشد.",dismiss:"بستن"
 },
 ps:{
  offline:"اړیکه پرې شوې؛ معلومات ښايي زاړه وي.",
  unconfigured:"د اپ د سرور اړیکه لا نه ده تنظیم شوې.",
  retry:"بیا د نښلېدو هڅه",loading:"پورته کېږي…",error:"یوه ستونزه رامنځته شوه.",
  nothing:"لا د ښودلو لپاره څه نشته.",searchAgain:"نور فلټرونه وازمایئ.",
  cached:"مخکې خوندي شوې پایلې دي؛ د ملکیت شتون بدلیدای شي.",
  empty:"هېڅ پایله ونه موندل شوه.",dismiss:"بندول"
 }
} as const;
export type FoundationKey=keyof typeof dictionaries.en;
export function foundationText(locale:Locale,key:FoundationKey){return dictionaries[locale][key];}
export function localeDate(value:string|number|Date,locale:Locale){
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return "—";
 try{return new Intl.DateTimeFormat(locale==="en"?"en-GB":locale==="ps"?"ps-AF":"fa-AF",{year:"numeric",month:"short",day:"numeric"}).format(date);}
 catch{return date.toISOString().slice(0,10);}
}
