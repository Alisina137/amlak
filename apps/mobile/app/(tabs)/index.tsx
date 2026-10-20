import { findProvince } from "@amlaklink/catalog";
import { colors } from "@amlaklink/design-tokens";
import { isRTL, t } from "@amlaklink/localization";
import { router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useEffect, useState } from "react";
import { requestJson } from "../../src/auth";
import { ListingCard } from "../../src/listing-ui";
import type { ListingDTO } from "../../src/listing-client";
import { queryString } from "../../src/discovery-client";
import { useSearchFilters } from "../../src/search-context";
import { usePreferences } from "../../src/context";
import { ListingFeed } from "../../src/listing-ui";
import { useApiStatus } from "../../src/api";
import { Action, Label, Page, ScreenHeading, SectionCard } from "../../src/ui";
import { uiText } from "../../src/ui-copy";
import { BrowseProvinces, FeaturedPlaceholder, HomeNextSteps, RecentlyViewedSection, homeText } from "../../src/home-sections";

export default function Explore() {
 const { locale, provinceId } = usePreferences();
 const { setFilters, filters } = useSearchFilters();
 const [featured, setFeatured] = useState<ListingDTO[]>([]);
 const [featuredLoading, setFeaturedLoading] = useState(true);
 const [featuredError, setFeaturedError] = useState(false);
 const [featuredRetry, setFeaturedRetry] = useState(0);
 const openSearch = () => {
  setFilters({ provinceId });
  router.push({ pathname: "/(tabs)/search", params: { focusSearch: "1" } });
 };
 const filterText = locale === "en" ? ["Property type", "Price range", "Bedrooms", "More filters"] : locale === "fa" ? ["نوع ملکیت", "محدوده قیمت", "اتاق خواب", "فیلترهای بیشتر"] : ["د ملکیت ډول", "د بیې حد", "د خوب خونې", "نور فلټرونه"];
 const searchText = locale === "en" ? "Search properties, locations or keywords" : locale === "fa" ? "جستجوی ملکیت، موقعیت یا کلمات کلیدی" : "ملکیتونه، ځایونه یا کلیمې ولټوئ";
 const { reconnectEpoch } = useApiStatus();
 const province = findProvince(provinceId);
 const rtl = isRTL(locale);
 const locationLabel = province?.names[locale] ?? t(locale, "kabul");
 useEffect(() => {
  let active = true;
  setFeaturedLoading(true);
  setFeaturedError(false);
  setFeatured([]);
  const intent = filters.intent ?? "sale";
  requestJson<{items:ListingDTO[]}>("/v1/promotions/featured?" + queryString({provinceId,intent}))
   .then(data => { if(active) setFeatured((data.items || []).filter(item => item.status === "published" && item.available !== false && item.data.location.provinceId === provinceId && item.data.transactionType === intent).slice(0,8)); })
   .catch(() => { if(active){ setFeatured([]); setFeaturedError(true); } })
   .finally(() => { if(active) setFeaturedLoading(false); });
  return () => { active = false; };
 }, [provinceId, filters.intent, reconnectEpoch, featuredRetry]);
 const categories = (["house","apartment","land","shop","office","commercial"] as const);
 const categoryNames = {en:["House","Apartment","Land","Shop","Office","Commercial"],fa:["خانه","آپارتمان","زمین","دکان","دفتر","تجاری"],ps:["کور","اپارتمان","ځمکه","دوکان","دفتر","تجارتي"]};
 const categoryIcons = ["⌂","▥","▱","▣","▤","▦"];
 const locationAccessibility = locale === "en" ? "Change location" : locale === "fa" ? "تغییر موقعیت" : "ځای بدل کړئ";
 const notificationsLabel = locale === "en" ? "Notification settings" : locale === "fa" ? "تنظیمات اعلان‌ها" : "د خبرتیاوو تنظیمات";

 return <Page>
  <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
   <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
    <Label weight="bold" style={{ fontSize: 21, color: colors.primary }}>{t(locale, "appName")}</Label>
    <Pressable accessibilityRole="button" accessibilityLabel={locationAccessibility}
     onPress={() => router.push("/locations")}
     style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", alignSelf: rtl ? "flex-end" : "flex-start", gap: 5, minHeight: 44 }}>
     <Label style={{ fontSize: 14, color: colors.muted }}>⌖ {locationLabel} ▾</Label>
    </Pressable>
   </View>
   <Pressable accessibilityRole="button" accessibilityLabel={notificationsLabel}
    onPress={() => router.push("/notification-settings")}
    style={{ width: 44, height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }}>
    <Label style={{ fontSize: 22, textAlign: "center" }}>🔔</Label>
   </Pressable>
  </View>

  <ScreenHeading title={t(locale, "findHome")} subtitle={t(locale, "tagline")} />

  <Pressable accessibilityRole="button" accessibilityLabel={searchText}
   onPress={() => openSearch()}
   style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 10, minHeight: 52, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14 }}>
   <Label style={{ fontSize: 21, color: colors.primary }}>⌕</Label>
   <Label muted style={{ fontSize: 14, flex: 1 }}>{searchText}</Label>
  </Pressable>

  <SectionCard>
   <View style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 8 }}>
    {(["buy", "rent", "gharawi"] as const).map(intent => <View key={intent} style={{ flex: 1, minWidth: 0 }}>
     <Action label={t(locale, intent)} kind={filters.intent === (intent === "buy" ? "sale" : intent) ? "primary" : "secondary"}
      onPress={() => { setFilters({ provinceId, intent: intent === "buy" ? "sale" : intent }); router.push("/(tabs)/search"); }} />
    </View>)}
   </View>
  </SectionCard>

  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: rtl ? "row-reverse" : "row", gap: 8, alignItems: "center" }}>
   {filterText.map((label, index) => <Pressable key={index} accessibilityRole="button"
    onPress={() => {
     setFilters({ provinceId });
     router.push({ pathname: "/(tabs)/search", params: { openFilters: "1" } });
    }}
    style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: "center" }}>
    <Label style={{ fontSize: 13 }}>{label} ▾</Label>
   </Pressable>)}
  </ScrollView>

  <View style={{gap:8}}>
   <Label weight="bold" style={{fontSize:18}}>{locale==="en"?"Property categories":locale==="fa"?"دسته‌بندی ملکیت‌ها":"د ملکیتونو ډولونه"}</Label>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection:rtl?"row-reverse":"row",gap:10}}>
    {categories.map((type,index)=><Pressable key={type} accessibilityRole="button" accessibilityLabel={categoryNames[locale][index]}
     onPress={()=>{setFilters({provinceId,type});router.push("/(tabs)/search");}}
     style={{width:104,minHeight:94,alignItems:"center",justifyContent:"center",gap:6,padding:10,borderWidth:1,borderColor:colors.border,borderRadius:16,backgroundColor:colors.surface}}>
     <Label style={{fontSize:27,color:colors.primary,textAlign:"center"}}>{categoryIcons[index]}</Label>
     <Label weight="medium" style={{fontSize:12,textAlign:"center"}}>{categoryNames[locale][index]}</Label>
    </Pressable>)}
   </ScrollView>
  </View>
  <BrowseProvinces />
  <View style={{gap:8}}>
   <Label weight="bold" style={{fontSize:18}}>{locale==="en"?"Featured properties":locale==="fa"?"ملکیت‌های ویژه":"ځانګړي ملکیتونه"}</Label>
   {featuredLoading?<FeaturedPlaceholder />:null}
   {!featuredLoading&&featuredError?<SectionCard>
    <Label muted>{homeText(locale,"featuredError")}</Label>
    <Action kind="secondary" label={homeText(locale,"retry")} onPress={()=>setFeaturedRetry(value=>value+1)}/>
   </SectionCard>:null}
   {!featuredLoading&&!featuredError&&featured.length===0?<SectionCard>
    <Label muted>{homeText(locale,"featuredEmpty")}</Label>
    <Action kind="secondary" label={homeText(locale,"browseAll")} onPress={()=>router.push("/(tabs)/search")}/>
   </SectionCard>:null}
   {!featuredLoading&&!featuredError&&featured.length>0?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection:rtl?"row-reverse":"row",gap:12}}>
    {featured.map(item=><View key={item.id} style={{width:258}}>
     <Label muted style={{fontSize:12}}>{locale==="en"?"Sponsored":locale==="fa"?"تبلیغاتی":"تمویل شوی"}</Label>
     <ListingCard item={item}/>
    </View>)}
   </ScrollView>:null}
  </View>
  <RecentlyViewedSection reconnectEpoch={reconnectEpoch} />
  <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
   <Label weight="bold" style={{ fontSize: 18, flex: 1 }}>{uiText(locale, "recentProperties")}</Label>
   <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/search")}
    style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }}>
    <Label style={{ fontSize: 13, color: colors.primary }}>{t(locale, "search")} →</Label>
   </Pressable>
  </View>
  <ListingFeed provinceId={provinceId} reconnectEpoch={reconnectEpoch} />
  <HomeNextSteps />


 </Page>;
}
