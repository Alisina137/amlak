# Group F — Account, Authentication, Sessions, Professional Applications & Support (Phases 26–30)

The originally discussed extended roadmap also named a Phase 31 for Safety/Reporting/Appeals. This delivery explicitly covers **phases 26–30**, while linking to the existing Safety feature rather than claiming Phase 31.

## Features

- **26 — Account redesign**: compact profile and edit-name form, email verification badge; My Properties; Professional Services; Agency Workspace; Help & Safety; Settings/Security. All actions remain connected to existing authorized endpoints. Guest can browse but must sign in for private account functions. Agency invite/workspace controls are visible according to membership status and active agency state. Private seller activation requires verified email plus explicit rule consent.
- **27 — Authentication:** accessible sign-in, registration, email verification, password recovery and reset; robust form validation matching server password constraints, show/hide-password control, resend cooldown, double-submit lock, meaningful offline feedback and existing return-to-property intent. No bypass of email verification.
- **28 — Active sessions:** current/other session distinctions and localized Kabul time display, dedicated loading/empty/error states, confirmation before revocation, revoke-others keeps current session and current-session revocation signs out the mobile account. Session display does not invent device name, IP or precise location.
- **29 — Professional applications:** user-verified email check, status-aware independent-agent application and explicit professional rule consent; agency name/province validation and staff-review expectations. Neither application claims automatic verification or verified legal property ownership.
- **30 — Help & Support:** private categorized ticket creation, up to five open tickets, active/history filters and status display, retry-safe request IDs for ticket/replies, separated user/staff messages with Kabul timestamps, account-scoped fetches, report-a-safety-issue link and no-password/code warning. Support requests do not replace formal fraud reports or authorize payments.

## Safety guarantees

- No backend permission expansion, impersonation, or account/session sharing. Existing server RBAC, verified-email requirements and support ticket ownership are retained.
- Request IDs remain unchanged on transient write failures to prevent a second ticket/reply from an uncertain first POST; they rotate after a confirmed success.
- In-flight responses are account-scoped, and new sessions never render old account's tickets, agency memberships or device history.
- No raw session tokens, recovery codes or passwords shown in account details. Recovery email is never claimed to be delivered unless response successfully returned.
- No new database migrations or paid external services.

## Acceptance & verification

1. Switch Dari/Pashto/English, guest and verified accounts. Validate RTL/LTR direction, account navigation, accessible touch targets and enlarged text on physical Android.
2. Edit the display name, sign out, sign in and verify the name persists. Confirm guest cannot activate advertising/agent/agency privileges.
3. Register, resend verification code, verify, recover/reset password with valid and invalid inputs. Test offline, timeout, rate limits, double taps and the return-to-property action.
4. Open sessions in two separate devices; revoke one, then revoke others, finally revoke current. Confirm no session crosses accounts and revoked tokens fail authorization server-side.
5. Submit personal seller activation, independent agent, and agency application. Confirm pending/staff-review flow and that unauthorized/cross-account actions fail.
6. Create five support tickets, verify the limit, view and reply, staff response and closure. Test uncertain network responses: retry with the same request key, no duplicate ticket/reply. Switch accounts on the same phone.
7. Run `pnpm check`, `pnpm qa:ui`, and `pnpm --filter @amlaklink/mobile exec expo export --platform android --output-dir dist`. Real two-account and physical Android testing is still required; static CI does **not** approve production release.
