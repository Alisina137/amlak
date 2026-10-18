# AmlakLink — Final Completion Step 7: Real Push Notification Readiness

## Code delivered

1. **Self-service delivery test.** A verified user who opted in and has at least one active device can open **Account → Push Notifications → Send a test notification**. `POST /v1/push/test` inserts a new **private in-app** test alert (rate-limited to four requests per 15 minutes). It returns `queued:true` and a notification ID, **not** a promise of delivery. The existing worker then processes it and tracks Expo tickets/receipts.
2. **Privacy-safe lock screens.** Remote notifications now show only a generic AmlakLink message. They no longer include inquiry, address, safety, support, price, financial or other personal text in the notification body. Sensitive details remain behind the authenticated in-app Inbox. This reduces risk from previously registered phones after offline logout.
3. **No cross-account tap routing.** Push metadata includes the owning account ID and the app checks it against the currently signed-in user before following a notification. Late pushes from an old account cannot open that account's sensitive route while another user is signed in. Legacy pushes lacking this ownership field are ignored, not guessed.
4. **Improved provider handling.** The worker identifies retryable Expo errors (such as internal service failures and rate limits), treats invalid devices as terminal, and reports ticket/receipt attempts and disabled-token metrics. Tickets represent acceptance by Expo; receipt `ok` indicates upstream FCM/APNs provider acceptance, **not guaranteed phone delivery**.
5. **Android channel.** The existing `amlaklink-alerts` notification channel is created before the app registers a device; outgoing push payloads now specify it. Permissions remain user-initiated. `expo-notifications`, `expo-dev-client`, and `apps/mobile/eas.json` retain the existing Android development-build configuration.
6. **Account-scoped settings.** Delayed push preferences calls cannot display a previous account's status. A registration conflict is explained rather than taking over someone else's Expo token. The screen shows active registration counts and warns that a running worker and a real development build are required.
7. **Deployment preflight.** Run `pnpm ops:push:preflight` to validate the server flag and EAS UUID, and optionally verify a mobile UUID from the operator's environment. It prints **no credentials**. It lists required external EAS/FCM/device checks, and explicitly states that it cannot verify external credentials or handset receipt.
8. **Coverage.** API integration tests cover opt-in, foreign-token rejection, queueing a test notice, mocked Expo delivery and receipt acceptance, dry-run no-write behavior, stale token revocation, and provider error classification. Preflight tests cover fail-closed environment and UUID mismatch cases.

## Why a GitHub merge does not activate real push

Push remains **disabled by default**. Live push depends on services outside this repository:
- A real EAS project, approved Expo account and **FCM V1** credentials configured in EAS/Expo (or equivalent verified native integration).
- A physical Android device with an APK produced by a matching signed EAS development build; Android Expo Go **cannot** receive these remote pushes.
- OS notification permission, the matching application package `af.amlaklink.app`, an HTTPS API origin and a successfully registered, consented device.
- An actual running worker/scheduler. The API does **not** automatically send provider notifications.
- External provider terms/costs, key custody, pilot acceptance and release approval.

## Operator checklist (Windows PowerShell)

Run the usual code/test workflow:
```powershell
git pull origin main
pnpm install
pnpm check
pnpm db:migrate
```

Create a real EAS project and development APK **only on an authorized Expo account**:
```powershell
cd C:\projects\amlak\apps\mobile
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile development
```

Configure actual EAS/FCM V1 push credentials through EAS's credential management, install the resulting APK on a physical Android device, and configure `EXPO_PUBLIC_EAS_PROJECT_ID` for the mobile build. Do not use a fabricated UUID.

Put these **server-side only** into the private root `.env` after the provider is operational:
```ini
AMLAK_PUSH_ENABLED=true
AMLAK_EXPO_PROJECT_ID=<actual-EAS-project-UUID>
# Set this only if Expo's enhanced push security is activated:
EXPO_PUSH_ACCESS_TOKEN=<private-access-token>
```

The public **client-side** build uses:
```ini
EXPO_PUBLIC_EAS_PROJECT_ID=<same-EAS-project-UUID>
EXPO_PUBLIC_API_URL=<actual-HTTPS-API-tunnel-or-host>
```

**Never put private FCM, Expo access, or service-account keys in any `EXPO_PUBLIC_*` variable**, application JSON or GitHub.

From separate terminal processes in `C:\projects\amlak`:
```powershell
pnpm dev:api                  # API server target is port 4000
pnpm dev:mobile:push          # installed native development APK, not Expo Go
pnpm ops:push:preflight
pnpm ops:push --dry-run      # no outbound request and no DB writes
```

On the Android app: sign in to a verified account → **Account → Push Notifications** → Enable → grant OS permission → confirm a device was registered → **Send a test notification**. Then run:
```powershell
pnpm ops:push --execute
```

The worker will submit the notification to Expo. Run `pnpm ops:push --execute` again **at least 15 minutes later** to check Expo receipts. This is a *manual* smoke test. For production-like continuous operation provision an authorized, separately monitored scheduler; do not rely on manually starting a terminal or on the mobile app being open.

## Manual acceptance still required

1. New install: default OFF, no permission prompt until enabling, no notification before consent.
2. Native build: Android 13+ permission allow/deny, OS settings revocation, offline/online registration, foreground/background/killed app taps.
3. Confirm in-app test alert exists even when Expo is disabled; remote delivery is treated as best effort.
4. Verify other-account devices cannot receive new private alert content and the old-account tap is ignored after switching users.
5. Check token rotation, receipt failures including `DeviceNotRegistered`, multiple devices, rate limiting, default categories and opt-out.
6. Check Dari/Pashto RTL and English accessibility; test notifications while app is closed, slow mobile data and battery restrictions.
7. Confirm EAS project/package, credentials, Expo push security settings, key custody, provider licensing and scheduler logs.

**No SQL migration added by Step 7.** The earlier Phase 8 push migration `0009_push.sql` must already be applied.

**Completion claim:** Code and automated tests can be merged, but actual delivery on the user's physical Android phone and EAS/FCM provisioning are **not verified here**.
