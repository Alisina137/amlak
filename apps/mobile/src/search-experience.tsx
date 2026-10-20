import {isRTL,type Locale} from "@amlaklink/localization";
import {colors} from "@amlaklink/design-tokens";
import {ScrollView,View} from "react-native";
import type {SearchFilters} from "./discovery-client";
import {activeFilterKeys,filterLabel,sortRequiresCurrency} from "./search-filter-utils";
import {dt} from "./discovery-copy";
import {FilterChip,Label} from "./ui";

/** Compact removable filter summary. One chip always removes one actual filter. */
export function ActiveFilterRow({locale,filters,remove,clear}:{locale:Locale;filters:SearchFilters;
 remove:(key:keyof SearchFilters)=>void;clear:()=>void}){
 const keys=activeFilterKeys(filters);
 if(!keys.length)return null;
 const clearName=dt(locale,"clear");
 return <View style={{gap:5}}>
  <View style={{flexDirection:isRTL(locale)?"row-reverse":"row",justifyContent:"space-between",alignItems:"center"}}>
   <Label muted style={{fontSize:12}}>{keys.length} {dt(locale,"filter")}</Label>
   <FilterChip label={clearName} onPress={clear}/>
  </View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
   contentContainerStyle={{flexDirection:isRTL(locale)?"row-reverse":"row",alignItems:"center",gap:8}}>
   {keys.map(key=><FilterChip key={key} label={filterLabel(locale,key,String(filters[key]))+" ×"}
    onPress={()=>remove(key)}/>)}
  </ScrollView>
 </View>;
}
const SORTS=["newest","recent_confirmed","price_asc","price_desc"] as const;
export function SortResultsRow({locale,filters,change}:{locale:Locale;filters:SearchFilters;change:(patch:SearchFilters)=>void}){
 return <View style={{gap:4}}>
  <Label muted style={{fontSize:12}}>{dt(locale,"sort")}</Label>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}
   contentContainerStyle={{flexDirection:isRTL(locale)?"row-reverse":"row",gap:8}}>
   {SORTS.map(sort=><FilterChip key={sort} selected={(filters.sort||"newest")===sort}
    label={sort==="newest"?dt(locale,"newest"):sort==="recent_confirmed"?dt(locale,"recent"):
     sort==="price_asc"?dt(locale,"low"):dt(locale,"high")}
    onPress={()=>change(sortRequiresCurrency(sort)?{sort,currency:filters.currency||"AFN"}:{sort})}/>)}
  </ScrollView>
  {sortRequiresCurrency(filters.sort)?<Label muted style={{fontSize:12,color:colors.warning}}>
    {dt(locale,"currency")}: {filters.currency||"AFN"}
   </Label>:null}
 </View>;
}
