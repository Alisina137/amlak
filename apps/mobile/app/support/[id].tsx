import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import * as Crypto from "expo-crypto";
import {useCallback,useState} from "react";
import {ActivityIndicator,TextInput} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
type Ticket={id:string;subject:string;category:string;status:string};
type Message={id:string;body:string;authorUserId:string|null;authorStaffId:string|null;createdAt:string};
const copy={
 en:{title:"Support conversation",reply:"Reply",body:"Write your reply",status:"Status",
 closed:"This ticket is closed. Create a new request if you still need help.",
 error:"Unable to load or send your message.",back:"Back to support",refresh:"Refresh"},
 fa:{title:"گفتگو با پشتیبانی",reply:"ارسال پاسخ",body:"پاسخ خود را بنویسید",status:"وضعیت",
 closed:"این درخواست بسته شده است؛ اگر نیاز دارید درخواست جدید بسازید.",
 error:"پیام بارگیری یا ارسال نشد.",back:"بازگشت به پشتیبانی",refresh:"تازه‌سازی"},
 ps:{title:"د ملاتړ خبرې",reply:"ځواب ولېږئ",body:"خپل ځواب ولیکئ",status:"حالت",
 closed:"دا غوښتنه تړل شوې؛ د نوې مرستې لپاره بله غوښتنه جوړه کړئ.",
 error:"پیغام ونه لېږل شو.",back:"ملاتړ ته ستنېدل",refresh:"بیا تازه کړه"}
};
export default function TicketDetails(){
 const {id}=useLocalSearchParams<{id:string}>(),{token,user}=useAuth(),{locale}=usePreferences(),t=copy[locale],rtl=isRTL(locale);
 const [ticket,setTicket]=useState<Ticket|null>(null),[messages,setMessages]=useState<Message[]>([]),
 [text,setText]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const load=useCallback(async()=>{
  if(!id||!token)return;
  try{const data=await requestJson<{ticket:Ticket;messages:Message[]}>("/v1/support/tickets/"+id,{token});
   setTicket(data.ticket);setMessages(data.messages);setError("");
  }catch{setTicket(null);setError(t.error);}
 },[id,token,t.error]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 async function submit(){
  if(!id||!token||busy||text.trim().length<2)return;
  setBusy(true);setError("");
  try{await requestJson("/v1/support/tickets/"+id+"/replies",{token,method:"POST",
   body:{requestId:Crypto.randomUUID(),body:text.trim()}});
   setText("");await load();
  }catch{setError(t.error);}finally{setBusy(false);}
 }
 return <Page><BackButton onPress={()=>router.back()}/><ScreenHeading title={ticket?.subject||t.title} subtitle={ticket?.category}/>
  {ticket?<SectionCard><Label weight="bold">{t.status}: {ticket.status}</Label></SectionCard>:null}
  {messages.slice().reverse().map(m=><SectionCard key={m.id}>
   <Label weight="bold">{m.authorUserId===user?.id?
    (locale==="en"?"You":"شما"):(locale==="en"?"Support":"پشتیبانی")}</Label>
   <Label>{m.body}</Label>
   <Label muted>{new Date(m.createdAt).toLocaleString(locale==="en"?"en-GB":"fa-AF")}</Label>
  </SectionCard>)}
  {ticket?.status==="closed"?<SectionCard><Label muted>{t.closed}</Label></SectionCard>:
   token&&ticket?<SectionCard>
    <Label>{t.body}</Label>
    <TextInput accessibilityLabel={t.body} value={text} onChangeText={setText} maxLength={2000}
     multiline placeholder={t.body} style={{minHeight:100,padding:12,color:colors.text,
      borderWidth:1,borderColor:colors.border,borderRadius:10,textAlign:rtl?"right":"left",writingDirection:rtl?"rtl":"ltr",textAlignVertical:"top"}}/>
    <Action disabled={busy||text.trim().length<2} label={t.reply} onPress={()=>void submit()}/>
   </SectionCard>:null}
  {busy?<ActivityIndicator color={colors.primary}/>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  <Action kind="secondary" label={t.refresh} onPress={()=>void load()}/>
  <Action kind="secondary" label={t.back} onPress={()=>router.replace("/support")}/>
 </Page>;
}
