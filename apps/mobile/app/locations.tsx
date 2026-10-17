import { searchProvinces } from "@amlaklink/catalog";
import { colors } from "@amlaklink/design-tokens";
import { isRTL, t } from "@amlaklink/localization";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { usePreferences } from "../src/context";
import { Label, Page, ScreenHeading } from "../src/ui";
export default function Locations(){
 const {locale,provinceId,setProvinceId}=usePreferences(),[query,setQuery]=useState("");
 const results=useMemo(()=>searchProvinces(query,locale),[query,locale]),rtl=isRTL(locale);
 return <Page><View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:16}}>
  <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={()=>router.back()} style={{minWidth:44,minHeight:44,justifyContent:"center"}}><Label>←</Label></Pressable>
  <ScreenHeading title={t(locale,"chooseProvince")}/>
 </View>
 <TextInput accessibilityLabel={t(locale,"searchProvince")} value={query} onChangeText={setQuery}
  placeholder={t(locale,"searchProvince")} style={{borderRadius:14,backgroundColor:"white",borderWidth:1,borderColor:colors.border,height:52,paddingHorizontal:14,fontSize:16,textAlign:rtl?"right":"left",writingDirection:rtl?"rtl":"ltr"}} />
 {results.length?results.map(p=><Pressable key={p.id} accessibilityRole="button" accessibilityState={{selected:p.id===provinceId}}
  onPress={()=>{setProvinceId(p.id);router.back();}} style={{padding:14,minHeight:52,backgroundColor:"white",borderRadius:12,borderWidth:1,borderColor:p.id===provinceId?colors.primary:colors.border}}>
  <Label weight={p.id===provinceId?"bold":"regular"}>{p.names[locale]} {p.id===provinceId?" ✓":""}</Label></Pressable>):
  <Label muted>{t(locale,"noResults")}</Label>}
 </Page>;
}
