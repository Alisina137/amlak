import {useEffect,useMemo,useRef,useState} from "react";
import {Image,Modal,Pressable,ScrollView,View,useWindowDimensions} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {colors} from "@amlaklink/design-tokens";
import {usePreferences} from "./context";
import {photoSource,type ListingDTO} from "./listing-client";
import {Label,SectionCard} from "./ui";
import {mediaCopy,photoRoomTypes,roomName,type PhotoRoom} from "./media-copy";

type Photo=ListingDTO["photos"][number];
type Filter="all"|PhotoRoom;
export function PropertyGallery({photos,title}:{photos:Photo[];title:string}){
 const {locale}=usePreferences(),text=mediaCopy[locale],rtl=locale!=="en";
 const {width,height}=useWindowDimensions();
 const [filter,setFilter]=useState<Filter>("all"),[activeId,setActiveId]=useState<string|null>(null),
  [fullScreen,setFullScreen]=useState(false);
 const fullRef=useRef<ScrollView|null>(null);
 const roomFilters=useMemo(()=>photoRoomTypes.filter(room=>photos.some(p=>p.room===room)),[photos]);
 const matching=useMemo(()=>filter==="all"?photos:photos.filter(p=>p.room===filter),[photos,filter]);
 const index=Math.max(0,matching.findIndex(photo=>photo.id===activeId));
 const current=matching[index];
 const panelWidth=Math.max(1,Math.min(width-32,720));
 useEffect(()=>{if(!matching.length){setActiveId(null);return;}
  if(!matching.some(p=>p.id===activeId))setActiveId(matching[0].id);
 },[matching,activeId]);
 const selectFilter=(value:Filter)=>{
  setFilter(value);
  const first=value==="all"?photos[0]:photos.find(p=>p.room===value);
  setActiveId(first?.id||null);
 };
 const syncFullScreen=()=>{
  if(fullScreen&&current)fullRef.current?.scrollTo({x:index*width,animated:false});
 };
 const movePhoto=(offset:number)=>{
  const next=Math.max(0,Math.min(matching.length-1,index+offset));
  if(matching[next]){
   setActiveId(matching[next].id);
   fullRef.current?.scrollTo({x:next*width,animated:true});
  }
 };
 const coverId=photos[0]?.id;
 return <View style={{gap:12}}>
  <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",justifyContent:"space-between"}}>
   <Label weight="bold" style={{fontSize:18}}>{text.photos}</Label>
   <Label muted>{photos.length} {text.count}</Label>
  </View>
  {photos.length===0?<SectionCard><Label muted>{text.noPhotos}</Label></SectionCard>:<>
   {roomFilters.length>0?<ScrollView horizontal showsHorizontalScrollIndicator={false}
    contentContainerStyle={{flexDirection:rtl?"row-reverse":"row",gap:8,paddingVertical:3}}>
    {(["all",...roomFilters] as Filter[]).map(room=><Pressable key={room}
     accessibilityRole="button" accessibilityState={{selected:filter===room}}
     onPress={()=>selectFilter(room)} style={{minHeight:44,justifyContent:"center",paddingHorizontal:12,
      borderRadius:18,borderWidth:1,borderColor:filter===room?colors.primary:colors.border,
      backgroundColor:filter===room?"#E1F0E9":colors.surface}}>
     <Label style={{fontSize:13}}>{roomName(locale,room)}</Label>
    </Pressable>)}
   </ScrollView>:null}
   {current?<Pressable accessibilityRole="button"
    accessibilityLabel={text.view+": "+roomName(locale,current.room)+" "+(index+1)}
    onPress={()=>setFullScreen(true)}>
    <View style={{overflow:"hidden",borderRadius:16,backgroundColor:colors.border}}>
     <Image source={photoSource(current.id)} resizeMode="cover"
      style={{width:"100%",height:panelWidth*0.67}} accessibilityLabel={title}/>
     <View style={{position:"absolute",bottom:10,start:10,backgroundColor:"rgba(15,20,19,0.82)",
      borderRadius:12,paddingHorizontal:10,paddingVertical:6}}>
      <Label style={{fontSize:12,color:"#fff"}}>
       {roomName(locale,current.room)} · {index+1}/{matching.length}
      </Label>
     </View>
    </View>
   </Pressable>:null}
   {current?.caption?<Label>{current.caption}</Label>:null}
   <ScrollView horizontal showsHorizontalScrollIndicator={false}
    contentContainerStyle={{flexDirection:rtl?"row-reverse":"row",gap:8,paddingVertical:2}}>
    {matching.map((photo,position)=><Pressable key={photo.id} accessibilityRole="button"
     accessibilityLabel={roomName(locale,photo.room)+" "+(position+1)+"/"+matching.length}
     accessibilityState={{selected:photo.id===current?.id}}
     onPress={()=>setActiveId(photo.id)} style={{width:95,gap:3}}>
     <Image source={photoSource(photo.id)} resizeMode="cover"
      style={{width:95,height:72,borderRadius:10,borderWidth:photo.id===current?.id?3:1,
       borderColor:photo.id===current?.id?colors.primary:colors.border}}/>
     <Label muted style={{fontSize:11,textAlign:"center"}}>
      {photo.id===coverId?text.cover:roomName(locale,photo.room)}
     </Label>
    </Pressable>)}
   </ScrollView>
   <Modal visible={fullScreen&&!!current} animationType="fade" onShow={syncFullScreen}
    onRequestClose={()=>setFullScreen(false)} statusBarTranslucent>
    <SafeAreaView style={{flex:1,backgroundColor:"#101716",justifyContent:"center"}}>
     <View style={{flexDirection:rtl?"row-reverse":"row",justifyContent:"space-between",
      padding:12,alignItems:"center"}}>
      <Label style={{color:"#fff",fontSize:14}}>{index+1}/{matching.length}</Label>
      <Pressable accessibilityRole="button" accessibilityLabel={text.close}
       onPress={()=>setFullScreen(false)} style={{padding:12,minHeight:44,minWidth:44,alignItems:"center"}}>
       <Label style={{color:"#fff",fontSize:17}}>✕ {text.close}</Label>
      </Pressable>
     </View>
     <ScrollView ref={fullRef} horizontal pagingEnabled decelerationRate="fast"
      showsHorizontalScrollIndicator={false} onContentSizeChange={syncFullScreen}
      onMomentumScrollEnd={event=>{
       const i=Math.max(0,Math.min(matching.length-1,Math.round(event.nativeEvent.contentOffset.x/width)));
       if(matching[i])setActiveId(matching[i].id);
      }}>
      {matching.map(photo=><View key={photo.id} style={{width,height:Math.min(height*0.72,width*1.2),
       justifyContent:"center",alignItems:"center"}}>
       <Image accessibilityLabel={roomName(locale,photo.room)} source={photoSource(photo.id)}
        resizeMode="contain" style={{width:"100%",height:"100%"}}/>
      </View>)}
     </ScrollView>
     <View style={{flexDirection:rtl?"row-reverse":"row",justifyContent:"space-between",
      paddingHorizontal:16,gap:12,alignItems:"center"}}>
      <Pressable accessibilityRole="button" accessibilityLabel={text.previous}
       disabled={index===0} onPress={()=>movePhoto(-1)}
       style={{minHeight:48,minWidth:110,borderRadius:14,borderColor:"#74817B",
        borderWidth:1,alignItems:"center",justifyContent:"center",opacity:index===0?0.35:1}}>
       <Label style={{color:"#fff",fontSize:14}}>{rtl?"→ ":"← "}{text.previous}</Label>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={text.next}
       disabled={index>=matching.length-1} onPress={()=>movePhoto(1)}
       style={{minHeight:48,minWidth:110,borderRadius:14,borderColor:"#74817B",
        borderWidth:1,alignItems:"center",justifyContent:"center",opacity:index>=matching.length-1?0.35:1}}>
       <Label style={{color:"#fff",fontSize:14}}>{text.next}{rtl?" ←":" →"}</Label>
      </Pressable>
     </View>
     {current?<View style={{minHeight:90,padding:16,alignItems:rtl?"flex-end":"flex-start",gap:8}}>
      <Label style={{color:"#fff",fontWeight:"700"}}>{roomName(locale,current.room)}</Label>
      {current.caption?<Label style={{color:"#fff"}}>{current.caption}</Label>:null}
     </View>:null}
    </SafeAreaView>
   </Modal>
  </>}
 </View>;
}
