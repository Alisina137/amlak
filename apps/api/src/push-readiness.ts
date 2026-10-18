/** Offline-only push deployment preflight. This cannot inspect EAS credential vaults
 * or prove that a real handset received an FCM/APNs notification. */
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function pushReadiness(env:Record<string,string|undefined>){
 const blocking:string[]=[];
 if(env.AMLAK_PUSH_ENABLED!=="true")blocking.push("AMLAK_PUSH_ENABLED must be true (push is intentionally off by default).");
 if(!env.AMLAK_EXPO_PROJECT_ID||!uuid.test(env.AMLAK_EXPO_PROJECT_ID))
  blocking.push("AMLAK_EXPO_PROJECT_ID must contain your real EAS project UUID.");
 if(env.EXPO_PUBLIC_EAS_PROJECT_ID){
  if(!uuid.test(env.EXPO_PUBLIC_EAS_PROJECT_ID))blocking.push("EXPO_PUBLIC_EAS_PROJECT_ID is not a valid EAS project UUID.");
  else if(env.AMLAK_EXPO_PROJECT_ID&&env.EXPO_PUBLIC_EAS_PROJECT_ID.toLowerCase()!==env.AMLAK_EXPO_PROJECT_ID.toLowerCase())
   blocking.push("Server and mobile EAS project UUIDs do not match.");
 }
 return {environmentReady:blocking.length===0,blocking,
  externalChecks:[
   "EAS project exists and app builds are linked to its actual UUID.",
   "FCM V1 credentials are provisioned in the EAS/Expo project and match the Android package.",
   "If Expo enhanced push security is enabled, EXPO_PUSH_ACCESS_TOKEN is set on the worker (never in EXPO_PUBLIC_*).",
   "A physical Android device has the matching development/preview APK installed (Expo Go is unsupported).",
   "Device OS notification permission is granted and the user opted in under Account > Push notifications.",
   "An authorized push worker is scheduled and its tickets/receipts are monitored.",
   "A user-triggered /v1/push/test notification reaches the device and opens only the matching signed-in account.",
   "Opt-out, account switching, OS permission revocation, unreachable network and invalid FCM/device tokens are tested."
  ],
  notice:"Green environment checks do not verify remote FCM/APNs credentials or physical-device delivery."};
}
