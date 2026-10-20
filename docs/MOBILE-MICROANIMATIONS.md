# Mobile microanimations — AmlakLink

Lightweight, native-driver animations across high-traffic parts of the mobile app, **without changing features, routes, backend contracts or saved-data handling**.

## Where

- **All pages using Page:** subtle 230ms entrance fade with 10px upward translation, only when screen content mounts.
- **Buttons, chips and Back:** gentle 0.974 scale when pressed, spring back on release, disabled actions remain disabled.
- **Bottom tabs:** small selected-icon spring emphasis, keeping existing five-tab order, locale direction and accessibility.
- **Home:** staggered search, property categories, featured results; loading placeholders pulse rather than remain static.
- **Listing cards:** press feedback, photo fade once loaded, saved heart bounce on real state changes, not during data hydration.
- **Property details and photos:** hero and price section reveal, filtered gallery photo fade, native fullscreen modal and horizontal swipe remain intact, save heart bounce.
- **Inbox:** brief transitions for Messages, Viewings and Notifications filter panels.
- **Skeleton loading:** native opacity pulse, stopped when no longer loading and when reduced motion is requested.

## Accessibility and performance

- The app has **one** `AccessibilityInfo.isReduceMotionEnabled` + `reduceMotionChanged` listener in `MotionProvider`. Reduced-motion users see the full screen immediately without fades, scales, springs or pulsing.
- Animations use only transform and opacity with React Native native-driver APIs; no layout/height animations, JS timers or image-heavy crossfades.
- All `Animated.timing`, `Animated.spring`, `Animated.loop` activities cancel on unmount or preference change. Skeleton pulsing stops on unmount.
- Existing tab gesture, gallery scroll, keyboard/safe area and RTL alignment unchanged. Animated images keep error/retry fallback.
- No additional npm packages or migration. Works in Expo Go with the existing RN/Expo setup.

## Validation

CI: `pnpm check`, `pnpm qa:ui`, admin build and Expo Android export. New static regression checks live in `scripts/test-mobile-animations.mjs`.

**Manual device checks required:** real Android phone and iOS if shipping. In Android settings enable *Remove animations* or *Reduce motion* and verify pages, tabs, hearts, loaders and gallery show instantly; re-enable to check smoothness on low-end hardware. Exercise fast repeated button presses, background/foreground, screen transition mid-animation, slow images, scrolling long searches/inbox, RTL Dari and Pashto, English LTR and screen readers. Automated Expo export is not a real-device frame-rate/accessibility test.
