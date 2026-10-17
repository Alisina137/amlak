import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@amlaklink/design-tokens";
import {t} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
const icons:Record<string,string>={index:"⌂",search:"⌕",saved:"♡",inbox:"✉",account:"◉"};
export default function TabLayout(){
 const {locale}=usePreferences();
 const labels:Record<string,string>={index:t(locale,"explore"),search:t(locale,"search"),saved:t(locale,"saved"),inbox:t(locale,"inbox"),account:t(locale,"account")};
 return <Tabs screenOptions={({route})=>({
    headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,
    tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border,minHeight:62,paddingTop:6},
    tabBarLabelStyle:{fontSize:11,fontWeight:"600",paddingBottom:5},
    tabBarIcon:({color,focused})=><Text style={{fontSize:focused?26:24,color,fontWeight:"600"}}>{icons[route.name]||"•"}</Text>,
 })}>
  {(["index","search","saved","inbox","account"] as const).map(name=><Tabs.Screen key={name} name={name} options={{title:labels[name]}} />)}
 </Tabs>;
}
