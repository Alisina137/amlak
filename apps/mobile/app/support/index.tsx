import {router,useFocusEffect} from "expo-router";
import * as Crypto from "expo-crypto";
import {useCallback,useState} from "react";
import {ActivityIndicator,TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {Action,BackButton,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
type Ticket={id:string;subject:string;status:string;category:string;updatedAt:string};
const categories=["account","listing","payments","safety","other"] as const;
const copy={
 en:{title:"Help & support",sub:"Ask about your account, listings or AmlakLink services. For suspected fraud, also use Report.",
  signin:"Sign in and verify your email to contact support.",subject:"Subject",details:"What happened?",
  create:"Send support request",my:"My requests",empty:"No support requests yet.",
  open:"Open conversation",error:"Unable to process support request.",retry:"Refresh"},
 fa:{title:"کمک و پشتیبانی",sub:"در مورد حساب، آگهی یا خدمات املاک لینک بپرسید. موارد تقلب را نیز گزارش کنید.",
  signin:"برای ارتباط با پشتیبانی وارد شوید و ایمیل خود را تأیید کنید.",subject:"موضوع",details:"مشکل را توضیح دهید",
  create:"ارسال درخواست",my:"درخواست‌های من",empty:"هنوز درخواستی ندارید.",
  open:"بازکردن گفتگو",error:"ثبت درخواست ممکن نشد.",retry:"تازه‌سازی"},
 ps:{title:"مرسته او ملاتړ",sub:"د حساب، اعلانونو او خدمتونو په اړه پوښتنه وکړئ. د درغلۍ راپور هم ورکړئ.",
  signin:"د ملاتړ لپاره ننوزئ او ایمیل تایید کړئ.",subject:"موضوع",details:"ستونزه بیان کړئ",
  create:"غوښتنه ولېږئ",my:"زما غوښتنې",empty:"تر اوسه غوښتنه نشته.",
  open:"خبرې پرانیزه",error:"غوښتنه ونه لېږل شوه.",retry:"بیا تازه کړه"}
};
export default function Support(){
 const {locale}=usePreferences(),t=copy[locale],rtl=isRTL(locale),{token,user}=useAuth();
 const [items,setItems]=useState<Ticket[]>([]),[category,setCategory]=useState<typeof categories[number]>("account");
 const [subject,setSubject]=useState(""),[body,setBody]=useState(""),[error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{
  if(!token){setItems([]);return;}
  try{const data=await requestJson<{items:Ticket[]}>("/v1/support/tickets",{token});setItems(data.items);setError("");}
  catch{setError(t.error);}
 },[token,t.error]);
 useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
 async function submit(){
  if(!token||busy||subject.trim().length<6||body.trim().length<10)return;
  setBusy(true);setError("");
  try{const ticket=await requestJson<Ticket>("/v1/support/tickets",{token,method:"POST",
   body:{requestId:Crypto.randomUUID(),category,subject:subject.trim(),body:body.trim()}});
   setSubject("");setBody("");await refresh();
   router.push({pathname:"/support/[id]",params:{id:ticket.id}});
  }catch{setError(t.error);}finally{setBusy(false);}
 }
 const style={minHeight:48,padding:12,borderWidth:1,borderColor:colors.border,borderRadius:12,
  color:colors.text,writingDirection:rtl?"rtl" as const:"ltr" as const,textAlign:rtl?"right" as const:"left" as const};
 return <Page><BackButton onPress={()=>router.back()}/><ScreenHeading title={t.title} subtitle={t.sub}/>
  {!token||!user?.verified?<SectionCard><Label>{t.signin}</Label>
   <Action label={locale==="en"?"Sign in":"ورود"} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
  </SectionCard>:<><SectionCard>
    <Label weight="bold">{t.create}</Label>
    <View style={{flexDirection:rtl?"row-reverse":"row",flexWrap:"wrap",gap:8}}>
     {categories.map(c=><Action key={c} kind={category===c?"primary":"secondary"}
      label={c} onPress={()=>setCategory(c)}/>)}
    </View>
    <Label>{t.subject}</Label>
    <TextInput accessibilityLabel={t.subject} value={subject} onChangeText={setSubject} maxLength={150}
     placeholder={t.subject} style={style}/>
    <Label>{t.details}</Label>
    <TextInput accessibilityLabel={t.details} value={body} onChangeText={setBody} maxLength={2000}
     placeholder={t.details} multiline style={[style,{minHeight:112,textAlignVertical:"top"}]}/>
    <Action disabled={busy||subject.trim().length<6||body.trim().length<10}
     label={t.create} onPress={()=>void submit()}/>
   </SectionCard>
   <SectionCard><Label weight="bold">{t.my}</Label>
    {!items.length?<Label muted>{t.empty}</Label>:items.map(item=><View key={item.id} style={{gap:8}}>
     <Label weight="bold">{item.subject}</Label><Label muted>{item.category} · {item.status}</Label>
     <Action kind="secondary" label={t.open}
      onPress={()=>router.push({pathname:"/support/[id]",params:{id:item.id}})}/>
    </View>)}
   </SectionCard></>}
  {busy?<ActivityIndicator color={colors.primary}/>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label></SectionCard>:null}
  <Action kind="secondary" label={t.retry} onPress={()=>void refresh()}/>
 </Page>;
}
