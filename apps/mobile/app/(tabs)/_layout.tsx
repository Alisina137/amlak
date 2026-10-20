import { Tabs } from "expo-router";
import { Animated,Text,type ColorValue } from "react-native";
import {useEffect,useRef} from "react";
import { colors, elevation } from "@amlaklink/design-tokens";
import {isRTL,t} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
import {useMotion} from "../../src/motion";
const icons:Record<string,[string,string]>={
 index:["⌂","⌂"],search:["⌕","⌕"],saved:["♡","♥"],inbox:["✉","✉"],account:["☰","☰"]
};
function AnimatedTabIcon({name,color,focused}:{name:string;color:ColorValue;focused:boolean}){
 const {reduced}=useMotion();
 const progress=useRef(new Animated.Value(focused?1:0)).current;
 useEffect(()=>{
  if(reduced){progress.stopAnimation();progress.setValue(focused?1:0);return;}
  const anim=Animated.spring(progress,{toValue:focused?1:0,friction:7,tension:150,useNativeDriver:true});
  anim.start();return()=>anim.stop();
 },[focused,progress,reduced]);
 const scale=progress.interpolate({inputRange:[0,1],outputRange:[1,1.12]});
 return <Animated.View style={{transform:[{scale}],minWidth:53,minHeight:35,paddingHorizontal:13,
  backgroundColor:focused?"#E1F0E9":"transparent",borderRadius:17,justifyContent:"center",alignItems:"center"}}>
  <Text accessibilityElementsHidden style={{fontSize:24,lineHeight:30,color,fontWeight:focused?"800":"500",textAlign:"center"}}>
   {(icons[name]||["•","•"])[focused?1:0]}
  </Text>
 </Animated.View>;
}
export default function TabLayout(){
 const {locale}=usePreferences();
 const rtl=isRTL(locale);
 const labels:Record<string,string>={index:t(locale,"explore"),search:t(locale,"search"),saved:t(locale,"saved"),inbox:t(locale,"inbox"),account:t(locale,"account")};
 const order=(rtl?["account","inbox","saved","search","index"]:["index","search","saved","inbox","account"]) as ("index"|"search"|"saved"|"inbox"|"account")[];
 return <Tabs initialRouteName="index" screenOptions={({route})=>({
    headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,
    tabBarStyle:{backgroundColor:colors.surface,borderTopWidth:1,borderTopColor:colors.border,
     minHeight:72,paddingTop:7,...elevation.floating},
    tabBarItemStyle:{minHeight:59,paddingHorizontal:2},
    tabBarLabelStyle:{fontSize:11.5,fontWeight:"700",paddingBottom:5,textAlign:"center",writingDirection:rtl?"rtl":"ltr"},
    tabBarAccessibilityLabel:labels[route.name]||route.name,
    tabBarIcon:({color,focused})=><AnimatedTabIcon name={route.name} color={color} focused={focused}/>,
 })}>
  {order.map(name=><Tabs.Screen key={name} name={name} options={{title:labels[name]}} />)}
 </Tabs>;
}
