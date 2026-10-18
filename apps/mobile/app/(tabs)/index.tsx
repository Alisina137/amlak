import { findProvince } from "@amlaklink/catalog";
import { colors } from "@amlaklink/design-tokens";
import { isRTL, t } from "@amlaklink/localization";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { usePreferences } from "../../src/context";
import {ListingFeed} from "../../src/listing-ui";
import { useApiStatus } from "../../src/api";
import { Action, Label, LanguagePicker, Page, ScreenHeading, SectionCard } from "../../src/ui";
import {uiText} from "../../src/ui-copy";
export default function Explore(){
 const {locale,provinceId}=usePreferences(),{status,refresh}=useApiStatus();
 const province=findProvince(provinceId);const rtl=isRTL(locale);
 const connection=status==="connected"?t(locale,"networkOnline"):status==="unconfigured"?t(locale,"networkUnconfigured"):t(locale,"networkOffline");
 return <Page>
  <View style={{flexDirection:rtl?"row-reverse":"row",justifyContent:"space-between",alignItems:"center"}}>
   <Label weight="bold" style={{fontSize:21,color:colors.primary}}>{t(locale,"appName")}</Label>
   <Label style={{fontSize:12}}>{t(locale,"country")} 🇦🇫</Label>
  </View>
  <ScreenHeading title={t(locale,"findHome")} subtitle={t(locale,"tagline")} />
  <SectionCard>
   <Label muted style={{fontSize:13}}>{t(locale,"selectedLocation")}</Label>
   <Pressable accessibilityRole="button" onPress={()=>router.push("/locations")} style={{borderWidth:1,borderColor:colors.border,borderRadius:12,padding:12,minHeight:52,justifyContent:"center"}}>
    <Label weight="bold">⌖  {province?.names[locale] ?? t(locale,"kabul")}  ▾</Label>
   </Pressable>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
    {(["buy","rent","gharawi"] as const).map(intent=><View key={intent} style={{minWidth:86,flexGrow:1}}>
      <Action label={t(locale,intent)} kind="secondary" onPress={()=>router.push({pathname:"/(tabs)/search",params:{intent}})} />
    </View>)}
   </View>
   <Action label={t(locale,"searchProvince")} onPress={()=>router.push("/locations")} />
  </SectionCard>
  <Label weight="bold" style={{fontSize:20}}>{uiText(locale,"recentProperties")}</Label>
  <ListingFeed provinceId={provinceId}/>
  <SectionCard>
   <Label weight="medium">{t(locale,"changeLanguage")}</Label><LanguagePicker/>
  </SectionCard>
  <Pressable accessibilityRole="button" onPress={()=>void refresh()} style={{padding:12,minHeight:44}}>
   <Label muted style={{fontSize:13,textAlign:"center"}}>{connection} · {t(locale,"retryConnection")}</Label>
  </Pressable>
 </Page>;
}
