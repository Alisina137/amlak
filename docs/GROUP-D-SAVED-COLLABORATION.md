# Group D — Saved & Collaboration (Phases 16–20)

This is a refinement of existing Phase 8 features, not a second payment or identity implementation. The five bottom navigation tabs remain unchanged.

## User-visible changes

- **16 — Saved sections:** Favorites, Saved searches, Shared shortlists are internal selectable sections within the Saved bottom tab; other screens remain accessible for full management.
- **17 — Favorites:** Listing cards and status; select 2–4 publicly comparable items, remove a saved item and offer a request-backed Undo action. Favorites remain server-backed and scoped to the active account.
- **18 — Compare:** A horizontally scrollable 2–4 property matrix with prices by original currency, refundable rent deposit and gharawi principal shown separately, location, rooms, utilities, and differences-only filter. Missing values are explicit. The existing public comparison API still rejects an unavailable item.
- **19 — Saved searches:** Human-readable trilingual summaries, search rename, use-current-filters, remove, in-app alert opt-in/out and 12-search quota. Rename updates only the owned saved-search title, never resets the notification scanning cursor; changing alert consent retains existing endpoint behavior. No remote push subscription is created.
- **20 — Private shortlists:** Member and pending-invite status, owner-only member removal and invitations, verified-email invitations, active/public-eligible property picker, per-item interest/pass votes with notes, private group totals and placeholders for unavailable listings. Permission enforcement remains server-side.

## Security / compatibility

- All saved and shortlist data are private and account-scoped. No new public endpoints, public invites, or personally identifiable member directory.
- The compare API accepts 2–4 publicly eligible UUIDs only. This UI makes no USD/AFN conversion, no transaction claims and no property title guarantees.
- No external push scheduling, payments or migrations are included.
- Backward-compatible PATCH /v1/saved-searches/:id accepts one or both optional `title` and `alertsEnabled`, rejecting an empty patch and refusing cross-account writes.

## Test matrix

1. Switch English/Dari/Pashto, confirm Saved internal tabs, mirrored directions and 44+px controls; bottom navigation remains five tabs.
2. Save, remove, undo, compare 2, 3, 4 properties. Try an unavailable favorite, saved items from a different account, network offline and repeated toggles.
3. Compare same-currency and different-currency properties; sale/rent/gharawi terms, missing bedrooms, absent amenities and landscape/horizontal scrolling.
4. Save a search, rename it without triggering duplicate alerts, opt in/out of in-app alerts, apply filters, delete it and try the 12-entry boundary. Confirm map rectangle and private geometry are not shown in human-readable summaries.
5. Create a shortlist and invite another verified account. Confirm invite acceptance, five-member ceiling, vote counts and comments, revocation/leave, owner-only delete, unavailable property placeholders and denial to revoked or unrelated accounts.
6. Run `pnpm qa:ui`, `pnpm check` and Android export. CI runs PostgreSQL migrations and the workspace pipeline; physical Android/TalkBack, real accounts and live service validation remain separate requirements.

Static/source checks and passing CI do not establish physical-device or launch acceptance.
