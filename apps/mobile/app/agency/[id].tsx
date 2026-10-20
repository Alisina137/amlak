import {router,useLocalSearchParams,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {Alert,Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {useAuth,requestJson} from "../../src/auth";
import {usePreferences} from "../../src/context";
import {ag} from "../../src/agency-experience";
import {Action,AppInput,BackButton,FilterChip,Label,Page,ScreenHeading,SectionCard,LoadingCard,StateNotice,StatusBadge} from "../../src/ui";
type Workspace={agency:{name:string;status:string};membership:{role:string;id:string};canManageMembers:boolean;canSubmitListing:boolean};
type Member={id:string;displayName:string;role:string;status:string};
type Pane="overview"|"team";
export default function AgencyWorkspace(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{token}=useAuth(),rtl=isRTL(locale);
 const [snapshot,setSnapshot]=useState<{scope:string;workspace:Workspace|null;members:Member[]}>({scope:"",workspace:null,members:[]});
 const scope=token+":"+id,scoped=snapshot.scope===scope?snapshot:null,workspace=scoped?.workspace||null,members=scoped?.members||[];
 const [pane,setPane]=useState<Pane>("overview"),[email,setEmail]=useState(""),[role,setRole]=useState<"agent"|"manager">("agent");
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const lock=useRef(false),scopeRef=useRef(scope),epoch=useRef(0);scopeRef.current=scope;
 const load=useCallback(async()=>{
  const version=++epoch.current;
  if(!token||!id){setSnapshot({scope,workspace:null,members:[]});setLoading(false);return;}
  setLoading(true);setError("");
  try{
   const [w,m]=await Promise.all([
    requestJson<Workspace>("/v1/agencies/"+id+"/workspace",{token}),
    requestJson<{items:Member[]}>("/v1/agencies/"+id+"/members",{token})
   ]);
   if(epoch.current===version&&scopeRef.current===scope)setSnapshot({scope,workspace:w,members:m.items});
  }catch{if(epoch.current===version&&scopeRef.current===scope){
   setSnapshot({scope,workspace:null,members:[]});setError(ag(locale,"error"));
  }}finally{if(epoch.current===version&&scopeRef.current===scope)setLoading(false);}
 },[scope,token,id,locale]);
 useFocusEffect(useCallback(()=>{void load();return()=>{epoch.current++;};},[load]));
 const active=workspace?.agency.status==="active";
 const memberRole=workspace?.membership.role;
 const canManage=!!active&&!!workspace?.canManageMembers;
 const go=(page:"properties"|"leads"|"reports"|"performance"|"billing")=>{
  if(!id)return;
  router.push({pathname:("/agency/[id]/"+page) as "/agency/[id]/properties",params:{id}});
 };
 async function invite(){
  if(!token||!id||!canManage||lock.current||!/^\S+@\S+\.\S+$/.test(email.trim()))return;
  lock.current=true;setBusy(true);setError("");
  try{await requestJson("/v1/agencies/"+id+"/members",{token,method:"POST",body:{email:email.trim().toLowerCase(),role}});
   setEmail("");await load();}catch{setError(ag(locale,"error"));}
  finally{lock.current=false;setBusy(false);}
 }
 function revoke(member:Member){
  if(!token||!id||!canManage||busy||member.role==="owner"||member.id===workspace?.membership.id)return;
  Alert.alert(ag(locale,"members"),member.displayName,[
   {text:locale==="en"?"Cancel":locale==="fa"?"انصراف":"لغوه",style:"cancel"},
   {text:locale==="en"?"Revoke access":locale==="fa"?"قطع دسترسی":"لاسرسی بندول",style:"destructive",
    onPress:()=>{void (async()=>{
     if(lock.current)return;lock.current=true;setBusy(true);setError("");
     try{await requestJson("/v1/agencies/"+id+"/members/"+member.id+"/revoke",{token,method:"POST"});
      await load();}catch{setError(ag(locale,"error"));}finally{lock.current=false;setBusy(false);}
    })();}}
  ]);
 }
 const link=(page:"properties"|"leads"|"reports"|"performance"|"billing",icon:string)=>{
  const enabled=!!active&&(page!=="reports"&&page!=="performance"||memberRole!=="agent")&&
   (page!=="billing"||memberRole==="owner");
  if(!enabled)return null;
  return <Pressable accessibilityRole="button" key={page} onPress={()=>go(page)}
   style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:12,minHeight:60,padding:13,
    borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface}}>
    <Label style={{fontSize:22,color:colors.primary}}>{icon}</Label>
    <Label weight="medium" style={{flex:1,fontSize:14}}>{ag(locale,page)}</Label>
    <Label muted>{rtl?"‹":"›"}</Label>
  </Pressable>;
 };
 return <Page>
  <BackButton onPress={()=>router.back()}/>
  <ScreenHeading title={workspace?.agency.name||ag(locale,"workspace")} subtitle={ag(locale,"sub")}/>
  {loading?<LoadingCard rows={4}/>:null}
  {error?<StateNotice message={error} retryLabel={ag(locale,"retry")} onRetry={()=>void load()}/>:null}
  {workspace?<View style={{gap:12}}>
   <SectionCard>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:8,flexWrap:"wrap"}}>
     <StatusBadge label={active?ag(locale,"active"):ag(locale,"pending")} tone={active?"success":"warning"}/>
     <StatusBadge label={ag(locale,memberRole==="owner"?"owner":memberRole==="manager"?"manager":"agent")}/>
    </View>
    <Label muted style={{fontSize:12}}>{ag(locale,"access")}</Label>
    {!active?<StateNotice tone="warning" message={ag(locale,"pendingReview")}/>:null}
   </SectionCard>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
    {(["overview","team"] as const).map(value=><FilterChip key={value} label={ag(locale,value)}
     selected={pane===value} onPress={()=>setPane(value)}/>)}
   </View>
   {pane==="overview"?<SectionCard>
    <Label weight="bold">{ag(locale,"overview")}</Label>
    <Label muted style={{fontSize:13}}>{ag(locale,"note")} {ag(locale,"analytics")}</Label>
    {workspace.canSubmitListing&&active?<Action label={ag(locale,"newProperty")}
     onPress={()=>router.push({pathname:"/listings/new",params:{agencyId:id}})}/>:null}
    {link("properties","⌂")}{link("leads","✉")}{link("reports","▥")}{link("performance","◇")}{link("billing","▣")}
   </SectionCard>:<SectionCard>
    <Label weight="bold">{ag(locale,"members")} · {members.length}</Label>
    {!members.length?<Label muted>{ag(locale,"noMembers")}</Label>:null}
    {members.map(member=><View key={member.id} style={{gap:6,paddingVertical:10,borderBottomWidth:1,borderColor:colors.border}}>
     <Label weight="medium">{member.displayName}</Label>
     <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
      <StatusBadge label={ag(locale,member.role==="owner"?"owner":member.role==="manager"?"manager":"agent")}/>
      <StatusBadge tone={member.status==="active"?"success":"warning"}
       label={ag(locale,member.status==="active"?"active":"pending")}/>
     </View>
     {canManage&&member.role!=="owner"&&member.id!==workspace.membership.id?
      <Action kind="secondary" disabled={busy}
       label={locale==="en"?"Revoke access":locale==="fa"?"قطع دسترسی":"لاسرسی بندول"} onPress={()=>revoke(member)}/>:null}
    </View>)}
    {canManage?<View style={{gap:10}}>
     <Label weight="bold">{ag(locale,"invite")}</Label>
     <Label muted style={{fontSize:12}}>{ag(locale,"emailHint")}</Label>
     <AppInput inputDirection="ltr" accessibilityLabel={ag(locale,"email")} placeholder={ag(locale,"email")}
      editable={!busy} autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
      maxLength={254} value={email} onChangeText={setEmail}/>
     <View style={{flexDirection:rtl?"row-reverse":"row",gap:8}}>
      {(["agent","manager"] as const).filter(r=>r!=="manager"||memberRole==="owner").map(value=>
       <FilterChip key={value} label={ag(locale,value)} selected={role===value} onPress={()=>setRole(value)}/>)}
     </View>
     <Action label={ag(locale,"send")} disabled={busy||!/^\S+@\S+\.\S+$/.test(email.trim())}
      onPress={()=>void invite()}/>
    </View>:<Label muted>{ag(locale,"notAvailable")}</Label>}
   </SectionCard>}
  </View>:null}
  <Action kind="secondary" label={ag(locale,"refresh")} disabled={busy||loading} onPress={()=>void load()}/>
 </Page>;
}