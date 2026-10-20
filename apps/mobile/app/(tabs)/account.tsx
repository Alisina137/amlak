import {router,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {Alert,Pressable,Switch,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {findProvince} from "@amlaklink/catalog";
import {isRTL,t} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
import {authT} from "../../src/auth-copy";
import {useAuth,requestJson} from "../../src/auth";
import {ax,professionalStatus} from "../../src/account-experience";
import {Action,AppInput,DirectionalRow,Label,LanguagePicker,Page,ScreenHeading,SectionCard,StateNotice,StatusBadge} from "../../src/ui";
type Membership={agencyId:string;name:string;agencyStatus:string;role:string;membershipStatus:string};
function AccountLink({icon,label,subtitle,onPress,disabled=false}:{icon:string;label:string;subtitle?:string;onPress:()=>void;disabled?:boolean}){
 const {locale}=usePreferences(),rtl=isRTL(locale);
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}}
  disabled={disabled} onPress={onPress}
  style={{flexDirection:rtl?"row-reverse":"row",minHeight:56,alignItems:"center",gap:12,
   borderWidth:1,borderColor:colors.border,borderRadius:14,padding:12,opacity:disabled?0.5:1}}>
  <View style={{width:34,height:34,borderRadius:12,backgroundColor:"#E1F0E9",alignItems:"center",justifyContent:"center"}}>
   <Label style={{fontSize:17,color:colors.primary,textAlign:"center"}}>{icon}</Label>
  </View>
  <View style={{flex:1,gap:1}}>
   <Label weight="medium" style={{fontSize:14,lineHeight:20}}>{label}</Label>
   {subtitle?<Label muted style={{fontSize:12,lineHeight:18}}>{subtitle}</Label>:null}
  </View>
  <Label muted style={{fontSize:20}}>{rtl?"‹":"›"}</Label>
 </Pressable>;
}
export default function Account(){
 const {locale,provinceId}=usePreferences(),rtl=isRTL(locale),{user,token,signOut,refresh,loading}=useAuth();
 const [agencySnapshot,setAgencySnapshot]=useState<{token:string|null;items:Membership[]}>({token:null,items:[]});
 const agencies=agencySnapshot.token===token?agencySnapshot.items:[];
 const [busy,setBusy]=useState(false),[accept,setAccept]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [editing,setEditing]=useState(false),[name,setName]=useState("");
 const epoch=useRef(0),tokenRef=useRef(token);tokenRef.current=token;
 const loadAgencies=useCallback(async()=>{
  const version=++epoch.current;
  if(!token){setAgencySnapshot({token:null,items:[]});return;}
  try{
   const result=await requestJson<{items:Membership[]}>("/v1/agencies/mine",{token});
   if(version===epoch.current&&tokenRef.current===token)setAgencySnapshot({token,items:result.items});
  }catch{if(version===epoch.current&&tokenRef.current===token)setError(ax(locale,"failed"));}
 },[token,locale]);
 useFocusEffect(useCallback(()=>{setError("");void loadAgencies();void refresh();
  return()=>{epoch.current++;};
 },[loadAgencies,refresh]));
 const section=(title:string)=> <Label weight="bold" style={{fontSize:17,lineHeight:24}}>{title}</Label>;
 const verified=!!user?.verified,canAdvertise=!!user?.advertiserEnabled||user?.independentAgentStatus==="approved";
 async function activate(){
  if(!token||!accept||!verified||busy)return;
  setBusy(true);setError("");
  try{await requestJson("/v1/advertiser/activate",{method:"POST",token,body:{acceptedRules:true}});
   await refresh();setNotice(ax(locale,"active"));setAccept(false);
  }catch{setError(ax(locale,"failed"));}finally{setBusy(false);}
 }
 async function acceptInvitation(item:Membership){
  if(!token||busy||!verified)return;setBusy(true);setError("");
  try{
   await requestJson("/v1/agencies/"+item.agencyId+"/invitation/accept",{method:"POST",token});
   await loadAgencies();
  }catch{setError(ax(locale,"failed"));}finally{setBusy(false);}
 }
 async function updateProfile(){
  if(!token||busy||name.trim().length<2||name.trim().length>120)return;
  setBusy(true);setError("");
  try{await requestJson("/v1/me",{method:"PATCH",token,body:{displayName:name.trim()}});
   await refresh();setNotice(ax(locale,"updated"));setEditing(false);
  }catch{setError(ax(locale,"failed"));}finally{setBusy(false);}
 }
 function logout(){
  Alert.alert(ax(locale,"signOutTitle"),ax(locale,"signOutBody"),[
   {text:ax(locale,"cancel"),style:"cancel"},
   {text:ax(locale,"logout"),style:"destructive",onPress:()=>void signOut()}
  ]);
 }
 return <Page>
  <ScreenHeading title={ax(locale,"title")} subtitle={ax(locale,"subtitle")}/>
  {!user?<SectionCard>
   <View style={{flexDirection:rtl?"row-reverse":"row",gap:12,alignItems:"center"}}>
    <View style={{width:54,height:54,borderRadius:27,backgroundColor:"#E1F0E9",alignItems:"center",justifyContent:"center"}}>
     <Label style={{fontSize:25,color:colors.primary,textAlign:"center"}}>◎</Label>
    </View>
    <View style={{flex:1,gap:4}}><Label weight="bold">{t(locale,"guest")}</Label><Label muted style={{fontSize:13}}>{ax(locale,"guest")}</Label></View>
   </View>
   <Action label={authT(locale,"login")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"login"}})}/>
   <Action kind="secondary" label={authT(locale,"register")} onPress={()=>router.push({pathname:"/auth/[action]",params:{action:"register"}})}/>
  </SectionCard>:<>
   <SectionCard>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:12}}>
     <View style={{width:55,height:55,borderRadius:28,backgroundColor:"#E1F0E9",alignItems:"center",justifyContent:"center"}}>
      <Label weight="bold" style={{fontSize:24,color:colors.primary,textAlign:"center"}}>{user.displayName.trim().charAt(0)||"●"}</Label>
     </View>
     <View style={{flex:1,gap:3,minWidth:0}}>
      <Label weight="bold" style={{fontSize:17}}>{user.displayName}</Label>
      <Label muted style={{fontSize:12}}>{user.email}</Label>
      <StatusBadge tone={verified?"success":"warning"} label={ax(locale,verified?"verified":"unverified")}/>
     </View>
    </View>
    {editing?<View style={{gap:8}}>
     <Label>{ax(locale,"name")}</Label>
     <AppInput accessibilityLabel={ax(locale,"name")} value={name} editable={!busy} maxLength={120} onChangeText={setName}/>
     <Label muted style={{fontSize:12}}>{ax(locale,"nameRules")}</Label>
     <Action label={ax(locale,"save")} disabled={busy||name.trim().length<2} onPress={()=>void updateProfile()}/>
     <Action kind="secondary" label={ax(locale,"cancel")} onPress={()=>setEditing(false)}/>
    </View>:<Action kind="secondary" label={ax(locale,"editProfile")} onPress={()=>{setName(user.displayName);setEditing(true);}}/>}
    {!verified?<Label muted style={{fontSize:13,color:colors.warning}}>{ax(locale,"permission")}</Label>:null}
   </SectionCard>
   <SectionCard>
    {section(ax(locale,"listing"))}
    <Label muted style={{fontSize:13}}>{ax(locale,"listingSubtitle")}</Label>
    {canAdvertise?<><AccountLink icon="⌂" label={ax(locale,"manage")} onPress={()=>router.push("/my-listings")}/>
     <AccountLink icon="＋" label={ax(locale,"create")} onPress={()=>router.push("/listings/new")}/></>:
     <Label muted>{ax(locale,"proIntro")}</Label>}
    <AccountLink icon="✉" label={ax(locale,"inquiries")} onPress={()=>router.push("/(tabs)/inbox")}/>
   </SectionCard>
   <SectionCard>
    {section(ax(locale,"professional"))}
    <Label muted style={{fontSize:13}}>{ax(locale,"professionalDetails")}</Label>
    <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center",gap:8,flexWrap:"wrap"}}>
     <Label weight="medium">{ax(locale,"personalAdvertiser")}</Label>
     <StatusBadge tone={user.advertiserEnabled?"success":"neutral"} label={user.advertiserEnabled?ax(locale,"active"):ax(locale,"notApplied")}/>
    </View>
    {!user.advertiserEnabled?<><DirectionalRow style={{gap:12}}>
     <Switch accessibilityLabel={ax(locale,"terms")} value={accept} onValueChange={setAccept} disabled={busy||!verified}/>
     <View style={{flex:1}}><Label style={{fontSize:13}}>{ax(locale,"terms")}</Label></View>
    </DirectionalRow>
     <Action disabled={busy||!accept||!verified} label={ax(locale,"enable")} onPress={()=>void activate()}/></>:null}
    <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,alignItems:"center",flexWrap:"wrap"}}>
     <Label weight="medium">{ax(locale,"agent")}</Label>
     <StatusBadge label={professionalStatus(locale,user.independentAgentStatus)}
      tone={user.independentAgentStatus==="approved"?"success":user.independentAgentStatus==="pending"?"warning":"neutral"}/>
    </View>
    {user.independentAgentStatus!=="approved"&&user.independentAgentStatus!=="pending"?
     <AccountLink icon="✦" label={ax(locale,"agentCreate")} disabled={!verified} onPress={()=>router.push("/agent/apply")}/>:null}
    {user.independentAgentStatus==="approved"?
     <AccountLink icon="◇" label={ax(locale,"plans")} onPress={()=>router.push("/upgrade")}/>:null}
   </SectionCard>
   <SectionCard>
    {section(ax(locale,"agency"))}
    {agencies.length===0?<Label muted style={{fontSize:13}}>{ax(locale,"none")}</Label>:null}
    {agencies.map(a=><View key={a.agencyId} style={{gap:8,borderWidth:1,borderColor:colors.border,borderRadius:12,padding:12}}>
     <Label weight="medium">{a.name}</Label>
     <View style={{flexDirection:rtl?"row-reverse":"row",gap:8,flexWrap:"wrap"}}>
      <StatusBadge tone={a.agencyStatus==="active"?"success":"warning"}
       label={a.agencyStatus==="active"?ax(locale,"approved"):ax(locale,"pending")}/>
      <Label muted style={{fontSize:12}}>{a.role}</Label>
     </View>
     {a.agencyStatus==="active"&&a.membershipStatus==="pending"&&a.role!=="owner"?
      <Action kind="secondary" disabled={busy||!verified} label={ax(locale,"accept")} onPress={()=>void acceptInvitation(a)}/>:null}
     {a.agencyStatus==="active"&&a.membershipStatus==="active"?
      <AccountLink icon="▦" label={ax(locale,"agency")} onPress={()=>router.push({pathname:"/agency/[id]",params:{id:a.agencyId}})}/>:null}
    </View>)}
    <AccountLink icon="＋" label={ax(locale,"agencyCreate")} disabled={!verified} onPress={()=>router.push("/agency/apply")}/>
   </SectionCard>
   <SectionCard>
    {section(ax(locale,"help"))}
    <AccountLink icon="?" label={ax(locale,"support")} onPress={()=>router.push("/support")}/>
    <AccountLink icon="⚑" label={ax(locale,"safety")} onPress={()=>router.push("/safety")}/>
   </SectionCard>
   <SectionCard>
    {section(ax(locale,"settings"))}
    <AccountLink icon="▣" label={ax(locale,"security")} subtitle={ax(locale,"sessionNote")} onPress={()=>router.push("/account-sessions")}/>
    <AccountLink icon="◉" label={ax(locale,"push")} onPress={()=>router.push("/notification-settings")}/>
    <Label weight="medium">{ax(locale,"language")}</Label>
    <LanguagePicker/>
    <Label muted style={{fontSize:12}}>{ax(locale,"province")}: {findProvince(provinceId)?.names[locale]}</Label>
    <Action kind="secondary" label={ax(locale,"refresh")} onPress={()=>{void refresh();void loadAgencies();}} disabled={busy}/>
    <Action kind="secondary" label={ax(locale,"logout")} onPress={logout}/>
   </SectionCard>
  </>}
  {error?<StateNotice message={error} retryLabel={ax(locale,"refresh")} onRetry={()=>{void loadAgencies();void refresh();}}/>:null}
  {notice?<SectionCard><Label style={{color:colors.success}}>{notice}</Label></SectionCard>:null}
 </Page>;
}
