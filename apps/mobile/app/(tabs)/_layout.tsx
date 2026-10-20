import {Tabs} from "expo-router";
import {useEffect,useRef,useState,type ComponentProps} from "react";
import {Animated,Keyboard,Pressable,StyleSheet,Text,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {colors,elevation} from "@amlaklink/design-tokens";
import {isRTL,t} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
import {useMotion} from "../../src/motion";

type TabName="index"|"search"|"saved"|"inbox"|"account";
type TabBarProps=Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];
const tabs:TabName[]=["index","search","saved","inbox","account"];

/** Crisp, single-weight navigation symbols composed of native shapes.
 * No platform-dependent emoji font and no additional icon package.
 */
function NavigationIcon({name,color}:{name:TabName;color:string}){
 const stroke=2.1;
 return <View pointerEvents="none" style={styles.iconCanvas}>
  {name==="index"?<>
   <View style={{position:"absolute",left:6,top:4,width:16,height:16,
    borderTopWidth:stroke,borderLeftWidth:stroke,borderColor:color,borderTopLeftRadius:2,
    transform:[{rotate:"45deg"}]}}/>
   <View style={{position:"absolute",left:5,top:13,width:18,height:12,
    borderWidth:stroke,borderTopWidth:0,borderColor:color,borderBottomLeftRadius:3,borderBottomRightRadius:3}}/>
   <View style={{position:"absolute",left:12,top:18,width:5,height:7,
    borderWidth:stroke,borderBottomWidth:0,borderColor:color,borderTopLeftRadius:2,borderTopRightRadius:2}}/>
  </>:null}
  {name==="search"?<>
   <View style={{position:"absolute",left:3,top:2,width:17,height:17,
    borderWidth:stroke,borderRadius:10,borderColor:color}}/>
   <View style={{position:"absolute",left:18,top:19,width:10,height:2.2,
    borderRadius:2,backgroundColor:color,transform:[{rotate:"45deg"}]}}/>
  </>:null}
  {name==="saved"?<>
   <Text allowFontScaling={false} style={{fontSize:29,lineHeight:32,textAlign:"center",
    color,fontWeight:"400",marginTop:-4}}>{"♡"}</Text>
  </>:null}
  {name==="inbox"?<>
   <View style={{position:"absolute",left:2,top:3,width:24,height:19,
    borderWidth:stroke,borderRadius:6,borderColor:color}}/>
   <View style={{position:"absolute",left:7,top:20,width:8,height:6,
    borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,
    backgroundColor:"transparent",transform:[{skewX:"-20deg"}]}}/>
   {[0,1,2].map(i=><View key={i} style={{position:"absolute",top:11,left:8+i*6,
    width:3,height:3,borderRadius:2,backgroundColor:color}}/>)}
  </>:null}
  {name==="account"?<>
   <View style={{position:"absolute",left:9,top:3,width:11,height:11,
    borderWidth:stroke,borderRadius:6,borderColor:color}}/>
   <View style={{position:"absolute",left:3,top:17,width:23,height:10,
    borderWidth:stroke,borderBottomWidth:0,borderTopLeftRadius:12,borderTopRightRadius:12,
    borderColor:color}}/>
  </>:null}
 </View>;
}

function PremiumTabIcon({name,focused}:{name:TabName;focused:boolean}){
 const {reduced}=useMotion();
 const value=useRef(new Animated.Value(focused?1:0)).current;
 useEffect(()=>{
  if(reduced){value.stopAnimation();value.setValue(focused?1:0);return;}
  const spring=Animated.spring(value,{toValue:focused?1:0,friction:7,tension:150,
   useNativeDriver:true});
  spring.start();
  return()=>spring.stop();
 },[focused,reduced,value]);
 const scale=value.interpolate({inputRange:[0,1],outputRange:[1,1.08]});
 const translateY=value.interpolate({inputRange:[0,1],outputRange:[0,-2]});
 return <Animated.View style={[styles.iconPlate,focused&&styles.iconPlateActive,
  {transform:[{scale},{translateY}]}]}>
  <NavigationIcon name={name} color={focused?colors.surface:colors.textSecondary}/>
 </Animated.View>;
}

/** A dedicated floating dock rather than the oversized stock tab bar.
 * Navigation events, deep links and RTL route order remain React Navigation's.
 */
function PremiumTabBar({state,descriptors,navigation,rtl,labels}:TabBarProps&{
 rtl:boolean;labels:Record<TabName,string>;
}){
 const insets=useSafeAreaInsets();
 const [keyboardOpen,setKeyboardOpen]=useState(false);
 useEffect(()=>{
  const opened=Keyboard.addListener("keyboardDidShow",()=>setKeyboardOpen(true));
  const closed=Keyboard.addListener("keyboardDidHide",()=>setKeyboardOpen(false));
  return()=>{opened.remove();closed.remove();};
 },[]);
 if(keyboardOpen)return null;
 return <View style={[styles.dockArea,{paddingBottom:Math.max(insets.bottom,10)}]}>
  <View style={[styles.dock,{flexDirection:rtl?"row-reverse":"row"}]}>
   {state.routes.map((route,index)=>{
    const focused=state.index===index;
    const name=route.name as TabName;
    const options=descriptors[route.key].options;
    const label=labels[name]||route.name;
    const press=()=>{
     const event=navigation.emit({type:"tabPress",target:route.key,canPreventDefault:true});
     if(!focused&&!event.defaultPrevented)navigation.navigate(route.name,route.params);
    };
    const hold=()=>navigation.emit({type:"tabLongPress",target:route.key});
    return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={label}
     accessibilityState={{selected:focused}} accessibilityHint={options.tabBarAccessibilityLabel}
     onPress={press} onLongPress={hold}
     style={({pressed})=>[styles.tab,pressed&&styles.tabPressed]}>
     <PremiumTabIcon name={name} focused={focused}/>
     <Text allowFontScaling numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}
      style={[styles.label,focused&&styles.labelActive,{writingDirection:rtl?"rtl":"ltr"}]}>
      {label}
     </Text>
     <View style={[styles.indicator,focused&&styles.indicatorActive]}/>
    </Pressable>;
   })}
  </View>
 </View>;
}

export default function TabLayout(){
 const {locale}=usePreferences();
 const rtl=isRTL(locale);
 const labels:Record<TabName,string>={index:t(locale,"explore"),search:t(locale,"search"),
  saved:t(locale,"saved"),inbox:t(locale,"inbox"),account:t(locale,"account")};
 const order=rtl?[...tabs].reverse():tabs;
 return <Tabs initialRouteName="index"
  tabBar={props=><PremiumTabBar {...props} rtl={rtl} labels={labels}/>}
  screenOptions={({route})=>({
   headerShown:false,
   tabBarHideOnKeyboard:true,
   tabBarAccessibilityLabel:labels[route.name as TabName]||route.name,
  })}>
  {order.map(name=><Tabs.Screen key={name} name={name} options={{title:labels[name]}}/>)}
 </Tabs>;
}

const styles=StyleSheet.create({
 dockArea:{paddingTop:9,paddingHorizontal:12,backgroundColor:colors.background},
 dock:{backgroundColor:colors.surface,borderRadius:26,borderWidth:1,
  borderColor:colors.borderStrong,paddingVertical:7,paddingHorizontal:5,
  alignItems:"center",...elevation.floating},
 tab:{flex:1,minWidth:0,minHeight:68,alignItems:"center",justifyContent:"center",
  paddingHorizontal:2,paddingTop:4,paddingBottom:2,borderRadius:17,gap:3},
 tabPressed:{backgroundColor:colors.primaryWash},
 iconPlate:{width:39,height:39,borderRadius:14,alignItems:"center",justifyContent:"center",
  backgroundColor:"transparent"},
 iconPlateActive:{backgroundColor:colors.primaryDark},
 iconCanvas:{width:29,height:29,position:"relative",alignItems:"center",justifyContent:"center"},
 label:{color:colors.muted,fontSize:11.2,fontWeight:"600",lineHeight:16,
  textAlign:"center",width:"100%"},
 labelActive:{color:colors.primaryDark,fontWeight:"800"},
 indicator:{width:17,height:3,borderRadius:3,backgroundColor:"transparent",marginTop:1},
 indicatorActive:{backgroundColor:colors.secondary},
});
