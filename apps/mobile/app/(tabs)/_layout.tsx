import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@amlaklink/design-tokens";
import {isRTL,t} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
const icons:Record<string,string>={index:"⌂",search:"⌕",saved:"♡",inbox:"✉",account:"◉"};
export default function TabLayout(){
 const {locale}=usePreferences();
 const rtl=isRTL(locale);
 const labels:Record<string,string>={index:t(locale,"explore"),search:t(locale,"search"),saved:t(locale,"saved"),inbox:t(locale,"inbox"),account:t(locale,"account")};
 const order=(rtl?["account","inbox","saved","search","index"]:["index","search","saved","inbox","account"]) as ("index"|"search"|"saved"|"inbox"|"account")[];
 return <Tabs initialRouteName="index" screenOptions={({route})=>({
    headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,
    tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border,minHeight:62,paddingTop:6},
    tabBarLabelStyle:{fontSize:10,fontWeight:"600",paddingBottom:4,textAlign:"center",writingDirection:rtl?"rtl":"ltr"},
    tabBarAccessibilityLabel:labels[route.name]||route.name,
    tabBarIcon:({color,focused})=><Text style={{fontSize:focused?26:24,color,fontWeight:"600"}}>{icons[route.name]||"•"}</Text>,
 })}>
  {order.map(name=><Tabs.Screen key={name} name={name} options={{title:labels[name]}} />)}
 </Tabs>;
}
