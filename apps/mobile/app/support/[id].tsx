import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import * as Crypto from "expo-crypto";
import {useCallback,useRef,useState} from "react";
import {View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {sx,ticketCategory,ticketStatus} from "../../src/support-experience";
import {Action,AppInput,BackButton,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";
type Ticket={id:string;subject:string;category:string;status:string};
type Message={id:string;body:string;authorUserId:string|null;authorStaffId:string|null;createdAt:string};
export default function TicketDetails(){
 const {id}=useLocalSearchParams<{id:string}>(),{token,user}=useAuth(),{locale}=usePreferences(),rtl=isRTL(locale);
 const [snapshot,setSnapshot]=useState<{token:string|null;id:string|null;ticket:Ticket|null;messages:Message[]}>({
  token:null,id:null,ticket:null,messages:[]
 });
 const [text,setText]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const epoch=useRef(0),active=useRef(token),messageKey=useRef(Crypto.randomUUID()),lock=useRef(false);
 active.current=token;
 const visible=snapshot.token===token&&snapshot.id===id?snapshot:null;
 const ticket=visible?.ticket||null,messages=visible?.messages||[];
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!id||!token){setSnapshot({token:null,id:null,ticket:null,messages:[]});setLoading(false);return;}
  setLoading(true);
  try{
   const data=await requestJson<{ticket:Ticket;messages:Message[]}>("/v1/support/tickets/"+id,{token});
   if(version!==epoch.current||active.current!==token)return;
   setSnapshot({token,id,ticket:data.ticket,messages:data.messages});setError("");
  }catch{
   if(version===epoch.current&&active.current===token){
    setSnapshot({token,id,ticket:null,messages:[]});setError(sx(locale,"failed"));
   }
  }finally{if(version===epoch.current&&active.current===token)setLoading(false);}
 },[id,token,locale]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 async function submit(){
  if(!id||!token||lock.current||busy||!ticket||ticket.status==="closed"||text.trim().length<2)return;
  lock.current=true;setBusy(true);setError("");
  try{
   await requestJson("/v1/support/tickets/"+id+"/replies",{token,method:"POST",
    body:{requestId:messageKey.current,body:text.trim()}});
   messageKey.current=Crypto.randomUUID();setText("");await load();
  }catch{setError(sx(locale,"failed"));}finally{lock.current=false;setBusy(false);}
 }
 const date=(value:string)=>{
  const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat(locale==="en"?"en-US":locale==="fa"?"fa-AF":"ps-AF",{
   timeZone:"Asia/Kabul",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"
  }).format(d):"—";
 };
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={ticket?.subject||sx(locale,"title")} subtitle={ticket?ticketCategory(locale,ticket.category):undefined}/>
  {loading&&!ticket?<LoadingCard rows={4}/>:null}
  {error?<StateNotice message={error} retryLabel={sx(locale,"retry")} onRetry={()=>void load()}/>:null}
  {ticket?<SectionCard>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,alignItems:"center"}}>
    <Label weight="medium" style={{flex:1}}>{sx(locale,"subject")}</Label>
    <StatusBadge tone={ticket.status==="open"?"success":"neutral"} label={ticketStatus(locale,ticket.status)}/>
   </View>
   <Label muted style={{fontSize:12}}>{sx(locale,"replyHint")}</Label>
  </SectionCard>:null}
  {ticket&&messages.length===0?<SectionCard><Label muted>{sx(locale,"empty")}</Label></SectionCard>:null}
  {messages.slice().reverse().map(m=>{
   const mine=m.authorUserId===user?.id;
   return <View key={m.id} style={{padding:12,gap:6,maxWidth:"90%",borderWidth:1,borderRadius:14,
    borderColor:mine?"#BCDBC9":colors.border,backgroundColor:mine?"#E1F0E9":colors.surface,
    alignSelf:mine?(rtl?"flex-start":"flex-end"):(rtl?"flex-end":"flex-start")}}>
    <Label weight="medium" style={{fontSize:12}}>{sx(locale,mine?"mine":"staff")}</Label>
    <Label style={{fontSize:14,lineHeight:22}}>{m.body}</Label>
    <Label muted style={{fontSize:11}}>{date(m.createdAt)}</Label>
   </View>;
  })}
  {ticket?.status==="closed"?<SectionCard><Label muted>{sx(locale,"closedNote")}</Label></SectionCard>:
   token&&ticket?<SectionCard>
    <Label weight="medium">{sx(locale,"write")}</Label>
    <AppInput accessibilityLabel={sx(locale,"write")} value={text} onChangeText={setText}
     editable={!busy} maxLength={2000} multiline placeholder={sx(locale,"write")}
     style={{minHeight:112,textAlignVertical:"top"}}/>
    <Label muted style={{fontSize:12}}>{sx(locale,"submitHint")}</Label>
    <Action disabled={busy||text.trim().length<2} label={sx(locale,"reply")} onPress={()=>void submit()}/>
   </SectionCard>:null}
  {ticket?<Action kind="secondary" label={sx(locale,"refresh")} disabled={busy||loading} onPress={()=>void load()}/>:null}
  <Action kind="secondary" label={sx(locale,"back")} onPress={()=>router.replace("/support")}/>
 </Page>;
}
