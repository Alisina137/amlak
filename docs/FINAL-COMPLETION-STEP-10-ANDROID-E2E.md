# AmlakLink — Final Completion Step 10: Android End-to-End Readiness

## Scope

This step adds a repeatable automated readiness suite and a mandatory physical-Android acceptance protocol for complete user journeys. Automated source-contract tests detect regressions in route registration, session storage, read-only network retry policy, offline draft isolation, localization/accessibility wiring, and Android app configuration. These checks are **not a substitute for driving the app on a physical phone**.

## Automated checks (Windows PowerShell)

From `C:\projects\amlak`:

```powershell
git pull origin main
pnpm install
pnpm db:diagnose
pnpm db:migrate
pnpm qa:android-e2e
pnpm qa:ui
pnpm qa:network
pnpm qa:billing
pnpm check
pnpm --filter @amlaklink/mobile exec expo export --platform android
```

Start the API on **port 4000** with `pnpm dev:api`, the mobile app with `pnpm dev:mobile`, and the admin portal separately with `pnpm dev:admin`. The ngrok inspector uses port 4040; it is not the API port. For a physical phone, configure `EXPO_PUBLIC_API_URL` to the HTTPS tunnel forwarding to port 4000. Never point the mobile app at the inspector URL.

For the public API smoke check, run `pnpm pilot:smoke`. It only makes public GET requests. The smoke check does not sign in or mutate data.

## Physical Android acceptance matrix

Record device model, Android version, screen width, app commit, API target, language, result, and a sanitized issue reference. Use test accounts and synthetic properties only; do not record passwords, verification codes, private documents, or real customer information.

| Journey | Required checks | Languages / conditions |
|---|---|---|
| First launch and navigation | Cold launch, home route, five tabs, back navigation, app background/resume, no crash | Dari, Pashto, English; ~320, 360 and 412 dp widths |
| Identity and account isolation | Register/login, email verification and recovery, sign out, switch account, protected screen after sign-out | All three languages; airplane mode and reconnect |
| Search and discovery | Sale/rent/gharawi, province/district, filters, sorting, pagination, empty/error results, map rectangle and polygon | Online, slow network, offline cache, stale response |
| Property details and media | Open detail, image gallery, permissions, upload/retry, create/edit draft, review state, duplicate tap/navigation | Camera and photo picker; revoke and restore permission |
| Saved properties and engagement | Save/unsave, inquiry thread, send once on uncertain network, viewing request/status, notifications and deep links | Two synthetic accounts; no cross-account private data |
| Advertiser and agency | Application status, listing management, membership role restrictions, invitation, assigned leads and performance | Owner, manager and agent test roles |
| Push settings | Consent categories, disabled default, privacy-neutral lock-screen content, tap destination scoped to signed-in account | Physical development build with configured EAS/FCM; not Expo Go |
| Billing controls | Billing disabled blocks new invoice/claim/confirmation; historical records remain read-only or allowed adjustment flows | Billing remains disabled unless separately approved; no real payment |
| Accessibility and layout | TalkBack focus/order, accessible labels, 1.3×–1.5× font, touch targets, keyboard overlap, RTL mirroring, no clipped/off-screen actions | Dari, Pashto and English |
| Recovery and security | Force-stop/reopen, expired session, API outage, reconnect, account switch, stale request response | Low-end device and intermittent connectivity |

### Evidence and exit criteria

- [ ] Automated commands above pass on the same commit.
- [ ] At least one physical Android device completes every applicable journey; a second screen size is strongly recommended.
- [ ] All three locales are visually reviewed; Dari/Pashto RTL and numeric/email LTR fields are correct.
- [ ] No cross-account exposure, duplicate write, privilege bypass, crash, or lost draft remains open.
- [ ] Every failure has a reproducible issue and owner; blockers are fixed and the affected journey is retested.
- [ ] Push delivery is accepted only after a real configured development build and device receipt check.
- [ ] Screenshots/evidence are stored privately and sanitized; no secrets or personal data are committed.
- [ ] The operator records a signed acceptance result for the next Kabul pilot step.

## Boundaries

The automated test `pnpm qa:android-e2e` validates source contracts and configuration, not live gestures, real authentication, physical keyboard behavior, actual push delivery, or visual correctness. This repository change cannot certify a phone that was not connected to the test session. **Human device acceptance remains pending until the matrix is executed and recorded.** Do not declare production-ready from a successful TypeScript check or Expo export alone.
