# Phase 8 / Step 1 — Opt-in remote push for development builds

## What is implemented
- In-app notifications remain the source of truth and work without Google services, a development build, or external push.
- Verified signed-in users may explicitly opt in under **Account → Push notification settings**. There are separate categories for saved searches/price drops, inquiries/leads, viewings, and account/safety/support. The OS permission prompt is shown **only after pressing Enable**.
- Android and iOS device installations register Expo push tokens with scoped API bearer authentication. Device registration supports token refresh, logout unregister, verified-user gating, five-active-installation limit and a project UUID match. Another user's token cannot be silently claimed.
- All remote notifications come from an **existing** user-specific in-app notification, sent only after the recipient's explicit enable timestamp, and only to registered devices that existed before the notification. No arbitrary outbound push endpoint or guest/agency token access.
- A bounded worker with a database-backed per-device delivery state, atomic leased claims, Expo push ticket capture, receipt verification after 15 minutes, invalid device token deactivation, and retry/backoff for failed HTTP requests.
- Localized notification category controls for Dari/Pashto/English and safe navigation for search matches, inquiries/viewings, safety, freshness and support.
- Expo SDK **57** notification plugin and dependencies (not Expo Go on Android).

## Activation gate
**Off by default**, including in Expo Go. A Git merge **does not enable remote push**.

Set in server root `.env` **after** configuring EAS project and Google FCM V1 credentials:

```ini
AMLAK_PUSH_ENABLED=true
AMLAK_EXPO_PROJECT_ID=<EAS-project-UUID>
# Optional only when Expo enhanced push security is enabled
EXPO_PUSH_ACCESS_TOKEN=
```

Set in mobile `apps/mobile/.env` / Expo environment:

```ini
EXPO_PUBLIC_EAS_PROJECT_ID=<same-EAS-project-UUID>
EXPO_PUBLIC_API_URL=<public-HTTPS-forward-to-localhost-4000>
```

**Never invent a project UUID**. Run `eas init` for a real EAS project, provision FCM V1 server credentials on Expo/EAS, and create a physical-device Android development build using EAS Build or a local native build. Rebuild after changing config plugins/credentials.

For the Android development build: `cd apps/mobile; npx eas-cli@latest login; npx eas-cli@latest init; npx eas-cli@latest build -p android --profile development`. After installing the APK on your device, run `pnpm dev:mobile:push` from the repo root. The existing `pnpm dev:mobile` still starts Expo Go and cannot test remote notifications on Android.

Run `pnpm install`, `pnpm db:diagnose`, `pnpm db:migrate`. Start the API on **port 4000** with `pnpm dev:api` and use a publicly reachable API URL in the mobile Expo config. The ngrok web inspector at 4040 is unrelated.

## Background delivery operations
When enabled on the server and a user explicitly opts in:

```powershell
pnpm ops:alerts --execute   # produces in-app saved-search notifications
pnpm ops:push --dry-run     # reports eligible candidates; does NOT send or write
pnpm ops:push --execute     # send queued notifications and inspect prior receipts
```

The API **does not itself schedule** either job. Set up separate external schedulers (for example every 10–15 minutes for alerts and push) after measuring traffic. Push only looks at recent unread notifications (last three days). Receipt inspection is available on subsequent jobs, starting 15 minutes after send.

Expo accepts push tickets first; receipt `ok` confirms provider acceptance by FCM/APNs, **not delivery/read on the device**. Temporary HTTP errors are retried with bounded attempts, and `DeviceNotRegistered` disables the obsolete registration. A crash after Expo accepted a message but before the ticket is saved may cause a duplicate retry: at-least-once semantics, never claim exactly-once handset delivery. Push must never replace in-app notifications or emergency contact methods.

## Acceptance checklist / cannot verify remotely
- Configure actual EAS and FCM V1, install dev build on real Android, grant/deny OS permission, check token rotation and logout.
- Confirm no push before consent; successful, failed and revoked token paths, group categories and opt-out on device and server.
- Confirm tapping push opens relevant authenticated screen, even on cold start, and wrong user cannot see protected content.
- Confirm Dari/Pashto RTL and English LTR with TalkBack accessibility; test limited connectivity, OS permission revocation and no network.
- Review device token retention/encryption policy and Expo push operational credentials before any live launch.
- Verify on staging database and real devices; no EAS credentials or local phone were accessed by this implementation.
