import {useLocalSearchParams,router} from "expo-router";
import {useState} from "react";
import {Pressable,TextInput,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {isRTL} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
import {useAuth,requestJson,ApiError} from "../../src/auth";
import {authT} from "../../src/auth-copy";
import {Action,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
type ActionType="register"|"login"|"verify"|"recover"|"reset";
export default function AuthAction(){
 const params=useLocalSearchParams<{action:string;email?:string}>(),mode=(["register","login","verify","recover","reset"].includes(params.action)?params.action:"login") as ActionType;
 const {locale}=usePreferences(),{signIn,verify}=useAuth(),rtl=isRTL(locale);
 const [displayName,setName]=useState(""),[email,setEmail]=useState(params.email||""),
 [password,setPassword]=useState(""),[code,setCode]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const to=(action:ActionType,emailValue=email)=>router.replace({pathname:"/auth/[action]",params:{action,email:emailValue}});
 const copy=(key:Parameters<typeof authT>[1])=>authT(locale,key);
 async function submit(){
  if(!email.trim() || (["register","login","reset"].includes(mode)&&!password) || (mode==="register"&&!displayName.trim())||(["verify","reset"].includes(mode)&&!code)){
   setError(copy("required"));return;
  }
  setError("");setNotice("");setBusy(true);
  try{
   if(mode==="register"){
    await requestJson("/v1/auth/register",{method:"POST",body:{email:email.trim(),password,displayName:displayName.trim(),locale}});
    to("verify",email.trim());return;
   }
   if(mode==="login"){
    await signIn(email.trim(),password);router.replace("/(tabs)/account");return;
   }
   if(mode==="verify"){
    await verify(email.trim(),code);router.replace("/(tabs)/account");return;
   }
   if(mode==="recover"){
    await requestJson("/v1/auth/recover",{method:"POST",body:{email:email.trim()}});
    to("reset",email.trim());return;
   }
   await requestJson("/v1/auth/recover/complete",{method:"POST",body:{email:email.trim(),code,newPassword:password}});
   to("login",email.trim());
  }catch(err){
   if(err instanceof ApiError && err.code==="API_NOT_CONFIGURED")setError(copy("noConnection"));
   else if(err instanceof ApiError && err.code==="CONTACT_NOT_VERIFIED")to("verify",email.trim());
   else setError(copy("attempt"));
  }finally{setBusy(false);}
 }
 async function resend(){
  setBusy(true);setError("");
  try{await requestJson("/v1/auth/resend-verification",{method:"POST",body:{email:email.trim()}});setNotice(copy("codeSent"));}
  catch{setError(copy("attempt"));}finally{setBusy(false);}
 }
 const title=mode==="register"?"register":mode==="login"?"login":mode==="verify"?"verify":mode==="recover"?"recover":"finishRecovery";
 return <Page>
  <View style={{flexDirection:rtl?"row-reverse":"row",alignItems:"center"}}>
   <Pressable accessibilityRole="button" onPress={()=>router.replace("/(tabs)/account")} style={{minWidth:44,minHeight:44,justifyContent:"center"}}>
    <Label>←</Label>
   </Pressable>
  </View>
  <ScreenHeading title={copy(title)} subtitle={mode==="recover"?copy("forgotHelp"):mode==="register"?copy("pwdRules"):undefined}/>
  <SectionCard>
   {mode==="register"?<Field label={copy("name")} value={displayName} change={setName} rtl={rtl}/>:null}
   <Field label={copy("email")} value={email} change={setEmail} rtl={false} keyboardType="email-address"/>
   {["login","register","reset"].includes(mode)?<Field label={copy(mode==="reset"?"newPassword":"password")} value={password} change={setPassword} rtl={false} secure />:null}
   {["verify","reset"].includes(mode)?<Field label={copy("code")} value={code} change={setCode} rtl={false} keyboardType="number-pad" maxLength={6}/>:null}
   {error?<Label style={{color:colors.error}}>{error}</Label>:null}
   {notice?<Label style={{color:colors.success}}>{notice}</Label>:null}
   <Action disabled={busy} label={busy?copy("processing"):copy("send")} onPress={()=>void submit()} />
   {mode==="login"?<Action kind="secondary" label={copy("forgot")} onPress={()=>to("recover")}/>:null}
   {mode==="login"?<Action kind="secondary" label={copy("needAccount")} onPress={()=>to("register")}/>:null}
   {mode==="register"?<Action kind="secondary" label={copy("haveAccount")} onPress={()=>to("login")}/>:null}
   {mode==="verify"?<Action kind="secondary" disabled={busy} label={copy("resend")} onPress={()=>void resend()}/>:null}
   {mode==="reset"?<Label muted>{copy("recoverySent")}</Label>:null}
  </SectionCard>
 </Page>;
}
function Field({label,value,change,rtl,secure=false,keyboardType="default",maxLength}:{
 label:string;value:string;change:(s:string)=>void;rtl:boolean;secure?:boolean;keyboardType?:"default"|"email-address"|"number-pad";maxLength?:number;
}){
 return <View style={{gap:6}}>
  <Label weight="medium">{label}</Label>
  <TextInput autoCapitalize="none" keyboardType={keyboardType} secureTextEntry={secure}
   accessibilityLabel={label} value={value} onChangeText={change} maxLength={maxLength} autoCorrect={false}
   style={{minHeight:48,padding:12,borderRadius:12,borderWidth:1,borderColor:colors.border,color:colors.text,fontSize:16,textAlign:rtl?"right":"left"}} />
 </View>;
}
