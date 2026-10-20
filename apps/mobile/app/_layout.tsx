import {Stack} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {isRTL} from "@amlaklink/localization";
import {PreferencesProvider,usePreferences} from "../src/context";
import {AuthProvider} from "../src/auth";
import {SearchProvider} from "../src/search-context";
import {FavoriteProvider} from "../src/favorites";
import {NetworkProvider} from "../src/api";
import {PushBridge} from "../src/push-bridge";
import {MotionProvider} from "../src/motion";

function NavigationShell(){
 const {locale}=usePreferences();
 return <Stack screenOptions={{headerShown:false,animation:isRTL(locale)?"slide_from_left":"slide_from_right"}}>
  <Stack.Screen name="(tabs)" />
  {/* All other file-based routes register automatically (including /viewings/[id]).
      Folder names without their own _layout.tsx are NOT navigators. */}
 </Stack>;
}
export default function RootLayout(){
 return <SafeAreaProvider><MotionProvider><PreferencesProvider><AuthProvider><FavoriteProvider><SearchProvider>
  <NetworkProvider><PushBridge/><NavigationShell/></NetworkProvider>
 </SearchProvider></FavoriteProvider></AuthProvider></PreferencesProvider></MotionProvider></SafeAreaProvider>;
}
