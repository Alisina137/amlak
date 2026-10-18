# Final Completion — Step 2: RTL/LTR and Mobile UI Refinement

This step builds on the shared three-language copy, mirrored navigation, accessible back buttons and locale-aware number rendering already present in the AmlakLink mobile application.

## Delivered in this step

- Inbox filters now render as horizontally scrolling, accessible tabs rather than compressing three long Dari/Pashto captions into narrow equal-width cells. The direction of the scrollable tab strip mirrors in RTL locales.
- Inquiry status indicators use Dari, Pashto and English messages instead of raw backend status tokens; unread counts respect locale digit formatting.
- Agency performance lead filters use the same accessible compact tab pattern, with right-to-left order where appropriate.
- Agency lead filters no longer wrap unpredictably across several rows on narrow phones; category options stay horizontally scrollable.
- Base shared labels and form inputs explicitly permit operating-system font scaling for accessibility.
- Retained the existing app-level locale picker, locale-first typography and back-button direction. No OS-wide RTL restart is required when switching between Dari/Pashto and English.

## Engineering and device acceptance

The PR must pass `pnpm check`, the separate staff-admin build, and Android export in GitHub Actions. This certifies source/build compatibility, **not** physical layout quality.

On an Android phone, inspect all five bottom tabs and agency reporting, plus listing create/edit, search, map, message composer, viewing scheduling, account and subscription screens. Repeat using Dari, Pashto, English, Android font scaling 100–200%, and 320–360dp widths. Confirm focus order and TalkBack labels. These manual steps are not claimed complete here.

## Remaining Step 2 verification

A comprehensive screenshot-by-screenshot review of every page in all three locales still needs physical Android access. Fix any clipping, poor font fallback, overlapping keyboard, misleading iconography, and mixed-script layout found there. Future Step 10 performs full Android end-to-end acceptance.
