import {findProvince} from "@amlaklink/catalog";
import {formatNumber,type Locale} from "@amlaklink/localization";
import type {SearchFilters} from "./discovery-client";
import {savedText} from "./saved-copy";

export function savedFilterSummary(filters:Record<string,string>|SearchFilters,locale:Locale){
 const names:Record<string,string>={
  provinceId:savedText(locale,"province"),city:savedText(locale,"city"),district:savedText(locale,"district"),
  neighborhood:savedText(locale,"neighborhood"),type:savedText(locale,"propertyType"),
  intent:savedText(locale,"transaction"),minPrice:savedText(locale,"priceMin"),maxPrice:savedText(locale,"priceMax"),
  minArea:savedText(locale,"areaMin"),maxArea:savedText(locale,"areaMax"),
  bedrooms:savedText(locale,"bedrooms"),bathrooms:savedText(locale,"bathrooms"),
  furnished:savedText(locale,"furnished"),parking:savedText(locale,"parking"),
  water:savedText(locale,"water"),electricity:savedText(locale,"electricity"),currency:savedText(locale,"currency")
 };
 const result:string[]=[];
 for(const [key,value] of Object.entries(filters)){
  if(value===undefined||value===null||String(value).trim()==="")continue;
  // Never show serialized map polygons, private locations or cursor identifiers.
  if(["viewport","polygon","cursor","limit","sort"].includes(key))continue;
  let display=String(value);
  if(key==="provinceId")display=findProvince(display)?.names[locale]||display;
  if(key==="intent")display=({sale:{en:"Sale",fa:"فروش",ps:"پلور"},rent:{en:"Rent",fa:"کرایه",ps:"کرایه"},
   gharawi:{en:"Gharawi",fa:"گروی",ps:"ګروۍ"}} as const)[display as "sale"]?.[locale]||display;
  if(key==="furnished"||key==="parking"||key==="water"||key==="electricity"){
   display=display==="true"?savedText(locale,"yes"):display==="false"?savedText(locale,"no"):display;
  }
  if(["minPrice","maxPrice","minArea","maxArea","bedrooms","bathrooms"].includes(key)&&/^\d+(\.\d+)?$/.test(display)){
   display=formatNumber(Number(display),locale);
  }
  if(key==="q"){result.push(display);continue;}
  result.push((names[key]||key)+": "+display);
 }
 return result;
}
