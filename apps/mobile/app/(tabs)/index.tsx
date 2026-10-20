import { findProvince } from "@amlaklink/catalog";
import { colors } from "@amlaklink/design-tokens";
import { isRTL, t } from "@amlaklink/localization";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { usePreferences } from "../../src/context";
import { ListingFeed } from "../../src/listing-ui";
import { useApiStatus } from "../../src/api";
import { Action, Label, Page, ScreenHeading, SectionCard } from "../../src/ui";
import { uiText } from "../../src/ui-copy";

export default function Explore() {
 const { locale, provinceId } = usePreferences();
 const { status, refresh, reconnectEpoch } = useApiStatus();
 const province = findProvince(provinceId);
 const rtl = isRTL(locale);
 const locationLabel = province?.names[locale] ?? t(locale, "kabul");
 const offline = status !== "connected";
 const locationAccessibility = locale === "en" ? "Change location" : locale === "fa" ? "تغییر موقعیت" : "ځای بدل کړئ";
 const notificationsLabel = locale === "en" ? "Notification settings" : locale === "fa" ? "تنظیمات اعلان‌ها" : "د خبرتیاوو تنظیمات";
 const connection = status === "unconfigured" ? t(locale, "networkUnconfigured") : t(locale, "networkOffline");

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
    <Label style={{ fontSize: 22, textAlign: "center" }}>♧</Label>
   </Pressable>
  </View>

  <ScreenHeading title={t(locale, "findHome")} subtitle={t(locale, "tagline")} />

  <SectionCard>
   <View style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 8 }}>
    {(["buy", "rent", "gharawi"] as const).map(intent => <View key={intent} style={{ flex: 1, minWidth: 0 }}>
     <Action label={t(locale, intent)} kind="secondary"
      onPress={() => router.push({ pathname: "/(tabs)/search", params: { intent } })} />
    </View>)}
   </View>
  </SectionCard>

  <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
   <Label weight="bold" style={{ fontSize: 18, flex: 1 }}>{uiText(locale, "recentProperties")}</Label>
   <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/search")}
    style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }}>
    <Label style={{ fontSize: 13, color: colors.primary }}>{t(locale, "search")} →</Label>
   </Pressable>
  </View>
  <ListingFeed provinceId={provinceId} reconnectEpoch={reconnectEpoch} />

  {offline ? <Pressable accessibilityRole="button" onPress={() => void refresh()}
   style={{ minHeight: 44, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
   <Label muted style={{ fontSize: 13, textAlign: "center" }}>{connection} · {t(locale, "retryConnection")}</Label>
  </Pressable> : null}
 </Page>;
}
