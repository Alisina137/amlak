# Group E — Inbox, Messaging & Appointments (Phases 21–25)

Scope: improves the established **Messages | Viewings | Notifications** internal tabs inside the Inbox bottom navigation; does not alter five main tabs.

- **21 — Inbox dashboard:** scoped conversation previews, search, Sent/Received/Active/Closed filtering, real unread badges derived only from unread server notifications, accurate server-provided inquiry status, visit filtering and quiet refresh. No fabricated conversation previews or unread counts.
- **22 — Messaging:** separated buyer/advertiser bubbles, Kabul timestamps, human-readable original sale/rent/gharawi price snapshots, price-change notice, stable idempotent message request key and synchronous submit lock; advertiser-only CRM lead controls are in a separate section. Authorized thread viewing clears only that account's message/inquiry notices for that conversation.
- **23 — Appointment request:** 2–3 distinct future Kabul time slots, localized day/time display, repeat-submit lock, stale slot validation, and visible conflict feedback. Server remains authoritative for conflicts and ownership.
- **24 — Viewing detail:** current status and stage reference, distinct confirmed booking time (not guessed from proposed slots), counteroffers, accept/decline/confirm/cancel/completed/no-show actions only in the correct existing server states, destructive cancellation confirmation, server-version conflict retry and links to listing/conversation. Viewing alerts now carry the **viewing UUID** rather than a conversation UUID; authorized viewing screen clears its own viewing notifications.
- **25 — Notifications:** Read/Unread filters, recent/older grouping, reference-aware deep links, server-side read updates, mark-all-read, permission/worker disclaimers and link to optional push preferences. In-app notices work without Expo development builds; remote push requires actual EAS/FCM configuration and explicit permission and is never automatically enabled here.

## Safety and compatibility
- No schema migration, provider secrets, payment behavior, or new dependency.
- Backend read actions use the existing authenticated actor + inquiry/viewing access checks. They modify only that user's notices for that conversation/viewing; access is denied cross-account.
- No fabricated "read" state from local timestamps; the server notification is authoritative. Cached and missed notification feed entries cannot be treated as proof of global unread=0.
- Confirmation is only a server-approved appointment; a selected slot is not a booking. No external call/message completion assumed.
- Push eligibility and actual push delivery must be verified on a physical development build with a real configured worker; Expo Go doesn't deliver remote push.

## Engineering & real-device acceptance
1. In English, Dari, Pashto: ensure mirrored navigation, accessible touch targets, large-text alignment, and no accidental extra bottom tabs.
2. Two separate signed-in accounts: send inquiry/reply; verify server unread badge increases, opening matching conversation clears only relevant notifications, correct status and message order.
3. Send with poor network: no accidental duplicates; deliberate retry uses same request ID until a confirmed response. Verify no cross-account cached messages on logout/login.
4. Create viewings at two/three distinct future Kabul times; ensure invalid and stale slots rejected and server conflict errors explained.
5. Confirm/counter/accept/cancel/no-show/completed from correct roles and times; test simultaneous advertiser decisions, version conflicts, paused listing, rejected/closed conversation.
6. Notifications grouped and filtered; ensure viewing deep links go to viewing UUIDs, old records without valid ref fall back safely. Test read-all, sign-out switch and refresh failures.
7. `pnpm check`, `pnpm qa:ui`, `pnpm --filter @amlaklink/mobile exec expo export --platform android --output-dir dist`; plus real Android device and service/push manual acceptance.
