import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../../src/auth";
import {usePreferences} from "../../../src/context";
import {ag} from "../../../src/agency-experience";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice} from "../../../src/ui";
type Report={properties:{total:number;published:number};leads:{total:number;open:number};contactTaps:number;note:string};
const copy={
 en:{title:"Agency activity report",listings:"Properties",published:"Published",leads:"Inquiries",open:"Open inquiries",taps:"Contact taps, not completed calls",noData:"There are no recorded events yet."},
 fa:{title:"گزارش فعالیت دفتر",listings:"ملک‌ها",published:"نشرشده",leads:"درخواست‌ها",open:"درخواست‌های باز",taps:"کلیک‌های تماس، نه تماس تکمیل‌شده",noData:"هنوز رویدادی ثبت نشده است."},
 ps:{title:"د دفتر فعالیت راپور",listings:"ملکیتونه",published:"خپور شوي",leads:"پوښتنې",open:"پرانیستې پوښتنې",taps:"د اړیکې کلیکونه، نه بشپړې اړیکې",noData:"لا کوم فعالیت نه دی ثبت شوی."}
} as const;
export default function AgencyReports(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{token}=useAuth(),rtl=isRTL(locale),t=copy[locale];
 const [snapshot,setSnapshot]=useState<{scope:string;report:Report|null}>({scope:"",report:null});
 const scope=token+":"+id,report=snapshot.scope===scope?snapshot.report:null;
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const scopeRef=useRef(scope),epoch=useRef(0);scopeRef.current=scope;
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!id||!token){setSnapshot({scope,report:null});setLoading(false);return;}
  setLoading(true);setError("");
  try{
   const r=await requestJson<Report>("/v1/agencies/"+id+"/reports",{token});
   if(scopeRef.current===scope&&epoch.current===version)setSnapshot({scope,report:r});
  }catch{if(scopeRef.current===scope&&epoch.current===version)setError(ag(locale,"error"));}
  finally{if(scopeRef.current===scope&&epoch.current===version)setLoading(false);}
 },[id,token,scope,locale]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 const metrics=report?[
  {label:t.listings,value:report.properties.total,max:Math.max(1,report.properties.total)},
  {label:t.published,value:report.properties.published,max:Math.max(1,report.properties.total)},
  {label:t.leads,value:report.leads.total,max:Math.max(1,report.leads.total)},
  {label:t.open,value:report.leads.open,max:Math.max(1,report.leads.total)},
  {label:t.taps,value:report.contactTaps,max:Math.max(1,report.contactTaps)}
 ]:[];
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={t.title} subtitle={ag(locale,"analytics")}/>
  {loading?<LoadingCard rows={5}/>:null}
  {error?<StateNotice message={error} retryLabel={ag(locale,"retry")} onRetry={()=>void load()}/>:null}
  {report&&!loading?<SectionCard>
   <Label weight="bold">{ag(locale,"activity")}</Label>
   {metrics.map(item=><View key={item.label} style={{gap:6,paddingVertical:6}}>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:12}}>
     <Label style={{fontSize:13,flex:1}}>{item.label}</Label>
     <Label weight="bold" style={{fontSize:20}}>{formatNumber(item.value,locale)}</Label>
    </View>
    <View style={{height:9,backgroundColor:colors.border,borderRadius:6,overflow:"hidden"}}>
     <View accessibilityLabel={item.label+" "+item.value} style={{height:9,width:((100*Math.min(1,item.value/item.max))+"%") as `${number}%`,backgroundColor:colors.primary,borderRadius:6}}/>
    </View>
   </View>)}
   <Label muted style={{fontSize:12,lineHeight:19}}>{report.note}</Label>
  </SectionCard>:null}
  {!loading&&!error&&!report?<SectionCard><Label muted>{t.noData}</Label></SectionCard>:null}
  <Action kind="secondary" label={ag(locale,"performance")} onPress={()=>router.push({pathname:"/agency/[id]/performance",params:{id}})}/>
  <Action kind="secondary" label={ag(locale,"refresh")} disabled={loading} onPress={()=>void load()}/>
 </Page>;
}
