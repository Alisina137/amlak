import { Tabs } from "expo-router";
import { Text,View } from "react-native";
import { colors } from "@amlaklink/design-tokens";
import {isRTL,t} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
const icons:Record<string,[string,string]>={
 index:["⌂","⌂"],search:["⌕","⌕"],saved:["♡","♥"],inbox:["✉","✉"],account:["☰","☰"]
};
export default function TabLayout(){
 const {locale}=usePreferences();
 const rtl=isRTL(locale);
 const labels:Record<string,string>={index:t(locale,"explore"),search:t(locale,"search"),saved:t(locale,"saved"),inbox:t(locale,"inbox"),account:t(locale,"account")};
 const order=(rtl?["account","inbox","saved","search","index"]:["index","search","saved","inbox","account"]) as ("index"|"search"|"saved"|"inbox"|"account")[];
 return <Tabs initialRouteName="index" screenOptions={({route})=>({
    headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,
    tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border,minHeight:64,paddingTop:5},
    tabBarItemStyle:{minHeight:54},
    tabBarLabelStyle:{fontSize:11,fontWeight:"600",paddingBottom:4,textAlign:"center",writingDirection:rtl?"rtl":"ltr"},
    tabBarAccessibilityLabel:labels[route.name]||route.name,
    tabBarIcon:({color,focused})=><View style={{minWidth:48,minHeight:31,paddingHorizontal:12,
     backgroundColor:focused?"#E1F0E9":"transparent",borderRadius:18,justifyContent:"center",alignItems:"center"}}>
     <Text accessibilityElementsHidden style={{fontSize:23,lineHeight:29,color,fontWeight:"600",textAlign:"center"}}>
      {(icons[route.name]||["•","•"])[focused?1:0]}
     </Text>
    </View>,
 })}>
  {order.map(name=><Tabs.Screen key={name} name={name} options={{title:labels[name]}} />)}
 </Tabs>;
}
