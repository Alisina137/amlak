# AmlakLink — Unified Visual Refresh

## Intent and scope

Bring a coherent, premium real-estate experience to **the entire existing mobile app** and its protected staff portal without changing account authorization, data contracts, listing lifecycle, accessibility semantics, or the five bottom-navigation destinations.

Design direction: **deep Afghan jade, soft limestone backgrounds and restrained sand-gold highlights**, with calmer surfaces, readable body text, friendly controls and property photography as the focus. This is a UI/design implementation, **not** a change to availability, payments, authentication, or source-of-truth status.

## Shared, app-wide changes

- **Design tokens:** semantic surfaces, muted/strong outlines, primary and accent wash, typography scale, larger card radius, careful iOS/Android elevations.
- **Universal components:** raised SectionCard, 52px Action with explicit primary/secondary hierarchy, pill FilterChip, tinted StateNotice, gentler progress skeletons, highlighted form focus that still executes caller-provided onFocus/onBlur, compact ScreenHeading with gold marker, elevated BackButton, and decorated EmptyMessage.
- **Navigation:** bolder focus state, elevated tab bar, original five tabs and RTL order retained.
- **Home:** branded jade hero and searchable white surface; comfortable transaction selection, pill filters, visual icon-category tiles, featured and nearby listing sections. No fake featured results.
- **Listings & details:** improved image-to-information ratio, photo/save overlays, consistent pricing prominence, location and confirmation metadata; warm price summary and fixed contact dock on property details. Approved property, consent and call/WhatsApp permissions are untouched.
- **Search:** spacious focusable input, segmented sale/rent/gharawi controls, stronger results header, refined filter sheet and map navigation.
- **Saved:** clearer property comparison selection, enabled alert and shortlist cards.
- **Inbox:** segmented Messages/Viewings/Notifications navigation, subtle conversation identity and unread highlight.
- **Account:** premium signed-in identity header, section dividers, calmer account rows and agency membership cards. Permissions are unchanged.
- **Staff web:** matching responsive colors, typography, shadows and form focus, with proper reduced-motion media query. Admin 2FA and RBAC are unchanged.

## Safety and UX acceptance

1. **Dari, Pashto and English:** verify both RTL and LTR, number formatting, long titles, new button sizes, font scaling and contrast on affordable Android phones.
2. **Guest through staff:** check guest, private advertiser, professional agent, agency member, agency manager/owner and staff. Hidden/disabled actions are still protected by existing API checks; visual changes never grant permissions.
3. **Core flows:** search, filters, map, save/unsave, compare, create/edit listing, price and gallery, inbox/viewings, push preferences and support; verify there are no overlapping sticky actions.
4. **Performance:** scroll dense result feeds, image download over slow connections, switch tabs quickly, long headings and screen-reader focus; validate on physical Android.
5. **Accessibility:** minimum 44px interactive targets, visible focus and contrast on light/dark green backgrounds, platform Remove Animations / Reduce Motion preference; inspect screen readers.
6. **Verification:** `pnpm check`, `pnpm qa:ui`, `pnpm --filter @amlaklink/admin build`, `pnpm --filter @amlaklink/mobile exec expo export --platform android --output-dir dist`. These are build/regression checks, **not** real-device release approval.

No added npm package, migration, payment integration, or data change.
