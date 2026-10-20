import {findProvince} from "@amlaklink/catalog";
import {colors} from "@amlaklink/design-tokens";
import {isRTL,type Locale} from "@amlaklink/localization";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {Pressable,ScrollView,View} from "react-native";
import {useAuth} from "./auth";
import {usePreferences} from "./context";
import {useSearchFilters} from "./search-context";
import {getPublic,type ListingDTO} from "./listing-client";
import {ListingCard} from "./listing-ui";
import {getRecentlyViewedIds} from "./recently-viewed";
import {Label,SectionCard} from "./ui";
import {MotionSkeleton} from "./motion";

const copy = {
 en:{
  browseProvinces:"Explore by province",recentlyViewed:"Recently viewed",
  featuredEmpty:"No sponsored properties in this area right now.",
  featuredError:"Could not load sponsored properties. You can still search all listings.",
  loadingFeatured:"Loading featured properties",retry:"Try again",browseAll:"Browse properties",
  nextTitle:"Make your next move",savedSearches:"Saved searches & alerts",
  savedHint:"Revisit filters and choose alerts for new matches.",
  postProperty:"List a property",postHint:"Create a draft and publish after review.",
  safety:"Listings may change. Verify availability and details before making payments."
 },
 fa:{
  browseProvinces:"جستجو بر اساس ولایت",recentlyViewed:"ملکیت‌های اخیراً دیده‌شده",
  featuredEmpty:"فعلاً ملکیت تبلیغاتی در این منطقه نیست.",
  featuredError:"بارگیری ملکیت‌های تبلیغاتی ممکن نشد. هنوز می‌توانید همهٔ ملکیت‌ها را جستجو کنید.",
  loadingFeatured:"بارگیری ملکیت‌های ویژه",retry:"تلاش دوباره",browseAll:"دیدن ملکیت‌ها",
  nextTitle:"گام بعدی شما",savedSearches:"جستجوهای ذخیره‌شده و اعلان‌ها",
  savedHint:"فیلترها را دوباره ببینید و اعلان ملک جدید را فعال کنید.",
  postProperty:"ثبت ملکیت",postHint:"پیش‌نویس بسازید؛ نشر پس از بررسی انجام می‌شود.",
  safety:"وضعیت ملکیت‌ها تغییر می‌کند. پیش از پرداخت، موجودیت و جزئیات را بررسی کنید."
 },
 ps:{
  browseProvinces:"د ولایت له مخې پلټنه",recentlyViewed:"وروستي کتل شوي ملکیتونه",
  featuredEmpty:"اوس په دې سیمه کې تمویل شوي ملکیتونه نشته.",
  featuredError:"تمویل شوي ملکیتونه پورته نه شول. تاسو لا هم ټول ملکیتونه لټولی شئ.",
  loadingFeatured:"ځانګړي ملکیتونه پورته کېږي",retry:"بیا هڅه",browseAll:"ملکیتونه وګورئ",
  nextTitle:"راتلونکی ګام",savedSearches:"خوندي پلټنې او خبرتیاوې",
  savedHint:"فلټرونه بیا وګورئ او د نوو پایلو خبرتیاوې وټاکئ.",
  postProperty:"ملکیت ثبت کړئ",postHint:"مسوده جوړه کړئ؛ اعلان له ارزونې وروسته خپرېږي.",
  safety:"د ملکیت حالت بدلېدای شي. له پیسو ورکولو مخکې شتون او معلومات تایید کړئ."
 }
} satisfies Record<Locale,Record<string,string>>;
export type HomeTextKey = keyof typeof copy.en;
export function homeText(locale:Locale,key:HomeTextKey){return copy[locale][key];}

const highlightedProvinces = ["kabul","herat","balkh","nangarhar","kandahar","ghazni"] as const;
export function BrowseProvinces(){
 const {locale}=usePreferences(),rtl=isRTL(locale);
 const {setFilters}=useSearchFilters();
 return <View style={{gap:8}}>
  <Label weight="bold" style={{fontSize:18}}>{homeText(locale,"browseProvinces")}</Label>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
   {highlightedProvinces.map(id=>{
    const province=findProvince(id);
    if(!province)return null;
    return <Pressable key={id} accessibilityRole="button" accessibilityLabel={province.names[locale]}
     onPress={()=>{
      setFilters({provinceId:id,q:undefined,city:undefined,district:undefined,neighborhood:undefined,viewport:undefined,polygon:undefined});
      router.push("/(tabs)/search");
     }}
     style={{minHeight:48,paddingHorizontal:16,borderRadius:14,borderColor:colors.border,borderWidth:1,backgroundColor:colors.surface,alignItems:"center",justifyContent:"center"}}>
     <Label style={{fontSize:13}}>⌖ {province.names[locale]}</Label>
    </Pressable>;
   })}
  </ScrollView>
 </View>;
}

export function FeaturedPlaceholder(){
 const {locale}=usePreferences(),rtl=isRTL(locale);
 return <MotionSkeleton><View accessibilityLabel={homeText(locale,"loadingFeatured")} style={{flexDirection:rtl?"row-reverse":"row",gap:12}}>
  {[0,1].map(index=><View key={index} style={{width:150,gap:8,paddingBottom:8}}>
   <View style={{height:128,borderRadius:14,backgroundColor:colors.border}}/>
   <View style={{width:"70%",height:16,borderRadius:6,backgroundColor:colors.border}}/>
   <View style={{width:"95%",height:12,borderRadius:6,backgroundColor:colors.border}}/>
  </View>)}
 </View></MotionSkeleton>;
}

export function RecentlyViewedSection({reconnectEpoch=0}:{reconnectEpoch?:number}){
 const {locale}=usePreferences(),rtl=isRTL(locale);
 const [items,setItems]=useState<ListingDTO[]>([]);
 const [loading,setLoading]=useState(false);
 const [hasHistory,setHasHistory]=useState(false);
 useFocusEffect(useCallback(()=>{
  let active=true;
  void (async()=>{
   const ids=await getRecentlyViewedIds();
   if(!active)return;
   setHasHistory(ids.length>0);
   setItems([]);
   if(!ids.length){setLoading(false);return;}
   setLoading(true);
   try {
    const results=await Promise.allSettled(ids.map(id=>getPublic(id)));
    if(active)setItems(results.flatMap(result=>
     result.status==="fulfilled"&&result.value.status==="published"&&result.value.available!==false?[result.value]:[]
    ));
   } finally {if(active)setLoading(false);}
  })();
  return ()=>{active=false;};
 },[reconnectEpoch]));
 if(!hasHistory||(!loading&&items.length===0))return null;
 return <View style={{gap:8}}>
  <Label weight="bold" style={{fontSize:18}}>{homeText(locale,"recentlyViewed")}</Label>
  {loading?<FeaturedPlaceholder/>:
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection:rtl?"row-reverse":"row",gap:12}}>
    {items.map(item=><View key={item.id} style={{width:258}}><ListingCard item={item}/></View>)}
   </ScrollView>}
 </View>;
}

export function HomeNextSteps(){
 const {locale}=usePreferences(),rtl=isRTL(locale),{token}=useAuth();
 const tasks=[
  {key:"savedSearches" as const,hint:"savedHint" as const,icon:"⌕",
   go:()=>router.push("/saved-searches")},
  {key:"postProperty" as const,hint:"postHint" as const,icon:"+",
   go:()=>router.push(token?"/listings/new":{pathname:"/auth/[action]",params:{action:"login"}})}
 ];
 return <View style={{gap:10}}>
  <Label weight="bold" style={{fontSize:18}}>{homeText(locale,"nextTitle")}</Label>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:10}}>
   {tasks.map(task=><Pressable key={task.key} accessibilityRole="button" accessibilityLabel={homeText(locale,task.key)}
    onPress={task.go} style={{flex:1,minWidth:0,borderWidth:1,borderColor:colors.border,borderRadius:16,backgroundColor:colors.surface,padding:14,gap:7}}>
    <Label weight="bold" style={{fontSize:22,color:colors.primary}}>{task.icon}</Label>
    <Label weight="bold" style={{fontSize:14,lineHeight:21}}>{homeText(locale,task.key)}</Label>
    <Label muted style={{fontSize:12,lineHeight:18}}>{homeText(locale,task.hint)}</Label>
   </Pressable>)}
  </View>
  <SectionCard><Label muted style={{fontSize:12,lineHeight:19}}>{homeText(locale,"safety")}</Label></SectionCard>
 </View>;
}
