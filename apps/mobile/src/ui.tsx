import { colors, radius, spacing, typeScale } from "@amlaklink/design-tokens";
import { isRTL, t, type Locale } from "@amlaklink/localization";
import { type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePreferences } from "./context";
export function Label({children,style,muted=false,weight="regular"}:{children:ReactNode;style?:StyleProp<TextStyle>;muted?:boolean;weight?:"regular"|"medium"|"bold"}){
 const {locale}=usePreferences();
 return <Text style={[{fontSize:typeScale.body,lineHeight:26,color:muted?colors.muted:colors.text,textAlign:isRTL(locale)?"right":"left",writingDirection:isRTL(locale)?"rtl":"ltr",fontWeight:weight==="regular"?"400":weight==="bold"?"700":"600"},style]}>{children}</Text>;
}
export function Page({children}:{children:ReactNode}){
 return <SafeAreaView style={{flex:1,backgroundColor:colors.background}} edges={["top"]}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
   <View style={{width:"100%",maxWidth:720,alignSelf:"center",gap:18,paddingBottom:32}}>{children}</View>
  </ScrollView>
 </SafeAreaView>;
}
export function SectionCard({children}:{children:ReactNode}){
 return <View style={styles.card}>{children}</View>;
}
export function Action({label,onPress,kind="primary",disabled=false}:{label:string;onPress:()=>void;kind?:"primary"|"secondary";disabled?:boolean}){
 const secondary=kind==="secondary";
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[styles.action,{backgroundColor:secondary?colors.surface:colors.primary,borderColor:secondary?colors.border:colors.primary,opacity:disabled?0.45:pressed?0.82:1}]}>
   <Label weight="medium" style={{color:secondary?colors.text:colors.surface,textAlign:"center"}}>{label}</Label>
 </Pressable>;
}
export function LanguagePicker(){
 const {locale,setLocale}=usePreferences();const rtl=isRTL(locale);
 return <View style={{gap:8}}>
  <Label muted style={{fontSize:13}}>{t(locale,"languageDescription")}</Label>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
    {(["fa","ps","en"] as Locale[]).map(lang=><Pressable key={lang} onPress={()=>setLocale(lang)} accessibilityRole="button" accessibilityState={{selected:locale===lang}}
     style={{paddingHorizontal:14,paddingVertical:10,minHeight:44,justifyContent:"center",borderRadius:radius.pill,borderWidth:1,borderColor:locale===lang?colors.primary:colors.border,backgroundColor:locale===lang?"#E1F0E9":colors.surface}}>
       <Label style={{fontSize:14}}>{lang==="fa"?"دری":lang==="ps"?"پښتو":"English"}</Label>
    </Pressable>)}
  </View>
 </View>;
}
export function ScreenHeading({title,subtitle}:{title:string;subtitle?:string}){
 return <View style={{gap:6}}><Label weight="bold" style={{fontSize:typeScale.heading,lineHeight:35}}>{title}</Label>{subtitle?<Label muted>{subtitle}</Label>:null}</View>;
}
export function EmptyMessage({icon,title,body}:{icon:string;title:string;body:string}){
 return <SectionCard><View style={{alignItems:"center",gap:8,paddingVertical:16}}>
  <Text accessibilityElementsHidden style={{fontSize:34}}>{icon}</Text>
  <Label weight="bold" style={{textAlign:"center",fontSize:18}}>{title}</Label>
  <Label muted style={{textAlign:"center"}}>{body}</Label>
 </View></SectionCard>;
}
const styles=StyleSheet.create({
 container:{padding:spacing.base},
 card:{backgroundColor:colors.surface,padding:spacing.lg,borderRadius:radius.lg,borderWidth:1,borderColor:colors.border,gap:12},
 action:{borderRadius:radius.md,borderWidth:1,paddingHorizontal:18,minHeight:48,justifyContent:"center",alignItems:"center"},
});
