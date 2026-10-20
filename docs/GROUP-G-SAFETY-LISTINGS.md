# Group G — Property Ownership Workflow (Phases 31–35)

Group G improves the existing owner-side Safety Center, My Listings, listing creation, eight-step editor and media management. It does not change the five-tab bottom bar, public listing moderation or the current backend permissions.

## Changes

**31. Safety, reports and appeals**
- Two internal views: My Reports and Decisions on My Properties. Owner property picker (with listing deep-link support) replaces routine copy/paste of UUIDs. Authorization remains enforced by existing owner/agency endpoints.
- Safety hold, case status and staff resolution; eligible appeals only from resolved/rejected/closed cases; clear double-submission guard and wait-for-staff disclaimer.
- Reporting screen preserves idempotent request ID after uncertain network failure; explicit consent, localized RTL inputs, and actionable loading/error states.

**32. My Listings**
- Search by property title or shortened ID; status filters for Draft, In Review, Published, Paused and closed outcomes.
- Server-status badges and updated date; editor, public page (only for published listings), and property safety-case actions. Listings are account-scoped, and stale responses are rejected after account change.

**33. Listing Draft Entry**
- Compact property-type and transaction selections, publisher choice (private/approved agent or agency), verified-account gates, and clear draft-publication warning.
- Creation uses the backend's idempotency key; the same clientRequestId is reused after a failed/uncertain write until intent changes or the server confirms creation, preventing duplicate drafts.

**34. Eight-Step Editor**
- Localized status and version, visible eight-step progress, accessible stage display, skeleton loading and refresh errors.
- Existing scoped offline cache, server-version conflict detection, autosave and staged moderation semantics retained. Future steps are disabled until the user advances via Save & Next.
- Real server remains authoritative for availability transitions, approval and exact-location permissions.

**35. Photo management**
- Reorder photos earlier/later; first photo is the cover. Existing room-tag and caption editing preserved.
- Confirm before removing a photo from the draft; photo removals change draft references (not irreversible deletion of shared or approved storage). Private auth-scoped thumbnail load failure offers retry. Upload capped at existing 20-photo limit; server validates the uploaded image.

## Verification and human acceptance

1. With two different accounts, verify account-scoped My Listings, local drafts, reports and safety cases. Revoke an agency member and confirm server denies access.
2. File a report as a verified user; confirm display and status. As an authorized advertiser, inspect the linked property's case and submit one eligible appeal; duplicate appeals must be rejected. A submitted appeal must not automatically remove a staff safety hold.
3. Create drafts for sale, rent and gharawi with different publisher roles; retry a timed-out POST using the same request ID, confirm only one draft is created.
4. Traverse all eight editor steps in Dari/Pashto/English with offline edits, conflicts, network reconnect, and moderation restrictions. Confirm approved public revision remains unchanged until staff approval.
5. Upload up to 20 images; change cover, reorder, edit captions and room labels, attempt missing/corrupt private thumbnail, cancel/remove, and confirm preview and published gallery order.
6. Run `pnpm check`, `pnpm qa:ui`, Android Expo export; assess font scaling, screen readers, and physical Android behavior in a live multi-account pilot.

No new dependencies, database migrations or external providers. Automated CI does not establish physical device acceptance or a production release gate.
