import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PreferencesProvider } from "../src/context";
export default function RootLayout(){
 return <SafeAreaProvider><PreferencesProvider><Stack screenOptions={{headerShown:false}}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="locations" />
 </Stack></PreferencesProvider></SafeAreaProvider>;
}
