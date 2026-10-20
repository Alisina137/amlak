# AmlakLink — Premium Bottom Navigation

The five mobile destinations remain Home / Search / Saved / Inbox / Account, but their navigation surface is now a custom floating dock with consistent **native-drawn** icons instead of platform-dependent Unicode home/search/mail/menu glyphs.

## Appearance and interaction

- Rounded raised white dock with a thin jade-tinged border, generous margins and light native elevation.
- Active tab displays a solid deep-jade icon plate, bright contrasting icon and title, and a small sand-gold underline.
- Inactive tabs keep matching single-weight stroked icons, muted green labels and transparent backgrounds. All five destinations remain visible without scrolling.
- Press produces a soft background highlight; focused icons receive a slight native-driver spring scale and lift.
- Tab labels remain translated using the existing English/Dari/Pashto translations. They scale down only when a *very long* localized word would otherwise clip.
- RTL visually reverses the exact same navigation destinations once; no duplicate reversal and no changes to routes or server logic.

## Practical details

- Bottom padding uses the device's **real safe-area inset**; no overlap with Android system navigation/gesture affordances.
- Software keyboard temporarily hides the dock to leave room for search and form inputs.
- Native navigation events (`tabPress`, `tabLongPress`) and event cancellation (`defaultPrevented`) preserve default tab behavior; deep links continue to use existing routes.
- All five tab buttons have a minimum 68px tall tappable area and accessible selected state/labels.
- Motion honors the already-installed `MotionProvider` and Android/iOS Reduce Motion settings. All native springs are stopped on unmount.
- No icons CDN, vector icon npm library, network request, migrations or permission changes.

## Verification

CI: `pnpm check`, `pnpm qa:ui`, Expo Android export. Static regression coverage: `scripts/test-premium-navigation.mjs`.

**Device acceptance remains required:** check 320–420dp Android phones, 3-button vs gesture navigation, large font size and screen reader, software keyboard showing/hiding during search and inbox, cold app launch, English LTR and Dari/Pashto RTL, rapid tab switching and OS Reduce Motion. CI cannot verify on-device visual quality, keyboard timing or TalkBack traversal.
