import {useLocalSearchParams,router} from "expo-router";
import {useEffect,useRef,useState} from "react";
import {Pressable,View} from "react-native";
import {colors} from "@amlaklink/design-tokens";
import {usePreferences} from "../../src/context";
import {useAuth,requestJson,ApiError} from "../../src/auth";
import {authT} from "../../src/auth-copy";
import {au,validEmail,validPassword} from "../../src/auth-experience";
import {Action,AppInput,BackButton,Label,Page,ScreenHeading,SectionCard,StateNotice} from "../../src/ui";
type ActionType="register"|"login"|"verify"|"recover"|"reset";
export default function AuthAction(){
 const params=useLocalSearchParams<{action:string;email?:string;returnPropertyId?:string}>(),
  mode=(["register","login","verify","recover","reset"].includes(params.action)?params.action:"login") as ActionType;
 const {locale}=usePreferences(),{signIn,verify}=useAuth();
 const [displayName,setName]=useState(""),[email,setEmail]=useState(params.email||""),
  [password,setPassword]=useState(""),[code,setCode]=useState(""),[showPassword,setShowPassword]=useState(false),
  [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),
  [seconds,setSeconds]=useState(0);
 const lock=useRef(false);
 useEffect(()=>{if(!seconds)return;const timer=setTimeout(()=>setSeconds(v=>Math.max(0,v-1)),1000);return()=>clearTimeout(timer);},[seconds]);
 const to=(action:ActionType,emailValue=email)=>{
  setPassword("");setCode("");setError("");setNotice("");setSeconds(0);
  router.replace({pathname:"/auth/[action]",params:{action,email:emailValue,returnPropertyId:params.returnPropertyId}});
 };
 const copy=(key:Parameters<typeof authT>[1])=>authT(locale,key);
 const validForm=validEmail(email)&&
  (mode!=="register"||(displayName.trim().length>=2&&displayName.trim().length<=120&&validPassword(password)))&&
  (mode!=="login"||password.length>0)&&
  (mode!=="reset"||validPassword(password)&&/^\d{6}$/.test(code))&&
  (mode!=="verify"||/^\d{6}$/.test(code));
 function errorForForm(){
  if(!validEmail(email))return au(locale,"invalidEmail");
  if(mode==="register"&&(displayName.trim().length<2||displayName.trim().length>120))return au(locale,"invalidName");
  if(["register","reset"].includes(mode)&&!validPassword(password))return au(locale,"invalidPassword");
  if(mode==="login"&&!password)return au(locale,"required");
  if(["verify","reset"].includes(mode)&&!/^\d{6}$/.test(code))return au(locale,"invalidCode");
  return au(locale,"required");
 }
 async function submit(){
  if(lock.current||busy)return;
  if(!validForm){setError(errorForForm());return;}
  lock.current=true;setBusy(true);setError("");setNotice("");
  try{
   const address=email.trim().toLowerCase();
   if(mode==="register"){
    await requestJson("/v1/auth/register",{method:"POST",body:{email:address,password,displayName:displayName.trim(),locale}});
    to("verify",address);return;
   }
   if(mode==="login"){
    await signIn(address,password);
    setPassword("");
    router.replace(params.returnPropertyId?{pathname:"/property/[id]",params:{id:params.returnPropertyId}}:"/(tabs)/account");return;
   }
   if(mode==="verify"){
    await verify(address,code);
    setCode("");
    router.replace(params.returnPropertyId?{pathname:"/property/[id]",params:{id:params.returnPropertyId}}:"/(tabs)/account");return;
   }
   if(mode==="recover"){
    await requestJson("/v1/auth/recover",{method:"POST",body:{email:address}});
    to("reset",address);return;
   }
   await requestJson("/v1/auth/recover/complete",{method:"POST",body:{email:address,code,newPassword:password}});
   to("login",address);setNotice(copy("success"));
  }catch(err){
   if(err instanceof ApiError&&err.code==="API_NOT_CONFIGURED")setError(copy("noConnection"));
   else if(err instanceof ApiError&&err.code==="CONTACT_NOT_VERIFIED")to("verify",email.trim());
   else if(err instanceof ApiError&&["NETWORK_UNAVAILABLE","REQUEST_TIMEOUT"].includes(err.code))setError(au(locale,"timeout"));
   else setError(au(locale,"failed"));
  }finally{lock.current=false;setBusy(false);}
 }
 async function resend(){
  if(lock.current||busy||seconds>0||!validEmail(email))return;
  lock.current=true;setBusy(true);setError("");
  try{
   await requestJson("/v1/auth/resend-verification",{method:"POST",body:{email:email.trim().toLowerCase()}});
   setSeconds(60);setNotice(copy("codeSent"));
  }catch{setError(au(locale,"failed"));}finally{lock.current=false;setBusy(false);}
 }
 const title=mode==="register"?"register":mode==="login"?"login":mode==="verify"?"verify":mode==="recover"?"recover":"finishRecovery";
 const subtitle=mode==="register"?au(locale,"signup"):mode==="login"?au(locale,"login"):
  mode==="verify"?au(locale,"verifyHelp"):mode==="recover"?au(locale,"recoverHelp"):au(locale,"resetHelp");
 return <Page>
  <BackButton onPress={()=>router.replace("/(tabs)/account")}/>
  <ScreenHeading title={copy(title)} subtitle={subtitle}/>
  <SectionCard>
   <Label muted style={{fontSize:13}}>{au(locale,"emailHelp")}</Label>
   {mode==="register"?<Field label={copy("name")} value={displayName} change={setName} maxLength={120}/>:null}
   <Field label={copy("email")} value={email} change={setEmail} maxLength={254} inputDirection="ltr" keyboardType="email-address"/>
   {["login","register","reset"].includes(mode)?<View style={{gap:7}}>
    <Field label={copy(mode==="reset"?"newPassword":"password")} value={password}
     change={setPassword} maxLength={128} inputDirection="ltr" secure={!showPassword}/>
    <Pressable accessibilityRole="button" accessibilityLabel={au(locale,showPassword?"hide":"show")}
     onPress={()=>setShowPassword(s=>!s)} style={{alignSelf:"flex-start",minHeight:44,justifyContent:"center",paddingHorizontal:8}}>
     <Label style={{fontSize:13,color:colors.primary}}>{au(locale,showPassword?"hide":"show")}</Label>
    </Pressable>
    {mode!=="login"?<Label muted style={{fontSize:12}}>{validPassword(password)?au(locale,"strong"):au(locale,"passwordHint")}</Label>:null}
   </View>:null}
   {["verify","reset"].includes(mode)?<Field label={copy("code")} value={code} change={v=>setCode(v.replace(/[^0-9]/g,"").slice(0,6))}
    inputDirection="ltr" keyboardType="number-pad" maxLength={6}/>:null}
   {error?<StateNotice message={error}/>:null}
   {notice?<Label style={{color:colors.success,fontSize:13}}>{notice}</Label>:null}
   <Action disabled={busy||!validForm} label={busy?au(locale,"submitting"):copy("send")} onPress={()=>void submit()}/>
   {!validForm?<Label muted style={{fontSize:12}}>{au(locale,"disabled")}</Label>:null}
   {mode==="login"?<Action kind="secondary" label={copy("forgot")} onPress={()=>to("recover")}/>:null}
   {mode==="login"?<Action kind="secondary" label={copy("needAccount")} onPress={()=>to("register")}/>:null}
   {mode==="register"?<Action kind="secondary" label={copy("haveAccount")} onPress={()=>to("login")}/>:null}
   {mode==="verify"?<Action kind="secondary" disabled={busy||seconds>0||!validEmail(email)}
    label={seconds?au(locale,"resendWait")+" ("+seconds+"s)":copy("resend")} onPress={()=>void resend()}/>:null}
   {mode==="reset"?<Label muted>{copy("recoverySent")}</Label>:null}
  </SectionCard>
 </Page>;
}
function Field({label,value,change,secure=false,keyboardType="default",maxLength,inputDirection="auto"}:{
 label:string;value:string;change:(s:string)=>void;secure?:boolean;
 keyboardType?:"default"|"email-address"|"number-pad";maxLength?:number;inputDirection?:"auto"|"ltr";
}){
 return <View style={{gap:6}}>
  <Label weight="medium">{label}</Label>
  <AppInput autoCapitalize="none" keyboardType={keyboardType} secureTextEntry={secure}
   accessibilityLabel={label} value={value} onChangeText={change} maxLength={maxLength} autoCorrect={false}
   inputDirection={inputDirection}/>
 </View>;
}
