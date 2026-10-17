import { findProvince, searchProvinces } from "@amlaklink/catalog";
import { colors } from "@amlaklink/design-tokens";
import { isRTL, t } from "@amlaklink/localization";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { usePreferences } from "../../src/context";
import { EmptyMessage, Label, Page, ScreenHeading, SectionCard } from "../../src/ui";
export default function Search(){
 const {locale,provinceId,setProvinceId}=usePreferences(),params=useLocalSearchParams<{intent?:string}>();
 const [query,setQuery]=useState("");const [intent,setIntent]=useState<"buy"|"rent"|"gharawi">("buy");
 useEffect(()=>{if(params.intent==="buy"||params.intent==="rent"||params.intent==="gharawi")setIntent(params.intent);},[params.intent]);
 const matches=useMemo(()=>searchProvinces(query,locale),[query,locale]);const rtl=isRTL(locale);
 return <Page>
  <ScreenHeading title={t(locale,"search")} subtitle={t(locale,"searchProvince")}/>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
    {(["buy","rent","gharawi"] as const).map(val=><Pressable key={val} onPress={()=>setIntent(val)} accessibilityRole="button" accessibilityState={{selected:intent===val}}
     style={{flex:1,backgroundColor:intent===val?colors.primary:colors.surface,borderColor:colors.border,borderWidth:1,minHeight:46,borderRadius:12,justifyContent:"center"}}>
      <Label weight="medium" style={{textAlign:"center",color:intent===val?"white":colors.text}}>{t(locale,val)}</Label>
    </Pressable>)}
  </View>
  <SectionCard>
   <Label muted>{t(locale,"chooseProvince")}</Label>
   <TextInput accessibilityLabel={t(locale,"searchProvince")} placeholder={t(locale,"searchProvince")} value={query} onChangeText={setQuery} autoCorrect={false} 
    style={{height:50,paddingHorizontal:14,borderRadius:12,borderWidth:1,borderColor:colors.border,color:colors.text,fontSize:16,textAlign:rtl?"right":"left",writingDirection:rtl?"rtl":"ltr"}} />
   <Label muted style={{fontSize:13}}>{t(locale,"selectedLocation")}: {findProvince(provinceId)?.names[locale]}</Label>
   {matches.length?matches.map(province=><Pressable key={province.id} onPress={()=>{setProvinceId(province.id);setQuery("");}}
       accessibilityRole="button" accessibilityState={{selected:province.id===provinceId}} style={{flexDirection:rtl?"row-reverse":"row",justifyContent:"space-between",alignItems:"center",minHeight:48,borderBottomWidth:1,borderBottomColor:colors.border}}>
       <Label weight={province.id===provinceId?"bold":"regular"}>{province.names[locale]}</Label>
       <Label style={{color:colors.primary}}>{province.id===provinceId?"✓":""}</Label>
    </Pressable>):<Label muted>{t(locale,"noResults")}</Label>}
  </SectionCard>
  <EmptyMessage icon="⌕" title={t(locale,"properties")} body={t(locale,"phaseNotice")}/>
 </Page>;
}
