import {router} from "expo-router";
import {useEffect} from "react";
import {AppState} from "react-native";
import {useAuth} from "./auth";
import {nativePushAvailable,routeForNotification,synchronizeCurrentDevice} from "./push-client";

/** Push does not request permission on launch. Account > Notifications owns consent. */
export function PushBridge(){
 const {token,user}=useAuth();
 useEffect(()=>{
  if(!token||!user?.verified||!nativePushAvailable())return;
  let live=true,lastSync=0;
  let responseSubscription:{remove:()=>void}|undefined;
  let tokenSubscription:{remove:()=>void}|undefined;
  let stateSubscription:{remove:()=>void}|undefined;
  const synchronize=(force=false)=>{
   if(!live||!force&&Date.now()-lastSync<15*60_000)return;
   lastSync=Date.now();
   void synchronizeCurrentDevice(token).catch(()=>{}); // Offline must not log out or prompt.
  };
  const route=(payload:unknown)=>{
   if(!live||!payload||typeof payload!=="object")return;
   const data=payload as Record<string,unknown>;
   // An older user's push may still reach this installation after offline
   // logout. Never deep-link a previous account's notification into this one.
   if(data.recipientId!==user.id)return;
   router.push(routeForNotification(data));
  };
  void import("expo-notifications").then(async Notifications=>{
   if(!live)return;
   Notifications.setNotificationHandler({handleNotification:async()=>({
    shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false
   })});
   responseSubscription=Notifications.addNotificationResponseReceivedListener(response=>{
    route(response.notification.request.content.data);
   });
   tokenSubscription=Notifications.addPushTokenListener(()=>synchronize(true));
   // Account session must have hydrated before navigating from a cold-start push tap.
   const last=await Notifications.getLastNotificationResponseAsync().catch(()=>null);
   if(last){route(last.notification.request.content.data);
    await Notifications.clearLastNotificationResponseAsync().catch(()=>{});
   }
  }).catch(()=>{});
  stateSubscription=AppState.addEventListener("change",s=>{if(s==="active")synchronize();});
  synchronize(true);
  return ()=>{live=false;responseSubscription?.remove();tokenSubscription?.remove();stateSubscription?.remove();};
 },[token,user?.verified,user?.id]);
 return null;
}
