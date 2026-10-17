import {router,useLocalSearchParams} from "expo-router";
import {useEffect,useState} from "react";
import {TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {useAuth,requestJson} from "../../src/auth";
import {authT} from "../../src/auth-copy";
import {usePreferences} from "../../src/context";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
type Workspace={agency:{name:string;status:string};membership:{role:string};canManageMembers:boolean;canSubmitListing:boolean};
type Member={id:string;displayName:string;role:string;status:string};
export default function AgencyWorkspace(){
 const {id}=useLocalSearchParams<{id:string}>(),{locale}=usePreferences(),{token}=useAuth();
 const [workspace,setWorkspace]=useState<Workspace|null>(null),[members,setMembers]=useState<Member[]>([]);
 const [email,setEmail]=useState(""),[role,setRole]=useState<"agent"|"manager">("agent"),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const t=(key:Parameters<typeof authT>[1])=>authT(locale,key);
 const load=async()=>{
  if(!token||!id)return;
  try{
   const w=await requestJson<Workspace>("/v1/agencies/"+id+"/workspace",{token});setWorkspace(w);
   const m=await requestJson<{items:Member[]}>("/v1/agencies/"+id+"/members",{token});setMembers(m.items);
  }catch{setWorkspace(null);setError(t("join"));}
 };
 useEffect(()=>{void load();},[id,token]);
 async function addMember(){
  if(!token||!id)return;setBusy(true);setError("");
  try{await requestJson("/v1/agencies/"+id+"/members",{token,method:"POST",body:{email,role}});
  setEmail("");await load();}catch{setError(t("attempt"));}finally{setBusy(false);}
 }
 return <Page><ScreenHeading title={workspace?.agency.name||t("workspace")} subtitle={t("join")}/>
 {workspace?<SectionCard>
  <Label weight="bold">{t("status")}: {workspace.agency.status} · {workspace.membership.role}</Label>
  <Action label={locale==="en"?"Create agency listing":"ثبت ملک برای دفتر"} onPress={()=>router.push({pathname:"/listings/new",params:{agencyId:id}})}/>
  <Action kind="secondary" label={locale==="en"?"Agency properties":"ملک‌های دفتر"} onPress={()=>router.push({pathname:"/agency/[id]/properties",params:{id}})}/>
  <Label weight="bold">{t("members")}</Label>
  {members.map(m=><Label key={m.id}>{m.displayName} · {m.role}</Label>)}
  {workspace.canManageMembers?<View style={{gap:10}}>
   <Label weight="bold">{t("addMember")}</Label>
   <TextInput accessibilityLabel={t("memberEmail")} placeholder={t("memberEmail")} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
    style={{minHeight:46,borderColor:colors.border,borderWidth:1,borderRadius:12,padding:10,fontSize:16,color:colors.text}}/>
   <View style={{flexDirection:"row",gap:8}}>
    <View style={{flex:1}}><Action kind={role==="agent"?"primary":"secondary"} label={t("agent")} onPress={()=>setRole("agent")}/></View>
    <View style={{flex:1}}><Action kind={role==="manager"?"primary":"secondary"} label={t("manager")} onPress={()=>setRole("manager")}/></View>
   </View>
   <Action disabled={busy||!email.includes("@")} label={t("addMember")} onPress={()=>void addMember()}/>
  </View>:null}
 </SectionCard>:null}
 {error?<Label style={{color:colors.error}}>{error}</Label>:null}
 <Action kind="secondary" label={t("goAccount")} onPress={()=>router.replace("/(tabs)/account")}/>
 </Page>;
}
