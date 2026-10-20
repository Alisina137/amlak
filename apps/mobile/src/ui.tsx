import { colors, radius, spacing, typeScale } from "@amlaklink/design-tokens";
import { isRTL, t, type Locale } from "@amlaklink/localization";
import { type ReactNode } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePreferences } from "./context";
import { useApiStatus } from "./api";
import {foundationText} from "./foundation-copy";
import { uiText } from "./ui-copy";
import {MotionReveal,MotionSkeleton,usePressScale} from "./motion";

/** Common typography automatically mirrors with the application's selected language. */
export function Label({children,style,muted=false,weight="regular"}:{children:ReactNode;style?:StyleProp<TextStyle>;muted?:boolean;weight?:"regular"|"medium"|"bold"}){
 const {locale}=usePreferences();
 return <Text allowFontScaling style={[{fontSize:typeScale.body,lineHeight:25,color:muted?colors.muted:colors.text,
  textAlign:isRTL(locale)?"right":"left",writingDirection:isRTL(locale)?"rtl":"ltr",
  fontWeight:weight==="regular"?"400":weight==="bold"?"700":"600"},style]}>{children}</Text>;
}
export function DirectionalRow({children,style}:{children:ReactNode;style?:StyleProp<ViewStyle>}){
 const {locale}=usePreferences();
 return <View style={[{flexDirection:isRTL(locale)?"row-reverse":"row",alignItems:"center",gap:8},style]}>{children}</View>;
}
/** Phone/email, URLs, UUIDs and decimal input can opt into explicit LTR. */
export function AppInput({style,inputDirection="auto",...props}:TextInputProps&{
 inputDirection?:"auto"|"ltr"}){
 const {locale}=usePreferences(),rtl=inputDirection!=="ltr"&&isRTL(locale);
 const direction:TextStyle={writingDirection:rtl?"rtl":"ltr",textAlign:rtl?"right":"left",
  fontSize:16,color:colors.text};
 return <TextInput {...props} allowFontScaling placeholderTextColor={props.placeholderTextColor||colors.muted}
  style={[styles.input,direction,style]}/>;
}
export function BackButton({onPress}:{onPress:()=>void}){
 const {locale}=usePreferences(),motion=usePressScale();
 return <Animated.View style={[{alignSelf:isRTL(locale)?"flex-end":"flex-start"},motion.pressStyle]}><Pressable accessibilityRole="button" accessibilityLabel={uiText(locale,"back")}
  onPress={onPress} onPressIn={motion.onPressIn} onPressOut={motion.onPressOut} style={{minWidth:48,minHeight:48,
   justifyContent:"center",alignItems:"center",borderColor:colors.border,borderWidth:1,
   borderRadius:12,backgroundColor:colors.surface}}>
  <Label style={{fontSize:22,textAlign:"center"}}>{isRTL(locale)?"→":"←"}</Label>
 </Pressable></Animated.View>;
}
/** One shared connection state; this banner is informational, never blocks reading offline data. */
function ConnectionNotice(){
 const {locale}=usePreferences(),{status,refresh}=useApiStatus();
 if(status!=="offline"&&status!=="unconfigured")return null;
 return <Pressable accessibilityRole="button" accessibilityLabel={foundationText(locale,"retry")}
  disabled={status==="unconfigured"} onPress={()=>void refresh()}
  style={{backgroundColor:"#FFF7E8",borderColor:"#E9CF98",borderWidth:1,borderRadius:radius.md,
   paddingHorizontal:spacing.md,paddingVertical:spacing.sm,gap:2,minHeight:48}}>
  <Label style={{fontSize:13,lineHeight:19,color:colors.warning}}>{foundationText(locale,status)}</Label>
  {status==="offline"?<Label weight="medium" style={{fontSize:12,lineHeight:18,color:colors.primary}}>{foundationText(locale,"retry")}</Label>:null}
 </Pressable>;
}
export function Page({children}:{children:ReactNode}){
 return <SafeAreaView style={{flex:1,backgroundColor:colors.background}} edges={["top"]}>
  <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
   contentContainerStyle={styles.container}>
   <MotionReveal style={styles.pageContent}><ConnectionNotice/>{children}</MotionReveal>
  </ScrollView>
 </SafeAreaView>;
}
export function SectionCard({children,style}:{children:ReactNode;style?:StyleProp<ViewStyle>}){
 return <View style={[styles.card,style]}>{children}</View>;
}
export function Action({label,onPress,kind="primary",disabled=false}:{label:string;onPress:()=>void;kind?:"primary"|"secondary";disabled?:boolean}){
 const secondary=kind==="secondary",motion=usePressScale();
 return <Animated.View style={motion.pressStyle}><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} onPressIn={motion.onPressIn} onPressOut={motion.onPressOut}
  style={({pressed})=>[styles.action,{backgroundColor:secondary?colors.surface:colors.primary,
   borderColor:secondary?colors.border:colors.primary,opacity:disabled?0.45:pressed?0.82:1}]}>
  <Label weight="medium" style={{color:secondary?colors.text:colors.surface,textAlign:"center",fontSize:14,lineHeight:21}}>{label}</Label>
 </Pressable></Animated.View>;
}
export function FilterChip({label,selected=false,onPress}:{label:string;selected?:boolean;onPress:()=>void}){
 const motion=usePressScale();
 return <Animated.View style={motion.pressStyle}><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress} onPressIn={motion.onPressIn} onPressOut={motion.onPressOut}
  style={{minHeight:44,paddingHorizontal:14,justifyContent:"center",borderRadius:radius.pill,
   borderWidth:1,borderColor:selected?colors.primary:colors.border,
   backgroundColor:selected?"#E1F0E9":colors.surface}}>
  <Label weight={selected?"medium":"regular"} style={{fontSize:13,lineHeight:19,color:selected?colors.primary:colors.text}}>{label}</Label>
 </Pressable></Animated.View>;
}
export function StatusBadge({label,tone="neutral"}:{label:string;tone?:"neutral"|"success"|"warning"|"error"}){
 const color=tone==="success"?colors.success:tone==="warning"?colors.warning:tone==="error"?colors.error:colors.primary;
 return <View style={{alignSelf:"flex-start",borderRadius:radius.pill,borderWidth:1,borderColor:color+"35",
  backgroundColor:color+"13",paddingHorizontal:10,paddingVertical:4}}>
  <Label weight="medium" style={{fontSize:12,lineHeight:18,color}}>{label}</Label>
 </View>;
}
export function SectionHeader({title,actionLabel,onAction}:{title:string;actionLabel?:string;onAction?:()=>void}){
 return <DirectionalRow style={{justifyContent:"space-between"}}>
  <Label weight="bold" style={{fontSize:18,lineHeight:26,flex:1}}>{title}</Label>
  {actionLabel&&onAction?<Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction}
    style={{minHeight:44,paddingHorizontal:8,justifyContent:"center"}}>
   <Label style={{fontSize:13,color:colors.primary}}>{actionLabel}</Label>
  </Pressable>:null}
 </DirectionalRow>;
}
/** Static skeletons are lightweight on low-powered Android devices. */
export function LoadingCard({rows=2,withImage=false,label}:{rows?:number;withImage?:boolean;label?:string}){
 const {locale}=usePreferences();
 return <SectionCard><MotionSkeleton><View accessibilityRole="progressbar" accessibilityLabel={label||foundationText(locale,"loading")}
  style={{gap:10}}>
  {withImage?<View style={{height:155,backgroundColor:colors.border,borderRadius:radius.md}}/>:null}
  {Array.from({length:Math.max(1,Math.min(rows,5))},(_,i)=><View key={i}
   style={{height:i===0?18:13,width:i%2?"78%":"95%",backgroundColor:colors.border,borderRadius:radius.sm}}/>)}
 </View></MotionSkeleton></SectionCard>;
}
export function StateNotice({message,tone="error",retryLabel,onRetry}:{message:string;tone?:"error"|"warning"|"info";
 retryLabel?:string;onRetry?:()=>void}){
 const color=tone==="error"?colors.error:tone==="warning"?colors.warning:colors.info;
 return <SectionCard><Label style={{color,fontSize:14,lineHeight:22}}>{message}</Label>
  {retryLabel&&onRetry?<Action kind="secondary" label={retryLabel} onPress={onRetry}/>:null}
 </SectionCard>;
}
export function LanguagePicker(){
 const {locale,setLocale}=usePreferences();const rtl=isRTL(locale);
 return <View style={{gap:8}}>
  <Label muted style={{fontSize:13}}>{t(locale,"languageDescription")}</Label>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
   {(["fa","ps","en"] as Locale[]).map(lang=><Pressable key={lang} onPress={()=>setLocale(lang)} accessibilityRole="button" accessibilityState={{selected:locale===lang}}
    style={{paddingHorizontal:14,paddingVertical:10,minHeight:44,justifyContent:"center",borderRadius:radius.pill,
     borderWidth:1,borderColor:locale===lang?colors.primary:colors.border,
     backgroundColor:locale===lang?"#E1F0E9":colors.surface}}>
    <Label style={{fontSize:14}}>{lang==="fa"?"دری":lang==="ps"?"پښتو":"English"}</Label>
   </Pressable>)}
  </View>
 </View>;
}
export function ScreenHeading({title,subtitle}:{title:string;subtitle?:string}){
 return <View style={{gap:5,minWidth:0}}>
  <Label weight="bold" style={{fontSize:23,lineHeight:33}}>{title}</Label>
  {subtitle?<Label muted style={{fontSize:14,lineHeight:22}}>{subtitle}</Label>:null}
 </View>;
}
export function EmptyMessage({icon,title,body}:{icon:string;title:string;body:string}){
 return <SectionCard><View style={{alignItems:"center",gap:8,paddingVertical:16}}>
  <Text accessibilityElementsHidden style={{fontSize:34}}>{icon}</Text>
  <Label weight="bold" style={{textAlign:"center",fontSize:18}}>{title}</Label>
  <Label muted style={{textAlign:"center"}}>{body}</Label>
 </View></SectionCard>;
}
const styles=StyleSheet.create({
 container:{padding:spacing.base,paddingHorizontal:Math.min(spacing.base,16)},
 pageContent:{width:"100%",maxWidth:720,alignSelf:"center",gap:16,paddingBottom:40},
 card:{backgroundColor:colors.surface,padding:spacing.base,borderRadius:radius.lg,
  borderWidth:1,borderColor:colors.border,gap:12},
 action:{borderRadius:radius.md,borderWidth:1,paddingHorizontal:16,minHeight:48,
  justifyContent:"center",alignItems:"center"},
 input:{minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,
  paddingHorizontal:12,paddingVertical:10,backgroundColor:colors.surface}
});
