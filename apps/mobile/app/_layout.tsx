import {Stack} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {PreferencesProvider} from "../src/context";
import {AuthProvider} from "../src/auth";
import {SearchProvider} from "../src/search-context";
import {FavoriteProvider} from "../src/favorites";
import {PushBridge} from "../src/push-bridge";
export default function RootLayout(){
 return <SafeAreaProvider><PreferencesProvider><AuthProvider><FavoriteProvider><SearchProvider><PushBridge/><Stack screenOptions={{headerShown:false}}>
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
 </Stack></SearchProvider></FavoriteProvider></AuthProvider></PreferencesProvider></SafeAreaProvider>;
}
