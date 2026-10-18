import {findProvince,searchProvinces} from "@amlaklink/catalog";
import {colors} from "@amlaklink/design-tokens";
import {isRTL,t} from "@amlaklink/localization";
import {useLocalSearchParams,router} from "expo-router";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {ActivityIndicator,Modal,Pressable,ScrollView,View} from "react-native";
import {usePreferences} from "../../src/context";
import {useSearchFilters} from "../../src/search-context";
import {cachedDiscovery,fetchDiscovery,queryString,type SearchFilters} from "../../src/discovery-client";
import {requestJson} from "../../src/auth";
import {dt} from "../../src/discovery-copy";
import {mapText} from "../../src/map-copy";
import {ListingCard} from "../../src/listing-ui";
import type {ListingDTO} from "../../src/listing-client";
import {Action,AppInput,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
import {uiText} from "../../src/ui-copy";
export default function Search(){
 const {locale,provinceId,setProvinceId}=usePreferences();
 const {filters,setFilters,reset,hydrated}=useSearchFilters();
 const params=useLocalSearchParams<{intent?:string}>();
 const [query,setQuery]=useState(filters.q||"");
 const [items,setItems]=useState<ListingDTO[]>([]),[featured,setFeatured]=useState<ListingDTO[]>([]),[cursor,setCursor]=useState<string|null>(null),[loading,setLoading]=useState(true),[more,setMore]=useState(false);
 const [error,setError]=useState(""),[cached,setCached]=useState<number|null>(null),[sheet,setSheet]=useState(false);
 const rtl=isRTL(locale);
 const filterKey=queryString(filters);
 const filterKeyRef=useRef(filterKey),loadEpoch=useRef(0);
 filterKeyRef.current=filterKey;
 const [resultKey,setResultKey]=useState("");
 useEffect(()=>{if(params.intent && ["buy","rent","gharawi"].includes(params.intent)){
  setFilters({intent:params.intent==="buy"?"sale":params.intent as "rent"|"gharawi"});
 }},[params.intent]);
 useEffect(()=>{setQuery(filters.q||"");},[filters.q]);
 useEffect(()=>{const timer=setTimeout(()=>{if(query.trim()!==(filters.q||""))setFilters({q:query.trim()||undefined});},500);return()=>clearTimeout(timer);},[query,filters.q,setFilters]);
 const load=useCallback(async()=>{
  if(!hydrated)return;
  const epoch=++loadEpoch.current,key=queryString(filters);
  setLoading(true);setError("");setCached(null);
  try{
   const response=await cachedDiscovery(filters);
   if(epoch!==loadEpoch.current||filterKeyRef.current!==key)return;
   setItems(response.items);setCursor(response.nextCursor);setCached(response.cacheDate);setResultKey(key);
   if(response.fromCache||filters.polygon||filters.viewport){setFeatured([]);return;} // Do not show unscoped paid pins or stale promotions.
   void requestJson<{items:ListingDTO[]}>("/v1/promotions/featured?"+key)
    .then(promotions=>{if(epoch===loadEpoch.current&&filterKeyRef.current===key)setFeatured(promotions.items);})
    .catch(()=>{if(epoch===loadEpoch.current&&filterKeyRef.current===key)setFeatured([]);});
  }catch{
   if(epoch!==loadEpoch.current||filterKeyRef.current!==key)return;
   setItems([]);setFeatured([]);setCursor(null);setResultKey(key);setError(dt(locale,"unknown"));
  }finally{if(epoch===loadEpoch.current&&filterKeyRef.current===key)setLoading(false);}
 },[filters,hydrated,locale]);
 useEffect(()=>{void load();return()=>{loadEpoch.current++;};},[load]);
 async function loadMore(){
  if(!cursor||more||resultKey!==filterKey)return;
  const epoch=loadEpoch.current,key=filterKey;
  setMore(true);
  try{
   const data=await fetchDiscovery(filters,cursor);
   if(epoch!==loadEpoch.current||filterKeyRef.current!==key)return;
   setItems(before=>[...before,...data.items.filter(x=>!before.some(a=>a.id===x.id))]);
   setCursor(data.nextCursor);
  }catch{
   if(epoch===loadEpoch.current&&filterKeyRef.current===key)setError(dt(locale,"unknown"));
  }finally{setMore(false);}
 }
 const visibleItems=resultKey===filterKey?items:[];
 const visibleFeatured=resultKey===filterKey?featured:[];
 const visibleCursor=resultKey===filterKey?cursor:null;
 const visibleCache=resultKey===filterKey?cached:null;
 const intent=filters.intent||"sale";
 return <Page>
  <ScreenHeading title={t(locale,"search")} subtitle={findProvince(filters.provinceId||"kabul")?.names[locale]||dt(locale,"all")}/>
  <AppInput accessibilityLabel={dt(locale,"searchPlaceholder")} value={query} onChangeText={setQuery}
   placeholder={dt(locale,"searchPlaceholder")} autoCorrect={false}
   style={{minHeight:50,backgroundColor:colors.surface,borderRadius:12,borderColor:colors.border,borderWidth:1,padding:12,color:colors.text,fontSize:16,writingDirection:rtl?"rtl":"ltr",textAlign:rtl?"right":"left"}}/>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
   {(["sale","rent","gharawi"] as const).map(x=><View style={{flex:1}} key={x}>
    <Action kind={intent===x?"primary":"secondary"} label={t(locale,x==="sale"?"buy":x)} onPress={()=>setFilters({intent:x})}/>
   </View>)}
  </View>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
   <View style={{flex:1}}><Action kind="secondary" label={"⚙ "+dt(locale,"filter")} onPress={()=>setSheet(true)}/></View>
   <View style={{flex:1}}><Action kind="secondary" label={"⌖ "+dt(locale,"map")} onPress={()=>router.push("/search-map")}/></View>
  </View>
  {filters.polygon||filters.viewport?<SectionCard>
   <Label weight="bold" style={{color:colors.primary}}>{mapText(locale,"area")}</Label>
   <Label muted>{mapText(locale,"privacy")}</Label>
   <Action kind="secondary" label={mapText(locale,"reset")}
    onPress={()=>setFilters({viewport:undefined,polygon:undefined})}/>
  </SectionCard>:null}
  <Action kind="secondary" label={locale==="en"?"Save this search / manage alerts":locale==="fa"?"ذخیره جستجو و مدیریت اعلان‌ها":"پلټنه خوندي کړئ / خبرتیاوې"} onPress={()=>router.push("/saved-searches")}/>
  <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,alignItems:"center",justifyContent:"space-between"}}>
   <Label weight="bold" style={{fontSize:18}}>{dt(locale,"results")} · {visibleItems.length}{visibleCursor?"+":""}</Label>
   <Pressable accessibilityRole="button" style={{padding:10}} onPress={()=>void load()}>
    <Label style={{color:colors.primary}}>{dt(locale,"refresh")}</Label>
   </Pressable>
  </View>
  {visibleCache?<SectionCard><Label style={{color:colors.warning}}>{dt(locale,"offline")} · {new Date(visibleCache!).toLocaleDateString()}</Label></SectionCard>:null}
  {loading?<SectionCard><ActivityIndicator color={colors.primary}/><Label muted>{dt(locale,"loading")}</Label></SectionCard>:null}
  {!loading&&error?<SectionCard><Label style={{color:colors.error}}>{error}</Label><Action kind="secondary" label={dt(locale,"retry")} onPress={()=>void load()}/></SectionCard>:null}
  {!loading&&!visibleItems.length&&!error?<SectionCard><Label weight="bold">{dt(locale,"noResults")}</Label><Label muted>{dt(locale,"relax")}</Label><Action kind="secondary" label={dt(locale,"reset")} onPress={reset}/></SectionCard>:null}
  {visibleFeatured.length>0&&!loading?<SectionCard>
   <Label weight="bold">{locale==="en"?"Sponsored listings":locale==="fa"?"آگهی‌های تبلیغاتی":"تمویل شوي اعلانونه"}</Label>
   <Label muted>{locale==="en"?"Paid placements. Availability and moderation checks still apply.":locale==="fa"?"نمایش پولی؛ شرط موجودیت و بررسی همچنان برقرار است.":"پیسې ورکړل شوې؛ د شتون او ارزونې شرطونه لا هم پلي دي."}</Label>
   {visibleFeatured.map(item=><View key={item.id} style={{gap:6}}><Label muted>{locale==="en"?"Sponsored":locale==="fa"?"تبلیغاتی":"تمویل شوی"}</Label><ListingCard item={item}/></View>)}
  </SectionCard>:null}
  {visibleItems.filter(item=>!visibleFeatured.some(promoted=>promoted.id===item.id)).map(item=><ListingCard key={item.id} item={item}/>)}
  {visibleCursor?<Action disabled={more} label={more?dt(locale,"loading"):dt(locale,"showMore")} onPress={()=>void loadMore()}/>:null}
  <FilterSheet visible={sheet} close={()=>setSheet(false)} filters={filters} apply={next=>{setFilters(next);setSheet(false);}} clear={()=>{reset();setSheet(false);}} locale={locale}/>
 </Page>;
}
type Lang="fa"|"ps"|"en";
function FilterSheet({visible,close,filters,apply,clear,locale}:{visible:boolean;close:()=>void;filters:SearchFilters;apply:(p:SearchFilters)=>void;clear:()=>void;locale:Lang}){
 const [draft,setDraft]=useState<SearchFilters>(filters),[provinceSearch,setProvinceSearch]=useState("");
 useEffect(()=>{if(visible)setDraft(filters);},[visible,filters]);
 const rtl=isRTL(locale);
 const update=(p:SearchFilters)=>setDraft(v=>({...v,...p}));
 const numericField=(key:keyof SearchFilters,label:string)=>{
  return <View style={{flex:1,minWidth:120,gap:6}}>
   <Label>{label}</Label>
   <AppInput accessibilityLabel={label} keyboardType="decimal-pad" inputDirection="ltr" value={draft[key]||""} onChangeText={v=>update({[key]:v||undefined})}
    style={{minHeight:48}}/>
  </View>;
 };
 const options=(label:string,key:keyof SearchFilters,items:{value:string;label:string}[])=>
  <View style={{gap:8}}><Label weight="bold">{label}</Label>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
    {items.map(o=><Pressable key={o.value} accessibilityRole="button" accessibilityState={{selected:draft[key]===o.value}}
     onPress={()=>update({[key]:o.value===""?undefined:o.value})} style={{paddingHorizontal:14,paddingVertical:11,minHeight:44,borderRadius:22,borderWidth:1,
      borderColor:draft[key]===o.value?colors.primary:colors.border,backgroundColor:draft[key]===o.value?"#e2f1ec":colors.surface}}>
     <Label style={{color:draft[key]===o.value?colors.primary:colors.text}}>{o.label}</Label>
    </Pressable>)}
   </View>
  </View>;
 return <Modal animationType="slide" transparent visible={visible} onRequestClose={close}>
  <View style={{flex:1,backgroundColor:"#0007",justifyContent:"flex-end"}}>
   <View style={{maxHeight:"92%",backgroundColor:colors.background,borderTopLeftRadius:22,borderTopRightRadius:22,padding:16,gap:10}}>
    <View style={{flexDirection:rtl?"row-reverse":"row",justifyContent:"space-between",alignItems:"center"}}>
     <Label weight="bold" style={{fontSize:22}}>{dt(locale,"filter")}</Label>
     <Pressable accessibilityRole="button" onPress={close} style={{padding:12}}><Label>✕</Label></Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:20,paddingBottom:24}}>
     {options(dt(locale,"category"),"type",[{value:"",label:dt(locale,"all")},...(["house","apartment","land","shop","office","commercial"] as const).map(type=>({value:type,label:({en:{house:"House",apartment:"Apartment",land:"Land",shop:"Shop",office:"Office",commercial:"Commercial"},fa:{house:"خانه",apartment:"آپارتمان",land:"زمین",shop:"دکان",office:"دفتر",commercial:"تجاری"},ps:{house:"کور",apartment:"اپارتمان",land:"ځمکه",shop:"دوکان",office:"دفتر",commercial:"تجارتي"}})[locale][type]}))])}
     <View style={{gap:8}}>
      <Label weight="bold">{dt(locale,"region")}</Label>
      {options("", "provinceId",[{value:"",label:dt(locale,"all")},...searchProvinces(provinceSearch,locale).map(p=>({value:p.id,label:p.names[locale]}))])}
      <AppInput placeholder={t(locale,"searchProvince")} accessibilityLabel={t(locale,"searchProvince")} value={provinceSearch} onChangeText={setProvinceSearch}
       style={{minHeight:48}}/>
      {(["city","district","neighborhood"] as const).map(key=><View key={key} style={{gap:4}}>
       <Label>{dt(locale,key)}</Label><AppInput value={draft[key]||""} onChangeText={v=>update({[key]:v||undefined})}
        style={{borderWidth:1,borderColor:colors.border,padding:10,borderRadius:10,color:colors.text}}/>
      </View>)}
     </View>
     {options(dt(locale,"currency"),"currency",[{value:"AFN",label:"AFN"},{value:"USD",label:"USD"}])}
     <View style={{flexDirection:rtl?"row-reverse":"row",gap:10,flexWrap:"wrap"}}>
      {numericField("minPrice",dt(locale,"priceMin"))}{numericField("maxPrice",dt(locale,"priceMax"))}
      {numericField("minArea",dt(locale,"areaMin"))}{numericField("maxArea",dt(locale,"areaMax"))}
      {numericField("bedrooms",dt(locale,"bedrooms"))}{numericField("bathrooms",dt(locale,"bathrooms"))}
     </View>
     {(["furnished","parking","water","electricity"] as const).map(key=>
      <View key={key}>{options(dt(locale,key),key,[{value:"",label:dt(locale,"all")},{value:"true",label:"✓"},{value:"false",label:"✕"}])}</View>)}
     {options(dt(locale,"professional"),"advertiser",[{value:"",label:dt(locale,"all")},{value:"private",label:uiText(locale,"searchPrivate")},{value:"independent_agent",label:uiText(locale,"searchAgent")},{value:"agency",label:uiText(locale,"searchAgency")}])}
     {options(dt(locale,"verified"),"verifiedAgency",[{value:"",label:dt(locale,"all")},{value:"true",label:"✓"}])}
     {options(dt(locale,"sort"),"sort",[
      {value:"newest",label:dt(locale,"newest")},{value:"recent_confirmed",label:dt(locale,"recent")},
      {value:"price_asc",label:dt(locale,"low")},{value:"price_desc",label:dt(locale,"high")}])}
    </ScrollView>
    <View style={{gap:8}}>
     <Action label={dt(locale,"apply")} onPress={()=>apply({...draft,
      ...(draft.minPrice||draft.maxPrice||draft.sort?.startsWith("price")?{currency:draft.currency||"AFN"}:{})})}/>
     <Action kind="secondary" label={dt(locale,"reset")} onPress={clear}/>
    </View>
   </View>
  </View>
 </Modal>;
}
