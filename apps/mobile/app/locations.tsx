import { searchProvinces } from "@amlaklink/catalog";
import { colors } from "@amlaklink/design-tokens";
import { t } from "@amlaklink/localization";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { usePreferences } from "../src/context";
import { AppInput, BackButton, DirectionalRow, Label, Page, ScreenHeading } from "../src/ui";
export default function Locations(){
 const {locale,provinceId,setProvinceId}=usePreferences(),[query,setQuery]=useState("");
 const results=useMemo(()=>searchProvinces(query,locale),[query,locale]);
 return <Page><DirectionalRow style={{gap:16}}>
  <BackButton onPress={()=>router.back()}/>
  <View style={{flex:1}}><ScreenHeading title={t(locale,"chooseProvince")}/></View>
 </DirectionalRow>
 <AppInput accessibilityLabel={t(locale,"searchProvince")} value={query} onChangeText={setQuery}
  placeholder={t(locale,"searchProvince")} style={{height:52}} />
 {results.length?results.map(p=><Pressable key={p.id} accessibilityRole="button" accessibilityState={{selected:p.id===provinceId}}
  onPress={()=>{setProvinceId(p.id);router.back();}} style={{padding:14,minHeight:52,backgroundColor:"white",borderRadius:12,borderWidth:1,borderColor:p.id===provinceId?colors.primary:colors.border}}>
  <Label weight={p.id===provinceId?"bold":"regular"}>{p.names[locale]} {p.id===provinceId?" ✓":""}</Label></Pressable>):
  <Label muted>{t(locale,"noResults")}</Label>}
 </Page>;
}
