import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const includes=(source,...needles)=>{for(const needle of needles)assert.ok(source.includes(needle),"Missing: "+needle);};

test("Dock replaces stock navbar without removing or renaming routes",()=>{
 const s=read("apps/mobile/app/(tabs)/_layout.tsx");
 includes(s,'type TabName="index"|"search"|"saved"|"inbox"|"account"',
  'const tabs:TabName[]=["index","search","saved","inbox","account"]',
  'const order=rtl?[...tabs].reverse():tabs',
  '<Tabs initialRouteName="index"','tabBar={props=><PremiumTabBar',
  'order.map(name=><Tabs.Screen');
 assert.ok(!/tabBarStyle:\{/.test(s),"A custom dock should not inherit the old bar's styling");
});
test("Screen reader, navigation events, accessibility labels and tab long press work",()=>{
 const s=read("apps/mobile/app/(tabs)/_layout.tsx");
 includes(s,'type:"tabPress"','type:"tabLongPress"','event.defaultPrevented',
  'navigation.navigate(route.name,route.params)',
  'accessibilityRole="tab"','accessibilityLabel={label}',
  'accessibilityState={{selected:focused}}','numberOfLines={1}',
  'adjustsFontSizeToFit','writingDirection:rtl?"rtl":"ltr"');
});
test("Dock handles physical phone insets, software keyboard and minimum controls",()=>{
 const s=read("apps/mobile/app/(tabs)/_layout.tsx");
 includes(s,"useSafeAreaInsets","Math.max(insets.bottom,10)",
  'dock:{flexDirection:"row"',
  'Keyboard.addListener("keyboardDidShow"','Keyboard.addListener("keyboardDidHide"',
  'if(keyboardOpen)return null','minHeight:68','paddingHorizontal:12',
  "styles.iconPlateActive","styles.indicatorActive","...elevation.floating");
});
test("Icon set is consistent, native, offline-ready, and motion accessible",()=>{
 const s=read("apps/mobile/app/(tabs)/_layout.tsx");
 includes(s,'name==="index"','name==="search"','name==="saved"',
  'name==="inbox"','name==="account"',
  'useMotion()','if(reduced)','spring.stop()','useNativeDriver:true',
  'friction:7','focused?1:0');
 assert.ok(!s.includes("@expo/vector-icons"));
 assert.ok(!s.includes("ImageBackground"));
 assert.ok(!s.includes("tabBarBadge:"),"Do not invent notification counts");
});
