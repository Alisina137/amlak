# Final Completion — Step 2: RTL/LTR and Mobile UI Consistency

This change is a **code-level localization and layout pass**, not a claim that a phone screen has been visually certified.

## Implemented

- All bottom-tab labels and navigation order follow the in-app locale: English LTR (Explore → Search → Saved → Inbox → Account) or Dari/Pashto RTL (Account → Inbox → Saved → Search → Explore on the screen from left to right, placing Explore at the right).
- Shared `DirectionalRow`, `AppInput`, and `BackButton` helpers use the selected **app** locale independently of Android/iOS OS language. Logical back arrow direction and the screen reader button name are localized.
- Standard text fields mirror their text alignment and writing direction. Stable Latin identifiers (email, phone, WhatsApp) and number input are **LTR** for reliable editing, even when the rest of the form is RTL.
- Filled gaps in Dari/Pashto/English for navigation, home listing feed and empty/error states, agency membership and metrics, CRM status, property creation/editor availability and photo actions, inquiry messaging, map links and saved-property sign-in.
- Mirrored the seller-terms row, agency role picker, filter selection, property action position, CRM status picker, lead filters and message-bubble alignment.
- Numbers in property cards and agent performance summaries use the selected locale; business amounts and IDs remain human-verifiable.
- Shared actions have accessibility labels, input minimum heights support touch interactions, and back buttons have a localized accessible name.
- `pnpm qa:ui` runs **static** translation parity and direction assertions in CI.

## Screens covered in this pass

| Area | Source |
| --- | --- |
| Global navigation and basic building blocks | `apps/mobile/app/(tabs)/_layout.tsx`, `src/ui.tsx` |
| Explore/search/filter sheet, province picker and maps | `(tabs)/index.tsx`, `(tabs)/search.tsx`, `locations.tsx`, `search-map.tsx` |
| Property feed, creation and editing | `src/listing-ui.tsx`, `listings/new.tsx`, `listings/[id]/edit.tsx` |
| Account, favorites, agency workspace | `(tabs)/account.tsx`, `(tabs)/saved.tsx`, `agency/[id].tsx` |
| Agency leads and agent performance | `agency/[id]/leads.tsx`, `agency/[id]/performance.tsx` |
| Messaging and CRM | `inquiries/[id].tsx` |

## Manual acceptance matrix: still required

Run `pnpm dev:mobile` from a Windows PC with the API active on port 4000. Use **real Android devices** with widths approximately 320, 360 and 412 dp. Test the same use case three times (Dari, Pashto, English).

1. Start in Dari. Verify the home tab is **rightmost**, text and menu sequences read right-to-left and back arrows point right. Switch to English and verify the home tab moves left and back arrows point left; switch to Pashto and confirm all headings, empty states and button labels show Pashto instead of Dari.
2. Search: long province names, 2-column numeric fields, modal overlay/close button, money/area numerals, empty/error/featured lists, map buttons. Verify the numeric keyboard is LTR while free-text filters follow the active language.
3. Listing creation and edit: RTL text/description/caption, LTR price and phone fields, all 8 wizard steps, 20 photos, photo room labels and gallery previews. Check disabled/rejected review states and confirm no upload was repeated due to navigation.
4. Account/agency: language picker, membership roles, seller-terms switch, inviting an English-format email from a Dari page, role selection and team statistics.
5. Inquiries: long messages with mixed Latin text and Afghan numbers, outgoing/incoming bubble placement, CRM status labels, closed chat, viewing links and keyboard overlap.
6. Accessibility: Android TalkBack and large system font (1.3×–1.5×), focus order, 44–48 dp interactive targets, clipping, visible indicators and no off-screen buttons. Switch between language settings at runtime and verify the route/state is not lost.
7. Test screen switching, slow network and resumed app. These also belong to Final Step 3 and Step 10.

**Important limitations:** A code-only check cannot establish visual correctness, native keyboard behavior on a physical handset, Pashto translation quality, TalkBack usability or map SDK licensing. Existing specialized screens beyond the ones listed (staff web, payment review, push settings, shortlist creation) still need comprehensive Step 10 human visual verification. Do not approve release based only on the export or these static tests.

No database migration is introduced. Run `pnpm qa:ui`, `pnpm check` and Android export in CI before merging.
