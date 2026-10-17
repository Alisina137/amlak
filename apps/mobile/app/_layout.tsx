import {Stack} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {PreferencesProvider} from "../src/context";
import {AuthProvider} from "../src/auth";
import {SearchProvider} from "../src/search-context";
import {FavoriteProvider} from "../src/favorites";
export default function RootLayout(){
 return <SafeAreaProvider><PreferencesProvider><AuthProvider><FavoriteProvider><SearchProvider><Stack screenOptions={{headerShown:false}}>
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
 </Stack></SearchProvider></FavoriteProvider></AuthProvider></PreferencesProvider></SafeAreaProvider>;
}
