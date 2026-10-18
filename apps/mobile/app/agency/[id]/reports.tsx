import {router,useLocalSearchParams} from "expo-router";
import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth,requestJson} from "../../../src/auth";
import {usePreferences} from "../../../src/context";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../../src/ui";
type Report={properties:{total:number;published:number};leads:{total:number;open:number};contactTaps:number;note:string};
export default function AgencyReports(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{token}=useAuth();
 const [report,setReport]=useState<Report|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const en=locale==="en";
 const load=useCallback(async()=>{
  if(!id||!token)return;setBusy(true);setError("");
  try{setReport(await requestJson<Report>("/v1/agencies/"+id+"/reports",{token}));}
  catch{setError(en?"Unable to load agency reports.":"گزارش دفتر بارگیری نشد.");}
  finally{setBusy(false);}
 },[id,token,en]);
 useEffect(()=>{void load();},[load]);
 const metrics=report?[
  [en?"Listings":"آگهی‌ها",report.properties.total],
  [en?"Published listings":"آگهی‌های فعال",report.properties.published],
  [en?"Inquiries":"پرسش‌ها",report.leads.total],
  [en?"Open inquiries":"پرسش‌های باز",report.leads.open],
  [en?"Contact taps (not calls)":"کلیک تماس (نه مکالمه)",report.contactTaps]
 ] as [string,number][]:[];
 return <Page><ScreenHeading title={en?"Agency activity report":"گزارش فعالیت دفتر"}
  subtitle={en?"Only observed marketplace activity; no estimated completed sales.":"فقط فعالیت ثبت‌شده در برنامه؛ نه معاملات تخمینی."}/>
  {busy?<ActivityIndicator color={colors.primary}/>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  {metrics.map(([label,value])=><SectionCard key={label}>
   <Label weight="bold" style={{fontSize:26}}>{value.toLocaleString()}</Label><Label muted>{label}</Label>
  </SectionCard>)}
  {report?<SectionCard><Label muted>{report.note}</Label></SectionCard>:null}
  <Action kind="secondary" label={en?"Refresh":"تازه‌سازی"} onPress={()=>void load()}/>
  <Action kind="secondary" label={en?"Back to agency":"بازگشت به دفتر"}
   onPress={()=>router.back()}/>
 </Page>;
}
