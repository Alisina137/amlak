import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import {AccessibilityInfo,Animated,Easing,Image,type ImageSourcePropType,type ImageStyle,type StyleProp,type ViewStyle} from "react-native";

/** One listener for the whole app; native animations must never override system reduced motion. */
type MotionPreference={reduced:boolean;ready:boolean};
const MotionContext=createContext<MotionPreference>({reduced:true,ready:false});
export function MotionProvider({children}:{children:ReactNode}){
 const [preference,setPreference]=useState<MotionPreference>({reduced:true,ready:false});
 useEffect(()=>{
  let mounted=true;
  void AccessibilityInfo.isReduceMotionEnabled().then(value=>{
   if(mounted)setPreference({reduced:value,ready:true});
  }).catch(()=>{if(mounted)setPreference({reduced:true,ready:true});});
  const sub=AccessibilityInfo.addEventListener("reduceMotionChanged",value=>{
   if(mounted)setPreference({reduced:value,ready:true});
  });
  return()=>{mounted=false;sub.remove();};
 },[]);
 return <MotionContext.Provider value={preference}>{children}</MotionContext.Provider>;
}
export function useMotion(){return useContext(MotionContext);}

/** Mount-only native-driver reveal. Always cancels work on unmount or when preferences change. */
export function MotionReveal({children,delay=0,style}:{children:ReactNode;delay?:number;style?:StyleProp<ViewStyle>}){
 const {reduced,ready}=useMotion();
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  if(!ready)return;
  if(reduced){progress.stopAnimation();progress.setValue(1);return;}
  const animation=Animated.timing(progress,{toValue:1,duration:230,delay:Math.min(240,Math.max(0,delay)),
   easing:Easing.out(Easing.cubic),useNativeDriver:true});
  animation.start();
  return()=>animation.stop();
 },[progress,ready,reduced,delay]);
 return <Animated.View style={[style,{opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[10,0]})}]}]}>
  {children}
 </Animated.View>;
}

/** Subtle press feedback. No gesture handler dependency, no layout-affecting animation. */
export function usePressScale(){
 const {reduced}=useMotion();
 const scale=useRef(new Animated.Value(1)).current;
 useEffect(()=>{
  if(reduced){scale.stopAnimation();scale.setValue(1);}
  return()=>{scale.stopAnimation();};
 },[scale,reduced]);
 const animate=(toValue:number)=>{
  if(reduced)return;
  Animated.timing(scale,{toValue,duration:toValue===1?155:95,easing:Easing.out(Easing.quad),
   useNativeDriver:true}).start();
 };
 return {pressStyle:{transform:[{scale}]},onPressIn:()=>animate(0.974),onPressOut:()=>animate(1)};
}

/** Pulsing skeleton with no continuously running JS interval. */
export function MotionSkeleton({children}:{children:ReactNode}){
 const {reduced,ready}=useMotion();
 const opacity=useRef(new Animated.Value(1)).current;
 useEffect(()=>{
  if(!ready||reduced){opacity.stopAnimation();opacity.setValue(1);return;}
  const animation=Animated.loop(Animated.sequence([
   Animated.timing(opacity,{toValue:0.52,duration:720,useNativeDriver:true}),
   Animated.timing(opacity,{toValue:1,duration:720,useNativeDriver:true})
  ]));
  animation.start();
  return()=>{animation.stop();opacity.setValue(1);};
 },[opacity,ready,reduced]);
 return <Animated.View style={{opacity}}>{children}</Animated.View>;
}

/** Fade in when image data actually arrives, including cached network images. */
export function MotionImage({imageKey,source,style,resizeMode="cover",accessibilityLabel,onError}:{
 imageKey:string;source:ImageSourcePropType;style?:StyleProp<ImageStyle>;resizeMode?:"cover"|"contain";
 accessibilityLabel?:string;onError?:()=>void;
}){
 const {reduced}=useMotion();
 const opacity=useRef(new Animated.Value(reduced?1:0)).current;
 useEffect(()=>{opacity.stopAnimation();opacity.setValue(reduced?1:0);},[imageKey,opacity,reduced]);
 return <Animated.Image key={imageKey} source={source} style={[style,{opacity}]} resizeMode={resizeMode}
  accessibilityLabel={accessibilityLabel} onError={()=>{opacity.setValue(1);onError?.();}}
  onLoad={()=>{
   if(reduced){opacity.setValue(1);return;}
   Animated.timing(opacity,{toValue:1,duration:240,useNativeDriver:true,easing:Easing.out(Easing.cubic)}).start();
  }}/>;
}

/** Bounces only after an actual favorite state change, not for initial hydration. */
export function FavoriteGlyph({saved}:{saved:boolean}){
 const {reduced}=useMotion(),scale=useRef(new Animated.Value(1)).current;
 const previous=useRef(saved);
 useEffect(()=>{
  if(previous.current===saved)return;
  previous.current=saved;
  if(reduced){scale.setValue(1);return;}
  scale.stopAnimation();scale.setValue(saved?0.68:0.88);
  Animated.spring(scale,{toValue:1,friction:4,tension:190,useNativeDriver:true}).start();
 },[saved,reduced,scale]);
 useEffect(()=>()=>scale.stopAnimation(),[scale]);
 return <Animated.Text accessibilityElementsHidden style={{fontSize:23,color:"#135448",textAlign:"center",transform:[{scale}]}}>
  {saved?"♥":"♡"}
 </Animated.Text>;
}
