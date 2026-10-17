import {Stack} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {PreferencesProvider} from "../src/context";
import {AuthProvider} from "../src/auth";
export default function RootLayout(){
 return <SafeAreaProvider><PreferencesProvider><AuthProvider><Stack screenOptions={{headerShown:false}}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="locations" />
  <Stack.Screen name="auth" />
  <Stack.Screen name="agency" />
  <Stack.Screen name="agent" />
 </Stack></AuthProvider></PreferencesProvider></SafeAreaProvider>;
}
