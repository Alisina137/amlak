import {router,useLocalSearchParams} from "expo-router";
import * as Crypto from "expo-crypto";
import {useRef,useState} from "react";
import {View} from "react-native";
import {isRTL} from "@amlaklink/localization";
import {propertyTypes,transactionTypes,type ListingDraft} from "@amlaklink/contracts";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {lt} from "../../src/listing-ui";
import {ox} from "../../src/owner-experience";
import {Action,BackButton,FilterChip,Label,Page,ScreenHeading,SectionCard,StateNotice,StatusBadge} from "../../src/ui";
export default function NewListing(){
 const params=useLocalSearchParams<{agencyId?:string}>(),{user,token}=useAuth(),{locale}=usePreferences(),rtl=isRTL(locale);
 const [category,setCategory]=useState<ListingDraft["propertyType"]>("house"),
  [transaction,setTransaction]=useState<ListingDraft["transactionType"]>("sale");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [publisherChoice,setPublisherChoice]=useState<"private"|"independent_agent">(user?.advertiserEnabled?"private":"independent_agent");
 const publisher=params.agencyId?"agency":publisherChoice;
 const verified=!!token&&!!user?.verified;
 const canSubmit=verified&&(publisher==="agency"||publisher==="private"&&!!user?.advertiserEnabled||
  publisher==="independent_agent"&&user?.independentAgentStatus==="approved");
 const lock=useRef(false),requestId=useRef(Crypto.randomUUID()),lastContext=useRef("");
 const context=[token,user?.id,params.agencyId,publisher,transaction,category].join("|");
 if(lastContext.current!==context){requestId.current=Crypto.randomUUID();lastContext.current=context;}
 async function create(){
  if(!token||!canSubmit||busy||lock.current)return;
  lock.current=true;setBusy(true);setError("");
  try{
   const result=await requestJson<{id:string}>("/v1/listings",{method:"POST",token,
    body:{clientRequestId:requestId.current,publisher,
     ...(params.agencyId?{agencyId:params.agencyId}:{}),propertyType:category,transactionType:transaction}});
   requestId.current=Crypto.randomUUID();
   router.replace({pathname:"/listings/[id]/edit",params:{id:result.id}});
  }catch{setError(ox(locale,"error"));}
  finally{lock.current=false;setBusy(false);}
 }
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={ox(locale,"newTitle")} subtitle={ox(locale,"newSub")}/>
  <SectionCard>
   <Label weight="bold">{ox(locale,"publishAs")}</Label>
   {params.agencyId?<StatusBadge label={ox(locale,"agency")} tone="neutral"/>:
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
     {(["private","independent_agent"] as const).map(option=><FilterChip key={option}
      label={ox(locale,option)} selected={publisherChoice===option} onPress={()=>setPublisherChoice(option)}/>)}
    </View>}
   <Label muted style={{fontSize:12}}>{ox(locale,"createLocked")}</Label>
  </SectionCard>
  <SectionCard>
   <Label weight="bold">{ox(locale,"transaction")}</Label>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
    {transactionTypes.map(type=><FilterChip key={type} selected={transaction===type} label={lt(locale,type)}
     onPress={()=>setTransaction(type)}/>)}
   </View>
  </SectionCard>
  <SectionCard>
   <Label weight="bold">{ox(locale,"category")}</Label>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
    {propertyTypes.map(type=><FilterChip key={type} selected={category===type}
     label={lt(locale,type)} onPress={()=>setCategory(type)}/>)}
   </View>
  </SectionCard>
  <SectionCard>
   <Label muted style={{fontSize:13}}>{ox(locale,"draftAlert")} {ox(locale,"privacy")}</Label>
   {error?<StateNotice message={error}/>:null}
   <Action disabled={busy||!canSubmit} label={busy?ox(locale,"saving"):ox(locale,"create")}
    onPress={()=>void create()}/>
   {!canSubmit?<Action kind="secondary" label={ox(locale,"logIn")}
    onPress={()=>router.push("/(tabs)/account")}/>:null}
  </SectionCard>
 </Page>;
}
