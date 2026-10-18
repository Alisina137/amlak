import {router} from "expo-router";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {ActivityIndicator,View} from "react-native";
import MapView,{Marker,Polygon,Polyline,type Region} from "react-native-maps";
import {serializePolygon,parsePolygon,type GeoPoint} from "@amlaklink/contracts";
import {colors} from "@amlaklink/design-tokens";
import {isRTL,formatNumber} from "@amlaklink/localization";
import {usePreferences} from "../src/context";
import {useSearchFilters} from "../src/search-context";
import {fetchMap,queryString,type PropertyMapPoint} from "../src/discovery-client";
import {dt} from "../src/discovery-copy";
import {mapText} from "../src/map-copy";
import {Label,Action,BackButton,Page,ScreenHeading,SectionCard} from "../src/ui";
import {uiText} from "../src/ui-copy";
const AFGHANISTAN:Region={latitude:33.9391,longitude:67.71,latitudeDelta:6,longitudeDelta:7};
const KABUL:Region={latitude:34.5553,longitude:69.2075,latitudeDelta:0.30,longitudeDelta:0.30};
function visibleBounds(region:Region){
 const south=region.latitude-region.latitudeDelta/2,north=region.latitude+region.latitudeDelta/2,
  west=region.longitude-region.longitudeDelta/2,east=region.longitude+region.longitudeDelta/2;
 if(![south,north,west,east].every(Number.isFinite)||south>=north||west>=east)return null;
 return [Math.max(-90,south),Math.max(-180,west),Math.min(90,north),Math.min(180,east)]
  .map(v=>v.toFixed(6)).join(",");
}
export default function SearchMap(){
 const {locale}=usePreferences(),{filters,setFilters}=useSearchFilters();
 const [points,setPoints]=useState<PropertyMapPoint[]>([]);
 const [selected,setSelected]=useState<PropertyMapPoint|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const [ready,setReady]=useState(false);
 const [drawing,setDrawing]=useState(false),[vertices,setVertices]=useState<GeoPoint[]>([]);
 const [drawError,setDrawError]=useState("");
 const [hasMorePins,setHasMorePins]=useState(false);
 const key=queryString(filters),epoch=useRef(0),region=useRef<Region|null>(null);
 const activePolygon=useMemo(()=>{
  if(!filters.polygon)return [];
  try{return parsePolygon(filters.polygon);}catch{return [];}
 },[filters.polygon]);
 const startCenter=useRef<Region>(filters.provinceId==="kabul"?KABUL:AFGHANISTAN);
 const load=useCallback(async()=>{
  const version=++epoch.current;
  setLoading(true);setError("");setSelected(null);
  try{
   const result=await fetchMap(filters);
   if(version!==epoch.current)return;
   setPoints(result.items);setHasMorePins(result.hasMorePins);
  }catch{
   if(version!==epoch.current)return;
   setPoints([]);setHasMorePins(false);setError(dt(locale,"mapProvider"));
  }finally{if(version===epoch.current)setLoading(false);}
 },[key,locale]);
 useEffect(()=>{void load();return()=>{epoch.current++;};},[load]);
 const shownPolygon=drawing?vertices:activePolygon;
 const beginDrawing=()=>{setDrawing(true);setVertices([]);setDrawError("");setSelected(null);};
 const cancel=()=>{setDrawing(false);setVertices([]);setDrawError("");};
 const addVertex=(coordinate:GeoPoint)=>{
  if(!drawing)return;
  if(coordinate.latitude<29||coordinate.latitude>39||coordinate.longitude<60||coordinate.longitude>75){
   setDrawError(mapText(locale,"bad"));return;
  }
  if(vertices.length>=12){setDrawError(mapText(locale,"limit"));return;}
  setVertices(previous=>[...previous,{latitude:Number(coordinate.latitude.toFixed(6)),
   longitude:Number(coordinate.longitude.toFixed(6))}]);
  setDrawError("");
 };
 const goList=()=>router.replace("/(tabs)/search");
 const applyPolygon=()=>{
  try{
   const polygon=serializePolygon(vertices);
   setFilters({polygon,viewport:undefined});cancel();goList();
  }catch{setDrawError(mapText(locale,"bad"));}
 };
 const applyViewport=()=>{
  const box=visibleBounds(region.current||startCenter.current);
  if(!box){setDrawError(mapText(locale,"bad"));return;}
  setFilters({viewport:box,polygon:undefined});cancel();goList();
 };
 const clearArea=()=>{setFilters({viewport:undefined,polygon:undefined});cancel();goList();};
 const rowDirection=isRTL(locale)?"row-reverse":"row";
 return <Page>
  <ScreenHeading title={dt(locale,"map")} subtitle={mapText(locale,"select")}/>
  <BackButton onPress={()=>router.back()}/>
  <SectionCard>
   <Label muted>{mapText(locale,"privacy")}</Label>
   {filters.polygon||filters.viewport?<Label weight="bold" style={{color:colors.primary}}>{mapText(locale,"area")}</Label>:null}
   <Label>{mapText(locale,"matches")}: {formatNumber(points.length,locale)}{hasMorePins?"+":""}</Label>
   {hasMorePins?<Label muted>{mapText(locale,"capped")}</Label>:null}
  </SectionCard>
  {loading?<SectionCard><ActivityIndicator color={colors.primary}/><Label>{dt(locale,"loading")}</Label></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label>
   <Action kind="secondary" label={mapText(locale,"retry")} onPress={()=>void load()}/>
   <Action kind="secondary" label={mapText(locale,"returnList")} onPress={goList}/>
  </SectionCard>:null}
  <View style={{height:390,borderRadius:18,overflow:"hidden",
   borderWidth:1,borderColor:colors.border}}>
   <MapView style={{width:"100%",height:"100%"}} initialRegion={startCenter.current}
    onMapReady={()=>setReady(true)}
    onRegionChangeComplete={r=>{region.current=r;}}
    onPress={event=>addVertex(event.nativeEvent.coordinate)}>
    {points.map(item=><Marker key={item.id}
     coordinate={{latitude:item.latitude,longitude:item.longitude}}
     title={item.title} onPress={()=>{if(!drawing)setSelected(item);}} />)}
    {shownPolygon.length>=3?<Polygon coordinates={shownPolygon}
     strokeColor={colors.primary} fillColor="rgba(36,142,120,0.18)" strokeWidth={2} tappable={false}/>:null}
    {drawing&&shownPolygon.length===2?<Polyline coordinates={shownPolygon}
     strokeColor={colors.primary} strokeWidth={3}/>:null}
    {drawing&&vertices.map((p,i)=><Marker key={"vertex"+i} coordinate={p} pinColor={colors.primary}/>)}
   </MapView>
  </View>
  {drawing?<SectionCard>
   <Label weight="bold">{mapText(locale,"instructions")}</Label>
   <Label muted>{formatNumber(vertices.length,locale)} / 12</Label>
   {drawError?<Label style={{color:colors.error}}>{drawError}</Label>:null}
   <View style={{gap:8}}>
    <Action label={mapText(locale,"apply")} disabled={vertices.length<3} onPress={applyPolygon}/>
    <View style={{flexDirection:rowDirection,gap:8}}>
     <View style={{flex:1}}><Action kind="secondary" label={mapText(locale,"undo")}
      disabled={!vertices.length} onPress={()=>{setVertices(p=>p.slice(0,-1));setDrawError("");}}/></View>
     <View style={{flex:1}}><Action kind="secondary" label={mapText(locale,"cancel")} onPress={cancel}/></View>
    </View>
   </View>
  </SectionCard>:<SectionCard>
   <Label muted>{mapText(locale,"center")}</Label>
   <Action kind="secondary" label={mapText(locale,"draw")} disabled={!ready} onPress={beginDrawing}/>
   <Action kind="secondary" label={mapText(locale,"bounds")} disabled={!ready} onPress={applyViewport}/>
   {filters.polygon||filters.viewport?<Action kind="secondary" label={mapText(locale,"reset")} onPress={clearArea}/>:null}
   <Action kind="secondary" label={mapText(locale,"returnList")} onPress={goList}/>
  </SectionCard>}
  {!loading&&!points.length&&!error?<SectionCard><Label muted>{mapText(locale,"empty")}</Label></SectionCard>:null}
  {selected&&!drawing&&points.some(item=>item.id===selected.id)?<SectionCard>
   <Label weight="bold">{selected.title}</Label>
   <Label muted>{selected.transactionType}</Label>
   <Action label={uiText(locale,"viewProperty")}
    onPress={()=>router.push({pathname:"/property/[id]",params:{id:selected.id}})}/>
  </SectionCard>:null}
  <Label muted>{dt(locale,"approximate")}</Label>
 </Page>;
}
