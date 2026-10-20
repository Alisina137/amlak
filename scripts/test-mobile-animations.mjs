import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
function includes(source,...items){for(const item of items)assert.ok(source.includes(item),"Missing: "+item);}
test("Native-driver animations respect OS reduced-motion preference and are canceled",()=>{
 const s=read("apps/mobile/src/motion.tsx");
 includes(s,"AccessibilityInfo.isReduceMotionEnabled","reduceMotionChanged","sub.remove()",
  "reduced","useNativeDriver:true","animation.stop()","opacity.stopAnimation()","scale.stopAnimation()",
  "Animated.loop","onLoad","onError","FavoriteGlyph","MotionReveal","usePressScale");
 assert.ok(!s.includes("setInterval("),"No long-running animation intervals");
 assert.ok(!s.includes("useNativeDriver:false"),"Opacity/transform animate natively");
 const root=read("apps/mobile/app/_layout.tsx");
 includes(root,"<MotionProvider>","</MotionProvider>");
});
test("Shared UI uses native page reveal, tactile buttons and loading pulse",()=>{
 const s=read("apps/mobile/src/ui.tsx");
 includes(s,"<MotionReveal style={styles.pageContent}>","onPressIn={motion.onPressIn}",
  "onPressOut={motion.onPressOut}","<MotionSkeleton>","accessibilityRole=\"button\"",
  "accessibilityRole=\"progressbar\"");
});
test("Explore, listing cards, gallery, detail, navigation and inbox animate",()=>{
 const home=read("apps/mobile/app/(tabs)/index.tsx"),
  listing=read("apps/mobile/src/listing-ui.tsx"),
  gallery=read("apps/mobile/src/property-gallery.tsx"),
  detail=read("apps/mobile/app/property/[id].tsx"),
  tab=read("apps/mobile/app/(tabs)/_layout.tsx"),
  inbox=read("apps/mobile/app/(tabs)/inbox.tsx"),
  sections=read("apps/mobile/src/home-sections.tsx");
 includes(home,"<MotionReveal delay={45}>","<MotionReveal delay={95}>","<MotionReveal delay={135}>");
 includes(listing,"motion.pressStyle","<MotionImage imageKey={photo}","<FavoriteGlyph");
 includes(gallery,"<MotionImage imageKey={photo.id}","<MotionReveal delay={30}>","pagingEnabled",
  "setFullScreen(true)");
 includes(detail,"<FavoriteGlyph saved={isSaved(id)}/>","<MotionReveal delay={35}>","<MotionReveal delay={85}>");
 includes(tab,"<PremiumTabIcon","useMotion()","friction:7","focused?1:0","useNativeDriver:true");
 includes(inbox,'key="inquiries-controls"','key="viewings-controls"','key="notifications-controls"');
 includes(sections,"<MotionSkeleton>");
});
test("Animations do not require haptics, new providers, or changes to network writes",()=>{
 const p=JSON.parse(read("apps/mobile/package.json"));
 assert.equal(p.dependencies["react-native"],"0.86.3");
 assert.ok(!p.dependencies["expo-haptics"]);
 const s=read("apps/mobile/src/motion.tsx");
 assert.ok(!/fetch\(|requestJson\(|router\.push\(/.test(s),"Only presentation events belong in motion");
});
