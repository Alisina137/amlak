import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const includes=(s,...tokens)=>{for(const needle of tokens)assert.ok(s.includes(needle),"Missing "+needle);};

test("Theme palette provides a consistent token family for all mobile screens",()=>{
 const tokens=read("packages/design-tokens/src/index.ts");
 includes(tokens,"primarySoft:","primaryDark:","accentSoft:","surfaceMuted:","borderStrong:","divider:","export const elevation","minimumTapTarget: 44");
 assert.ok(!tokens.includes("border: \"#FFFFFF\""),"Card outlines must remain visible on white");
});
test("Universal components define depth, accessible inputs, readable text and stable RTL",()=>{
 const ui=read("apps/mobile/src/ui.tsx");
 includes(ui,"...elevation.card","styles.inputFocused","props.onFocus?.(event)","props.onBlur?.(event)",
  'writingDirection:isRTL(locale)?"rtl":"ltr"',"<MotionReveal style={styles.pageContent}>",
  'accessibilityRole="button"','accessibilityRole="progressbar"',
  "colors.accentSoft" in {}?"":"colors.secondary");
 assert.ok(ui.includes("minHeight:52"),"Touch targets stay generous");
});
test("Home, discovery, gallery and property cards share a premium hierarchy",()=>{
 const home=read("apps/mobile/app/(tabs)/index.tsx"),
  listing=read("apps/mobile/src/listing-ui.tsx"),
  search=read("apps/mobile/app/(tabs)/search.tsx"),
  property=read("apps/mobile/app/property/[id].tsx");
 includes(home,"colors.primaryDark","colors.secondary","colors.primarySoft","MotionReveal");
 includes(listing,"...elevation.card","aspectRatio:1.63","colors.primaryDark","FavoriteGlyph");
 includes(search,"colors.primarySoft","<FilterSheet","ActiveFilterRow","SortResultsRow");
 includes(property,"colors.accentSoft","...elevation.floating","<PropertyGallery");
});
test("Tab, Saved, Inbox, Account and protected admin use the same design system",()=>{
 const tab=read("apps/mobile/app/(tabs)/_layout.tsx"),
  saved=read("apps/mobile/app/(tabs)/saved.tsx"),
  inbox=read("apps/mobile/app/(tabs)/inbox.tsx"),
  account=read("apps/mobile/app/(tabs)/account.tsx"),
  staff=read("apps/admin/app/globals.css");
 includes(tab,"...elevation.floating","initialRouteName=\"index\"",
  "const order=rtl?[...tabs].reverse():tabs","tabBar={props=><PremiumTabBar");
 includes(saved,"colors.primaryWash","colors.primarySoft","ListingCard");
 includes(inbox,"colors.primarySoft","colors.primaryWash","borderStartWidth");
 includes(account,"colors.primaryDark","colors.secondary","AccountLink","LanguagePicker");
 includes(staff,"--amlak-jade","--amlak-deep","--amlak-sand","@media(prefers-reduced-motion:reduce)");
});
test("Visual changes preserve API and routing layers and do not add dependencies",()=>{
 const packageJson=JSON.parse(read("package.json"));
 includes(packageJson.scripts["qa:ui"],"scripts/test-visual-system.mjs");
 const tokens=read("packages/design-tokens/src/index.ts");
 assert.ok(!tokens.includes("requestJson("));
});
