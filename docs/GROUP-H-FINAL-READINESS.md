# Group H — Final Owner, Agency, Staff & Release Quality (Phases 36–40)

**Implementation gate is not production approval.** This group delivers code-level changes and CI checks. Physical-device, staffed pilot and external payment/provider validations remain independent manual acceptance gates.

## Phase outcomes
**36 — Listing publication and availability lifecycle**
- Server-backed draft, rejected, pending, published, paused and sold/rented states stay authoritative.
- Confirm irreversible or significant status changes (pause, resume, availability confirmation, sold/rented, withdraw pending revision).
- Preserve previous approved public revision while a new submitted revision is under staff review. Show rejection reasons rather than assuming automatic publication.

**37 — Agency workspace and CRM**
- Role-aware Overview/Team sections and links to Properties, Leads, Reports, Performance and Billing. Display only actions allowed by the server-provided membership/agency state; the server still validates every read/write.
- Member invitation requests require a verified recipient; owner-only manager invitation and guarded team-member revocation.
- Filter and search only agency-owned advertiser-side inquiries; show CRM stages, last real message time, assignment status and direct conversation links.
- No client-generated leads, claimed follow-ups, or unverified transfers.

**38 — Agency analytics, agent performance & billing**
- Use actual backend report totals for property publication, messages and contact taps. Contact taps are not confirmed calls, and CRM won labels are not verified sales.
- First-response and agent comparison use server-produced performance metrics. Surface sampling limitations.
- Browsable service-plan cards show AFN pricing, term, listing/seat limits; invoices show server statuses. Billing buttons remain disabled if backend says billing is OFF. No claim is confirmed without staff reconciliation of an independent payment source, and property payments are never accepted by the app.

**39 — Staff admin and moderation UI**
- Separate Next.js staff app with role-scoped sidebar for Overview, Listings, Agencies, Agents, Safety, Support, Billing and Operations. Existing session/MFA controls and authorization gates remain unchanged.
- Responsive admin overview, typography, focus indicators, search and status filters on review queues, confirmation before approval/rejection, required justification, private support search and status filtering.
- Client navigation is convenience only: every server route must separately verify staff role.

**40 — Final integration and release verification**
- CI source regressions via `pnpm qa:ui` plus existing `pnpm check` (types and tests), Next.js admin build and Expo Android export.
- Existing domain gates can be executed explicitly with `pnpm qa:network`, `pnpm qa:billing`, `pnpm qa:integration-verification`, `pnpm qa:production-readiness`, `pnpm qa:kabul-pilot`, and manual `pnpm qa:release` as appropriate. No human checklist is implied to have passed merely because the script exists.
- No package, migration, payment configuration or role escalation was introduced in this group.

## Required pilot validation (all require human signoff, **not production approval** from automated checks)
1. **Physical Android:** Expo Go and a native development build; verify display scaling, keyboard, accessibility/TalkBack, no trapped horizontal scroll, photo picker, OTP input and slow connectivity on low-memory hardware. Inspect iOS separately if shipping iOS.
2. **Localization:** Dari and Pashto RTL and English LTR, locale changes in nested listings, workspace/member cards, billing status, staff queues; inspect date/number formatting and screen-reader hints.
3. **Role matrix:** guest, unverified, verified private advertiser, independent agent, agency agent, manager, owner; revoked membership, suspended/expired plan; distinct staff moderator, verification, support, billing, admin and super_admin. Every forbidden API and screen must deny access, not just hide a button.
4. **Listing lifecycle:** create sale, rent, gharawi; submit, reject with reason, resubmit and approve; confirm that an approved public revision remains visible during a separate submitted revision; hold/release, pause/resume, availability confirmation, sold/rented; two concurrent edits and network retries must not lose data.
5. **Agency operations:** invite/accept/revoke, seat quota, pending agency, agent-only leads, manager assignment and role-change race, full CRM status and first response; ensure no private cross-account cached data.
6. **Billing:** do not enable invoices while provider payment procedures or consent are unapproved. With a sandbox/approved procedure verify exact AFN amount, independent bank statement, duplicate receipt, rejected claim, subscription/grace expiry and retry keys; do not process property rent or purchase payments.
7. **Staff operations:** fresh 2FA sign-in, role-limited nav plus direct-URL access, moderation photo/revision queue with reasons, safety appeals, private support replies and billing confirmations. Audit trail and backup restore require manual checks.
8. **Infrastructure:** sanitized environment variables, Neon migrations on staging with rollback, encrypted backup and real restore validation, mail and media storage, ngrok/local dev not confused with public deployment, regional connectivity, scheduled alerts/freshness/push worker with configured EAS/FCM and consent.
9. **Release gate:** only after documented security/legal/privacy review, backups verified, operational owners assigned, real multi-account and real-device pilot evidence, service credentials and go/no-go signoff should the release be marked approved.

## Git status handoff
Group H is ready for code checks through a PR. The merge/CI outcome is recorded in GitHub Actions for the specific commit; if green, this confirms automated integration only. Physical Android and manual pilot acceptance remain outstanding. Do not describe the app as launched or production-ready on the basis of CI alone.
