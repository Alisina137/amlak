import {useEffect,useState} from "react";
import {TextInput,View} from "react-native";
import MapView,{Marker} from "react-native-maps";
import {colors} from "@amlaklink/design-tokens";
import type {Locale} from "@amlaklink/localization";
import {Label} from "./ui";
export function PropertyLocationPicker({latitude,longitude,onChange,locale}:{latitude?:number;longitude?:number;onChange:(latitude:number|undefined,longitude:number|undefined)=>void;locale:Locale}){
 const [draftLat,setDraftLat]=useState(latitude===undefined?"":String(latitude));
 const [draftLng,setDraftLng]=useState(longitude===undefined?"":String(longitude));
 const [error,setError]=useState("");
 useEffect(()=>{setDraftLat(latitude===undefined?"":String(latitude));setDraftLng(longitude===undefined?"":String(longitude));},[latitude,longitude]);
 function apply(){
  setError("");
  if(!draftLat.trim()&&!draftLng.trim()){onChange(undefined,undefined);return;}
  const lat=Number(draftLat),lng=Number(draftLng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||!draftLat.trim()||!draftLng.trim()
   ||lat<29||lat>39||lng<60||lng>75){
   setError(locale==="en"?"Both coordinates must be inside Afghanistan.":locale==="fa"?"هر دو مختصات باید در افغانستان باشند.":"دواړه همغږۍ باید په افغانستان کې وي.");
   return;
  }
  onChange(lat,lng);
 }
 const chosen=latitude!==undefined && longitude!==undefined;
 const pickText=locale==="en"?"Tap map to pick a point; the map center is not your property's location.":locale==="fa"?
  "برای تعیین موقعیت روی نقشه بزنید. مرکز نقشه، موقعیت ملک شما نیست.":"ځای په نقشه کې په لمس کولو وټاکئ؛ د نقشې مرکز ستاسو ملکیت نه دی.";
 return <View style={{gap:9}}>
  <Label muted>{pickText}</Label>
  <View style={{height:235,borderRadius:13,overflow:"hidden",borderWidth:1,borderColor:colors.border}}>
   <MapView style={{width:"100%",height:"100%"}} initialRegion={{
     latitude:chosen?latitude:33.9391,longitude:chosen?longitude:67.71,
     latitudeDelta:chosen?0.06:6.0,longitudeDelta:chosen?0.06:6.0
   }} onPress={event=>{
    const point=event.nativeEvent.coordinate;
    if(point.latitude>=29&&point.latitude<=39&&point.longitude>=60&&point.longitude<=75){
     onChange(Number(point.latitude.toFixed(6)),Number(point.longitude.toFixed(6)));
     setError("");
    }else setError(locale==="en"?"Select a location in Afghanistan.":locale==="fa"?"موقعیت داخل افغانستان انتخاب کنید.":"په افغانستان کې ځای وټاکئ.");
   }}>
    {chosen?<Marker coordinate={{latitude,longitude}} draggable onDragEnd={e=>{
     const point=e.nativeEvent.coordinate;
     if(point.latitude<29||point.latitude>39||point.longitude<60||point.longitude>75){
      setError(locale==="en"?"Select a location in Afghanistan.":
       locale==="fa"?"موقعیت داخل افغانستان انتخاب کنید.":"په افغانستان کې ځای وټاکئ.");
      return;
     }
     setError("");
     onChange(Number(point.latitude.toFixed(6)),Number(point.longitude.toFixed(6)));
    }}/>:null}
   </MapView>
  </View>
  <Label muted>{locale==="en"?"If the map is unavailable, enter both coordinates manually.":locale==="fa"?
   "اگر نقشه کار نمی‌کند، هر دو مختصات را دستی وارد کنید.":"که نقشه کار نه کوي، دواړه همغږۍ په لاس ولیکئ."}</Label>
  <View style={{flexDirection:"row",gap:9}}>
   <View style={{flex:1}}>
    <Label>{locale==="en"?"Latitude":"عرض جغرافیایی"}</Label>
    <TextInput accessibilityLabel="Latitude" keyboardType="decimal-pad" value={draftLat} onChangeText={setDraftLat} onEndEditing={apply}
     style={{minHeight:46,padding:10,borderWidth:1,borderColor:colors.border,borderRadius:10,color:colors.text}}/>
   </View>
   <View style={{flex:1}}>
    <Label>{locale==="en"?"Longitude":"طول جغرافیایی"}</Label>
    <TextInput accessibilityLabel="Longitude" keyboardType="decimal-pad" value={draftLng} onChangeText={setDraftLng} onEndEditing={apply}
     style={{minHeight:46,padding:10,borderWidth:1,borderColor:colors.border,borderRadius:10,color:colors.text}}/>
   </View>
  </View>
  {error?<Label style={{color:colors.error}}>{error}</Label>:null}
  {chosen?<Label muted>{latitude.toFixed(6)}, {longitude.toFixed(6)}</Label>:null}
 </View>;
}
