# AmlakLink — Final Completion Step 4: Authentication & Security

**Status:** Source implementation and automated integration verification, not a production security certification.

## Hardened flows

- User verification / recovery codes are now **serialized by normalized address and purpose** under a database transaction lock. Concurrent email requests cannot quietly replace one another's challenge. Duplicate requests in the cooldown return the generic success response, without disclosing whether the address has an eligible account.
- Invalid OTP attempts are committed atomically; only five attempts per challenge are allowed, even when concurrent requests attempt the same six-digit code. Codes expire in ten minutes and are single use.
- A user can list their own active sessions and see which one is the current device. **Account → Devices and active sessions** provides an explicit confirmation to revoke an individual session or sign out other devices. No access tokens or browser fingerprints are exposed by the sessions API.
- Refreshing a user session rotates the bearer token **atomically**. Simultaneous refresh requests using the same original token allow at most one successful rotation, and the old token becomes invalid. No session creation happens if the transaction fails.
- Recovery applies password updates, revokes all outstanding user sessions and writes an audit event in one transaction. New logins and refresh operations coordinate on a user-level lock so a recovery does not leave a freshly issued old-password session active.
- The mobile secure credential store serializes writes. Sign-out immediately clears the local account even on a weak connection; late sign-outs and stale network responses cannot delete a newer account's session.
- Staff still require a password and one-time TOTP code. Consumed TOTP time steps cannot be reused and deactivated staff are blocked by the API's role checks. The separate staff admin now sends anti-embedding response headers.
- Sensitive account/device state remains unavailable to other users, unauthenticated callers and ordinary user tokens supplied to staff-only routes.

## Security limitations requiring real operations

- An **offline sign-out cannot guarantee immediate remote revocation**. The old token may still be valid on the server until its expiry or until a network revocation succeeds. The local device is cleared immediately. After reconnecting, users should use active sessions to revoke other devices. The service does not queue old bearer tokens persistently on an already-signed-out device.
- Credential secrets, SMTP sender reputation, mail delivery, HTTPS proxy/firewall configuration and TOTP enrollment/rotation must be verified outside CI. Test staff login behind the real public HTTPS origin, not merely local proxy calls.
- Per-address challenge and staff login throttling must be assessed against the actual reverse-proxy environment and distributed threat model; in-process/IP rate limits are not equivalent to a shared cross-instance abuse detector.
- Initial account-registration conflict behavior remains unchanged, including the existing registered-address response; do not interpret the cooldown change as eliminating all possible email-address enumeration.
- Session list includes dates and device-current status, but **does not claim precise browser/device identification or geolocation**. It intentionally avoids collecting those signals before privacy review.
- Mobile bearer tokens are stored using Expo SecureStore, not AsyncStorage; the app never embeds user credentials in public URLs, local logs or saved searches.

## Verification commands

```powershell
git pull origin main
pnpm check
pnpm qa:phase8
pnpm dev:api
pnpm dev:mobile
```

The PostgreSQL integration suite covers concurrent OTP redemption, resend cooldown, incorrect-code attempt commits, session rotation, single-session and other-device revocation, reset invalidation and suspended user rejection. Android export and the separate Next.js staff build must also pass GitHub Actions.

**No database migration.** On real Android phones, test sign-in, verify, recovery, logout offline, changing accounts while a request is pending, revoking the current/another session, and reopening after airplane mode. Conduct a real SMTP-delivery and staff TOTP acceptance round in a secure pilot environment.

**Step 4 complete only for merged engineering code.** Production pen testing and provider acceptance are in the final steps of the plan.
