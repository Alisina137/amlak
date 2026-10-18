import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Alert,TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {ListingCard} from "../../src/listing-ui";
import type {ListingDTO} from "../../src/listing-client";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
type Member={userId:string;id:string|null;displayName:string;status:string};
type Item={id:string;listingId:string;addedBy:string;available:boolean;property:ListingDTO|null;
 votes:{userId:string;vote:"interested"|"pass";note:string}[]};
type Detail={id:string;title:string;ownerId:string;isOwner:boolean;members:Member[];items:Item[]};
const copy={
 en:{back:"Back to shortlists",invite:"Invite verified account",email:"Member email",send:"Invite",
 members:"Members & invitations",remove:"Remove member",add:"Add a saved property",empty:"No properties in this shortlist.",
 unavailable:"Property unavailable or removed. Private details are hidden.",interested:"Interested",
 pass:"Not for me",notes:"Note for the group (optional)",vote:"Save vote & note",delete:"Remove item",
 leave:"Leave shortlist",deleteList:"Delete shortlist",confirm:"Confirm removal?",cancel:"Cancel",
 error:"This shortlist is unavailable, or the request failed.",refresh:"Refresh",max:"Maximum five members including the owner."},
 fa:{back:"بازگشت به فهرست‌ها",invite:"دعوت حساب تأییدشده",email:"ایمیل عضو",send:"ارسال دعوت",
 members:"اعضا و دعوت‌ها",remove:"حذف عضو",add:"افزودن ملک ذخیره‌شده",empty:"هنوز ملکی در فهرست نیست.",
 unavailable:"این ملک در دسترس نیست؛ اطلاعات خصوصی پنهان است.",interested:"علاقه‌مندم",
 pass:"علاقه ندارم",notes:"یادداشت برای گروه (اختیاری)",vote:"ثبت نظر",delete:"حذف ملک",
 leave:"ترک فهرست",deleteList:"حذف فهرست",confirm:"حذف تأیید شود؟",cancel:"انصراف",
 error:"فهرست در دسترس نیست یا درخواست ناموفق بود.",refresh:"تازه‌سازی",max:"حداکثر پنج نفر، با مالک."},
 ps:{back:"فهرستونو ته ستنېدل",invite:"تایید شوی کاروونکی راوبله",email:"د غړي برېښنالیک",send:"بلنه",
 members:"غړي او بلنې",remove:"غړی لرې کړه",add:"خوندي ملکیت ورزیات کړه",empty:"تر اوسه ملکیت نشته.",
 unavailable:"ملکیت نشته؛ شخصي معلومات پټ دي.",interested:"خوښ مې دی",
 pass:"نه مې خوښېږي",notes:"د ډلې لپاره یادښت",vote:"نظر خوندي کړه",delete:"ملکیت لرې کړه",
 leave:"له فهرست څخه ووځه",deleteList:"فهرست ړنګ کړه",confirm:"لرې کول تایید کړئ؟",cancel:"نه",
 error:"فهرست نشته یا غوښتنه ناکامه وه.",refresh:"بیا تازه کړه",max:"د مالک په ګډون پنځه غړي."}
};
export default function ShortlistDetail(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),t=copy[locale],rtl=isRTL(locale);
 const {user,token}=useAuth(),[detail,setDetail]=useState<Detail|null>(null),[favorites,setFavorites]=useState<ListingDTO[]>([]);
 const [email,setEmail]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [openPicker,setOpenPicker]=useState(false),[notes,setNotes]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{
  if(!token||!id){setDetail(null);return;}
  try{
   const [list,likes]=await Promise.all([
    requestJson<Detail>("/v1/shortlists/"+id,{token}),
    requestJson<{items:ListingDTO[]}>("/v1/favorites",{token})
   ]);
   setDetail(list);setFavorites(likes.items);setError("");
  }catch{setDetail(null);setError(t.error);}
 },[token,id,t.error]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 async function mutate(path:string,method:"POST"|"PUT"|"DELETE",body?:object){
  if(!token||busy)return;
  setBusy(true);setError("");
  try{await requestJson(path,{token,method,...(body?{body}:{})});await load();}
  catch{setError(t.error);}finally{setBusy(false);}
 }
 function confirm(action:()=>void){
  Alert.alert(t.confirm,undefined,[{text:t.cancel,style:"cancel"},{text:locale==="en"?"Confirm":"تأیید",style:"destructive",onPress:action}]);
 }
 const base="/v1/shortlists/"+id;
 return <Page>
  <ScreenHeading title={detail?.title||t.back} subtitle={t.max}/>
  {busy?<ActivityIndicator color={colors.primary}/>:null}
  {error?<SectionCard><Label style={{color:colors.error}}>{error}</Label>
   <Action label={t.refresh} kind="secondary" onPress={()=>void load()}/></SectionCard>:null}
  {detail?<><SectionCard>
   <Label weight="bold">{t.members} ({detail.members.length}/5)</Label>
   {detail.members.map(member=><View key={member.userId} style={{gap:5}}>
    <Label>{member.userId===detail.ownerId?(locale==="en"?"Owner":"مالک"):
     member.displayName} · {member.status}</Label>
    {detail.isOwner&&member.userId!==detail.ownerId?
      <Action kind="secondary" label={t.remove} onPress={()=>confirm(()=>void mutate(base+"/members/"+member.userId,"DELETE"))}/>:null}
   </View>)}
   {detail.isOwner&&detail.members.length<5?<View style={{gap:8}}>
    <Label>{t.invite}</Label>
    <TextInput accessibilityLabel={t.email} placeholder={t.email} keyboardType="email-address"
     autoCapitalize="none" value={email} onChangeText={setEmail}
     style={{borderWidth:1,borderColor:colors.border,borderRadius:10,minHeight:48,padding:12,color:colors.text,
      textAlign:rtl?"right":"left",writingDirection:rtl?"rtl":"ltr"}}/>
    <Action disabled={busy||!email.includes("@")} label={t.send} onPress={()=>
      void mutate(base+"/invitations","POST",{email:email.trim()}).then(()=>setEmail(""))}/>
   </View>:null}
  </SectionCard>
  <SectionCard>
   <Label weight="bold">{t.add}</Label>
   <Action kind="secondary" label={t.add} onPress={()=>setOpenPicker(v=>!v)}/>
   {openPicker?favorites.filter(x=>!detail.items.some(item=>item.listingId===x.id)).map(property=>
    <View key={property.id} style={{gap:8}}>
     <Label>{property.data.title}</Label>
     <Action label={t.add} disabled={busy} onPress={()=>void mutate(base+"/items","POST",{listingId:property.id})}/>
    </View>):null}
  </SectionCard>
  {detail.items.length===0?<SectionCard><Label muted>{t.empty}</Label></SectionCard>:null}
  {detail.items.map(item=><SectionCard key={item.id}>
   {item.available&&item.property?<ListingCard item={item.property}/>:<Label muted>{t.unavailable}</Label>}
   {item.votes.map(v=><Label key={v.userId} muted>{v.userId===user?.id?
    (locale==="en"?"Your vote":"نظر شما"):detail.members.find(m=>m.userId===v.userId)?.displayName||"Member"}:
    {" "+(v.vote==="interested"?t.interested:t.pass)+(v.note?" · "+v.note:"")}</Label>)}
   {item.available?<><TextInput accessibilityLabel={t.notes} placeholder={t.notes}
    maxLength={500} value={notes[item.id]??item.votes.find(v=>v.userId===user?.id)?.note??""}
    onChangeText={v=>setNotes(prev=>({...prev,[item.id]:v}))}
    multiline style={{borderWidth:1,borderColor:colors.border,borderRadius:10,minHeight:64,padding:12,color:colors.text,
     textAlign:rtl?"right":"left",writingDirection:rtl?"rtl":"ltr"}}/>
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
     <View style={{flex:1}}><Action label={t.interested} disabled={busy} onPress={()=>
      void mutate(base+"/items/"+item.id+"/vote","PUT",{vote:"interested",note:notes[item.id]??item.votes.find(v=>v.userId===user?.id)?.note??""})}/></View>
     <View style={{flex:1}}><Action kind="secondary" disabled={busy} label={t.pass} onPress={()=>
      void mutate(base+"/items/"+item.id+"/vote","PUT",{vote:"pass",note:notes[item.id]??item.votes.find(v=>v.userId===user?.id)?.note??""})}/></View>
    </View>
   </>:null}
   {(detail.isOwner||item.addedBy===user?.id)?
    <Action kind="secondary" label={t.delete} onPress={()=>confirm(()=>void mutate(base+"/items/"+item.id,"DELETE"))}/>:null}
  </SectionCard>)}
  {detail.isOwner?<Action kind="secondary" label={t.deleteList} onPress={()=>confirm(()=>void (async()=>{
   if(!token)return;try{await requestJson(base,{token,method:"DELETE"});router.replace("/shortlists");}
   catch{setError(t.error);}
  })())}/>:<Action kind="secondary" label={t.leave} onPress={()=>confirm(()=>void (async()=>{
   if(!token||!user)return;try{await requestJson(base+"/members/"+user.id,{token,method:"DELETE"});router.replace("/shortlists");}
   catch{setError(t.error);}
  })())}/>}
  </>:null}
  <Action kind="secondary" label={t.back} onPress={()=>router.replace("/shortlists")}/>
 </Page>;
}
