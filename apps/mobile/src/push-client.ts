import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import {Platform} from "react-native";
import {requestJson} from "./auth";

const INSTALL_KEY="amlaklink:push-installation:v1";
export type PushPreferences={enabled:boolean;savedSearches:boolean;inquiries:boolean;viewings:boolean;
 account:boolean;enabledAt:string|null;updatedAt?:string};
export type PushSettings={preferences:PushPreferences;registeredDevices:number;serverConfigured:boolean};
export function nativePushAvailable(){
 return Platform.OS!=="web"&&Constants.appOwnership!=="expo";
}
export function projectId(){
 const config=Constants.expoConfig?.extra as {eas?:{projectId?:string}}|undefined;
 return process.env.EXPO_PUBLIC_EAS_PROJECT_ID||Constants.easConfig?.projectId||config?.eas?.projectId;
}
async function installationId(){
 let value=await SecureStore.getItemAsync(INSTALL_KEY);
 if(!value){value=Crypto.randomUUID();await SecureStore.setItemAsync(INSTALL_KEY,value);}
 return value;
}
export async function readPushSettings(token:string){
 return requestJson<PushSettings>("/v1/push/preferences",{token});
}
export async function checkSystemPermission(){
 if(!nativePushAvailable())return "dev-build-required" as const;
 const Notifications=await import("expo-notifications");
 const value=await Notifications.getPermissionsAsync();
 return value.granted?"granted" as const:value.canAskAgain?"not-granted" as const:"blocked" as const;
}
export async function registerCurrentDevice(token:string,askPermission:boolean){
 if(!nativePushAvailable())throw Error("PUSH_DEV_BUILD_REQUIRED");
 if(!Device.isDevice)throw Error("PUSH_PHYSICAL_DEVICE_REQUIRED");
 const id=projectId();
 if(!id||!/^[0-9a-fA-F-]{36}$/.test(id))throw Error("EAS_PROJECT_ID_REQUIRED");
 const Notifications=await import("expo-notifications");
 if(Platform.OS==="android"){
  await Notifications.setNotificationChannelAsync("amlaklink-alerts",{
   name:"AmlakLink alerts",importance:Notifications.AndroidImportance.DEFAULT
  });
 }
 let permission=await Notifications.getPermissionsAsync();
 if(!permission.granted&&askPermission&&permission.canAskAgain)
  permission=await Notifications.requestPermissionsAsync();
 if(!permission.granted)throw Error("PUSH_PERMISSION_NOT_GRANTED");
 const expoToken=(await Notifications.getExpoPushTokenAsync({projectId:id})).data;
 await requestJson("/v1/push/devices",{method:"POST",token,
  body:{installationId:await installationId(),projectId:id,platform:Platform.OS,expoToken}});
 return expoToken;
}
export async function unregisterCurrentDevice(token:string){
 const id=await SecureStore.getItemAsync(INSTALL_KEY);
 if(!id)return;
 await requestJson("/v1/push/devices/"+id,{method:"DELETE",token});
}
export async function synchronizeCurrentDevice(token:string){
 if(!nativePushAvailable())return;
 const result=await readPushSettings(token);
 if(!result.serverConfigured||!result.preferences.enabled)return;
 if(await checkSystemPermission()!=="granted"){
  // Respect a permission revoked from Android/iOS settings without showing a prompt.
  await unregisterCurrentDevice(token);
  return;
 }
 await registerCurrentDevice(token,false);
}
export function routeForNotification(data:Record<string,unknown>){
 const kind=typeof data.kind==="string"?data.kind:"";
 const ref=typeof data.referenceId==="string"&&/^[0-9a-f-]{36}$/i.test(data.referenceId)?
   data.referenceId:null;
 if(kind==="subscription_agency"&&ref)return {pathname:"/agency/[id]/billing" as const,params:{id:ref}};
 if(kind==="subscription_solo")return "/upgrade" as const;
 if(kind==="billing")return "/(tabs)/account" as const;
 if(kind==="saved_search"&&ref)return {pathname:"/property/[id]" as const,params:{id:ref}};
 if(kind==="safety")return "/safety" as const;
 if(kind==="freshness")return "/my-listings" as const;
 if(kind==="support"&&ref)return {pathname:"/support/[id]" as const,params:{id:ref}};
 if(kind==="viewing"&&ref)return {pathname:"/viewings/[id]" as const,params:{id:ref}};
 if(["inquiry","lead","message"].includes(kind)&&ref)
  return {pathname:"/inquiries/[id]" as const,params:{id:ref}};
 return "/(tabs)/inbox" as const;
}
