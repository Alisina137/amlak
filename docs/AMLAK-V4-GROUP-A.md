# Amlak App v4 — Group A (Phases 1–4) implementation notes

Source branch: amlak-v4-group-a-ui-navigation. Scope: mobile-foundation improvements, not the remaining Group B–H page-specific feature work.

## Phase 1 — UI system

The shared mobile UI now includes consistently sized buttons, page headers, RTL text, language-aware chips, status badges, section headers, loading skeletons and reusable retry notices. These components share established brand colors, minimum touch targets and localized typography. Existing screens can migrate incrementally without breaking their business logic.

## Phase 2 — Navigation

Five core tabs remain Home, Search, Saved, Inbox and Account. Tab order mirrors for RTL languages, focused tabs use a clear active background, account sessions have an explicit stack route, and stack entry animation responds to the selected language. Common nested pages use a shared RTL-aware back button. Filters and tab state are preserved by existing providers rather than being cleared during navigation.

## Phase 3 — Language and direction

The common connection, retry, loading and cached-result messages are available in Dari, Pashto and English. The shared date helper formats according to locale and safely handles invalid input. Text, control arrangement and stack animations follow the in-app language. Email, phone, numeric and identifier fields must continue to use explicit LTR inputs when applicable. A static contract verifies the common translation keys.

## Phase 4 — Loading, offline and stale-response safety

A single foreground-aware API health provider supplies a small nonblocking connection banner on every page. The Home page no longer duplicates the offline indicator. Search, Saved, Inbox, My Listings, property details and Home listing feeds use shared skeleton/error state components. Offline cached discovery is explicitly marked as stale and never treated as live availability. Saved and My Listings snapshots are scoped to their auth token; late responses cannot overwrite another account's screen.

## Verification

Run pnpm qa:ui to execute the existing RTL source contracts plus Group A foundation tests. CI additionally runs TypeScript and integration checks and performs an Expo Android export. These automated checks do not replace physical Android testing of RTL/LTR layouts, TalkBack, real networking, and business flows.

## QA checklist for a real Android device

1. Switch English ↔ Dari ↔ Pashto on Search, Saved, Inbox and Account. Verify mirror order, header direction and readable labels.
2. Navigate Search → Property → Back and Saved → Compare → Back; verify the selected tab and search filters remain unchanged.
3. Turn off network then open Home, Search, Saved and My Listings. Confirm a connection banner and retry are available; any previously cached results are labeled stale.
4. Sign out, then sign in to another account. Check Saved, My Listings and Inbox never display the first account's data.
5. Inspect skeleton layout during slow requests and test empty, error and retry states.
6. Verify published listings still open, favorite buttons work, and existing inquiries and bookings are unaffected.

The milestone is a foundation refactor only: no payment, listing, reporting or security permissions are changed, and no production release is authorized by this document.
