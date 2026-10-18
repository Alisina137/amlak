import {router} from "expo-router";
import {useEffect,useState,useRef} from "react";
import {ActivityIndicator,View} from "react-native";
import MapView,{Marker, type Region} from "react-native-maps";
import {colors} from "@amlaklink/design-tokens";
import {usePreferences} from "../src/context";
import {useSearchFilters} from "../src/search-context";
import {fetchMap,type PropertyMapPoint} from "../src/discovery-client";
import {dt} from "../src/discovery-copy";
import {Label,Action,BackButton,Page,ScreenHeading,SectionCard} from "../src/ui";
import {uiText} from "../src/ui-copy";
export default function SearchMap(){
 const {locale}=usePreferences(),{filters}=useSearchFilters();
 const [points,setPoints]=useState<PropertyMapPoint[]>([]),[unmapped,setUnmapped]=useState(0);
 const [selected,setSelected]=useState<PropertyMapPoint|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [ready,setReady]=useState(false);
 const region=useRef<Region|null>(null);
 async function load(bounds?:string){
  setLoading(true);setError("");
  try{
   const result=await fetchMap(filters,bounds);setPoints(result.items);setUnmapped(result.unmappedListings);
  }catch{setError(dt(locale,"mapProvider"));}finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[filters,locale]);
 const first=points[0];
 const center:Region=first?{latitude:first.latitude,longitude:first.longitude,latitudeDelta:0.16,longitudeDelta:0.16}:
 {latitude:34.5553,longitude:69.2075,latitudeDelta:0.30,longitudeDelta:0.30};
 const mapEnabled=points.length>0;
 const reloadArea=()=>{
  const r=region.current;if(!r)return;
  const south=r.latitude-r.latitudeDelta/2,north=r.latitude+r.latitudeDelta/2;
  const west=r.longitude-r.longitudeDelta/2,east=r.longitude+r.longitudeDelta/2;
  void load([south,west,north,east].map(x=>x.toFixed(6)).join(","));
 };
 return <Page>
  <ScreenHeading title={dt(locale,"map")} subtitle={dt(locale,"limited")}/>
  <BackButton onPress={()=>router.back()}/>
  {loading?<SectionCard><ActivityIndicator color={colors.primary}/><Label>{dt(locale,"loading")}</Label></SectionCard>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label><Action label={dt(locale,"returnList")} onPress={()=>router.back()}/></SectionCard>:null}
  {!loading&&!error&&!mapEnabled?<SectionCard><Label weight="bold">{dt(locale,"mapEmpty")}</Label><Label muted>{dt(locale,"approximate")}</Label><Action label={dt(locale,"returnList")} onPress={()=>router.back()}/></SectionCard>:null}
  {mapEnabled?<View style={{height:410,borderRadius:18,overflow:"hidden",borderWidth:1,borderColor:colors.border}}>
   <MapView key={first?.id||"empty"} style={{width:"100%",height:"100%"}} initialRegion={center}
    onMapReady={()=>setReady(true)} onRegionChangeComplete={r=>{region.current=r;}}>
    {points.map(item=><Marker key={item.id} coordinate={{latitude:item.latitude,longitude:item.longitude}}
     onPress={()=>setSelected(item)} title={item.title}/>)}
   </MapView>
  </View>:null}
  {mapEnabled?<Action kind="secondary" disabled={!ready||loading} label={dt(locale,"mapArea")} onPress={reloadArea}/>:null}
  {selected?<SectionCard><Label weight="bold">{selected.title}</Label>
   <Label muted>{selected.transactionType}</Label>
   <Action label={uiText(locale,"viewProperty")} onPress={()=>router.push({pathname:"/property/[id]",params:{id:selected.id}})}/>
  </SectionCard>:null}
  <Label muted>{dt(locale,"approximate")}</Label>
  {unmapped>0?<Label muted>{unmapped} {uiText(locale,"noMapCoordinates")}</Label>:null}
 </Page>;
}
