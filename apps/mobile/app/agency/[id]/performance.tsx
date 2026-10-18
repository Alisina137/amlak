import {router,useLocalSearchParams} from "expo-router";
import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,ScrollView,View,Pressable} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {formatNumber,isRTL} from "@amlaklink/localization";
import {leadStageLabel,uiText} from "../../../src/ui-copy";
import {useAuth,requestJson} from "../../../src/auth";
import {usePreferences} from "../../../src/context";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../../src/ui";
import {displayKabul} from "../../../src/engagement-client";
type Metrics={total:number;unassigned:number;awaitingFirstReply:number;
 answeredWithin24h:number;avgFirstResponseMinutes:number|null;crmWon:number;viewings:number;open:number};
type Agent={userId:string;displayName:string;role:string;assigned:number;awaitingFirstReply:number;answeredWithin24h:number;
 avgFirstResponseMinutes:number|null;crmWon:number};
type Report={days:number;sampled:boolean;aggregates:Metrics;agents:Agent[];note:string};
type Lead={id:string;status:string;leadStatus:string;assignedTo:string|null;lastMessageAt:string};
const translations={
 en:{title:"Agency lead performance",subtitle:"App-observed inquiries only; no verified sales.",
 period:"Period",days:"days",all:"All leads",mine:"My assigned leads",unassigned:"Unassigned",
 total:"Leads received",open:"Open conversations",pending:"Awaiting first reply",
 timely:"Answered within 24h",average:"Avg. first response (minutes)",crmWon:"Marked won (unverified)",
 viewing:"CRM viewing stage",team:"Team performance",assigned:"Assigned leads",queue:"Lead queue",
 assign:"Assign to agent",remove:"Unassign",load:"Refresh",back:"Agency workspace",
 error:"Could not load agency reports.",empty:"No leads in this view.",
 estimate:"Results are limited to the most recent 1,000 inquiries and 10,000 messages. They may be incomplete.",
 time:"Last activity"},
 fa:{title:"عملکرد درخواست‌های دفتر",subtitle:"فقط درخواست‌های ثبت‌شده در برنامه؛ معامله تایید‌شده نیست.",
 period:"دوره",days:"روز",all:"همه درخواست‌ها",mine:"درخواست‌های من",unassigned:"بدون مسئول",
 total:"درخواست‌ها",open:"گفتگوهای باز",pending:"در انتظار اولین پاسخ",timely:"پاسخ در ۲۴ ساعت",
 average:"میانگین پاسخ اولیه (دقیقه)",crmWon:"علامت موفق (تأییدنشده)",viewing:"مرحله بازدید",
 team:"عملکرد تیم",assigned:"درخواست‌های تخصیص‌شده",queue:"صف درخواست‌ها",assign:"تخصیص به عضو",
 remove:"حذف مسئول",load:"تازه‌سازی",back:"دفتر",error:"گزارش بارگیری نشد.",
 empty:"درخواستی وجود ندارد.",estimate:"حداکثر ۱۰۰۰ درخواست و ۱۰۰۰۰ پیام؛ آمار ممکن است ناقص باشد.",time:"آخرین فعالیت"},
 ps:{title:"د دفتر د غوښتنو فعالیت",subtitle:"یوازې په اپ کې ثبت شوي غوښتنې، د پلور ثبوت نه دی.",
 period:"موده",days:"ورځې",all:"ټولې غوښتنې",mine:"زما غوښتنې",unassigned:"بې مسؤوله",
 total:"غوښتنې",open:"پرانیستې خبرې",pending:"لومړي ځواب ته انتظار",timely:"په ۲۴ ساعتونو کې ځواب",
 average:"د لومړي ځواب اوسط دقیقې",crmWon:"ګټل شوې نښه (نه تایید)",viewing:"د لیدنې مرحله",
 team:"د ډلې فعالیت",assigned:"سپارل شوې غوښتنې",queue:"د غوښتنو لړلیک",assign:"غړي ته وسپارئ",
 remove:"مسؤل لرې کړئ",load:"بیا تازه کړه",back:"دفتر",error:"راپور ونه موندل شو.",
 empty:"غوښتنې نشته.",estimate:"تر ۱۰۰۰ غوښتنو او ۱۰۰۰۰ پیغامونو پورې، ارقام ممکن بشپړ نه وي.",time:"وروستی فعالیت"}
};
export default function AgencyPerformance(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{token}=useAuth();
 const t=translations[locale];
 const [days,setDays]=useState<7|30|90>(30),[report,setReport]=useState<Report|null>(null);
 const [queue,setQueue]=useState<Lead[]>([]),[status,setStatus]=useState<"all"|"mine"|"unassigned">("all");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const load=useCallback(async()=>{
  if(!id||!token)return;setBusy(true);setError("");
  try{
   const [r,q]=await Promise.all([
    requestJson<Report>("/v1/agencies/"+id+"/performance?days="+days,{token}),
    requestJson<{items:Lead[]}>("/v1/agencies/"+id+"/lead-queue?status="+status,{token})
   ]);
   setReport(r);setQueue(q.items);
  }catch{setError(t.error);}
  finally{setBusy(false);}
 },[id,token,days,status,t.error]);
 useEffect(()=>{void load();},[load]);
 async function assign(lead:Lead,userId:string|null){
  if(!token||busy)return;setBusy(true);setError("");
  try{
   await requestJson("/v1/inquiries/"+lead.id+"/assign",{token,method:"POST",body:{assignedTo:userId}});
   await load();
  }catch{setError(t.error);}finally{setBusy(false);}
 }
 const pairs=report?[
  [t.total,report.aggregates.total],[t.open,report.aggregates.open],
  [t.pending,report.aggregates.awaitingFirstReply],[t.unassigned,report.aggregates.unassigned],
  [t.timely,report.aggregates.answeredWithin24h],
  [t.average,report.aggregates.avgFirstResponseMinutes],
  [t.crmWon,report.aggregates.crmWon],[t.viewing,report.aggregates.viewings]
 ]:[];
 return <Page><BackButton onPress={()=>router.back()}/><ScreenHeading title={t.title} subtitle={t.subtitle}/>
  <SectionCard>
   <Label weight="bold">{t.period}</Label>
   <View style={{flexDirection:locale==="en"?"row":"row-reverse",gap:8}}>
    {([7,30,90] as const).map(d=><View key={d} style={{flex:1}}>
     <Action kind={days===d?"primary":"secondary"} label={formatNumber(d,locale)+" "+t.days} onPress={()=>setDays(d)}/>
    </View>)}
   </View>
  </SectionCard>
  {busy?<ActivityIndicator color={colors.primary}/>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  {pairs.map(([name,value])=><SectionCard key={String(name)}>
   <Label weight="bold" style={{fontSize:24}}>{value===null?"—":formatNumber(Number(value),locale)}</Label>
   <Label muted>{name}</Label>
  </SectionCard>)}
  <SectionCard>
   <Label weight="bold">{t.team}</Label>
   {report?.agents.map(a=><View key={a.userId} style={{paddingVertical:9,gap:4,borderBottomWidth:1,borderColor:colors.border}}>
    <Label weight="bold">{a.displayName} · {a.role==="owner"?uiText(locale,"localeAgencyRoleOwner"):a.role==="manager"?uiText(locale,"localeAgencyRoleManager"):uiText(locale,"localeAgencyRoleAgent")}</Label>
    <Label muted>{t.assigned}: {formatNumber(a.assigned,locale)} · {t.pending}: {formatNumber(a.awaitingFirstReply,locale)}</Label>
    <Label muted>{t.timely}: {formatNumber(a.answeredWithin24h,locale)} · {t.average}: {a.avgFirstResponseMinutes===null?"—":formatNumber(a.avgFirstResponseMinutes,locale)}</Label>
   </View>)}
  </SectionCard>
  <SectionCard>
   <Label weight="bold">{t.queue}</Label>
   <ScrollView horizontal showsHorizontalScrollIndicator={false}
    contentContainerStyle={{flexDirection:isRTL(locale)?"row-reverse":"row",gap:8,paddingVertical:4}}>
    {(["all","mine","unassigned"] as const).map(x=><Pressable key={x}
     accessibilityRole="tab" accessibilityState={{selected:status===x}}
     accessibilityLabel={x==="all"?t.all:x==="mine"?t.mine:t.unassigned}
     onPress={()=>setStatus(x)} style={{borderWidth:1,borderRadius:12,
      borderColor:status===x?colors.primary:colors.border,
      backgroundColor:status===x?colors.primary:colors.surface,
      paddingHorizontal:16,minHeight:48,justifyContent:"center"}}>
     <Label weight="medium" style={{textAlign:"center",color:status===x?colors.surface:colors.text}}>
      {x==="all"?t.all:x==="mine"?t.mine:t.unassigned}
     </Label>
    </Pressable>)}
   </ScrollView>
   {!queue.length?<Label muted>{t.empty}</Label>:queue.map(lead=><View key={lead.id}
    style={{gap:7,borderBottomWidth:1,borderColor:colors.border,paddingVertical:12}}>
    <Label>{lead.status} · {leadStageLabel(locale,lead.leadStatus)} · {lead.assignedTo?t.assigned:t.unassigned}</Label>
    <Label muted>{t.time}: {displayKabul(lead.lastMessageAt,locale)}</Label>
    <Action kind="secondary" label={uiText(locale,"openConversation")}
     onPress={()=>router.push({pathname:"/inquiries/[id]",params:{id:lead.id}})}/>
    {lead.assignedTo?<Action kind="secondary" label={t.remove} onPress={()=>void assign(lead,null)}/>:null}
    {report?.agents.map(a=>a.userId!==lead.assignedTo?<Action key={a.userId}
     kind="secondary" label={t.assign+": "+a.displayName} onPress={()=>void assign(lead,a.userId)}/>:null)}
   </View>)}
  </SectionCard>
  {report?.sampled?<SectionCard><Label muted>{t.estimate}</Label></SectionCard>:null}
  {report?<SectionCard><Label muted>{t.subtitle} {t.estimate}</Label></SectionCard>:null}
  <Action kind="secondary" label={t.load} onPress={()=>void load()}/>
 </Page>;
}
