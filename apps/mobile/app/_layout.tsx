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
  <Stack.Screen name="locations" />
  <Stack.Screen name="auth" />
  <Stack.Screen name="agency" />
  <Stack.Screen name="agent" />
  <Stack.Screen name="listings" />
  <Stack.Screen name="my-listings" />
  <Stack.Screen name="property" />
  <Stack.Screen name="advertiser" />
  <Stack.Screen name="search-map" />
  <Stack.Screen name="report" />
  <Stack.Screen name="safety" />
  <Stack.Screen name="inquiries" />
  <Stack.Screen name="viewings" />
  <Stack.Screen name="shortlists" />
  <Stack.Screen name="support" />
  <Stack.Screen name="saved-searches" />
  <Stack.Screen name="compare" />
  <Stack.Screen name="upgrade" />
  <Stack.Screen name="notification-settings" />
  <Stack.Screen name="account-sessions" />
 </Stack>;
}
export default function RootLayout(){
 return <SafeAreaProvider><MotionProvider><PreferencesProvider><AuthProvider><FavoriteProvider><SearchProvider>
  <NetworkProvider><PushBridge/><NavigationShell/></NetworkProvider>
 </SearchProvider></FavoriteProvider></AuthProvider></PreferencesProvider></MotionProvider></SafeAreaProvider>;
}
