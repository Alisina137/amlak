import {useEffect,useMemo,useRef,useState} from "react";
import {Modal,Pressable,ScrollView,View,useWindowDimensions} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {usePreferences} from "./context";
import {photoSource,type ListingDTO} from "./listing-client";
import {Label,SectionCard} from "./ui";
import {mediaCopy,photoRoomTypes,roomName,type PhotoRoom} from "./media-copy";
import {MotionImage,MotionReveal} from "./motion";

type Photo=ListingDTO["photos"][number];
type Filter="all"|PhotoRoom;

/** A failing remote image must never leave an empty black frame. Retry is local to this frame. */
function GalleryImage({photo,title,mode="cover"}:{photo:Photo;title:string;mode?:"cover"|"contain"}){
 const {locale}=usePreferences(),[failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[photo.id]);
 if(failed)return <Pressable accessibilityRole="button" accessibilityLabel={mediaCopy[locale].imageUnavailable}
  onPress={event=>{event.stopPropagation();setFailed(false);}}
  style={{flex:1,justifyContent:"center",alignItems:"center",padding:16,backgroundColor:"#263531"}}>
  <Label style={{color:"#FFFFFF",textAlign:"center",fontSize:14}}>{mediaCopy[locale].imageUnavailable}</Label>
 </Pressable>;
 return <MotionImage imageKey={photo.id} source={photoSource(photo.id)} onError={()=>setFailed(true)}
  resizeMode={mode} accessibilityLabel={title+" · "+roomName(locale,photo.room)}
  style={{width:"100%",height:"100%"}}/>;
}

export function PropertyGallery({photos,title}:{photos:Photo[];title:string}){
 const {locale}=usePreferences(),copy=mediaCopy[locale],rtl=isRTL(locale);
 const {width,height}=useWindowDimensions();
 const [filter,setFilter]=useState<Filter>("all"),[activeId,setActiveId]=useState<string|null>(null),
  [fullScreen,setFullScreen]=useState(false);
 const fullRef=useRef<ScrollView|null>(null);
 const photoKey=photos.map(photo=>photo.id).join("|");
 useEffect(()=>{setFilter("all");setActiveId(photos[0]?.id||null);setFullScreen(false);},[photoKey]);
 const roomFilters=useMemo(()=>photoRoomTypes.filter(room=>photos.some(p=>p.room===room)),[photos]);
 const matching=useMemo(()=>filter==="all"?photos:photos.filter(p=>p.room===filter),[photos,filter]);
 const index=Math.max(0,matching.findIndex(photo=>photo.id===activeId));
 const current=matching[index];
 const panelWidth=Math.max(1,Math.min(width-32,720));
 const photoCount=formatNumber(photos.length,locale);
 useEffect(()=>{
  if(!matching.length){if(activeId!==null)setActiveId(null);return;}
  if(!matching.some(p=>p.id===activeId))setActiveId(matching[0].id);
 },[matching,activeId]);
 const choose=(position:number)=>{
  const selected=matching[position];
  if(!selected)return;
  setActiveId(selected.id);
  if(fullScreen)fullRef.current?.scrollTo({x:position*width,animated:true});
 };
 const chooseFilter=(value:Filter)=>{
  setFilter(value);
  setActiveId((value==="all"?photos[0]:photos.find(p=>p.room===value))?.id||null);
 };
 // Maintain the correct photo after device rotation and when opening the lightbox.
 useEffect(()=>{
  if(!fullScreen||!current)return;
  const frame=requestAnimationFrame(()=>fullRef.current?.scrollTo({x:index*width,animated:false}));
  return()=>cancelAnimationFrame(frame);
 },[fullScreen,index,width,current?.id]);
 const renderControls=(dark=false)=><View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",justifyContent:"space-between",gap:12}}>
  <Pressable accessibilityRole="button" accessibilityLabel={copy.previous}
   accessibilityState={{disabled:index===0}} disabled={index===0} onPress={()=>choose(index-1)}
   style={{minHeight:44,minWidth:44,paddingHorizontal:12,borderRadius:12,borderWidth:1,
    borderColor:dark?"#43564F":colors.border,opacity:index===0?0.35:1,justifyContent:"center",alignItems:"center"}}>
   <Label style={{color:dark?"#FFFFFF":colors.text,fontSize:18,textAlign:"center"}}>{rtl?"→":"←"}</Label>
  </Pressable>
  <Label muted={!dark} style={{fontSize:13,color:dark?"#FFFFFF":colors.text}}>
   {formatNumber(index+1,locale)} / {formatNumber(matching.length,locale)}
  </Label>
  <Pressable accessibilityRole="button" accessibilityLabel={copy.next}
   accessibilityState={{disabled:index>=matching.length-1}} disabled={index>=matching.length-1}
   onPress={()=>choose(index+1)}
   style={{minHeight:44,minWidth:44,paddingHorizontal:12,borderRadius:12,borderWidth:1,
    borderColor:dark?"#43564F":colors.border,opacity:index>=matching.length-1?0.35:1,justifyContent:"center",alignItems:"center"}}>
   <Label style={{color:dark?"#FFFFFF":colors.text,fontSize:18,textAlign:"center"}}>{rtl?"←":"→"}</Label>
  </Pressable>
 </View>;
 return <View style={{gap:12}}>
  <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",justifyContent:"space-between"}}>
   <Label weight="bold" style={{fontSize:18}}>{copy.photos}</Label>
   <Label muted style={{fontSize:12}}>{photoCount} {copy.count}</Label>
  </View>
  {photos.length===0?<SectionCard><Label muted>{copy.noPhotos}</Label></SectionCard>:<>
   {roomFilters.length>0?<ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
    contentContainerStyle={{flexDirection:rtl?"row-reverse":"row",gap:8,paddingVertical:3}}>
    {(["all",...roomFilters] as Filter[]).map(room=><Pressable key={room}
     accessibilityRole="button" accessibilityLabel={roomName(locale,room)} accessibilityState={{selected:filter===room}}
     onPress={()=>chooseFilter(room)} style={{minHeight:44,justifyContent:"center",paddingHorizontal:12,
      borderRadius:18,borderWidth:1,borderColor:filter===room?colors.primary:colors.border,
      backgroundColor:filter===room?"#E1F0E9":colors.surface}}>
     <Label style={{fontSize:13}}>{roomName(locale,room)}</Label>
    </Pressable>)}
   </ScrollView>:null}
   {current?<MotionReveal delay={30}><Pressable accessibilityRole="button"
    accessibilityLabel={copy.view+": "+roomName(locale,current.room)+" "+formatNumber(index+1,locale)}
    onPress={()=>setFullScreen(true)}
    style={{overflow:"hidden",borderRadius:16,backgroundColor:colors.border}}>
    <View style={{width:"100%",height:Math.max(175,panelWidth*0.64)}}>
     <GalleryImage photo={current} title={title}/>
    </View>
    <View style={{position:"absolute",bottom:10,start:10,backgroundColor:"rgba(15,20,19,0.85)",
     borderRadius:12,paddingHorizontal:10,paddingVertical:6}}>
     <Label style={{fontSize:12,color:"#fff"}}>
      {roomName(locale,current.room)} · {formatNumber(index+1,locale)}/{formatNumber(matching.length,locale)}
     </Label>
    </View>
   </Pressable></MotionReveal>:null}
   {current?.caption?<Label style={{fontSize:13,lineHeight:21}}>{current.caption}</Label>:null}
   {matching.length>1?renderControls():null}
   <ScrollView horizontal showsHorizontalScrollIndicator={false}
    contentContainerStyle={{flexDirection:rtl?"row-reverse":"row",gap:8,paddingVertical:2}}>
    {matching.map((photo,position)=><Pressable key={photo.id} accessibilityRole="button"
     accessibilityLabel={roomName(locale,photo.room)+" "+formatNumber(position+1,locale)+"/"+formatNumber(matching.length,locale)}
     accessibilityState={{selected:photo.id===current?.id}}
     onPress={()=>choose(position)} style={{width:95,gap:3}}>
     <View style={{width:95,height:72,borderRadius:10,overflow:"hidden",borderWidth:photo.id===current?.id?3:1,
      borderColor:photo.id===current?.id?colors.primary:colors.border}}>
      <GalleryImage photo={photo} title={title}/>
     </View>
     <Label muted style={{fontSize:11,textAlign:"center"}}>
      {photo.id===photos[0]?.id?copy.cover:roomName(locale,photo.room)}
     </Label>
    </Pressable>)}
   </ScrollView>
   <Modal visible={fullScreen&&!!current} animationType="fade"
    onShow={()=>fullRef.current?.scrollTo({x:index*width,animated:false})}
    onRequestClose={()=>setFullScreen(false)} statusBarTranslucent>
    <SafeAreaView style={{flex:1,backgroundColor:"#101716",justifyContent:"center"}}>
     <View style={{flexDirection:rtl?"row-reverse":"row",justifyContent:"space-between",
      paddingHorizontal:16,paddingVertical:8,alignItems:"center"}}>
      <Label style={{color:"#fff",fontSize:14}}>{formatNumber(index+1,locale)} / {formatNumber(matching.length,locale)}</Label>
      <Pressable accessibilityRole="button" accessibilityLabel={copy.close}
       onPress={()=>setFullScreen(false)} style={{padding:12,minHeight:44,minWidth:44,alignItems:"center"}}>
       <Label style={{color:"#fff",fontSize:16}}>✕ {copy.close}</Label>
      </Pressable>
     </View>
     <ScrollView ref={fullRef} horizontal pagingEnabled decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={event=>{
       const position=Math.max(0,Math.min(matching.length-1,Math.round(event.nativeEvent.contentOffset.x/width)));
       if(matching[position])setActiveId(matching[position].id);
      }}>
      {matching.map(photo=><View key={photo.id} style={{width,height:Math.min(height*0.67,width*1.2),
       justifyContent:"center",alignItems:"center"}}>
       <GalleryImage photo={photo} title={title} mode="contain"/>
      </View>)}
     </ScrollView>
     <View style={{paddingHorizontal:16,paddingVertical:8,gap:8}}>
      {matching.length>1?renderControls(true):null}
      <View style={{minHeight:60,gap:6,alignItems:rtl?"flex-end":"flex-start"}}>
       {current?<Label style={{color:"#fff",fontSize:14,fontWeight:"700"}}>{roomName(locale,current.room)}</Label>:null}
       {current?.caption?<Label style={{color:"#fff",fontSize:13}}>{current.caption}</Label>:null}
      </View>
     </View>
    </SafeAreaView>
   </Modal>
  </>}
 </View>;
}
