import {findProvince} from "@amlaklink/catalog";
import {type Locale} from "@amlaklink/localization";
import type {SearchFilters} from "./discovery-client";

const numericKeys=["minPrice","maxPrice","minArea","maxArea","bedrooms","bathrooms"] as const;
type NumericKey=typeof numericKeys[number];
export type FilterIssue={key:NumericKey|"rangePrice"|"rangeArea";message:string};
const message={
 en:{invalid:"Enter a valid non-negative number.",price:"Minimum price cannot exceed maximum price.",area:"Minimum area cannot exceed maximum area."},
 fa:{invalid:"عدد معتبر و غیرمنفی وارد کنید.",price:"حداقل قیمت نباید از حداکثر بیشتر باشد.",area:"حداقل مساحت نباید از حداکثر بیشتر باشد."},
 ps:{invalid:"سمه غیرمنفي شمېره ولیکئ.",price:"لږه بیه باید له لوړې بیې زیاته نه وي.",area:"لږ مساحت باید له ډېر مساحت زیات نه وي."}
} as const;

/** Accept English, Arabic and Persian digits without guessing currencies or units. */
export function asciiDigits(value:string){
 return value.replace(/[\u06F0-\u06F9]/g,c=>String(c.charCodeAt(0)-0x06f0))
  .replace(/[\u0660-\u0669]/g,c=>String(c.charCodeAt(0)-0x0660))
  .replace(/\u066B/g,".").replace(/[,\u066C]/g,"").trim();
}
export function validateSearchFilters(filters:SearchFilters,locale:Locale):FilterIssue|null{
 const values:Partial<Record<NumericKey,number>>={};
 for(const key of numericKeys){
  const raw=filters[key];
  if(raw===undefined||raw==="")continue;
  const normalized=asciiDigits(raw);
  if(!/^\d+(?:\.\d+)?$/.test(normalized)||
   ((key==="bedrooms"||key==="bathrooms")&&!Number.isInteger(Number(normalized)))||
   !Number.isFinite(Number(normalized))){
   return {key,message:message[locale].invalid};
  }
  values[key]=Number(normalized);
 }
 if(values.minPrice!==undefined&&values.maxPrice!==undefined&&values.minPrice>values.maxPrice)
  return {key:"rangePrice",message:message[locale].price};
 if(values.minArea!==undefined&&values.maxArea!==undefined&&values.minArea>values.maxArea)
  return {key:"rangeArea",message:message[locale].area};
 return null;
}
/** Do not reuse a street or a drawn search area when switching provinces. */
export function patchSearchFilters(previous:SearchFilters,patch:SearchFilters):SearchFilters{
 const result={...previous,...patch};
 if(patch.provinceId!==undefined&&patch.provinceId!==previous.provinceId){
  for(const key of ["city","district","neighborhood","viewport","polygon"] as const){
   if(!(key in patch))result[key]=undefined;
  }
 }
 if(patch.city!==undefined&&patch.city!==previous.city){
  if(!("district" in patch))result.district=undefined;
  if(!("neighborhood" in patch))result.neighborhood=undefined;
 }
 return result;
}
export function normalizeSearchNumbers(filters:SearchFilters):SearchFilters{
 const result={...filters};
 for(const key of numericKeys)if(result[key]!==undefined)
  result[key]=asciiDigits(result[key]!);
 return result;
}
type Key=keyof SearchFilters;
const titles={
 en:{q:"Keyword",intent:"Transaction",type:"Type",provinceId:"Province",city:"City",district:"District",neighborhood:"Neighborhood",
 currency:"Currency",minPrice:"From",maxPrice:"Up to",minArea:"Area from",maxArea:"Area up to",bedrooms:"Bedrooms",bathrooms:"Bathrooms",
 furnished:"Furnished",parking:"Parking",water:"Water",electricity:"Electricity",advertiser:"Advertiser",verifiedAgency:"Reviewed agency",
 viewport:"Map bounds",polygon:"Drawn area",sort:"Sort"},
 fa:{q:"کلمه",intent:"معامله",type:"نوع",provinceId:"ولایت",city:"شهر",district:"ناحیه",neighborhood:"محله",
 currency:"واحد پول",minPrice:"از",maxPrice:"تا",minArea:"مساحت از",maxArea:"مساحت تا",bedrooms:"اتاق",bathrooms:"تشناب",
 furnished:"مبله",parking:"پارکینگ",water:"آب",electricity:"برق",advertiser:"آگهی‌دهنده",verifiedAgency:"دفتر بررسی‌شده",
 viewport:"بخش نقشه",polygon:"محدودهٔ رسم‌شده",sort:"ترتیب"},
 ps:{q:"کلیمه",intent:"معامله",type:"ډول",provinceId:"ولایت",city:"ښار",district:"ولسوالي",neighborhood:"سیمه",
 currency:"پیسې",minPrice:"له",maxPrice:"تر",minArea:"مساحت له",maxArea:"مساحت تر",bedrooms:"خوب خونې",bathrooms:"تشنابونه",
 furnished:"مبله",parking:"تمځای",water:"اوبه",electricity:"برېښنا",advertiser:"اعلان ورکوونکی",verifiedAgency:"کتل شوی دفتر",
 viewport:"د نقشې سیمه",polygon:"رسم شوې سیمه",sort:"ترتیب"}
} satisfies Record<Locale,Record<Key,string>>;
const values={
 en:{sale:"Buy",rent:"Rent",gharawi:"Gharawi",house:"House",apartment:"Apartment",land:"Land",shop:"Shop",
 office:"Office",commercial:"Commercial",newest:"Newest",recent_confirmed:"Recently confirmed",price_asc:"Price: low",price_desc:"Price: high",true:"Yes",false:"No"},
 fa:{sale:"خرید",rent:"کرایه",gharawi:"گروی",house:"خانه",apartment:"آپارتمان",land:"زمین",shop:"دکان",
 office:"دفتر",commercial:"تجاری",newest:"جدیدترین",recent_confirmed:"تازه تأییدشده",price_asc:"قیمت کم",price_desc:"قیمت زیاد",true:"بلی",false:"نخیر"},
 ps:{sale:"پېرود",rent:"کرایه",gharawi:"ګروۍ",house:"کور",apartment:"اپارتمان",land:"ځمکه",shop:"دوکان",
 office:"دفتر",commercial:"سوداګریز",newest:"نوي",recent_confirmed:"تازه تایید شوي",price_asc:"ټیټه بیه",price_desc:"لوړه بیه",true:"هو",false:"نه"}
} as const;
export function filterLabel(locale:Locale,key:Key,value:string):string{
 const val=key==="provinceId"?findProvince(value)?.names[locale]||value:
  (values[locale] as Record<string,string>)[value]||value;
 return titles[locale][key]+": "+(key==="polygon"||key==="viewport"?"✓":val);
}
export const meaningfulFilterKeys=[
 "q","type","provinceId","city","district","neighborhood","currency","minPrice","maxPrice",
 "minArea","maxArea","bedrooms","bathrooms","furnished","parking","water","electricity",
 "advertiser","verifiedAgency","polygon","viewport"
] as const;
export function activeFilterKeys(filters:SearchFilters){
 return meaningfulFilterKeys.filter(key=>filters[key]!==undefined&&filters[key]!=="");
}
export function sortRequiresCurrency(sort:SearchFilters["sort"]){
 return sort==="price_asc"||sort==="price_desc";
}
