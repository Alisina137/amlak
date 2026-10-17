import {router,useLocalSearchParams} from "expo-router";
import * as Crypto from "expo-crypto";
import {useState} from "react";
import {View} from "react-native";
import {propertyTypes,transactionTypes,type ListingDraft} from "@amlaklink/contracts";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {lt} from "../../src/listing-ui";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function NewListing(){
 const params=useLocalSearchParams<{agencyId?:string}>(),{user,token}=useAuth(),{locale}=usePreferences();
 const [category,setCategory]=useState<ListingDraft["propertyType"]>("house"),[transaction,setTransaction]=useState<ListingDraft["transactionType"]>("sale");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const publisher=params.agencyId?"agency":user?.independentAgentStatus==="approved" && !user?.advertiserEnabled?"independent_agent":"private";
 async function create(){
  if(!token)return;setBusy(true);setError("");
  try{
   const result=await requestJson<{id:string}>("/v1/listings",{method:"POST",token,
    body:{clientRequestId:Crypto.randomUUID(),publisher,...(params.agencyId?{agencyId:params.agencyId}:{}),propertyType:category,transactionType:transaction}});
   router.replace({pathname:"/listings/[id]/edit",params:{id:result.id}});
  }catch{setError(locale==="en"?"Unable to create a draft. Verify your advertiser or agency access.":"ساخت پیش‌نویس ممکن نشد؛ صلاحیت حساب خود را بررسی کنید.");}
  finally{setBusy(false);}
 }
 return <Page><ScreenHeading title={locale==="en"?"New property listing":"نشر ملک جدید"} subtitle={locale==="en"?"Choose the transaction and property category first.":"ابتدا نوع معامله و ملک را انتخاب کنید."}/>
  <SectionCard><Label weight="bold">{locale==="en"?"Transaction":"نوع معامله"}</Label>
   <View style={{gap:8}}>{transactionTypes.map(type=><Action key={type} kind={transaction===type?"primary":"secondary"} label={lt(locale,type)} onPress={()=>setTransaction(type)}/>)}</View>
  </SectionCard>
  <SectionCard><Label weight="bold">{locale==="en"?"Property category":"نوع ملک"}</Label>
   <View style={{gap:8}}>{propertyTypes.map(type=><Action key={type} kind={category===type?"primary":"secondary"} label={lt(locale,type)} onPress={()=>setCategory(type)}/>)}</View>
  </SectionCard>
  {error?<Label>{error}</Label>:null}
  <Action disabled={busy||!token} label={busy?"…":locale==="en"?"Create draft and continue":"ساخت پیش‌نویس و ادامه"} onPress={()=>void create()}/>
  <Action kind="secondary" label={locale==="en"?"Back":"بازگشت"} onPress={()=>router.back()}/>
 </Page>;
}
